//! Aegis Setup: el instalador de Aegis para Windows (docs/INSTALADOR.md).
//!
//! Por usuario y sin UAC (%LOCALAPPDATA%\Programs\Aegis), atómico (descomprime aparte y renombra) y sin
//! conexiones: el navegador va dentro del propio ejecutable. Sin carga, funciona en modo demostración.
//!
//! Órdenes:
//!   aegis-setup                                  asistente de instalación
//!   aegis-setup --desinstalar [--carpeta <ruta>] desinstalar (es lo que abre «Aplicaciones instaladas»)
//!   aegis-setup --captura <carpeta> [--escalas 1,1.5] [--idioma es]
//!                                                PNG de cada paso, en oscuro y en claro (sin ventana)
//!   aegis-setup --anadir-carga <zip> --salida <exe>
//!                                                pega el paquete de Windows al instalador
//! Opciones: --carpeta <ruta> (otra carpeta), --automatico (empieza solo, con lo de serie, y termina solo: código 0
//! si todo ha ido bien o el del error, 1–5, sin abrir Aegis), --carga <zip>
//! (carga suelta, para pruebas), --idioma <código>, --tema oscuro|claro.

#![cfg_attr(windows, windows_subsystem = "windows")]

mod captura;
mod carga;
mod instalar;
mod sistema;

use carga::Carga;
use instalar::{Elecciones, Fallo};
use slint::ComponentHandle;
use std::error::Error;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

slint::include_modules!();

#[derive(Default)]
struct Argumentos {
    captura: Option<PathBuf>,
    escalas: Vec<f32>,
    idioma: Option<String>,
    tema: Option<bool>,
    carga: Option<PathBuf>,
    anadir_carga: Option<PathBuf>,
    salida: Option<PathBuf>,
    desinstalar: bool,
    automatico: bool,
    carpeta: Option<PathBuf>,
}

fn argumentos() -> Result<Argumentos, String> {
    let mut a = Argumentos::default();
    let mut it = std::env::args_os().skip(1);
    while let Some(arg) = it.next() {
        let arg = arg.to_string_lossy().into_owned();
        let mut valor = || it.next().ok_or(format!("falta el valor de {arg}"));
        match arg.as_str() {
            "--captura" => a.captura = Some(valor()?.into()),
            "--escalas" => {
                let v = valor()?;
                a.escalas = v
                    .to_string_lossy()
                    .split(',')
                    .map(|s| s.trim().parse::<f32>().map_err(|_| format!("escala no válida: {s}")))
                    .collect::<Result<_, _>>()?;
            }
            "--idioma" => a.idioma = Some(valor()?.to_string_lossy().into_owned()),
            "--tema" => a.tema = Some(valor()?.to_string_lossy() != "claro"),
            "--carga" => a.carga = Some(valor()?.into()),
            "--anadir-carga" => a.anadir_carga = Some(valor()?.into()),
            "--salida" => a.salida = Some(valor()?.into()),
            "--carpeta" => a.carpeta = Some(valor()?.into()),
            "--desinstalar" => a.desinstalar = true,
            "--automatico" => a.automatico = true,
            otro => return Err(format!("opción desconocida: {otro}")),
        }
    }
    Ok(a)
}

