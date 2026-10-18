/* Página 02 · Materiales.
   Fotos reales de textura arriba; abajo la gráfica de rayos X y el bloque del material
   principal. Un conector «flujo de señal» lleva cada material hacia el principal. */
(function () {
  'use strict';
  const S = window.MedSvg;

  window.MedPages = window.MedPages || {};
  window.MedPages.materials = function (rc) {
    const d = rc.data, P = rc.P, W = 612, M = 40;
    const mats = d.materiales.lista.slice(0, 4);
    let s = S.rect(0, 0, W, 792, P.ivory, ' data-name="Fondo"');
    s += rc.header(d.producto.nombre, 'REF. ' + (d.producto.referencia || '—'));
    const title = S.text({ x: M, y: 64, w: 400, text: rc.T.materials, name: 'Título', f: { font: 'display', size: 44, lh: 1, fill: P.graphite } });
    s += title.svg;

    // Fila de texturas
    const n = Math.max(mats.length, 1), gap = 14;
    const cw = (W - 2 * M - gap * (n - 1)) / n;
    const top = 136;
    const ih = Math.min(cw * 0.78, 132);
    let bottom = top;
    const cards = [];
    mats.forEach(function (m, i) {
      const x = M + i * (cw + gap);
      let g = S.image(rc, m.textura, x, top, cw, ih, 'cover', 'textura ' + (m.nombre || i + 1));
      let y = top + ih + 10;
      const nm = S.text({ x: x, y: y, w: cw, text: m.nombre, name: 'Material', f: { font: 'text', size: 8.5, weight: 700, lh: 1.3, fill: m.principal ? rc.L : P.graphite } });
      g += nm.svg; y += nm.height + 3;
      const comp = (m.composicion || []).map(function (c) { return (c.pct != null ? c.pct + '% ' : '') + c.fibra; }).join('\n');
      if (comp) {
        const c = S.text({ x: x, y: y, w: cw, text: comp, name: 'Composición', f: { font: 'mono', size: 6.8, lh: 1.5, fill: P.graphite } });
        g += c.svg; y += c.height + 5;
      }
      if (!m.principal && m.descripcion) {
        const t = S.text({ x: x, y: y, w: cw, h: 60, min: 6.2, text: m.descripcion, name: 'Descripción material', f: { font: 'text', size: 7, lh: 1.5, fill: P.graphite } });
        rc.check(t, 'Descripción de ' + m.nombre); g += t.svg; y += t.height;
      }
      cards.push({ cx: x + cw / 2, x: x, main: !!m.principal });
      bottom = Math.max(bottom, y);
      s += S.group('Material · ' + (m.nombre || i + 1), g);
    });
    if (!mats.length) s += S.image(rc, '', M, top, W - 2 * M, ih, 'cover', 'texturas');

    // Zona inferior: rayos X (izquierda) y material principal (derecha)
    const busY = bottom + 20;
    const blockY = busY + 26;
    const blockH = 792 - 52 - blockY;
    const xw = 250;
    const bx = M + xw + 14, bw = W - M - bx;
    const main = mats.find(function (m) { return m.principal; }) || mats[0];

    // Conectores: cada material baja al bus y todos entran por un tronco al bloque principal
    const tx = bx + 26;
    let conn = '';
    cards.forEach(function (c) {
      conn += S.path(S.elbow([[c.cx, bottom + 6], [c.cx, busY], [tx, busY], [tx, blockY]], 8), rc.L, 0.8);
      conn += S.node(c.cx, bottom + 6, rc.L, 1.8);
    });
    if (cards.length) conn += S.node(tx, blockY, rc.L, 2.2);
    s += S.group('Flujo de señal', conn);

    // Rayos X
    let gx = S.rect(M, blockY, xw, blockH, P.graphite, ' data-name="Panel rayos X"');
    gx += S.text({ x: M + 14, y: blockY + 13, text: rc.T.xray, upper: true, f: { font: 'mono', size: 6.5, weight: 500, ls: 0.14, fill: P.ivory } }).svg;
    const noteH = d.materiales.rayos_x_nota ? 46 : 0;
    gx += S.image(rc, d.materiales.rayos_x, M + 14, blockY + 32, xw - 28, blockH - 46 - noteH, 'contain', 'rayos X');
    if (noteH) {
      const t = S.text({ x: M + 14, y: blockY + blockH - noteH - 2, w: xw - 28, h: noteH - 10, min: 6, text: d.materiales.rayos_x_nota, f: { font: 'text', size: 6.8, lh: 1.45, fill: P.titanium } });
      rc.check(t, 'Nota rayos X'); gx += t.svg;
    }
    s += S.group('Rayos X', gx);

    // Bloque del material principal (relleno de color de línea)
    const ink = rc.ink;
    let gm = S.rect(bx, blockY, bw, blockH, rc.L, ' data-name="Bloque material principal"');
    let y = blockY + 18;
    const pad = 20;
    gm += S.text({ x: bx + pad, y: y - 5, text: rc.T.mainMaterial, upper: true, f: { font: 'mono', size: 6.5, weight: 500, ls: 0.14, fill: ink } }).svg;
    y += 14;
    if (main) {
      const nm = S.text({ x: bx + pad, y: y, w: bw - 2 * pad, text: main.nombre, name: 'Material principal', f: { font: 'display', size: 34, lh: 1, fill: ink } });
      gm += nm.svg; y += nm.height + 10;
      const comp = (main.composicion || []).map(function (c) { return (c.pct != null ? c.pct + '% ' : '') + c.fibra; }).join('   ·   ');
      if (comp) { const c = S.text({ x: bx + pad, y: y, w: bw - 2 * pad, text: comp, f: { font: 'mono', size: 7.2, lh: 1.5, fill: ink } }); gm += c.svg; y += c.height + 12; }
      const props = main.propiedades || [];
      const propsH = props.length ? props.length * 22 + 12 : 0;
      if (main.descripcion) {
        const t = S.text({ x: bx + pad, y: y, w: bw - 2 * pad, h: blockY + blockH - pad - propsH - y, min: 6.8, text: main.descripcion, name: 'Descripción material principal',
          f: { font: 'text', size: 8.3, lh: 1.55, fill: ink } });
        rc.check(t, 'Descripción del material principal'); gm += t.svg; y += t.height + 14;
      }
      // Propiedades: lista numerada en mono, una sola línea fina arriba
      if (props.length) {
        let py = blockY + blockH - pad - props.length * 22;
        gm += S.line(bx + pad, py - 8, bx + bw - pad, py - 8, ink, 0.5, ' stroke-opacity="0.45"');
        props.forEach(function (pr, i) {
          gm += S.text({ x: bx + pad, y: py, text: String(i + 1).padStart(2, '0'), f: { font: 'mono', size: 6.8, fill: ink } }).svg;
          const t = S.text({ x: bx + pad + 22, y: py, w: bw - 2 * pad - 22, text: pr, maxLines: 2, f: { font: 'text', size: 7.6, weight: 600, lh: 1.3, fill: ink } });
          gm += t.svg; py += 22;
        });
      }
    }
    s += S.group('Material principal', gm);
    return s;
  };
})();
