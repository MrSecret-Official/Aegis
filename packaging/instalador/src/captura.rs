//! `--captura <carpeta>`: dibuja cada paso con el renderizador por software de Slint (el mismo que usa la ventana)
//! y lo guarda en PNG, en oscuro y en claro y a las escalas pedidas. Sirve para revisar la interfaz sin abrir la
//! ventana. El reloj de las animaciones lo lleva este módulo: se adelanta para que cada captura salga quieta.

use crate::{Instalador, T};
use slint::platform::software_renderer::{MinimalSoftwareWindow, RepaintBufferType};
use slint::Rgb8Pixel;
use slint::platform::{Key, Platform, WindowAdapter, WindowEvent};
use slint::ComponentHandle;
use std::cell::Cell;
use std::error::Error;
use std::path::Path;
use std::rc::Rc;
use std::time::Duration;

struct Plataforma {
    ventana: Rc<MinimalSoftwareWindow>,
    reloj: Rc<Cell<Duration>>,
}

impl Platform for Plataforma {
    fn create_window_adapter(&self) -> Result<Rc<dyn WindowAdapter>, slint::PlatformError> {
        Ok(self.ventana.clone())
    }
    fn duration_since_start(&self) -> Duration {
        self.reloj.get()
    }
}

/// Cada captura: nombre y cómo dejar la interfaz.
type Preparar = fn(&Instalador);

const PASOS: &[(&str, Preparar)] = &[
    ("01-bienvenida", |ui| ui.set_paso(0)),
    ("02-navegar", |ui| ui.set_paso(1)),
    ("02b-navegar-workflow", |ui| {
        ui.set_modo("workflow".into());
        ui.set_paso(1);
    }),
    // De serie: Estricto+ (el recomendado) y DuckDuckGo.
    ("03-escudos", |ui| {
        ui.set_modo("estandar".into());
        ui.set_paso(2);
    }),
    ("03b-escudos-estricto", |ui| {
        ui.set_escudos("estricto".into());
        ui.set_paso(2);
    }),
    ("03c-escudos-normal", |ui| {
        ui.set_escudos("normal".into());
        ui.set_paso(2);
    }),
    ("04-buscador", |ui| {
        ui.set_escudos("estricto_mas".into());
        ui.set_paso(3);
    }),
    ("04b-buscador-startpage", |ui| {
        ui.set_buscador("startpage".into());
        ui.set_paso(3);
    }),
    ("04c-buscador-brave", |ui| {
        ui.set_buscador("brave".into());
        ui.set_paso(3);
    }),
    ("04d-buscador-google", |ui| {
        ui.set_buscador("google".into());
        ui.set_paso(3);
    }),
    ("05-apariencia", |ui| {
        ui.set_buscador("duckduckgo".into());
        ui.set_paso(4);
    }),
    ("06-opciones", |ui| ui.set_paso(5)),
    ("07-instalando", |ui| {
        ui.set_progreso(0.62);
        ui.set_fase(1);
        ui.set_paso(6);
    }),
    ("07b-error", |ui| {
        ui.set_error(1);
        ui.set_error_mb(180);
        ui.set_paso(6);
    }),
    ("08-listo", |ui| {
        ui.set_error(0);
        ui.set_predeterminado(true);
        ui.set_paso(7);
    }),
    ("10-desinstalar", |ui| {
        ui.set_predeterminado(false);
        ui.set_paso(10);
    }),
    ("12-desinstalado", |ui| ui.set_paso(12)),
    // El resumen con otras elecciones (cada fila, con su valor).
    ("13-bienvenida-otras", |ui| {
        ui.set_modo("workflow".into());
        ui.set_escudos("estricto".into());
        ui.set_buscador("brave".into());
        ui.set_apariencia("claro".into());
        ui.set_paso(0);
    }),
];

/// Capturas con el teclado: el estado, y las teclas que se pulsan después (Tab, flechas…) para ver el anillo de foco
/// y el orden de Tab. Antes de cada una, el foco vuelve a la ventana.
const TECLADO: &[(&str, Preparar, &[Key])] = &[
    ("20-teclado-bienvenida-tab1", |ui| ui.set_paso(0), &[Key::Tab]),
    ("21-teclado-bienvenida-tab2", |ui| ui.set_paso(0), &[Key::Tab, Key::Tab]),
    ("22-teclado-navegar-tab2", |ui| ui.set_paso(1), &[Key::Tab, Key::Tab]),
    ("23-teclado-escudos-tab3", |ui| ui.set_paso(2), &[Key::Tab, Key::Tab, Key::Tab]),
    ("24-teclado-escudos-flecha-izquierda", |ui| ui.set_paso(2), &[Key::Tab, Key::Tab, Key::Tab, Key::LeftArrow]),
    ("25-teclado-buscador-tab3", |ui| ui.set_paso(3), &[Key::Tab, Key::Tab, Key::Tab]),
    ("26-teclado-buscador-flecha-abajo", |ui| ui.set_paso(3), &[Key::Tab, Key::Tab, Key::Tab, Key::DownArrow]),
    ("27-teclado-opciones-tab3", |ui| ui.set_paso(5), &[Key::Tab, Key::Tab, Key::Tab]),
    ("28-teclado-opciones-tab-hasta-instalar", |ui| ui.set_paso(5),
        &[Key::Tab, Key::Tab, Key::Tab, Key::Tab, Key::Tab, Key::Tab]),
    ("29-teclado-listo-tab2", |ui| ui.set_paso(7), &[Key::Tab, Key::Tab]),
];

