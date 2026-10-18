# MED · Generador local de fichas técnicas

Diagrama fichas técnicas de producto MED con el sistema visual aprobado: paleta Clinical, Instrument Serif + Manrope + IBM Plex Mono, carta. Corre **100 % local y sin conexión**. La información de producto es confidencial (NDA): ningún dato sale del computador.

Primera entrega: páginas **01 Portada / Anatomical Coverage**, **02 Materiales** y **05 Guía de tallas**; exportación a PDF, PNG y SVG.

## Stack y por qué

**App web estática, sin compilación ni instalación**: HTML + JavaScript plano que se abre en el navegador.

- **Cero dependencias en tiempo de ejecución.** No hay `npm install` ni servidor, ni nada que descargar. Las librerías (pdf.js para leer PDF, qrcode-generator para el QR) y las fuentes van dentro de la carpeta. Menos piezas = menos superficie de fuga y más fácil de auditar.
- **Red bloqueada por la propia página:**
  - `Content-Security-Policy` con `default-src 'self'` y `connect-src 'none'`: el navegador rechaza cualquier petición de red.
  - No hay CDNs, Google Fonts, analítica ni telemetría.
- **Las páginas se dibujan como SVG nativo** (1 unidad = 1 pt, carta = 612 × 792). El mismo dibujo da:
  - la vista previa;
  - el PDF vectorial;
  - el PNG a 600 dpi;
  - el SVG con texto editable para Figma o Illustrator.

  Por eso los cuatro salen idénticos.
- **Siguiente paso natural:** empaquetarla como app de macOS con **Tauri**, sin permisos de red. El código actual no cambia.

Se descartó Vite + localhost porque exige `npm install` (descarga de cientos de paquetes de internet) y un servidor corriendo, sin aportar nada a esta app.

## Cómo abrirla (macOS)

1. Copia la carpeta `fichas` al Mac.
2. Abre `index.html` con **Chrome** (doble clic o arrastrarlo a la ventana). Recomiendo Chrome porque permite guardar directamente en la carpeta que elijas. Safari funciona, pero descarga los archivos a Descargas.

No requiere instalar nada.

## Cómo verificar que no hay tráfico de red

1. **Prueba simple:** apaga el wifi y usa la app de principio a fin. Todo funciona igual.
2. **Chrome DevTools** (⌥⌘I) → pestaña **Network** → marca *Preserve log* → recarga y usa la app. Solo aparecen archivos `file://` de la propia carpeta (y `data:` / `blob:`, que son memoria local). Ninguna URL `http(s)`.
3. **Prueba de bloqueo:** en DevTools → **Console** escribe `fetch('https://example.com')`. Debe fallar con un error de *Content Security Policy*. La página no puede conectarse aunque quisiera.
4. Opcional: un monitor de red del sistema (Little Snitch, LuLu) no mostrará conexiones nuevas al usar la app.

## Cómo cargar un producto nuevo

1. **Ingesta:** arrastra juntos:
   - la ficha original del proveedor (PDF);
   - la tabla de tallas (CSV, separada por `;` o `,`: primera fila `Medida;XS;S;M…`, una fila por medida);
   - las ilustraciones (SVG o PNG);
   - las fotos de textura y detalle (JPG/PNG).

   Nombres de archivo que se asignan solos:

   | En el nombre | Va a |
   | --- | --- |
   | `frente`, `espalda`, `lateral` | Figuras de la portada |
   | `textura` (+ nombre del material) | Foto de ese material |
   | `rayos` | Gráfica de rayos X |
   | `tallas` | Figura con cintas de medida |
   | `medir` | Ilustración de «Cómo medir» |

2. **Revisión de datos:**
   - Todo lo extraído aparece en un formulario.
   - Los campos **revisar** son suposiciones de la extracción: confírmalos (✓) o corrígelos. Lo que no se pudo extraer queda vacío y marcado; nunca se inventa.
   - Las secciones de la ficha original sin página todavía (p. ej. Cuidados) se conservan en «Información sin módulo».
   - Ahí también se ubican:
     - las zonas de cobertura sobre la figura (x, y de 0 a 1);
     - las cintas de medida (y, x1, x2);
     - el recorte de cada figura.
