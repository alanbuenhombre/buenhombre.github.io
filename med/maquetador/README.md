# MED · Maquetador local

Herramienta local para diagramar con el sistema visual de MED:

1. **Catálogo** (carta horizontal 1056 × 816). Toma el **PDF guía** que entrega el cliente, entiende su jerarquía (secciones, rótulos, párrafos, viñetas, tabla, pasos, imágenes) y la reparte en páginas de catálogo con el sistema MED. No calca la guía: la rediagrama. Plantillas de flujo C01–C06, más T01–T20 y S01–S10 para armar el catálogo completo.
2. **Ficha técnica** (carta vertical, 7 páginas). El mismo PDF guía, con el diseño aprobado de la ficha de referencia.

**Privacidad, no negociable.** Todo se procesa en este computador:
- Sin internet, sin APIs y sin ningún modelo de IA (ni local ni remoto). La lectura y la diagramación son reglas y plantillas.
- Las fuentes, librerías y el navegador de exportación quedan instalados en local.
- Los datos del cliente viven solo en `proyectos/<nombre>/`.

## Instalación (una sola vez, con internet)

**Camino corto (macOS):** instala Node.js LTS desde nodejs.org y haz doble clic en `Iniciar MED.command`. La primera vez instala lo que falta; después arranca la herramienta y abre el navegador. Si macOS lo bloquea, clic derecho → Abrir.

**Camino manual:**


Requisitos: Node.js 20 o superior (macOS: `brew install node` o el instalador de nodejs.org).

```bash
cd med/maquetador
npm run setup      # instala dependencias y el Chromium local de Playwright
```

Después de este paso la herramienta **no vuelve a conectarse**. Se puede apagar el wifi.

## Uso diario (sin internet)

```bash
npm start          # abre el servidor local
```

Abre `http://127.0.0.1:4321` en el navegador. El servidor solo escucha en este equipo.

1. **Importar PDF guía.** Elige *Catálogo (horizontal)* o *Ficha técnica (vertical)*. La herramienta lee el PDF y crea `proyectos/<nombre>/`:
   - el copy, literal;
   - las secciones, rótulos, párrafos, viñetas, tabla y pasos;
   - las fotos que vienen dentro del PDF.

   En el catálogo, cada sección de la guía abre con imagen + columnas (C03) o con columnas (C02); la tabla va en su página (C04), los pasos numerados en una secuencia (C05) y la última sección cierra en oscuro (C06). Las columnas se reparten en filas de hasta 4 según el largo del texto; una columna larga ocupa dos. Todo se puede reordenar y corregir en la revisión.
2. **Contenido.** Revisa y completa cada página. Los campos marcados *pendiente* son datos que el PDF guía no trae como texto, por ejemplo:
   - rótulos que están dentro de imágenes;
   - callouts y su posición sobre la figura;
   - íconos de cuidado.

   Nada se inventa: lo que falta queda como `[marcador]`.
3. **Imágenes.** Carga en cada ranura las ilustraciones 3D, la infografía de rayos X, las fotos finales y el logo. Se puede ajustar el recorte y el zoom. Las imágenes de menos de 1200 px se marcan como de baja resolución para imprenta.
4. **Pendientes.** Lista por página de lo que falta.
5. **Exportar.** Genera en `proyectos/<nombre>/exports/<fecha>/`:
   - el PDF vectorial con las fuentes embebidas;
   - opcionalmente, PNG a 300 dpi por página;
   - `pendientes.md`.

Cada cambio se guarda en `catalog.json` y la versión anterior pasa a `.historial/` (botón **Deshacer**).

Sin interfaz:

```bash
node src/cli.js catalogo ruta/al/guia.pdf producto-9001   # catálogo horizontal
node src/cli.js ficha ruta/al/guia.pdf producto-9001      # ficha vertical
node src/cli.js exportar producto-9001 pdf
```

## Cómo verificar que no hay tráfico de red

- **Prueba automática:** `npm test` incluye `tests/red.test.js`. Falla si Node o el Chromium de exportación logran conectarse a algo que no sea un archivo local.
- **Bloqueo en Node:** el proceso bloquea toda conexión y resolución DNS fuera de `127.0.0.1` (`src/netguard.js`).
- **Bloqueo en Chromium:** se lanza con `--host-resolver-rules="MAP * ~NOTFOUND"` y aborta cualquier petición que no sea `file:` o `data:`. El número de intentos bloqueados aparece en cada exportación.
- **Bloqueo en el navegador:** las páginas del servidor llevan una Content-Security-Policy que solo permite `'self'`.
- **Comprobación manual:** apaga el wifi y usa la herramienta completa, o abre un monitor de red (Little Snitch, LuLu).

## Pruebas

```bash
npm test
```

Cubren:
- cada plantilla mide exactamente su formato (1056 × 816 o 816 × 1056);
- ningún texto se sale del marco;
- el corte en la mandíbula da `top ≤ 0` y cubre el marco;
- la lectura del PDF guía ficticio es correcta y el copy queda literal;
- el PDF guía se reparte en páginas de catálogo sin perder bloques, sin filas de más de 4 columnas, sin desbordes ni marcadores;
- la exportación funciona sin red.

## Datos de ejemplo

`ejemplos/guia-ficticia.pdf` es un PDF guía **inventado**, con la misma plantilla que entrega el cliente. Se regenera con `python3 tools/generar-guia-ejemplo.py ejemplos/guia-ficticia.pdf`. El código y los ejemplos no contienen datos reales de MED.

## Estructura

```
src/guia.js        lectura del PDF guía: líneas, columnas, rótulos, tabla (sin IA)
src/catalogo.js    reglas PDF guía → páginas de catálogo (filas de columnas, tabla, pasos, cierre)
src/ficha.js       reglas PDF guía → 7 páginas de ficha (y pendientes)
src/templates/     flujo.js (C01–C06, contenido variable) · ficha.js (F01–F07) · apertura, capitulo, producto, generales, pruebas (T01–T20, S01–S10)
src/kit.js         componentes comunes y capa técnica (cruces, marcos de escaneo, llamados, curvas de nivel)
src/crop.js        regla «corte en la mandíbula»
src/render.js      catálogo/ficha + plantilla → HTML de página
src/exporter.js    PDF / PNG / pendientes con Chromium local
src/server.js      servidor 127.0.0.1 + API de edición
src/netguard.js    bloqueo de red
ui/                interfaz de revisión
proyectos/         datos del cliente (fuera de git)
```

## Estado

- **PDF guía → catálogo:** listo. Lectura, reparto en páginas C01–C06, revisión, imágenes, exportación y pruebas.
- **Ficha técnica:** lista.
- **Catálogo completo (varios productos):** las plantillas T01–T20 y S01–S10 están hechas. Falta:
  - el clasificador `rules.yaml` desde CSV/XLSX para unir varios PDF guía en un solo catálogo;
  - el lienzo con todas las páginas por sección;
  - la carpeta para dev (WebP/JPG + `LEEME_DEV.md`) y la versión de imprenta con sangrado.
