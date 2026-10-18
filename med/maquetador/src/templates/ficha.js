// Ficha técnica MED · 7 páginas en carta vertical (816 × 1056 px).
// Composición medida sobre la ficha AXIFORM™ BRA 4022 aprobada (el sistema base de todas las fichas).
// El contenido llega literal desde el PDF guía (src/ficha.js); aquí solo se diagrama.
// Única transformación de texto permitida: mayúsculas/tipo título en títulos.
'use strict';

const TK = require('../tokens');
const C = TK.color, FI = TK.ficha;
const W = FI.width, H = FI.height;
const L = 58, R = 760, CW = R - L;          // columna útil medida sobre la aprobada
const COL2 = 236, COL3 = 507;               // retícula: columna de rótulo + dos columnas de contenido
const WHITE = FI.white;

const LBL = "font-family: Manrope, sans-serif; font-weight: 700; font-size: 10px; line-height: 1.35; letter-spacing: 0.18em; text-transform: uppercase";
const ITEM = "font-family: Manrope, sans-serif; font-weight: 700; font-size: 10px; line-height: 1.35; letter-spacing: 0.06em; text-transform: uppercase";
const MONO = "font-family: 'IBM Plex Mono', monospace; font-size: 8.5px; line-height: 1.4; letter-spacing: 0.14em";
const SERIF = "font-family: 'Instrument Serif', serif; font-weight: 400";
const BODY = 'font-size: 10.5px; line-height: 1.5';

// ---------- texto ----------
const SMALL = { a: 1, an: 1, and: 1, as: 1, at: 1, but: 1, by: 1, for: 1, in: 1, of: 1, on: 1, or: 1, the: 1, to: 1, vs: 1, via: 1, with: 1, y: 1, de: 1, del: 1, la: 1, el: 1, en: 1, para: 1, con: 1 };
// Tipo título para títulos (no toca marcas con ™/®, siglas cortas ni números)
function titleCase(s) {
  return String(s || '').split(/(\s+)/).map(function (w, i) {
    if (/^\s+$/.test(w) || /[™®]/.test(w) || /^[\d&+·|,–-]+$/.test(w)) return w;
    if (/^(ISO|INVIMA|OEKO-TEX|LYCRA|MED|XS|XL|\dXL)$/.test(w.replace(/[^\w-]/g, ''))) return w;
    return w.split('-').map(function (part, j) {
      const lw = part.toLowerCase();
      if (i > 0 && j === 0 && SMALL[lw.replace(/[^\w]/g, '')]) return lw;
      return lw.charAt(0).toUpperCase() + lw.slice(1);
    }).join('-');
  }).join('');
}
// ™ y ® en titulares serif: pequeños y altos, como en la aprobada
function tm(html) { return html.replace(/([™®])/g, '<span style="font-size: 0.3em; vertical-align: 1.9em; letter-spacing: 0; margin-left: 0.04em">$1</span>'); }

// ---------- componentes ----------
function svgLayer(inner) { return '<svg class="deco" style="position: absolute; left: 0; top: 0; pointer-events: none" width="' + W + '" height="' + H + '" fill="none">' + inner + '</svg>\n'; }
function bar(x, y, color) { return '<div class="deco" style="position: absolute; left: ' + x + 'px; top: ' + y + 'px; width: 28px; height: 2px; background: ' + color + '"></div>\n'; }
function rect(x, y, w, h, bg, extra) { return '<div class="deco" style="position: absolute; left: ' + x + 'px; top: ' + y + 'px; width: ' + w + 'px; height: ' + h + 'px; background: ' + bg + (extra || '') + '; pointer-events: none"></div>\n'; }

// Logo: archivo marca/logo si existe; si no, ondas + MED tipográfico
function logo(k, x, y, light) {
  const file = k.catalog.marca && k.catalog.marca.logo_ficha;
  if (file && k.catalog._images && k.catalog._images[file]) return k.logo(x, y, 104, 26, 'logo_ficha', !light);
  const c = C.ivory;
  return svgLayer('<g stroke="' + c + '" stroke-width="1.3" stroke-linecap="round">' +
    [0, 6, 12].map(function (d) { return '<path d="M' + x + ' ' + (y + 6 + d) + 'c4 -4 8 -4 12 0s8 4 12 0s8 -4 12 0"/>'; }).join('') + '</g>') +
    '<p style="position: absolute; left: ' + (x + 44) + 'px; top: ' + (y - 2) + 'px; margin: 0; ' + SERIF + '; font-size: 30px; line-height: 1; letter-spacing: 0.02em; color: ' + c + '">MED</p>\n';
}

