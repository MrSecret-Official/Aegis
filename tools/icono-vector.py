#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
"""Aegis · icono en vector a partir de una ilustración en blanco sobre negro (Ouroboros.jpg).

Recorta el anillo, lo traza con potrace (blancos del grabado → curvas) y le pone el desvanecido de espectro con una
máscara de cuñas. Escribe <nombre>.svg y <nombre>-pequeno.svg en la carpeta indicada. En WSL (necesita potrace y Pillow):

    python3 tools/icono-vector.py Ouroboros.jpg branding/icono/alternos uroboros
    python3 tools/iconos.py
"""
import math
import os
import re
import subprocess
import sys
import tempfile

from PIL import Image, ImageFilter, ImageOps



def error(mensaje, codigo):
    print(f"✗ {mensaje}", file=sys.stderr)
    sys.exit(codigo)


if len(sys.argv) not in (3, 4):
    error("uso: icono-vector.py <imagen> <carpeta de salida> [nombre]", 2)
origen, destino_dir = sys.argv[1], sys.argv[2]
nombre_base = sys.argv[3] if len(sys.argv) > 3 else "uroboros"
if not os.path.isfile(origen):
    error(f"no existe la imagen {origen}", 1)
if not os.path.isdir(destino_dir):
    error(f"no existe la carpeta {destino_dir}", 1)
LADO = 2400


def preparar(grueso):
    img = ImageOps.grayscale(Image.open(origen))
    x0, y0, x1, y1 = img.point(lambda v: 255 if v > 90 else 0).getbbox()
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    lado = max(x1 - x0, y1 - y0)
    img = img.crop((round(cx - lado / 2), round(cy - lado / 2), round(cx + lado / 2), round(cy + lado / 2)))
    # Ampliada con suavizado antes de umbralizar: los bordes de las escamas salen como curvas limpias y no como las
    # escaleras de píxeles (y el ruido JPEG) de la imagen original, que es pequeña.
    img = img.resize((LADO, LADO), Image.BICUBIC).filter(ImageFilter.GaussianBlur(LADO / 1100))
    if grueso:
        img = img.filter(ImageFilter.MaxFilter(25)).filter(ImageFilter.GaussianBlur(7))
        return img.point(lambda v: 0 if v > 110 else 255).convert("1")
    # potrace traza lo negro: invertimos (los blancos del grabado pasan a ser la forma)
    return img.point(lambda v: 0 if v > 118 else 255).convert("1")


def ejecutar_potrace(orden, check=True):
    try:
        return subprocess.run(orden, check=check, capture_output=True)
    except FileNotFoundError:
        error("falta potrace (paquete potrace). Ejecútalo en WSL.", 2)
    except subprocess.CalledProcessError as e:
        error(f"potrace falló: {e.stderr.decode(errors='replace').strip()}", 3)


def escribir(destino, texto):
    """Escritura atómica: temporal en la misma carpeta y os.replace."""
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(os.path.abspath(destino)), prefix=".icono-")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
            f.write(texto)
        os.replace(tmp, destino)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def trazar(bitmap, turd):
    with tempfile.TemporaryDirectory() as d:
        bitmap.save(f"{d}/a.pbm")
        ejecutar_potrace(["potrace", "-s", "-t", str(turd), "-O", "0.2", "-a", "0.9", "--flat", "-o", f"{d}/a.svg",
                        f"{d}/a.pbm"], check=True)
        svg = open(f"{d}/a.svg", encoding="utf-8").read()
    g = re.search(r"<g transform=\"([^\"]+)\"[^>]*>(.*?)</g>", svg, re.S)
    caminos = re.findall(r'd="([^"]+)"', g.group(2))
    return g.group(1), " ".join(" ".join(c.split()) for c in caminos)


def mascara():
    """Cuñas de 0,5° (sin escalones a la vista) con el brillo del desvanecido: 1 en la cabeza y la boca, 0,3 en la cola (entra por la derecha)."""
    COLA, CABEZA = -38.0, -82.0
    recorrido = (CABEZA - COLA) % 360
    c = LADO / 2
    r = LADO
    partes = []
    for i in range(720):
        a0, a1 = -180 + i * 0.5, -180 + (i + 1) * 0.5 + 0.3
        am = (a0 + a1 - 0.3) / 2
        t = ((am - COLA) % 360) / recorrido
        if t > 1:
            g = ((COLA - am) % 360) / 40
            f = 1.0 if g >= 1 else 0.3 + 0.7 * (g * g * (3 - 2 * g))
        else:
            f = 0.3 + 0.7 * (t ** 0.8)
        v = round(255 * f)
        p0 = (c + r * math.cos(math.radians(a0)), c + r * math.sin(math.radians(a0)))
        p1 = (c + r * math.cos(math.radians(a1)), c + r * math.sin(math.radians(a1)))
        partes.append(f'<path fill="#{v:02x}{v:02x}{v:02x}" d="M{c} {c}L{p0[0]:.1f} {p0[1]:.1f}L{p1[0]:.1f} {p1[1]:.1f}Z"/>')
    return "\n      ".join(partes)


LOSETA = ('<rect width="256" height="256" rx="52" fill="#0a0a0b"/>\n'
          '  <rect x="1" y="1" width="254" height="254" rx="51" fill="none" stroke="#ffffff" stroke-opacity="0.10" '
          'stroke-width="2"/>')

for nombre, grueso, turd, margen, nota in (
        (f"{nombre_base}.svg", False, 12, 30, "trazado en vector desde la imagen del usuario (Ouroboros.jpg) con potrace"),
        (f"{nombre_base}-pequeno.svg", True, 120, 22, "versión de 16–32 px: el mismo trazo con los blancos ensanchados")):
    transformacion, d = trazar(preparar(grueso), turd)
    tam = 256 - 2 * margen
    svg = f"""<!-- Aegis · icono de la app (DISENO §8): uróboros en espectro, {nota}. Loseta negra de radio 52 con filo;
     la serpiente se apaga hacia la cola, que entra en la boca (máscara de cuñas con el brillo del desvanecido).
     Icono alternativo (Ajustes › Apariencia); tools/iconos.py genera su ICO. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  {LOSETA}
  <svg x="{margen}" y="{margen}" width="{tam}" height="{tam}" viewBox="0 0 {LADO} {LADO}">
    <mask id="espectro" maskUnits="userSpaceOnUse" x="0" y="0" width="{LADO}" height="{LADO}">
      {mascara()}
    </mask>
    <g mask="url(#espectro)">
      <g transform="{transformacion}" fill="#f4f4f5" fill-rule="evenodd">
        <path d="{d}"/>
      </g>
    </g>
  </svg>
</svg>
"""
    escribir(os.path.join(destino_dir, nombre), svg)
    print(nombre, round(len(svg) / 1024), "KB")
