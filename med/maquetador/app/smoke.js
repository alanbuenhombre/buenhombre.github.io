// Prueba de humo de la app (sin ventana visible): importa la guía ficticia, exporta PDF y PNG
// con el motor de Electron y comprueba que no hubo red. Uso: npx electron app/smoke.js
'use strict';
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

app.commandLine.appendSwitch('host-resolver-rules', 'MAP * ~NOTFOUND');
process.env.MED_PROYECTOS = fs.mkdtempSync(path.join(os.tmpdir(), 'med-smoke-'));
require('../src/netguard').install();

app.whenReady().then(async function () {
  const { importar } = require('../src/server');
  const exporter = require('../src/exporter');
  const pdf = fs.readFileSync(path.join(__dirname, '..', 'ejemplos', 'guia-ficticia.pdf'));
  const n = await importar(pdf, 'humo', 'catalogo');
  const r1 = await exporter.run(n, { tipo: 'pdf' });
  const r2 = await exporter.run(n, { tipo: 'png', dpi: 150 });
  const pdfs = r1.archivos.filter(function (f) { return /\.pdf$/.test(f); });
  const pngs = r2.archivos.filter(function (f) { return /\.png$/.test(f); });
  const fuera = r1.revision.filter(function (r) { return r.fuera.length; }).length;
  console.log(JSON.stringify({ paginas: r1.revision.length, pdf: pdfs.length === 1 && fs.statSync(pdfs[0]).size > 10000, pdf_bytes: pdfs[0] ? fs.statSync(pdfs[0]).size : 0, pngs: pngs.length, png_bytes: pngs[0] ? fs.statSync(pngs[0]).size : 0, fuera: fuera, red_bloqueada: r1.red_bloqueada + r2.red_bloqueada, carpeta: r1.carpeta }));
  fs.rmSync(process.env.MED_PROYECTOS, { recursive: true, force: true });
  app.exit(pdfs.length === 1 && pngs.length === r1.revision.length && fuera === 0 ? 0 : 1);
}).catch(function (e) { console.error('ERROR', e && e.stack || e); app.exit(1); });
