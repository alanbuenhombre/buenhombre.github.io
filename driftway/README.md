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

Atajos para revisar: añade `#nivel2` … `#nivel5` al enlace para arrancar en ese sector, `#menu` para saltar la pantalla de arranque, `#bn` para la versión en blanco y negro.

## Archivos

- `index.html` — todo el juego: estilos, lógica, nave, sectores, interfaz.
- `three.min.js` — Three.js r128.
- `audio/` — música y efectos.

## Licencia

Código: MIT. Música, sonidos, nave y arte: © Alan Buenhombre, todos los derechos reservados.
