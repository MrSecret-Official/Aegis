/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

//! Aegis · Escudos: el motor del bloqueador. adblock-rust (de Brave, MPL-2.0), el mismo crate y las mismas features
//! con que Firefox compila su ContentClassifierService, detrás de un servicio XPCOM fino
//! (`@aegis/escudos/motor;1`, nsIAegisEscudosMotor.idl). Lo usa escudos/motor.sys.mjs, que da la API al resto de
//! Escudos.
//!
//! - Hilo principal del proceso padre: decidir cada petición (`red`) y dar el cosmético de cada documento
//!   (`cosmetico`, `genericos`). Llamadas síncronas de unos µs.
//! - Hilo de fondo (moz_task::spawn_blocking): compilar las listas a un .dat y deserializar el .dat. El hilo
//!   principal solo cambia el motor en uso cuando el nuevo está listo.
//! - Sin temporizadores ni trabajo en reposo: todo lo pide quien llama.
//!
//! Capas: un motor por grupo de listas, para poder apagar cada grupo de molestias por sitio sin recompilar:
//!   0 anuncios y rastreo (y toda regla de red, de cualquier lista: la red se decide solo aquí)
//!   1 avisos de cookies · 2 ventanas y banners · 3 avisos anti-bloqueador (solo su parte cosmética y scriptlets)
//! El .dat es un contenedor con el `Engine::serialize()` de cada capa. Los recursos (recursos.json) se cargan con él
//! y los comparten todas las capas.

use std::cell::RefCell;
use std::collections::{BTreeSet, HashMap, HashSet};
use std::ffi::c_void;
use std::rc::Rc;
use std::sync::{Mutex, Once};
use std::time::Instant;

use adblock::lists::{FilterSet, ParseOptions};
use adblock::request::Request;
use adblock::resources::{
    InMemoryResourceStorage, PermissionMask, Resource, ResourceImpl, ResourceStorageBackend,
};
use adblock::Engine;
use nserror::{nsresult, NS_ERROR_FAILURE, NS_ERROR_INVALID_ARG, NS_OK};
use nsstring::{nsACString, nsAString, nsCString};
use thin_vec::ThinVec;
use xpcom::interfaces::{nsIAegisEscudosHecho, nsIEffectiveTLDService};
use xpcom::{nsIID, xpcom, xpcom_method, RefPtr};

/// Capas (grupos de listas): ver arriba.
const CAPAS: usize = 4;
/// Cabecera del contenedor del .dat: «AEGC», versión, número de capas y, por capa, largo (u32 LE) y datos.
const MAGIA: &[u8; 4] = b"AEGC";
const VERSION_CONTENEDOR: u8 = 1;
/// Selector centinela que motor-worker.js añade para las excepciones `$elemhide` de un sitio entero (adblock-rust no
/// entiende la opción): si sale entre los selectores del sitio, no se oculta nada en él.
const CENTINELA_ELEMHIDE: &str = "aegis-elemhide";
/// Dirección sin reglas propias: lo que el motor da para ella es el cosmético genérico de cada capa (igual para todas
/// las webs sin `generichide`), que el padre publica una vez como hoja compartida.
const URL_GENERICA: &str = "https://aegis-generico.invalid/";
/// Hosts cuyo dominio se recuerda; al llenarse, se vacía entera (rara vez se llena).
const MAX_DOMINIOS: usize = 4096;

// ── Dominios ─────────────────────────────────────────────────────────────────────────────────────────────────────

/// El servicio de sufijos públicos de Gecko (el mismo que usa su content_classifier_engine). Se pide en el hilo
/// principal al crear el servicio; GetBaseDomainFromHost vale en cualquier hilo.
static ETLD: Mutex<Option<RefPtr<nsIEffectiveTLDService>>> = Mutex::new(None);
/// Inicio del dominio registrable de cada host ya visto (0 si no tiene): no cruza a XPCOM en cada petición (fuera
/// del hilo principal el servicio no tiene caché).
static DOMINIOS: Mutex<Option<HashMap<String, usize>>> = Mutex::new(None);
static RESOLVEDOR: Once = Once::new();

