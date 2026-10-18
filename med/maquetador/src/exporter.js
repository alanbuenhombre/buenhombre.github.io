// Exportación local con Chromium headless (Playwright): PDF vectorial con fuentes embebidas,
// PNG por página y reporte de pendientes. Chromium corre sin poder resolver ningún dominio
// y cada petición que no sea un archivo local se aborta.
'use strict';

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const R = require('./render');
const P = require('./project');

const FONTS = path.join(__dirname, '..', 'fonts') + path.sep;

function stamp() { return new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-'); }
function fileUrl(p) { return 'file://' + p.split(path.sep).map(encodeURIComponent).join('/').replace(/^%3A/, ':'); }

async function browser() {
  const { chromium } = require('playwright');
  const opts = { args: ['--host-resolver-rules=MAP * ~NOTFOUND', '--disable-background-networking', '--no-pings', '--disable-component-update', '--disable-sync'] };
  if (process.env.MED_CHROMIUM) opts.executablePath = process.env.MED_CHROMIUM;
  const b = await chromium.launch(opts);
  const ctx = await b.newContext();
  const intentos = [];
  await ctx.route('**/*', function (route) {
    const u = route.request().url();
    if (/^(file|data|blob|about):/.test(u)) return route.continue();
    intentos.push(u);
    return route.abort('blockedbyclient');
  });
  return { b: b, ctx: ctx, intentos: intentos };
}

// Escribe cada página como HTML dentro de la carpeta del proyecto y devuelve sus rutas
function writePages(name, cat, images, dir, filtro) {
  const projDir = P.dirOf(name);
  return cat.paginas.filter(function (p) { return !filtro || filtro.indexOf(p.id) >= 0; }).map(function (p) {
    const d = R.documentFor(p, {
      catalog: cat, images: images, folio: R.folioOf(cat, p), fontBase: fileUrl(FONTS),
      asset: function (id) { const f = P.imagePath(name, id); return f ? fileUrl(f) : ''; }
    });
    const f = path.join(dir, p.id + '.html');
    fs.writeFileSync(f, d.doc);
    return { page: p, file: f, size: R.sizeOf(p) };
  });
}

// Revisión antes de exportar: texto fuera de la página, [corchetes] y huecos de imagen
async function inspect(pg) {
  return pg.evaluate(function () {
    const root = document.querySelector('.med-page');
    const W = root.offsetWidth, H = root.offsetHeight, out = { fuera: [], corchetes: [], huecos: [] };
    document.querySelectorAll('[data-el]').forEach(function (e) {
      const b = e.getBoundingClientRect();
      if (b.width && (b.right > W + 1 || b.bottom > H + 1 || b.left < -1 || b.top < -1)) out.fuera.push(e.dataset.el);
    });
    root.querySelectorAll('.pend').forEach(function (e) { out.corchetes.push(e.textContent); });
    root.querySelectorAll('[data-slot]').forEach(function (e) { if (!e.querySelector('img') && e.dataset.slot) out.huecos.push(e.dataset.slot); });
    return { w: W, h: H, fuera: out.fuera, corchetes: out.corchetes, huecos: out.huecos };
  });
}

async function run(name, opts) {
  opts = opts || {};
  const cat = P.catalog(name);
  const images = P.images(name);
  const base = path.join(P.dirOf(name), 'exports', stamp());
  const tmp = path.join(base, '.html');
  fs.mkdirSync(tmp, { recursive: true });
  const pages = writePages(name, cat, images, tmp, opts.paginas);
  const nombre = (cat.producto && (cat.producto.ref ? 'MED_' + cat.producto.ref : cat.producto.nombre)) || name;
  const slug = String(nombre).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_');
  const { b, ctx, intentos } = await browser();
  const archivos = [], revision = [];
  try {
    const pg = await ctx.newPage();
    const merged = opts.tipo === 'png' ? null : await PDFDocument.create();
    for (const it of pages) {
      await pg.setViewportSize({ width: it.size[0], height: it.size[1] });
      await pg.goto(fileUrl(it.file));
      await pg.evaluate(function () { return document.fonts.ready; });
      await pg.waitForLoadState('load');
      revision.push(Object.assign({ id: it.page.id, titulo: it.page.titulo || it.page.id }, await inspect(pg)));
      if (opts.tipo === 'png') {
        const dpi = opts.dpi || 300;
        const hi = await b.newPage({ viewport: { width: it.size[0], height: it.size[1] }, deviceScaleFactor: dpi / 96 });
        await hi.route('**/*', function (r) { return /^(file|data|blob|about):/.test(r.request().url()) ? r.continue() : r.abort(); });
        await hi.goto(fileUrl(it.file)); await hi.evaluate(function () { return document.fonts.ready; });
        const f = path.join(base, slug + '_p' + String(pages.indexOf(it) + 1).padStart(2, '0') + '_' + dpi + 'dpi.png');
        await hi.screenshot({ path: f });
        await hi.close();
        archivos.push(f);
      } else {
        const one = await pg.pdf({ width: it.size[0] + 'px', height: it.size[1] + 'px', printBackground: true, pageRanges: '1' });
        const src = await PDFDocument.load(one);
        const [copied] = await merged.copyPages(src, [0]);
        merged.addPage(copied);
      }
    }
    if (merged) {
      merged.setTitle(String(cat.producto ? cat.producto.nombre + ' · ' + (cat.producto.ref || '') : name));
      merged.setProducer('MED maquetador local'); merged.setCreator('MED maquetador local');
      const f = path.join(base, slug + (cat.tipo === 'ficha' ? '_ficha-tecnica' : '_catalogo') + '.pdf');
      fs.writeFileSync(f, await merged.save());
      archivos.push(f);
    }
  } finally {
    await b.close();
  }
  // Reporte de pendientes (sin contenido del cliente en logs: solo se escribe en la carpeta del proyecto)
  const md = ['# Pendientes · ' + (cat.producto ? cat.producto.nombre + ' · REF. ' + cat.producto.ref : name), '',
    'Generado: ' + new Date().toLocaleString('es'), ''];
  (cat.pendientes || []).forEach(function (p) { md.push('- ' + p); });
  revision.forEach(function (r) {
    const items = [];
    r.corchetes.forEach(function (c) { items.push('Marcador por completar: ' + c); });
    r.huecos.forEach(function (h) { items.push('Imagen faltante: ' + h); });
    r.fuera.forEach(function (e) { items.push('Elemento fuera de la página: ' + e); });
    if (items.length) { md.push('', '## ' + r.titulo); items.forEach(function (i) { md.push('- ' + i); }); }
  });
  if (intentos.length) md.push('', '## Red', '- Se bloquearon ' + intentos.length + ' intentos de conexión durante la exportación.');
  const fp = path.join(base, 'pendientes.md');
  fs.writeFileSync(fp, md.join('\n') + '\n');
  archivos.push(fp);
  fs.rmSync(tmp, { recursive: true, force: true });
  return { carpeta: base, archivos: archivos, revision: revision, red_bloqueada: intentos.length };
}

module.exports = { run, browser, writePages, inspect, fileUrl };
