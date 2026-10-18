// Lectura determinística del «PDF guía» de ficha técnica MED (plantilla genérica de 7 páginas).
// Sin IA: se reconstruyen líneas y columnas, se detectan rótulos (negrita, mayúsculas) y cada
// texto se asigna al rótulo de su columna. El copy queda literal. Lo que no está como texto en
// el PDF (p. ej. rótulos dentro de imágenes) se marca para revisar; nunca se inventa.
'use strict';

const path = require('path');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

const SERIF = /garamond|serif|times|georgia|cormorant|instrument|playfair|minion|caslon|bodoni/i;
const BOLD = /bold|black|heavy|semibold|demi/i;
const ITALIC = /italic|oblique/i;
const SYMBOL = /emoji|symbol|dingbat/i;

function norm(s) { return String(s || '').replace(/[™®©]/g, '').replace(/\s+/g, ' ').trim().toUpperCase(); }
function isUpper(t) { const l = t.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, ''); return l.length >= 2 && l === l.toUpperCase(); }

// ---------- 1. Segmentos: piezas de texto contiguas en una línea ----------
async function readPages(buf) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported: false, disableFontFace: true, verbosity: 0 }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const vp = page.getViewport({ scale: 1 });
    const ops = await page.getOperatorList();
    const tc = await page.getTextContent();
    const fonts = {};
    const items = [];
    tc.items.forEach(function (it) {
      if (!it.str || !it.str.trim()) return;
      if (!(it.fontName in fonts)) { let nm = ''; try { nm = page.commonObjs.get(it.fontName).name || ''; } catch (e) { nm = ''; } fonts[it.fontName] = nm.replace(/^[A-Z]{6}\+/, ''); }
      const f = fonts[it.fontName];
      items.push({
        x: it.transform[4], y: vp.height - it.transform[5], w: it.width,
        size: Math.round(Math.hypot(it.transform[2], it.transform[3]) * 10) / 10,
        font: f, bold: BOLD.test(f), serif: SERIF.test(f), italic: ITALIC.test(f), symbol: SYMBOL.test(f), str: it.str
      });
    });
    // Imágenes embebidas (para proponerlas como fotos de la ficha)
    const imgs = [];
    for (let i = 0; i < ops.fnArray.length; i++) {
      if (ops.fnArray[i] === pdfjs.OPS.paintImageXObject) imgs.push(ops.argsArray[i][0]);
    }
    pages.push({ n: n, width: vp.width, height: vp.height, items: items, imageIds: imgs, page: page });
  }
  return { doc: doc, pages: pages };
}

function segments(items) {
  // Orden del flujo del PDF: un generador como Chrome dibuja bloque por bloque, así que dos
  // columnas en la misma línea nunca son vecinas en el flujo. Solo se une lo contiguo.
  const segs = [];
  let cur = null;
  items.forEach(function (it) {
    const sameLine = cur && Math.abs(cur.y - it.y) < Math.max(1.5, it.size * 0.3);
    const gap = cur ? it.x - cur.x1 : 0;
    const style = cur && (it.symbol || cur.symbolOnly || (cur.bold === it.bold && cur.serif === it.serif && Math.abs(cur.size - it.size) < 1.2));
    if (cur && sameLine && style && gap > -2 && gap < Math.max(6, it.size * 1.2)) {
      cur.text += (gap > it.size * 0.15 && !/\s$/.test(cur.text) && !/^\s/.test(it.str) && !it.symbol ? ' ' : '') + it.str;
      cur.x1 = Math.max(cur.x1, it.x + it.w);
      cur.symbolOnly = false;
    } else {
      cur = { x: it.x, x1: it.x + it.w, y: it.y, size: it.size, bold: it.bold, serif: it.serif, italic: it.italic, text: it.str, symbolOnly: it.symbol };
      segs.push(cur);
    }
  });
  // Símbolos sueltos (™ ® en otra fuente): se pegan al texto que termina justo antes en la misma línea
  segs.filter(function (s) { return s.symbolOnly; }).forEach(function (sym) {
    const host = segs.filter(function (o) { return !o.symbolOnly && Math.abs(o.y - sym.y) < sym.size && o.x1 <= sym.x + 2; })
      .sort(function (a, b) { return b.x1 - a.x1; })[0];
    if (host && sym.x - host.x1 < host.size) { host.text = host.text.replace(/\s+$/, '') + sym.text.trim(); host.x1 = Math.max(host.x1, sym.x1); }
  });
  segs.forEach(function (s) { s.text = s.text.replace(/\s+/g, ' ').trim(); });
  return segs.filter(function (s) { return s.text && !s.symbolOnly; });
}