/// El resolvedor de dominios de adblock-rust es global (un OnceCell del crate): el primero que lo pone gana. Si lo
/// pone antes el ContentClassifierService de Firefox (apagado de serie), usa la misma lista de sufijos.
struct Resolvedor;

impl adblock::url_parser::ResolvesDomain for Resolvedor {
    fn get_host_domain(&self, host: &str) -> (usize, usize) {
        if host.is_empty() {
            return (0, 0);
        }
        let guardado = DOMINIOS
            .lock()
            .ok()
            .and_then(|d| d.as_ref().and_then(|d| d.get(host).copied()));
        let inicio = match guardado {
            Some(i) => i,
            None => {
                let i = inicio_dominio(host);
                if let Ok(mut d) = DOMINIOS.lock() {
                    let d = d.get_or_insert_with(HashMap::new);
                    if d.len() >= MAX_DOMINIOS {
                        d.clear();
                    }
                    d.insert(host.to_owned(), i);
                }
                i
            }
        };
        (inicio, host.len())
    }
}

/// Dónde empieza el eTLD+1 dentro del host; 0 si no tiene (IP, una sola etiqueta, un sufijo público) o si no casa.
fn inicio_dominio(host: &str) -> usize {
    let Some(servicio) = ETLD.lock().ok().and_then(|s| s.clone()) else {
        return 0;
    };
    let mut base = nsCString::new();
    // SAFETY: llamada XPCOM con cadenas válidas durante la llamada.
    let rv = unsafe { servicio.GetBaseDomainFromHost(&*nsCString::from(host), 0, &mut *base) };
    if rv.failed() {
        return 0;
    }
    let base: &[u8] = &base;
    if !base.is_empty() && base.len() <= host.len() && host.as_bytes().ends_with(base) {
        host.len() - base.len()
    } else {
        0
    }
}

fn iniciar_resolvedor() {
    RESOLVEDOR.call_once(|| {
        let servicio = xpcom::get_service::<nsIEffectiveTLDService>(c"@mozilla.org/network/effective-tld-service;1");
        if let Ok(mut s) = ETLD.lock() {
            *s = servicio;
        }
        let _ = adblock::url_parser::set_domain_resolver(Box::new(Resolvedor));
    });
}

// ── Motores ──────────────────────────────────────────────────────────────────────────────────────────────────────

/// Los recursos, una sola copia para todas las capas.
struct Compartidos(Rc<InMemoryResourceStorage>);

impl ResourceStorageBackend for Compartidos {
    fn get_resource(&self, nombre: &str) -> Option<ResourceImpl> {
        self.0.get_resource(nombre)
    }
}

/// Un motor por capa y la hoja genérica de cada una.
struct Capas {
    motores: Vec<Option<Engine>>,
    genericos: Vec<HashSet<String>>,
}

impl Capas {
    fn vacias() -> Capas {
        Capas {
            motores: (0..CAPAS).map(|_| None).collect(),
            genericos: (0..CAPAS).map(|_| HashSet::new()).collect(),
        }
    }
}

/// Unas capas preparadas en el hilo de fondo, de camino al principal.
///
/// Con la feature `single-thread` (la de Gecko) el `Engine` no es `Send`: dentro lleva `Rc` (sus datos compartidos
/// entre el bloqueador y el cosmético, y aquí los recursos) y un `RefCell` (la caché de expresiones regulares).
struct Movible(Capas);

// SAFETY: se mueve el conjunto entero, nunca se comparte. Todas las copias de cada `Rc` (las del crate y las de
// `Compartidos`) están dentro de estas capas y se crean en el mismo hilo de fondo, que no se queda ninguna: al
// cruzar, ningún contador queda a la vez en dos hilos. adblock-rust no guarda nada por hilo (sin thread_local) y su
// único estado global, el resolvedor de dominios, es Send + Sync.
unsafe impl Send for Movible {}

