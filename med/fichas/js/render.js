/* MED Fichas · Render de páginas.
   Arma el contexto de diseño (línea, colores, rótulos), llama a cada módulo y
   devuelve SVG completos por página, con avisos de desborde, imágenes faltantes
   y resolución insuficiente. Nunca recorta ni cambia el copy. */
(function () {
  'use strict';
  const S = window.MedSvg;
  const Sch = window.MedSchema;

  function context(data, opts) {
    const P = Sch.PALETTE;
    const line = Sch.LINES[data.linea] || Sch.LINES.clinical;
    const rc = {
      data: data, P: P, L: line.color, lineName: line.name, ink: Sch.inkOn(line.color),
      figBg: P.steel, // fondo de figuras: azul acero (Steel Blue) con textos claros
      T: Sch.LABELS[data.idioma] || Sch.LABELS.es,
      light: !!(opts && opts.light),
      missing: [], lowres: [], overflows: [], ph: P.steel
    };
    rc.check = function (res, what) { if (res.overflow) rc.overflows.push(what); };
    rc.header = function (left, right, color) {
      const c = color || P.graphite;
      return S.group('Cabecera',
        S.text({ x: 40, y: 34, w: 360, text: 'MED · ' + rc.lineName + (left ? '   ' + left : ''), upper: true, maxLines: 1, f: { font: 'mono', size: 6.5, weight: 500, ls: 0.14, fill: color || rc.L } }).svg +
        S.text({ x: 412, y: 34, w: 160, text: right || '', upper: true, anchor: 'end', f: { font: 'mono', size: 6.5, weight: 500, ls: 0.14, fill: c } }).svg);
    };
    return rc;
  }

  function wrapSvg(inner, title) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="612" height="792" viewBox="0 0 612 792">' +
      '<title>' + S.esc(title) + '</title>' + inner + '</svg>';
  }

  function render(data, opts) {
    const mods = (data.modulos || []).filter(function (id) { return window.MedPages[id]; });
    return mods.map(function (id, i) {
      const rc = context(data, opts);
      let inner = window.MedPages[id](rc);
      const n = String(i + 1).padStart(2, '0');
      const fg = id === 'sizes' ? rc.ink : rc.P.graphite;
      // Pie: solo el número de página
      inner += S.group('Número de página', S.text({ x: 532, y: 754, w: 40, text: n, anchor: 'end', f: { font: 'mono', size: 7, weight: 500, fill: fg } }).svg);
      const mod = Sch.MODULES.find(function (m) { return m.id === id; });
      return {
        id: id, n: n, name: mod ? mod.name : id,
        svg: wrapSvg(inner, n + ' · ' + (mod ? mod.name : id) + ' · ' + (data.producto.nombre || '')),
        missing: rc.missing, lowres: rc.lowres, overflows: rc.overflows
      };
    });
  }

  window.MedRender = { render: render };
})();
