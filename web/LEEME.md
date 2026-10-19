# Web de Aegis (privacidad y aviso legal)

Fuente de la web pública de Aegis: HTML y CSS estáticos, sin JavaScript, sin cookies, sin analítica y sin nada de
terceros (Inter se sirve desde `fuentes/`). Se publica en GitHub Pages desde el repositorio público
`MrSecret-Official/Aegis`.

## Páginas y direcciones

| Página | Archivo | Dirección publicada |
|---|---|---|
| Portada (es) | `index.html` | https://mrsecret-official.github.io/Aegis/ |
| Política de privacidad (es) | `privacidad/index.html` | https://mrsecret-official.github.io/Aegis/privacidad/ |
| Aviso legal (es) | `legal/index.html` | https://mrsecret-official.github.io/Aegis/legal/ |
| Portada (en) | `en/index.html` | https://mrsecret-official.github.io/Aegis/en/ |
| Privacy policy (en) | `en/privacy/index.html` | https://mrsecret-official.github.io/Aegis/en/privacy/ |
| Legal notice (en) | `en/legal/index.html` | https://mrsecret-official.github.io/Aegis/en/legal/ |
| Página no encontrada | `404.html` | cualquier dirección que no exista bajo `/Aegis/` |

En la ficha de la Microsoft Store (Partner Center › Propiedades › Política de privacidad) va
`https://mrsecret-official.github.io/Aegis/privacidad/`; en la ficha en inglés, si la pide aparte,
`https://mrsecret-official.github.io/Aegis/en/privacy/`. Es la misma dirección que da `docs/TIENDA.md` (§5,
«Propiedades»).

## Cómo se publica

Propuesta: una rama `gh-pages` en el repositorio público, solo con el contenido de esta carpeta en la raíz. Así la web
no se mezcla con lo demás del repositorio (`main`, releases) y su historial guarda las versiones anteriores de la
política, como dicen las propias páginas.

1. Copia el contenido de `web/` (también `.nojekyll`; `LEEME.md` no hace falta) a la raíz de la rama `gh-pages`:

   ```bash
   git clone https://github.com/MrSecret-Official/Aegis.git aegis-web
   cd aegis-web
   git switch --orphan gh-pages          # solo la primera vez; después: git switch gh-pages
   cp -r <ruta>/Aegis/web/. .
   rm LEEME.md
   git add -A
   git commit -m "Web: privacidad y aviso legal"
   git push -u origin gh-pages
   ```

2. En GitHub: el repositorio › Settings › Pages › Build and deployment › Source: **Deploy from a branch**; Branch:
   **gh-pages**, carpeta **/ (root)** › Save. «Enforce HTTPS» queda marcado (en `github.io` es obligatorio).
3. En uno o dos minutos la web está en https://mrsecret-official.github.io/Aegis/.

`.nojekyll` hace que GitHub sirva los archivos tal cual, sin pasarlos por Jekyll.

## Cambiar el correo de contacto

El correo (`mrsecret_official@protonmail.com`) aparece en el pie de cada página y en los apartados de contacto. Como
la web no tiene plantillas ni JavaScript, está escrito en cada página; se cambia en todas a la vez con:

```bash
grep -rl "mrsecret_official@protonmail.com" web/ docs/ | xargs sed -i "s/mrsecret_official@protonmail\.com/NUEVO@CORREO/g"
```

(`docs/TIENDA.md` y `docs/CONEXIONES.md` también lo citan.) Si cambia el proveedor del correo, hay que cambiar además
el apartado 2 de la política («Proton AG (Suiza)»), en los dos idiomas.

## Si cambia el nombre del repositorio

Las páginas usan rutas relativas y funcionan bajo cualquier carpeta. Hay dos excepciones que llevan `/Aegis/`:

- `404.html`: GitHub la sirve en cualquier dirección que no existe, a cualquier profundidad, así que sus enlaces y su
  hoja de estilos son absolutos desde `/Aegis/`.
- Las etiquetas `<link rel="canonical">` y `<link rel="alternate" hreflang>` de cada página llevan la dirección
  completa (`https://mrsecret-official.github.io/Aegis/…`).

## Al cambiar un texto

- Lo que ve el autor (Partner Center, contadores de GitHub, el correo) está en `docs/CONEXIONES.md`, «Lo que ve el
  autor»; la política lo cuenta en los apartados 2 y 7.
- Si cambia lo que Aegis conecta (`docs/CONEXIONES.md`) o lo que guarda (`docs/PRIVACIDAD.md`), hay que actualizar la
  política **antes** de publicar esa versión de Aegis (lo promete el apartado 12), con la fecha de vigencia y el número
  de versión nuevos, en los dos idiomas.
- La versión en español es la que prevalece; la inglesa lo dice al final.
- «Firefox» y «Mozilla»: solo en el aviso legal, para atribuir el origen del código y decir que no hay afiliación, y
  en la política de privacidad, para decir qué conexiones van a servidores de Mozilla.
- Tono: la portada, de tú (como el navegador); la política y el aviso legal, de usted (más formal).

## Comprobar en local

```bash
cd web
python -m http.server 8000
```

y abre http://localhost:8000/. La página 404 solo se ve bien servida bajo `/Aegis/` (por ejemplo, sirviendo una carpeta
que contenga `web/` copiada como `Aegis/`).