/// Deserializa un .dat (y los recursos) en capas listas para usar. Fuera del hilo principal.
fn deserializar(dat: &[u8], recursos: &[u8]) -> Result<(Capas, bool), &'static str> {
    if dat.len() < 6 || &dat[..4] != MAGIA {
        return Err("no es un .dat de Aegis");
    }
    if dat[4] != VERSION_CONTENEDOR {
        return Err("versión del contenedor distinta");
    }
    let n = dat[5] as usize;
    if n == 0 || n > CAPAS {
        return Err("número de capas no válido");
    }
    let mut capas = Capas::vacias();
    let mut i = 6;
    for c in 0..n {
        if i + 4 > dat.len() {
            return Err("contenedor cortado");
        }
        let largo = u32::from_le_bytes([dat[i], dat[i + 1], dat[i + 2], dat[i + 3]]) as usize;
        i += 4;
        if largo == 0 {
            continue;
        }
        if i + largo > dat.len() {
            return Err("contenedor cortado");
        }
        let mut e = Engine::default();
        if e.deserialize(&dat[i..i + largo]).is_err() {
            return Err("adblock-rust no acepta el .dat (¿otra versión?)");
        }
        capas.motores[c] = Some(e);
        i += largo;
    }
    if i != dat.len() || capas.motores[0].is_none() {
        return Err("contenedor no válido");
    }
    // Recursos neutros y scriptlets: sin ellos el motor bloquea igual (una regla $redirect bloquea), pero los
    // scriptlets no hacen nada.
    let mut con_recursos = false;
    if !recursos.is_empty() {
        if let Ok(lista) = serde_json::from_slice::<Vec<Resource>>(recursos) {
            let almacen = Rc::new(InMemoryResourceStorage::from_resources(lista));
            for e in capas.motores.iter_mut().flatten() {
                e.use_resource_storage(Compartidos(almacen.clone()));
            }
            con_recursos = true;
        }
    }
    for (c, e) in capas.motores.iter().enumerate() {
        if let Some(e) = e {
            capas.genericos[c] = e.url_cosmetic_resources(URL_GENERICA).hide_selectors;
        }
    }
    Ok((capas, con_recursos))
}

/// Compila las listas de cada capa y devuelve el contenedor .dat. Fuera del hilo principal.
fn compilar_dat(textos: Vec<u8>, largos: &[u32], permisos: &[u32], capas: &[u32]) -> Result<Vec<u8>, &'static str> {
    let mut sets: Vec<Option<FilterSet>> = (0..CAPAS).map(|_| None).collect();
    let mut i = 0usize;
    for k in 0..largos.len() {
        let fin = i + largos[k] as usize;
        let capa = capas[k] as usize;
        if fin > textos.len() || capa >= CAPAS {
            return Err("listas mal partidas");
        }
        let texto = String::from_utf8_lossy(&textos[i..fin]);
        let opciones = ParseOptions {
            permissions: PermissionMask::from_bits(permisos[k] as u8),
            ..ParseOptions::default()
        };
        sets[capa]
            .get_or_insert_with(|| FilterSet::new(false))
            .add_filter_list(&texto, opciones);
        i = fin;
    }
    // El texto ya está en los FilterSet: fuera antes de construir los motores (baja el pico de memoria).
    drop(textos);
    if sets[0].is_none() {
        return Err("no hay listas de anuncios y rastreo");
    }
    let mut dat = Vec::new();
    dat.extend_from_slice(MAGIA);
    dat.push(VERSION_CONTENEDOR);
    dat.push(CAPAS as u8);
    for set in sets {
        let datos = match set {
            Some(set) => {
                let e = Engine::from_filter_set(set, true);
                // Lo que hará el motor al cargarse (la hoja genérica) y una petición cualquiera, ya aquí: si una lista
                // rara hiciera fallar al motor, que sea mientras se compila, con el marcador de listas.sys.mjs puesto
                // y la lista identificada (cada lista nueva se compila antes sola).
                let _ = e.url_cosmetic_resources(URL_GENERICA);
                if let Ok(p) = Request::new("https://aegis-prueba.invalid/a.js?x=1", URL_GENERICA, "script") {
                    let _ = e.check_network_request(&p);
                }
                e.serialize()
            }
            None => Vec::new(),
        };
        dat.extend_from_slice(&(datos.len() as u32).to_le_bytes());
        dat.extend_from_slice(&datos);
    }
    Ok(dat)
}

