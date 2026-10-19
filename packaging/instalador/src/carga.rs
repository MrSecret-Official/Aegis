//! La carga: el navegador comprimido (el zip de `aegis.py package`) que va pegado al final del ejecutable.
//!
//! Formato (todo en el propio .exe, sin archivos aparte):
//!
//! ```text
//! [ instalador | carga (zip) | cola de 64 bytes ]
//! cola = "AEGIS-CARGA-v1\0\0" (16) | desplazamiento u64 LE (8) | longitud u64 LE (8) | SHA-256 de la carga (32)
//! ```
//!
//! Antes de descomprimir se comprueba la suma de toda la carga. Sin cola, el instalador funciona en modo
//! demostración. Para pruebas, `--carga <zip>` usa un zip suelto (su suma se calcula y no se compara con nada).

use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::{self, BufReader, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};

pub const MAGIA: &[u8; 16] = b"AEGIS-CARGA-v1\0\0";
pub const COLA: u64 = 64;

#[derive(Clone, Debug)]
pub struct Carga {
    pub archivo: PathBuf,
    pub desplazamiento: u64,
    pub longitud: u64,
    /// Suma esperada (None con `--carga`, que no la trae).
    pub sha256: Option<[u8; 32]>,
}

/// Lector de un tramo de un archivo (la carga dentro del .exe), con su propia posición.
pub struct Tramo {
    f: File,
    ini: u64,
    len: u64,
    pos: u64,
}

impl Tramo {
    pub fn abrir(c: &Carga) -> io::Result<Self> {
        Ok(Tramo { f: File::open(&c.archivo)?, ini: c.desplazamiento, len: c.longitud, pos: 0 })
    }
}

impl Read for Tramo {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        let resto = self.len.saturating_sub(self.pos);
        if resto == 0 || buf.is_empty() {
            return Ok(0);
        }
        let n = (buf.len() as u64).min(resto) as usize;
        self.f.seek(SeekFrom::Start(self.ini + self.pos))?;
        let leidos = self.f.read(&mut buf[..n])?;
        self.pos += leidos as u64;
        Ok(leidos)
    }
}

impl Seek for Tramo {
    fn seek(&mut self, p: SeekFrom) -> io::Result<u64> {
        let nueva = match p {
            SeekFrom::Start(n) => n as i128,
            SeekFrom::End(n) => self.len as i128 + n as i128,
            SeekFrom::Current(n) => self.pos as i128 + n as i128,
        };
        if nueva < 0 {
            return Err(io::Error::new(io::ErrorKind::InvalidInput, "posición negativa"));
        }
        self.pos = nueva as u64;
        Ok(self.pos)
    }
}

impl Carga {
    /// Busca la carga: la de `--carga` si se da; si no, la pegada al ejecutable. None: modo demostración.
    pub fn buscar(suelta: Option<&Path>) -> io::Result<Option<Carga>> {
        if let Some(z) = suelta {
            let longitud = std::fs::metadata(z)?.len();
            return Ok(Some(Carga { archivo: z.to_path_buf(), desplazamiento: 0, longitud, sha256: None }));
        }
        let exe = std::env::current_exe()?;
        Ok(leer_cola(&exe)?.map(|(desplazamiento, longitud, sha)| Carga {
            archivo: exe,
            desplazamiento,
            longitud,
            sha256: Some(sha),
        }))
    }

    /// Tamaño descomprimido total (para el espacio libre y la barra de progreso).
    pub fn tamano_descomprimido(&self) -> io::Result<u64> {
        let mut zip = zip::ZipArchive::new(BufReader::new(Tramo::abrir(self)?)).map_err(io::Error::other)?;
        let mut total = 0;
        for i in 0..zip.len() {
            total += zip.by_index(i).map_err(io::Error::other)?.size();
        }
        Ok(total)
    }

    /// Comprueba la suma SHA-256 de toda la carga. `avance` recibe la fracción leída (0..1).
    pub fn verificar(&self, avance: &mut dyn FnMut(f32)) -> io::Result<bool> {
        let Some(esperada) = self.sha256 else {
            return Ok(true);
        };
        let mut t = Tramo::abrir(self)?;
        let mut h = Sha256::new();
        let mut buf = vec![0u8; 1 << 20];
        let mut leidos = 0u64;
        loop {
            let n = t.read(&mut buf)?;
            if n == 0 {
                break;
            }
            h.update(&buf[..n]);
            leidos += n as u64;
            avance(leidos as f32 / self.longitud.max(1) as f32);
        }
        Ok(h.finalize().as_slice() == esperada.as_slice())
    }
}

/// Lee la cola del ejecutable: (desplazamiento, longitud, sha256), si la hay y es coherente.
fn leer_cola(exe: &Path) -> io::Result<Option<(u64, u64, [u8; 32])>> {
    let mut f = File::open(exe)?;
    let total = f.metadata()?.len();
    if total < COLA {
        return Ok(None);
    }
    f.seek(SeekFrom::Start(total - COLA))?;
    let mut cola = [0u8; COLA as usize];
    f.read_exact(&mut cola)?;
    if &cola[..16] != MAGIA {
        return Ok(None);
    }
    let desplazamiento = u64::from_le_bytes(cola[16..24].try_into().unwrap());
    let longitud = u64::from_le_bytes(cola[24..32].try_into().unwrap());
    let mut sha = [0u8; 32];
    sha.copy_from_slice(&cola[32..64]);
    if desplazamiento.checked_add(longitud) != Some(total - COLA) {
        return Err(io::Error::new(io::ErrorKind::InvalidData, "cola de la carga incoherente"));
    }
    Ok(Some((desplazamiento, longitud, sha)))
}

/// Longitud del instalador sin la carga (para copiarlo como desinstalador).
pub fn longitud_sin_carga(exe: &Path) -> io::Result<u64> {
    Ok(match leer_cola(exe)? {
        Some((desplazamiento, _, _)) => desplazamiento,
        None => std::fs::metadata(exe)?.len(),
    })
}

/// `--anadir-carga <zip> --salida <exe>`: escribe `salida` = este instalador (sin carga) + zip + cola.
pub fn anadir(zip: &Path, salida: &Path) -> io::Result<()> {
    let exe = std::env::current_exe()?;
    let base = longitud_sin_carga(&exe)?;
    let tmp = salida.with_extension("parcial");
    {
        let mut out = io::BufWriter::new(File::create(&tmp)?);
        io::copy(&mut File::open(&exe)?.take(base), &mut out)?;
        let mut h = Sha256::new();
        let mut z = File::open(zip)?;
        let mut buf = vec![0u8; 1 << 20];
        let mut longitud = 0u64;
        loop {
            let n = z.read(&mut buf)?;
            if n == 0 {
                break;
            }
            h.update(&buf[..n]);
            out.write_all(&buf[..n])?;
            longitud += n as u64;
        }
        // Debe ser un zip válido: mejor fallar aquí que en el equipo de alguien.
        zip::ZipArchive::new(BufReader::new(File::open(zip)?)).map_err(io::Error::other)?;
        out.write_all(MAGIA)?;
        out.write_all(&base.to_le_bytes())?;
        out.write_all(&longitud.to_le_bytes())?;
        out.write_all(h.finalize().as_slice())?;
        out.flush()?;
    }
    std::fs::rename(&tmp, salida)
}