// ---------- 2. Estructura de una página: cabecera, eyebrow, H1, entradilla y bloques ----------
const HEADER_Y = 70, FOOTER_Y = 755;

function pageStructure(pg) {
  const segs = segments(pg.items);
  const head = segs.filter(function (s) { return s.y < HEADER_Y; });
  const foot = segs.filter(function (s) { return s.y > FOOTER_Y; });
  const body = segs.filter(function (s) { return s.y >= HEADER_Y && s.y <= FOOTER_Y; });
  const right = head.filter(function (s) { return s.x > pg.width * 0.45; }).sort(function (a, b) { return a.y - b.y; });
  const out = { n: pg.n, seccion: right[0] ? right[0].text : '', producto_linea: right[1] ? right[1].text : '', pie: foot.map(function (s) { return s.text; }) };

  // Rótulos: negrita en mayúsculas de tamaño pequeño/mediano, o serif grande (H1)
  body.forEach(function (s) {
    s.kind = s.serif ? 'serif' : s.bold && isUpper(s.text) && s.size <= 9 ? 'label' : s.italic ? 'italic' : s.bold ? 'bold' : 'text';
  });
  // H1 = serif más grande de la página; eyebrow = rótulo justo encima; entradilla = texto justo debajo
  const serifs = body.filter(function (s) { return s.kind === 'serif'; });
  const h1 = serifs.slice().sort(function (a, b) { return b.size - a.size; })[0];
  if (h1 && h1.size >= 16) {
    const h1line = body.filter(function (s) { return s.kind === 'serif' && Math.abs(s.y - h1.y) < 2; }).sort(function (a, b) { return a.x - b.x; });
    out.h1 = h1line.map(function (s) { return s.text; }).join(' ').replace(/ ™/g, '™');
    h1line.forEach(function (s) { s.used = true; });
    if (pg.n === 1) metaRow(out, body, h1);
    const eb = body.filter(function (s) { return !s.used && s.kind === 'label' && s.y < h1.y && h1.y - s.y < 30; }).sort(function (a, b) { return b.y - a.y; })[0];
    if (eb) { out.eyebrow = eb.text; eb.used = true; }
    const ent = [];
    let y = h1.y;
    body.filter(function (s) { return s.kind === 'text' && s.y > h1.y && s.x < pg.width * 0.3; }).sort(function (a, b) { return a.y - b.y; }).forEach(function (s) {
      if (s.y - y < 15 && s.size >= 8.5) { ent.push(s.text); s.used = true; y = s.y; }
    });
    if (ent.length) out.entradilla = ent.join(' ');
  }
  out.tabla = sizeTable(body);
  out.bloques = blocks(body.filter(function (s) { return !s.used; }), pg.width);
  return out;
}

// Fila de metadatos (página 1): valor en negrita encima y etiqueta pequeña debajo
function metaRow(out, body, h1) {
  const meta = body.filter(function (s) { return !s.used && s.y < h1.y - 5; });
  if (meta.length < 4) return;
  const cols = {};
  meta.forEach(function (s) { const k = Math.round(s.x / 12); (cols[k] = cols[k] || []).push(s); s.used = true; });
  out.meta = Object.keys(cols).map(Number).sort(function (a, b) { return a - b; }).map(function (k) {
    const c = cols[k].sort(function (a, b) { return a.y - b.y; });
    return { valor: c.filter(function (s) { return s.bold; }).map(function (s) { return s.text; }).join(' '), etiqueta: c.filter(function (s) { return !s.bold; }).map(function (s) { return s.text; }).join(' ') };
  });
}

