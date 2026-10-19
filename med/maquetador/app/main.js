// App de escritorio (Electron): arranca el servidor local en un puerto libre de 127.0.0.1 y abre
// la interfaz en una ventana. Misma regla de siempre: sin red, sin IA. Los proyectos viven en
// Documentos/MED maquetador/proyectos.
'use strict';

const { app, BrowserWindow, session, shell, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Ningún dominio se resuelve en ninguna ventana de la app
app.commandLine.appendSwitch('host-resolver-rules', 'MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost');
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-component-update');
app.setName('MED Maquetador');

const DOCS = path.join(app.getPath('documents'), 'MED maquetador');
process.env.MED_PROYECTOS = process.env.MED_PROYECTOS || path.join(DOCS, 'proyectos');
fs.mkdirSync(process.env.MED_PROYECTOS, { recursive: true });

require('../src/netguard').install();
const P = require('../src/project');
const { server } = require('../src/server');

let win = null;

function isLocal(url) { return /^(file|data|blob|about|devtools):/.test(url) || /^https?:\/\/127\.0\.0\.1(:\d+)?(\/|$)/.test(url); }

// Un enlace a /exports/<proyecto>/... se abre con la app del sistema (Vista Previa, Acrobat…)
function exportPath(url) {
  const u = new URL(url);
  const seg = u.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (seg[0] !== 'exports' || !seg[1]) return null;
  const root = path.join(P.dirOf(seg[1]), 'exports');
  const f = path.resolve(root, seg.slice(2).join('/'));
  return f.indexOf(root) === 0 && fs.existsSync(f) ? f : null;
}

function createWindow(port) {
  win = new BrowserWindow({
    width: 1500, height: 960, minWidth: 1100, minHeight: 700, title: 'MED Maquetador',
    backgroundColor: '#F8F7F4',
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  });
  win.webContents.setWindowOpenHandler(function (d) {
    const f = exportPath(d.url);
    if (f) shell.openPath(f);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', function (e, url) { if (!isLocal(url)) e.preventDefault(); });
  win.loadURL('http://127.0.0.1:' + port + '/');
  win.on('closed', function () { win = null; });
  // Prueba automática: MED_CAPTURA=/ruta.png guarda una captura de la ventana y cierra la app
  if (process.env.MED_CAPTURA) {
    win.webContents.once('did-finish-load', function () {
      setTimeout(async function () {
        try {
          const estado = await win.webContents.executeJavaScript('JSON.stringify({ titulo: document.title, proyectos: document.querySelectorAll("#proyectos option").length - 1, paginas: document.querySelectorAll(".thumb").length })', true);
          console.log('ESTADO ' + estado);
          fs.writeFileSync(process.env.MED_CAPTURA, (await win.webContents.capturePage()).toPNG());
        } catch (e) { console.error(e.message); }
        app.exit(0);
      }, 2500);
    });
  }
}

const menu = Menu.buildFromTemplate([
  { label: 'MED Maquetador', submenu: [
    { label: 'Abrir carpeta de proyectos', click: function () { shell.openPath(process.env.MED_PROYECTOS); } },
    { type: 'separator' },
    { label: 'Acerca de', click: function () { dialog.showMessageBox({ message: 'MED Maquetador', detail: 'Herramienta local de diagramación. Sin internet, sin IA.\nProyectos: ' + process.env.MED_PROYECTOS }); } },
    { type: 'separator' }, { role: 'quit', label: 'Salir' }
  ] },
  { label: 'Edición', submenu: [{ role: 'undo', label: 'Deshacer' }, { role: 'redo', label: 'Rehacer' }, { type: 'separator' }, { role: 'cut', label: 'Cortar' }, { role: 'copy', label: 'Copiar' }, { role: 'paste', label: 'Pegar' }, { role: 'selectAll', label: 'Seleccionar todo' }] },
  { label: 'Ver', submenu: [{ role: 'reload', label: 'Recargar' }, { role: 'togglefullscreen', label: 'Pantalla completa' }] },
  { label: 'Ventana', submenu: [{ role: 'minimize', label: 'Minimizar' }, { role: 'close', label: 'Cerrar' }] }
]);

app.whenReady().then(function () {
  Menu.setApplicationMenu(menu);
  // Segunda barrera: la ventana solo puede pedir cosas al servidor local o archivos
  session.defaultSession.webRequest.onBeforeRequest(function (d, cb) { cb({ cancel: !isLocal(d.url) }); });
  server.listen(0, '127.0.0.1', function () { createWindow(server.address().port); });
  app.on('activate', function () { if (!win && server.listening) createWindow(server.address().port); });
});
app.on('window-all-closed', function () { app.quit(); });
