# DRIFTWAY

Una nave, cinco sectores, una regla: no pares.

Arcade en 3D para navegador, hecho con Three.js. Un solo archivo `index.html` más la librería y los sonidos. Sin servidor, sin dependencias que instalar.

## Jugar en local

```bash
python3 -m http.server 8000
```

y abre http://localhost:8000. (Hace falta un servidor porque el navegador no deja cargar el audio desde un archivo suelto.)

## Publicar

El juego vive en la carpeta `driftway/` del repositorio del portafolio (`alanbuenhombre/buenhombre.github.io`). Al hacer push a `main`, GitHub Pages lo sirve en https://buenhombre.design/driftway/

## Controles

| Acción | Teclado y mouse | Pantalla táctil |
|---|---|---|
| Girar | Mouse, WASD o flechas | Arrastrar |
| Turbo ×2 | Clic sostenido o Espacio | Dos dedos |
| Turbo ×3 | Clic derecho o Shift | Tres dedos |
| Disparar (sector 5) | El mismo turbo | Dos dedos |
| Cabina / Pausa / Silencio | C / P (o Esc) / M | Botones |
| Modo ASCII | T | — |

Idioma: el juego sale en español si el navegador está en español y en inglés en cualquier otro caso. Para forzarlo, añade `?lang=en` o `?lang=es` al enlace.

Atajos para revisar: añade `#nivel2` … `#nivel5` al enlace para arrancar en ese sector, `#victoria` para ver el final sin tener que ganar, `#menu` para saltar la pantalla de arranque, `#bn` para la versión en blanco y negro.

## Contador, ranking y registro (Supabase)

El juego guarda tres cosas en una base de datos de Supabase: el contador de pilotos (cada navegador cuenta una sola vez), los puntajes que la gente decide guardar y, si lo marcan, un correo para avisarles de premios o nuevos sectores. Todo es opcional: el juego funciona igual sin red y sin registrarse.

- `supabase/schema.sql` — tablas, vistas y funciones. Se pega en Supabase → SQL Editor y se puede correr varias veces.
- En `index.html`, `const API = { url, key }` lleva la URL del proyecto y la clave *publishable* (anon). Esa clave es pública por diseño: solo puede sumar visitas, insertar pilotos y partidas, y leer el ranking (apodo, puntos, sector). Los correos nunca se pueden leer desde el juego. La clave `service_role`/secret jamás va en este repo.
- `privacidad.html` — aviso de privacidad (Ley 1581 de 2012 y RGPD). El contacto que figura es `hola@buenhombre.design`.
- Contador: cada navegador suma una sola vez (marca `driftway-contado` en localStorage); las visitas siguientes solo leen el total. El número se acerca a personas, no a sesiones.
- Ranking: la vista `ranking` muestra una fila por piloto con su mejor partida (las partidas sin piloto se agrupan por apodo), y `posicion(p)` cuenta pilotos, no partidas.
- Para ver los datos: Supabase → Table Editor → `partidas`, `pilotos`, `visitas`.

## Archivos

- `index.html` — todo el juego: estilos, lógica, nave, sectores, interfaz, ranking.
- `three.min.js` — Three.js r128.
- `audio/` — música y efectos.
- `privacidad.html` — aviso de privacidad.
- `supabase/schema.sql` — base de datos.

## Licencia

Código: MIT. Música, sonidos, nave y arte: © Alan Buenhombre, todos los derechos reservados.
