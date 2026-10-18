// Recorrido del capítulo: T03 Entrada · T04 Rayos X oscuro · T05 Materiales foto + rayos X
// T06 Familias · T07 Portadilla de familia
'use strict';

module.exports = [
  {
    id: 'T03', nombre: 'Entrada de capítulo', grupo: 'Capítulo',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ink, C.ivory);
      x += k.img('foto', 0, 0, 1056, 816, { tx: 0.3, label: 'Foto oscura escultórica (a sangre)' });
      x += k.grad('left: 0; top: 420px; width: 1056px; height: 396px; background: linear-gradient(180deg, rgba(20,27,30,0) 0%, rgba(20,27,30,0.66) 100%)');
      // Número gigante al 12 %
      x += k.p('numero', 0, 0, k.v('numero', '00'), k.S + '; font-size: 380px; line-height: 0.8; letter-spacing: -8px; color: rgba(248,247,244,0.12)', { right: 40, bottom: 470, field: 'numero' });
      // Capa técnica: marco de escaneo con 8 nodos alrededor del sujeto y un llamado
      const fx = +k.v('marco_x', '150'), fy = +k.v('marco_y', '150'), fw = +k.v('marco_w', '320'), fh = +k.v('marco_h', '520');
      x += k.scanFrame(fx, fy, fw, fh, C.ivory, k.v('marco_label', 'SCAN 01 · [ZONA]'));
      const ax = fx + fw * 0.62, ay = fy + fh * 0.48;
      x += k.callout(ax, ay, fx + fw + 120, fy + fh * 0.32, C.ivory);
      x += k.p('llamado', fx + fw + 132, fy + fh * 0.32 - 7, k.v('llamado', '[LLAMADO · DATO]'), k.M + '; letter-spacing: 1.6px; color: ' + C.ivory, { field: 'llamado', w: 220 });
      x += k.p('kicker', 0, 0, k.v('kicker', 'CHAPTER [00] · [LÍNEA]'), k.M + '; letter-spacing: 2.4px; color: ' + C.goldLight + '; text-align: right', { right: 64, bottom: 168, w: 520, field: 'kicker' });
      x += k.p('titulo', 0, 0, k.v('titulo', '[Nombre del capítulo]'), k.S + '; font-size: 54px; line-height: 1; color: ' + C.ivory + '; text-align: right', { right: 64, bottom: 64, w: 560, field: 'titulo' });
      x += k.folio(C.line).replace('bottom: 36px', 'bottom: 36px; opacity: 0');
      return x + '</div>';
    }
  },
  {
    id: 'T04', nombre: 'Rayos X oscuro', grupo: 'Capítulo',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.inkDeep, C.ivory);
      x += k.crosses(64, 48, 928, 720, 48, C.line, 0.22);
      x += k.kicker('kicker', 'ANATOMY · X-RAY', 64, 48, C.line);
      x += k.h2('titulo', '[Titular de la anatomía]', 64, 76, 620, 40, C.ivory);
      x += k.img('rayosx1', 64, 196, 440, 349, { fit: 'contain', label: 'Rayos X 1', dark: true, ph: '[RAYOS X]' });
      x += k.img('rayosx2', 552, 196, 440, 349, { fit: 'contain', label: 'Rayos X 2', dark: true, ph: '[RAYOS X]' });
      x += k.scanFrame(64, 196, 440, 349, C.line);
      x += k.scanFrame(552, 196, 440, 349, C.line);
      x += k.mono('fig1', 'FIG. 01 · [VISTA FRONTAL]', 64, 562, C.line);
      x += k.mono('fig2', 'FIG. 02 · [VISTA POSTERIOR]', 552, 562, C.line);
      x += k.body('texto', '[Texto de 30 a 40 palabras sobre la arquitectura de la prenda.]', 64, 640, 440, 'rgba(248,247,244,0.8)', 13);
      x += k.folio(C.line);
      return x + '</div>';
    }
  },
  {
    id: 'T05', nombre: 'Materiales: foto + rayos X', grupo: 'Capítulo',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ivory);
      x += k.kicker('kicker', 'MATERIAL INTELLIGENCE', 64, 48);
      x += k.h2('titulo', '[Nombre del material]', 64, 76, 300, 40);
      x += k.body('texto', '[Texto de 40 a 60 palabras sobre el material: principio, arquitectura y para qué sirve.]', 64, 196, 300, C.text, 14);
      const specs = k.d('specs', [['PRINCIPLE', '[Confirmar]'], ['ARCHITECTURE', '[Confirmar]'], ['FAMILIES', '[Confirmar]']]);
      specs.slice(0, 3).forEach(function (s, i) {
        const yy = 560 + i * 62;
        x += k.rule(64, yy, 300, i ? C.line : C.teal);
        x += k.p('spec' + i + '_l', 64, yy + 12, s[0], k.M + '; letter-spacing: 1.6px; color: ' + C.steel);
        x += k.p('spec' + i + '_v', 64, yy + 28, s[1], k.S + '; font-size: 20px; color: ' + C.teal, { w: 300 });
      });
      [0, 1].forEach(function (i) {
        const xx = 404 + i * 312;
        x += k.img('foto' + (i + 1), xx, 120, 276, 246, { label: 'Foto material ' + (i + 1) });
        x += '<div class="deco" style="position: absolute; left: ' + xx + 'px; top: 382px; width: 276px; height: 219px; background: ' + C.cream + '; pointer-events: none"></div>\n';
        x += k.img('rayosx' + (i + 1), xx + 12, 392, 252, 199, { fit: 'contain', label: 'Rayos X crema ' + (i + 1), ph: '[RAYOS X CREMA]' });
        x += k.mono('fig' + (i + 1), 'FIG. 0' + (i + 1) + ' · [CAPA]', xx, 616, C.steel);
        x += k.body('fig' + (i + 1) + '_texto', '[Descripción breve de la capa.]', xx, 636, 276, C.text, 12);
      });
      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'T06', nombre: 'Familias', grupo: 'Capítulo',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ivory);
      x += k.img('banda', 0, 0, 1056, 340, { tx: 0.6, label: 'Banda de foto' });
      x += k.kicker('kicker', 'CHAPTER [00] · FAMILIES', 64, 388);
      x += k.h2('titulo', '[Titular del índice de familias]', 64, 416, 400, 54);
      x += k.body('texto', '[Texto de 20 a 30 palabras.]', 64, 560, 380, C.steel, 13);
      const fams = k.d('familias', [1, 2, 3, 4, 5, 6, 7].map(function (n) { return ['0' + n, '[Familia]', '[00]']; }));
      fams.slice(0, 7).forEach(function (fm, i) {
        const yy = 380 + i * 54;
        x += k.rule(560, yy, 432, i ? C.line : C.teal);
        x += k.p('fn' + i, 560, yy + 18, fm[0], k.M + '; color: ' + C.steel);
        x += k.p('fname' + i, 604, yy + 12, fm[1], k.S + '; font-size: 24px; line-height: 1.1; color: ' + C.teal, { w: 320 });
        x += k.p('fpag' + i, 0, yy + 18, fm[2], k.M + '; color: ' + C.steel, { right: 64 });
      });
      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'T07', nombre: 'Portadilla de familia', grupo: 'Capítulo',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ivory);
      x += k.img('ilustracion', 0, 0, 600, 816, { tx: 0.5, label: 'Ilustración o foto de la familia' });
      x += k.kicker('kicker', 'FAMILY [00]', 648, 120);
      x += k.h2('titulo', '[Nombre de la familia]', 648, 148, 344, 54);
      x += k.body('texto', '[Texto de 30 a 40 palabras que presenta la familia y su tecnología.]', 648, 300, 344, C.text, 14);
      x += k.mono('material_label', 'MATERIAL', 648, 520, C.steel);
      x += k.serif('material', '[Material]', 648, 540, 24, C.teal, { w: 344 });
      x += k.rule(648, 600, 344);
      x += k.mono('cierres_label', 'CLOSURES', 648, 616, C.steel);
      const tags = k.d('cierres', ['[hook & eye]', '[pull-on]', '[zipper]']);
      let tx = 648;
      tags.slice(0, 4).forEach(function (t, i) {
        const w = 22 + t.length * 7.2;
        x += '<p data-el="tag' + i + '" style="position: absolute; left: ' + Math.round(tx) + 'px; top: 640px; margin: 0; ' + k.M + '; letter-spacing: 1.2px; color: ' + C.teal + '; border: 1px solid ' + C.teal + '; border-radius: 99px; padding: 6px 11px">' + k.rich(t.toUpperCase()) + '</p>\n';
        tx += w + 18;
      });
      x += k.folio();
      return x + '</div>';
    }
  }
];
