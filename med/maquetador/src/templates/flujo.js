// Plantillas de catálogo «de flujo»: reciben contenido de largo variable (lo que trae el PDF guía)
// y lo diagraman con el sistema MED. C01 Portada de producto · C02 Columnas · C03 Imagen + bloques
// C04 Tabla · C05 Pasos · C06 Cierre. Todas miden 1056 × 816.
'use strict';

const M = { x: 64, w: 928, gap: 32 };

// Un ítem de contenido (párrafo, viñeta, frase serif, itálica, destacado) → HTML en flujo
function itemHtml(k, it, dark) {
  const C = k.C;
  const tx = dark ? 'rgba(248,247,244,0.82)' : C.text;
  const t = k.rich(it.texto);
  switch (it.tipo) {
    case 'vineta': return '<p style="margin: 0 0 6px; padding-left: 14px; text-indent: -14px; font-size: 12.5px; line-height: 1.5; color: ' + tx + '"><span style="color: ' + (dark ? C.goldLight : C.gold) + '">–</span>&nbsp; ' + t + '</p>';
    case 'serif': return '<p style="margin: 0 0 10px; ' + k.S + '; font-size: 20px; line-height: 1.15; color: ' + (dark ? C.ivory : C.teal) + '">' + t + '</p>';
    case 'italica': return '<p style="margin: 0 0 8px; font-size: 12px; line-height: 1.5; font-style: italic; color: ' + (dark ? C.line : C.steel) + '">' + t + '</p>';
    case 'destacado': return '<p style="margin: 0 0 8px; font-size: 13px; line-height: 1.5; font-weight: 600; color: ' + (dark ? C.ivory : C.teal) + '">' + t + '</p>';
    default: return '<p style="margin: 0 0 8px; font-size: 12.5px; line-height: 1.55; color: ' + tx + '">' + t + '</p>';
  }
}

// Columna en flujo: grupo (opcional) + número de paso + rótulo + filete + ítems
function columnHtml(k, col, dark, flex) {
  const C = k.C;
  let h = '<div style="flex: ' + (flex || 1) + ' 1 0; min-width: 0">';
  if (col.grupo && !col._sinGrupo) h += '<p style="margin: 0 0 6px; ' + k.M + '; letter-spacing: 2.4px; color: ' + (dark ? C.goldLight : C.gold) + '">' + k.esc(col.grupo) + '</p>';
  if (col.numero) h += '<p style="margin: 0 0 4px; ' + k.S + '; font-size: 44px; line-height: 1; color: ' + (dark ? C.goldLight : C.teal) + '">' + k.esc(col.numero) + '</p>';
  if (col.rotulo) h += '<p style="margin: 0 0 10px; ' + k.M + '; letter-spacing: 1.6px; color: ' + (dark ? C.line : C.steel) + '">' + k.esc(col.rotulo) + '</p>';
  h += '<div style="height: 1px; background: ' + (dark ? 'rgba(248,247,244,0.3)' : C.teal) + '; margin: 0 0 12px"></div>';
  (col.items || []).forEach(function (it) { h += itemHtml(k, it, dark); });
  return h + '</div>';
}
function column(k, id, x, y, w, col, dark) {
  return k.box(id, x, y, w, '<div style="display: flex">' + columnHtml(k, col, dark) + '</div>');
}

// Filas de columnas en flujo normal: el navegador reparte las alturas, nada se superpone.
// filas: [{ grupo, columnas: [{ rotulo, items, span }] }] (también acepta una lista plana de columnas)
function rows(k, filas, x, y, w, dark) {
  const C = k.C;
  if (filas.length && !filas[0].columnas) filas = [{ columnas: filas }];
  let h = '', prev = null;
  filas.forEach(function (f, i) {
    const cols = f.columnas || [];
    const spans = cols.reduce(function (s, c) { return s + (c.span || 1); }, 0) || 1;
    // un grupo que sigue en la fila siguiente no repite su rótulo
    if (f.grupo && f.grupo !== prev) h += '<p data-el="grupo' + i + '" style="margin: 0 0 10px; ' + k.M + '; letter-spacing: 2.4px; color: ' + (dark ? C.goldLight : C.gold) + '">' + k.esc(f.grupo) + '</p>';
    h += '<div data-el="fila' + i + '" style="display: flex; gap: 32px; margin-bottom: 26px">';
    cols.forEach(function (c) { h += columnHtml(k, Object.assign({ _sinGrupo: !!f.grupo }, c), dark, c.span || 1); });
    // columnas que no llenan la fila: huecos para conservar el ancho de columna
    for (let s = spans; s < (f.ancho || 4); s++) h += '<div style="flex: 1 1 0"></div>';
    h += '</div>';
    prev = f.grupo || null;
  });
  return k.box('contenido', x, y, w, h);
}

