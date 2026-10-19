//! Lo que se pide a Windows: tema, idioma, carpetas conocidas, espacio libre, registro (HKCU), accesos directos
//! y abrir la página de aplicaciones predeterminadas. Fuera de Windows (pruebas y capturas en Linux) hay
//! sustitutos inocuos. Nada de esto abre conexiones de red.

use std::io;
use std::path::{Path, PathBuf};

/// Carpeta de instalación de serie: %LOCALAPPDATA%\Programs\Aegis (por usuario, sin UAC).
pub fn carpeta_de_serie() -> PathBuf {
    match std::env::var_os("LOCALAPPDATA") {
        Some(base) => PathBuf::from(base).join("Programs").join("Aegis"),
        None => PathBuf::from(r"C:\Aegis"),
    }
}

#[cfg(windows)]
mod win {
    use super::*;
    use std::ffi::{c_void, OsString};
    use std::os::windows::ffi::{OsStrExt, OsStringExt};
    use std::ptr::{null, null_mut};
    use windows_sys::Win32::Foundation::{ERROR_FILE_NOT_FOUND, ERROR_SUCCESS};
    use windows_sys::Win32::Globalization::{GetUserDefaultLocaleName, GetUserPreferredUILanguages, MUI_LANGUAGE_NAME};
    use windows_sys::Win32::Storage::FileSystem::{GetDiskFreeSpaceExW, MoveFileExW, MOVEFILE_DELAY_UNTIL_REBOOT};
    use windows_sys::Win32::System::Com::CoTaskMemFree;
    use windows_sys::Win32::System::Registry::{
        RegCloseKey, RegCreateKeyExW, RegDeleteKeyValueW, RegDeleteTreeW, RegGetValueW, RegSetValueExW, HKEY, HKEY_CURRENT_USER,
        KEY_WRITE, REG_DWORD, REG_OPTION_NON_VOLATILE, REG_SZ, RRF_RT_REG_DWORD,
    };
    use windows_sys::Win32::UI::HiDpi::GetDpiForSystem;
    use windows_sys::Win32::UI::Shell::{
        FOLDERID_Desktop, FOLDERID_Programs, SHChangeNotify, SHGetKnownFolderPath, ShellExecuteW, SHCNE_ASSOCCHANGED,
        SHCNF_IDLIST,
    };
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        SystemParametersInfoW, SPI_GETCLIENTAREAANIMATION, SPI_GETWORKAREA, SW_SHOWNORMAL,
    };
    use windows_sys::Win32::Foundation::RECT;

    /// Texto UTF-16 terminado en cero.
    pub fn w(s: impl AsRef<std::ffi::OsStr>) -> Vec<u16> {
        s.as_ref().encode_wide().chain(std::iter::once(0)).collect()
    }

    pub fn tema_oscuro() -> bool {
        let clave = w(r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize");
        let valor = w("AppsUseLightTheme");
        let mut dato: u32 = 1;
        let mut tam = std::mem::size_of::<u32>() as u32;
        let r = unsafe {
            RegGetValueW(
                HKEY_CURRENT_USER,
                clave.as_ptr(),
                valor.as_ptr(),
                RRF_RT_REG_DWORD,
                null_mut(),
                &mut dato as *mut u32 as *mut c_void,
                &mut tam,
            )
        };
        // Sin el valor (Windows antiguo o configuración rara): oscuro, la referencia.
        r != ERROR_SUCCESS || dato == 0
    }

    /// El idioma en que se ve Windows (el primero de los preferidos para la interfaz), no el de los formatos
    /// regionales: con Windows en inglés y fechas a la española, el idioma es el inglés. Sin él, el de los formatos.
    pub fn idioma_sistema() -> String {
        let (mut num, mut tam) = (0u32, 0u32);
        if unsafe { GetUserPreferredUILanguages(MUI_LANGUAGE_NAME, &mut num, null_mut(), &mut tam) } != 0 && tam > 1 {
            let mut lista = vec![0u16; tam as usize];
            if unsafe { GetUserPreferredUILanguages(MUI_LANGUAGE_NAME, &mut num, lista.as_mut_ptr(), &mut tam) } != 0 {
                let fin = lista.iter().position(|&c| c == 0).unwrap_or(lista.len());
                if fin > 0 {
                    return String::from_utf16_lossy(&lista[..fin]);
                }
            }
        }
        let mut buf = [0u16; 85];
        let n = unsafe { GetUserDefaultLocaleName(buf.as_mut_ptr(), buf.len() as i32) };
        if n <= 1 {
            return String::new();
        }
        String::from_utf16_lossy(&buf[..(n - 1) as usize])
    }

    fn carpeta_conocida(id: &windows_sys::core::GUID) -> Option<PathBuf> {
        let mut p: windows_sys::core::PWSTR = null_mut();
        let r = unsafe { SHGetKnownFolderPath(id, 0, null_mut(), &mut p) };
        if r != 0 || p.is_null() {
            return None;
        }
        let mut n = 0;
        while unsafe { *p.add(n) } != 0 {
            n += 1;
        }
        let s = OsString::from_wide(unsafe { std::slice::from_raw_parts(p, n) });
        unsafe { CoTaskMemFree(p as *const c_void) };
        Some(PathBuf::from(s))
    }

    pub fn escritorio() -> Option<PathBuf> {
        carpeta_conocida(&FOLDERID_Desktop)
    }

    pub fn programas_menu_inicio() -> Option<PathBuf> {
        carpeta_conocida(&FOLDERID_Programs)
    }

    pub fn espacio_libre(ruta: &Path) -> Option<u64> {
        // La carpeta puede no existir aún: se mira la primera que exista hacia arriba.
        let mut r = Some(ruta);
        while let Some(p) = r {
            if p.exists() {
                let mut libre: u64 = 0;
                let ok = unsafe { GetDiskFreeSpaceExW(w(p).as_ptr(), &mut libre, null_mut(), null_mut()) };
                return if ok != 0 { Some(libre) } else { None };
            }
            r = p.parent();
        }
        None
    }

    /// Posición para centrar una ventana de `ancho` × `alto` lógicos en la zona de trabajo de la pantalla principal.
    pub fn posicion_centrada(ancho: f64, alto: f64) -> Option<(i32, i32)> {
        let mut zona = RECT { left: 0, top: 0, right: 0, bottom: 0 };
        let ok = unsafe { SystemParametersInfoW(SPI_GETWORKAREA, 0, &mut zona as *mut RECT as *mut c_void, 0) };
        if ok == 0 {
            return None;
        }
        let escala = unsafe { GetDpiForSystem() } as f64 / 96.0;
        let (a, h) = ((ancho * escala) as i32, (alto * escala) as i32);
        let x = zona.left + ((zona.right - zona.left) - a).max(0) / 2;
        let y = zona.top + ((zona.bottom - zona.top) - h).max(0) / 2;
        Some((x, y))
    }

    /// «Efectos de animación» de Windows (Accesibilidad › Efectos visuales). Apagado: cambios instantáneos (DISENO §7).
    pub fn animaciones() -> bool {
        let mut activas: i32 = 1;
        let ok = unsafe {
            SystemParametersInfoW(SPI_GETCLIENTAREAANIMATION, 0, &mut activas as *mut i32 as *mut c_void, 0)
        };
        ok == 0 || activas != 0
    }

    pub fn borrar_al_reiniciar(ruta: &Path) {
        unsafe { MoveFileExW(w(ruta).as_ptr(), null(), MOVEFILE_DELAY_UNTIL_REBOOT) };
    }

    pub fn abrir_uri(uri: &str) {
        unsafe {
            ShellExecuteW(null_mut(), w("open").as_ptr(), w(uri).as_ptr(), null(), null(), SW_SHOWNORMAL);
        }
    }

    pub enum Valor<'a> {
        Texto(&'a str),
        Numero(u32),
    }

    /// Escribe un valor en HKCU\`ruta` (crea la clave si hace falta). `nombre` None es el valor por defecto.
    pub fn registro(ruta: &str, nombre: Option<&str>, valor: Valor) -> io::Result<()> {
        let mut clave: HKEY = null_mut();
        let r = unsafe {
            RegCreateKeyExW(
                HKEY_CURRENT_USER,
                w(ruta).as_ptr(),
                0,
                null(),
                REG_OPTION_NON_VOLATILE,
                KEY_WRITE,
                null(),
                &mut clave,
                null_mut(),
            )
        };
        if r != ERROR_SUCCESS {
            return Err(io::Error::from_raw_os_error(r as i32));
        }
        let nombre_w = nombre.map(w);
        let pnombre = nombre_w.as_ref().map_or(null(), |v| v.as_ptr());
        let r = match valor {
            Valor::Texto(t) => {
                let d = w(t);
                unsafe { RegSetValueExW(clave, pnombre, 0, REG_SZ, d.as_ptr() as *const u8, (d.len() * 2) as u32) }
            }
            Valor::Numero(n) => unsafe {
                RegSetValueExW(clave, pnombre, 0, REG_DWORD, &n as *const u32 as *const u8, 4)
            },
        };
        unsafe { RegCloseKey(clave) };
        if r != ERROR_SUCCESS {
            return Err(io::Error::from_raw_os_error(r as i32));
        }
        Ok(())
    }

    /// Borra HKCU\`ruta` con todo lo que tenga dentro (no es error que no exista).
    pub fn borrar_registro(ruta: &str) -> io::Result<()> {
        let r = unsafe { RegDeleteTreeW(HKEY_CURRENT_USER, w(ruta).as_ptr()) };
        if r != ERROR_SUCCESS && r != ERROR_FILE_NOT_FOUND {
            return Err(io::Error::from_raw_os_error(r as i32));
        }
        Ok(())
    }

    /// Borra el valor `nombre` de HKCU\`ruta` (no es error que no exista).
    pub fn borrar_valor_registro(ruta: &str, nombre: &str) -> io::Result<()> {
        let r = unsafe { RegDeleteKeyValueW(HKEY_CURRENT_USER, w(ruta).as_ptr(), w(nombre).as_ptr()) };
        if r != ERROR_SUCCESS && r != ERROR_FILE_NOT_FOUND {
            return Err(io::Error::from_raw_os_error(r as i32));
        }
        Ok(())
    }

    /// Avisa al Explorador de que han cambiado las asociaciones (iconos y «Abrir con»).
    pub fn avisar_asociaciones() {
        unsafe { SHChangeNotify(SHCNE_ASSOCCHANGED as i32, SHCNF_IDLIST, null(), null()) };
    }

    pub fn acceso_directo(destino: &Path, exe: &Path, descripcion: &str) -> io::Result<()> {
        let mut enlace = mslnk::ShellLink::new(exe).map_err(|e| io::Error::other(format!("{e:?}")))?;
        enlace.set_working_dir(exe.parent().map(|p| p.to_string_lossy().into_owned()));
        enlace.set_name(Some(descripcion.to_string()));
        enlace.set_icon_location(Some(exe.to_string_lossy().into_owned()));
        enlace.create_lnk(destino).map_err(|e| io::Error::other(format!("{e:?}")))
    }
}

