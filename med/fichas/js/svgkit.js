/* MED Fichas · Kit SVG.
   Las páginas se dibujan como SVG nativo (unidades = puntos, carta = 612 × 792).
   Así el mismo dibujo sirve para la vista previa, el PDF vectorial, el PNG a 600 dpi
   y el SVG editable para Figma o Illustrator. */
(function () {
  'use strict';

  const FONTS = {
    display: { family: 'Instrument Serif', fallback: 'serif' },
    text: { family: 'Manrope', fallback: 'sans-serif' },
    mono: { family: 'IBM Plex Mono', fallback: 'monospace' }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function r2(n) { return Math.round(n * 100) / 100; }

  // ---------- medición de texto ----------
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const metricsCache = {};
  function setFont(f) {
    ctx.font = (f.italic ? 'italic ' : '') + (f.weight || 400) + ' ' + f.size + 'px "' + FONTS[f.font].family + '"';
    if ('letterSpacing' in ctx) ctx.letterSpacing = ((f.ls || 0) * f.size) + 'px';
  }
  function width(text, f) { setFont(f); return ctx.measureText(text).width; }
  function vmetrics(f) {
    const k = f.font + (f.weight || 400) + (f.italic ? 'i' : '');
    if (!metricsCache[k]) {
      setFont(Object.assign({}, f, { size: 100 }));
      const m = ctx.measureText('Hg');
      metricsCache[k] = { asc: (m.fontBoundingBoxAscent || 80) / 100, desc: (m.fontBoundingBoxDescent || 20) / 100 };
    }
    return metricsCache[k];
  }

  // Parte un texto en líneas que caben en `w`. Respeta saltos de línea del original.
  function wrap(text, f, w) {
    const out = [];
    String(text).split('\n').forEach(function (para) {
      const words = para.split(/ +/).filter(function (x) { return x.length; });
      if (!words.length) { out.push(''); return; }
      const lines = [];
      let line = '';
      words.forEach(function (word) {
        const t = line ? line + ' ' + word : word;
        if (!line || width(t, f) <= w) { line = t; return; }
        lines.push(line);
        line = word;
      });
      lines.push(line);
      // palabra más larga que la columna: se corta por caracteres
      lines.forEach(function (l) {
        while (width(l, f) > w && l.length > 1) {
          let k = l.length - 1;
          while (k > 1 && width(l.slice(0, k), f) > w) k--;
          out.push(l.slice(0, k)); l = l.slice(k);
        }
        out.push(l);
      });
    });
    return out;
  }

  // Bloque de texto. f = { font, size, weight, lh, ls, fill, italic, opacity, anchor, upper }
  // Con `h` y `min`, reduce el tamaño hasta que quepa; si aun así no cabe, marca overflow.
  function text(o) {
    let f = Object.assign({ font: 'text', size: 9, weight: 400, lh: 1.4, ls: 0, fill: '#222223', anchor: 'start' }, o.f);
    let str = o.upper ? String(o.text || '').toUpperCase() : String(o.text || '');
    let lines, lineH, total;
    const measure = function () {
      lines = o.w ? wrap(str, f, o.w) : str.split('\n');
      if (o.maxLines && lines.length > o.maxLines) lines = lines.slice(0, o.maxLines);
      lineH = f.size * f.lh;
      total = lines.length * lineH;
    };
    measure();
    let overflow = false;
    if (o.h) {
      const min = o.min || f.size;
      while (total > o.h + 0.5 && f.size > min) { f = Object.assign({}, f, { size: Math.round((f.size - 0.25) * 100) / 100 }); measure(); }
      overflow = total > o.h + 0.5;
    }
    const m = vmetrics(f);
    const first = o.y + (lineH - (m.asc + m.desc) * f.size) / 2 + m.asc * f.size;
    const x = o.anchor === 'middle' || f.anchor === 'middle' ? o.x + (o.w || 0) / 2 : (o.anchor === 'end' || f.anchor === 'end') ? o.x + (o.w || 0) : o.x;
    const anchor = o.anchor || f.anchor;
    let s = '<text font-family="' + FONTS[f.font].family + ', ' + FONTS[f.font].fallback + '" font-size="' + f.size + '" font-weight="' + (f.weight || 400) + '"' +
      (f.italic ? ' font-style="italic"' : '') + (f.ls ? ' letter-spacing="' + r2(f.ls * f.size) + '"' : '') +
      ' fill="' + f.fill + '"' + (f.opacity != null && f.opacity < 1 ? ' fill-opacity="' + f.opacity + '"' : '') +
      (anchor && anchor !== 'start' ? ' text-anchor="' + anchor + '"' : '') +
      (o.name ? ' data-name="' + esc(o.name) + '"' : '') + '>';
    lines.forEach(function (l, i) {
      s += '<tspan x="' + r2(x) + '" y="' + r2(first + i * lineH) + '">' + esc(l) + '</tspan>';
    });
    s += '</text>';
    return { svg: s, height: total, lines: lines.length, overflow: overflow, size: f.size, lineH: lineH };
  }

  function rect(x, y, w, h, fill, extra) {
    return '<rect x="' + r2(x) + '" y="' + r2(y) + '" width="' + r2(w) + '" height="' + r2(h) + '" fill="' + fill + '"' + (extra || '') + '/>';
  }
  function line(x1, y1, x2, y2, stroke, sw, extra) {
    return '<line x1="' + r2(x1) + '" y1="' + r2(y1) + '" x2="' + r2(x2) + '" y2="' + r2(y2) + '" stroke="' + stroke + '" stroke-width="' + (sw || 0.75) + '"' + (extra || '') + '/>';
  }

  // ---------- conectores «flujo de señal» ----------
  // Polilínea ortogonal con codos redondeados. Sin glow, sin adornos.
  function elbow(pts, r) {
    r = r == null ? 8 : r;
    let d = 'M' + r2(pts[0][0]) + ' ' + r2(pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], a = pts[i - 1], b = pts[i + 1];
      const la = Math.hypot(p[0] - a[0], p[1] - a[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
      const rr = Math.min(r, la / 2, lb / 2);
      const ia = [(p[0] - a[0]) / (la || 1), (p[1] - a[1]) / (la || 1)];
      const ob = [(b[0] - p[0]) / (lb || 1), (b[1] - p[1]) / (lb || 1)];
      d += ' L' + r2(p[0] - ia[0] * rr) + ' ' + r2(p[1] - ia[1] * rr) + ' Q' + r2(p[0]) + ' ' + r2(p[1]) + ' ' + r2(p[0] + ob[0] * rr) + ' ' + r2(p[1] + ob[1] * rr);
    }
    const z = pts[pts.length - 1];
    d += ' L' + r2(z[0]) + ' ' + r2(z[1]);
    return d;
  }
  function path(d, stroke, sw) {
    return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + (sw || 0.75) + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  // Nodo de conexión (solo donde algo se conecta)
  function node(x, y, fill, rad) {
    return '<circle cx="' + r2(x) + '" cy="' + r2(y) + '" r="' + (rad || 1.8) + '" fill="' + fill + '"/>';
  }

  // ---------- imágenes ----------
  const svgCache = {};
  // SVG del usuario → contenido seguro, con ids prefijados para no chocar entre sí
  function parseSvg(id, src) {
    if (svgCache[id] && svgCache[id].src === src) return svgCache[id];
    let txt = '';
    try {
      const b64 = src.split(',')[1];
      txt = /;base64,/.test(src) ? decodeURIComponent(escape(atob(b64))) : decodeURIComponent(b64);
    } catch (e) { return null; }
    const doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
    const root = doc.documentElement;
    if (!root || root.nodeName !== 'svg') return null;
    root.querySelectorAll('script, foreignObject, iframe').forEach(function (n) { n.remove(); });
    root.querySelectorAll('*').forEach(function (n) {
      Array.from(n.attributes).forEach(function (a) {
        if (/^on/i.test(a.name)) n.removeAttribute(a.name);
        if (/href$/i.test(a.name) && !/^(#|data:image\/)/.test(a.value)) n.removeAttribute(a.name);
      });
    });
    let vb = root.getAttribute('viewBox');
    if (!vb) vb = '0 0 ' + (parseFloat(root.getAttribute('width')) || 100) + ' ' + (parseFloat(root.getAttribute('height')) || 100);
    const pre = 'i' + id.replace(/[^a-z0-9]/gi, '') + '_';
    let inner = Array.from(root.childNodes).map(function (n) { return new XMLSerializer().serializeToString(n); }).join('');
    inner = inner.replace(/ xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '')
      .replace(/\bid="([^"]+)"/g, 'id="' + pre + '$1"')
      .replace(/url\(#([^)]+)\)/g, 'url(#' + pre + '$1)')
      .replace(/href="#([^"]+)"/g, 'href="#' + pre + '$1"');
    const p = vb.split(/[\s,]+/).map(Number);
    svgCache[id] = { src: src, vb: vb, inner: inner, w: p[2], h: p[3] };
    return svgCache[id];
  }

  // Coloca una imagen del producto en una caja. mode: 'cover' (rellena y recorta) o 'contain'.
  // Si falta, dibuja un marco de reemplazo (útil como guía de diagramación).
  // crop = { arriba, abajo } (0–1): franja vertical de la imagen que se muestra.
  function image(rc, id, x, y, w, h, mode, label, crop) {
    const im = id && rc.data.imagenes[id];
    if (!im) {
      rc.missing.push(label || 'imagen');
      return rect(x, y, w, h, 'none', ' stroke="' + rc.ph + '" stroke-width="0.6" stroke-dasharray="3 3"') +
        text({ x: x, y: y + h / 2 - 5, w: w, text: 'Imagen · ' + (label || ''), anchor: 'middle', upper: true, f: { font: 'mono', size: 6, ls: 0.1, fill: rc.ph } }).svg;
    }
    const par = 'xMidYMid ' + (mode === 'contain' ? 'meet' : 'slice');
    const top = crop && crop.arriba != null ? +crop.arriba : 0, bot = crop && crop.abajo != null ? +crop.abajo : 1;
    const cropped = top > 0 || bot < 1;
    if (/svg/.test(im.tipo || im.src.slice(5, 20))) {
      const s = parseSvg(id, im.src);
      if (s) {
        const v = s.vb.split(/[\s,]+/).map(Number);
        const vb = cropped ? [v[0], v[1] + v[3] * top, v[2], v[3] * (bot - top)].map(r2).join(' ') : s.vb;
        return '<svg x="' + r2(x) + '" y="' + r2(y) + '" width="' + r2(w) + '" height="' + r2(h) + '" viewBox="' + vb + '" preserveAspectRatio="' + par + '" overflow="hidden" data-name="' + esc(im.nombre || id) + '">' + s.inner + '</svg>';
      }
    }
    // Control de resolución para impresión
    if (im.ancho && im.alto) {
      const scale = mode === 'contain' ? Math.min(w / im.ancho, h / im.alto) : Math.max(w / im.ancho, h / im.alto);
      const dpi = Math.round(72 / scale);
      if (dpi < 300) rc.lowres.push({ id: id, nombre: im.nombre, dpi: dpi });
    }
    const src = rc.light && im.liviana ? im.liviana : im.src;
    if (cropped && im.ancho) {
      return '<svg x="' + r2(x) + '" y="' + r2(y) + '" width="' + r2(w) + '" height="' + r2(h) + '" viewBox="0 ' + r2(im.alto * top) + ' ' + im.ancho + ' ' + r2(im.alto * (bot - top)) + '" preserveAspectRatio="' + par + '" overflow="hidden">' +
        '<image width="' + im.ancho + '" height="' + im.alto + '" href="' + src + '" data-name="' + esc(im.nombre || id) + '"/></svg>';
    }
    return '<image x="' + r2(x) + '" y="' + r2(y) + '" width="' + r2(w) + '" height="' + r2(h) + '" preserveAspectRatio="' + par + '" href="' + src + '" data-name="' + esc(im.nombre || id) + '"/>';
  }

  // ---------- QR local ----------
  function qr(url, x, y, size, fill) {
    if (!url || !window.qrcode) return '';
    const q = window.qrcode(0, 'M');
    q.addData(url);
    q.make();
    const n = q.getModuleCount();
    const c = size / n;
    let d = '';
    for (let r = 0; r < n; r++) {
      for (let k = 0; k < n; k++) {
        if (q.isDark(r, k)) d += 'M' + r2(x + k * c) + ' ' + r2(y + r * c) + 'h' + r2(c) + 'v' + r2(c) + 'h-' + r2(c) + 'z';
      }
    }
    return '<path d="' + d + '" fill="' + fill + '" data-name="QR"/>';
  }

  function group(name, inner) { return '<g data-name="' + esc(name) + '">' + inner + '</g>'; }

  window.MedSvg = {
    FONTS: FONTS, esc: esc, r2: r2, width: width, wrap: wrap, text: text, rect: rect, line: line,
    elbow: elbow, path: path, node: node, image: image, parseSvg: parseSvg, qr: qr, group: group
  };
})();
