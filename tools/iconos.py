#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
"""Aegis · genera los iconos de la marca a partir de branding/icono/*.svg.

Fuentes: branding/icono/aegis.svg (de 48 px en adelante) y aegis-pequeno.svg (16–32 px), el fantasma; el de la
navegación privada (el fantasma con candado), en branding/icono/privado/; los iconos alternativos que se eligen en
Ajustes, en branding/icono/alternos/ (uroboros.svg y uroboros-pequeno.svg).
Escribe los PNG e ICO de overlay/browser/branding/aegis/ que usa Windows (ejecutable, accesos, lista de saltos,
mosaicos del menú Inicio), los de la pantalla «Acerca de» y los del paquete MSIX de la Microsoft Store
(msix/Assets/: mismos nombres y tamaños que los de Firefox, porque el Resources.pri de su plantilla los cita así; ver
docs/TIENDA.md). Se ejecuta en WSL (necesita rsvg-convert, de librsvg, y Pillow):

    python3 tools/iconos.py

Los .icns de macOS y las imágenes del instalador NSIS no se generan: ni macOS ni NSIS se usan por ahora.
"""

import io
import os
import re
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FUENTE = RAIZ / "branding" / "icono"
MARCA = RAIZ / "overlay" / "browser" / "branding" / "aegis"

PEQUENO = 32  # hasta este tamaño se usa aegis-pequeno.svg
TAMANOS_ICO = [16, 24, 32, 48, 64, 128, 256]


def error(mensaje, codigo):
    print(f"✗ {mensaje}", file=sys.stderr)
    sys.exit(codigo)


