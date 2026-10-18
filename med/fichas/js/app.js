/* MED Fichas · Interfaz: Ingesta → Revisión → Diseño → Exportar. */
(function () {
  'use strict';
  const Sch = window.MedSchema, S = window.MedSvg, X = window.MedExport;
  const $ = function (s) { return document.querySelector(s); };
  const esc = S.esc;

  const state = { data: null, pages: [], tab: 'ingesta' };

  function toast(m, ms) {
    const t = $('#toast'); t.textContent = m; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, ms || 3500);
  }
  function log(m) { const l = $('#log'); l.innerHTML = '<div>' + esc(m) + '</div>' + l.innerHTML; }
  function slug() {
    const p = state.data.producto;
    return ('med-' + (p.referencia || 'ficha') + '-' + (p.nombre || '')).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  }

  // ---------- pestañas ----------
  function go(tab) {
    state.tab = tab;
    document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === tab); });
    document.querySelectorAll('.view').forEach(function (v) { v.classList.toggle('on', v.id === 'v-' + tab); });
    if (tab === 'revision') buildForm();
    if (tab === 'diseno') { buildDesignPanel(); renderNow(); }
    if (tab === 'exportar') renderNow();
  }
  function enableTabs() { document.querySelectorAll('#tabs button').forEach(function (b) { b.disabled = false; }); }

  function setData(d, report) {
    state.data = Sch.normalize(d);
    enableTabs();
    updateFlags();
    if (report) $('#report').innerHTML = report.map(function (r) { return '<div>• ' + esc(r) + '</div>'; }).join('');
    go('revision');
  }
  function updateFlags() {
    const n = state.data ? state.data.revisar.length : 0;
    const e = $('#flag-count'); e.hidden = !n; e.textContent = n;
  }

  // ---------- ingesta ----------
  async function ingest(files) {
    $('#report').innerHTML = '<div><span class="spin"></span> Procesando ' + files.length + ' archivo(s) en este equipo…</div>';
    try {
      const res = await window.MedExtract.ingest(files, state.data);
      setData(res.data, res.report);
    } catch (e) {
      console.error(e);
      $('#report').innerHTML = '<div class="err">No se pudo procesar: ' + esc(e.message || e) + '</div>';
    }
  }

  // ---------- formulario de revisión ----------
  function flagBadge(path) {
    if (!Sch.isFlagged(state.data, path)) return '';
    return '<span class="flag">revisar</span><button class="ok" data-ok="' + esc(path) + '" title="Confirmar: el dato es correcto">✓</button>';
  }
  function fld(path, label, kind, opts) {
    opts = opts || {};
    const v = Sch.getPath(state.data, path);
    const val = v == null ? '' : v;
    let input;
    if (kind === 'area') input = '<textarea data-path="' + path + '" rows="' + (opts.rows || 3) + '">' + esc(val) + '</textarea>';
    else if (kind === 'select') input = '<select data-path="' + path + '"' + (opts.num ? ' data-num="1"' : '') + '>' + opts.options.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
    else if (kind === 'num') input = '<input type="number" step="' + (opts.step || 0.01) + '" min="0" max="1" data-path="' + path + '" data-num="1" value="' + esc(val) + '">';
    else input = '<input data-path="' + path + '" value="' + esc(val) + '"' + (opts.ph ? ' placeholder="' + esc(opts.ph) + '"' : '') + '>';
    return '<label class="f' + (opts.cls ? ' ' + opts.cls : '') + (Sch.isFlagged(state.data, path) ? ' flagged' : '') + '"><span>' + label + ' ' + flagBadge(path) + '</span>' + input + '</label>';
  }
  function imgOptions() {
    return [['', '— sin imagen —']].concat(Object.keys(state.data.imagenes).map(function (k) { return [k, k]; }));
  }
  function section(id, title, prefix, body) {
    const n = state.data.revisar.filter(function (p) { return prefix.some(function (x) { return p === x || p.indexOf(x + '.') === 0; }); }).length;
    return '<section class="card" id="sec-' + id + '"><header><h2>' + title + '</h2>' +
      (n ? '<span class="flag">' + n + ' por revisar</span><button class="btn ghost small" data-ok-all="' + prefix.join('|') + '">Confirmar sección</button>' : '<span class="okmark">✓ revisado</span>') +
      '</header>' + body + '</section>';
  }

  function buildForm() {
    const d = state.data;
    if (!d) return;
    const lines = Object.keys(Sch.LINES).map(function (k) { return [k, Sch.LINES[k].name]; });
    let h = '';
    // Producto
    h += section('producto', 'Producto', ['producto'],
      '<div class="grid2">' + fld('producto.nombre', 'Nombre') + fld('producto.referencia', 'Referencia') + fld('producto.categoria', 'Categoría') +
      fld('linea', 'Línea', 'select', { options: lines }) + '</div>' +
      fld('producto.bajada', 'Bajada', 'area', { rows: 2 }) + fld('producto.descripcion', 'Descripción', 'area', { rows: 4 }) +
      fld('producto.url', 'Página web del producto (para el QR)', 'text', { ph: 'https://…' }));

    // Cobertura
    let cov = '<h4>Figuras ' + flagBadge('cobertura.figuras') + '</h4>';
    d.cobertura.figuras.forEach(function (f, i) {
      cov += '<div class="rowf">' + fld('cobertura.figuras.' + i + '.imagen', 'Imagen', 'select', { options: imgOptions() }) +
        fld('cobertura.figuras.' + i + '.vista', 'Vista') + '<button class="x" data-del="cobertura.figuras.' + i + '">Quitar</button></div>';
    });
    cov += '<button class="btn ghost small" data-add="figura">+ Figura</button>';
    cov += '<h4>Zonas de cobertura ' + flagBadge('cobertura.zonas') + '</h4><p class="hint">Posición del punto sobre la figura: x e y de 0 a 1 (0,0 = esquina superior izquierda de la figura).</p>';
    const figOpts = d.cobertura.figuras.map(function (f, i) { return [i, (i + 1) + ' · ' + (f.vista || f.imagen || 'figura')]; });
    d.cobertura.zonas.forEach(function (z, i) {
      const p = 'cobertura.zonas.' + i;
      cov += '<div class="zone">' + fld(p + '.nombre', 'Zona') + fld(p + '.texto', 'Texto', 'text', { cls: 'wide' }) +
        fld(p + '.figura', 'Figura', 'select', { options: figOpts.length ? figOpts : [[0, '1']], num: true }) +
        fld(p + '.x', 'x', 'num') + fld(p + '.y', 'y', 'num') +
        fld(p + '.lado', 'Etiqueta', 'select', { options: [['', 'Auto'], ['izquierda', 'Izquierda'], ['derecha', 'Derecha']] }) +
        '<button class="x" data-del="' + p + '">Quitar</button></div>';
    });
    cov += '<button class="btn ghost small" data-add="zona">+ Zona</button>';
    h += section('cobertura', 'Portada · Anatomical Coverage', ['cobertura'], cov);

    // Materiales
    let mat = '';
    d.materiales.lista.forEach(function (m, i) {
      const p = 'materiales.lista.' + i;
      const comp = (m.composicion || []).map(function (c) { return (c.pct != null ? c.pct + '% ' : '') + c.fibra; }).join('\n');
      mat += '<div class="mat' + (Sch.isFlagged(d, p) ? ' flagged' : '') + '"><div class="grid3">' + fld(p + '.nombre', 'Material') +
        '<label class="f"><span>Composición (una fibra por línea) ' + flagBadge(p + '.composicion') + '</span><textarea data-comp="' + i + '" rows="3">' + esc(comp) + '</textarea></label>' +
        fld(p + '.textura', 'Foto de textura', 'select', { options: imgOptions() }) + '</div>' +
        fld(p + '.descripcion', 'Descripción', 'area', { rows: 2 }) +
        '<label class="f"><span>Propiedades (una por línea) ' + flagBadge(p + '.propiedades') + '</span><textarea data-lines="' + p + '.propiedades" rows="2">' + esc((m.propiedades || []).join('\n')) + '</textarea></label>' +
        '<div class="row"><label class="chk"><input type="radio" name="principal" data-main="' + i + '"' + (m.principal ? ' checked' : '') + '> Material principal</label>' +
        flagBadge(p) + '<button class="x" data-del="' + p + '">Quitar</button></div></div>';
    });
    mat += '<button class="btn ghost small" data-add="material">+ Material</button>';
    mat += '<div class="grid2">' + fld('materiales.rayos_x', 'Gráfica de rayos X', 'select', { options: imgOptions() }) + fld('materiales.rayos_x_nota', 'Nota de la gráfica') + '</div>';
    h += section('materiales', 'Materiales', ['materiales'], mat);

    // Tallas
    const t = d.tallas;
    let tal = '<div class="grid3">' + fld('tallas.unidad', 'Unidad') +
      '<label class="f"><span>Tallas (separadas por coma)</span><input data-sizes="1" value="' + esc(t.tallas.join(', ')) + '"></label>' +
      fld('tallas.figura', 'Figura con cintas', 'select', { options: imgOptions() }) + '</div>';
    tal += '<p class="hint">Cintas: altura (y) y extremos (x1, x2) sobre la figura, de 0 a 1. ' + flagBadge('tallas.medidas.cintas') + '</p>';
    tal += '<div class="sizes"><table><thead><tr><th>#</th><th>Medida ' + flagBadge('tallas.medidas') + '</th>' + t.tallas.map(function (z) { return '<th>' + esc(z) + '</th>'; }).join('') + '<th>y</th><th>x1</th><th>x2</th><th></th></tr></thead><tbody>';
    t.medidas.forEach(function (m, i) {
      const p = 'tallas.medidas.' + i;
      tal += '<tr><td class="n">' + (i + 1) + '</td><td><input data-path="' + p + '.nombre" value="' + esc(m.nombre) + '"></td>' +
        t.tallas.map(function (z, k) { return '<td><input class="v" data-path="' + p + '.valores.' + k + '" value="' + esc(m.valores[k] || '') + '"></td>'; }).join('') +
        ['y', 'x1', 'x2'].map(function (c) { return '<td><input class="v" type="number" step="0.01" min="0" max="1" data-num="1" data-path="' + p + '.cinta.' + c + '" value="' + esc(m.cinta ? m.cinta[c] : '') + '"></td>'; }).join('') +
        '<td><button class="x" data-del="' + p + '">×</button></td></tr>';
    });
    tal += '</tbody></table></div><button class="btn ghost small" data-add="medida">+ Medida</button>';
    tal += fld('tallas.nota', 'Nota', 'area', { rows: 2 });
    tal += '<div class="grid2">' + fld('tallas.como_medir.ilustracion', 'Ilustración «cómo medir»', 'select', { options: imgOptions() }) +
      '<label class="f"><span>Pasos (uno por línea) ' + flagBadge('tallas.como_medir.pasos') + '</span><textarea data-lines="tallas.como_medir.pasos" rows="4">' + esc(t.como_medir.pasos.join('\n')) + '</textarea></label></div>';
    h += section('tallas', 'Guía de tallas', ['tallas'], tal);

    // Imágenes
    let im = '<div class="lib">';
    Object.keys(d.imagenes).forEach(function (k) {
      const x = d.imagenes[k];
      im += '<figure><div class="th"><img src="' + x.src + '" alt=""></div><figcaption>' + esc(k) + '<br><small>' + Math.round(x.ancho) + ' × ' + Math.round(x.alto) + (/svg/.test(x.tipo) ? ' · vector' : ' px') + '</small></figcaption><button class="x" data-delimg="' + esc(k) + '">Quitar</button></figure>';
    });
    im += '</div><label class="btn ghost small"><input type="file" id="more-img" multiple accept=".svg,.png,.jpg,.jpeg,.webp" hidden>+ Agregar imágenes</label>';
    h += section('imagenes', 'Biblioteca de imágenes', ['imagenes'], im);

    // Sin asignar
    if (d.sin_asignar && d.sin_asignar.length) {
      h += section('sin', 'Información sin módulo todavía', [], '<p class="hint">Secciones de la ficha original que aún no tienen página (se conservan, no se pierden).</p>' +
        d.sin_asignar.map(function (x) { return '<div class="una"><b>' + esc(x.titulo) + '</b><p>' + esc(x.texto) + '</p></div>'; }).join(''));
    }
    $('#form').innerHTML = h;
    const more = $('#more-img');
    if (more) more.onchange = async function () {
      for (const f of Array.from(more.files)) { state.data.imagenes[f.name] = await window.MedExtract.loadImage(f); }
      buildForm();
    };
  }

  // Delegación de eventos del formulario
  function onFormInput(e) {
    const el = e.target, d = state.data;
    if (el.dataset.path) {
      let v = el.value;
      if (el.dataset.num) v = v === '' ? null : +v;
      Sch.setPath(d, el.dataset.path, v);
      Sch.unflag(d, el.dataset.path);
    } else if (el.dataset.comp) {
      const i = +el.dataset.comp;
      d.materiales.lista[i].composicion = el.value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
        const m = l.match(/^(\d+(?:[.,]\d+)?)\s*%\s*(.+)$/);
        return m ? { fibra: m[2].trim(), pct: parseFloat(m[1].replace(',', '.')) } : { fibra: l, pct: null };
      });
      Sch.unflag(d, 'materiales.lista.' + i + '.composicion');
    } else if (el.dataset.lines) {
      Sch.setPath(d, el.dataset.lines, el.value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean));
      Sch.unflag(d, el.dataset.lines);
    } else if (el.dataset.sizes) {
      d.tallas.tallas = el.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      if (e.type === 'change') buildForm();
    } else if (el.dataset.main != null) {
      d.materiales.lista.forEach(function (m, i) { m.principal = i === +el.dataset.main; });
    }
    updateFlags();
    if (e.type === 'change' && el.tagName === 'SELECT') buildForm();
  }
  function onFormClick(e) {
    const el = e.target.closest('button'); if (!el) return;
    const d = state.data;
    if (el.dataset.ok) { Sch.unflag(d, el.dataset.ok); updateFlags(); buildForm(); }
    else if (el.dataset.okAll) { el.dataset.okAll.split('|').forEach(function (p) { Sch.unflag(d, p); }); updateFlags(); buildForm(); }
    else if (el.dataset.del) {
      const p = el.dataset.del.split('.'), i = +p.pop();
      Sch.getPath(d, p.join('.')).splice(i, 1);
      Sch.unflag(d, el.dataset.del);
      buildForm();
    } else if (el.dataset.delimg) { delete d.imagenes[el.dataset.delimg]; buildForm(); }
    else if (el.dataset.add) {
      const a = el.dataset.add;
      if (a === 'figura') d.cobertura.figuras.push({ imagen: '', vista: '' });
      if (a === 'zona') d.cobertura.zonas.push({ nombre: '', texto: '', figura: 0, x: 0.5, y: 0.5 });
      if (a === 'material') d.materiales.lista.push({ nombre: '', composicion: [], descripcion: '', propiedades: [], textura: '', principal: !d.materiales.lista.length });
      if (a === 'medida') d.tallas.medidas.push({ nombre: '', valores: [], cinta: { y: 0.5, x1: 0.2, x2: 0.8 } });
      buildForm();
    }
  }

  // ---------- diseño ----------
  function buildDesignPanel() {
    const d = state.data;
    $('#lines').innerHTML = Object.keys(Sch.LINES).map(function (k) {
      const l = Sch.LINES[k];
      return '<button class="line' + (d.linea === k ? ' on' : '') + '" data-line="' + k + '"><i style="background:' + l.color + '"></i>' + l.name + '<small>' + l.color + '</small></button>';
    }).join('');
    document.querySelectorAll('#lang button').forEach(function (b) { b.classList.toggle('on', b.dataset.l === d.idioma); });
    const order = d.modulos.slice();
    Sch.MODULES.forEach(function (m) { if (order.indexOf(m.id) < 0) order.push(m.id); });
    $('#mods').innerHTML = order.map(function (id) {
      const m = Sch.MODULES.find(function (x) { return x.id === id; });
      const on = d.modulos.indexOf(id) >= 0;
      return '<div class="mod' + (m.ready ? '' : ' off') + '"><label><input type="checkbox" data-mod="' + id + '"' + (on ? ' checked' : '') + (m.ready ? '' : ' disabled') + '> ' +
        '<b>' + m.page + '</b> ' + esc(m.name) + (m.ready ? '' : ' <small>pendiente</small>') + '</label>' +
        (on ? '<span><button data-up="' + id + '" title="Subir">↑</button><button data-down="' + id + '" title="Bajar">↓</button></span>' : '') + '</div>';
    }).join('');
    // Ranuras de imagen: reemplazar sin tocar código
    const slots = [];
    d.cobertura.figuras.forEach(function (f, i) { slots.push(['cobertura.figuras.' + i + '.imagen', 'Figura · ' + (f.vista || i + 1)]); });
    d.materiales.lista.forEach(function (m, i) { slots.push(['materiales.lista.' + i + '.textura', 'Textura · ' + (m.nombre || i + 1)]); });
    slots.push(['materiales.rayos_x', 'Rayos X'], ['tallas.figura', 'Figura de tallas'], ['tallas.como_medir.ilustracion', 'Cómo medir']);
    $('#slots').innerHTML = slots.map(function (s) {
      const v = Sch.getPath(d, s[0]) || '';
      return '<div class="slot"><span>' + esc(s[1]) + '</span><select data-slot="' + s[0] + '">' + imgOptions().map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === v ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') +
        '</select><label class="up" title="Reemplazar con un archivo">↑<input type="file" data-upslot="' + s[0] + '" accept=".svg,.png,.jpg,.jpeg,.webp" hidden></label></div>';
    }).join('');
  }

  let timer = null;
  function schedule() { clearTimeout(timer); timer = setTimeout(renderNow, 80); }
  function renderNow() {
    if (!state.data) return;
    if (!state.fontsOk) { fontsReady.then(function () { state.fontsOk = true; renderNow(); }); return; }
    state.pages = window.MedRender.render(state.data);
    if (state.tab !== 'diseno') return;
    $('#preview').innerHTML = state.pages.map(function (p) {
      return '<div class="pv"><div class="pv-label">' + p.n + ' · ' + esc(p.name) + '</div><div class="pv-page">' + p.svg + '</div></div>';
    }).join('') || '<p class="hint">No hay páginas activas.</p>';
    const w = [];
    Sch.validate(state.data).forEach(function (v) { w.push(['warn', v.msg]); });
    state.pages.forEach(function (p) {
      p.overflows.forEach(function (o) { w.push(['bad', p.n + ' · «' + o + '» no cabe en su módulo aun reduciendo el tamaño. Revisa el texto o el módulo.']); });
      p.missing.forEach(function (m) { w.push(['warn', p.n + ' · Falta imagen: ' + m]); });
      p.lowres.forEach(function (r) { w.push(['warn', p.n + ' · «' + r.nombre + '» queda a ' + r.dpi + ' dpi (impresión pide ≥ 300).']); });
    });
    $('#warns').innerHTML = w.length ? w.map(function (x) { return '<div class="' + x[0] + '">' + esc(x[1]) + '</div>'; }).join('') : '<div class="good">Sin avisos.</div>';
  }

  // ---------- exportar ----------
  async function exportPdf(light) {
    if (light) await X.makeLight(state.data);
    const pages = window.MedRender.render(state.data, { light: light });
    toast('Elige «Guardar como PDF», Carta, márgenes Ninguno y Gráficos de fondo.', 6000);
    document.title = slug() + (light ? '-digital' : '-impresion');
    await X.print(pages);
    document.title = 'MED · Fichas técnicas';
    log('PDF ' + (light ? 'digital liviano' : 'de impresión') + ': diálogo de impresión abierto (' + pages.length + ' páginas).');
  }
  async function exportPng(dpi) {
    const pages = window.MedRender.render(state.data);
    log('Generando ' + pages.length + ' PNG a ' + dpi + ' dpi…');
    const files = [];
    for (const p of pages) files.push({ name: slug() + '-p' + p.n + '-' + dpi + 'dpi.png', data: await X.png(p.svg, dpi) });
    log(await X.save(files, slug() + '-png-' + dpi + 'dpi.zip'));
  }
  async function exportSvg() {
    const pages = window.MedRender.render(state.data);
    const files = pages.map(function (p) { return { name: slug() + '-p' + p.n + '.svg', data: X.svgFile(p.svg) }; });
    log(await X.save(files, slug() + '-svg.zip'));
  }
  async function exportJson() {
    const d = Sch.clone(state.data);
    Object.keys(d.imagenes).forEach(function (k) { delete d.imagenes[k].liviana; });
    log(await X.save([{ name: slug() + '.json', data: JSON.stringify(d, null, 2) }]));
  }
  function guard(fn) {
    return async function () {
      try { await fn.apply(null, arguments); } catch (e) { console.error(e); log('Error: ' + (e.message || e)); toast('Error: ' + (e.message || e)); }
    };
  }

  // ---------- eventos ----------
  function init() {
    $('#tabs').onclick = function (e) { const b = e.target.closest('button'); if (b && !b.disabled) go(b.dataset.tab); };
    const input = $('#files');
    input.onchange = function () { if (input.files.length) ingest(input.files); input.value = ''; };
    const drop = $('#drop');
    ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { if (e.dataTransfer.files.length) ingest(e.dataTransfer.files); });
    window.addEventListener('dragover', function (e) { e.preventDefault(); });
    window.addEventListener('drop', function (e) { e.preventDefault(); });
    $('#demo').onclick = function () { setData(Sch.clone(window.MED_DEMO), ['Producto de ejemplo cargado (CONTOURA™ BRA ref. 9001 · datos ficticios).']); };
    $('#blank').onclick = function () { setData(Sch.empty(), ['Producto en blanco.']); };

    const form = $('#form');
    form.addEventListener('input', onFormInput);
    form.addEventListener('change', onFormInput);
    form.addEventListener('click', onFormClick);
    $('#to-design').onclick = function () { go('diseno'); };
    $('#raw-toggle').onclick = function () {
      const r = $('#raw'); r.hidden = !r.hidden; $('#form').hidden = !r.hidden;
      if (!r.hidden) {
        const d = Sch.clone(state.data);
        Object.keys(d.imagenes).forEach(function (k) { d.imagenes[k] = Object.assign({}, d.imagenes[k], { src: '(' + Math.round(d.imagenes[k].src.length / 1024) + ' KB embebidos)' }); delete d.imagenes[k].liviana; });
        $('#raw-text').value = JSON.stringify(d, null, 2);
        $('#raw-toggle').textContent = 'Ver formulario';
      } else { $('#raw-toggle').textContent = 'Ver JSON'; buildForm(); }
    };
    $('#raw-apply').onclick = function () {
      try {
        const j = JSON.parse($('#raw-text').value);
        Object.keys(j.imagenes || {}).forEach(function (k) { if (state.data.imagenes[k]) j.imagenes[k].src = state.data.imagenes[k].src; });
        state.data = Sch.normalize(j); updateFlags();
        $('#raw-msg').textContent = 'JSON aplicado.';
      } catch (e) { $('#raw-msg').textContent = 'JSON inválido: ' + e.message; }
    };

    // Panel de diseño
    $('#lines').onclick = function (e) { const b = e.target.closest('button'); if (!b) return; state.data.linea = b.dataset.line; buildDesignPanel(); schedule(); };
    $('#lang').onclick = function (e) { const b = e.target.closest('button'); if (!b) return; state.data.idioma = b.dataset.l; buildDesignPanel(); schedule(); };
    $('#mods').onclick = function (e) {
      const b = e.target.closest('button'); if (!b) return;
      const m = state.data.modulos, id = b.dataset.up || b.dataset.down, i = m.indexOf(id), j = b.dataset.up ? i - 1 : i + 1;
      if (j < 0 || j >= m.length) return;
      m.splice(i, 1); m.splice(j, 0, id); buildDesignPanel(); schedule();
    };
    $('#mods').onchange = function (e) {
      const id = e.target.dataset.mod; if (!id) return;
      const m = state.data.modulos;
      if (e.target.checked) m.push(id); else m.splice(m.indexOf(id), 1);
      buildDesignPanel(); schedule();
    };
    $('#slots').onchange = async function (e) {
      const t = e.target;
      if (t.dataset.slot) { Sch.setPath(state.data, t.dataset.slot, t.value); Sch.unflag(state.data, t.dataset.slot); }
      if (t.dataset.upslot && t.files[0]) {
        const f = t.files[0];
        state.data.imagenes[f.name] = await window.MedExtract.loadImage(f);
        Sch.setPath(state.data, t.dataset.upslot, f.name);
      }
      buildDesignPanel(); schedule();
    };

    // Exportar
    $('#folder').onclick = guard(async function () { const n = await X.chooseFolder(); $('#folder-name').textContent = 'Carpeta: ' + n; });
    $('#x-pdf').onclick = guard(function () { return exportPdf(false); });
    $('#x-pdf-light').onclick = guard(function () { return exportPdf(true); });
    $('#x-png-600').onclick = guard(function () { return exportPng(600); });
    $('#x-png-300').onclick = guard(function () { return exportPng(300); });
    $('#x-svg').onclick = guard(exportSvg);
    $('#x-json').onclick = guard(exportJson);
  }

  // Las medidas de texto necesitan las fuentes cargadas antes del primer render
  const fontsReady = Promise.all(Array.from(document.fonts).map(function (f) { return f.load().catch(function () {}); })).then(function () { return document.fonts.ready; });
  window.MedApp = { state: state, go: go, render: renderNow };
  init();
})();
