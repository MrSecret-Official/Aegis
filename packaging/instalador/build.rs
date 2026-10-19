//! Compila la interfaz (ui/*.slint, con las traducciones dentro) y, para Windows, los recursos del ejecutable:
//! icono, manifiesto (asInvoker: sin UAC aunque se llame «setup»; PerMonitorV2) e información de versión.

use std::path::PathBuf;
use std::process::Command;

fn main() {
    let config = slint_build::CompilerConfiguration::new()
        .with_bundled_translations("traducciones")
        .with_default_translation_context(slint_build::DefaultTranslationContext::None);
    slint_build::compile_with_config("ui/instalador.slint", config).expect("no se pudo compilar ui/instalador.slint");

    println!("cargo:rerun-if-changed=assets/aegis-setup.rc");
    println!("cargo:rerun-if-changed=assets/aegis-setup.manifest");
    println!("cargo:rerun-if-changed=assets/aegis.ico");
    let objetivo = std::env::var("TARGET").unwrap_or_default();
    if objetivo.ends_with("windows-gnu") {
        let assets = PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap()).join("assets");
        let salida = PathBuf::from(std::env::var("OUT_DIR").unwrap()).join("recursos.o");
        let windres = std::env::var("WINDRES").unwrap_or_else(|_| "x86_64-w64-mingw32-windres".into());
        let estado = Command::new(&windres)
            .current_dir(&assets)
            .args(["--input-format=rc", "--output-format=coff", "--codepage=65001", "-i", "aegis-setup.rc", "-o"])
            .arg(&salida)
            .status()
            .unwrap_or_else(|e| panic!("no se pudo ejecutar {windres}: {e} (instala mingw-w64-binutils)"));
        assert!(estado.success(), "{windres} falló");
        println!("cargo:rustc-link-arg-bins={}", salida.display());
    }
}