function header(k, n, dark) {
  const ink = dark ? C.ivory : C.teal, sub = dark ? C.line : C.steel;
  let x = rect(L, 43, 127, 40, C.teal);
  x += logo(k, L + 14, 54, true);
  x += k.p('h_l1', 200, 49, k.v('marca_l1', '[MARCA]'), MONO + '; font-weight: 500; color: ' + ink, { field: 'marca_l1', w: 270 });
  x += k.p('h_l2', 200, 63, k.v('marca_l2', '[SISTEMA]'), MONO + '; color: ' + sub, { field: 'marca_l2', w: 270 });
  x += k.p('h_r1', 0, 49, k.v('seccion', '[SECCIÓN]'), MONO + '; font-weight: 500; color: ' + ink + '; text-align: right', { right: W - R, field: 'seccion', w: 330 });
  x += k.p('h_r2', 0, 63, k.v('producto_linea', '[PRODUCTO · REF. 0000]') + ' · ' + String(n).padStart(2, '0'), MONO + '; color: ' + sub + '; text-align: right', { right: W - R, w: 330 });
  x += k.rule(L, 84, CW, dark ? 'rgba(248,247,244,0.55)' : C.teal);
  return x;
}
function footer(k, n, dark) {
  return k.p('pie', 0, 0, 'PAGE ' + String(n).padStart(2, '0'), MONO + '; font-weight: 500; color: ' + (dark ? C.ivory : C.teal) + '; text-align: right', { right: W - R, bottom: 34, w: 120 });
}
function base(k, n, bg, dark) {
  return k.root(bg || WHITE, dark ? C.ivory : C.text, W, H) + k.regMarks(W, H, dark ? 'rgba(194,204,210,0.55)' : C.line, 28, 10) + header(k, n, dark);
}
// Bloque de título de páginas interiores
function titleBlock(k, dark) {
  const ink = dark ? C.ivory : C.teal;
  let x = bar(L, 111, ink);
  x += k.f('eyebrow', '[EYEBROW]', L, 118, LBL + '; color: ' + ink, { w: CW });
  x += k.p('h1', L, 140, tm(k.rich(titleCase(k.v('h1', '[Título de la página]')))), SERIF + '; font-size: 40px; line-height: 1.08; letter-spacing: -0.005em; color: ' + ink, { w: CW, raw: true, field: 'h1' });
  x += k.f('entradilla', '[Entradilla]', L, 188, 'font-size: 13px; line-height: 1.5; color: ' + (dark ? C.ivory : C.text), { w: CW });
  return x;
}
// Rótulo de sección en la columna izquierda (barra + mayúsculas espaciadas)
function sideLabel(k, id, def, y, color, w, x0) {
  const lx = x0 == null ? L : x0;
  return bar(lx, y, color || C.teal) + k.f(id, def, lx, y + 12, LBL + '; color: ' + (color || C.teal), { w: w || 150 });
}
// Rótulo de sección con línea horizontal hasta el borde y remate cuadrado (página 05)
function ruleLabel(k, id, def, y, color) {
  const c = color || C.ivory;
  return k.f(id, def, L, y, LBL + '; color: ' + c) + rect(L + 136, y + 6, CW - 144, 1, 'rgba(248,247,244,0.45)') + rect(R - 5, y + 4, 5, 5, c);
}
// Ítem rótulo + texto en flujo
function itemHtml(rich, it, o) {
  o = o || {};
  return '<p style="margin: 0 0 4px; ' + ITEM + '; color: ' + (o.lc || C.teal) + '">' + rich(it.titulo || '') + '</p>' +
    (it.texto ? '<p style="margin: 0; ' + BODY + '; color: ' + (o.tc || C.text) + '">' + rich(it.texto) + '</p>' : '');
}
function dashList(list, rich, color, size) {
  return (list || []).map(function (t) {
    return '<p style="margin: 0 0 4px; padding-left: 12px; text-indent: -12px; font-size: ' + (size || 10.5) + 'px; line-height: 1.5; color: ' + color + '">–&nbsp;&nbsp;' + rich(t) + '</p>';
  }).join('');
}
// Insignia cuadrada con número (página 05)
function sqBadge(n, x, y, color, fill) {
  return '<div class="deco" style="position: absolute; left: ' + x + 'px; top: ' + y + 'px; width: 15px; height: 13px; border: 1px solid ' + color + '; background: ' + (fill || 'transparent') + '; ' + MONO + '; font-size: 7.5px; letter-spacing: 0; line-height: 11px; text-align: center; color: ' + (fill ? C.teal : color) + '">' + n + '</div>\n';
}
// Fila de nodos sobre línea Titanium (metadatos y secuencia); el último nodo va relleno
function nodeRow(xs, y, color) {
  let s = '<path d="M' + L + ' ' + y + 'H' + R + '" stroke="' + C.line + '" stroke-width="1"/>';
  xs.forEach(function (x, i) { s += '<circle cx="' + (x + 3) + '" cy="' + y + '" r="3" fill="' + (i === xs.length - 1 ? (color || C.teal) : WHITE) + '" stroke="' + (color || C.teal) + '" stroke-width="1"/>'; });
  return svgLayer(s);
}
// Conector con codo redondeado de un punto a otro (callouts y rayos X)
function elbow(ax, ay, bx, by, midX, r) {
  r = Math.min(r || 7, Math.abs(by - ay) / 2);
  if (Math.abs(by - ay) < 1) return 'M' + ax + ' ' + ay + 'H' + bx;
  const sy = by > ay ? 1 : -1, sx = bx > ax ? 1 : -1;
  return 'M' + ax + ' ' + ay + 'H' + (midX - sx * r) + 'Q' + midX + ' ' + ay + ' ' + midX + ' ' + (ay + sy * r) + 'V' + (by - sy * r) + 'Q' + midX + ' ' + by + ' ' + (midX + sx * r) + ' ' + by + 'H' + bx;
}
// Nodo de callout: anillo ivory con centro teal
function ringNode(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="6" fill="' + C.teal + '" fill-opacity="0.35" stroke="' + C.ivory + '" stroke-width="1.3"/><circle cx="' + x + '" cy="' + y + '" r="2" fill="' + C.ivory + '"/>'; }

// Íconos de línea
const ICON = {
  cobertura: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  soporte: '<path d="M5 6c0 7 3 11 7 11s7-4 7-11"/><path d="M9 6c0 4 1.4 7 3 7s3-3 3-7"/>',
  estabilidad: '<path d="M12 3L21 20H3z"/><path d="M12 9L17 18H7z"/><path d="M12 3v17"/>',
  ajuste: '<circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.6" fill="currentColor"/>',
  lavar_mano: '<path d="M3 10h18l-2 10H5z"/><path d="M9 10V5.5a1 1 0 012 0V10M11 10V4.5a1 1 0 012 0V10M13 10V5.5a1 1 0 012 0V10"/>',
  no_blanquear: '<path d="M12 3l9 16H3z"/><path d="M5 5l14 14M19 5L5 19"/>',
  no_planchar: '<path d="M4 18h16l-2-8H9c-3 0-5 3-5 8z"/><path d="M4 6l16 14M20 6L4 20"/>',
  no_secadora: '<rect x="3" y="3" width="18" height="18"/><circle cx="12" cy="12" r="6"/><path d="M3 3l18 18M21 3L3 21"/>',
  no_escurrir: '<path d="M3 12c2-3 4 3 6 0s4 3 6 0 4 3 6 0"/><path d="M4 5l16 14M20 5L4 19"/>',
  no_unas: '<path d="M8 21V10a2 2 0 014 0v3h3a3 3 0 013 3v5"/><path d="M5 4l14 16M19 4L5 20"/>',
  secar_colgado: '<rect x="3" y="3" width="18" height="18"/><path d="M3 7c4 4 14 4 18 0"/>'
};
function icon(name, color, size) {
  return '<svg width="' + (size || 22) + '" height="' + (size || 22) + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" color="' + color + '" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">' + (ICON[name] || '<rect x="4" y="4" width="16" height="16" stroke-dasharray="2 2"/>') + '</svg>';
}
const HEX = { beige: '#D8C2AC', black: '#222223', negro: '#222223', nude: '#D8C2AC', white: '#F8F7F4', blanco: '#F8F7F4' };
function swatches(k, x, y, colores, ring) {
  let h = '';
  String(colores).split(/\s*·\s*/).forEach(function (c, i) {
    const hex = HEX[c.toLowerCase().replace(/\[|\]/g, '')] || C.line;
    h += '<div class="deco" style="position: absolute; left: ' + (x + i * 16) + 'px; top: ' + y + 'px; width: 11px; height: 11px; border-radius: 50%; background: ' + hex + '; border: 1px solid ' + (ring || 'rgba(34,34,35,0.2)') + '"></div>\n';
  });
  return h;
}

// Nombre + referencia a 90 px (portada y cierre)
function nameRef(k, y) {
  return k.p('nombre_g', L, y, tm(k.rich(k.v('nombre', '[NOMBRE]'))), SERIF + '; font-size: 89px; line-height: 1; letter-spacing: -0.01em; color: ' + C.teal, { w: 520, raw: true }) +
    k.p('ref_g', 0, y, k.rich(k.v('ref', '[0000]')), SERIF + '; font-size: 89px; line-height: 1; letter-spacing: -0.01em; color: ' + C.line + '; text-align: right', { right: W - R, w: 240, raw: true });
}

module.exports = [
  {
    id: 'F01', nombre: 'Ficha 01 · Product overview', grupo: 'Ficha técnica', size: [W, H],
    render: function (k) {
      let x = base(k, 1);
      x += bar(L, 111, C.teal);
      x += k.f('eyebrow', '[PRODUCT TECHNICAL SHEET]', L, 118, LBL + '; color: ' + C.teal);
      x += k.p('ref_lbl', 0, 119, 'REF.', MONO + '; color: ' + C.steel + '; text-align: right', { right: W - R, w: 60 });
      x += nameRef(k, 144);
      x += k.f('descripcion', '[Descripción]', L, 252, 'font-size: 13.5px; line-height: 1.55; color: ' + C.text, { w: 410 });
      // Configuración a la derecha
      x += k.f('config_label', 'PRODUCT CONFIGURATION', 0, 0, LBL + '; color: ' + C.teal + '; text-align: right', { right: W - R, bottom: H - 254, w: 260 });
      x += k.p('tallas_lbl', 0, 258, k.v('tallas_label', 'AVAILABLE SIZES'), MONO + '; color: ' + C.steel + '; text-align: right', { right: W - R + 66, w: 160 });
      x += k.f('tallas', '[XS–XL]', 0, 252, SERIF + '; font-size: 19px; line-height: 1; color: ' + C.teal + '; text-align: right', { right: W - R, w: 64 });
      const col = k.v('colores', '[Color]');
      x += k.p('col_lbl', 0, 280, k.v('colores_label', 'AVAILABLE COLORS'), MONO + '; color: ' + C.steel + '; text-align: right', { right: W - R + 14 + 16 * String(col).split(/\s*·\s*/).length + 6.4 * String(col).length, w: 160 });
      const dots = String(col).split(/\s*·\s*/).map(function (c) {
        return '<span style="display: inline-block; width: 11px; height: 11px; border-radius: 50%; vertical-align: -1px; margin-right: 5px; background: ' + (HEX[c.toLowerCase()] || C.line) + '; border: 1px solid rgba(34,34,35,0.2)"></span>';
      }).join('');
      x += k.p('colores', 0, 279, dots + '<span style="margin-left: 2px">' + k.rich(col) + '</span>', 'font-size: 11.5px; font-weight: 600; line-height: 1.2; color: ' + C.text + '; text-align: right', { right: W - R, w: 170, raw: true, field: 'colores' });
      // Fila de metadatos: nodo · etiqueta mono · valor
      const meta = k.d('meta', [1, 2, 3, 4, 5, 6].map(function () { return { valor: '[—]', etiqueta: '[ETIQUETA]' }; }));
      const xs = [L, 165, 315, 465, 570, 676].slice(0, meta.length);
      x += nodeRow(xs, 317);
      meta.forEach(function (m, i) {
        const w = (xs[i + 1] || R) - xs[i] - 10;
        x += k.box('meta' + i, xs[i], 331, w, '<p style="margin: 0 0 3px; ' + MONO + '; font-size: 8px; color: ' + C.steel + '">' + k.rich(m.etiqueta) + '</p><p style="margin: 0; font-size: 10px; font-weight: 700; line-height: 1.35; color: ' + C.teal + '">' + k.rich(m.valor) + '</p>', '');
      });
      // Overview + fotos
      x += k.f('overview_label', 'PRODUCT OVERVIEW', L, 418, LBL + '; color: ' + C.teal);
      x += k.f('overview', '[Overview]', L, 442, BODY + '; color: ' + C.text, { w: 180 });
      x += k.img('foto_frente', 257, 408, 243, 241, { label: 'Foto frente', crop: { x: 0, y: 0.33, w: 1, h: 0.62 } });
      x += k.img('foto_espalda', 518, 408, 242, 241, { label: 'Foto espalda', crop: { x: 0, y: 0.33, w: 1, h: 0.62 } });
      // Stage de cobertura anatómica (160 px)
      const sy = 687;
      x += rect(L, sy, CW, 160, FI.stage);
      x += k.img('fig_cobertura1', L, sy, 192, 160, { label: 'Figura cobertura primaria', ph: '[FIGURA · COBERTURA PRIMARIA]', dark: true });
      x += k.img('fig_cobertura2', 410, sy, 190, 160, { label: 'Figura cobertura secundaria', ph: '[FIGURA · COBERTURA SECUNDARIA]', dark: true });
      x += k.f('cobertura_label', 'ANATOMICAL COVERAGE', 249, sy + 13, LBL + '; color: ' + C.ivory);
      const cov = k.d('cobertura', [{ rotulo: 'PRIMARY COVERAGE', titulo: '[Región]', texto: '' }, { rotulo: 'SECONDARY COVERAGE', titulo: '[Región]', texto: '' }]);
      cov.slice(0, 2).forEach(function (c, i) {
        x += k.box('cov' + i, i ? 601 : 249, sy + 43, i ? 160 : 150,
          '<p style="margin: 0 0 4px; ' + MONO + '; font-size: 8px; color: ' + C.ivory + '">' + k.rich(c.rotulo || '') + '</p>' +
          '<p style="margin: 0 0 9px; ' + SERIF + '; font-size: 18px; line-height: 1.05; color: ' + C.ivory + '">' + k.rich(c.titulo || '') + '</p>' +
          '<p style="margin: 0; font-size: 10px; line-height: 1.45; color: ' + C.ivory + '">' + k.rich(c.texto || '') + '</p>', '');
      });
      // Beneficios
      const ben = k.d('beneficios', [1, 2, 3, 4].map(function () { return { titulo: '[BENEFICIO]', texto: '[Texto]' }; }));
      const icons = ['cobertura', 'soporte', 'estabilidad', 'ajuste'];
      ben.slice(0, 4).forEach(function (b, i) {
        const bx = L + i * 181;
        x += '<div class="deco" style="position: absolute; left: ' + bx + 'px; top: 878px">' + icon(icons[i], C.teal, 21) + '</div>\n';
        x += k.box('ben' + i, bx, 910, 166, itemHtml(k.rich, b), '');
      });
      x += footer(k, 1);
      return x + '</div>';
    }
  },
  {
    id: 'F02', nombre: 'Ficha 02 · Technology & material intelligence', grupo: 'Ficha técnica', size: [W, H],
    render: function (k) {
      let x = base(k, 2);
      x += bar(L, 111, C.teal);
      x += k.f('eyebrow', '[EYEBROW]', L, 118, LBL + '; color: ' + C.teal, { w: CW });
      x += k.p('h1', L, 144, tm(k.rich(k.v('h1', '[TECNOLOGÍA]'))), SERIF + '; font-size: 89px; line-height: 1; letter-spacing: -0.01em; color: ' + C.teal, { w: 520, raw: true, field: 'h1' });
      // Entradilla «KICKER · Lema»: el kicker en mono y el lema en serif itálica, alineados a la derecha
      const ent = k.v('entradilla', '[KICKER · Lema]');
      const m = ent.match(/^([A-ZÁÉÍÓÚÑ0-9 &]+?)\s*·\s*(.+)$/);
      x += k.p('ent_k', 0, 152, m ? m[1] : '', MONO + '; color: ' + C.steel + '; text-align: right', { right: W - R, w: 300 });
      x += k.p('ent_l', 0, 170, m ? m[2] : ent, SERIF + '; font-style: italic; font-size: 21px; line-height: 1.18; color: ' + C.teal + '; text-align: right', { right: W - R, w: 220, field: 'entradilla' });
      // Tarjetas de material: foto con número, rol en mono, nombre serif, texto corto
      const mats = k.d('materiales', [1, 2, 3].map(function () { return { rol: '[ROL]', nombre: '[Material]', corto: '[Texto corto]', texto: '[Texto]' }; }));
      mats.slice(0, 3).forEach(function (mt, i) {
        const mx = L + i * 240;
        x += k.img('textura' + (i + 1), mx, 249, 224, 128, { label: 'Textura ' + (i + 1) });
        x += rect(mx, 249, 28, 19, C.teal) + k.p('mnum' + i, mx, 252, String(i + 1).padStart(2, '0'), MONO + '; color: ' + C.ivory + '; text-align: center', { w: 28 });
        x += k.p('mrol' + i, mx, 396, mt.rol || '[ROL]', MONO + '; color: ' + C.steel, { w: 224 });
        x += k.p('mnom' + i, mx, 408, tm(k.rich(titleCase(mt.nombre || ''))), SERIF + '; font-size: 27px; line-height: 1.1; color: ' + C.teal, { w: 224, raw: true });
        x += k.p('mcor' + i, mx, 446, mt.corto || '[Texto corto]', BODY + '; color: ' + C.text, { w: 210 });
      });
      // Lógica del sistema: el texto se conserva; los «->» se dibujan como flechas
      x += k.f('logic_label', 'SYSTEM LOGIC', L, 529, MONO + '; color: ' + C.steel);
      const parts = k.v('system_logic', '[A -> B -> C]').split(/\s*->\s*/);
      x += k.box('logic', L, 546, CW, '<p style="margin: 0; font-size: 12.5px; font-weight: 600; line-height: 1.4; color: ' + C.teal + '">' +
        parts.map(function (t, i) { return k.rich(t) + (i < parts.length - 1 ? '<svg width="28" height="10" viewBox="0 0 28 10" style="margin: 0 9px; vertical-align: middle"><path d="M1 5h24M21 1l4 4-4 4" stroke="' + C.teal + '" fill="none" stroke-width="1"/></svg>' : ''); }).join('') + '</p>', '');
      x += k.f('boundary_label', 'SCIENTIFIC BOUNDARY', L, 582, MONO + '; color: ' + C.steel, { w: 170 });
      x += k.f('scientific_boundary', '[Texto]', COL2, 580, BODY + '; color: ' + C.text, { w: R - COL2 });
      // Bloque oscuro: arquitectura de materiales
      const by = 614, bh = 382;
      x += rect(L, by, CW, bh, FI.xray);
      x += bar(L + 23, by + 22, C.ivory);
      x += k.f('arquitectura_label', 'MATERIAL ARCHITECTURE', L + 23, by + 34, LBL + '; color: ' + C.ivory);
      x += k.img('rayosx_materiales', L + 23, by + 50, 254, 190, { fit: 'contain', label: 'Rayos X materiales', ph: '[RAYOS X · MATERIALES]', dark: true });
      // Lockup centrado bajo la infografía
      const cx = L + 23, cw = 254;
      x += k.p('lk1', cx, by + 254, k.v('eyebrow', ''), MONO + '; font-size: 7.5px; color: ' + C.ivory + '; text-align: center', { w: cw });
      x += k.p('lk2', cx, by + 268, tm(k.rich(k.v('h1', ''))), SERIF + '; font-size: 34px; line-height: 1; color: ' + C.ivory + '; text-align: center', { w: cw, raw: true });
      x += k.p('lk3', cx, by + 306, m ? m[1] : '', MONO + '; font-size: 7.5px; color: ' + C.ivory + '; text-align: center', { w: cw });
      x += k.f('cierre', '[Frase de cierre]', cx, by + 326, SERIF + '; font-style: italic; font-size: 17px; line-height: 1.2; color: ' + C.ivory + '; text-align: center', { w: cw });
      // Textos de material con conectores de flujo de señal
      const tx = 380;
      const anchors = k.d('anclas_rayosx', [[0.78, 0.25], [0.72, 0.62], [0.82, 0.82]]);
      let svg = '';
      mats.slice(0, 3).forEach(function (mt, i) {
        const ty = by + 58 + i * 98;
        x += k.box('march' + i, tx, ty, R - 26 - tx,
          '<p style="margin: 0 0 1px; ' + MONO + '; letter-spacing: 0.06em; color: ' + C.line + '">material (' + (i + 1) + ')</p>' +
          '<p style="margin: 0 0 8px; ' + ITEM + '; color: ' + C.ivory + '">' + k.rich(mt.nombre || '') + '</p>' +
          '<p style="margin: 0; font-size: 10.5px; line-height: 1.55; color: ' + C.ivory + '">' + k.rich(mt.texto || '') + '</p>', '');
        const a = anchors[i] || [0.7, 0.5];
        const ax = cx + a[0] * cw, ay = by + 50 + a[1] * 190, bx = tx - 6, bby = ty + 20;
        svg += '<path d="' + elbow(ax, ay, bx, bby, tx - 34, 7) + '" stroke="' + C.ivory + '" stroke-width="0.8"/><circle cx="' + bx + '" cy="' + bby + '" r="2.4" fill="' + C.ivory + '"/>';
      });
      x += svgLayer(svg);
      x += footer(k, 2);
      return x + '</div>';
    }
  },
  {
    id: 'F03', nombre: 'Ficha 03 · Product engineering', grupo: 'Ficha técnica', size: [W, H],
    render: function (k) {
      let x = base(k, 3);
      x += titleBlock(k);
      // Stage 320 px con figura central y 4 callouts a la derecha
      const sy = 225, sh = 320;
      x += rect(L, sy, CW, sh, FI.stage);
      x += k.img('fig_frente', 150, sy, 372, sh, { label: 'Figura frente', ph: '[ILUSTRACIÓN · FIGURA FRENTE]', dark: true });
      x += k.f('stage_titulo', '[REF · FRONT STRUCTURAL ARCHITECTURE]', L + 22, sy + 22, MONO + '; color: ' + C.ivory, { w: 100 });
      x += k.f('stage_nota', '[Texto del stage]', L + 22, sy + sh - 52, 'font-size: 10px; line-height: 1.4; color: ' + C.ivory, { w: 112 });
      const calls = k.d('callouts', [1, 2, 3, 4].map(function (n) { return { titulo: '[Zona]', texto: '[DESCRIPCIÓN]', x: 0.5, y: 0.2 * n }; }));
      let svg = '';
      calls.slice(0, 4).forEach(function (c, i) {
        const cy = sy + 40 + i * 68;
        x += k.box('call' + i, 518, cy, 236, '<p style="margin: 0 0 2px; ' + MONO + '; color: ' + C.ivory + '">' + String(i + 1).padStart(2, '0') + '</p>' +
          '<p style="margin: 0 0 5px; font-size: 13px; font-weight: 600; line-height: 1.2; color: ' + C.ivory + '">' + k.rich(titleCase(c.titulo || '')) + '</p>' +
          '<p style="margin: 0; ' + MONO + '; font-size: 7.5px; color: ' + C.line + '">' + k.rich(String(c.texto || '').toUpperCase()) + '</p>', '');
        const ax = 150 + (c.x == null ? 0.6 : +c.x) * 372, ay = sy + (c.y == null ? 0.2 + i * 0.18 : +c.y) * sh;
        svg += '<path d="' + elbow(ax + 6, ay, 514, cy + 22, 494, 7) + '" stroke="' + C.ivory + '" stroke-width="0.9"/>' + ringNode(ax, ay);
      });
      x += svgLayer(svg);
      x += k.f('nota', '[Nota]', L, 553, 'font-size: 10px; line-height: 1.45; font-style: italic; color: ' + C.steel, { w: CW });
      // Vistas de detalle (2 × 2)
      x += sideLabel(k, 'detalles_label', 'ENGINEERED DETAIL VIEWS', 598, C.teal, 160);
      const det = k.d('detalles', [1, 2, 3, 4].map(function () { return { titulo: '[DETALLE]', texto: '' }; }));
      det.slice(0, 4).forEach(function (d, i) {
        const dx = i % 2 ? COL3 : COL2, dy = i < 2 ? 598 : 670;
        x += k.img('detalle' + (i + 1), dx, dy, 104, 60, { label: 'Detalle ' + (i + 1) });
        x += k.box('det' + i, dx + 117, dy, 140, itemHtml(k.rich, d), '');
      });
      // Features numeradas (2 columnas × 3 filas)
      x += sideLabel(k, 'features_label', 'ENGINEERED PRODUCT FEATURES', 777, C.teal, 160);
      const ft = k.d('features', [1, 2, 3, 4, 5, 6].map(function () { return { titulo: '[FEATURE]', texto: '[Texto]' }; }));
      const rows = [783, 852, 936];
      ft.slice(0, 6).forEach(function (f, i) {
        const fx = i % 2 ? COL3 : COL2, fy = rows[Math.floor(i / 2)];
        x += k.p('fn' + i, fx, fy + 1, String(i + 1).padStart(2, '0'), MONO + '; color: ' + C.steel);
        x += k.box('ft' + i, fx + 26, fy, 230, itemHtml(k.rich, { titulo: String(f.titulo || '').replace(/^\d+\s*·\s*/, ''), texto: f.texto }), '');
      });
      x += footer(k, 3);
      return x + '</div>';
    }
  },
  {
    id: 'F04', nombre: 'Ficha 04 · Component engineering', grupo: 'Ficha técnica', size: [W, H],
    render: function (k) {
      let x = base(k, 4);
      x += titleBlock(k);
      const sy = 244, sh = 296;
      x += rect(L, sy, CW, sh, FI.stage);
      x += k.img('fig_34', L, sy, 382, sh, { label: 'Figura 3/4', ph: '[ILUSTRACIÓN · FIGURA 3/4]', dark: true });
      const calls = k.d('callouts', [1, 2, 3].map(function (n) { return { titulo: '[Zona]', texto: '[Texto]', x: 0.7, y: 0.25 * n }; }));
      let svg = '';
      calls.slice(0, 3).forEach(function (c, i) {
        const cy = sy + 22 + i * 86;
        x += k.box('call' + i, 465, cy, 290, '<p style="margin: 0 0 2px; ' + MONO + '; color: ' + C.ivory + '">' + String(i + 1).padStart(2, '0') + '</p>' +
          '<p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; line-height: 1.2; color: ' + C.ivory + '">' + k.rich(titleCase(c.titulo || '')) + '</p>' +
          '<p style="margin: 0; font-size: 10px; line-height: 1.45; color: ' + C.ivory + '">' + k.rich(c.texto || '') + '</p>', '');
        const ax = L + (c.x == null ? 0.7 : +c.x) * 382, ay = sy + (c.y == null ? 0.25 + i * 0.25 : +c.y) * sh;
        svg += '<path d="' + elbow(ax + 6, ay, 460, cy + 21, 418, 7) + '" stroke="' + C.ivory + '" stroke-width="0.9"/>' +
          '<path d="M455 ' + (cy + 18) + 'l5 3-5 3" stroke="' + C.ivory + '" stroke-width="0.9"/>' + ringNode(ax, ay);
      });
      x += svgLayer(svg);
      // Relación de componentes (2 columnas)
      x += sideLabel(k, 'relacion_label', 'PRODUCT CONSTRUCTION · COMPONENT RELATIONSHIP', 566, C.teal, 120);
      const rel = k.d('relacion', [1, 2, 3, 4, 5, 6].map(function () { return { titulo: '[COMPONENTE]', texto: '[Texto]' }; }));
      const colA = rel.filter(function (r, i) { return i % 2 === 0; }), colB = rel.filter(function (r, i) { return i % 2 === 1; });
      x += k.box('rel_a', COL2, 566, 256, colA.map(function (r) { return '<div style="margin-bottom: 12px">' + itemHtml(k.rich, r) + '</div>'; }).join(''), '');
      x += k.box('rel_b', COL3, 566, 253, colB.map(function (r) { return '<div style="margin-bottom: 12px">' + itemHtml(k.rich, r) + '</div>'; }).join(''), '');
      // Bloque teal de credenciales
      const by = 814, bh = 182;
      x += rect(L, by, CW, bh, C.teal);
      x += sideLabel(k, 'credenciales_label', 'MATERIAL CREDENTIALS', by + 26, C.ivory, 130, L + 23);
      const cr = k.d('credenciales', [{ titulo: '[CREDENCIAL]', texto: '[Texto]' }, { titulo: '[CREDENCIAL]', texto: '[Texto]' }]);
      cr.slice(0, 2).forEach(function (c, i) {
        x += k.box('cred' + i, i ? 481 : COL2, by + 26, 236, itemHtml(k.rich, c, { lc: C.ivory, tc: C.ivory }), '');
      });
      x += k.f('sistema_label', 'MATERIAL SYSTEM', COL2, by + 138, MONO + '; color: ' + C.line);
      x += k.f('sistema', '[Sistema de materiales]', COL2, by + 154, MONO + '; font-size: 8.5px; letter-spacing: 0.06em; color: ' + C.ivory, { w: R - 24 - COL2 });
      x += footer(k, 4);
      return x + '</div>';
    }
  },
  {
    id: 'F05', nombre: 'Ficha 05 · Size & measurement', grupo: 'Ficha técnica', size: [W, H],
    render: function (k) {
      let x = base(k, 5, FI.stage, true);
      x += titleBlock(k, true);
      // Uso profesional · aplicaciones · fotos
      x += k.box('uso', L, 227, 196, '<p style="margin: 0 0 4px; ' + ITEM + '; color: ' + C.ivory + '">' + k.rich(k.v('uso_label', 'INTENDED PROFESSIONAL USE')) + '</p><p style="margin: 0; ' + BODY + '; color: ' + C.ivory + '">' + k.rich(k.v('uso', '[Texto]')) + '</p>', '');
      x += k.box('aplic', 273, 227, 206, '<p style="margin: 0 0 6px; ' + ITEM + '; color: ' + C.ivory + '">' + k.rich(k.v('aplicaciones_label', 'POTENTIAL PROFESSIONAL APPLICATIONS')) + '</p>' +
        dashList(k.d('aplicaciones', ['[Aplicación]']), k.rich, C.ivory, 10.5) +
        '<p style="margin: 10px 0 0; ' + BODY + '; color: ' + C.ivory + '">' + k.rich(k.v('aplicaciones_nota', '')) + '</p>', '');
      x += k.img('foto_frente', 489, 228, 128, 166, { label: 'Foto frente', crop: { x: 0.05, y: 0.33, w: 0.9, h: 0.6 }, dark: true });
      x += k.img('foto_espalda', 633, 228, 128, 166, { label: 'Foto espalda', crop: { x: 0.05, y: 0.33, w: 0.9, h: 0.6 }, dark: true });
      x += k.f('cap_frente', 'FRONT VIEW', 489, 402, MONO + '; font-size: 7.5px; color: ' + C.line, { w: 128 });
      x += k.f('cap_espalda', 'POSTERIOR COVERAGE · REFERENCE VIEW', 633, 402, MONO + '; font-size: 7.5px; color: ' + C.line, { w: 128 });
      // Cómo medir
      x += ruleLabel(k, 'medir_label', 'HOW TO MEASURE', 443);
      const py = 470;
      x += rect(L, py, 206, 152, FI.stageDeep);
      x += k.img('fig_medidas', L, py, 206, 152, { label: 'Figura con cintas', ph: '[FIGURA · CINTAS]', dark: true });
      x += k.corners(L, py, 206, 152, C.line, 9);
      const med = k.d('medir', [{ titulo: '01 [MEDIDA]', texto: '[Instrucción]' }, { titulo: '02 [MEDIDA]', texto: '[Instrucción]' }, { titulo: '03 [MEDIDA]', texto: '[Instrucción]' }]);
      const cintas = k.d('cintas', [[0.62, 0.58], [0.79, 0.55], [0.67, 0.86]]);
      med.slice(0, 3).forEach(function (m, i) {
        const c = cintas[i] || [0.5, 0.5];
        x += sqBadge(String(i + 1).padStart(2, '0'), L + c[1] * 206 - 7, py + c[0] * 152 - 6, C.ivory, C.ivory);
        const iy = 474 + i * 50;
        x += sqBadge(String(i + 1).padStart(2, '0'), 313, iy + 6, C.ivory);
        x += k.p('mt' + i, 338, iy, titleCase(String(m.titulo || '').replace(/^\d+\s*/, '')), SERIF + '; font-size: 21px; line-height: 1.1; color: ' + C.ivory, { w: 400 });
        x += k.p('mx' + i, 338, iy + 27, m.texto || '', 'font-size: 10.5px; line-height: 1.4; color: ' + C.ivory, { w: 420 });
      });
      // Talla y ajuste
      x += ruleLabel(k, 'sizefit_label', 'SIZE & FIT', 646);
      x += k.f('tallas_label', 'AVAILABLE SIZES', L, 674, MONO + '; color: ' + C.line);
      x += k.f('tallas', '[—]', L, 688, 'font-size: 11.5px; font-weight: 700; line-height: 1.3; color: ' + C.ivory, { w: 300 });
      x += k.f('colores_label', 'AVAILABLE COLORS', 387, 674, MONO + '; color: ' + C.line);
      x += swatches(k, 387, 691, k.v('colores', ''), 'rgba(248,247,244,0.6)');
      x += k.f('colores', '[—]', 420, 688, 'font-size: 11.5px; font-weight: 700; line-height: 1.3; color: ' + C.ivory, { w: 140 });
      x += k.f('medidas_label', 'PATIENT MEASUREMENTS', 557, 674, MONO + '; color: ' + C.line);
      x += k.f('medidas', '[—]', 557, 688, 'font-size: 11.5px; font-weight: 700; line-height: 1.3; color: ' + C.ivory, { w: 203 });
      // Tabla: insignias en el encabezado que coinciden con «cómo medir»
      const tb = k.d('tabla', { columnas: ['SIZE', '[MEDIDA 1]', '[MEDIDA 2]', '[MEDIDA 3]'], filas: [['[XS]', '[—]', '[—]', '[—]']] });
      const medNames = med.map(function (m) { return String(m.titulo || '').replace(/^\d+\s*/, '').trim().toUpperCase(); });
      const cols = [180, 374, 569];
      let ty = 723;
      x += k.p('th0', 69, ty + 5, tb.columnas[0], MONO + '; color: ' + C.ivory);
      tb.columnas.slice(1, 4).forEach(function (c, j) {
        const bi = medNames.indexOf(c.replace(/\(.*\)/, '').trim().toUpperCase());
        if (bi >= 0) x += sqBadge(String(bi + 1).padStart(2, '0'), cols[j], ty + 3, C.ivory);
        x += k.p('th' + (j + 1), cols[j] + (bi >= 0 ? 22 : 0), ty + 5, c, MONO + '; color: ' + C.ivory, { w: 170 });
      });
      ty += 24;
      x += rect(L, ty, CW, 1, 'rgba(248,247,244,0.7)');
      const rh = Math.min(24, 216 / Math.max(tb.filas.length, 1));
      tb.filas.forEach(function (f, r) {
        const ry = ty + 1 + r * rh;
        if (r % 2 === 1) x += rect(L, ry, CW, rh, 'rgba(248,247,244,0.07)');
        x += k.p('t' + r, 69, ry + 3, f[0], SERIF + '; font-size: 16px; line-height: 1.1; color: ' + C.ivory, { w: 60 });
        f.slice(1, 4).forEach(function (cell, j) {
          const parts = String(cell == null ? '' : cell).split(/\s*\/\s*/);
          x += k.p('t' + r + '_' + j + 'a', cols[j], ry + 6, parts[0] || '', 'font-size: 11px; font-weight: 700; line-height: 1; color: ' + C.ivory, { w: 66 });
          if (parts[1]) x += k.p('t' + r + '_' + j + 'b', cols[j] + 68, ry + 7, parts[1], MONO + '; font-size: 8px; letter-spacing: 0.04em; line-height: 1; color: ' + C.line, { w: 110 });
        });
      });
      x += k.f('tabla_nota', '[Nota de la tabla]', L, ty + 6 + tb.filas.length * rh, 'font-size: 9.5px; line-height: 1.45; font-style: italic; color: ' + C.line, { w: CW });
      x += footer(k, 5, true);
      return x + '</div>';
    }
  },
  {
    id: 'F06', nombre: 'Ficha 06 · Professional fitting & care', grupo: 'Ficha técnica', size: [W, H],
    render: function (k) {
      let x = base(k, 6);
      x += titleBlock(k);
      x += bar(L, 229, C.teal) + k.f('secuencia_label', 'HOW TO WEAR · PROFESSIONAL FITTING SEQUENCE', L, 240, LBL + '; color: ' + C.teal, { w: CW });
      const pasos = k.d('pasos', [1, 2, 3, 4, 5].map(function (n) { return { numero: '0' + n, titulo: '[Paso]', texto: '[Texto]' }; }));
      const n = Math.max(pasos.length, 1), pw = CW / n;
      x += nodeRow(pasos.map(function (p, i) { return L + i * pw; }), 270);
      pasos.forEach(function (p, i) {
        const px = L + i * pw;
        x += k.p('pn' + i, px, 282, p.numero || String(i + 1).padStart(2, '0'), MONO + '; color: ' + C.steel);
        x += k.p('pt' + i, px, 294, titleCase(p.titulo || ''), SERIF + '; font-size: 24px; line-height: 1.1; color: ' + C.teal, { w: pw - 10 });
        x += k.img('paso' + (i + 1), px, 331, pw - 16, 96, { label: 'Paso ' + (i + 1) });
        x += k.p('px' + i, px, 438, p.texto || '', 'font-size: 10.5px; line-height: 1.5; color: ' + C.text, { w: pw - 16 });
      });
      // Panel ivory con dos listas
      const py = 526, ph = 228;
      x += rect(L, py, CW, ph, '#F4F2EE');
      x += bar(L + 23, py + 22, C.teal) + k.f('fitcheck_label', 'PROFESSIONAL FIT CHECK', L + 23, py + 34, LBL + '; color: ' + C.teal);
      x += k.box('fit', L + 23, py + 58, 320, dashList(k.d('fitcheck', ['[Punto]']), k.rich, C.text, 10.5), '');
      x += bar(420, py + 22, C.teal) + k.f('precauciones_label', 'KEY PRECAUTIONS', 420, py + 34, LBL + '; color: ' + C.teal);
      x += k.box('prec', 420, py + 58, 318, dashList(k.d('precauciones', ['[Precaución]']), k.rich, C.text, 10.5), '');
      // Bloque teal de cuidado
      const by = 787, bh = 209;
      x += rect(L, by, CW, bh, C.teal);
      x += bar(L + 23, by + 22, C.ivory) + k.f('cuidado_label', 'PRODUCT CARE & MATERIAL INTEGRITY', L + 23, by + 34, LBL + '; color: ' + C.ivory, { w: CW - 46 });
      const ic = k.d('cuidados', []);
      if (!ic.length) x += k.p('ic_pend', L + 23, by + 72, '[Íconos de cuidado: elegir en la revisión]', 'font-size: 10.5px; color: ' + C.line, { w: CW - 46 });
      ic.slice(0, 8).forEach(function (c, i) {
        const ix = L + 23 + i * 88;
        x += '<div class="deco" style="position: absolute; left: ' + ix + 'px; top: ' + (by + 64) + 'px">' + icon(c.icono, C.ivory, 22) + '</div>\n';
        x += k.p('ic' + i, ix, by + 98, c.texto || '', MONO + '; font-size: 7.5px; color: ' + C.ivory, { w: 84 });
      });
      x += k.box('metodo', L + 23, by + 140, 320, itemHtml(k.rich, { titulo: k.v('metodo_label', 'CARE METHOD'), texto: k.v('metodo', '[Texto]') }, { lc: C.ivory, tc: C.ivory }), '');
      x += k.box('prot', 416, by + 140, 322, itemHtml(k.rich, { titulo: k.v('proteccion_label', 'MATERIAL PROTECTION'), texto: k.v('proteccion', '[Texto]') }, { lc: C.ivory, tc: C.ivory }), '');
      x += footer(k, 6);
      return x + '</div>';
    }
  },
  {
    id: 'F07', nombre: 'Ficha 07 · Regulatory & quality', grupo: 'Ficha técnica', size: [W, H],
    render: function (k) {
      let x = base(k, 7);
      x += titleBlock(k);
      // Bloque teal regulatorio en tres columnas
      const by = 228, bh = 212;
      x += rect(L, by, CW, bh, C.teal);
      const reg = k.d('regulatorio', [1, 2, 3].map(function () { return { rotulo: '[CONTEXTO]', contenido: [{ tipo: 'serif', texto: '[DATO]' }] }; }));
      const cx = [81, 297, 557], cw = [200, 250, 190];
      reg.slice(0, 3).forEach(function (r, i) {
        let h = '<p style="margin: 0 0 12px; ' + MONO + '; color: ' + C.line + '">' + k.rich(r.rotulo || '') + '</p>';
        let prev = null;
        (r.contenido || []).forEach(function (c) {
          const t = c.texto || '';
          if (c.tipo === 'serif') {
            const big = t.length <= 8;
            h += '<p style="margin: 0 0 ' + (big ? 6 : 4) + 'px; ' + SERIF + '; font-size: ' + (big ? 54 : 29) + 'px; line-height: 0.95; color: ' + C.ivory + '">' + k.rich(t) + '</p>';
          } else {
            const reg2 = t.match(/^(.*?)\s+([A-Z0-9]{4,}[A-Z0-9-]*)$/);
            if (t === t.toUpperCase() && reg2) {
              h += '<p style="margin: 14px 0 3px; ' + MONO + '; color: ' + C.line + '">' + k.rich(reg2[1]) + '</p><p style="margin: 0; ' + MONO + '; font-size: 10.5px; letter-spacing: 0.08em; color: ' + C.ivory + '">' + k.rich(reg2[2]) + '</p>';
            } else if (t === t.toUpperCase()) {
              h += '<p style="margin: 0 0 8px; ' + MONO + '; color: ' + C.ivory + '">' + k.rich(t) + '</p>';
            } else if (prev && prev.tipo !== 'serif') {
              h += '<p style="margin: 4px 0 0; font-size: 9.5px; line-height: 1.4; font-style: italic; color: ' + C.line + '">' + k.rich(t) + '</p>';
            } else {
              h += '<p style="margin: 0 0 12px; font-size: 11px; line-height: 1.4; color: ' + C.ivory + '">' + k.rich(t) + '</p>';
            }
          }
          prev = c;
        });
        x += k.box('reg' + i, cx[i], by + 26, cw[i], h, '');
      });
      // Desempeño del producto terminado
      x += sideLabel(k, 'perf_label', 'FINISHED-PRODUCT PERFORMANCE · PROFESSIONAL USE', 466, C.teal, 150);
      const perf = k.d('desempeno', [{ titulo: '[RÓTULO]', texto: '[Texto]' }, { titulo: '[RÓTULO]', texto: '[Texto]' }]);
      perf.slice(0, 2).forEach(function (p, i) { x += k.box('perf' + i, i ? COL3 : COL2, 466, 256, itemHtml(k.rich, p), ''); });
      // Cierre tipográfico (mismo tratamiento de la portada), con aire arriba
      const meta = k.d('meta', []);
      const sys = meta.find(function (m) { return /SYSTEM/i.test(m.etiqueta) && !/BRAND/i.test(m.etiqueta); });
      const line = meta.find(function (m) { return /LINE/i.test(m.etiqueta); });
      x += k.p('cierre_l1', L, 862, sys ? sys.valor : '', MONO + '; color: ' + C.steel, { w: 400 });
      x += k.p('cierre_l2', L, 876, line ? line.valor : '', MONO + '; color: ' + C.steel, { w: 400 });
      x += k.p('cierre_ref', 0, 880, 'REF.', MONO + '; color: ' + C.steel + '; text-align: right', { right: W - R, w: 60 });
      x += nameRef(k, 895);
      x += footer(k, 7);
      return x + '</div>';
    }
  }
];

module.exports.ICONOS = Object.keys(ICON);
module.exports.titleCase = titleCase;