/// Idioma de la interfaz: el pedido o, sin pedir, el de Windows (lo elige Slint). Las traducciones van dentro del
/// ejecutable (traducciones/<idioma>/LC_MESSAGES/aegis-setup.po); el inglés es el texto de origen.
pub fn elegir_idioma(idioma: &str) {
    if idioma.is_empty() {
        return;
    }
    let completo = idioma.replace('_', "-");
    let base = completo.split('-').next().unwrap_or("").to_string();
    if base == "en" {
        let _ = slint::select_bundled_translation("");
        return;
    }
    for c in [completo, base] {
        if slint::select_bundled_translation(&c).is_ok() {
            return;
        }
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    let a = argumentos()?;
    limpiar_desinstaladores_viejos();
    if let Some(zip) = &a.anadir_carga {
        let salida = a.salida.as_ref().ok_or("falta --salida <exe>")?;
        carga::anadir(zip, salida)?;
        return Ok(());
    }
    if let Some(carpeta) = &a.captura {
        let escalas = if a.escalas.is_empty() { vec![1.0] } else { a.escalas.clone() };
        let destino = sistema::carpeta_de_serie().display().to_string();
        return captura::capturar(carpeta, &escalas, a.idioma.as_deref().unwrap_or("es"), &destino);
    }
    if a.desinstalar {
        return desinstalador(&a);
    }
    asistente(&a)
}

/// Elige winit con el renderizador por software. En Windows 11: esquinas redondeadas, sombra y un borde fino
/// del sistema (la ventana no tiene marco), y centrada en la pantalla principal desde el primer fotograma.
fn preparar_ventana(oscuro: bool) -> Result<(), Box<dyn Error>> {
    #[allow(unused_mut)]
    let mut selector = slint::BackendSelector::new().backend_name("winit".into()).renderer_name("software".into());
    #[cfg(windows)]
    {
        let posicion = sistema::posicion_centrada(960.0, 620.0);
        selector = selector.with_winit_window_attributes_hook(move |atributos| {
            use slint::winit_030::winit;
            use winit::platform::windows::{Color, CornerPreference, WindowAttributesExtWindows};
            let borde = if oscuro { Color::from_rgb(0x23, 0x23, 0x25) } else { Color::from_rgb(0xdc, 0xdc, 0xde) };
            let atributos = atributos
                .with_corner_preference(CornerPreference::Round)
                .with_undecorated_shadow(true)
                .with_border_color(Some(borde));
            match posicion {
                Some((x, y)) => atributos.with_position(winit::dpi::PhysicalPosition::new(x, y)),
                None => atributos,
            }
        });
    }
    let _ = oscuro;
    selector.select()?;
    Ok(())
}

fn comunes(ui: &Instalador, a: &Argumentos) {
    let oscuro = a.tema.unwrap_or_else(sistema::tema_oscuro);
    ui.global::<T>().set_oscuro(oscuro);
    ui.global::<T>().set_movimiento(sistema::animaciones());
    elegir_idioma(a.idioma.as_deref().unwrap_or(""));
    let debil = ui.as_weak();
    ui.on_arrastrar(move || {
        if let Some(ui) = debil.upgrade() {
            use slint::winit_030::WinitWindowAccessor;
            ui.window().with_winit_window(|w| {
                let _ = w.drag_window();
            });
        }
    });
}

fn asistente(a: &Argumentos) -> Result<(), Box<dyn Error>> {
    preparar_ventana(a.tema.unwrap_or_else(sistema::tema_oscuro))?;
    let ui = Instalador::new()?;
    comunes(&ui, a);

    let carga: Result<Option<Carga>, String> = Carga::buscar(a.carga.as_deref()).map_err(|e| e.to_string());
    let demo = matches!(carga, Ok(None));
    ui.set_demo(demo);
    let mb = match &carga {
        Ok(Some(c)) => c.tamano_descomprimido().map(|b| (b / (1024 * 1024) + 32).div_ceil(10) * 10).unwrap_or(250),
        _ => 250,
    };
    ui.set_mb_necesarios(mb as i32);
    let carpeta = a.carpeta.clone().unwrap_or_else(sistema::carpeta_de_serie);
    ui.set_carpeta(carpeta.display().to_string().into());
    // La interfaz enseña dónde irá de verdad (siempre en una carpeta «Aegis»).
    ui.on_ruta_final(|elegida| instalar::carpeta_final(&elegida).display().to_string().into());
    let idioma = a.idioma.clone().unwrap_or_else(sistema::idioma_sistema);

    let instalado: Arc<Mutex<Option<PathBuf>>> = Arc::new(Mutex::new(None));
    // Código de salida en --automatico: 0 instalado, o el código del error.
    let salida: Arc<Mutex<i32>> = Arc::new(Mutex::new(0));
    let automatico = a.automatico;

    {
        let debil = ui.as_weak();
        let instalado = instalado.clone();
        let salida = salida.clone();
        ui.on_instalar(move || {
            let Some(ui) = debil.upgrade() else { return };
            let el = Elecciones {
                modo: ui.get_modo().into(),
                escudos: ui.get_escudos().into(),
                buscador: ui.get_buscador().into(),
                apariencia: ui.get_apariencia().into(),
                idioma: idioma.clone(),
                carpeta: instalar::carpeta_final(&ui.get_carpeta()),
                escritorio: ui.get_escritorio(),
                menu_inicio: ui.get_menu_inicio(),
            };
            let debil = ui.as_weak();
            let carga = carga.clone();
            let instalado = instalado.clone();
            let salida = salida.clone();
            std::thread::spawn(move || {
                let d = debil.clone();
                let informe = move |fase: i32, progreso: f32| {
                    let _ = d.upgrade_in_event_loop(move |ui| {
                        ui.set_fase(fase);
                        ui.set_progreso(progreso);
                    });
                };
                let r = match &carga {
                    Ok(Some(c)) => instalar::instalar(c, &el, &informe),
                    Ok(None) => instalar::demo(&informe),
                    Err(_) => Err(Fallo::Danada),
                };
                match r {
                    Ok(exe) => {
                        *instalado.lock().unwrap() = exe;
                        // Un instante con la barra llena antes de «Listo».
                        std::thread::sleep(std::time::Duration::from_millis(300));
                        let _ = debil.upgrade_in_event_loop(|ui| ui.set_paso(7));
                        // Desatendido: termina solo, sin abrir Aegis (código 0).
                        if automatico {
                            let _ = slint::invoke_from_event_loop(|| {
                                let _ = slint::quit_event_loop();
                            });
                        }
                    }
                    Err(f) => {
                        let (codigo, mb) = (f.codigo(), f.mb());
                        let _ = debil.upgrade_in_event_loop(move |ui| {
                            ui.set_error_mb(mb);
                            ui.set_error(codigo);
                        });
                        // Desatendido: termina con el código del error (1–5, los de la interfaz).
                        if automatico {
                            *salida.lock().unwrap() = codigo;
                            let _ = slint::invoke_from_event_loop(|| {
                                let _ = slint::quit_event_loop();
                            });
                        }
                    }
                }
            });
        });
    }

    {
        let debil = ui.as_weak();
        let instalado = instalado.clone();
        ui.on_abrir(move || {
            if let Some(exe) = instalado.lock().unwrap().clone() {
                let _ = std::process::Command::new(&exe).current_dir(exe.parent().unwrap_or(&exe)).spawn();
            }
            if let Some(ui) = debil.upgrade() {
                if ui.get_predeterminado() {
                    sistema::abrir_uri("ms-settings:defaultapps?registeredAppUser=Aegis");
                }
            }
            let _ = slint::quit_event_loop();
        });
    }

    {
        let debil = ui.as_weak();
        ui.on_cerrar(move || {
            if let Some(ui) = debil.upgrade() {
                if ui.get_paso() == 7 && !ui.get_demo() && ui.get_predeterminado() {
                    sistema::abrir_uri("ms-settings:defaultapps?registeredAppUser=Aegis");
                }
            }
            let _ = slint::quit_event_loop();
        });
    }

    // --automatico: instala nada más abrir, con lo de serie, y se cierra al terminar (pruebas e instalaciones
    // desatendidas).
    if a.automatico {
        ui.set_paso(6);
        ui.invoke_instalar();
    }
    ui.run()?;
    let codigo = *salida.lock().unwrap();
    if codigo != 0 {
        std::process::exit(codigo);
    }
    Ok(())
}

/// Borra las copias del desinstalador que quedaron en %TEMP% de otras veces (la que está en marcha no se puede).
fn limpiar_desinstaladores_viejos() {
    let yo = std::env::current_exe().ok();
    if let Ok(dir) = std::fs::read_dir(std::env::temp_dir()) {
        for e in dir.flatten() {
            let nombre = e.file_name().to_string_lossy().into_owned();
            if nombre.starts_with("aegis-desinstalar-") && nombre.ends_with(".exe") && Some(e.path()) != yo {
                let _ = std::fs::remove_file(e.path());
            }
        }
    }
}

fn desinstalador(a: &Argumentos) -> Result<(), Box<dyn Error>> {
    let exe = std::env::current_exe()?;
    let carpeta = match &a.carpeta {
        Some(c) => c.clone(),
        None => exe.parent().ok_or("sin carpeta")?.to_path_buf(),
    };
    // Windows no deja borrar la carpeta desde la que se ejecuta un programa: el desinstalador se copia a la
    // carpeta temporal y sigue desde allí.
    if exe.starts_with(&carpeta) {
        let copia = std::env::temp_dir().join(format!("aegis-desinstalar-{}.exe", std::process::id()));
        std::fs::copy(&exe, &copia)?;
        // Que se borre al reiniciar (solo funciona con permisos de administrador; si no, la borra la próxima vez
        // que se abra el instalador o el desinstalador).
        sistema::borrar_al_reiniciar(&copia);
        let mut orden = std::process::Command::new(&copia);
        orden.arg("--desinstalar").arg("--carpeta").arg(&carpeta);
        if a.automatico {
            orden.arg("--automatico");
        }
        if let Some(i) = &a.idioma {
            orden.arg("--idioma").arg(i);
        }
        orden.spawn()?;
        return Ok(());
    }

    preparar_ventana(a.tema.unwrap_or_else(sistema::tema_oscuro))?;
    let ui = Instalador::new()?;
    comunes(&ui, a);
    ui.set_demo(false);
    ui.set_paso(10);
    // Código de salida en --automatico: 0 desinstalado, o el código del error.
    let salida: Arc<Mutex<i32>> = Arc::new(Mutex::new(0));
    let automatico = a.automatico;
    {
        let debil = ui.as_weak();
        let salida = salida.clone();
        ui.on_desinstalar(move || {
            let debil = debil.clone();
            let carpeta = carpeta.clone();
            let salida = salida.clone();
            std::thread::spawn(move || {
                let r = instalar::desinstalar(&carpeta);
                if let Err(f) = &r {
                    *salida.lock().unwrap() = f.codigo();
                }
                let _ = debil.upgrade_in_event_loop(move |ui| {
                    match r {
                        Ok(()) => ui.set_paso(12),
                        Err(f) => {
                            ui.set_error(f.codigo());
                            ui.set_paso(10);
                        }
                    }
                    // Desatendido: termina solo.
                    if automatico {
                        let _ = slint::quit_event_loop();
                    }
                });
            });
        });
    }
    ui.on_cerrar(|| {
        let _ = slint::quit_event_loop();
    });
    if a.automatico {
        ui.set_paso(11);
        ui.invoke_desinstalar();
    }
    ui.run()?;
    let codigo = *salida.lock().unwrap();
    if codigo != 0 {
        std::process::exit(codigo);
    }
    Ok(())
}
