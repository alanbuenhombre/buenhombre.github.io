// Servidor local de MED maquetador. Solo escucha en 127.0.0.1; sin dependencias de red.
// Uso: npm start  →  http://127.0.0.1:4321
'use strict';

require('./netguard').install();

const http = require('http');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const P = require('./project');
const R = require('./render');
const ficha = require('./ficha');
const exporter = require('./exporter');

const PORT = +process.env.PORT || 4321;
const HOST = '127.0.0.1';
const UI = path.join(__dirname, '..', 'ui');
const FONTS = path.join(__dirname, '..', 'fonts');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.woff2': 'font/woff2',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.md': 'text/markdown; charset=utf-8' };
// Las páginas que sirve el servidor no pueden pedir nada fuera de 127.0.0.1
const CSP = "default-src 'self'; img-src 'self' data: blob:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'";

function log(ev) { console.log(new Date().toISOString().slice(11, 19) + ' · ' + ev); } // solo eventos, nunca contenido
function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8', 'Content-Security-Policy': CSP, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
function file(res, f) {
  if (!f || !fs.existsSync(f) || !fs.statSync(f).isFile()) return send(res, 404, { error: 'no encontrado' });
  send(res, 200, fs.readFileSync(f), TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream');
}
function body(req, limit) {
  return new Promise(function (ok, ko) {
    const parts = []; let n = 0;
    req.on('data', function (c) { n += c.length; if (n > (limit || 200e6)) { ko(new Error('Archivo demasiado grande')); req.destroy(); } else parts.push(c); });
    req.on('end', function () { ok(Buffer.concat(parts)); });
    req.on('error', ko);
  });
}
function safeName(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'proyecto'; }

// Datos de edición: qué campos y ranuras de foto usa cada página (según su plantilla)
function editInfo(name, cat, images) {
  return cat.paginas.map(function (p) {
    const r = R.renderPage(p, { catalog: cat, images: images, asset: function () { return ''; }, folio: R.folioOf(cat, p) });
    return { id: p.id, campos: r.campos, fotos: r.fotos, size: R.sizeOf(p) };
  });
}

// Crea un proyecto de ficha técnica a partir del PDF guía
async function importar(pdf, nombre) {
  const name = safeName(nombre);
  let dir = path.join(P.ROOT, name), i = 2;
  while (fs.existsSync(dir)) dir = path.join(P.ROOT, name + '-' + (i++));
  fs.mkdirSync(path.join(dir, 'entrada', 'fotos'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'entrada', 'ilustraciones'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'entrada', 'guia.pdf'), pdf);
  fs.writeFileSync(path.join(dir, 'rules.yaml'), yaml.dump({ tipo: 'ficha', fotos: { personas: [], prefijos: {} } }));
  const res = await ficha.fromPdf(path.join(dir, 'entrada', 'guia.pdf'), dir);
  const pname = path.basename(dir);
  fs.writeFileSync(path.join(dir, 'catalog.json'), JSON.stringify(res.ficha, null, 2));
  await P.scanImages(pname);
  return pname;
}

const server = http.createServer(async function (req, res) {
  const u = new URL(req.url, 'http://' + HOST);
  const seg = u.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  try {
    if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/index.html')) return file(res, path.join(UI, 'index.html'));
    if (req.method === 'GET' && seg[0] === 'ui') return file(res, path.join(UI, path.basename(seg[1] || '')));
    if (req.method === 'GET' && seg[0] === 'fonts') return file(res, path.join(FONTS, path.basename(seg[1] || '')));
    if (seg[0] === 'api' && seg[1] === 'proyectos' && req.method === 'GET') {
      return send(res, 200, P.list().map(function (n) { const c = P.catalog(n) || {}; return { nombre: n, tipo: c.tipo || 'catalogo', producto: c.producto || null }; }));
    }
    if (seg[0] === 'api' && seg[1] === 'importar' && req.method === 'POST') {
      const pdf = await body(req);
      if (pdf.slice(0, 4).toString() !== '%PDF') return send(res, 400, { error: 'El archivo no es un PDF.' });
      const n = await importar(pdf, u.searchParams.get('nombre') || 'ficha');
      log('ficha importada');
      return send(res, 200, { nombre: n });
    }
    if (seg[0] === 'api' && seg[1] === 'p' && seg[2]) {
      const n = seg[2];
      P.dirOf(n);
      if (!seg[3] && req.method === 'GET') {
        const cat = P.catalog(n), images = P.images(n);
        return send(res, 200, { catalogo: cat, imagenes: images, edicion: editInfo(n, cat, images), plantillas: R.list(), historial: P.history(n).slice(0, 30) });
      }
      if (!seg[3] && req.method === 'PUT') {
        const cat = JSON.parse((await body(req, 20e6)).toString('utf8'));
        if (!cat || !Array.isArray(cat.paginas)) return send(res, 400, { error: 'catálogo inválido' });
        P.saveCatalog(n, cat); log('cambios guardados');
        return send(res, 200, { ok: true, edicion: editInfo(n, cat, P.images(n)) });
      }
      if (seg[3] === 'deshacer' && req.method === 'POST') { const c = P.undo(n); log('deshacer'); return send(res, 200, { catalogo: c }); }
      if (seg[3] === 'imagen' && req.method === 'POST') {
        const fname = path.basename(u.searchParams.get('archivo') || '').replace(/[^\w.-]+/g, '_');
        if (!/\.(jpe?g|png|webp|svg)$/i.test(fname)) return send(res, 400, { error: 'Formato de imagen no soportado (JPG, PNG, WebP, SVG).' });
        const sub = /ilustr|render|fig|rayos|xray/i.test(fname) ? 'ilustraciones' : 'fotos';
        const dst = path.join(P.dirOf(n), 'entrada', sub);
        fs.mkdirSync(dst, { recursive: true });
        fs.writeFileSync(path.join(dst, fname), await body(req));
        const imgs = await P.scanImages(n); log('imagen agregada');
        return send(res, 200, { archivo: fname, imagenes: imgs });
      }
      if (seg[3] === 'exportar' && req.method === 'POST') {
        const tipo = u.searchParams.get('tipo') || 'pdf';
        const r = await exporter.run(n, { tipo: tipo, dpi: +(u.searchParams.get('dpi') || 300) });
        log('exportación ' + tipo + ' (' + r.archivos.length + ' archivos)');
        return send(res, 200, { carpeta: r.carpeta, archivos: r.archivos.map(function (f) { return path.relative(P.dirOf(n), f); }), revision: r.revision, red_bloqueada: r.red_bloqueada });
      }
    }
    if (req.method === 'GET' && seg[0] === 'render' && seg[2]) {
      const n = seg[1], cat = P.catalog(n), images = P.images(n);
      const page = cat.paginas.find(function (p) { return p.id === seg[2]; });
      if (!page) return send(res, 404, { error: 'página no encontrada' });
      const d = R.documentFor(page, { catalog: cat, images: images, folio: R.folioOf(cat, page), fontBase: '/fonts/', edit: u.searchParams.has('edit'), wire: u.searchParams.has('wire'),
        asset: function (id) { return '/asset/' + encodeURIComponent(n) + '/' + encodeURIComponent(id); } });
      return send(res, 200, d.doc, TYPES['.html']);
    }
    if (req.method === 'GET' && seg[0] === 'asset' && seg[2]) return file(res, P.imagePath(seg[1], seg[2]));
    if (req.method === 'GET' && seg[0] === 'exports' && seg[1]) {
      const root = path.join(P.dirOf(seg[1]), 'exports');
      const f = path.resolve(root, seg.slice(2).join('/'));
      if (f.indexOf(root) !== 0) return send(res, 403, { error: 'ruta no permitida' });
      return file(res, f);
    }
    send(res, 404, { error: 'no encontrado' });
  } catch (e) {
    log('error: ' + (e.code || e.name));
    send(res, 500, { error: e.message });
  }
});

if (require.main === module) {
  server.listen(PORT, HOST, function () { log('MED maquetador en http://' + HOST + ':' + PORT + ' (solo este equipo, sin red)'); });
}
module.exports = { server, importar };
