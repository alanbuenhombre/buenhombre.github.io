// Plantillas de producto: T08 Producto · T09 Detalle técnico · T10 En uso · T11 Gama
'use strict';

module.exports = [
  {
    id: 'T08', nombre: 'Producto', grupo: 'Productos',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.stone);
      x += k.img('modelo', 0, 0, 1056, 816, { tx: 0.76, label: 'Foto de la modelo (a sangre)', ph: '[TECH SCAN / FOTO]' });
      x += k.grad('left: 0; top: 0; width: 680px; height: 816px; background: linear-gradient(90deg, rgba(236,234,229,0.75) 0%, rgba(236,234,229,0.55) 45%, rgba(236,234,229,0) 100%)');
      x += k.kicker('kicker', '[FAMILY 00 · FAMILIA]', 64, 48);
      x += k.serif('ref', '[REF]', 64, 82, 96, C.teal, { w: 520 });
      x += k.f('nombre', '[Nombre del producto]', 64, 190, 'font-size: 16px; line-height: 1.5; color: ' + C.text, { w: 380 });
      const rows = [['COVERAGE', 'cobertura', '[Confirmar]'], ['CLOSURE', 'cierre', '[Confirmar]'], ['MATERIAL', 'material', '[Confirmar]'], ['SIZES', 'tallas', '[XS – XXL]']];
      rows.forEach(function (rw, i) {
        const y = 300 + i * 64;
        x += k.rule(64, y, 380, i ? C.line : C.teal);
        x += k.p('lbl' + i, 64, y + 14, rw[0], k.M + '; letter-spacing: 1.6px; color: ' + C.steel);
        x += k.serif(rw[1], rw[2], 64, y + 30, 24, C.teal, { w: 380 });
      });
      x += k.rule(64, 556, 380, C.line);
      x += k.qr(64, 636, 92, k.v('qr', '[URL del producto]'), C.teal);
      x += k.p('qrlbl', 172, 674, 'SEE IT IN 3D', k.M + '; letter-spacing: 2.4px; color: ' + C.teal);
      x += k.mono('qr_texto', '[medsciencesystems.com/ref]', 172, 694, C.steel);
      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'T09', nombre: 'Detalle técnico', grupo: 'Productos',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ivory);
      x += k.kicker('kicker', '[REF] · TECHNICAL DETAIL', 64, 48);
      x += k.h2('titulo', '[Titular del detalle técnico]', 64, 76, 420, 40);
      const caps = [['01 · CLOSURE', '[Tipo de cierre — confirmar].'], ['02 · STRAPS', '[Ajustable / fija — confirmar].'], ['03 · LEG', '[Largo y acabado — confirmar].']];
      caps.forEach(function (c, i) {
        const xx = 64 + i * 314;
        x += k.img('detalle' + (i + 1), xx, 170, 300, 380, { label: 'Detalle ' + (i + 1), tx: 0.5 });
        x += k.rule(xx, 566, 300);
        x += k.mono('cap' + (i + 1), c[0], xx, 580, C.teal);
        x += k.body('cap' + (i + 1) + '_texto', c[1], xx, 600, 300, C.text, 13);
      });
      x += k.rule(64, 676, 928, C.line);
      [['COMPRESSION', '[mmHg — confirmar]'], ['MATERIAL', '[Material]'], ['SIZES', '[XS – XXL]'], ['CARE', '[Ver página 00]']].forEach(function (d, i) {
        const xx = 64 + i * 232;
        x += k.mono('dato' + (i + 1) + '_label', d[0], xx, 690, C.steel);
        x += k.serif('dato' + (i + 1), d[1], xx, 708, 22, C.teal, { w: 220 });
      });
      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'T10', nombre: 'Producto en uso', grupo: 'Productos',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ivory);
      x += k.img('uso1', 0, 0, 528, 620, { tx: 0.5, label: 'Foto en uso 1' });
      x += k.img('uso2', 528, 0, 528, 620, { tx: 0.5, label: 'Foto en uso 2' });
      x += k.mono('kicker1', '[REF] · IN USE', 64, 650, C.steel);
      x += k.serif('titulo1', '[Titular de 4 a 6 palabras]', 64, 672, 34, C.teal, { w: 420 });
      x += k.mono('kicker2', '[CONTEXTO]', 592, 650, C.steel);
      x += k.serif('titulo2', '[Titular de 4 a 6 palabras]', 592, 672, 34, C.teal, { w: 400 });
      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'T11', nombre: 'Gama (grid 3×2)', grupo: 'Productos',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ivory);
      x += k.kicker('kicker', '[FAMILY 00 · FAMILIA]', 64, 48);
      x += k.h2('titulo', '[Titular de la gama]', 64, 76, 600, 40);
      const items = k.d('items', [1, 2, 3, 4, 5, 6].map(function () { return { ref: '[REF]', nombre: '[Nombre · cierre]', pagina: '[PÁG]' }; }));
      for (let i = 0; i < 6; i++) {
        const it = items[i];
        const cx = 64 + (i % 3) * 318, cy = 150 + Math.floor(i / 3) * 318;
        if (!it) { x += k.ph(cx, cy, 292, 210, '—', false, ''); continue; }
        x += k.img('item' + (i + 1), cx, cy, 292, 210, { tx: 0.72, label: 'Producto ' + (i + 1) });
        x += k.rule(cx, cy + 222, 292);
        x += k.p('item' + (i + 1) + '_ref', cx, cy + 234, it.ref, k.S + '; font-size: 24px; color: ' + C.teal, { w: 230 });
        x += k.p('item' + (i + 1) + '_nombre', cx, cy + 266, it.nombre, 'font-size: 12px; color: ' + C.steel, { w: 292 });
        x += k.p('item' + (i + 1) + '_pag', cx + 250, cy + 240, it.pagina, k.M + '; color: ' + C.steel);
      }
      x += k.folio();
      return x + '</div>';
    }
  }
];
