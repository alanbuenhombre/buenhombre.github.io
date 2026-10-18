// Páginas generales y de capítulo con foto: T12 Clínica · T13 Guía de tallas · T14 Cómo se coloca
// T15 Cuidados · T16 Evidencia · T17 Cierre Human
'use strict';

// Íconos de lavado (SVG de línea, sección T15)
const ICONS = {
  lavar30: '<path d="M6 14h32l-3 22H9z"/><path d="M6 14c4 4 8-4 12 0s8-4 12 0 6-2 8 0"/><text x="22" y="31" font-size="9" text-anchor="middle" fill="#2E4A52" stroke="none" font-family="IBM Plex Mono">30</text>',
  lavarmano: '<path d="M6 14h32l-3 22H9z"/><path d="M6 14c4 4 8-4 12 0s8-4 12 0 6-2 8 0"/><path d="M18 24c2-3 6-3 8 0"/>',
  noblanquear: '<path d="M22 6L40 36H4z"/><path d="M8 10l28 26M36 10L8 36"/>',
  nosecadora: '<rect x="6" y="6" width="32" height="32"/><circle cx="22" cy="22" r="11"/><path d="M8 8l28 28M36 8L8 36"/>',
  secarplano: '<rect x="6" y="6" width="32" height="32"/><path d="M12 22h20"/>',
  secarsombra: '<rect x="6" y="6" width="32" height="32"/><path d="M6 14L14 6M6 22L22 6"/><path d="M12 24h20"/>',
  noplanchar: '<path d="M8 32h28l-3-14H16c-4 0-7 4-8 14z"/><path d="M10 10l26 26M36 10L10 36"/>',
  planchabaja: '<path d="M8 32h28l-3-14H16c-4 0-7 4-8 14z"/><circle cx="22" cy="26" r="1.6" fill="#2E4A52"/>',
  nolavarseco: '<circle cx="22" cy="22" r="15"/><path d="M10 10l24 24M34 10L10 34"/>'
};
function icon(name) {
  return '<svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#2E4A52" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.lavar30) + '</svg>';
}