fn avisar(hecho: &nsIAegisEscudosHecho, resultado: nsresult, detalle: &str) {
    // SAFETY: llamada XPCOM en el hilo principal con una cadena válida durante la llamada.
    unsafe {
        hecho.Hecho(resultado, &*nsCString::from(detalle));
    }
}

fn ms(desde: Instant) -> f64 {
    desde.elapsed().as_secs_f64() * 1000.0
}

// ── Servicio ─────────────────────────────────────────────────────────────────────────────────────────────────────

#[xpcom(implement(nsIAegisEscudosMotor), nonatomic)]
pub struct Motor {
    capas: RefCell<Capas>,
    salida: RefCell<nsCString>,
}

impl Motor {
    fn new() -> RefPtr<Motor> {
        iniciar_resolvedor();
        Motor::allocate(InitMotor {
            capas: RefCell::new(Capas::vacias()),
            salida: RefCell::new(nsCString::new()),
        })
    }

    xpcom_method!(get_listo => GetListo() -> bool);
    fn get_listo(&self) -> Result<bool, nsresult> {
        Ok(self.capas.borrow().motores[0].is_some())
    }

    xpcom_method!(get_capas => GetCapas() -> u32);
    fn get_capas(&self) -> Result<u32, nsresult> {
        let capas = self.capas.borrow();
        Ok(capas
            .motores
            .iter()
            .enumerate()
            .fold(0, |a, (c, e)| if e.is_some() { a | 1 << c } else { a }))
    }

    xpcom_method!(get_version_contenedor => GetVersionContenedor() -> u32);
    fn get_version_contenedor(&self) -> Result<u32, nsresult> {
        Ok(VERSION_CONTENEDOR as u32)
    }

    xpcom_method!(cargar => Cargar(dat: *const ThinVec<u8>, recursos: *const ThinVec<u8>,
                                   hecho: *const nsIAegisEscudosHecho));
    fn cargar(
        &self,
        dat: &ThinVec<u8>,
        recursos: &ThinVec<u8>,
        hecho: &nsIAegisEscudosHecho,
    ) -> Result<(), nsresult> {
        let dat = dat.to_vec();
        let recursos = recursos.to_vec();
        let hecho = RefPtr::new(hecho);
        let yo = RefPtr::new(self);
        moz_task::spawn_local("AegisEscudosMotor::Cargar", async move {
            let t0 = Instant::now();
            let preparado = moz_task::spawn_blocking("AegisEscudosMotor::Deserializar", async move {
                deserializar(&dat, &recursos).map(|(capas, con)| (Movible(capas), con))
            })
            .await;
            match preparado {
                Ok((Movible(capas), con_recursos)) => {
                    let t1 = Instant::now();
                    // El motor anterior se suelta aquí, en el hilo donde vivía.
                    *yo.capas.borrow_mut() = capas;
                    let detalle = serde_json::json!({
                        "fondoMs": (t1 - t0).as_secs_f64() * 1000.0,
                        "cambiarMs": ms(t1),
                        "recursos": con_recursos,
                    });
                    avisar(&hecho, NS_OK, &detalle.to_string());
                }
                Err(e) => avisar(&hecho, NS_ERROR_FAILURE, e),
            }
        })
        .detach();
        Ok(())
    }

    xpcom_method!(descargar => Descargar());
    fn descargar(&self) -> Result<(), nsresult> {
        *self.capas.borrow_mut() = Capas::vacias();
        Ok(())
    }

