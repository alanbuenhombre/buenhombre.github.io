/* Med · Interfaz. Une extracción → estructura → formato/plantilla → diagramación → exportación. */
(function () {
  'use strict';

  const T = window.MedTemplates;
  const X = window.MedExtract;
  const $ = function (s) { return document.querySelector(s); };

  const state = {
    doc: null,
    fmtId: 'carta',
    tplId: 'clasico',
    formats: T.FORMATS.slice(),
    templates: T.TEMPLATES.slice(),
    accent: null,
    coverImage: null,
    zoom: 'fit',
    view: 'design',
    rendering: false,
    pending: false
  };

  // ---------- utilidades ----------
  function toast(msg, ms) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, ms || 3200);
  }
  function download(name, data, type) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: type || 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  function slug(s) {
    return (s || 'documento').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'documento';
  }
  function fmt() { return state.formats.find(function (f) { return f.id === state.fmtId; }) || state.formats[0]; }
  function tpl() {
    const t = T.clone(state.templates.find(function (x) { return x.id === state.tplId; }) || state.templates[0]);
    if (state.accent) t.colors.accent = state.accent;
    return t;
  }
  function opts() {
    return {
      cover: $('#o-cover').checked,
      chapterBreak: $('#o-chapter').checked,
      numbers: $('#o-numbers').checked,
      placeholders: $('#o-ph').checked,
      cols: $('#o-cols').value,
      kicker: $('#o-kicker').value.trim(),
      author: $('#o-author').value.trim(),
      date: $('#o-date').value.trim(),
      coverImage: state.coverImage
    };
  }
  function readImage(file) {
    return new Promise(function (res, rej) {
      const r = new FileReader();
      r.onload = function () {
        const im = new Image();
        im.onload = function () { res({ src: r.result, w: im.naturalWidth, h: im.naturalHeight, img: im }); };
        im.onerror = rej;
        im.src = r.result;
      };
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  // ---------- carga de documento ----------
  async function loadFile(file) {
    $('#docinfo').hidden = false;
    $('#docinfo').innerHTML = '<span class="spin"></span> Leyendo <b>' + X.esc(file.name) + '</b> en este equipo…';
    try {
      const doc = await X.extract(file);
      if (!doc.blocks.length) throw new Error((doc.warnings[0]) || 'No se encontró texto en el documento.');
      state.doc = doc;
      showDocInfo(file);
      ['#step-struct', '#step-format', '#step-tpl', '#step-opts', '#step-spec', '#step-export'].forEach(function (s) { $(s).hidden = false; });
      $('#toolbar').hidden = false;
      renderStruct();
      ask();
    } catch (e) {
      console.error(e);
      $('#docinfo').innerHTML = '<span class="err">No se pudo leer el archivo: ' + X.esc(e.message || String(e)) + '</span>';
    }
  }
  function showDocInfo(file) {
    const d = state.doc, s = d.stats;
    let h = '<div class="fname">' + X.esc(file ? file.name : d.name) + '</div>';
    h += '<div class="chips">' +
      '<span>' + s.words.toLocaleString('es') + ' palabras</span>' +
      '<span>' + s.heads + ' títulos</span>' +
      (s.lists ? '<span>' + s.lists + ' listas</span>' : '') +
      (s.tables ? '<span>' + s.tables + ' tablas</span>' : '') +
      (s.images ? '<span>' + s.images + ' imágenes</span>' : '') + '</div>';
    h += '<div class="dtitle">Título detectado: <b>' + X.esc(d.title) + '</b></div>';
    d.warnings.forEach(function (w) { h += '<div class="warn">' + X.esc(w) + '</div>'; });
    $('#docinfo').innerHTML = h;
  }

  // ---------- estructura ----------
  const TYPE_LABEL = {
    title: 'Título del documento', subtitle: 'Subtítulo', h1: 'Capítulo (H1)', h2: 'Sección (H2)', h3: 'Subsección (H3)',
    lead: 'Entradilla', p: 'Párrafo', quote: 'Cita destacada', caption: 'Pie de foto',
    ul: 'Lista', ol: 'Lista numerada', table: 'Tabla', image: 'Imagen'
  };
  const TEXT_TYPES = ['title', 'subtitle', 'h1', 'h2', 'h3', 'lead', 'p', 'quote', 'caption'];
  function renderStruct() {
    const box = $('#struct');
    box.innerHTML = '';
    state.doc.blocks.forEach(function (b) {
      const row = document.createElement('div');
      row.className = 'srow t-' + b.type + (b.excluded ? ' off' : '');
      let ctl;
      if (TEXT_TYPES.indexOf(b.type) >= 0) {
        ctl = document.createElement('select');
        TEXT_TYPES.forEach(function (t) {
          const o = document.createElement('option'); o.value = t; o.textContent = TYPE_LABEL[t];
          if (t === b.type) o.selected = true; ctl.appendChild(o);
        });
        ctl.onchange = function () { b.type = ctl.value; row.className = 'srow t-' + b.type + (b.excluded ? ' off' : ''); schedule(); };
      } else {
        ctl = document.createElement('span'); ctl.className = 'tlabel'; ctl.textContent = TYPE_LABEL[b.type];
      }
      const txt = document.createElement('div');
      txt.className = 'stext';
      txt.textContent = b.type === 'image' ? (b.w + ' × ' + b.h + ' px') : X.blockText(b).slice(0, 140);
      const off = document.createElement('label');
      off.className = 'omit';
      off.title = 'Omitir este bloque en la diagramación';
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!b.excluded;
      cb.onchange = function () { b.excluded = cb.checked; row.classList.toggle('off', cb.checked); schedule(); };
      off.appendChild(cb); off.appendChild(document.createTextNode('omitir'));
      row.appendChild(ctl); row.appendChild(off); row.appendChild(txt);
      box.appendChild(row);
    });
  }

  // ---------- formatos y plantillas ----------
  function formatCards(box, onPick) {
    box.innerHTML = '';
    state.formats.forEach(function (f) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'fcard' + (f.id === state.fmtId ? ' on' : '');
      const r = f.w / f.h, H = 46, W = Math.round(H * r);
      b.innerHTML = '<span class="shape" style="width:' + Math.min(W, 70) + 'px;height:' + (W > 70 ? Math.round(70 / r) : H) + 'px"></span>' +
        '<span class="fname">' + f.name + '</span><span class="fnote">' + f.note + '</span>';
      b.onclick = function () { state.fmtId = f.id; formatCards(box, onPick); if (onPick) onPick(); };
      box.appendChild(b);
    });
  }
  function tplCards(box, onPick) {
    box.innerHTML = '';
    state.templates.forEach(function (t) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tcard' + (t.id === state.tplId ? ' on' : '');
      const d = t.roles.title, bd = t.roles.body;
      const sw = ['paper', 'ink', 'accent', 'soft'].map(function (k) {
        const c = k === 'accent' && state.accent && t.id === state.tplId ? state.accent : t.colors[k];
        return c ? '<i style="background:' + c + '"></i>' : '';
      }).join('');
      b.innerHTML = '<span class="tprev" style="background:' + t.colors.paper + ';color:' + t.colors.ink + '">' +
        '<span style="font-family:' + T.fontStack(d.f) + ';font-weight:' + d.w + ';font-style:' + d.st + ';letter-spacing:' + d.ls + 'em">Aa</span>' +
        '<span class="tbody" style="font-family:' + T.fontStack(bd.f) + '">' + X.esc(d.f) + (bd.f !== d.f ? ' + ' + X.esc(bd.f) : '') + '</span></span>' +
        '<span class="tname">' + X.esc(t.name) + '</span><span class="tdesc">' + X.esc(t.description || '') + '</span><span class="sw">' + sw + '</span>';
      b.onclick = function () { state.tplId = t.id; tplCards(box, onPick); if (onPick) onPick(); };
      box.appendChild(b);
    });
  }
  function refreshPickers() {
    formatCards($('#formats'), schedule);
    tplCards($('#tpls'), schedule);
  }

  function ask() {
    const dlg = $('#ask');
    const s = state.doc.stats;
    $('#ask-sum').textContent = 'Se reconocieron ' + s.words.toLocaleString('es') + ' palabras en ' + s.blocks + ' bloques, con ' + s.heads + ' títulos. Elige el formato de salida y un estilo para empezar; podrás cambiarlos después.';
    formatCards($('#ask-formats'));
    tplCards($('#ask-tpls'));
    if (typeof dlg.showModal === 'function') {
      dlg.showModal();
      dlg.onclose = function () { refreshPickers(); schedule(); };
    } else { refreshPickers(); schedule(); }
  }

  // ---------- diagramación ----------
  let timer = null;
  function schedule() { clearTimeout(timer); timer = setTimeout(doRender, 120); }
  async function doRender() {
    if (!state.doc) return;
    if (state.rendering) { state.pending = true; return; }
    state.rendering = true;
    $('#empty').hidden = true;
    $('#status').innerHTML = '<span class="spin"></span> Diagramando…';
    const pages = $('#pages');
    pages.style.zoom = 1;
    try {
      const ctx = { fmt: fmt(), tpl: tpl(), opts: opts() };
      const res = await window.MedLayout.render(pages, state.doc, ctx);
      pages.classList.toggle('wire', state.view === 'wire');
      applyZoom();
      const ig = res.integrity;
      let st = '<b>' + res.pages.length + '</b> páginas · ' + ctx.fmt.name + ' · ' + ctx.tpl.name;
      if (ig.exact) st += ' <span class="ok" title="Cada palabra del documento aparece en la diagramación, en el mismo orden.">✓ Texto íntegro (' + ig.placed.toLocaleString('es') + ' palabras)</span>';
      else st += ' <span class="bad" title="Esperado: «' + X.esc(ig.firstDiff.expected) + '» · Encontrado: «' + X.esc(ig.firstDiff.got) + '»">⚠ Revisar texto: ' + ig.placed + ' / ' + ig.source + ' palabras</span>';
      if (ig.omitted) st += ' <span class="muted">(' + ig.omitted + ' palabras omitidas a propósito)</span>';
      $('#status').innerHTML = st;
      renderSpec(ctx);
    } catch (e) {
      console.error(e);
      $('#status').innerHTML = '<span class="bad">Error al diagramar: ' + X.esc(e.message) + '</span>';
    }
    state.rendering = false;
    if (state.pending) { state.pending = false; doRender(); }
  }

  function applyZoom() {
    const pages = $('#pages');
    const pg = pages.querySelector('.page');
    if (!pg) return;
    let z = state.zoom;
    if (z === 'fit') {
      const avail = $('#stage').clientWidth - 64;
      z = Math.min(1, avail / pg.offsetWidth);
      const f = fmt();
      if (!f.print && f.h > f.w) z = Math.min(z, ($('#stage').clientHeight - 80) / pg.offsetHeight * 1.6);
    }
    pages.style.zoom = z;
    state.currentZoom = z;
  }

  function renderSpec(ctx) {
    const rows = T.typeSpec(ctx.fmt, ctx.tpl);
    let h = '<table><tbody>';
    rows.forEach(function (r) {
      h += '<tr><td class="sr">' + r.name + '</td><td><b>' + X.esc(r.family) + '</b> ' + r.style +
        '<br><span>' + r.size + '/' + r.leading + ' ' + r.unit + (r.tracking ? ' · track ' + r.tracking : '') + (r.upper ? ' · MAYÚS' : '') +
        '</span></td><td><i class="sw1" style="background:' + r.color + '"></i></td></tr>';
    });
    h += '</tbody></table>';
    const c = ctx.tpl.colors;
    h += '<div class="colors">' + ['paper', 'ink', 'muted', 'accent', 'soft'].filter(function (k) { return c[k]; }).map(function (k) {
      return '<span><i style="background:' + c[k] + '"></i>' + { paper: 'Papel', ink: 'Tinta', muted: 'Secundario', accent: 'Acento', soft: 'Fondo suave' }[k] + ' ' + c[k].toUpperCase() + '</span>';
    }).join('') + '</div>';
    const f = ctx.fmt;
    h += '<p class="hint">Página ' + f.w + ' × ' + f.h + ' ' + f.unit + ' · márgenes ' + f.margin.join(' / ') + ' ' + f.unit + ' · ' + (ctx.opts.cols === 'auto' ? f.cols : ctx.opts.cols) + ' columna(s).</p>';
    $('#spec').innerHTML = h;
  }

  // ---------- exportación ----------
  function exportPdf() {
    const f = fmt();
    let st = document.getElementById('page-size');
    if (!st) { st = document.createElement('style'); st.id = 'page-size'; document.head.appendChild(st); }
    st.textContent = '@page { size: ' + f.w + f.unit + ' ' + f.h + f.unit + '; margin: 0; }';
    const wasWire = state.view === 'wire';
    toast('En el diálogo elige «Guardar como PDF», márgenes «Ninguno» y activa «Gráficos de fondo».', 6000);
    setTimeout(function () {
      window.print();
      if (wasWire) $('#pages').classList.add('wire');
    }, 300);
  }
  async function exportFigma() {
    const pages = $('#pages');
    const z = pages.style.zoom;
    const wire = pages.classList.contains('wire');
    pages.style.zoom = 1;
    pages.classList.remove('wire');
    try {
      const ctx = { fmt: fmt(), tpl: tpl(), doc: state.doc, cols: opts().cols === 'auto' ? fmt().cols : +opts().cols };
      const data = window.MedFigma.build(pages, ctx);
      download(slug(state.doc.title) + '-' + ctx.fmt.id + '.med.json', JSON.stringify(data), 'application/json');
      toast('Paquete listo. En Figma: Plugins → Desarrollo → Med · Importador → carga este archivo.', 6000);
    } finally {
      pages.style.zoom = z;
      if (wire) pages.classList.add('wire');
    }
  }

  // ---------- plantilla desde Figma ----------
  function hex(c) {
    if (!c) return null;
    if (typeof c === 'string') return c;
    const h = function (v) { return Math.round(v * 255).toString(16).padStart(2, '0'); };
    return '#' + h(c.r) + h(c.g) + h(c.b);
  }
  function importTemplate(json) {
    if (!json || json.type !== 'med-template') throw new Error('El archivo no es una plantilla de Med (exportada desde el plugin).');
    const base = T.clone(T.TEMPLATES.find(function (t) { return t.id === (json.base || 'clasico'); }) || T.TEMPLATES[0]);
    const roles = json.roles || {};
    const body = roles.body || roles.p;
    const bodySize = body ? body.size : 10;
    const t = base;
    t.id = 'figma-' + Date.now();
    t.base = json.base || 'clasico';
    t.name = json.name || 'Plantilla de Figma';
    t.description = 'Importada desde Figma: ' + Object.keys(roles).length + ' estilos de texto' + (json.colors ? ' y colores' : '') + '.';
    if (json.colors) {
      ['paper', 'ink', 'muted', 'accent', 'soft'].forEach(function (k) { if (json.colors[k]) t.colors[k] = hex(json.colors[k]); });
      if (json.colors.paper) t.colors.coverPaper = hex(json.colors.coverPaper || json.colors.paper);
      if (json.colors.ink) t.colors.coverInk = hex(json.colors.coverInk || json.colors.ink);
    }
    Object.keys(roles).forEach(function (k) {
      const r = roles[k];
      if (!t.roles[k] || !r.family) return;
      const ck = 'r_' + k;
      if (r.color) t.colors[ck] = hex(r.color);
      t.roles[k] = {
        f: r.family, w: r.weight || 400, st: r.italic ? 'italic' : 'normal',
        z: Math.round(r.size / bodySize * 1000) / 1000,
        lh: r.lineHeight ? Math.round(r.lineHeight / r.size * 100) / 100 : t.roles[k].lh,
        ls: r.letterSpacing ? Math.round(r.letterSpacing / r.size * 1000) / 1000 : 0,
        c: r.color ? ck : t.roles[k].c, tt: r.upper ? 'uppercase' : 'none'
      };
    });
    // Si la plantilla trae página propia, se agrega como formato
    if (json.page && json.page.w && json.page.h) {
      const known = state.formats.find(function (f) { return Math.abs(f.w - json.page.w) < 2 && Math.abs(f.h - json.page.h) < 2; });
      if (known) state.fmtId = known.id;
      else {
        const w = json.page.w, h = json.page.h;
        const unit = Math.max(w, h) <= 1300 ? 'pt' : 'px';
        const m = json.page.margin || [h * 0.075, w * 0.08, h * 0.08, w * 0.08].map(Math.round);
        const f = { id: 'figma-' + w + 'x' + h, name: json.page.name || 'Desde Figma', note: w + ' × ' + h + ' ' + unit, w: w, h: h, unit: unit,
          base: Math.round(bodySize * 10) / 10, margin: m, cols: json.page.cols || (w > h ? 2 : 1), print: unit === 'pt', chapterBreak: true, sectionBreak: unit !== 'pt' };
        state.formats = state.formats.filter(function (x) { return x.id !== f.id; }).concat([f]);
        state.fmtId = f.id;
      }
    }
    state.templates.push(t);
    state.tplId = t.id;
    refreshPickers();
    schedule();
    toast('Plantilla «' + t.name + '» importada.');
  }

  // ---------- paleta desde imagen ----------
  function paletteFrom(img) {
    const c = document.createElement('canvas');
    const s = 80;
    c.width = s; c.height = Math.max(1, Math.round(s * img.naturalHeight / img.naturalWidth));
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const buckets = {};
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) continue;
      const k = (d[i] >> 4) + ',' + (d[i + 1] >> 4) + ',' + (d[i + 2] >> 4);
      const b = buckets[k] || (buckets[k] = { n: 0, r: 0, g: 0, b: 0 });
      b.n++; b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2];
    }
    const list = Object.keys(buckets).map(function (k) {
      const b = buckets[k];
      const r = b.r / b.n, gg = b.g / b.n, bb = b.b / b.n;
      const mx = Math.max(r, gg, bb), mn = Math.min(r, gg, bb);
      return { n: b.n, r: r, g: gg, b: bb, sat: mx ? (mx - mn) / mx : 0, lum: (0.299 * r + 0.587 * gg + 0.114 * bb) / 255 };
    }).sort(function (a, b) { return b.n - a.n; });
    const picked = [];
    list.forEach(function (c) {
      if (picked.length >= 6) return;
      if (picked.every(function (p) { return Math.abs(p.r - c.r) + Math.abs(p.g - c.g) + Math.abs(p.b - c.b) > 70; })) picked.push(c);
    });
    const toHex = function (c) { return '#' + [c.r, c.g, c.b].map(function (v) { return Math.round(v).toString(16).padStart(2, '0'); }).join(''); };
    const accent = picked.slice().filter(function (c) { return c.lum > 0.18 && c.lum < 0.7; })
      .sort(function (a, b) { return (b.sat * Math.sqrt(b.n)) - (a.sat * Math.sqrt(a.n)); })[0] || picked[0];
    return { colors: picked.map(toHex), accent: toHex(accent) };
  }
  function showPalette(p) {
    const box = $('#palette');
    box.hidden = false;
    box.innerHTML = '<span class="hint">Toca un color para usarlo como acento:</span>';
    p.colors.forEach(function (c) {
      const b = document.createElement('button');
      b.className = 'swb' + (c === state.accent ? ' on' : '');
      b.style.background = c; b.title = c;
      b.onclick = function () { state.accent = c; showPalette(p); tplCards($('#tpls'), schedule); schedule(); };
      box.appendChild(b);
    });
    const r = document.createElement('button');
    r.className = 'link small'; r.textContent = 'Quitar';
    r.onclick = function () { state.accent = null; box.hidden = true; tplCards($('#tpls'), schedule); schedule(); };
    box.appendChild(r);
  }

  // ---------- eventos ----------
  function init() {
    $('#o-date').value = new Date().toLocaleDateString('es', { month: 'long', year: 'numeric' }).replace(/^./, function (c) { return c.toUpperCase(); });

    const input = $('#file');
    input.onchange = function () { if (input.files[0]) loadFile(input.files[0]); input.value = ''; };
    const drop = $('#drop');
    ['dragenter', 'dragover'].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (ev) { const f = ev.dataTransfer.files[0]; if (f) loadFile(f); });
    // Soltar en cualquier parte de la ventana
    window.addEventListener('dragover', function (e) { e.preventDefault(); });
    window.addEventListener('drop', function (e) { e.preventDefault(); const f = e.dataTransfer && e.dataTransfer.files[0]; if (f && !drop.contains(e.target)) loadFile(f); });

    $('#sample').onclick = function () { loadFile(new File([window.MED_SAMPLE], 'informe-de-gestion-2026.md', { type: 'text/markdown' })); };
    $('#toggle-struct').onclick = function () { $('#struct').hidden = !$('#struct').hidden; };

    ['#o-cover', '#o-chapter', '#o-numbers', '#o-ph', '#o-cols'].forEach(function (s) { $(s).onchange = schedule; });
    ['#o-kicker', '#o-author', '#o-date'].forEach(function (s) { $(s).oninput = schedule; });

    $('#cover-file').onchange = async function (e) {
      const f = e.target.files[0]; if (!f) return;
      state.coverImage = await readImage(f);
      $('#cover-label').textContent = 'Portada: ' + f.name;
      schedule();
    };
    $('#palette-file').onchange = async function (e) {
      const f = e.target.files[0]; if (!f) return;
      const im = await readImage(f);
      const p = paletteFrom(im.img);
      state.accent = p.accent;
      showPalette(p);
      tplCards($('#tpls'), schedule);
      schedule();
      e.target.value = '';
    };
    $('#tpl-file').onchange = async function (e) {
      const f = e.target.files[0]; if (!f) return;
      try { importTemplate(JSON.parse(await f.text())); } catch (err) { toast(err.message, 5000); }
      e.target.value = '';
    };

    $('#view').addEventListener('click', function (e) {
      const v = e.target.dataset && e.target.dataset.v; if (!v) return;
      state.view = v;
      Array.from($('#view').children).forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); });
      $('#pages').classList.toggle('wire', v === 'wire');
    });
    $('#z-fit').onclick = function () { state.zoom = 'fit'; applyZoom(); };
    $('#z-in').onclick = function () { state.zoom = Math.min(2, (state.currentZoom || 1) * 1.25); applyZoom(); };
    $('#z-out').onclick = function () { state.zoom = Math.max(0.15, (state.currentZoom || 1) / 1.25); applyZoom(); };
    window.addEventListener('resize', function () { if (state.zoom === 'fit') applyZoom(); });

    $('#x-pdf').onclick = exportPdf;
    $('#x-figma').onclick = exportFigma;
    refreshPickers();
  }

  window.Med = { state: state, loadFile: loadFile, render: doRender, importTemplate: importTemplate };
  init();
})();
