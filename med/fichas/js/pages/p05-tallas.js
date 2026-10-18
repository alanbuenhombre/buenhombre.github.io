/* Página 05 · Guía de tallas.
   Hoja completa en color plano de la línea. Figura con cintas de medida numeradas que
   coinciden con los badges de la tabla; tabla con aire entre filas; «Cómo medir» con
   ilustración sobre un fondo más oscuro con marco. */
(function () {
  'use strict';
  const S = window.MedSvg;
  const Sch = window.MedSchema;

  function badge(x, y, n, bg, fg) {
    return '<circle cx="' + S.r2(x) + '" cy="' + S.r2(y) + '" r="6.4" fill="' + bg + '"/>' +
      S.text({ x: x - 8, y: y - 4.6, w: 16, text: String(n), anchor: 'middle', f: { font: 'mono', size: 6.8, weight: 500, lh: 1.35, fill: fg } }).svg;
  }

  window.MedPages = window.MedPages || {};
  window.MedPages.sizes = function (rc) {
    const d = rc.data, P = rc.P, W = 612, M = 40;
    const t = d.tallas;
    const bg = rc.L, ink = rc.ink;
    let s = S.rect(0, 0, W, 792, bg, ' data-name="Fondo color de línea"');
    s += rc.header(d.producto.nombre, 'REF. ' + (d.producto.referencia || '—'), ink);
    s += S.text({ x: M, y: 64, w: 400, text: rc.T.sizes, name: 'Título', f: { font: 'display', size: 44, lh: 1, fill: ink } }).svg;

    // Figura con cintas
    const fx = M, fy = 128, fw = 176, fh = 338;
    const im = d.imagenes[t.figura];
    let box = { x: fx, y: fy, w: fw, h: fh };
    if (im && im.ancho) { // caja real de la figura (modo contain)
      const sc = Math.min(fw / im.ancho, fh / im.alto);
      box = { w: im.ancho * sc, h: im.alto * sc }; box.x = fx + (fw - box.w) / 2; box.y = fy + (fh - box.h) / 2;
    }
    let gf = S.image(rc, t.figura, fx, fy, fw, fh, 'contain', 'figura de tallas');
    t.medidas.forEach(function (m, i) {
      const c = m.cinta; if (!c || c.y == null) return;
      const y = box.y + c.y * box.h, x1 = box.x + (c.x1 == null ? 0.2 : c.x1) * box.w, x2 = box.x + (c.x2 == null ? 0.8 : c.x2) * box.w;
      let g = S.line(x1, y, x2, y, ink, 1.1);
      for (let x = x1 + 3; x < x2 - 1; x += 4) g += S.line(x, y - 1.6, x, y + 1.6, ink, 0.4); // marcas de cinta
      g += S.line(x2, y, x2 + 8, y, ink, 0.6) + badge(x2 + 15, y, i + 1, ink, bg);
      gf += S.group('Cinta ' + (i + 1), g);
    });
    s += S.group('Figura de tallas', gf);

    // Tabla
    const tx = 246, tw = W - M - tx;
    const nameW = 116;
    const n = Math.max(t.tallas.length, 1);
    const cw = (tw - nameW) / n;
    let y = 136;
    let g = S.text({ x: tx, y: y, w: nameW, text: rc.T.unit + (t.unidad ? ' (' + t.unidad + ')' : ''), upper: true, f: { font: 'mono', size: 6.5, weight: 500, ls: 0.12, fill: ink } }).svg;
    t.tallas.forEach(function (z, k) {
      g += S.text({ x: tx + nameW + k * cw, y: y - 1, w: cw, text: z, anchor: 'middle', name: 'Talla', f: { font: 'mono', size: 8.5, weight: 500, fill: ink } }).svg;
    });
    y += 20;
    g += S.line(tx, y, tx + tw, y, ink, 0.75);
    const rowH = Math.min(40, Math.max(30, (330 - 30) / Math.max(t.medidas.length, 1)));
    // Tamaño de los valores: el mayor que quepa en la columna (máx. 7.8 pt)
    let vs = 7.8;
    t.medidas.forEach(function (m) { (m.valores || []).forEach(function (v) {
      while (vs > 5.6 && S.width(String(v), { font: 'mono', size: vs }) > cw - 6) vs -= 0.2;
    }); });
    t.tallas.forEach(function (z) { while (vs > 5.6 && S.width(String(z), { font: 'mono', size: vs, weight: 500 }) > cw - 6) vs -= 0.2; });
    t.medidas.forEach(function (m, i) {
      const cy = y + rowH / 2;
      g += badge(tx + 6.4, cy, i + 1, ink, bg);
      const nm = S.text({ x: tx + 20, y: 0, w: nameW - 26, text: m.nombre, maxLines: 3, f: { font: 'text', size: 7.8, weight: 600, lh: 1.25, fill: ink } });
      g += S.text({ x: tx + 20, y: cy - nm.height / 2, w: nameW - 26, text: m.nombre, maxLines: 3, name: 'Medida', f: { font: 'text', size: 7.8, weight: 600, lh: 1.25, fill: ink } }).svg;
      (m.valores || []).forEach(function (v, k) {
        if (k >= n) return;
        g += S.text({ x: tx + nameW + k * cw, y: cy - vs * 0.7, w: cw, text: v, anchor: 'middle', name: 'Valor', f: { font: 'mono', size: vs, lh: 1.4, fill: ink } }).svg;
      });
      y += rowH;
    });
    g += S.line(tx, y, tx + tw, y, ink, 0.75);
    y += 12;
    if (t.nota) {
      const nt = S.text({ x: tx, y: y, w: tw, h: 466 - y, min: 6, text: t.nota, name: 'Nota de tallas', f: { font: 'text', size: 7, lh: 1.5, fill: ink } });
      rc.check(nt, 'Nota de tallas'); g += nt.svg;
    }
    s += S.group('Tabla de tallas', g);

    // Cómo medir: fondo más oscuro con marco
    const hy = 494, hh = 792 - 52 - hy;
    const dark = Sch.mix(bg, P.graphite, Sch.lum(bg) > 0.3 ? 0.18 : 0.42);
    const hink = Sch.inkOn(dark);
    let gh = S.rect(M, hy, W - 2 * M, hh, dark, ' stroke="' + hink + '" stroke-opacity="0.55" stroke-width="0.8" data-name="Marco cómo medir"');
    gh += S.text({ x: M + 18, y: hy + 16, text: rc.T.howTo, upper: true, f: { font: 'mono', size: 6.5, weight: 500, ls: 0.14, fill: hink } }).svg;
    const iw = 178;
    gh += S.image(rc, t.como_medir.ilustracion, M + 18, hy + 38, iw, hh - 56, 'contain', 'cómo medir');
    let sy = hy + 40;
    const sx = M + 18 + iw + 24, sw = W - M - 18 - sx;
    const steps = t.como_medir.pasos || [];
    const avail = hh - 58;
    const per = steps.length ? avail / steps.length : avail;
    steps.forEach(function (p, i) {
      gh += S.text({ x: sx, y: sy, text: String(i + 1).padStart(2, '0'), f: { font: 'mono', size: 7, weight: 500, lh: 1.5, fill: hink } }).svg;
      const st = S.text({ x: sx + 24, y: sy, w: sw - 24, h: per - 8, min: 6.4, text: p, name: 'Paso ' + (i + 1), f: { font: 'text', size: 8, lh: 1.5, fill: hink } });
      rc.check(st, 'Paso ' + (i + 1) + ' de cómo medir');
      gh += st.svg;
      sy += Math.min(per, st.height + 14);
    });
    s += S.group('Cómo medir', gh);
    return s;
  };
})();