// Tabla de tallas: fila de encabezado con «SIZE» y filas cuyo primer valor es una talla
const SIZE_RE = /^(XXS|XS|S|M|L|XL|XXL|[2-6]XL)$/;
function sizeTable(body) {
  const hdr = body.find(function (s) { return s.bold && /^SIZE$/i.test(s.text); });
  if (!hdr) return null;
  const cols = body.filter(function (s) { return s.bold && Math.abs(s.y - hdr.y) < 2.5 && s !== hdr; }).sort(function (a, b) { return a.x - b.x; });
  const sizes = body.filter(function (s) { return s.bold && SIZE_RE.test(s.text) && s.y > hdr.y && Math.abs(s.x - hdr.x) < 30; }).sort(function (a, b) { return a.y - b.y; });
  if (!cols.length || !sizes.length) return null;
  hdr.used = true; cols.forEach(function (c) { c.used = true; });
  const centers = cols.map(function (c) { return (c.x + c.x1) / 2; });
  const rows = sizes.map(function (sz, i) {
    sz.used = true;
    const next = sizes[i + 1] ? sizes[i + 1].y : sz.y + 14;
    const cells = cols.map(function () { return []; });
    body.forEach(function (s) {
      if (s.used || s.bold || s.y < sz.y - 2 || s.y >= next - 2) return;
      const cx = (s.x + s.x1) / 2;
      let best = 0;
      centers.forEach(function (c, j) { if (Math.abs(c - cx) < Math.abs(centers[best] - cx)) best = j; });
      if (Math.abs(centers[best] - cx) < 60) { cells[best].push(s.text); s.used = true; }
    });
    return [sz.text].concat(cells.map(function (c) { return c.join(' / '); }));
  });
  return { columnas: [hdr.text].concat(cols.map(function (c) { return c.text; })), filas: rows };
}

// Bloques: cada texto pertenece al rótulo más cercano por encima dentro de su columna
function blocks(segs, width) {
  let labels = segs.filter(function (s) { return s.kind === 'label'; }).sort(function (a, b) { return a.y - b.y || a.x - b.x; });
  // Rótulos de dos líneas («SHOULDER / UPPER-LATERAL» + «CONSTRUCTION»)
  labels.slice().reverse().forEach(function (b) {
    if (b.kind !== 'label' || /^\d/.test(b.text) || b.text.split(' ').length > 3) return;
    const a = labels.find(function (o) {
      return o !== b && o.kind === 'label' && Math.abs(o.size - b.size) < 0.3 && b.y > o.y && b.y - o.y < o.size * 1.6 &&
        (Math.abs((o.x + o.x1) / 2 - (b.x + b.x1) / 2) < 40 || Math.abs(o.x - b.x) < 3);
    });
    if (a) { a.text += ' ' + b.text; a.x = Math.min(a.x, b.x); a.x1 = Math.max(a.x1, b.x1); b.kind = 'merged'; }
  });
  labels = labels.filter(function (l) { return l.kind === 'label'; });
  // Columna de cada rótulo: entre los puntos medios con sus vecinos de la misma fila
  labels.forEach(function (l) {
    const c = (l.x + l.x1) / 2;
    const row = labels.filter(function (o) { return o !== l && Math.abs(o.y - l.y) < 4; });
    const left = row.filter(function (o) { return o.x < l.x; }).sort(function (a, b) { return b.x - a.x; })[0];
    const right = row.filter(function (o) { return o.x > l.x; }).sort(function (a, b) { return a.x - b.x; })[0];
    l.colStart = left ? ((left.x + left.x1) / 2 + c) / 2 : Math.min(l.x - 30, c - 120);
    l.colEnd = right ? ((right.x + right.x1) / 2 + c) / 2 : width;
    if (!left && right) l.colStart = Math.min(l.x - 30, 2 * c - l.colEnd);
    l.content = [];
  });
  const sueltos = [];
  segs.forEach(function (s) {
    if (s.kind === 'label' || s.kind === 'merged') return;
    const cx = (s.x + s.x1) / 2;
    // Número en serif justo encima de un rótulo (secuencias de pasos)
    if (s.kind === 'serif' && /^\d{1,2}$/.test(s.text)) {
      const below = labels.find(function (l) { return l.y > s.y && l.y - s.y < 18 && cx >= l.colStart && cx < l.colEnd; });
      if (below) { below.numero = s.text; return; }
    }
    const cand = labels.filter(function (l) {
      return l.y < s.y + 2 && cx >= l.colStart && cx < l.colEnd && !(Math.abs(l.y - s.y) < 2 && s.x < l.x);
    }).sort(function (a, b) { return b.y - a.y || b.x - a.x; });
    const best = cand[0];
    // Texto que cruza varias columnas (p. ej. cierre centrado) va suelto a nivel de página
    if (!best || (s.x < best.colStart - 2 || s.x1 > best.colEnd + 6) && s.kind === 'serif') sueltos.push(s);
    else best.content.push(s);
  });
  const out = labels.map(function (l) {
    l.content.sort(function (a, b) { return a.y - b.y || a.x - b.x; });
    const b = { rotulo: l.text, clave: norm(l.text), size: l.size, x: Math.round(l.x), y: Math.round(l.y), contenido: joinLines(l.content) };
    if (l.numero) b.numero = l.numero;
    return b;
  });
  if (sueltos.length) out.push({ rotulo: '', clave: '_SUELTOS', size: 0, x: 0, y: 0, contenido: joinLines(sueltos.sort(function (a, b) { return a.y - b.y; })) });
  return out;
}