/// Lo de serie (entre tandas: las capturas cambian las elecciones).
fn de_serie(ui: &Instalador) {
    ui.set_modo("estandar".into());
    ui.set_escudos("estricto_mas".into());
    ui.set_buscador("duckduckgo".into());
    ui.set_apariencia("auto".into());
    ui.set_error(0);
    ui.set_predeterminado(false);
}

pub fn capturar(carpeta: &Path, escalas: &[f32], idioma: &str, carpeta_destino: &str) -> Result<(), Box<dyn Error>> {
    std::fs::create_dir_all(carpeta)?;
    let ventana = MinimalSoftwareWindow::new(RepaintBufferType::NewBuffer);
    let reloj = Rc::new(Cell::new(Duration::ZERO));
    slint::platform::set_platform(Box::new(Plataforma { ventana: ventana.clone(), reloj: reloj.clone() }))
        .map_err(|e| format!("{e:?}"))?;

    let ui = Instalador::new()?;
    crate::elegir_idioma(idioma);
    ui.set_demo(false);
    ui.set_carpeta(carpeta_destino.into());
    ui.on_ruta_final(|elegida| crate::instalar::carpeta_final(&elegida).display().to_string().into());
    ui.show()?;

    for oscuro in [true, false] {
        ui.global::<T>().set_oscuro(oscuro);
        for &escala in escalas {
            let (ancho, alto) = ((960.0 * escala).round() as u32, (620.0 * escala).round() as u32);
            ventana.dispatch_event(WindowEvent::ScaleFactorChanged { scale_factor: escala });
            ventana.set_size(slint::PhysicalSize::new(ancho, alto));
            let mut px = vec![Rgb8Pixel { r: 0, g: 0, b: 0 }; (ancho * alto) as usize];
            // Varias vueltas: la primera arranca las animaciones; las siguientes, con el reloj adelantado, las acaban.
            let dibujar = |px: &mut Vec<Rgb8Pixel>| {
                for _ in 0..4 {
                    reloj.set(reloj.get() + Duration::from_millis(600));
                    slint::platform::update_timers_and_animations();
                    ventana.request_redraw();
                    ventana.draw_if_needed(|r| {
                        r.render(px, ancho as usize);
                    });
                }
            };
            let tema = if oscuro { "oscuro" } else { "claro" };
            for (nombre, preparar) in PASOS {
                preparar(&ui);
                dibujar(&mut px);
                guardar_png(&carpeta.join(format!("{tema}-{escala}x-{nombre}.png")), ancho, alto, &px)?;
            }
            de_serie(&ui);
            for (nombre, preparar, teclas) in TECLADO {
                preparar(&ui);
                dibujar(&mut px);
                ui.invoke_quitar_foco();
                for tecla in teclas.iter() {
                    let texto: slint::SharedString = (*tecla).into();
                    ventana.dispatch_event(WindowEvent::KeyPressed { text: texto.clone() });
                    ventana.dispatch_event(WindowEvent::KeyReleased { text: texto });
                    dibujar(&mut px);
                }
                guardar_png(&carpeta.join(format!("{tema}-{escala}x-{nombre}.png")), ancho, alto, &px)?;
            }
            // Vuelta al principio para la siguiente tanda.
            de_serie(&ui);
            ui.set_paso(0);
        }
    }
    Ok(())
}

fn guardar_png(ruta: &Path, ancho: u32, alto: u32, px: &[Rgb8Pixel]) -> Result<(), Box<dyn Error>> {
    let f = std::io::BufWriter::new(std::fs::File::create(ruta)?);
    let mut enc = png::Encoder::new(f, ancho, alto);
    enc.set_color(png::ColorType::Rgb);
    enc.set_depth(png::BitDepth::Eight);
    let mut w = enc.write_header()?;
    let datos: Vec<u8> = px.iter().flat_map(|p| [p.r, p.g, p.b]).collect();
    w.write_image_data(&datos)?;
    Ok(())
}
