/* MED maquetador local · interfaz de revisión y edición (ficha técnica y catálogo). */
(function () {
  'use strict';
  const $ = function (s) { return document.querySelector(s); };
  const ICONOS = ['lavar_mano', 'no_blanquear', 'no_planchar', 'no_secadora', 'no_escurrir', 'no_unas', 'secar_colgado', 'cobertura', 'soporte', 'estabilidad', 'ajuste'];
  const TIPOS = ['serif', 'texto', 'vineta', 'italica', 'destacado'];
  // Nombres legibles de los campos más comunes
  const LABEL = {
    marca_l1: 'Encabezado · línea 1', marca_l2: 'Encabezado · línea 2', seccion: 'Encabezado · sección', producto_linea: 'Encabezado · producto y ref.',
    eyebrow: 'Eyebrow', h1: 'Título (H1)', entradilla: 'Entradilla', nombre: 'Nombre del producto', ref: 'Referencia', descripcion: 'Descripción',
    tallas: 'Tallas', colores: 'Colores', meta: 'Fila de metadatos', overview: 'Product overview', cobertura: 'Cobertura anatómica', beneficios: 'Beneficios',
    materiales: 'Materiales', system_logic: 'System logic (usa -> entre pasos)', scientific_boundary: 'Scientific boundary', cierre: 'Frase de cierre',
    anclas_rayosx: 'Puntos de conexión en la infografía (x, y de 0 a 1)', stage_titulo: 'Título del stage', stage_nota: 'Texto del stage', callouts: 'Callouts (x, y = punto sobre la figura, de 0 a 1)',
    nota: 'Nota', detalles: 'Vistas de detalle', features: 'Features', relacion: 'Relación de componentes', credenciales: 'Credenciales', sistema: 'Material system',
    uso: 'Uso profesional', aplicaciones: 'Aplicaciones', aplicaciones_nota: 'Nota de aplicaciones', medidas: 'Medidas del paciente', tabla: 'Tabla de tallas', tabla_nota: 'Nota de la tabla',
    medir: 'Cómo medir', cintas: 'Insignias de las cintas (y, x de 0 a 1)', pasos: 'Pasos de colocación', fitcheck: 'Fit check', precauciones: 'Precauciones',
    cuidados: 'Íconos de cuidado', metodo: 'Care method', proteccion: 'Material protection', regulatorio: 'Bloque regulatorio', desempeno: 'Desempeño del producto'
  };
  const NUEVO = { cuidados: { icono: 'lavar_mano', texto: '' }, callouts: { titulo: '', texto: '', x: 0.5, y: 0.5 }, aplicaciones: '', fitcheck: '', precauciones: '' };

  const st = { n: null, cat: null, imgs: {}, ed: [], sel: 0, zoom: 0.9, wire: false, timer: null };

  function toast(m, ms) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, ms || 3000); }
  async function api(method, url, body, raw) {
    const r = await fetch(url, { method: method, body: raw ? body : body ? JSON.stringify(body) : undefined, headers: raw ? { 'Content-Type': 'application/octet-stream' } : { 'Content-Type': 'application/json' } });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Error');
    return j;
  }
  function el(tag, attrs, kids) {
    const e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === 'text') e.textContent = attrs[k]; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  const isPend = function (v) { return typeof v === 'string' && (/\[[^\]]+\]/.test(v) || !v.trim()); };

  // ---------- proyectos ----------
  async function listar(sel) {
    const ps = await api('GET', '/api/proyectos');
    const s = $('#proyectos');
    s.innerHTML = '<option value="">— Proyectos —</option>' + ps.map(function (p) {
      const t = p.producto ? p.producto.nombre + ' · ' + (p.producto.ref || '') : p.nombre;
      return '<option value="' + p.nombre + '">' + t.replace(/</g, '&lt;') + ' (' + p.tipo + ')</option>';
    }).join('');
    if (sel) { s.value = sel; abrir(sel); }
  }
  async function abrir(n) {
    if (!n) return;
    const d = await api('GET', '/api/p/' + encodeURIComponent(n));
    st.n = n; st.cat = d.catalogo; st.imgs = d.imagenes; st.ed = d.edicion; st.sel = 0;
    $('#empty').hidden = true; $('#work').hidden = false;
    thumbs(); pagina(0);
  }

  // ---------- miniaturas y vista ----------
  function src(id) { return '/render/' + encodeURIComponent(st.n) + '/' + encodeURIComponent(id) + '?edit=1' + (st.wire ? '&wire=1' : '') + '&t=' + Date.now(); }
  function thumbs() {
    const box = $('#thumbs'); box.innerHTML = '';
    st.cat.paginas.forEach(function (p, i) {
      const sz = st.ed[i].size, k = 158 / sz[0];
      const fr = el('iframe', { src: src(p.id), width: sz[0], height: sz[1], tabindex: '-1', title: p.titulo || p.id });
      fr.style.transform = 'scale(' + k + ')';
      const wrap = el('div', { class: 'tf' }, [fr]); wrap.style.height = Math.round(sz[1] * k) + 'px';
      const np = pendCount(i);
      box.appendChild(el('button', { class: 'thumb' + (i === st.sel ? ' on' : ''), onclick: function () { pagina(i); } }, [wrap, el('span', {}, [(p.titulo || p.id) + ' ', np ? el('em', { text: '· ' + np }) : null])]));
    });
  }
  function pagina(i) {
    st.sel = i;
    document.querySelectorAll('.thumb').forEach(function (t, j) { t.classList.toggle('on', j === i); });
    const p = st.cat.paginas[i];
    $('#page-title').textContent = p.titulo || p.id;
    vista(); form(); fotos(); pendientes();
  }
  function vista() {
    const p = st.cat.paginas[st.sel], sz = st.ed[st.sel].size, fr = $('#view');
    fr.width = sz[0]; fr.height = sz[1];
    fr.style.transform = 'scale(' + st.zoom + ')';
    fr.parentNode.style.height = '';
    fr.style.marginBottom = (sz[1] * (st.zoom - 1)) + 'px';
    fr.style.marginRight = (sz[0] * (st.zoom - 1)) + 'px';
    fr.src = src(p.id);
    $('#z-val').textContent = Math.round(st.zoom * 100) + '%';
  }
  function refrescar() {
    vista();
    const t = document.querySelectorAll('.thumb iframe')[st.sel];
    if (t) t.src = src(st.cat.paginas[st.sel].id);
    const lbl = document.querySelectorAll('.thumb span')[st.sel], np = pendCount(st.sel);
    if (lbl) { lbl.innerHTML = ''; lbl.append((st.cat.paginas[st.sel].titulo || '') + ' '); if (np) lbl.append(el('em', { text: '· ' + np })); }
  }
  function guardar() {
    clearTimeout(st.timer);
    st.timer = setTimeout(async function () {
      try { const r = await api('PUT', '/api/p/' + encodeURIComponent(st.n), st.cat); st.ed = r.edicion; refrescar(); pendientes(); }
      catch (e) { toast('No se pudo guardar: ' + e.message); }
    }, 350);
  }

  // ---------- editor de contenido (genérico y recursivo) ----------
  function editor(v, set, key, def) {
    if (Array.isArray(v) || (v == null && Array.isArray(def))) {
      const arr = Array.isArray(v) ? v : JSON.parse(JSON.stringify(def));
      const sample = arr[0] != null ? arr[0] : (def && def[0] != null ? def[0] : NUEVO[key]);
      if (typeof sample === 'string' || sample == null && typeof NUEVO[key] === 'string') {
        const ta = el('textarea', { rows: Math.max(2, arr.length + 1) });
        ta.value = arr.join('\n');
        ta.addEventListener('input', function () { set(ta.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean)); });
        return el('label', { class: 'f' + (arr.some(isPend) || !arr.length ? ' pend' : '') }, [el('span', { text: 'Una línea por elemento' }), ta]);
      }
      if (Array.isArray(sample)) { // filas de números o textos
        const box = el('div', { class: 'tbl' });
        const tb = el('table');
        arr.forEach(function (row, r) {
          tb.appendChild(el('tr', {}, row.map(function (c, j) {
            const inp = el('input', { value: c == null ? '' : c });
            inp.addEventListener('input', function () { const val = typeof c === 'number' ? +inp.value : inp.value; arr[r][j] = val; set(arr); });
            return el('td', {}, [inp]);
          })));
        });
        box.appendChild(tb);
        return box;
      }
      const box = el('div');
      arr.forEach(function (it, i) {
        const item = el('div', { class: 'item' });
        Object.keys(Object.assign({}, sample, it)).forEach(function (k) {
          item.appendChild(campo(k, it[k], function (nv) { it[k] = nv; set(arr); }, sample ? sample[k] : null, k));
        });
        item.appendChild(el('button', { class: 'x', text: 'Quitar', onclick: function () { arr.splice(i, 1); set(arr); form(); } }));
        box.appendChild(item);
      });
      box.appendChild(el('button', { class: 'btn ghost small', text: '+ Agregar', onclick: function () {
        const n = JSON.parse(JSON.stringify(sample || NUEVO[key] || {}));
        Object.keys(n).forEach(function (k) { if (typeof n[k] === 'string' && k !== 'icono' && k !== 'tipo') n[k] = ''; });
        arr.push(n); set(arr); form();
      } }));
      return box;
    }
    if (v && typeof v === 'object' && v.columnas) { // tabla de tallas
      const box = el('div', { class: 'tbl' }), tb = el('table');
      const fila = function (row, setCell) { return el('tr', {}, row.map(function (c, j) { const inp = el('input', { value: c }); inp.addEventListener('input', function () { setCell(j, inp.value); }); return el('td', {}, [inp]); })); };
      tb.appendChild(fila(v.columnas, function (j, x) { v.columnas[j] = x; set(v); }));
      v.filas.forEach(function (r) { tb.appendChild(fila(r, function (j, x) { r[j] = x; set(v); })); });
      box.appendChild(tb);
      box.appendChild(el('p', { class: 'hint', text: 'Celdas «pulgadas / cm» separadas por «/».' }));
      return box;
    }
    return null;
  }
  function campo(k, v, set, def, key) {
    const lab = LABEL[k] || (/_label$/.test(k) ? 'Rótulo · ' + k.replace(/_label$/, '').replace(/_/g, ' ') : k.replace(/_/g, ' '));
    const ed = editor(v, set, key || k, def);
    if (ed) return el('div', { class: 'grp' }, [el('header', {}, [el('span', { text: lab })]), ed]);
    if (k === 'icono') {
      const s = el('select', {}, ICONOS.map(function (i) { const o = el('option', { value: i, text: i.replace(/_/g, ' ') }); if (i === v) o.selected = true; return o; }));
      s.addEventListener('change', function () { set(s.value); });
      return el('label', { class: 'f' }, [el('span', { text: 'Ícono' }), s]);
    }
    if (k === 'tipo') {
      const s = el('select', {}, TIPOS.map(function (i) { const o = el('option', { value: i, text: i }); if (i === v) o.selected = true; return o; }));
      s.addEventListener('change', function () { set(s.value); });
      return el('label', { class: 'f' }, [el('span', { text: 'Estilo' }), s]);
    }
    const val = v == null ? '' : String(v);
    const num = typeof (v == null ? def : v) === 'number';
    const inp = num ? el('input', { type: 'number', step: '0.01', value: val }) : (val.length > 60 || /texto|overview|descripcion|uso|nota|entradilla/.test(k) ? el('textarea', { rows: Math.min(8, Math.ceil(val.length / 48) + 1) }) : el('input', { value: val }));
    if (inp.tagName === 'TEXTAREA') inp.value = val;
    inp.addEventListener('input', function () { set(num ? +inp.value : inp.value); });
    const pend = !num && isPend(val || (def == null ? '' : String(def)));
    return el('label', { class: 'f' + (pend ? ' pend' : '') }, [el('span', {}, [lab, pend ? el('i', { class: 'flag', text: 'pendiente' }) : null]), inp]);
  }
  function form() {
    const p = st.cat.paginas[st.sel], box = $('#t-datos');
    box.innerHTML = '';
    p.datos = p.datos || {};
    const campos = st.ed[st.sel].campos;
    Object.keys(campos).forEach(function (k) {
      const c = campos[k];
      const cur = p.datos[k];
      const def = c.tipo === 'json' ? c.def : (c.def || '');
      // los rótulos fijos de la plantilla se muestran con su valor por defecto (es lo que se imprime)
      const shown = cur == null ? (c.tipo === 'json' ? null : (/\[/.test(def) ? '' : def)) : cur;
      box.appendChild(campo(k, shown, function (nv) { p.datos[k] = nv; guardar(); }, def, k));
    });
  }

  // ---------- imágenes ----------
  function fotos() {
    const p = st.cat.paginas[st.sel], box = $('#t-fotos');
    box.innerHTML = '';
    const opts = function (cur) { return [el('option', { value: '', text: '— sin imagen —' })].concat(Object.keys(st.imgs).sort().map(function (f) { const o = el('option', { value: f, text: f }); if (f === cur) o.selected = true; return o; })); };
    // Logo del proyecto
    st.cat.marca = st.cat.marca || {};
    const lg = el('select', {}, opts(st.cat.marca.logo_ficha));
    lg.addEventListener('change', function () { st.cat.marca.logo_ficha = lg.value || undefined; guardar(); });
    box.appendChild(el('div', { class: 'slot' }, [el('b', { text: 'Logo MED (versión clara para el encabezado)' }), el('div', { class: 'row' }, [lg, upload(function (f) { st.cat.marca.logo_ficha = f; guardar(); fotos(); })])]));
    const slots = st.ed[st.sel].fotos;
    Object.keys(slots).forEach(function (s) {
      const cur = (p.fotos || {})[s] || '';
      const meta = st.imgs[cur];
      const sel = el('select', {}, opts(cur));
      sel.addEventListener('change', function () { p.fotos = p.fotos || {}; if (sel.value) p.fotos[s] = sel.value; else delete p.fotos[s]; guardar(); fotos(); });
      const enc = (p.encuadre || {})[s] || {};
      const crop = enc.crop || {};
      const num = function (lab, get, put) {
        const i = el('input', { type: 'number', step: '0.01', min: '0', max: '3', value: get() == null ? '' : get() });
        i.addEventListener('input', function () { p.encuadre = p.encuadre || {}; p.encuadre[s] = p.encuadre[s] || {}; put(p.encuadre[s], i.value === '' ? null : +i.value); guardar(); });
        return el('label', { class: 'f' }, [el('span', { text: lab }), i]);
      };
      const lowres = meta && meta.w && meta.w < 1200;
      box.appendChild(el('div', { class: 'slot' }, [
        el('b', { text: slots[s].label || s }),
        el('div', { class: 'meta' + (lowres ? ' bad' : '') }, [meta ? meta.w + ' × ' + meta.h + ' px' + (lowres ? ' · baja resolución para imprenta' : '') : 'Vacío: se muestra un marco de reemplazo']),
        el('div', { class: 'row' }, [sel, upload(function (f) { p.fotos = p.fotos || {}; p.fotos[s] = f; guardar(); fotos(); })]),
        el('div', { class: 'row' }, [
          num('Recorte x', function () { return crop.x; }, function (e, v) { e.crop = e.crop || { x: 0, y: 0, w: 1, h: 1 }; e.crop.x = v; }),
          num('y', function () { return crop.y; }, function (e, v) { e.crop = e.crop || { x: 0, y: 0, w: 1, h: 1 }; e.crop.y = v; }),
          num('ancho', function () { return crop.w; }, function (e, v) { e.crop = e.crop || { x: 0, y: 0, w: 1, h: 1 }; e.crop.w = v; }),
          num('alto', function () { return crop.h; }, function (e, v) { e.crop = e.crop || { x: 0, y: 0, w: 1, h: 1 }; e.crop.h = v; }),
          num('zoom', function () { return enc.z; }, function (e, v) { e.z = v; })
        ])
      ]));
    });
  }
  function upload(done) {
    const inp = el('input', { type: 'file', accept: '.jpg,.jpeg,.png,.webp,.svg', hidden: 'hidden' });
    inp.addEventListener('change', async function () {
      const f = inp.files[0]; if (!f) return;
      try {
        const r = await api('POST', '/api/p/' + encodeURIComponent(st.n) + '/imagen?archivo=' + encodeURIComponent(f.name), await f.arrayBuffer(), true);
        st.imgs = r.imagenes; done(r.archivo); toast('Imagen cargada: ' + r.archivo);
      } catch (e) { toast(e.message); }
    });
    return el('label', { class: 'btn ghost small' }, ['Cargar…', inp]);
  }

  // ---------- pendientes ----------
  function pendCount(i) {
    const p = st.cat.paginas[i];
    let n = 0;
    const walk = function (v) { if (typeof v === 'string') { if (/\[[^\]]+\]/.test(v)) n++; } else if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { walk(v[k]); }); };
    walk(p.datos);
    Object.keys(st.ed[i].fotos).forEach(function (s) { if (!(p.fotos || {})[s]) n++; });
    Object.keys(st.ed[i].campos).forEach(function (k) { if (p.datos[k] == null && /\[/.test(JSON.stringify(st.ed[i].campos[k].def))) n++; });
    return n;
  }
  function pendientes() {
    const box = $('#t-pend'); box.innerHTML = '';
    let total = 0;
    st.cat.paginas.forEach(function (p, i) { total += pendCount(i); });
    $('#pend-n').textContent = total || '';
    const gen = st.cat.pendientes || [];
    if (gen.length) {
      box.appendChild(el('h4', { text: 'De la lectura del PDF guía' }));
      box.appendChild(el('ul', { class: 'pl' }, gen.map(function (t, j) {
        return el('li', {}, [t + ' ', el('button', { class: 'btn ghost small', text: 'Resuelto', onclick: function () { gen.splice(j, 1); guardar(); pendientes(); } })]);
      })));
    }
    box.appendChild(el('h4', { text: 'En esta página' }));
    const p = st.cat.paginas[st.sel], items = [];
    const walk = function (v, path) { if (typeof v === 'string') { const m = v.match(/\[[^\]]+\]/g); if (m) items.push((LABEL[path] || path) + ': ' + m.join(' ')); } else if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { walk(v[k], path || k); }); };
    walk(p.datos, '');
    Object.keys(st.ed[st.sel].campos).forEach(function (k) { if (p.datos[k] == null && /\[/.test(JSON.stringify(st.ed[st.sel].campos[k].def))) items.push((LABEL[k] || k) + ': sin dato'); });
    Object.keys(st.ed[st.sel].fotos).forEach(function (s) { if (!(p.fotos || {})[s]) items.push('Imagen: ' + (st.ed[st.sel].fotos[s].label || s)); });
    box.appendChild(items.length ? el('ul', { class: 'pl' }, items.map(function (t) { return el('li', { text: t }); })) : el('p', { class: 'hint', text: 'Sin pendientes en esta página.' }));
  }

  // ---------- exportar ----------
  async function exportar(tipo) {
    const out = $('#x-out');
    out.textContent = 'Exportando… (Chromium local, sin red)';
    try {
      const r = await api('POST', '/api/p/' + encodeURIComponent(st.n) + '/exportar?tipo=' + tipo);
      out.innerHTML = '';
      out.appendChild(el('p', { text: 'Listo. Carpeta: ' + r.carpeta }));
      r.archivos.forEach(function (f) {
        const rel = f.replace(/^exports\//, '');
        out.appendChild(el('div', {}, [el('a', { href: '/exports/' + encodeURIComponent(st.n) + '/' + rel.split('/').map(encodeURIComponent).join('/'), target: '_blank', text: rel.split('/').pop() })]));
      });
      const fuera = r.revision.reduce(function (a, p) { return a + p.fuera.length; }, 0);
      out.appendChild(el('p', { class: 'hint', text: (fuera ? fuera + ' elemento(s) fuera de página · ' : 'Nada fuera de página · ') + 'Conexiones bloqueadas: ' + r.red_bloqueada }));
    } catch (e) { out.textContent = 'Error: ' + e.message; }
  }

  // ---------- eventos ----------
  $('#proyectos').addEventListener('change', function (e) { abrir(e.target.value); });
  $('#guia').addEventListener('change', async function (e) {
    const f = e.target.files[0]; if (!f) return;
    toast('Leyendo el PDF guía en este equipo…', 8000);
    try {
      const r = await api('POST', '/api/importar?nombre=' + encodeURIComponent(f.name.replace(/\.pdf$/i, '')), await f.arrayBuffer(), true);
      toast('Ficha creada.'); listar(r.nombre);
    } catch (err) { toast('Error: ' + err.message, 6000); }
    e.target.value = '';
  });
  document.querySelectorAll('.tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.tabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('on', t.id === 't-' + b.dataset.tab); });
    });
  });
  $('#z-in').onclick = function () { st.zoom = Math.min(2, st.zoom + 0.1); vista(); };
  $('#z-out').onclick = function () { st.zoom = Math.max(0.3, st.zoom - 0.1); vista(); };
  $('#wire').onchange = function (e) { st.wire = e.target.checked; vista(); thumbs(); };
  $('#undo').onclick = async function () { try { const r = await api('POST', '/api/p/' + encodeURIComponent(st.n) + '/deshacer'); if (r.catalogo) { st.cat = r.catalogo; abrir(st.n); toast('Cambio deshecho.'); } } catch (e) { toast(e.message); } };
  $('#x-pdf').onclick = function () { exportar('pdf'); };
  $('#x-png').onclick = function () { exportar('png'); };
  listar();
})();
