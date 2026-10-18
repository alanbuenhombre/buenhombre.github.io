/* MED Fichas · Ingesta y extracción determinística.
   Reglas fijas, sin IA: lo que se reconoce con seguridad queda listo; lo que es una
   suposición queda en `revisar`; lo que no se sabe dónde va queda en `sin_asignar`.
   Nunca se inventa contenido. */
(function () {
  'use strict';
  const Sch = window.MedSchema;

  function readAs(file, how) {
    return new Promise(function (res, rej) {
      const r = new FileReader();
      r.onload = function () { res(r.result); };
      r.onerror = rej;
      r[how](file);
    });
  }

  // ---------- imágenes ----------
  async function loadImage(file) {
    const src = await readAs(file, 'readAsDataURL');
    const isSvg = /svg/.test(file.type) || /\.svg$/i.test(file.name);
    let w = 0, h = 0;
    if (isSvg) {
      const txt = await readAs(file, 'readAsText');
      const vb = txt.match(/viewBox\s*=\s*"([^"]+)"/);
      if (vb) { const p = vb[1].split(/[\s,]+/).map(Number); w = p[2]; h = p[3]; }
      else { w = parseFloat((txt.match(/\bwidth="([\d.]+)/) || [])[1]) || 100; h = parseFloat((txt.match(/\bheight="([\d.]+)/) || [])[1]) || 100; }
    } else {
      const dim = await new Promise(function (res) {
        const im = new Image();
        im.onload = function () { res([im.naturalWidth, im.naturalHeight]); };
        im.onerror = function () { res([0, 0]); };
        im.src = src;
      });
      w = dim[0]; h = dim[1];
    }
    return { nombre: file.name, tipo: isSvg ? 'image/svg+xml' : file.type, src: src, ancho: w, alto: h };
  }

  // Asignación por nombre de archivo (es una suposición → queda marcada para revisar)
  const SLOT_RULES = [
    { re: /frente|front|frontal/i, slot: 'figura-frente' },
    { re: /espalda|back|posterior/i, slot: 'figura-espalda' },
    { re: /lateral|lado|side|perfil/i, slot: 'figura-lado' },
    { re: /rayos|x-?ray|radiograf/i, slot: 'rayos' },
    { re: /medir|measure|how/i, slot: 'como-medir' },
    { re: /talla|size|medida/i, slot: 'figura-tallas' },
    { re: /textura|texture|tejido|fabric|tela|material/i, slot: 'textura' }
  ];
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }

  function assignImages(d, ids) {
    const views = { 'figura-frente': 'Frente', 'figura-espalda': 'Espalda', 'figura-lado': 'Lateral' };
    const textures = [];
    ids.forEach(function (id) {
      const rule = SLOT_RULES.find(function (r) { return r.re.test(id); });
      if (!rule) return;
      if (views[rule.slot]) {
        if (!d.cobertura.figuras.some(function (f) { return f.imagen === id; })) {
          d.cobertura.figuras.push({ imagen: id, vista: views[rule.slot] });
          Sch.flag(d, 'cobertura.figuras');
        }
      } else if (rule.slot === 'rayos' && !d.materiales.rayos_x) { d.materiales.rayos_x = id; Sch.flag(d, 'materiales.rayos_x'); }
      else if (rule.slot === 'como-medir' && !d.tallas.como_medir.ilustracion) { d.tallas.como_medir.ilustracion = id; Sch.flag(d, 'tallas.como_medir.ilustracion'); }
      else if (rule.slot === 'figura-tallas' && !d.tallas.figura) { d.tallas.figura = id; Sch.flag(d, 'tallas.figura'); }
      else if (rule.slot === 'textura') textures.push(id);
    });
    const order = ['Frente', 'Espalda', 'Lateral'];
    d.cobertura.figuras.sort(function (a, b) { return order.indexOf(a.vista) - order.indexOf(b.vista); });
    // Texturas: primero por coincidencia con el nombre del material, luego en orden
    const free = textures.slice();
    d.materiales.lista.forEach(function (m, i) {
      if (m.textura) return;
      const key = norm(m.nombre).split(' ')[0];
      const hit = free.find(function (t) { return key && norm(t).indexOf(key) >= 0; });
      if (hit) { m.textura = hit; free.splice(free.indexOf(hit), 1); Sch.flag(d, 'materiales.lista.' + i + '.textura'); }
    });
    d.materiales.lista.forEach(function (m, i) {
      if (!m.textura && free.length) { m.textura = free.shift(); Sch.flag(d, 'materiales.lista.' + i + '.textura'); }
    });
  }

  // ---------- tabla de tallas (CSV / TSV) ----------
  function parseCsv(txt) {
    const lines = txt.replace(/\r/g, '').split('\n').filter(function (l) { return l.trim(); });
    if (!lines.length) return null;
    const sep = [';', '\t', ','].sort(function (a, b) { return lines[0].split(b).length - lines[0].split(a).length; })[0];
    const rows = lines.map(function (l) { return l.split(sep).map(function (c) { return c.trim().replace(/^"|"$/g, ''); }); });
    const head = rows[0];
    return {
      tallas: head.slice(1),
      medidas: rows.slice(1).map(function (r) { return { nombre: r[0], valores: r.slice(1, head.length) }; }),
      unidad: (head[0].match(/\((cm|in|mm)\)/i) || [])[1] || ''
    };
  }

  // ---------- ficha del proveedor (PDF) ----------
  async function pdfLines(file) {
    const pdfjs = window.pdfjsLib;
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false, disableFontFace: true }).promise;
    const out = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      await page.getOperatorList();
      const tc = await page.getTextContent();
      let cur = null;
      tc.items.forEach(function (it) {
        if (!('str' in it) || !it.str.trim()) { if (it.hasEOL && cur) cur.eol = true; return; }
        const size = Math.round(Math.hypot(it.transform[2], it.transform[3]) * 10) / 10;
        const y = it.transform[5], x = it.transform[4];
        let bold = false;
        try { const f = page.commonObjs.get(it.fontName); bold = /bold|black|heavy|semibold/i.test((f && f.name) || ''); } catch (e) { bold = false; }
        if (!cur || cur.eol || Math.abs(cur.y - y) > size * 0.45) {
          cur = { y: y, x: x, size: size, bold: bold, text: '', page: p, cells: [] };
          out.push(cur);
        } else if (x - cur.x1 > size * 1.5) cur.text += '\t'; // salto de columna (tablas)
        else if (x - cur.x1 > size * 0.15 && !/\s$/.test(cur.text)) cur.text += ' ';
        cur.text += it.str;
        cur.x1 = x + (it.width || 0);
        cur.size = Math.max(cur.size, size);
        cur.bold = cur.bold && bold || (cur.text.length === it.str.length && bold);
        if (it.hasEOL) cur.eol = true;
      });
    }
    out.forEach(function (l) { l.text = l.text.replace(/ +/g, ' ').trim(); });
    return out.filter(function (l) { return l.text; });
  }

  const SECTIONS = [
    { key: 'descripcion', re: /^(descripci[oó]n|description|acerca del producto|about)/i },
    { key: 'caracteristicas', re: /^(caracter[ií]sticas|features|beneficios|benefits|zonas|detalles)/i },
    { key: 'composicion', re: /^(composici[oó]n|materiales?|materials?|fabric|tejidos?)/i },
    { key: 'tallas', re: /^(tabla de tallas|gu[ií]a de tallas|tallas|size chart|sizes?)/i },
    { key: 'cuidados', re: /^(cuidados?|care|lavado|instrucciones de lavado)/i }
  ];
  const SIZE_TOKEN = /^(XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|\d{1,3})$/i;

  function parseComposition(line) {
    // "Tejido principal FLEXWEAVE™: 72% Poliamida, 28% Elastano"  |  "72% Poliamida 28% Elastano"
    const parts = [];
    const re = /(\d{1,3}(?:[.,]\d+)?)\s*%\s*([A-Za-zÁÉÍÓÚÑÜáéíóúñü][\wÁÉÍÓÚÑÜáéíóúñü \-]*?)(?=\s*(?:,|;|\/|\d|$|\.))/g;
    let m;
    while ((m = re.exec(line))) parts.push({ fibra: m[2].trim(), pct: parseFloat(m[1].replace(',', '.')) });
    if (!parts.length) return null;
    const head = line.split(/[:\-–]\s*\d/)[0].replace(/\d.*$/, '').trim();
    const name = head.replace(/^(tejido|material|tela)\s+(principal\s+)?/i, '').trim();
    return { nombre: name, principal: /principal|main/i.test(head), composicion: parts };
  }

  function fromPdf(lines, d, report) {
    if (!lines.length) { report.push('El PDF no tiene texto seleccionable (¿escaneado?). Completa los datos a mano.'); return; }
    const first = lines.filter(function (l) { return l.page === 1; });
    // Nombre: el texto más grande de la primera página
    const big = first.slice().sort(function (a, b) { return b.size - a.size; })[0];
    if (big) { d.producto.nombre = big.text; Sch.flag(d, 'producto.nombre'); }
    // Referencia: patrón explícito → seguro
    const all = lines.map(function (l) { return l.text; }).join('\n');
    const ref = all.match(/\bref(?:erencia)?\.?\s*(?:n[°ºo]\.?\s*)?[:#]?\s*([A-Z0-9][A-Z0-9\-./]{1,20})/i);
    if (ref) d.producto.referencia = ref[1].replace(/[.\/]$/, ''); else Sch.flag(d, 'producto.referencia');

    // Secciones por títulos
    const body = Math.round(lines.map(function (l) { return l.size; }).sort(function (a, b) { return a - b; })[Math.floor(lines.length / 2)] * 10) / 10;
    let sec = null;
    const buckets = {};
    const pre = [];
    lines.forEach(function (l) {
      const isHead = (l.bold || l.size > body * 1.05 || (l.text === l.text.toUpperCase() && /[A-ZÁÉÍÓÚ]/.test(l.text))) && l.text.length < 60;
      const hit = isHead && SECTIONS.find(function (s) { return s.re.test(l.text.trim()); });
      if (hit) { sec = hit.key; buckets[sec] = buckets[sec] || { title: l.text, lines: [] }; return; }
      if (isHead && l.text.length < 40 && sec && !/^[•·\-–]/.test(l.text)) { sec = 'otro:' + l.text; buckets[sec] = { title: l.text, lines: [] }; return; }
      if (sec) buckets[sec].lines.push(l); else pre.push(l);
    });
    // Categoría: línea corta tras el nombre/ref, antes de las secciones
    const cat = pre.find(function (l) { return l !== big && !/\bref/i.test(l.text) && l.size <= body * 1.2 && l.text.length < 80 && l.y < big.y && l.page === 1 && l.text.indexOf('·') < 0; });
    if (cat) { d.producto.categoria = cat.text; Sch.flag(d, 'producto.categoria'); } else Sch.flag(d, 'producto.categoria');
    Sch.flag(d, 'producto.bajada');

    const joinPara = function (ls) {
      return ls.map(function (l) { return l.text; }).reduce(function (a, t) {
        if (!a) return t;
        return /[a-záéíóúñ]-$/i.test(a) ? a.slice(0, -1) + t : a + ' ' + t;
      }, '');
    };
    if (buckets.descripcion) { d.producto.descripcion = joinPara(buckets.descripcion.lines); Sch.flag(d, 'producto.descripcion'); }
    else Sch.flag(d, 'producto.descripcion');

    // Características "• Nombre: texto" → zonas de cobertura (posición en la figura: a definir)
    if (buckets.caracteristicas) {
      const items = [];
      buckets.caracteristicas.lines.forEach(function (l) {
        const t = l.text.replace(/^[•·▪\-–*]\s*/, '');
        if (/^[•·▪\-–*]/.test(l.text) || !items.length) items.push(t); else items[items.length - 1] += ' ' + t;
      });
      d.cobertura.zonas = items.map(function (t, i) {
        const m = t.match(/^([^:]{2,60}):\s*(.+)$/);
        return { nombre: m ? m[1].trim() : t, texto: m ? m[2].trim() : '', figura: 0, x: 0.5, y: 0.2 + i * 0.12 };
      });
      Sch.flag(d, 'cobertura.zonas');
    } else Sch.flag(d, 'cobertura.zonas');

    // Composición
    if (buckets.composicion) {
      const mats = buckets.composicion.lines.map(function (l) { return parseComposition(l.text); }).filter(Boolean);
      if (mats.length) {
        if (!mats.some(function (m) { return m.principal; })) mats[0].principal = true;
        d.materiales.lista = mats.map(function (m) { return { nombre: m.nombre, principal: m.principal, composicion: m.composicion, descripcion: '', propiedades: [], textura: '' }; });
        d.materiales.lista.forEach(function (m, i) {
          const sum = m.composicion.reduce(function (a, c) { return a + c.pct; }, 0);
          if (Math.round(sum) !== 100 || !m.nombre) Sch.flag(d, 'materiales.lista.' + i);
          Sch.flag(d, 'materiales.lista.' + i + '.descripcion');
        });
      } else Sch.flag(d, 'materiales.lista');
    } else Sch.flag(d, 'materiales.lista');

    // Tabla de tallas
    if (buckets.tallas) {
      const rows = buckets.tallas.lines.map(function (l) { return l.text.split(/\t| {2,}/).map(function (c) { return c.trim(); }).filter(Boolean); });
      // Si no hubo tabulaciones, separar por espacios desde el final
      const tok = function (r) { return r.length > 1 ? r : r[0].split(' '); };
      let head = null; const meds = [];
      rows.map(tok).forEach(function (r) {
        const sizes = r.filter(function (c) { return SIZE_TOKEN.test(c); });
        if (!head && sizes.length >= 2 && sizes.length >= r.length - 1) { head = sizes; return; }
        if (!head) return;
        let k = r.length;
        while (k > 0 && /^\d+([.,]\d+)?([-–]\d+([.,]\d+)?)?$/.test(r[k - 1])) k--;
        const vals = r.slice(k);
        if (vals.length) meds.push({ nombre: r.slice(0, k).join(' '), valores: vals });
      });
      if (head) {
        d.tallas.tallas = head;
        d.tallas.medidas = meds;
        const u = buckets.tallas.title.match(/\((cm|in|mm)\)/i);
        if (u) d.tallas.unidad = u[1];
        if (meds.some(function (m) { return m.valores.length !== head.length; }) || !meds.length) Sch.flag(d, 'tallas.medidas');
        Sch.flag(d, 'tallas.medidas.cintas');
      } else Sch.flag(d, 'tallas');
    } else Sch.flag(d, 'tallas');

    // Todo lo demás se conserva para que Alan decida dónde va
    Object.keys(buckets).forEach(function (k) {
      if (['descripcion', 'caracteristicas', 'composicion', 'tallas'].indexOf(k) >= 0) return;
      d.sin_asignar = d.sin_asignar || [];
      d.sin_asignar.push({ titulo: buckets[k].title, texto: joinPara(buckets[k].lines) });
    });
    report.push('Ficha leída: ' + lines.length + ' líneas, ' + Object.keys(buckets).length + ' secciones reconocidas.');
  }

  // ---------- entrada principal ----------
  // files: FileList/Array. base: producto existente (o null para empezar de cero)
  async function ingest(files, base) {
    const d = base ? Sch.clone(base) : Sch.empty();
    const report = [];
    const list = Array.from(files);
    const jsons = list.filter(function (f) { return /\.json$/i.test(f.name); });
    if (jsons.length) {
      const j = Sch.normalize(JSON.parse(await readAs(jsons[0], 'readAsText')));
      Object.keys(j).forEach(function (k) { d[k] = j[k]; });
      report.push('Producto cargado desde ' + jsons[0].name + '.');
    }
    for (const f of list.filter(function (f) { return /\.pdf$/i.test(f.name); })) {
      fromPdf(await pdfLines(f), d, report);
      d.fuente = f.name;
    }
    for (const f of list.filter(function (f) { return /\.(csv|tsv|txt)$/i.test(f.name); })) {
      const t = parseCsv(await readAs(f, 'readAsText'));
      if (t && t.tallas.length) {
        const old = d.tallas.medidas;
        d.tallas.tallas = t.tallas;
        d.tallas.medidas = t.medidas.map(function (m, i) { return Object.assign({}, m, { cinta: old[i] && old[i].cinta }); });
        if (t.unidad) d.tallas.unidad = t.unidad;
        Sch.unflag(d, 'tallas.medidas'); Sch.unflag(d, 'tallas');
        Sch.flag(d, 'tallas.medidas.cintas');
        report.push('Tabla de tallas: ' + t.tallas.length + ' tallas × ' + t.medidas.length + ' medidas desde ' + f.name + '.');
      }
    }
    const imgs = list.filter(function (f) { return /^image\//.test(f.type) || /\.(svg|png|jpe?g|webp)$/i.test(f.name); });
    const ids = [];
    for (const f of imgs) { d.imagenes[f.name] = await loadImage(f); ids.push(f.name); }
    if (ids.length) { assignImages(d, ids); report.push(ids.length + ' imagen(es) cargadas.'); }
    // Las medidas sin cinta necesitan posición en la figura
    d.tallas.medidas.forEach(function (m, i) {
      if (!m.cinta) { m.cinta = { y: 0.4 + i * 0.1, x1: 0.15, x2: 0.85 }; Sch.flag(d, 'tallas.medidas.cintas'); }
    });
    return { data: Sch.normalize(d), report: report };
  }

  window.MedExtract = { ingest: ingest, loadImage: loadImage, parseCsv: parseCsv, parseComposition: parseComposition };
})();
