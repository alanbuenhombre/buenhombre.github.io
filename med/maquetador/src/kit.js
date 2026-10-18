// Ayudantes de maquetación: mismos componentes del código de referencia (p, kicker, folio,
// grad, h2, body, rule, ph, img con corte en la mandíbula) más la capa técnica vectorial.
// Cada plantilla recibe un «kit» ligado a su página del catalog.json.
'use strict';

const TK = require('./tokens');
const { jawCrop, coverCrop } = require('./crop');
const qrcode = require('qrcode-generator');

const C = TK.color;
const M = TK.type.mono;
const S = TK.type.display;

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// Texto del usuario → HTML seguro. Saltos de línea → <br>. Los [corchetes] quedan marcados.
function rich(s) {
  return esc(s).replace(/\n/g, '<br>').replace(/\[[^\]]+\]/g, function (m) { return '<span class="pend">' + m + '</span>'; });
}
function r(n) { return Math.round(n * 10) / 10; }

// ctx: { page, catalog, images, asset(file) → URL, folio: '07', wire: bool }
function kit(ctx) {
  const page = ctx.page;
  const datos = page.datos || {};
  const fotos = page.fotos || {};
  const aj = page.ajustes || {};
  const used = { campos: {}, fotos: {} };

  // Valor de un campo: el del catálogo o el marcador por defecto (nunca inventado)
  function v(field, def) {
    if (!used.campos[field]) used.campos[field] = { def: def == null ? '' : String(def) };
    const x = datos[field];
    return x == null || x === '' ? (def == null ? '' : String(def)) : String(x);
  }

  // Valor estructurado (listas, tablas): se guarda como JSON en datos
  function d(field, def) {
    if (!used.campos[field]) used.campos[field] = { def: def, tipo: 'json' };
    const x = datos[field];
    return x == null ? def : x;
  }

  // Ajustes manuales por elemento (desde el panel de propiedades)
  function place(id, x, y, w, style) {
    const a = aj[id];
    if (!a) return { x: x, y: y, w: w, style: style };
    let st = style;
    if (a.size) st = /font-size:/.test(st) ? st.replace(/font-size: [\d.]+px/, 'font-size: ' + a.size + 'px') : st + '; font-size: ' + a.size + 'px';
    return { x: x + (a.dx || 0), y: y + (a.dy || 0), w: a.w || w, style: st };
  }

  // Párrafo posicionado. o: { w, right, bottom, field, def, raw }
  function p(id, x, y, text, style, o) {
    o = o || {};
    const pl = place(id, x, y, o.w, style);
    const pos = (o.right != null ? 'right: ' + (o.right - ((aj[id] || {}).dx || 0)) + 'px; ' : 'left: ' + pl.x + 'px; ') +
      (o.bottom != null ? 'bottom: ' + (o.bottom - ((aj[id] || {}).dy || 0)) + 'px; ' : 'top: ' + pl.y + 'px; ');
    const ww = pl.w ? 'width: ' + pl.w + 'px; ' : '';
    const content = o.raw ? text : rich(text);
    return '<p data-el="' + id + '"' + (o.field ? ' data-field="' + o.field + '"' : '') +
      ' style="position: absolute; ' + pos + ww + 'margin: 0; ' + pl.style + '">' + content + '</p>\n';
  }
  // Atajo: párrafo editable ligado a un campo
  function f(field, def, x, y, style, o) {
    return p(field, x, y, v(field, def), style, Object.assign({ field: field }, o || {}));
  }

  function kicker(field, def, x, y, c) { return f(field, def, x, y, M + '; letter-spacing: 2.4px; color: ' + (c || C.steel)); }
  function folio(c) {
    return p('folio', 0, 0, ctx.folio || '00', M + '; letter-spacing: 1.6px; color: ' + (c || C.steel), { right: TK.page.folio.right, bottom: TK.page.folio.bottom });
  }
  function grad(css) { return '<div class="deco" style="position: absolute; ' + css + '; pointer-events: none"></div>\n'; }
  function h2(field, def, x, y, w, size, c) { return f(field, def, x, y, S + '; font-size: ' + (size || 40) + 'px; line-height: 1; color: ' + (c || C.teal), { w: w }); }
  function body(field, def, x, y, w, c, size) { return f(field, def, x, y, 'font-size: ' + (size || 14) + 'px; line-height: 1.6; color: ' + (c || C.text), { w: w }); }
  function mono(field, def, x, y, c, o) { return f(field, def, x, y, M + '; letter-spacing: 1.6px; color: ' + (c || C.steel), o); }
  function serif(field, def, x, y, size, c, o) { return f(field, def, x, y, S + '; font-size: ' + size + 'px; line-height: 1.05; color: ' + (c || C.teal), o); }
  function rule(x, y, w, c) { return '<div class="deco" style="position: absolute; left: ' + x + 'px; top: ' + y + 'px; width: ' + w + 'px; height: 1px; background: ' + (c || C.teal) + '; pointer-events: none"></div>\n'; }
  function vrule(x, y, h, c) { return '<div class="deco" style="position: absolute; left: ' + x + 'px; top: ' + y + 'px; width: 1px; height: ' + h + 'px; background: ' + (c || C.teal) + '; pointer-events: none"></div>\n'; }

  function ph(x, y, w, h, label, dark, slot) {
    const bc = dark ? 'rgba(248,247,244,0.35)' : '#B9C3C8', tc = dark ? C.line : C.steel;
    return '<div data-slot="' + (slot || '') + '" style="position: absolute; left: ' + x + 'px; top: ' + y + 'px; width: ' + w + 'px; height: ' + h + 'px; border: 1px dashed ' + bc + '; box-sizing: border-box; display: flex; align-items: center; justify-content: center">' +
      '<p style="margin: 0; ' + M + '; letter-spacing: 1.4px; color: ' + tc + '; text-align: center">' + esc(label) + '</p></div>\n';
  }

  // Foto en un marco. Con personas aplica el corte en la mandíbula; sin personas, cover.
  // o: { label, dark, tx (dónde cae el sujeto en el marco), fy (mandíbula forzada), fit, alt, focusX, focusY }
  function img(slot, x, y, w, h, o) {
    o = o || {};
    if (!used.fotos[slot]) used.fotos[slot] = { label: o.label || slot, persona: o.persona };
    const id = fotos[slot];
    const meta = id && ctx.images[id];
    if (!meta || !meta.w) return ph(x, y, w, h, o.ph || '[TECH SCAN / FOTO]', o.dark, slot);
    const enc = Object.assign({}, (page.encuadre || {})[slot] || {});
    const url = ctx.asset(id);
    const alt = esc(o.alt || meta.alt || id);
    if (o.fit === 'contain') {
      return '<div data-slot="' + slot + '" style="position: absolute; left: ' + x + 'px; top: ' + y + 'px; width: ' + w + 'px; height: ' + h + 'px; overflow: hidden">' +
        '<img src="' + url + '" alt="' + alt + '" style="width: 100%; height: 100%; object-fit: contain' + (o.filter ? '; filter: ' + o.filter : '') + '"></div>\n';
    }
    let box;
    if (meta.persona) {
      box = jawCrop(meta, { W: w, H: h }, {
        jawY: enc.jawY != null ? enc.jawY : (o.fy != null ? o.fy : meta.jawY),
        subjectX: enc.subjectX != null ? enc.subjectX : meta.subjectX,
        targetX: enc.tx != null ? enc.tx : (o.tx != null ? o.tx : 0.5),
        zoom: enc.z
      });
    } else {
      box = coverCrop(meta, { W: w, H: h }, enc.focusX != null ? enc.focusX : (o.focusX != null ? o.focusX : meta.focusX), enc.focusY != null ? enc.focusY : (o.focusY != null ? o.focusY : meta.focusY));
      if (enc.z && enc.z > 1) { const k = enc.z; box = { left: box.left * k - (w * (k - 1)) / 2, top: box.top * k - (h * (k - 1)) / 2, width: box.width * k, height: box.height * k }; }
    }
    return '<div data-slot="' + slot + '" style="position: absolute; left: ' + x + 'px; top: ' + y + 'px; width: ' + w + 'px; height: ' + h + 'px; overflow: hidden">' +
      '<img src="' + url + '" alt="' + alt + '" style="position: absolute; left: ' + r(box.left) + 'px; top: ' + r(box.top) + 'px; width: ' + r(box.width) + 'px; height: ' + r(box.height) + 'px; max-width: none' + (o.filter ? '; filter: ' + o.filter : '') + '"></div>\n';
  }

  function root(bg, c) {
    return '<div class="med-page" style="position: relative; width: 1056px; height: 816px; overflow: hidden; background: ' + bg + '; font-family: Manrope, sans-serif; color: ' + (c || C.text) + '">\n';
  }

  // Logo o isotipo del proyecto (carpeta marca/). Si no existe, marca tipográfica.
  function logo(x, y, w, h, kind, light) {
    const file = ctx.catalog.marca && ctx.catalog.marca[kind || 'logo'];
    if (file && ctx.images[file]) {
      return '<img data-el="' + (kind || 'logo') + '" src="' + ctx.asset(file) + '" alt="MED" style="position: absolute; left: ' + x + 'px; top: ' + y + 'px; width: ' + w + 'px; height: ' + h + 'px; object-fit: contain; object-position: left center' + (light ? '; filter: brightness(0) invert(1)' : '') + '">\n';
    }
    const c = light ? C.ivory : C.teal;
    return '<p data-el="' + (kind || 'logo') + '" style="position: absolute; left: ' + x + 'px; top: ' + y + 'px; margin: 0; ' + S + '; font-size: ' + Math.round(h * 0.95) + 'px; line-height: 1; letter-spacing: 1px; color: ' + c + '">MED' +
      (kind === 'isotipo' ? '' : '<span style="' + M + '; letter-spacing: 2.4px; margin-left: 10px; vertical-align: middle">SCIENCE SYSTEMS</span>') + '</p>\n';
  }

  function qr(x, y, size, url, color) {
    if (!url || /^\[/.test(url)) return ph(x, y, size, size, '[QR]');
    const q = qrcode(0, 'M'); q.addData(url); q.make();
    const n = q.getModuleCount(), c = size / n;
    let d = '';
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (q.isDark(i, j)) d += 'M' + r(x + j * c) + ' ' + r(y + i * c) + 'h' + r(c) + 'v' + r(c) + 'h-' + r(c) + 'z';
    return '<svg class="deco" style="position: absolute; left: 0; top: 0; pointer-events: none" width="1056" height="816"><path d="' + d + '" fill="' + (color || C.teal) + '"/></svg>\n';
  }

  // ---------- capa técnica (vector, decorativa, pointer-events: none) ----------
  function svg(inner) { return '<svg class="deco tec" style="position: absolute; left: 0; top: 0; pointer-events: none; overflow: visible" width="1056" height="816" fill="none">' + inner + '</svg>\n'; }
  // Retícula de cruces
  function crosses(x0, y0, w, h, step, color, op) {
    step = step || 48;
    let d = '';
    for (let x = x0; x <= x0 + w + 0.1; x += step) for (let y = y0; y <= y0 + h + 0.1; y += step) d += 'M' + (x - 4) + ' ' + y + 'h8M' + x + ' ' + (y - 4) + 'v8';
    return svg('<path d="' + d + '" stroke="' + (color || C.line) + '" stroke-opacity="' + (op == null ? 0.35 : op) + '" stroke-width="1"/>');
  }
  // Marco de escaneo: esquinas en escuadra + 8 nodos (esquinas y medios)
  function scanFrame(x, y, w, h, color, label) {
    const c = color || C.ivory, L = 22;
    let d = '';
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(function (q) {
      d += 'M' + (q[0] + q[2] * L) + ' ' + q[1] + 'H' + q[0] + 'V' + (q[1] + q[3] * L);
    });
    let n = '';
    [[x, y], [x + w / 2, y], [x + w, y], [x + w, y + h / 2], [x + w, y + h], [x + w / 2, y + h], [x, y + h], [x, y + h / 2]].forEach(function (pt) {
      n += '<rect x="' + (pt[0] - 2.5) + '" y="' + (pt[1] - 2.5) + '" width="5" height="5" fill="' + c + '"/>';
    });
    const frame = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" stroke="' + c + '" stroke-opacity="0.28" stroke-width="1"/>';
    const t = label ? '<text x="' + (x + 8) + '" y="' + (y - 10) + '" fill="' + c + '" font-family="IBM Plex Mono" font-size="10" letter-spacing="1.6">' + esc(label) + '</text>' : '';
    return svg(frame + '<path d="' + d + '" stroke="' + c + '" stroke-width="1.4"/>' + n + t);
  }
  // Llamado con codo y remate: punto (acento dorado) → codo → línea hasta la etiqueta
  function callout(ax, ay, bx, by, color, gold) {
    const c = color || C.ivory;
    const mid = ax + (bx - ax) * 0.35;
    const rr = Math.min(10, Math.abs(by - ay) / 2, Math.abs(bx - mid));
    const sx = bx > ax ? 1 : -1, sy = by > ay ? 1 : -1;
    const d = Math.abs(by - ay) < 1 ? 'M' + ax + ' ' + ay + 'H' + bx :
      'M' + ax + ' ' + ay + 'H' + (mid - sx * rr) + 'Q' + mid + ' ' + ay + ' ' + mid + ' ' + (ay + sy * rr) + 'V' + (by - sy * rr) + 'Q' + mid + ' ' + by + ' ' + (mid + sx * rr) + ' ' + by + 'H' + bx;
    return svg('<path d="' + d + '" stroke="' + c + '" stroke-width="1"/>' +
      '<circle cx="' + ax + '" cy="' + ay + '" r="4.5" fill="' + (gold || C.gold) + '"/><circle cx="' + ax + '" cy="' + ay + '" r="9" stroke="' + (gold || C.gold) + '" stroke-opacity="0.6"/>' +
      '<path d="M' + bx + ' ' + (by - 4) + 'v8" stroke="' + c + '" stroke-width="1.4"/>');
  }
  // Curvas de nivel (topografía suave)
  function contours(cx, cy, rx, ry, n, color, op) {
    let d = '';
    for (let i = 1; i <= (n || 6); i++) {
      const k = i / (n || 6), a = rx * k, b = ry * k, w = 0.12 * Math.sin(i * 1.7);
      d += '<path d="M' + r(cx - a) + ' ' + cy + 'C' + r(cx - a) + ' ' + r(cy - b * (1.1 + w)) + ' ' + r(cx + a * (0.8 + w)) + ' ' + r(cy - b) + ' ' + r(cx + a) + ' ' + r(cy - b * 0.1) +
        'C' + r(cx + a * (1.1 - w)) + ' ' + r(cy + b * 0.9) + ' ' + r(cx - a * 0.6) + ' ' + r(cy + b * (1.05 + w)) + ' ' + r(cx - a) + ' ' + cy + 'Z"/>';
    }
    return svg('<g stroke="' + (color || C.line) + '" stroke-opacity="' + (op == null ? 0.35 : op) + '" stroke-width="1">' + d + '</g>');
  }
  // Marco de esquinas (evidencia)
  function corners(x, y, w, h, color, L) {
    L = L || 28;
    let d = '';
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(function (q) { d += 'M' + (q[0] + q[2] * L) + ' ' + q[1] + 'H' + q[0] + 'V' + (q[1] + q[3] * L); });
    return svg('<path d="' + d + '" stroke="' + (color || C.ivory) + '" stroke-width="1.4"/>');
  }
  // Patrón de puntos de las hojas de respiro
  function dots(op) {
    return '<div class="deco" style="position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(' + C.teal + ' 1px, transparent 1px); background-size: 18px 18px; opacity: ' + (op || 0.13) + '"></div>\n';
  }

  return {
    C: C, M: M, S: S, esc: esc, rich: rich, v: v, d: d, p: p, f: f, kicker: kicker, folio: folio, grad: grad, h2: h2, body: body, mono: mono, serif: serif,
    rule: rule, vrule: vrule, ph: ph, img: img, root: root, logo: logo, qr: qr,
    crosses: crosses, scanFrame: scanFrame, callout: callout, contours: contours, corners: corners, dots: dots,
    used: used, page: page, catalog: ctx.catalog
  };
}

module.exports = { kit, esc, rich };
