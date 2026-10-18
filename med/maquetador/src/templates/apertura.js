// Apertura, marca y cierre: T01 Portada · T02 Manifiesto · T18 Respiro · T19 Póster · T20 Contraportada
'use strict';

module.exports = [
  {
    id: 'T01', nombre: 'Portada', grupo: 'Apertura',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ivory);
      x += k.img('foto', 0, 408, 1056, 408, { tx: 0.62, label: 'Foto de portada (mitad inferior)' });
      x += k.grad('left: 0; top: 408px; width: 1056px; height: 150px; background: linear-gradient(180deg, rgba(248,247,244,1) 0%, rgba(248,247,244,0) 100%)');
      x += k.grad('left: 0; top: 640px; width: 1056px; height: 176px; background: linear-gradient(180deg, rgba(20,27,30,0) 0%, rgba(20,27,30,0.6) 100%)');
      x += k.logo(64, 56, 180, 34, 'logo');
      x += k.kicker('kicker', '[CATÁLOGO 2026]', 0, 0).replace('left: 0px; top: 0px;', 'right: 64px; top: 64px;');
      x += k.serif('titular', '[Titular de portada]', 64, 132, 92, C.teal, { w: 860 });
      ['dato1', 'dato2', 'dato3'].forEach(function (d, i) {
        x += k.mono(d, ['[DATO 1]', '[DATO 2]', '[DATO 3]'][i], 64 + i * 320, 760, C.ivory);
      });
      return x + '</div>';
    }
  },
  {
    id: 'T02', nombre: 'Manifiesto', grupo: 'Apertura',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.stone);
      x += k.img('foto', 0, 0, 1056, 816, { tx: 0.74, label: 'Foto a sangre' });
      x += k.grad('left: 0; top: 0; width: 640px; height: 816px; background: linear-gradient(90deg, rgba(236,234,229,0.78) 0%, rgba(236,234,229,0.6) 50%, rgba(236,234,229,0) 100%)');
      x += k.kicker('kicker', 'MANIFESTO', 64, 352);
      x += k.serif('titular', '[Titular del manifiesto]', 64, 380, 64, C.teal, { w: 560 });
      x += k.body('texto', '[Texto de 30 a 40 palabras…]', 64, 560, 440, C.text, 14);
      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'T18', nombre: 'Respiro', grupo: 'Estructura',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.cream);
      x += k.dots(0.13);
      x += k.v('variante', 'centro') === 'esquina' ? k.logo(812, 732, 180, 34, 'logo') : k.logo(496, 386, 64, 44, 'isotipo');
      return x + '</div>';
    }
  },
  {
    id: 'T19', nombre: 'Póster', grupo: 'Brand',
    render: function (k) {
      const C = k.C;
      const dark = k.v('tono', 'oscuro') !== 'claro';
      const bg = dark ? C.teal : C.stone, fg = dark ? C.ivory : C.teal;
      let x = k.root(bg, fg);
      x += k.img('foto', 0, 0, 1056, 816, { tx: +k.v('foco_x', '0.62'), label: 'Foto a sangre' });
      x += dark ? k.grad('left: 0; top: 360px; width: 1056px; height: 456px; background: linear-gradient(180deg, rgba(20,27,30,0) 0%, rgba(20,27,30,0.62) 100%)')
        : k.grad('left: 0; top: 0; width: 600px; height: 816px; background: linear-gradient(90deg, rgba(236,234,229,0.7) 0%, rgba(236,234,229,0) 100%)');
      x += k.logo(64, 56, 180, 34, dark ? 'logo' : 'isotipo', dark);
      x += k.f('titular', '[Titular del póster]', 64, dark ? 520 : 430, k.S + '; font-size: ' + k.v('tamano', '96') + 'px; line-height: 0.95; letter-spacing: -1px; color: ' + fg, { w: dark ? 760 : 520 });
      x += k.p('linea', 0, 0, k.v('linea', '[LÍNEA EN MONO]'), k.M + '; letter-spacing: 2.4px; color: ' + (dark ? C.goldLight : fg) + '; opacity: 0.9', { right: 64, bottom: 48, field: 'linea' });
      return x + '</div>';
    }
  },
  {
    id: 'T20', nombre: 'Contraportada', grupo: 'Apertura',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ink, C.ivory);
      x += k.img('foto', 0, 0, 1056, 816, { tx: 0.5, label: 'Foto oscura (a sangre)' });
      x += k.grad('left: 0; top: 0; width: 1056px; height: 816px; background: linear-gradient(180deg, rgba(20,27,30,0.35) 0%, rgba(20,27,30,0.1) 40%, rgba(20,27,30,0.7) 100%)');
      x += k.logo(64, 56, 180, 34, 'logo', true);
      x += k.serif('url', '[medsciencesystems.com]', 64, 640, 40, C.ivory, { w: 600 });
      x += k.mono('certificaciones', 'ISO 13485 · ISO 9001 · INVIMA', 64, 720, C.goldLight);
      x += k.p('pie', 0, 0, k.v('pie', '[CIUDAD · PAÍS]'), k.M + '; letter-spacing: 2.4px; color: ' + C.line, { right: 64, bottom: 64, field: 'pie' });
      return x + '</div>';
    }
  }
];
