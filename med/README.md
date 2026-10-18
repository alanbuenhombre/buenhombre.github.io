# Med · Diagramador local

Convierte documentos de los equipos (Word, PDF, texto) en diagramaciones editoriales listas para imprimir o terminar en Figma, **sin que la información salga del computador**.

El problema que resuelve: el contenido ya llega jerarquizado en un documento, pero pasarlo a una diagramación (títulos, entradillas, columnas, tablas, folios, estilos) toma horas de trabajo repetitivo. Med hace ese primer armado en segundos, sin tocar el texto, y deja al diseñador lo que sí requiere su criterio: ajustar, editar fotos y afinar detalles.

## Privacidad

- Todo corre en el navegador de este equipo. No hay servidor, nube ni IA externa.
- La página bloquea cualquier conexión de red (`Content-Security-Policy: connect-src 'none'`). Se puede comprobar con el wifi apagado.
- Las librerías (pdf.js, mammoth) y las tipografías están dentro de la carpeta. No se carga nada de internet.
- El plugin de Figma declara `networkAccess: none`.

## Cómo abrirlo

1. Copia la carpeta `med` al computador.
2. Abre `index.html` con doble clic en Chrome, Edge o Firefox.
   - Opcional: `Abrir Med (Mac).command` o `Abrir Med (Windows).bat` lo abren con un servidor solo local (127.0.0.1). Necesitan Python.

## Flujo

1. **Documento**: arrastra un `.docx`, `.pdf`, `.txt` o `.md`. Hay un documento de ejemplo para probar.
2. **Jerarquía reconocida**: revisa cómo se leyó cada bloque (título, subtítulo, capítulo, sección, subsección, entradilla, párrafo, cita, lista, tabla, imagen, pie de foto). Puedes cambiar el rol u omitir bloques. El texto nunca se edita.
3. **Formato**: Med pregunta al cargar. Opciones: carta, media carta, tabloide, widescreen 16:9 y mobile 9:16.
4. **Plantilla**: Editorial clásico, Suizo/retícula, Catálogo cálido o Contemporáneo. También puedes:
   - importar una plantilla hecha en Figma;
   - sacar el color de acento de una imagen de referencia (moodboard, logo, foto).
5. **Ajustes**: portada (con imagen o marco vacío), capítulos en página nueva, numeración, columnas, antetítulo, autor/área y fecha.
6. **Ficha tipográfica**: fuentes, pesos, tamaños, interlineados y colores de cada rol en el formato elegido.
7. **Exportar**:
   - **PDF**: con el diálogo de impresión (Guardar como PDF, márgenes *Ninguno*, *Gráficos de fondo* activado). El texto queda vectorial y seleccionable, y el PDF se abre editable en Illustrator.
   - **Paquete para Figma** (`.med.json`): se importa con el plugin y queda un archivo nativo editable.

La barra superior muestra **✓ Texto íntegro**: compara palabra por palabra el documento original con lo diagramado, en el mismo orden.

La vista **Wireframe** muestra solo la estructura (cajas por rol) para revisar la jerarquía sin distraerse con el diseño.

## Qué reconoce

| Fuente | Cómo se detecta la jerarquía |
| --- | --- |
| Word (.docx) | Estilos de Word (Título, Subtítulo, Título 1–6, Cita, Descripción), listas, tablas, imágenes, negritas y cursivas. Si el documento no usa estilos, las líneas cortas en negrita se vuelven títulos. |
| PDF con texto | Tamaño y peso de la fuente: el tamaño más frecuente es el cuerpo y los mayores son títulos. Además detecta viñetas, numeración y pies de foto (texto más pequeño). Quita cabeceras, pies y números de página repetidos, y une palabras partidas con guion. |
| Markdown | `#` títulos, listas, `>` citas, tablas, `**negrita**`, `*cursiva*`. |
| Texto plano | Líneas cortas sin punto final = títulos (en MAYÚSCULAS = capítulo). Viñetas y numeración = listas. |

En todos los formatos se infiere además:
- el título del documento y su subtítulo;
- la entradilla (primer párrafo de cada capítulo);
- los niveles de capítulo, sección y subsección.

## Diagramación

