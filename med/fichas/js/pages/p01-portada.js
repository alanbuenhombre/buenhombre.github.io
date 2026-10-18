/* Página 01 · Portada / Anatomical Coverage.
   Base de estilo de todas las páginas: cabecera en mono, nombre en Instrument Serif,
   figuras de la prenda sobre panel azul acero con zonas conectadas por «flujo de señal». */
(function () {
  'use strict';
  const S = window.MedSvg;

  window.MedPages = window.MedPages || {};
  window.MedPages.cover = function (rc) {
    const d = rc.data, P = rc.P, W = 612, M = 40;
    const p = d.producto;
    let s = S.rect(0, 0, W, 792, P.ivory, ' data-name="Fondo"');

    // Cabecera
    s += rc.header('', 'REF. ' + (p.referencia || '—'));

    // Nombre del producto
    const title = S.text({ x: M, y: 64, w: 400, h: 124, min: 38, text: p.nombre, name: 'Nombre del producto',
      f: { font: 'display', size: 64, lh: 0.94, ls: -0.01, fill: P.graphite } });
    rc.check(title, 'Nombre del producto');
    s += title.svg;
    let y = 64 + title.height + 12;
    if (p.categoria) {
      const c = S.text({ x: M, y: y, w: 360, text: p.categoria, name: 'Categoría', f: { font: 'text', size: 8.5, weight: 600, lh: 1.4, ls: 0.01, fill: rc.L } });
      s += c.svg; y += c.height + 6;
    }
    if (p.bajada) {
      const b = S.text({ x: M, y: y, w: 330, h: 228 - y - 8, min: 12, text: p.bajada, name: 'Bajada',
        f: { font: 'display', italic: true, size: 17, lh: 1.18, fill: P.graphite } });
      rc.check(b, 'Bajada'); s += b.svg;
    }

    // QR a la página del producto (generado en local)
    if (p.url) {
      const q = 54;
      s += S.group('QR', S.qr(p.url, W - M - q, 66, q, P.graphite) +
        S.text({ x: W - M - q, y: 66 + q + 6, w: q, text: rc.T.view, upper: true, anchor: 'middle', f: { font: 'mono', size: 5.5, ls: 0.12, fill: P.graphite } }).svg);
    }

    // Panel de figuras
    const px = M, py = 236, pw = W - 2 * M, ph = 432;
    const ink = P.ivory;
    s += S.rect(px, py, pw, ph, rc.figBg, ' data-name="Panel figuras"');
    s += S.text({ x: px + 16, y: py + 14, text: rc.T.coverage, upper: true, f: { font: 'mono', size: 6.5, weight: 500, ls: 0.14, fill: ink } }).svg;

    const figs = d.cobertura.figuras.length ? d.cobertura.figuras : [{ imagen: '', vista: '' }];
    const zones = d.cobertura.zonas;
    const colW = zones.length ? 108 : 0;
    const regX = px + 16 + colW + 14, regW = pw - 2 * (16 + colW + 14);
    const regY = py + 44, regH = ph - 44 - 30;
    // tamaño de figura según su proporción, todas a la misma altura
    // Recorte vertical opcional por figura (p. ej. solo torso superior para un brasier)
    const band = function (f) { const c = f.recorte || {}; return { t: c.arriba != null ? +c.arriba : 0, b: c.abajo != null ? +c.abajo : 1 }; };
    const asp = figs.map(function (f) { const im = d.imagenes[f.imagen]; const k = band(f); return (im && im.ancho ? im.ancho / im.alto : 0.62) / Math.max(0.05, k.b - k.t); });
    const gap = 18;
    let fh = regH;
    const totalW = function (h) { return asp.reduce(function (a, r) { return a + r * h; }, 0) + gap * (figs.length - 1); };
    if (totalW(fh) > regW) fh = (regW - gap * (figs.length - 1)) / asp.reduce(function (a, r) { return a + r; }, 0);
    let fx = regX + (regW - totalW(fh)) / 2;
    const fy = regY + (regH - fh) / 2;
    const boxes = [];
    figs.forEach(function (f, i) {
      const fw = asp[i] * fh;
      s += S.image(rc, f.imagen, fx, fy, fw, fh, 'contain', 'figura ' + (f.vista || i + 1), f.recorte);
      if (f.vista) s += S.text({ x: fx, y: py + ph - 22, w: fw, text: f.vista, upper: true, anchor: 'middle', f: { font: 'mono', size: 6, ls: 0.14, fill: ink } }).svg;
      const k = band(f);
      // caja de la figura completa (sin recorte), para ubicar las zonas en coordenadas 0–1 de la imagen
      boxes.push({ x: fx, y: fy - fh * k.t / (k.b - k.t), w: fw, h: fh / (k.b - k.t) });
      fx += fw + gap;
    });

    // Zonas: izquierda las que están en la mitad izquierda de su figura, derecha las demás
    const sides = { L: [], R: [] };
    zones.forEach(function (z, i) {
      const b = boxes[Math.min(z.figura || 0, boxes.length - 1)];
      const ax = b.x + (z.x == null ? 0.5 : z.x) * b.w, ay = b.y + (z.y == null ? 0.5 : z.y) * b.h;
      const side = z.lado === 'izquierda' ? 'L' : z.lado === 'derecha' ? 'R' : (ax < px + pw / 2 ? 'L' : 'R');
      sides[side].push({ z: z, i: i, ax: ax, ay: ay });
    });
    ['L', 'R'].forEach(function (side) {
      const list = sides[side].sort(function (a, b) { return a.ay - b.ay; });
      const lx = side === 'L' ? px + 16 : px + pw - 16 - colW;
      // medir etiquetas y repartirlas sin solaparse, lo más cerca posible de su punto
      list.forEach(function (it) {
        it.name = S.text({ x: lx, y: 0, w: colW, text: it.z.nombre, f: { font: 'text', size: 7.5, weight: 700, lh: 1.3, fill: ink } });
        it.body = it.z.texto ? S.text({ x: lx, y: 0, w: colW, text: it.z.texto, f: { font: 'text', size: 6.8, lh: 1.45, fill: ink } }) : null;
        it.h = it.name.height + (it.body ? it.body.height + 3 : 0);
      });
      let cursor = regY;
      list.forEach(function (it) { it.ly = Math.max(cursor, it.ay - 5); cursor = it.ly + it.h + 14; });
      const over = cursor - 14 - (regY + regH);
      if (over > 0) { // empuja hacia arriba si se pasan del panel
        let lim = regY + regH;
        for (let k = list.length - 1; k >= 0; k--) { const it = list[k]; it.ly = Math.min(it.ly, lim - it.h); lim = it.ly - 14; }
      }
      list.forEach(function (it) {
        const n = S.text({ x: lx, y: it.ly, w: colW, text: it.z.nombre, name: 'Zona · ' + it.z.nombre, f: { font: 'text', size: 7.5, weight: 700, lh: 1.3, fill: ink } });
        let g = n.svg;
        if (it.z.texto) g += S.text({ x: lx, y: it.ly + n.height + 3, w: colW, text: it.z.texto, f: { font: 'text', size: 6.8, lh: 1.45, fill: ink } }).svg;
        // conector: punto → codo → altura de la etiqueta → borde de la columna
        const edge = side === 'L' ? lx + colW + 6 : lx - 6;
        const ty = it.ly + 4.8;
        const mid = side === 'L' ? Math.min(edge + 10, it.ax - 6) : Math.max(edge - 10, it.ax + 6);
        const pts = Math.abs(ty - it.ay) < 1 ? [[it.ax, it.ay], [edge, ty]] : [[it.ax, it.ay], [mid, it.ay], [mid, ty], [edge, ty]];
        g += S.path(S.elbow(pts, 6), ink, 0.7) + S.node(it.ax, it.ay, ink, 1.9);
        s += S.group('Zona ' + (it.i + 1), g);
      });
    });

    // Descripción (copy original, sin tocar)
    if (p.descripcion) {
      const t = S.text({ x: M, y: py + ph + 22, w: 360, h: 792 - (py + ph + 22) - 44, min: 6.8, text: p.descripcion, name: 'Descripción',
        f: { font: 'text', size: 8.5, lh: 1.55, fill: P.graphite } });
      rc.check(t, 'Descripción'); s += t.svg;
    }
    return s;
  };
})();
