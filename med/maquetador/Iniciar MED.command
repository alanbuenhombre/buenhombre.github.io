#!/bin/bash
# Doble clic en macOS: instala lo que falte (solo la primera vez), arranca el maquetador y abre el navegador.
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Falta Node.js. Descárgalo de https://nodejs.org (versión LTS), instálalo y vuelve a hacer doble clic aquí."
  read -r -p "Pulsa Enter para cerrar." _; exit 1
fi
if [ ! -d node_modules ]; then
  echo "Primera vez: instalando dependencias y el navegador local (necesita internet unos minutos)…"
  npm run setup || { read -r -p "La instalación falló. Pulsa Enter para cerrar." _; exit 1; }
fi
echo "Abriendo http://127.0.0.1:4321 … (deja esta ventana abierta mientras uses la herramienta; ciérrala para apagarla)"
(sleep 2; open "http://127.0.0.1:4321") &
npm start