#[cfg(windows)]
pub use win::*;

#[cfg(not(windows))]
mod otro {
    use super::*;
    pub fn tema_oscuro() -> bool {
        true
    }
    pub fn idioma_sistema() -> String {
        std::env::var("LANG").unwrap_or_default().split('.').next().unwrap_or("").replace('_', "-")
    }
    pub fn escritorio() -> Option<PathBuf> {
        None
    }
    pub fn programas_menu_inicio() -> Option<PathBuf> {
        None
    }
    pub fn espacio_libre(_ruta: &Path) -> Option<u64> {
        None
    }
    pub fn abrir_uri(_uri: &str) {}
    pub fn animaciones() -> bool {
        true
    }
    pub fn borrar_al_reiniciar(_ruta: &Path) {}
    pub enum Valor<'a> {
        Texto(&'a str),
        Numero(u32),
    }
    pub fn registro(_ruta: &str, _nombre: Option<&str>, _valor: Valor) -> io::Result<()> {
        Ok(())
    }
    pub fn borrar_registro(_ruta: &str) -> io::Result<()> {
        Ok(())
    }
    pub fn borrar_valor_registro(_ruta: &str, _nombre: &str) -> io::Result<()> {
        Ok(())
    }
    pub fn avisar_asociaciones() {}
    pub fn acceso_directo(_destino: &Path, _exe: &Path, _descripcion: &str) -> io::Result<()> {
        Ok(())
    }
}

#[cfg(not(windows))]
pub use otro::*;