def escribir(destino: Path, datos: bytes):
    """Escritura atómica: temporal en la misma carpeta y os.replace."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=destino.parent, prefix=".iconos-")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(datos)
        os.replace(tmp, destino)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise


def png(lado: int, ancho: int = 0, alto: int = 0, base: str = "aegis") -> bytes:
    """El icono de `lado` px como PNG; con ancho y alto, centrado en un lienzo de ese tamaño (transparente).
    Se dibuja a 4 veces el tamaño (al menos 512) y se reduce con Lanczos: con un icono tan detallado, dibujarlo
    directamente a 16–48 px deja bordes dentados."""
    carpeta = {"aegis": FUENTE, "privado": FUENTE / "privado"}.get(base, FUENTE / "alternos")
    svg = carpeta / (f"{base}-pequeno.svg" if lado <= PEQUENO else f"{base}.svg")
    grande = max(512, lado * 4)
    try:
        bruto = subprocess.run(["rsvg-convert", "-w", str(grande), "-h", str(grande), str(svg)], check=True,
                               capture_output=True).stdout
    except FileNotFoundError:
        error("falta rsvg-convert (paquete librsvg). Ejecútalo en WSL.", 2)
    except subprocess.CalledProcessError as e:
        error(f"rsvg-convert falló con {svg.name}: {e.stderr.decode(errors='replace').strip()}", 3)
    try:
        from PIL import Image
    except ImportError:
        error("falta Pillow (paquete python-pillow). Ejecútalo en WSL.", 2)
    icono = Image.open(io.BytesIO(bruto)).convert("RGBA").resize((lado, lado), Image.LANCZOS)
    lienzo = Image.new("RGBA", (ancho or lado, alto or lado), (0, 0, 0, 0))
    lienzo.paste(icono, (((ancho or lado) - lado) // 2, ((alto or lado) - lado) // 2))
    salida = io.BytesIO()
    lienzo.save(salida, "PNG", optimize=True)
    return salida.getvalue()


def fondo_loseta() -> str:
    """Color de la loseta (el primer <rect> de aegis.svg, #rrggbb): el de los mosaicos y el BackgroundColor del
    AppxManifest (tools/aegis.py lo lee igual). Una sola fuente: el SVG."""
    m = re.search(r'<rect\b[^>]*\bfill="(#[0-9a-fA-F]{6})"', (FUENTE / "aegis.svg").read_text(encoding="utf-8"))
    if not m:
        error("branding/icono/aegis.svg no tiene la loseta (<rect fill=\"#rrggbb\">)", 1)
    return m.group(1)


def mosaico(ancho: int, alto: int, factor: float = 0.8) -> bytes:
    """Mosaico del menú Inicio del paquete MSIX: la loseta negra a sangre (opaca: Windows redondea las esquinas) y el
    fantasma centrado. El fantasma es aegis.svg sin sus <rect> (la loseta y el filo), dibujado en un cuadrado de
    `factor` × el lado menor, para dejar sitio al nombre que Windows escribe abajo."""
    texto = (FUENTE / "aegis.svg").read_text(encoding="utf-8")
    fantasma, quitados = re.subn(r"<rect\b[^>]*/>", "", texto)
    if quitados != 2 or "<path" not in fantasma:
        error("aegis.svg ha cambiado (se esperaban la loseta, su filo y el fantasma): revisa mosaico()", 1)
    lado = round(min(ancho, alto) * factor)
    grande = max(512, lado * 4)
    try:
        bruto = subprocess.run(["rsvg-convert", "-w", str(grande), "-h", str(grande)], input=fantasma.encode("utf-8"),
                               check=True, capture_output=True).stdout
    except FileNotFoundError:
        error("falta rsvg-convert (paquete librsvg). Ejecútalo en WSL.", 2)
    except subprocess.CalledProcessError as e:
        error(f"rsvg-convert falló con el mosaico: {e.stderr.decode(errors='replace').strip()}", 3)
    try:
        from PIL import Image
    except ImportError:
        error("falta Pillow (paquete python-pillow). Ejecútalo en WSL.", 2)
    figura = Image.open(io.BytesIO(bruto)).convert("RGBA").resize((lado, lado), Image.LANCZOS)
    color = fondo_loseta()
    lienzo = Image.new("RGBA", (ancho, alto), tuple(int(color[i:i + 2], 16) for i in (1, 3, 5)) + (255,))
    lienzo.alpha_composite(figura, ((ancho - lado) // 2, (alto - lado) // 2))
    salida = io.BytesIO()
    lienzo.convert("RGB").save(salida, "PNG", optimize=True)
    return salida.getvalue()


# Assets del paquete MSIX (overlay/browser/branding/aegis/msix/Assets): los once de browser/branding/*/msix/Assets de
# Firefox, con sus nombres y tamaños en píxeles (todos a escala 200 o «targetsize»). Iconos: la loseta entera con
# transparencia alrededor, como el .ico; mosaicos: loseta a sangre (mosaico()).
MSIX_ICONOS = {
    "Square44x44Logo.scale-200.png": 88,
    "Square44x44Logo.targetsize-256.png": 256,
    "Square44x44Logo.altform-unplated_targetsize-256.png": 256,
    "Square44x44Logo.altform-lightunplated_targetsize-256.png": 256,
    "StoreLogo.scale-200.png": 100,
    "Document44x44.png": 44,
}
MSIX_MOSAICOS = {
    "Square150x150Logo.scale-200.png": (300, 300),
    "MedTile.scale-200.png": (300, 300),
    "SmallTile.scale-200.png": (142, 142),
    "LargeTile.scale-200.png": (620, 620),
    "Wide310x150Logo.scale-200.png": (620, 300),
}


def fondo_dmg() -> bytes:
    svg = b"""<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="880" viewBox="0 0 1440 880">
  <defs><radialGradient id="h" cx="0.5" cy="0.42" r="0.6">
    <stop offset="0" stop-color="#1a1a1d"/><stop offset="1" stop-color="#0a0a0b"/></radialGradient></defs>
  <rect width="1440" height="880" fill="url(#h)"/>
  <path d="M640 400h150m-22-22 22 22-22 22" fill="none" stroke="#a1a1aa" stroke-width="4" stroke-linecap="round"
        stroke-linejoin="round"/>
</svg>"""
    try:
        return subprocess.run(["rsvg-convert", "-f", "png"], input=svg, check=True, capture_output=True).stdout
    except FileNotFoundError:
        error("falta rsvg-convert (paquete librsvg). Ejecútalo en WSL.", 2)
    except subprocess.CalledProcessError as e:
        error(f"rsvg-convert falló con el fondo del .dmg: {e.stderr.decode(errors='replace').strip()}", 3)


def ico(tamanos, base="aegis") -> bytes:
    """ICO con una imagen PNG por tamaño (formato admitido desde Windows Vista)."""
    imagenes = [(t, png(t, base=base)) for t in tamanos]
    cabecera = struct.pack("<HHH", 0, 1, len(imagenes))
    directorio = b""
    datos = b""
    desplazamiento = 6 + 16 * len(imagenes)
    for lado, contenido in imagenes:
        directorio += struct.pack("<BBBBHHII", lado % 256, lado % 256, 0, 0, 1, 32, len(contenido),
                                  desplazamiento + len(datos))
        datos += contenido
    return cabecera + directorio + datos


def main():
    for svg in ("aegis.svg", "aegis-pequeno.svg", "privado/privado.svg", "privado/privado-pequeno.svg",
                "alternos/uroboros.svg", "alternos/uroboros-pequeno.svg"):
        if not (FUENTE / svg).is_file():
            error(f"no existe branding/icono/{svg}", 1)

    salida = {}
    for lado in (16, 22, 24, 32, 48, 64, 128, 256):
        salida[f"default{lado}.png"] = png(lado)
    icono = ico(TAMANOS_ICO)
    for nombre in ("firefox.ico", "firefox64.ico", "document.ico", "document_pdf.ico", "newtab.ico",
                   "newwindow.ico"):
        salida[nombre] = icono
    # Navegación privada (modo incógnito): el fantasma con candado (branding/icono/privado/).
    salida["pbmode.ico"] = ico(TAMANOS_ICO, "privado")
    # Iconos alternativos que se eligen en Ajustes › Apariencia (branding/icono/alternos/).
    for alterno in ("uroboros",):
        salida[f"alternos/{alterno}.ico"] = ico(TAMANOS_ICO, alterno)
        salida[f"alternos/{alterno}-64.png"] = png(64, base=alterno)
    # Mosaicos del menú Inicio (VisualElements): el icono centrado con margen, como pide Windows.
    salida["VisualElements_70.png"] = png(96, 142, 142)
    salida["VisualElements_150.png"] = png(200, 300, 300)
    salida["PrivateBrowsing_70.png"] = png(96, 142, 142, "privado")
    salida["PrivateBrowsing_150.png"] = png(200, 300, 300, "privado")
    # Pantalla «Acerca de» y páginas internas.
    for nombre, lado, base in (("about-logo.png", 192, "aegis"), ("about-logo@2x.png", 384, "aegis"),
                               ("about-logo-private.png", 192, "privado"),
                               ("about-logo-private@2x.png", 384, "privado")):
        salida[f"content/{nombre}"] = png(lado, base=base)
    salida["content/about.png"] = png(160, 300, 236)
    salida["content/about-logo.svg"] = (FUENTE / "aegis.svg").read_bytes()
    # Fondo de la ventana del instalador de macOS (.dmg). Aegis no se publica para macOS, pero así no queda la imagen
    # de Nightly: negro con un halo gris muy suave y una flecha fina, monocromo.
    salida["background.png"] = fondo_dmg()
    # Paquete MSIX (Microsoft Store): sin ningún asset de Firefox o Nightly en msix/Assets.
    for nombre, lado in MSIX_ICONOS.items():
        salida[f"msix/Assets/{nombre}"] = png(lado)
    for nombre, (ancho, alto) in MSIX_MOSAICOS.items():
        salida[f"msix/Assets/{nombre}"] = mosaico(ancho, alto)
    sobran = sorted(set(p.name for p in (MARCA / "msix" / "Assets").glob("*")) -
                    set(MSIX_ICONOS) - set(MSIX_MOSAICOS))
    if sobran:
        error(f"msix/Assets tiene archivos que Firefox no usa (Resources.pri no los cita): {', '.join(sobran)}", 1)

    for nombre, datos in salida.items():
        destino = MARCA / nombre
        if destino.is_file() and destino.read_bytes() == datos:
            continue
        escribir(destino, datos)
        print(f"  {nombre}")
    print(f"✓ {len(salida)} iconos en overlay/browser/branding/aegis/")


if __name__ == "__main__":
    main()
