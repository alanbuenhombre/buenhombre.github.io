// Render de páginas: catalog.json + plantilla → documento HTML de 1056 × 816.
'use strict';

const TK = require('./tokens');
const { kit } = require('./kit');

const TEMPLATES = {};
[require('./templates/apertura'), require('./templates/capitulo'), require('./templates/producto'),
  require('./templates/generales'), require('./templates/pruebas')].forEach(function (list) {
  list.forEach(function (t) { TEMPLATES[t.id] = t; });
});

function fontCss(base) {
  return TK.fonts.map(function (f) {
    return "@font-face{font-family:'" + f[0] + "';font-weight:" + f[1] + ';font-style:' + f[2] + ";font-display:block;src:url('" + base + f[3] + "') format('woff2')}";
  }).join('\n');
}

const BASE_CSS = 'html,body{margin:0;padding:0;background:#fff}*{box-sizing:border-box}.med-page p{white-space:normal}' +
  '@page{size:1056px 816px;margin:0}';
const EDIT_CSS = '.pend{background:rgba(217,194,154,.45);outline:1px dashed #B8975E}[data-field]{cursor:text}[data-field]:hover{outline:1px dashed rgba(91,114,130,.8)}' +
  '[data-slot]:hover{outline:2px solid rgba(184,151,94,.8);outline-offset:-2px}.sel{outline:2px solid #B8975E!important}';
const WIRE_CSS = '.med-page{background:#E9ECEE!important}.med-page img,.med-page svg,.med-page .deco{visibility:hidden}' +
  '.med-page [data-slot]{background:#C9D0D4!important;border:0!important}.med-page [data-slot] p{color:#5B7282!important}' +
  '.med-page p{color:transparent!important;background:#B9C1C6;border-radius:2px}';

// page: objeto del catálogo · opts: { catalog, images, asset, folio, fontBase, edit, wire }
function renderPage(page, opts) {
  const t = TEMPLATES[page.plantilla];
  if (!t) throw new Error('Plantilla desconocida: ' + page.plantilla);
  const k = kit({ page: page, catalog: opts.catalog, images: opts.images || {}, asset: opts.asset, folio: opts.folio });
  const html = t.render(k);
  return { html: html, campos: k.used.campos, fotos: k.used.fotos, plantilla: t };
}

function documentFor(page, opts) {
  const r = renderPage(page, opts);
  const css = fontCss(opts.fontBase) + BASE_CSS + (opts.edit ? EDIT_CSS : '') + (opts.wire ? WIRE_CSS : '');
  return {
    doc: '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>' + page.id + '</title><style>' + css + '</style></head><body>' + r.html + '</body></html>',
    campos: r.campos, fotos: r.fotos
  };
}

// Número de folio de una página según su posición en el catálogo
function folioOf(catalog, page) { return String(catalog.paginas.indexOf(page) + 1).padStart(2, '0'); }

function list() {
  return Object.keys(TEMPLATES).sort().map(function (id) { const t = TEMPLATES[id]; return { id: id, nombre: t.nombre, grupo: t.grupo, auto: !!t.auto }; });
}

module.exports = { TEMPLATES, renderPage, documentFor, folioOf, list, fontCss };
