// PDF guía ficticio → catálogo horizontal: estructura, copy literal, nada fuera de página.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const guia = require('../src/guia');
const catalogo = require('../src/catalogo');
const R = require('../src/render');
const { browser, fileUrl, inspect } = require('../src/exporter');

const PDF = path.join(__dirname, '..', 'ejemplos', 'guia-ficticia.pdf');
const FONTS = fileUrl(path.join(__dirname, '..', 'fonts') + path.sep);

test('el PDF guía se reparte en páginas de catálogo con su jerarquía y copy literal', async function () {
  const est = await guia.read(fs.readFileSync(PDF));
  const cat = catalogo.build({ paginas: est.paginas }, {});
  assert.strictEqual(cat.tipo, 'catalogo');
  assert.strictEqual(cat.producto.ref, '9001');
  const ids = cat.paginas.map(function (p) { return p.plantilla; });
  assert.strictEqual(ids[0], 'C01');
  assert.strictEqual(ids[ids.length - 1], 'C06');
  assert.ok(ids.indexOf('C04') > 0, 'tabla de tallas en su página');
  assert.ok(ids.indexOf('C05') > 0, 'secuencia de pasos en su página');
  assert.ok(cat.paginas.length >= 8 && cat.paginas.length <= 20, 'páginas: ' + cat.paginas.length);
  // todas las páginas son de catálogo horizontal
  cat.paginas.forEach(function (p) { assert.deepStrictEqual(R.sizeOf(p), [1056, 816]); });
  // el copy llega literal y sin perder bloques
  const todo = JSON.stringify(cat);
  assert.ok(todo.indexOf('CONTOURA™ BRA is a fictitious garment created only to test the layout tool.') >= 0);
  assert.ok(todo.indexOf('Fiber choice -> panel placement -> garment assembly -> finished-product behavior.') >= 0);
  const n = est.paginas.reduce(function (s, p) { return s + p.bloques.filter(function (b) { return b.clave !== '_SUELTOS' && b.contenido.length; }).length; }, 0);
  const cols = cat.paginas.reduce(function (s, p) {
    const d = p.datos;
    return s + (d.filas || []).reduce(function (t, f) { return t + f.columnas.length; }, 0) + (p.plantilla === 'C05' ? d.columnas.length : 0) + (d.datos_extra || []).length;
  }, 0);
  assert.strictEqual(cols, n, 'cada bloque del PDF guía queda en una columna');
  // una fila nunca supera 4 columnas y un grupo no se mezcla en una fila
  cat.paginas.forEach(function (p) {
    (p.datos.filas || []).forEach(function (f) {
      assert.ok(f.columnas.reduce(function (s, c) { return s + (c.span || 1); }, 0) <= 4);
      f.columnas.forEach(function (c) { assert.strictEqual(c.grupo || '', f.grupo || ''); });
    });
  });
});

test('las páginas generadas no desbordan y no dejan marcadores', async function () {
  const est = await guia.read(fs.readFileSync(PDF));
  const cat = catalogo.build({ paginas: est.paginas }, {});
  const { b, ctx, intentos } = await browser();
  try {
    const pg = await ctx.newPage();
    const fallas = [];
    for (const page of cat.paginas) {
      const d = R.documentFor(page, { catalog: cat, images: {}, folio: R.folioOf(cat, page), fontBase: FONTS, asset: function () { return ''; } });
      await pg.setViewportSize({ width: 1056, height: 816 });
      await pg.setContent(d.doc);
      await pg.evaluate(function () { return document.fonts.ready; });
      const r = await inspect(pg);
      if (r.fuera.length) fallas.push(page.id + ' desborda: ' + r.fuera.join(', '));
      if (r.corchetes.length) fallas.push(page.id + ' marcadores: ' + r.corchetes.join(', '));
    }
    assert.deepStrictEqual(fallas, []);
    assert.strictEqual(intentos.length, 0);
  } finally { await b.close(); }
});
