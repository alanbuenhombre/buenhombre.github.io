@echo off
REM Abre Med en el navegador con un servidor solo local (127.0.0.1). Nada sale del equipo.
cd /d "%~dp0"
start "" "http://127.0.0.1:8765/index.html"
python -m http.server 8765 --bind 127.0.0.1
if errorlevel 1 start "" "index.html"