3. **Diseño:**
   - línea de producto (Clinical, Performance, Body Daily, Maternity: cambia el color);
   - páginas activas y su orden;
   - reemplazo de imágenes por ranura;
   - avisos de desborde, imágenes faltantes o con menos de 300 dpi.
4. **Exportar:** elige la carpeta de destino y genera:
   - PDF de impresión (vectorial, imágenes a resolución original);
   - PDF digital liviano (imágenes reducidas);
   - PNG por página a 600 o 300 dpi;
   - SVG por página;
   - el producto en `.json` (con sus imágenes) para retomarlo.

   Los PDF salen por el diálogo de impresión: **Guardar como PDF**, Carta, márgenes *Ninguno*, *Gráficos de fondo* activado.

Para retomar un producto guardado, arrastra su `.json` en Ingesta.

## Reglas que aplica el diagramador

- **Copy:** se usa palabra por palabra.
  - Si un texto no cabe, primero se reduce su tamaño dentro de un mínimo. Si aun así no cabe, se muestra un aviso: nunca se corta ni se reescribe.
  - Solo los rótulos del sistema (p. ej. «Anatomical Coverage») van en mayúsculas o en otro idioma (ES/EN); el copy del producto nunca.
- **Pie de página:** solo el número.
- **Paleta y líneas de producto:**
  - Solo colores de la paleta.
  - Las líneas se distinguen por color y nombre.
  - Sobre colores claros (Body Daily, Maternity) el texto pasa a Graphite automáticamente.
- **Formas y fondos:**
  - Fotos de textura y detalle rectangulares o cuadradas, nunca circulares.
  - Figuras sobre fondo Steel Blue con textos claros, sin grilla de puntos.
- **Conectores «flujo de señal»:**
  - Codos redondeados que se unen en un tronco.
  - Sin glow; solo los nodos que conectan.
  - Pocas líneas horizontales.
- **Las ilustraciones SVG se incrustan como vectores:**
  - siguen editables en Figma o Illustrator;
  - las fotos van embebidas;
  - el SVG de cada página usa texto real con los nombres de las familias. Para abrirlo en Illustrator hay que tener las fuentes instaladas: están en `fonts/` (TTF). Figma ya las trae.

## Esquema de datos

Un producto es un JSON `med.ficha.v1`. Ejemplo completo y ficticio: `samples/demo/producto-demo.json`.

```
producto     nombre, referencia, categoria, bajada, descripcion, url (QR)
linea        clinical | performance | body-daily | maternity
idioma       es | en  (solo rótulos del sistema)
modulos      orden de páginas: cover, materials, sizes
cobertura    figuras [{imagen, vista, recorte:{arriba, abajo}}]
             zonas   [{nombre, texto, figura, x, y, lado?}]
materiales   lista [{nombre, principal, composicion:[{fibra, pct}], descripcion, propiedades[], textura}]
             rayos_x, rayos_x_nota
tallas       unidad, tallas[], medidas [{nombre, valores[], cinta:{y, x1, x2}}], figura, nota
             como_medir {ilustracion, pasos[]}
imagenes     id → {nombre, tipo, src (data URL), ancho, alto}
revisar      rutas pendientes de confirmar, p. ej. "producto.descripcion"
sin_asignar  [{titulo, texto}] secciones de la ficha original sin módulo
```

## Desarrollo

- **Datos de prueba:** son inventados (`CONTOURA™ BRA ref. 9001`). `python3 samples/construir-demo.py` los regenera (ilustraciones de muestra, texturas, ficha de proveedor PDF, CSV y `samples/demo.js`).
- **Agregar una página:** crea `js/pages/pNN-nombre.js` que registre `window.MedPages.<id> = function (rc) { return '<svg…>'; }`, agrégala en `MODULES` (`js/schema.js`) y en `index.html`. `rc` trae los datos, la paleta, el color de línea y helpers de texto, imágenes y conectores (`js/svgkit.js`).
- **Regla del proyecto:** Claude Code solo trabaja con `samples/`; los documentos reales de MED se cargan únicamente en la app terminada.

## Pendiente

- Páginas 03 (Detalles de construcción), 04, 06, 07 (Cierre) y las páginas generales del catálogo.
- PDF sin diálogo de impresión (generado directamente).
- Empaquetado como app de macOS (Tauri) sin permisos de red.
- Modelo local opcional (Ollama), apagado por defecto, para ayudar a estructurar texto.
