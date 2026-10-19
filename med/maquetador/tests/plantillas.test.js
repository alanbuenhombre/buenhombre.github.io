// Cada plantilla mide exactamente su formato y ningún texto se sale del marco.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const R = require('../src/render');
const { browser, fileUrl } = require('../src/exporter');

const FONTS = fileUrl(path.join(__dirname, '..', 'fonts') + path.sep);

test('T01–T20, S01–S10 y F01–F07 miden su tamaño y nada se desborda', async function () {
  const { b, ctx, intentos } = await browser();
  try {
    const pg = await ctx.newPage();
    const ids = Object.keys(R.TEMPLATES).sort();
    const cat = { paginas: [], marca: {} };
    const fallas = [];
    for (const id of ids) {
      const page = { id: 'x' + id, plantilla: id, datos: {}, fotos: {} };
      cat.paginas = [page];
      const size = R.sizeOf(page);
      const d = R.documentFor(page, { catalog: cat, images: {}, folio: '01', fontBase: FONTS, asset: function () { return ''; } });
      await pg.setViewportSize({ width: size[0], height: size[1] });
      await pg.setContent(d.doc);
      await pg.evaluate(function () { return document.fonts.ready; });
      const r = await pg.evaluate(function () {
        const root = document.querySelector('.med-page');
        const W = root.offsetWidth, H = root.offsetHeight, out = [];
        root.querySelectorAll('[data-el]').forEach(function (e) {
          const b = e.getBoundingClientRect();
          if (b.width && (b.right > W + 1 || b.bottom > H + 1 || b.left < -1 || b.top < -1)) out.push(e.dataset.el);
        });
        return { W: W, H: H, fuera: out };
      });
      if (r.W !== size[0] || r.H !== size[1]) fallas.push(id + ' mide ' + r.W + '×' + r.H);
      if (r.fuera.length) fallas.push(id + ' desborda: ' + r.fuera.join(', '));
    }
    assert.deepStrictEqual(fallas, []);
    assert.ok(ids.length >= 43);
    assert.strictEqual(intentos.length, 0);
  } finally { await b.close(); }
});
