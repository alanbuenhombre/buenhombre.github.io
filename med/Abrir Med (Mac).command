#!/bin/bash
# Abre Med en el navegador con un servidor solo local (127.0.0.1). Nada sale del equipo.
cd "$(dirname "$0")"
PORT=8765
( sleep 1; open "http://127.0.0.1:$PORT/index.html" ) &
python3 -m http.server $PORT --bind 127.0.0.1
