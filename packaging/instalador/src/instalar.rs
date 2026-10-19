//! La instalación: comprobar la carga, descomprimir en `<carpeta>.parcial`, dejar las elecciones para el primer
//! arranque y sustituir la carpeta de golpe (renombrando). Si algo se corta, no queda una instalación a medias.
//! Después, accesos directos y registro como navegador en HKCU (sin ponerse de predeterminado).

use crate::carga::{self, Carga, Tramo};
use crate::sistema;
use std::fs::{self, File};
use std::io::{self, BufReader, Read, Write};
use std::path::{Component, Path, PathBuf};
use std::time::Duration;

/// Lo que se elige en el asistente.
#[derive(Clone, Debug)]
pub struct Elecciones {
    pub modo: String,
    pub escudos: String,
    pub buscador: String,
    pub apariencia: String,
    pub idioma: String,
    pub carpeta: PathBuf,
    pub escritorio: bool,
    pub menu_inicio: bool,
}

/// Por qué no se pudo instalar. Los códigos son los de la propiedad `error` de la interfaz.
#[derive(Debug)]
pub enum Fallo {
    SinEspacio(u64),
    EnUso,
    Danada,
    Escritura(#[allow(dead_code)] String),
    CarpetaAjena,
}

impl Fallo {
    pub fn codigo(&self) -> i32 {
        match self {
            Fallo::SinEspacio(_) => 1,
            Fallo::EnUso => 2,
            Fallo::Danada => 3,
            Fallo::Escritura(_) => 4,
            Fallo::CarpetaAjena => 5,
        }
    }
    pub fn mb(&self) -> i32 {
        match self {
            Fallo::SinEspacio(mb) => (*mb).min(i32::MAX as u64) as i32,
            _ => 0,
        }
    }
}

fn escritura(e: io::Error) -> Fallo {
    Fallo::Escritura(e.to_string())
}

/// Fases de la interfaz: 0 preparar, 1 copiar, 2 accesos, 3 terminar.
pub type Informe<'a> = &'a dyn Fn(i32, f32);

const MB: u64 = 1024 * 1024;
const NOMBRE_ELECCIONES: &str = "aegis-instalador.json";

/// Modo demostración (sin carga): solo mueve la barra, para ver la interfaz. No escribe nada.
pub fn demo(informe: Informe) -> Result<Option<PathBuf>, Fallo> {
    let tramos: [(i32, f32, f32, u32); 4] = [(0, 0.0, 0.08, 12), (1, 0.08, 0.9, 80), (2, 0.9, 0.97, 14), (3, 0.97, 1.0, 6)];
    for (fase, desde, hasta, pasos) in tramos {
        for i in 0..=pasos {
            informe(fase, desde + (hasta - desde) * i as f32 / pasos as f32);
            std::thread::sleep(Duration::from_millis(35));
        }
    }
    Ok(None)
}

/// Instala de verdad. Devuelve la ruta del ejecutable del navegador instalado.
pub fn instalar(c: &Carga, el: &Elecciones, informe: Informe) -> Result<Option<PathBuf>, Fallo> {
    let carpeta = el.carpeta.clone();
    comprobar_carpeta(&carpeta)?;

    // 1. Espacio: lo descomprimido, más un margen para la copia anterior mientras se sustituye.
    informe(0, 0.0);
    let necesario = c.tamano_descomprimido().map_err(|_| Fallo::Danada)? + 32 * MB;
    if let Some(libre) = sistema::espacio_libre(&carpeta) {
        if libre < necesario {
            return Err(Fallo::SinEspacio((necesario - libre).div_ceil(MB)));
        }
    }

    // 2. Suma de la carga entera antes de tocar nada.
    let ok = c.verificar(&mut |f| informe(0, f * 0.10)).map_err(|_| Fallo::Danada)?;
    if !ok {
        return Err(Fallo::Danada);
    }

    // 3. Descomprimir en <carpeta>.parcial.
    let parcial = hermana(&carpeta, "parcial");
    if parcial.exists() {
        fs::remove_dir_all(&parcial).map_err(|_| Fallo::EnUso)?;
    }
    fs::create_dir_all(&parcial).map_err(escritura)?;
    let resultado = (|| {
        descomprimir(c, &parcial, &mut |f| informe(1, 0.10 + f * 0.80))?;
        let exe = buscar_exe(&parcial).ok_or(Fallo::Danada)?;
        escribir_elecciones(&parcial, el).map_err(escritura)?;
        copiar_desinstalador(&parcial).map_err(escritura)?;
        Ok::<_, Fallo>(exe)
    })();
    let exe_nombre = match resultado {
        Ok(exe) => exe,
        Err(f) => {
            let _ = fs::remove_dir_all(&parcial);
            return Err(f);
        }
    };

    // 4. Sustituir de golpe, conservando la anterior hasta que la nueva esté en su sitio.
    informe(1, 0.90);
    sustituir(&parcial, &carpeta)?;
    let exe = carpeta.join(exe_nombre);

    // 5. Accesos y registro (lo que falle aquí no deshace la instalación: el navegador ya funciona).
    informe(2, 0.92);
    let _ = accesos(&exe, el);
    informe(2, 0.95);
    let _ = registrar(&exe, &carpeta);
    informe(3, 1.0);
    Ok(Some(exe))
}

/// La carpeta de instalación siempre termina en «Aegis»: si se elige otra (p. ej. «D:\Apps»), Aegis va en
/// «D:\Apps\Aegis». Así una actualización o una desinstalación nunca sustituyen ni borran una carpeta
/// contenedora con otras cosas del usuario.
pub fn carpeta_final(elegida: &str) -> PathBuf {
    let elegida = elegida.trim().trim_end_matches(['\\', '/']);
    // «D:\» se queda en «D:», que sin la barra sería relativa: se la devolvemos.
    let p = if elegida.ends_with(':') { PathBuf::from(format!("{elegida}\\")) } else { PathBuf::from(elegida) };
    let es_aegis = p.file_name().is_some_and(|n| n.to_string_lossy().eq_ignore_ascii_case("Aegis"));
    if es_aegis || elegida.is_empty() {
        p
    } else {
        p.join("Aegis")
    }
}

/// Una instalación de Aegis hecha por este instalador: lleva las dos marcas a la vez.
fn es_instalacion_aegis(carpeta: &Path) -> bool {
    carpeta.join("desinstalar.exe").is_file() && carpeta.join("distribution").join(NOMBRE_ELECCIONES).is_file()
}

/// La carpeta tiene que ser absoluta, llamarse «Aegis» y, si ya existe, estar vacía o ser una instalación de Aegis
/// (las dos marcas): nunca se sustituye una carpeta con otros archivos.
fn comprobar_carpeta(carpeta: &Path) -> Result<(), Fallo> {
    let nombre_ok = carpeta.file_name().is_some_and(|n| n.to_string_lossy().eq_ignore_ascii_case("Aegis"));
    if !carpeta.is_absolute() || carpeta.parent().is_none() || !nombre_ok {
        return Err(Fallo::CarpetaAjena);
    }
    if carpeta.exists() {
        let vacia = fs::read_dir(carpeta).map_err(escritura)?.next().is_none();
        if !vacia && !es_instalacion_aegis(carpeta) {
            return Err(Fallo::CarpetaAjena);
        }
    }
    Ok(())
}

fn hermana(carpeta: &Path, sufijo: &str) -> PathBuf {
    let nombre = carpeta.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    carpeta.with_file_name(format!("{nombre}.{sufijo}"))
}

/// Primer componente común a todas las entradas (el zip de `mach package` lo mete todo en `aegis/`).
fn prefijo_comun(nombres: &[PathBuf]) -> Option<PathBuf> {
    let primero = |p: &PathBuf| match p.components().next() {
        Some(Component::Normal(c)) => Some(PathBuf::from(c)),
        _ => None,
    };
    let candidato = primero(nombres.first()?)?;
    let todos = nombres.iter().all(|n| n.starts_with(&candidato));
    let alguno_dentro = nombres.iter().any(|n| n.components().count() > 1);
    (todos && alguno_dentro).then_some(candidato)
}

fn descomprimir(c: &Carga, destino: &Path, avance: &mut dyn FnMut(f32)) -> Result<(), Fallo> {
    let lector = BufReader::with_capacity(1 << 20, Tramo::abrir(c).map_err(|_| Fallo::Danada)?);
    let mut zip = zip::ZipArchive::new(lector).map_err(|_| Fallo::Danada)?;
    let mut nombres = Vec::with_capacity(zip.len());
    let mut total = 0u64;
    for i in 0..zip.len() {
        let e = zip.by_index(i).map_err(|_| Fallo::Danada)?;
        // enclosed_name descarta rutas absolutas y «..»: nada se escribe fuera de la carpeta.
        nombres.push(e.enclosed_name().ok_or(Fallo::Danada)?);
        total += e.size();
    }
    let prefijo = prefijo_comun(&nombres);
    let mut hecho = 0u64;
    let mut ultimo = -1.0f32;
    let mut buf = vec![0u8; 1 << 20];
    for (i, nombre) in nombres.iter().enumerate() {
        let rel = match &prefijo {
            Some(p) => nombre.strip_prefix(p).unwrap_or(nombre).to_path_buf(),
            None => nombre.clone(),
        };
        if rel.as_os_str().is_empty() {
            continue;
        }
        let ruta = destino.join(&rel);
        let mut e = zip.by_index(i).map_err(|_| Fallo::Danada)?;
        if e.is_dir() {
            fs::create_dir_all(&ruta).map_err(escritura)?;
            continue;
        }
        if let Some(padre) = ruta.parent() {
            fs::create_dir_all(padre).map_err(escritura)?;
        }
        let mut f = io::BufWriter::with_capacity(1 << 20, File::create(&ruta).map_err(escritura)?);
        loop {
            let n = e.read(&mut buf).map_err(|_| Fallo::Danada)?;
            if n == 0 {
                break;
            }
            f.write_all(&buf[..n]).map_err(escritura)?;
            hecho += n as u64;
            let fr = hecho as f32 / total.max(1) as f32;
            if fr - ultimo >= 0.005 {
                ultimo = fr;
                avance(fr);
            }
        }
        f.flush().map_err(escritura)?;
    }
    avance(1.0);
    Ok(())
}

/// El ejecutable del navegador: aegis.exe (o firefox.exe en las builds sin marca).
fn buscar_exe(carpeta: &Path) -> Option<PathBuf> {
    ["aegis.exe", "firefox.exe"].iter().map(PathBuf::from).find(|n| carpeta.join(n).is_file())
}

/// Formato del JSON de las elecciones. 2: tres niveles de Escudos (`normal`, `estricto`, `estricto_mas`). En el 1 solo
/// había `normal` y `estricto`, y `estricto` era el nivel de serie de entonces (hoy Estricto+).
const FORMATO: u32 = 2;

/// Las elecciones del asistente, para que Aegis las aplique en el primer arranque (docs/INSTALADOR.md).
pub fn json_elecciones(el: &Elecciones) -> String {
    fn cadena(s: &str) -> String {
        let mut o = String::from("\"");
        for ch in s.chars() {
            match ch {
                '"' => o.push_str("\\\""),
                '\\' => o.push_str("\\\\"),
                c if (c as u32) < 0x20 => o.push_str(&format!("\\u{:04x}", c as u32)),
                c => o.push(c),
            }
        }
        o.push('"');
        o
    }
    format!(
        "{{\n  \"formato\": {FORMATO},\n  \"instalador\": {},\n  \"modo\": {},\n  \"escudos\": {},\n  \"buscador\": {},\n  \"apariencia\": {},\n  \"idioma\": {}\n}}\n",
        cadena(env!("CARGO_PKG_VERSION")),
        cadena(&el.modo),
        cadena(&el.escudos),
        cadena(&el.buscador),
        cadena(&el.apariencia),
        cadena(&el.idioma),
    )
}

fn escribir_elecciones(carpeta: &Path, el: &Elecciones) -> io::Result<()> {
    let dist = carpeta.join("distribution");
    fs::create_dir_all(&dist)?;
    fs::write(dist.join(NOMBRE_ELECCIONES), json_elecciones(el))
}

/// El desinstalador es este mismo programa sin la carga.
fn copiar_desinstalador(carpeta: &Path) -> io::Result<()> {
    let exe = std::env::current_exe()?;
    let n = carga::longitud_sin_carga(&exe)?;
    let mut out = io::BufWriter::new(File::create(carpeta.join("desinstalar.exe"))?);
    io::copy(&mut File::open(&exe)?.take(n), &mut out)?;
    out.flush()
}

fn sustituir(parcial: &Path, carpeta: &Path) -> Result<(), Fallo> {
    if let Some(padre) = carpeta.parent() {
        fs::create_dir_all(padre).map_err(escritura)?;
    }
    if !carpeta.exists() {
        return fs::rename(parcial, carpeta).map_err(escritura);
    }
    // Otra vez aquí, justo antes de apartarla: solo se sustituye una instalación de Aegis o una carpeta vacía.
    let vacia = fs::read_dir(carpeta).map_err(escritura)?.next().is_none();
    if !vacia && !es_instalacion_aegis(carpeta) {
        return Err(Fallo::CarpetaAjena);
    }
    let anterior = hermana(carpeta, "anterior");
    if anterior.exists() {
        fs::remove_dir_all(&anterior).map_err(|_| Fallo::EnUso)?;
    }
    // Si Aegis está abierto, Windows no deja renombrar la carpeta: se avisa y no se toca nada.
    renombrar(carpeta, &anterior, 5).map_err(|_| Fallo::EnUso)?;
    if let Err(e) = fs::rename(parcial, carpeta) {
        let _ = fs::rename(&anterior, carpeta);
        return Err(escritura(e));
    }
    let _ = fs::remove_dir_all(&anterior);
    Ok(())
}

fn accesos(exe: &Path, el: &Elecciones) -> io::Result<()> {
    if el.menu_inicio {
        if let Some(p) = sistema::programas_menu_inicio() {
            sistema::acceso_directo(&p.join("Aegis.lnk"), exe, "Aegis")?;
        }
    }
    if el.escritorio {
        if let Some(e) = sistema::escritorio() {
            sistema::acceso_directo(&e.join("Aegis.lnk"), exe, "Aegis")?;
        }
    }
    Ok(())
}

/// Registro como navegador en HKCU: aparece en «Aplicaciones predeterminadas» sin quitarle el sitio a nadie.
fn registrar(exe: &Path, carpeta: &Path) -> io::Result<()> {
    use sistema::{registro, Valor::*};
    let exe_s = exe.display().to_string();
    let icono = format!("{exe_s},0");
    let abrir = format!("\"{exe_s}\" -osint -url \"%1\"");
    let base = r"Software\Clients\StartMenuInternet\Aegis";
    let cap = format!(r"{base}\Capabilities");
    registro(base, None, Texto("Aegis"))?;
    registro(&format!(r"{base}\DefaultIcon"), None, Texto(&icono))?;
    registro(&format!(r"{base}\shell\open\command"), None, Texto(&format!("\"{exe_s}\"")))?;
    registro(&cap, Some("ApplicationName"), Texto("Aegis"))?;
    registro(&cap, Some("ApplicationDescription"), Texto("Aegis"))?;
    registro(&cap, Some("ApplicationIcon"), Texto(&icono))?;
    registro(&format!(r"{cap}\StartMenu"), Some("StartMenuInternet"), Texto("Aegis"))?;
    for esquema in ["http", "https"] {
        registro(&format!(r"{cap}\URLAssociations"), Some(esquema), Texto("AegisURL"))?;
    }
    for ext in [".htm", ".html", ".shtml", ".xht", ".xhtml", ".svg", ".webp", ".avif"] {
        registro(&format!(r"{cap}\FileAssociations"), Some(ext), Texto("AegisHTML"))?;
    }
    registro(&format!(r"{cap}\FileAssociations"), Some(".pdf"), Texto("AegisPDF"))?;
    for (clase, nombre) in [("AegisURL", "Aegis URL"), ("AegisHTML", "Aegis HTML Document"), ("AegisPDF", "Aegis PDF Document")] {
        let c = format!(r"Software\Classes\{clase}");
        registro(&c, None, Texto(nombre))?;
        registro(&c, Some("FriendlyTypeName"), Texto(nombre))?;
        if clase == "AegisURL" {
            registro(&c, Some("URL Protocol"), Texto(""))?;
        }
        registro(&format!(r"{c}\DefaultIcon"), None, Texto(&icono))?;
        registro(&format!(r"{c}\shell\open\command"), None, Texto(&abrir))?;
    }
    registro(r"Software\RegisteredApplications", Some("Aegis"), Texto(&cap))?;

    // «Aplicaciones instaladas»: el desinstalador es este mismo programa.
    let u = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\Aegis";
    let des = carpeta.join("desinstalar.exe").display().to_string();
    registro(u, Some("DisplayName"), Texto("Aegis"))?;
    registro(u, Some("DisplayIcon"), Texto(&icono))?;
    registro(u, Some("Publisher"), Texto("Aegis"))?;
    registro(u, Some("InstallLocation"), Texto(&carpeta.display().to_string()))?;
    registro(u, Some("UninstallString"), Texto(&format!("\"{des}\" --desinstalar")))?;
    registro(u, Some("NoModify"), Numero(1))?;
    registro(u, Some("NoRepair"), Numero(1))?;
    if let Ok(kb) = tamano(carpeta) {
        registro(u, Some("EstimatedSize"), Numero((kb / 1024).min(u32::MAX as u64) as u32))?;
    }
    sistema::avisar_asociaciones();
    Ok(())
}

fn tamano(p: &Path) -> io::Result<u64> {
    let mut total = 0;
    for e in fs::read_dir(p)? {
        let e = e?;
        let m = e.metadata()?;
        total += if m.is_dir() { tamano(&e.path())? } else { m.len() };
    }
    Ok(total)
}

/// Desinstalar: quita accesos, registro y la carpeta del programa. El perfil (marcadores, contraseñas, historial,
/// en %APPDATA%\Aegis y %LOCALAPPDATA%\Aegis) no se toca: borrarlo será una casilla aparte, apagada.
/// `Software\Aegis` es lo que escribe el propio navegador (fabricante «Aegis», parche 0200-branding/0001: cachés
/// del lanzador y de la ventana de arranque, valores por carpeta de instalación); es solo de Aegis y se vuelve a
/// crear solo, así que se borra entera aunque haya otra copia de Aegis en el equipo.
pub fn desinstalar(carpeta: &Path) -> Result<(), Fallo> {
    if !es_instalacion_aegis(carpeta) {
        return Err(Fallo::CarpetaAjena);
    }
    // Primero apartar la carpeta: si Aegis está abierto, falla aquí y no se ha tocado nada.
    let apartada = hermana(carpeta, "borrando");
    if apartada.exists() {
        let _ = fs::remove_dir_all(&apartada);
    }
    // Con reintentos: el desinstalador que nos ha lanzado desde la carpeta tarda un momento en cerrarse.
    renombrar(carpeta, &apartada, 40).map_err(|_| Fallo::EnUso)?;
    for p in [sistema::programas_menu_inicio(), sistema::escritorio()].into_iter().flatten() {
        let _ = fs::remove_file(p.join("Aegis.lnk"));
    }
    for clave in [
        r"Software\Clients\StartMenuInternet\Aegis",
        r"Software\Classes\AegisURL",
        r"Software\Classes\AegisHTML",
        r"Software\Classes\AegisPDF",
        r"Software\Microsoft\Windows\CurrentVersion\Uninstall\Aegis",
        r"Software\Aegis",
    ] {
        let _ = sistema::borrar_registro(clave);
    }
    let _ = sistema::borrar_valor_registro(r"Software\RegisteredApplications", "Aegis");
    sistema::avisar_asociaciones();
    fs::remove_dir_all(&apartada).map_err(escritura)
}

/// Renombra con unos reintentos (cada 250 ms): un antivirus o un proceso que se está cerrando pueden tener la
/// carpeta abierta un instante.
fn renombrar(de: &Path, a: &Path, intentos: u32) -> io::Result<()> {
    let mut i = 0;
    loop {
        match fs::rename(de, a) {
            Ok(()) => return Ok(()),
            Err(e) if i + 1 >= intentos => return Err(e),
            Err(_) => {
                i += 1;
                std::thread::sleep(Duration::from_millis(250));
            }
        }
    }
}
