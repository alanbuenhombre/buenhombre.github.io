// PDF guía → catálogo horizontal (1056 × 816). No calca la guía: entiende su jerarquía
// (secciones, rótulos, párrafos, viñetas, tabla, pasos, imágenes) y la reparte en páginas de
// catálogo con el sistema MED. Reglas deterministas, copy literal, nada inventado.
'use strict';

const fs = require('fs');
const path = require('path');
const guia = require('./guia');

// Presupuesto de texto por columna (líneas de ~13 px en el ancho útil de cada columna)
const LINE = 20;
function lines(col, w) {
  const cpl = Math.max(18, Math.floor(w / 6.5));
  let n = 2 + (col.grupo ? 1 : 0) + (col.numero ? 2 : 0);
  (col.items || []).forEach(function (it) { n += Math.ceil((it.texto.length + 2) / cpl) + 0.4; });
  return n;
}
function colWidth(spans, total) { return ((total || 928) - 32 * (spans - 1)) / spans; }

// Bloques de la guía → columnas (rótulo + ítems). Los rótulos sin contenido agrupan a los que siguen.
function toColumns(bloques) {
  const cols = [];
  let grupo = '';
  bloques.forEach(function (b) {
    if (b.clave === '_SUELTOS') return;
    if (!b.contenido.length) { grupo = b.rotulo; return; }
    const c = { rotulo: b.rotulo, items: b.contenido };
    if (grupo) c.grupo = grupo;
    if (b.numero) c.numero = b.numero;
    cols.push(c);
  });
  return cols;
}

// Reparte columnas en filas (hasta `maxCols` por fila; un grupo nuevo abre fila) y las filas en páginas
// según el alto disponible. Una columna muy larga ocupa dos. Nada se recorta: si aún así no cabe,
// queda en su página y la exportación lo reporta.
function paginate(cols, opts) {
  const maxCols = opts.maxCols || 4, total = opts.width || 928, ROW_GAP = 26, GRUPO = 24;
  const rowH = function (row) {
    const spans = row.columnas.reduce(function (s, c) { return s + c.span; }, 0);
    const w = colWidth(Math.max(spans, Math.min(maxCols, 2)), total);
    return Math.max.apply(null, row.columnas.map(function (c) { return lines(c, w * c.span + 32 * (c.span - 1)) * LINE; })) + ROW_GAP + (row.grupo ? GRUPO : 0);
  };
  const pages = [];
  let page = [], used = 0, row = null;
  const closeRow = function () {
    if (!row) return;
    const h = rowH(row);
    if (page.length && used + h > opts.height) { pages.push(page); page = []; used = 0; }
    page.push(row); used += h; row = null;
  };
  cols.forEach(function (c) {
    c.span = lines(c, colWidth(maxCols, total)) * LINE > opts.height * 0.9 ? 2 : 1;
    const spans = row ? row.columnas.reduce(function (s, x) { return s + x.span; }, 0) : 0;
    if (row && ((c.grupo || '') !== (row.grupo || '') || spans + c.span > maxCols)) closeRow();
    if (!row) row = { grupo: c.grupo || '', columnas: [], ancho: maxCols };
    row.columnas.push(c);
  });
  closeRow();
  if (page.length) pages.push(page);
  pages.forEach(function (pg) { pg.forEach(function (r) { if (!r.grupo) delete r.grupo; r.columnas.forEach(function (c) { if (c.span === 1) delete c.span; }); }); });
  return pages;
}

function sueltos(p) {
  const s = (p.bloques || []).find(function (b) { return b.clave === '_SUELTOS'; });
  return s ? s.contenido : [];
}