module.exports = [
  {
    id: 'T12', nombre: 'Clínica', grupo: 'Capítulo',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ink, C.ivory);
      x += k.img('foto', 0, 0, 1056, 816, { tx: 0.55, label: 'Foto clínica (a sangre)' });
      x += k.grad('left: 0; top: 380px; width: 1056px; height: 436px; background: linear-gradient(180deg, rgba(20,27,30,0) 0%, rgba(20,27,30,0.68) 100%)');
      x += k.callout(+k.v('punto_x', '612'), +k.v('punto_y', '330'), 760, 250, C.ivory);
      x += k.p('llamado', 772, 244, k.v('llamado', 'MEASURED FIT'), k.M + '; letter-spacing: 2.4px; color: ' + C.ivory, { field: 'llamado' });
      x += k.kicker('kicker', '[CLINICAL · AJUSTE PROFESIONAL]', 64, 600, C.goldLight);
      x += k.h2('titulo', '[Titular de la página clínica]', 64, 628, 640, 44, C.ivory);
      x += k.body('texto', '[Texto de 20 a 30 palabras sobre el ajuste profesional.]', 64, 700, 560, 'rgba(248,247,244,0.85)', 13);
      x += k.folio(C.line);
      return x + '</div>';
    }
  },
  {
    id: 'T13', nombre: 'Guía de tallas', grupo: 'Generales',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ivory);
      x += k.img('foto', 0, 0, 420, 816, { tx: 0.45, label: 'Foto de medición' });
      x += k.kicker('kicker', 'SIZE GUIDE', 468, 48);
      x += k.h2('titulo', '[Titular de la guía de tallas]', 468, 76, 520, 40);
      x += k.body('texto', 'Measure over the skin, standing, relaxed. [Texto por confirmar con MED.]', 468, 130, 520, C.steel, 13);
      const cols = k.d('columnas', ['SIZE', 'BUST (CM)', 'WAIST (CM)', 'HIP (CM)']);
      const rows = k.d('tabla', ['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(function (s) { return [s, '[00–00]', '[00–00]', '[00–00]']; }));
      const ty = 220, cw = 520 / Math.max(cols.length, 1);
      cols.forEach(function (c, j) { x += k.p('col' + j, 468 + j * cw, ty, c, k.M + '; letter-spacing: 1.2px; color: ' + C.teal); });
      x += k.rule(468, ty + 20, 520);
      const rh = Math.min(40, 280 / Math.max(rows.length, 1));
      rows.forEach(function (rw, i) {
        const yy = ty + 34 + i * rh;
        x += k.p('fila' + i, 468, yy, rw[0], k.S + '; font-size: 22px; color: ' + C.teal);
        for (let j = 1; j < cols.length; j++) x += k.p('celda' + i + '_' + j, 468 + j * cw, yy + 4, rw[j] == null ? '[00–00]' : rw[j], 'font-size: 13px; color: ' + C.text);
        x += k.rule(468, yy + rh - 8, 520, C.line);
      });
      const pts = k.d('puntos', [['01', 'Bust · fullest point'], ['02', 'Waist · narrowest point'], ['03', 'Hip · widest point']]);
      pts.slice(0, 3).forEach(function (pt, i) {
        const xx = 468 + i * 176;
        x += k.p('pn' + i, xx, 600, pt[0], k.S + '; font-size: 30px; color: ' + C.gold);
        x += k.p('pt' + i, xx, 640, pt[1], 'font-size: 12px; color: ' + C.text, { w: 160 });
      });
      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'T14', nombre: 'Cómo se coloca', grupo: 'Generales',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.stone);
      x += k.kicker('kicker', 'HOW TO WEAR', 64, 48);
      x += k.h2('titulo', '[Titular: cuatro pasos para un ajuste preciso]', 64, 76, 600, 40);
      const steps = k.d('pasos', ['[Instrucción del paso 1.]', '[Instrucción del paso 2.]', '[Instrucción del paso 3.]', '[Instrucción del paso 4.]']);
      for (let i = 0; i < 4; i++) {
        const xx = 64 + i * 236;
        x += k.img('paso' + (i + 1), xx, 160, 216, 420, { tx: 0.5, label: 'Paso ' + (i + 1) });
        x += k.p('n' + i, xx, 596, '0' + (i + 1), k.S + '; font-size: 34px; color: ' + C.gold);
        x += k.p('paso' + (i + 1) + '_texto', xx, 640, steps[i] || '[Instrucción]', 'font-size: 13px; line-height: 1.6; color: ' + C.text, { w: 216 });
      }
      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'T15', nombre: 'Cuidados', grupo: 'Generales',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ivory);
      x += k.img('foto', 616, 0, 440, 816, { focusX: 0.82, label: 'Foto de laboratorio / tejido' });
      x += k.kicker('kicker', 'CARE', 64, 48);
      x += k.h2('titulo', '[Titular de cuidados]', 64, 76, 480, 40);
      x += k.body('texto', '[Texto por confirmar con MED.]', 64, 170, 480, C.steel, 13);
      const items = k.d('cuidados', [['lavar30', '[Lavado — confirmar]'], ['noblanquear', 'Do not bleach'], ['nosecadora', 'Do not tumble dry'], ['secarplano', 'Dry flat, in the shade'], ['noplanchar', 'Do not iron']]);
      items.slice(0, 5).forEach(function (it, i) {
        const yy = 260 + i * 84;
        x += '<div style="position: absolute; left: 64px; top: ' + yy + 'px; width: 480px; display: flex; align-items: center; gap: 20px; border-top: 1px solid ' + C.line + '; padding-top: 16px">' + icon(it[0]) +
          '<p data-el="cuidado' + i + '" style="margin: 0; font-size: 14px; color: ' + C.text + '">' + k.rich(it[1]) + '</p></div>\n';
      });
      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'T16', nombre: 'Evidencia', grupo: 'Capítulo',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.inkDeep, C.ivory);
      x += k.img('foto', 456, 0, 600, 816, { focusX: 0.5, label: 'Foto cenital' });
      x += k.grad('left: 456px; top: 0; width: 220px; height: 816px; background: linear-gradient(90deg, rgba(13,27,34,0.75) 0%, rgba(13,27,34,0) 100%)');
      x += k.corners(504, 64, 504, 688, C.ivory);
      x += k.p('fig', 520, 40, k.v('fig', 'FIG. 00 · [MUESTRA]'), k.M + '; letter-spacing: 1.6px; color: ' + C.line, { field: 'fig' });
      x += k.crosses(64, 300, 336, 240, 48, C.line, 0.18);
      x += k.kicker('kicker', 'EVIDENCE', 64, 48, C.goldLight);
      x += k.h2('titulo', '[Titular de evidencia]', 64, 76, 360, 44, C.ivory);
      x += k.body('texto', '[Texto de 30 a 40 palabras sobre la evidencia y el control de calidad.]', 64, 200, 340, 'rgba(248,247,244,0.82)', 13);
      const certs = k.d('certificaciones', ['ISO 13485', 'ISO 9001', 'INVIMA']);
      certs.slice(0, 3).forEach(function (c, i) {
        const yy = 600 + i * 50;
        x += k.rule(64, yy, 340, 'rgba(248,247,244,0.3)');
        x += k.p('cert' + i, 64, yy + 14, c, k.S + '; font-size: 24px; color: ' + C.ivory);
      });
      x += k.folio(C.line);
      return x + '</div>';
    }
  },
  {
    id: 'T17', nombre: 'Cierre Human', grupo: 'Capítulo',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.cream);
      x += k.img('foto', 0, 0, 1056, 816, { tx: 0.74, label: 'Foto clara (a sangre)' });
      x += k.grad('left: 0; top: 0; width: 620px; height: 816px; background: linear-gradient(90deg, rgba(239,234,226,0.7) 0%, rgba(239,234,226,0) 100%)');
      x += k.kicker('kicker', 'HUMAN', 64, 330);
      x += k.h2('titulo', '[Titular de cierre del capítulo]', 64, 360, 520, 54);
      x += k.body('texto', '[Texto de 20 a 30 palabras.]', 64, 500, 420, C.text, 14);
      x += k.folio();
      return x + '</div>';
    }
  }
];

module.exports.ICONS = Object.keys(ICONS);
