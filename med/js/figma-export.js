/* Med · Exportación a Figma.
   Recorre las páginas ya diagramadas y produce un paquete JSON (.med.json) con frames,
   textos editables (con negritas/cursivas), rectángulos, líneas e imágenes.
   El plugin "Med · Importador" lo convierte en un archivo de Figma nativo, sin internet. */
(function () {
  'use strict';

  const T = window.MedTemplates;

  function rgba(s) {
    const m = s && s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0] / 255, g: p[1] / 255, b: p[2] / 255, a: p.length > 3 ? p[3] : 1 };
  }
  function family(ff) { return (ff || '').split(',')[0].replace(/["']/g, '').trim(); }
  function px(v) { return parseFloat(v) || 0; }
  function round(n) { return Math.round(n * 100) / 100; }

  function styleOf(cs, k) {
    const size = px(cs.fontSize);
    const lh = cs.lineHeight === 'normal' ? size * 1.2 : px(cs.lineHeight);
    return {
      family: family(cs.fontFamily),
      fallbacks: (T.FALLBACKS[family(cs.fontFamily)] || []),
      weight: parseInt(cs.fontWeight, 10) || 400,
      italic: cs.fontStyle === 'italic' || cs.fontStyle === 'oblique',
      size: round(size * k),
      lineHeight: round(lh * k),
      letterSpacing: cs.letterSpacing === 'normal' ? 0 : round(px(cs.letterSpacing) * k),
      color: rgba(cs.color),
      upper: cs.textTransform === 'uppercase',
      underline: (cs.textDecorationLine || '').indexOf('underline') >= 0,
      sup: cs.verticalAlign === 'super', sub: cs.verticalAlign === 'sub'
    };
  }
  function sameRun(a, b) {
    return a.family === b.family && a.weight === b.weight && a.italic === b.italic && a.size === b.size &&
      a.underline === b.underline && a.upper === b.upper && JSON.stringify(a.color) === JSON.stringify(b.color);
  }

  // Texto + tramos de estilo, colapsando espacios como lo hace el navegador.
  function textRuns(node, k) {
    let chars = '';
    const runs = [];
    let lastSpace = true;
    // Las mayúsculas se exportan como textCase de Figma: el texto sigue siendo el original y editable.
    const push = function (s, cs) {
      if (!s) return;
      const st = styleOf(cs, k);
      const start = chars.length;
      chars += s;
      const prev = runs[runs.length - 1];
      if (prev && prev.end === start && sameRun(prev.style, st)) prev.end = chars.length;
      else runs.push({ start: start, end: chars.length, style: st });
    };
    const walk = function (n) {
      n.childNodes.forEach(function (c) {
        if (c.nodeType === 3) {
          let s = c.data.replace(/\s+/g, ' ');
          if (lastSpace) s = s.replace(/^ /, '');
          if (!s) return;
          lastSpace = / $/.test(s);
          const cs = getComputedStyle(c.parentElement);
          push(s, cs);
        } else if (c.nodeType === 1) {
          if (c.tagName === 'BR') { push('\n', getComputedStyle(n)); lastSpace = true; return; }
          walk(c);
        }
      });
    };
    walk(node);
    // recorte final
    while (chars.endsWith(' ') || chars.endsWith('\n')) {
      chars = chars.slice(0, -1);
      const r = runs[runs.length - 1];
      if (r) { r.end = Math.min(r.end, chars.length); if (r.end <= r.start) runs.pop(); }
    }
    return { chars: chars, runs: runs };
  }

  const ROLE_LAYER = {
    title: 'Título', sub: 'Subtítulo', kicker: 'Antetítulo', h1: 'Capítulo', h2: 'Sección', h3: 'Subsección',
    lead: 'Entradilla', body: 'Cuerpo', quote: 'Cita', caption: 'Pie de foto', table: 'Tabla', folio: 'Folio'
  };

  function boxNodes(el, pr, k, out) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const x = (r.left - pr.left) * k, y = (r.top - pr.top) * k, w = r.width * k, h = r.height * k;
    const name = el.dataset.name || (el.classList.contains('ph') ? 'Imagen (reemplazar)' : el.className.split(' ')[0]);
    const bg = rgba(cs.backgroundColor);
    if (bg && bg.a > 0 && w > 0 && h > 0) {
      out.push({ type: 'rect', name: name, x: round(x), y: round(y), w: round(w), h: round(h), fill: bg, radius: round(px(cs.borderTopLeftRadius) * k) });
    }
    [['Top', x, y, w, null], ['Bottom', x, null, w, null], ['Left', x, y, null, h], ['Right', null, y, null, h]].forEach(function (s) {
      const bw = px(cs['border' + s[0] + 'Width']) * k;
      if (!bw || cs['border' + s[0] + 'Style'] === 'none') return;
      const col = rgba(cs['border' + s[0] + 'Color']);
      if (!col || col.a === 0) return;
      let rx = x, ry = y, rw = w, rh = h;
      if (s[0] === 'Top') rh = bw;
      if (s[0] === 'Bottom') { ry = y + h - bw; rh = bw; }
      if (s[0] === 'Left') rw = bw;
      if (s[0] === 'Right') { rx = x + w - bw; rw = bw; }
      out.push({ type: 'rect', name: 'Línea', x: round(rx), y: round(ry), w: round(rw), h: round(rh), fill: col });
    });
  }

  function textNode(el, pr, k) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const pl = px(cs.paddingLeft) + px(cs.borderLeftWidth), pt = px(cs.paddingTop) + px(cs.borderTopWidth);
    const prr = px(cs.paddingRight) + px(cs.borderRightWidth), pb = px(cs.paddingBottom) + px(cs.borderBottomWidth);
    const t = textRuns(el, k);
    if (!t.chars.trim()) return null;
    const base = styleOf(cs, k);
    const role = el.dataset.role || 'body';
    const align = { center: 'CENTER', right: 'RIGHT', end: 'RIGHT', justify: 'JUSTIFIED' }[cs.textAlign] || 'LEFT';
    return {
      type: 'text', role: role, name: ROLE_LAYER[role] || role,
      x: round((r.left - pr.left + pl) * k), y: round((r.top - pr.top + pt) * k),
      w: round((r.width - pl - prr) * k + 1), h: round((r.height - pt - pb) * k),
      chars: t.chars, style: base, runs: t.runs, align: align,
      indent: round(px(cs.textIndent) * k)
    };
  }

  function imageNode(img, pr, k) {
    const r = img.getBoundingClientRect();
    let data = img.src;
    if (!/^data:/.test(data)) {
      // Imagen cargada desde archivo local: se rasteriza a PNG
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        data = c.toDataURL('image/png');
      } catch (e) { data = null; }
    }
    const m = data && data.match(/^data:(image\/[a-z+]+);base64,(.*)$/);
    const fit = getComputedStyle(img).objectFit;
    return {
      type: 'image', name: img.alt ? 'Imagen · ' + img.alt.slice(0, 40) : 'Imagen',
      x: round((r.left - pr.left) * k), y: round((r.top - pr.top) * k), w: round(r.width * k), h: round(r.height * k),
      mime: m ? m[1] : null, b64: m ? m[2] : null, scaleMode: fit === 'contain' ? 'FIT' : 'FILL'
    };
  }

  // container = .pages ya renderizado (sin zoom). ctx = { fmt, tpl, doc }
  function build(container, ctx) {
    const fmt = ctx.fmt;
    const pages = Array.from(container.querySelectorAll('.page'));
    const textStyles = {};
    const frames = pages.map(function (pg, i) {
      const pr = pg.getBoundingClientRect();
      const k = fmt.w / pr.width; // px de pantalla → unidades del formato (pt o px)
      const nodes = [];
      pg.querySelectorAll('.bx, .tx, img.im').forEach(function (e) {
        if (e.classList.contains('bx')) boxNodes(e, pr, k, nodes);
        if (e.tagName === 'IMG') { nodes.push(imageNode(e, pr, k)); return; }
        if (e.classList.contains('tx')) {
          const n = textNode(e, pr, k);
          if (n) {
            nodes.push(n);
            if (!textStyles[n.role]) textStyles[n.role] = { name: ROLE_LAYER[n.role] || n.role, style: n.style };
          }
        }
      });
      const kind = pg.dataset.kind === 'cover' ? 'Portada' : (pg.classList.contains('opener') ? 'Apertura' : 'Página');
      return {
        name: String(i + 1).padStart(2, '0') + ' · ' + kind,
        w: fmt.w, h: fmt.h, fill: rgba(getComputedStyle(pg).backgroundColor), nodes: nodes
      };
    });
    return {
      type: 'med-figma', version: 1, app: 'Med · Diagramador local',
      name: ctx.doc.title || ctx.doc.name, createdAt: new Date().toISOString(),
      format: { id: fmt.id, name: fmt.name, w: fmt.w, h: fmt.h, unit: fmt.unit },
      template: { id: ctx.tpl.id, name: ctx.tpl.name, colors: ctx.tpl.colors },
      margins: fmt.margin, columns: ctx.cols, gutter: Math.round(fmt.base * 1.8 * 10) / 10,
      textStyles: textStyles, pages: frames
    };
  }

  window.MedFigma = { build: build };
})();