function build(estructura, opts) {
  opts = opts || {};
  const P = estructura.paginas || [];
  const pend = [];
  const p1 = P[0] || { bloques: [] };
  const linea = (p1.producto_linea || '').replace(/\s*·\s*\d{1,2}\s*$/, '');
  const m = linea.match(/^(.*?)\s*·\s*REF\.?\s*([\w-]+)/i);
  const nombre = m ? m[1].trim() : (linea || p1.h1 || '');
  const ref = m ? m[2] : '';
  if (!nombre || !ref) pend.push('Nombre o referencia no reconocidos en la cabecera del PDF guía.');
  // kicker: sección de la guía; la línea de producto va al pie de cada página
  const kicker = function (p) { return p.seccion || ''; };
  const paginas = [];
  let n = 0;
  const add = function (plantilla, titulo, datos, fotos) {
    n++;
    paginas.push({ id: 'c' + String(n).padStart(2, '0'), plantilla: plantilla, seccion: datos.kicker || '', titulo: titulo, guia_pagina: datos._g, datos: datos, fotos: fotos || {} });
    delete datos._g;
    return paginas[paginas.length - 1];
  };

  P.forEach(function (p, i) {
    const first = i === 0, last = i === P.length - 1;
    const bl = p.bloques || [];
    const su = sueltos(p);
    const cierre = su.filter(function (s) { return s.tipo === 'serif'; }).map(function (s) { return s.texto; }).join(' ');
    const notas = su.filter(function (s) { return s.tipo !== 'serif'; });
    const base = { kicker: kicker(p), titulo: p.h1 || '', entradilla: p.entradilla || '', linea: linea, _g: p.n };

    // Portada: identidad, descripción y fila de metadatos de la página 1
    let extra = [];
    if (first) {
      extra = bl.filter(function (b) { return b.contenido.length && b.contenido.every(function (c) { return c.tipo === 'texto'; }) && lines({ items: b.contenido }, 420) <= 4; }).slice(0, 2);
      add('C01', 'Portada · ' + (p.seccion || 'Producto'), { kicker: p.seccion || '', ref: ref, nombre: nombre, entradilla: p.entradilla || '', meta: p.meta || [], linea: linea,
        datos_extra: extra.map(function (b) { return { rotulo: b.rotulo, texto: b.contenido.map(function (c) { return c.texto; }).join(' ') }; }), _g: p.n });
      base.entradilla = '';
    }

    // Pasos numerados → secuencia; el resto → columnas
    const cols = toColumns(bl);
    const pasos = cols.filter(function (c) { return c.numero; });
    let rest = cols.filter(function (c) { return !c.numero; });
    if (extra.length) rest = rest.filter(function (c) { return !extra.some(function (b) { return b.rotulo === c.rotulo && b.contenido === c.items; }); });

    // Tabla (tallas u otra) en su propia página, con las notas al pie
    if (p.tabla) {
      add('C04', (p.h1 || 'Tabla') + ' · tabla', Object.assign({}, base, { tabla: p.tabla, nota: notas.map(function (s) { return s.texto; }).join(' ') }));
      base.titulo = base.titulo ? base.titulo : '';
      base.entradilla = '';
    }

    const hasImg = (p.imagenes || []).length > 0;
    const headH = 816 - 136 - 90 - (base.entradilla ? Math.ceil(base.entradilla.length / 78) * 21 + 24 : 0);
    let chunks = [];
    if (rest.length) {
      if (hasImg && !first) {
        // Primera página de la sección: imagen a la izquierda + hasta 2 columnas
        const side = paginate(rest, { maxCols: 2, width: 488, height: headH - 30 });
        chunks.push({ plantilla: 'C03', filas: side[0] });
        rest = rest.slice(side[0].reduce(function (n, r) { return n + r.columnas.length; }, 0));
      }
      paginate(rest, { maxCols: 4, width: 928, height: headH }).forEach(function (pg) { chunks.push({ plantilla: 'C02', filas: pg }); });
    }
    chunks.forEach(function (ch, j) {
      const d = Object.assign({}, base, { filas: ch.filas });
      if (j > 0 || p.tabla) { d.continuacion = 'si'; d.titulo = ''; d.entradilla = ''; }
      if (j === chunks.length - 1 && !last && cierre) d.cierre = cierre;
      add(ch.plantilla, (p.h1 || p.seccion || 'Sección') + (j ? ' (' + (j + 1) + ')' : ''), d);
    });
    if (pasos.length) {
      for (let j = 0; j < pasos.length; j += 5) {
        const cont = !!(chunks.length || j || p.tabla);
        add('C05', (p.h1 || 'Pasos') + ' · pasos', Object.assign({}, base, { columnas: pasos.slice(j, j + 5), grupo: pasos[j].grupo || '', titulo: cont ? '' : base.titulo, entradilla: cont ? '' : base.entradilla, continuacion: cont ? 'si' : '', con_fotos: hasImg ? 'si' : 'no' }));
      }
    }
    if (last) {
      // Cierre oscuro: el titular y el texto de cierre de la última sección
      const lastPage = paginas[paginas.length - 1];
      if (lastPage && lastPage.plantilla === 'C02' && lastPage.guia_pagina === p.n && lastPage.datos.filas.length <= 2) {
        lastPage.plantilla = 'C06'; lastPage.titulo = 'Cierre';
        lastPage.datos.cierre = cierre; lastPage.datos.nombre = nombre; lastPage.datos.ref = ref;
      } else {
        add('C06', 'Cierre', { kicker: kicker(p), titulo: '', entradilla: '', filas: [], cierre: cierre, nombre: nombre, ref: ref, _g: p.n });
      }
    }
  });

  if (!P.length) pend.push('El PDF guía no tiene texto legible.');
  pend.push('Revisar el orden de las páginas y el reparto de columnas; las fotos finales y las ilustraciones se cargan en la pestaña Imágenes.');
  return { tipo: 'catalogo', version: 1, producto: { nombre: nombre, ref: ref, linea: linea }, marca: {}, paginas: paginas, pendientes: pend };
}

// Imágenes extraídas del PDF guía → ranuras del catálogo (propuesta, revisable)
function assignImages(cat, imgs) {
  const byPage = function (n) { return imgs.filter(function (i) { return i.pagina === n; }).sort(function (a, b) { return b.w * b.h - a.w * a.h; }); };
  const set = function (page, slot, im) { if (page && im) page.fotos[slot] = im.archivo; };
  cat.paginas.forEach(function (pg) {
    const list = byPage(pg.guia_pagina);
    if (pg.plantilla === 'C01') set(pg, 'modelo', list.filter(function (i) { return i.h > i.w; })[0] || list[0]);
    if (pg.plantilla === 'C03') set(pg, 'imagen', list[0]);
    if (pg.plantilla === 'C05') list.filter(function (i) { return i.w < 900; }).sort(function (a, b) { return a.orden - b.orden; }).slice(0, 5).forEach(function (im, i) { set(pg, 'paso' + (i + 1), im); });
  });
}

async function fromPdf(pdfFile, projectDir, opts) {
  const sharp = require('sharp');
  const buf = fs.readFileSync(pdfFile);
  const est = await guia.read(buf);
  const fotos = path.join(projectDir, 'entrada', 'fotos');
  fs.mkdirSync(fotos, { recursive: true });
  const imgs = await guia.extractImages(est._pages, fotos, sharp);
  est.paginas.forEach(function (p) { p.imagenes = imgs.filter(function (i) { return i.pagina === p.n; }); });
  const cat = build({ paginas: est.paginas }, opts || {});
  assignImages(cat, imgs);
  cat.fuente = path.basename(pdfFile);
  return { ficha: cat, imagenes: imgs, estructura: est.paginas };
}

module.exports = { build, fromPdf, assignImages, paginate, toColumns };