// Une líneas de un mismo párrafo; separa viñetas, serif e itálicas
function joinLines(segs) {
  const out = [];
  let prev = null;
  segs.forEach(function (s) {
    const tipo = /^[•·▪\-–]\s/.test(s.text) ? 'vineta' : s.kind === 'serif' ? 'serif' : s.kind === 'italic' ? 'italica' : s.kind === 'bold' ? 'destacado' : 'texto';
    const near = prev && Math.abs(s.size - prev.size) < 0.6 && s.y - prev.y < s.size * 1.9 && Math.abs(s.x - prev.x) < 60;
    // continuación de párrafo, o segunda línea de una viñeta
    const cont = near && ((tipo === prev.tipo && tipo !== 'vineta' && tipo !== 'serif') || (prev.tipo === 'vineta' && tipo === 'texto'));
    if (cont) {
      prev.texto = /[a-z]-$/i.test(prev.texto) && /^[a-z]/.test(s.text) ? prev.texto + s.text : prev.texto + ' ' + s.text;
      prev.y = s.y;
    } else {
      prev = { tipo: tipo, texto: tipo === 'vineta' ? s.text.replace(/^[•·▪\-–]\s*/, '') : s.text, size: s.size, x: s.x, y: s.y };
      out.push(prev);
    }
  });
  return out.map(function (o) { return { tipo: o.tipo, texto: o.texto }; });
}

// ---------- 3. Imágenes embebidas → archivos ----------
async function extractImages(pages, outDir, sharp) {
  const fs = require('fs');
  const res = [];
  for (const pg of pages) {
    let i = 0;
    for (const id of pg.imageIds) {
      let obj;
      try { obj = pg.page.objs.get(id); } catch (e) { continue; }
      if (!obj || !obj.data || obj.width < 80) continue;
      const ch = obj.data.length / (obj.width * obj.height);
      const name = 'guia-p' + String(pg.n).padStart(2, '0') + '-' + (++i) + '.jpg';
      await sharp(Buffer.from(obj.data), { raw: { width: obj.width, height: obj.height, channels: Math.round(ch) } }).jpeg({ quality: 92 }).toFile(path.join(outDir, name));
      res.push({ archivo: name, pagina: pg.n, w: obj.width, h: obj.height });
    }
  }
  return res;
}

async function read(buf) {
  const r = await readPages(buf);
  return { paginas: r.pages.map(pageStructure), _pages: r.pages };
}

module.exports = { read, extractImages, norm, segments };