- Retícula por formato: carta 2 columnas, media carta 1, tabloide 3, widescreen 2, mobile 1. Se puede cambiar.
- Aperturas de capítulo con número, título y entradilla. En widescreen y mobile cada capítulo tiene su página separadora y cada sección su propia lámina.
- Párrafos, listas y tablas se parten entre columnas y páginas. Las tablas repiten su encabezado.
- Control de viudas y huérfanas: no quedan líneas sueltas al pie ni arriba.
- Los títulos nunca quedan solos al final de una columna.
- Las imágenes del Word se ubican con su pie de foto.
- Folios con el título del documento y el número de página.
- Toda la tipografía está en `em` sobre el cuerpo del formato, así cada plantilla escala bien de media carta a tabloide o pantalla.

## Plugin de Figma (Med · Importador)

Instalación (una vez, en Figma de escritorio):
1. Menú → Plugins → Desarrollo → **Importar plugin desde manifiesto…**
2. Elige `med/figma-plugin/manifest.json`.

**Importar una diagramación**:
1. Abre el plugin y carga el `.med.json`.
2. Se crea una página nueva con un frame por página. Incluye:
   - textos editables (con negritas y cursivas), rectángulos, líneas e imágenes;
   - capas nombradas por rol (Capítulo, Sección, Cuerpo, Cita, Folio…);
   - estilos de texto locales `Med/<plantilla>/<rol>`: cambiar uno actualiza todo el documento;
   - estilos de color (Papel, Tinta, Acento…);
   - retícula de columnas y márgenes en cada frame (oculta; se activa con Ctrl/Cmd + G).

Las tipografías de las plantillas son de Google Fonts y ya vienen en Figma. Si falta alguna, el plugin usa una equivalente y avisa.

**Crear una plantilla desde Figma**:
1. Diseña un frame de muestra.
2. Nombra cada capa de texto con su rol:
   - `portada`, `subtitulo`, `etiqueta`;
   - `capitulo`, `seccion`, `subseccion`;
   - `entradilla`, `cuerpo`, `cita`, `pie`, `tabla`, `folio`.
3. Opcional: un rectángulo `acento` define el color de acento.
4. Si el frame tiene retícula de columnas, se usan sus columnas y márgenes.
5. Selecciónalo y pulsa **Exportar plantilla para Med**.
6. En Med: **Importar plantilla de Figma**.

Se toman la familia, el estilo, el tamaño (relativo al cuerpo), el interlineado, el tracking, las mayúsculas y el color de cada rol, más el color del papel. Si el frame tiene un tamaño propio, se agrega como formato nuevo.

## Archivos

```
med/
  index.html            aplicación
  app.css, layout.css   interfaz · estilos de página y plantillas
  js/extract.js         lectura de DOCX/PDF/TXT/MD y reconocimiento de jerarquías
  js/templates.js       formatos de salida y plantillas (datos)
  js/layout.js          motor de diagramación y verificación de texto
  js/figma-export.js    paquete .med.json para Figma
  js/app.js             interfaz y flujo
  figma-plugin/         plugin Med · Importador
  vendor/, fonts/       pdf.js, mammoth y tipografías (licencias incluidas)
  muestras/             documentos de prueba
```

Para agregar una plantilla, suma un objeto en `TEMPLATES` (`js/templates.js`) con fuentes, colores y roles. Si necesita adornos propios, agrega reglas `.tpl-<id>` en `layout.css`.

## Límites de este prototipo y siguientes pasos

- **PDF escaneado**: esta versión no hace OCR. Siguiente paso: Tesseract local con español incluido.
- **PDF a varias columnas**: se lee en el orden interno del PDF. Funciona bien con la mayoría de documentos de oficina, pero los PDF ya maquetados en columnas pueden mezclar el orden.
- **.doc antiguo**: guardarlo como .docx.
- **InDesign**: exportar IDML desde el mismo paquete. Mientras tanto, InDesign puede colocar el PDF.
- **Illustrator como plantilla**: leer un SVG/PDF con capas nombradas, igual que el frame de Figma.
- **App de escritorio** (.exe/.app) con Tauri, con la misma base.
- **Clasificación asistida** con un modelo local (Ollama), opcional y sin salir del equipo.
