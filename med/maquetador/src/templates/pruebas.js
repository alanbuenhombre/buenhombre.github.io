// Pruebas de retícula S01–S10 (composiciones del código de referencia) y páginas
// automáticas de exportación: X01 portada de avance · X02 separador de parte.
'use strict';

module.exports = [
  {
    id: 'S01', nombre: 'Foto a sangre + número gigante', grupo: 'Pruebas',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ink, C.ivory);
      x += k.img('foto', 0, 0, 1056, 816, { tx: 0.15, label: 'Foto a sangre' });
      x += k.grad('left: 0; top: 476px; width: 1056px; height: 340px; background: linear-gradient(180deg, rgba(20,27,30,0) 0%, rgba(20,27,30,0.6) 100%)');
      x += k.f('numero', '00', 56, 560, k.S + '; font-size: 220px; line-height: 0.8; color: rgba(248,247,244,0.9)');
      x += k.kicker('kicker', 'CHAPTER', 384, 612, C.goldLight);
      x += k.h2('titulo', '[Título]', 380, 640, 560, 64, C.ivory);
      return x + '</div>';
    }
  },
  {
    id: 'S02', nombre: 'Split 50/50', grupo: 'Pruebas',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ivory);
      x += k.img('foto', 528, 0, 528, 816, { tx: 0.6, label: 'Foto a sangre (derecha)' });
      x += k.kicker('kicker', '[KICKER]', 64, 64);
      x += k.h2('titulo', '[Titular de la idea principal]', 64, 300, 400, 52);
      x += k.body('texto', '[Texto de 25 a 35 palabras.]', 64, 440, 380, C.steel);
      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'S03', nombre: 'Mosaico 1 + 2', grupo: 'Pruebas',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ink, C.ivory);
      x += k.img('foto1', 0, 0, 640, 816, { label: 'Foto grande' });
      x += k.img('foto2', 648, 0, 408, 404, { label: 'Foto 2' });
      x += k.img('foto3', 648, 412, 408, 404, { label: 'Foto 3' });
      x += k.grad('left: 0; top: 560px; width: 640px; height: 256px; background: linear-gradient(180deg, rgba(20,27,30,0) 0%, rgba(20,27,30,0.6) 100%)');
      x += k.h2('titulo', '[Titular sobre la foto]', 48, 700, 520, 40, C.ivory);
      return x + '</div>';
    }
  },
  {
    id: 'S04', nombre: 'Grid de productos 4×2', grupo: 'Pruebas',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.stone);
      x += k.kicker('kicker', 'PRODUCT GRID · 4 × 2', 64, 48);
      x += k.h2('titulo', '[Titular de la gama]', 64, 72, 600, 36);
      const items = k.d('items', [1, 2, 3, 4, 5, 6, 7, 8].map(function () { return { ref: '[REF]', nombre: '[Nombre]' }; }));
      for (let i = 0; i < 8; i++) {
        const it = items[i] || { ref: '—', nombre: '' };
        const cx = 64 + (i % 4) * 236, cy = 150 + Math.floor(i / 4) * 320;
        x += k.img('item' + (i + 1), cx, cy, 216, 250, { tx: 0.7, label: 'Producto ' + (i + 1), ph: '[TECH SCAN]' });
        x += k.p('ref' + i, cx, cy + 262, it.ref, k.S + '; font-size: 20px; color: ' + C.teal, { w: 216 });
        x += k.p('nom' + i, cx, cy + 290, it.nombre, 'font-size: 12px; color: ' + C.steel, { w: 216 });
      }
      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'S05', nombre: 'Ficha con rayos X', grupo: 'Pruebas',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.inkDeep, C.ivory);
      x += k.img('rayosx', 40, 90, 620, 492, { fit: 'contain', label: 'Rayos X', dark: true, ph: '[RAYOS X]' });
      x += k.kicker('kicker', 'SPEC SHEET', 700, 64, C.line);
      x += k.h2('titulo', '[Material] layers', 700, 92, 300, 40, C.ivory);
      const capas = k.d('capas', ['[Capa exterior]', '[Capa interior]', '[Cuerpo]']);
      capas.slice(0, 3).forEach(function (t, i) {
        const yy = 230 + i * 90;
        x += k.rule(700, yy, 292, 'rgba(248,247,244,0.35)');
        x += k.p('cn' + i, 700, yy + 14, String(i + 1), k.S + '; font-size: 34px; color: ' + C.goldLight);
        x += k.p('ct' + i, 744, yy + 24, t, 'font-size: 14px; color: ' + C.ivory, { w: 248 });
      });
      x += k.mono('nota', 'SCHEMATIC · NOT TO SCALE', 700, 560, C.line);
      x += k.folio(C.line);
      return x + '</div>';
    }
  },
  {
    id: 'S06', nombre: 'Cita tipográfica', grupo: 'Pruebas',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.teal, C.ivory);
      x += k.logo(64, 64, 64, 36, 'isotipo', true);
      x += k.f('cita', '“[Cita de una línea o dos.]”', 64, 240, k.S + '; font-style: italic; font-size: 88px; line-height: 1; color: ' + C.ivory, { w: 860 });
      x += k.kicker('kicker', '[MED SCIENCE · LÍNEA]', 64, 700, C.goldLight);
      return x + '</div>';
    }
  },
  {
    id: 'S07', nombre: 'Página de cifras', grupo: 'Pruebas',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ivory);
      x += k.kicker('kicker', 'BY THE NUMBERS', 64, 48);
      x += k.h2('titulo', '[Titular de cifras]', 64, 76, 600, 40);
      const cifras = k.d('cifras', [['[00]', '[Dato]'], ['[00]', '[Dato]'], ['[00]', '[Dato]'], ['[00]', '[Dato]']]);
      cifras.slice(0, 4).forEach(function (c, i) {
        const xx = 64 + (i % 2) * 464, yy = 200 + Math.floor(i / 2) * 270;
        x += k.rule(xx, yy, 420);
        x += k.p('num' + i, xx, yy + 20, c[0], k.S + '; font-size: 120px; line-height: 1; color: ' + C.teal, { w: 420 });
        x += k.p('lab' + i, xx, yy + 160, c[1], 'font-size: 14px; color: ' + C.steel, { w: 420 });
      });
      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'S08', nombre: 'Comparativa', grupo: 'Pruebas',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ivory);
      x += k.kicker('kicker', 'COMPARE TECHNOLOGIES', 64, 48);
      x += k.h2('titulo', '[Material A] vs [Material B]', 64, 76, 600, 40);
      x += k.img('a', 360, 150, 300, 238, { fit: 'contain', label: 'Material A (rayos X crema)', ph: '[RAYOS X]' });
      x += k.img('b', 692, 150, 300, 238, { fit: 'contain', label: 'Material B (rayos X crema)', ph: '[RAYOS X]' });
      const rows = k.d('filas', [['PRINCIPLE', '[A]', '[B]'], ['ARCHITECTURE', '[A]', '[B]'], ['BEST FOR', '[Confirmar]', '[Confirmar]'], ['FAMILIES', '[A]', '[B]']]);
      rows.slice(0, 4).forEach(function (rw, i) {
        const yy = 420 + i * 64;
        x += k.rule(64, yy, 928, i ? C.line : C.teal);
        x += k.p('r' + i + 'a', 64, yy + 20, rw[0], k.M + '; letter-spacing: 1.2px; color: ' + C.steel);
        x += k.p('r' + i + 'b', 360, yy + 16, rw[1], k.S + '; font-size: 22px; color: ' + C.teal, { w: 300 });
        x += k.p('r' + i + 'c', 692, yy + 16, rw[2], k.S + '; font-size: 22px; color: ' + C.teal, { w: 300 });
      });
      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'S09', nombre: 'Proceso en 4 pasos', grupo: 'Pruebas',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ink, C.ivory);
      x += k.kicker('kicker', 'FROM FIBER TO GARMENT', 64, 48, C.line);
      x += k.h2('titulo', '[Titular del proceso]', 64, 76, 700, 40, C.ivory);
      const pasos = k.d('pasos', ['[Paso 1]', '[Paso 2]', '[Paso 3]', '[Paso 4]']);
      for (let i = 0; i < 4; i++) {
        const xx = 64 + i * 236;
        x += k.img('paso' + (i + 1), xx, 180, 216, 380, { label: 'Paso ' + (i + 1), dark: true });
        x += k.p('n' + i, xx, 580, '0' + (i + 1), k.S + '; font-size: 34px; color: ' + C.goldLight);
        x += k.p('t' + i, xx, 624, pasos[i] || '', 'font-size: 14px; color: ' + C.ivory, { w: 216 });
        if (i < 3) x += k.rule(xx + 216, 370, 20, 'rgba(248,247,244,0.5)');
      }
      x += k.folio(C.line);
      return x + '</div>';
    }
  },
  {
    id: 'S10', nombre: 'Índice alternativo', grupo: 'Pruebas',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.stone);
      x += k.img('foto', 600, 0, 456, 816, { focusX: 0.4, label: 'Foto lateral' });
      x += k.kicker('kicker', 'CONTENTS', 64, 48);
      x += k.h2('titulo', '[Titular del índice]', 64, 76, 460, 44);
      const items = k.d('indice', [['01', '[Capítulo]', '[00]'], ['02', '[Capítulo]', '[00]'], ['03', '[Capítulo]', '[00]'], ['04', '[Capítulo]', '[00]'], ['—', '[Páginas generales]', '[00]']]);
      items.slice(0, 5).forEach(function (it, i) {
        const yy = 220 + i * 86;
        x += k.rule(64, yy, 480, i ? C.line : C.teal);
        x += k.p('in' + i, 64, yy + 20, it[0], k.M + '; color: ' + C.steel);
        x += k.p('it' + i, 110, yy + 12, it[1], k.S + '; font-size: 24px; line-height: 1.1; color: ' + C.teal, { w: 360 });
        x += k.p('ip' + i, 500, yy + 20, it[2], k.M + '; color: ' + C.steel);
      });
      x += k.folio();
      return x + '</div>';
    }
  },
  // ---- Automáticas de exportación ----
  {
    id: 'X01', nombre: 'Portada de avance (auto)', grupo: 'Exportación', auto: true,
    render: function (k) {
      const C = k.C;
      let x = k.root(C.teal, C.ivory);
      x += k.crosses(64, 64, 928, 688, 64, C.line, 0.18);
      x += k.logo(64, 56, 180, 34, 'logo', true);
      x += k.p('k', 64, 300, 'AVANCE · ' + k.v('fecha', ''), k.M + '; letter-spacing: 2.4px; color: ' + C.goldLight);
      x += k.p('t', 64, 330, k.v('titulo', 'Catálogo'), k.S + '; font-size: 88px; line-height: 0.95; color: ' + C.ivory, { w: 860 });
      x += k.p('s', 64, 700, k.v('resumen', ''), k.M + '; letter-spacing: 1.6px; color: ' + C.line, { w: 900 });
      return x + '</div>';
    }
  },
  {
    id: 'X02', nombre: 'Separador de parte (auto)', grupo: 'Exportación', auto: true,
    render: function (k) {
      const C = k.C;
      let x = k.root(C.cream);
      x += k.dots(0.12);
      x += k.p('n', 64, 300, k.v('numero', '01'), k.S + '; font-size: 160px; line-height: 0.8; color: ' + C.teal);
      x += k.p('k', 64, 470, 'PARTE', k.M + '; letter-spacing: 2.4px; color: ' + C.steel);
      x += k.p('t', 64, 494, k.v('titulo', ''), k.S + '; font-size: 54px; line-height: 1; color: ' + C.teal, { w: 800 });
      return x + '</div>';
    }
  }
];
