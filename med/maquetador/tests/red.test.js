// Cero red: el proceso no puede abrir conexiones externas y la exportación funciona sin red.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.MED_PROYECTOS = fs.mkdtempSync(path.join(os.tmpdir(), 'med-red-'));
const guard = require('../src/netguard');
guard.install();

test('cualquier conexión saliente desde Node queda bloqueada', async function () {
  const https = require('https');
  const err = await new Promise(function (ok) {
    const req = https.get('https://example.com/', function () { ok(null); });
    req.on('error', ok);
  });
  assert.ok(err, 'la conexión no debía abrirse');
  assert.strictEqual(err.code, 'MED_OFFLINE');
  const net = require('net');
  const e2 = await new Promise(function (ok) { const s = net.connect(443, '93.184.215.14'); s.on('error', ok); s.on('connect', function () { ok(null); }); });
  assert.ok(e2 && e2.code === 'MED_OFFLINE');
});

test('Chromium de exportación no puede pedir nada fuera de los archivos locales', async function () {
  const { browser } = require('../src/exporter');
  const { b, ctx, intentos } = await browser();
  try {
    const pg = await ctx.newPage();
    await pg.setContent('<img src="https://example.com/x.png"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope">');
    await pg.waitForTimeout(500);
    assert.ok(intentos.length >= 2);
  } finally { await b.close(); }
});

test('PDF guía → ficha → PDF de 7 páginas, sin red', async function () {
  const { importar } = require('../src/server');
  const exporter = require('../src/exporter');
  const { PDFDocument } = require('pdf-lib');
  const n = await importar(fs.readFileSync(path.join(__dirname, '..', 'ejemplos', 'guia-ficticia.pdf')), 'prueba');
  const r = await exporter.run(n, { tipo: 'pdf' });
  const pdf = r.archivos.find(function (f) { return /\.pdf$/.test(f); });
  const doc = await PDFDocument.load(fs.readFileSync(pdf));
  assert.strictEqual(doc.getPageCount(), 7);
  const sz = doc.getPage(0).getSize();
  assert.strictEqual(Math.round(sz.width), 612); assert.strictEqual(Math.round(sz.height), 792);
  assert.strictEqual(r.red_bloqueada, 0);
  assert.ok(r.revision.every(function (p) { return p.fuera.length === 0; }), 'hay elementos fuera de página');
  assert.ok(fs.readFileSync(r.archivos.find(function (f) { return /pendientes\.md$/.test(f); }), 'utf8').indexOf('# Pendientes') === 0);
});
