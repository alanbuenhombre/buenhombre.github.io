# DRIFTWAY — notas para trabajar en este proyecto

- Todo el juego vive en `index.html` (estilos, HTML y script en un solo archivo). No hay build ni dependencias.
- Para probar: `python3 -m http.server 8000` y abrir http://localhost:8000. Atajos: `#nivel2`…`#nivel5`, `#menu`, `#bn`.
- Para publicar: el juego vive en `driftway/` dentro del repo del portafolio; hacer push a `main` lo deja en https://buenhombre.design/driftway/
- Constantes de juego (duración de sectores, derribos para ganar, cantidades por sector) están juntas al inicio del script, en `// ---------- Mundo ----------`.
- El enlace de apoyo es `DONATE_URL`. Si queda vacío, el botón y la ventana de combustible no aparecen.
- Idioma: `LANG` se decide al inicio del script según el navegador (español → `es`, lo demás → `en`; `?lang=en|es` lo fuerza). Los textos fijos del HTML van en español y se traducen con el diccionario `T`; los textos armados en el script usan `L('español', 'english')`. Todo texto nuevo debe ir en los dos idiomas.
- Los textos están en español; la interfaz usa Silkscreen (rótulos) y JetBrains Mono (datos), cargadas desde Google Fonts.
- El archivo debe guardarse en UTF-8 y mantener `<meta charset="utf-8">`: hay acentos en el código y en los textos.
- Base de datos: el bloque `// ---------- Base de datos: visitas, ranking y pilotos ----------` tiene `Net` (fetch a PostgREST de Supabase), `countVisit` y el módulo `Board` (ranking y registro). `API.url`/`API.key` van al inicio del script; la clave es la *publishable* (anon), nunca la secreta. El esquema está en `supabase/schema.sql` y es re-ejecutable.
- `countVisit` cuenta una vez por navegador (localStorage `driftway-contado`): con marca llama a `total_visitas`, sin marca a `registrar_visita`. La vista `ranking` da la mejor partida de cada piloto y `posicion(p)` cuenta pilotos; si cambia el SQL hay que volver a pegarlo en Supabase antes de publicar.
- Para probar el ranking sin tocar la base real, apuntar `API.url` a un servidor local que imite PostgREST (`/rest/v1/rpc/registrar_visita`, `/rest/v1/ranking`, inserts en `pilotos` y `partidas`).