    xpcom_method!(compilar => Compilar(textos: *const ThinVec<u8>, largos: *const ThinVec<u32>,
                                       permisos: *const ThinVec<u32>, capas: *const ThinVec<u32>,
                                       ruta: *const nsAString, hecho: *const nsIAegisEscudosHecho));
    fn compilar(
        &self,
        textos: &ThinVec<u8>,
        largos: &ThinVec<u32>,
        permisos: &ThinVec<u32>,
        capas: &ThinVec<u32>,
        ruta: &nsAString,
        hecho: &nsIAegisEscudosHecho,
    ) -> Result<(), nsresult> {
        if largos.len() != permisos.len()
            || largos.len() != capas.len()
            || largos.iter().map(|l| *l as usize).sum::<usize>() != textos.len()
            || ruta.is_empty()
        {
            return Err(NS_ERROR_INVALID_ARG);
        }
        let ruta = String::from_utf16(ruta).map_err(|_| NS_ERROR_INVALID_ARG)?;
        let textos = textos.to_vec();
        let largos = largos.to_vec();
        let permisos = permisos.to_vec();
        let capas = capas.to_vec();
        let hecho = RefPtr::new(hecho);
        moz_task::spawn_local("AegisEscudosMotor::Compilar", async move {
            let t0 = Instant::now();
            let r = moz_task::spawn_blocking("AegisEscudosMotor::Compilar", async move {
                let dat = compilar_dat(textos, &largos, &permisos, &capas)?;
                std::fs::write(&ruta, &dat).map_err(|_| "no se ha podido escribir el .dat")?;
                Ok::<usize, &'static str>(dat.len())
            })
            .await;
            match r {
                Ok(bytes) => {
                    let detalle = serde_json::json!({ "bytes": bytes, "ms": ms(t0) });
                    avisar(&hecho, NS_OK, &detalle.to_string());
                }
                Err(e) => avisar(&hecho, NS_ERROR_FAILURE, e),
            }
        })
        .detach();
        Ok(())
    }

    xpcom_method!(red => Red(url: *const nsACString, origen: *const nsACString, tipo: *const nsACString) -> i32);
    fn red(&self, url: &nsACString, origen: &nsACString, tipo: &nsACString) -> Result<i32, nsresult> {
        let (Ok(url), Ok(origen), Ok(tipo)) = (
            std::str::from_utf8(url),
            std::str::from_utf8(origen),
            std::str::from_utf8(tipo),
        ) else {
            return Ok(-1);
        };
        let capas = self.capas.borrow();
        let Some(e) = capas.motores[0].as_ref() else {
            return Ok(-1);
        };
        let Ok(peticion) = Request::new(url, origen, tipo) else {
            return Ok(-1);
        };
        let r = e.check_network_request(&peticion);
        Ok(if r.matched {
            match r.redirect {
                Some(recurso) => {
                    self.salida.borrow_mut().assign(&recurso);
                    2
                }
                None => 1,
            }
        } else if let Some(nueva) = r.rewritten_url {
            self.salida.borrow_mut().assign(&nueva);
            3
        } else {
            0
        })
    }

    xpcom_method!(get_salida => GetSalida() -> nsACString);
    fn get_salida(&self) -> Result<nsCString, nsresult> {
        Ok(self.salida.borrow().clone())
    }