// Cabecera: kicker, titular serif (alto medido por su largo) y entradilla. Devuelve HTML y la y del contenido.
function header(k, dark, opts) {
  const C = k.C;
  const w = (opts && opts.w) || 640, x0 = (opts && opts.x) || M.x;
  let x = k.kicker('kicker', '[SECCIÓN · LÍNEA]', x0, 48, dark ? C.goldLight : C.steel);
  const h1 = k.v('titulo', '');
  const ent = k.v('entradilla', '');
  let y = 84;
  if (h1 || !(opts && opts.cont)) {
    const size = (opts && opts.size) || 40;
    x += k.h2('titulo', '[Titular de la sección]', x0, 76, w, size, dark ? C.ivory : C.teal);
    const len = h1 ? h1.length : 24;
    y = 76 + Math.max(1, Math.ceil(len * size * 0.46 / w)) * size * 1.02 + 22;
  }
  if (ent) { x += k.body('entradilla', '', x0, y, Math.min(w, 520), dark ? 'rgba(248,247,244,0.8)' : C.text, 13); y += Math.ceil(ent.length * 7 / Math.min(w, 520)) * 21 + 24; }
  return { html: x, y: Math.round(y) };
}

module.exports = [
  {
    id: 'C01', nombre: 'Portada de producto (flujo)', grupo: 'Catálogo · flujo',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.stone);
      x += k.img('modelo', 528, 0, 528, 816, { tx: 0.5, label: 'Foto principal del producto', ph: '[FOTO DEL PRODUCTO]' });
      x += k.grad('left: 480px; top: 0; width: 120px; height: 816px; background: linear-gradient(90deg, rgba(236,234,229,1) 0%, rgba(236,234,229,0) 100%)');
      x += k.kicker('kicker', '[SECCIÓN]', M.x, 48);
      x += k.serif('ref', '[REF]', M.x, 82, 96, C.teal, { w: 440 });
      x += k.h2('nombre', '[Nombre del producto]', M.x, 196, 440, 34);
      x += k.body('entradilla', '[Descripción del producto]', M.x, 250, 420, C.text, 13);
      const meta = k.d('meta', []);
      const ent = k.v('entradilla', '');
      let y = 250 + Math.min(6, Math.ceil(ent.length / 60)) * 21 + 28;
      meta.slice(0, 6).forEach(function (m, i) {
        const cx = M.x + (i % 2) * 220, cy = y + Math.floor(i / 2) * 58;
        x += k.rule(cx, cy, 200, i < 2 ? C.teal : C.line);
        x += k.p('meta' + i + '_v', cx, cy + 10, m.valor || '', k.S + '; font-size: 20px; line-height: 1.1; color: ' + C.teal, { w: 200 });
        x += k.p('meta' + i + '_l', cx, cy + 36, m.etiqueta || '', k.M + '; letter-spacing: 1.4px; color: ' + C.steel, { w: 200 });
      });
      const extra = k.d('datos_extra', []);
      y += Math.ceil(Math.min(6, meta.length) / 2) * 58 + 16;
      extra.slice(0, 2).forEach(function (e, i) {
        x += k.mono('extra' + i + '_l', e.rotulo || '', M.x, y + i * 44, C.steel);
        x += k.p('extra' + i + '_v', M.x, y + i * 44 + 16, e.texto || '', 'font-size: 13px; line-height: 1.4; color: ' + C.text, { w: 420 });
      });
      x += k.mono('linea', '', M.x, 740, C.steel, { w: 420 });
      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'C02', nombre: 'Columnas de contenido (flujo)', grupo: 'Catálogo · flujo',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ivory);
      const h = header(k, false, { cont: k.v('continuacion', '') === 'si' });
      x += h.html;
      x += rows(k, k.d('filas', [{ columnas: [{ rotulo: '[RÓTULO]', items: [{ tipo: 'texto', texto: '[Texto del PDF guía]' }] }] }]), M.x, h.y, M.w, false);
      const cierre = k.v('cierre', '');
      if (cierre) x += k.p('cierre', M.x, 0, cierre, k.S + '; font-size: 22px; line-height: 1.2; color: ' + C.teal, { w: 760, bottom: 64, field: 'cierre' });
      x += k.mono('linea', '', M.x, 0, C.steel, { bottom: 36, w: 600 });
      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'C03', nombre: 'Imagen + bloques (flujo)', grupo: 'Catálogo · flujo',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ivory);
      x += k.img('imagen', 0, 0, 440, 816, { tx: 0.5, label: 'Imagen de la sección', ph: '[IMAGEN]' });
      const h = header(k, false, { x: 504, w: 488, size: 36, cont: k.v('continuacion', '') === 'si' });
      x += h.html;
      x += rows(k, k.d('filas', [{ columnas: [{ rotulo: '[RÓTULO]', items: [{ tipo: 'texto', texto: '[Texto del PDF guía]' }] }] }]), 504, h.y, 488, false);
      x += k.mono('linea', '', 504, 0, C.steel, { bottom: 36, w: 400 });
      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'C04', nombre: 'Tabla (flujo)', grupo: 'Catálogo · flujo',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ivory);
      const h = header(k, false);
      x += h.html;
      const t = k.d('tabla', { columnas: ['SIZE', '[COL]'], filas: [['XS', '[valor]']] });
      const cols = t.columnas || [], filas = t.filas || [];
      const cw = Math.min(180, (M.w - 24) / Math.max(1, cols.length));
      let html = '<table style="border-collapse: collapse; ' + k.M + '; letter-spacing: 1.2px; color: ' + C.text + '"><thead><tr>';
      cols.forEach(function (c, i) { html += '<th style="text-align: ' + (i ? 'center' : 'left') + '; width: ' + cw + 'px; padding: 8px 6px; border-bottom: 1px solid ' + C.teal + '; color: ' + C.steel + '; font-weight: 500">' + k.esc(c) + '</th>'; });
      html += '</tr></thead><tbody>';
      filas.forEach(function (f) {
        html += '<tr>';
        f.forEach(function (c, i) {
          html += '<td style="padding: 7px 6px; border-bottom: 1px solid ' + C.line + '; text-align: ' + (i ? 'center' : 'left') + '; ' + (i ? '' : k.S + '; font-size: 18px; color: ' + C.teal) + '">' + k.rich(c) + '</td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
      x += k.box('tabla', M.x, h.y, M.w, html);
      const nota = k.v('nota', '');
      if (nota) x += k.p('nota', M.x, 0, nota, 'font-size: 11.5px; line-height: 1.5; font-style: italic; color: ' + C.steel, { w: 700, bottom: 64, field: 'nota' });
      x += k.mono('linea', '', M.x, 0, C.steel, { bottom: 36, w: 600 });

      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'C05', nombre: 'Secuencia de pasos (flujo)', grupo: 'Catálogo · flujo',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.ivory);
      const h = header(k, false, { cont: k.v('continuacion', '') === 'si' });
      x += h.html;
      const grupo = k.v('grupo', '');
      if (grupo) { x += k.mono('grupo', '', M.x, h.y, C.gold, { w: M.w }); h.y += 26; }
      const pasos = k.d('columnas', [{ numero: '01', rotulo: '[PASO]', items: [{ tipo: 'texto', texto: '[Texto del paso]' }] }]);
      const n = Math.max(1, Math.min(5, pasos.length));
      const w = (M.w - M.gap * (n - 1)) / n;
      const conFoto = k.v('con_fotos', 'si') === 'si';
      pasos.slice(0, 5).forEach(function (p, i) {
        const cx = M.x + i * (w + M.gap);
        let y = h.y;
        if (conFoto) { x += k.img('paso' + (i + 1), cx, y, w, 220, { label: 'Paso ' + (i + 1), ph: '[FOTO]' }); y += 236; }
        x += column(k, 'col' + i, cx, y, w, Object.assign({ _sinGrupo: true }, p), false);
      });
      x += k.mono('linea', '', M.x, 0, C.steel, { bottom: 36, w: 600 });
      x += k.folio();
      return x + '</div>';
    }
  },
  {
    id: 'C06', nombre: 'Cierre (flujo)', grupo: 'Catálogo · flujo',
    render: function (k) {
      const C = k.C;
      let x = k.root(C.inkDeep, C.ivory);
      x += k.crosses(64, 48, 928, 720, 48, C.line, 0.18);
      const h = header(k, true, { cont: !k.v('titulo', '') });
      x += h.html;
      x += rows(k, k.d('filas', []), M.x, h.y, M.w, true);
      const cierre = k.v('cierre', '');
      if (cierre) x += k.p('cierre', M.x, 0, cierre, k.S + '; font-size: 24px; line-height: 1.2; color: ' + C.ivory, { w: 700, bottom: 96, field: 'cierre' });
      x += k.p('nombre', M.x, 0, k.v('nombre', '') + (k.v('ref', '') ? '  ·  REF. ' + k.v('ref', '') : ''), k.M + '; letter-spacing: 2.4px; color: ' + C.goldLight, { bottom: 48, w: 600, field: 'nombre' });
      x += k.folio(C.line);
      return x + '</div>';
    }
  }
];