    xpcom_method!(cosmetico => Cosmetico(url: *const nsACString, mascara: u32) -> nsACString);
    fn cosmetico(&self, url: &nsACString, mascara: u32) -> Result<nsCString, nsresult> {
        let Ok(url) = std::str::from_utf8(url) else {
            return Ok(nsCString::new());
        };
        let capas = self.capas.borrow();
        if capas.motores[0].is_none() {
            return Ok(nsCString::new());
        }
        let mut especificos = BTreeSet::new();
        let mut capas_genericas = Vec::new();
        let mut filtrados = serde_json::Map::new();
        let mut procedurales = BTreeSet::new();
        let mut excepciones = BTreeSet::new();
        let mut script = String::new();
        let mut generichide = false;
        let mut elemhide = false;
        for (c, e) in capas.motores.iter().enumerate() {
            let Some(e) = e else { continue };
            if mascara & (1 << c) == 0 {
                continue;
            }
            let g = &capas.genericos[c];
            let r = e.url_cosmetic_resources(url);
            generichide |= r.generichide;
            elemhide |= r.hide_selectors.contains(CENTINELA_ELEMHIDE);
            if !r.generichide {
                if g.iter().all(|s| r.hide_selectors.contains(s)) {
                    capas_genericas.push(c);
                } else {
                    let mut quedan: Vec<&String> = g.iter().filter(|s| r.hide_selectors.contains(*s)).collect();
                    quedan.sort();
                    filtrados.insert(c.to_string(), serde_json::json!(quedan));
                }
            }
            for s in r.hide_selectors {
                if (r.generichide || !g.contains(&s)) && s != CENTINELA_ELEMHIDE {
                    especificos.insert(s);
                }
            }
            procedurales.extend(r.procedural_actions);
            excepciones.extend(r.exceptions);
            if !r.injected_script.is_empty() {
                // Cada capa en su propio ámbito: adblock-rust no repite dependencias dentro de un motor, pero dos
                // capas pueden traer la misma (y si es una clase, como RangeParser, declararla dos veces en el mismo
                // ámbito es un SyntaxError que dejaría la página sin ningún scriptlet). `scriptletGlobals` llega por
                // cierre desde el envoltorio del hijo.
                script.push_str("(function() {\n");
                script.push_str(&r.injected_script);
                script.push_str("\n})();\n");
            }
        }
        if elemhide {
            // `$elemhide`: nada de ocultar en el sitio (sí los scriptlets, como en uBlock Origin).
            especificos.clear();
            capas_genericas.clear();
            filtrados.clear();
            procedurales.clear();
            generichide = true;
        }
        let json = serde_json::json!({
            "especificos": especificos,
            "capas": capas_genericas,
            "filtrados": filtrados,
            "procedurales": procedurales,
            "excepciones": excepciones,
            "script": script,
            "generichide": generichide,
            "elemhide": elemhide,
        });
        Ok(nsCString::from(json.to_string()))
    }

    xpcom_method!(genericos => Genericos(clases: *const ThinVec<nsCString>, ids: *const ThinVec<nsCString>,
                                         excepciones: *const ThinVec<nsCString>, mascara: u32) -> nsACString);
    fn genericos(
        &self,
        clases: &ThinVec<nsCString>,
        ids: &ThinVec<nsCString>,
        excepciones: &ThinVec<nsCString>,
        mascara: u32,
    ) -> Result<nsCString, nsresult> {
        let texto = |v: &ThinVec<nsCString>| -> Vec<String> {
            v.iter().filter_map(|s| std::str::from_utf8(s).ok().map(str::to_owned)).collect()
        };
        let clases = texto(clases);
        let ids = texto(ids);
        let excepciones: HashSet<String> = texto(excepciones).into_iter().collect();
        let mut selectores = BTreeSet::new();
        let capas = self.capas.borrow();
        for (c, e) in capas.motores.iter().enumerate() {
            let Some(e) = e else { continue };
            if mascara & (1 << c) == 0 {
                continue;
            }
            selectores.extend(e.hidden_class_id_selectors(&clases, &ids, &excepciones));
        }
        Ok(nsCString::from(serde_json::json!(selectores).to_string()))
    }

    xpcom_method!(genericos_capa => GenericosCapa(capa: u32) -> nsACString);
    fn genericos_capa(&self, capa: u32) -> Result<nsCString, nsresult> {
        let capas = self.capas.borrow();
        let mut lista: Vec<&String> = capas
            .genericos
            .get(capa as usize)
            .map(|s| s.iter().collect())
            .unwrap_or_default();
        lista.sort();
        Ok(nsCString::from(serde_json::json!(lista).to_string()))
    }
}

/// Constructor del servicio (components.conf, legacy_constructor).
///
/// # Safety
/// `result` tiene que ser un puntero válido para escribir.
#[no_mangle]
pub unsafe extern "C" fn aegis_escudos_motor_constructor(iid: &nsIID, result: *mut *mut c_void) -> nsresult {
    *result = std::ptr::null_mut();
    let motor = Motor::new();
    motor.QueryInterface(iid, result)
}
