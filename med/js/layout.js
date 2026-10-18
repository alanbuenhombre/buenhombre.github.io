/* Med · Motor de diagramación.
   Recibe el documento estructurado y lo reparte en páginas del formato elegido:
   portada, aperturas de capítulo, columnas, partición de párrafos/listas/tablas
   con control de viudas y huérfanas, títulos que nunca quedan solos al pie, folios. */
(function () {
  'use strict';

  const T = window.MedTemplates;
  const X = window.MedExtract;

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function tx(tag, cls, role, html, src) {
    const e = el(tag, cls + ' tx', html);
    e.dataset.role = role;
    if (src) e.dataset.src = '1';
    return e;
  }

  // ----- cortes de texto enriquecido por posición de carácter -----
  function locate(root, idx) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n, acc = 0, last = null;
    while ((n = w.nextNode())) {
      if (acc + n.length >= idx) return [n, idx - acc];
      acc += n.length; last = n;
    }
    return last ? [last, last.length] : [root, 0];
  }
  function sliceHtml(html, a, b) {
    const d = document.createElement('div');
    d.innerHTML = html;
    const len = d.textContent.length;
    const r = document.createRange();
    if (a <= 0) r.setStart(d, 0); else r.setStart.apply(r, locate(d, a));
    if (b >= len) r.setEnd(d, d.childNodes.length); else r.setEnd.apply(r, locate(d, b));
    const o = document.createElement('div');
    o.appendChild(r.cloneContents());
    return o.innerHTML.replace(/^(\s|<br>)+|(\s|<br>)+$/g, '').replace(/<(strong|em|sup|sub)>\s*<\/\1>/g, '');
  }
  function spaces(html) {
    const d = document.createElement('div'); d.innerHTML = html;
    const t = d.textContent, out = [];
    for (let i = 0; i < t.length; i++) if (t[i] === ' ') out.push(i);
    return { text: t, cuts: out };
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  // ======================================================================
  function Layout(container, doc, ctx) {
    this.c = container;
    this.doc = doc;
    this.fmt = ctx.fmt;
    this.tpl = ctx.tpl;
    this.opts = ctx.opts;
    this.cols = ctx.opts.cols && ctx.opts.cols !== 'auto' ? +ctx.opts.cols : ctx.fmt.cols;
    this.pages = [];
    this.chapter = 0;
  }

  Layout.prototype.newPage = function (kind) {
    const pg = el('section', 'page ' + (kind || 'body'));
    pg.dataset.kind = kind || 'body';
    const inner = el('div', 'pg-inner');
    pg.appendChild(inner);
    const st = { el: pg, inner: inner, head: null, cols: [], ci: 0 };
    if (kind !== 'cover') {
      st.head = el('div', 'pg-head');
      const wrap = el('div', 'pg-cols');
      for (let i = 0; i < this.cols; i++) { const c = el('div', 'col'); wrap.appendChild(c); st.cols.push(c); }
      inner.appendChild(st.head);
      inner.appendChild(wrap);
    }
    this.c.appendChild(pg);
    this.pages.push(st);
    this.cur = st;
    return st;
  };
  Layout.prototype.hasContent = function (st) {
    st = st || this.cur;
    return !!st && (st.head.children.length > 0 || st.cols.some(function (c) { return c.children.length > 0; }));
  };
  Layout.prototype.col = function () { return this.cur.cols[this.cur.ci]; };
  Layout.prototype.fits = function (c) { c = c || this.col(); return c.scrollHeight <= c.clientHeight + 1; };
  Layout.prototype.nextCol = function () {
    if (this.cur.ci < this.cur.cols.length - 1) this.cur.ci++;
    else this.newPage('body');
  };

  // ----- portada -----
  Layout.prototype.cover = function (titleB, subB) {
    const st = this.newPage('cover');
    const o = this.opts;
    const top = el('div', 'cv-top');
    top.appendChild(el('div', 'cv-rule bx'));
    if (o.kicker) top.appendChild(tx('div', 'cv-kicker', 'kicker', X.esc(o.kicker)));
    st.inner.appendChild(top);
    if (o.coverImage) {
      const fig = el('div', 'cv-img');
      const im = el('img', 'im');
      im.src = o.coverImage.src;
      fig.appendChild(im);
      st.inner.appendChild(fig);
    } else if (o.placeholders) {
      const ph = el('div', 'cv-img ph bx');
      ph.appendChild(tx('div', 'ph-label', 'caption', 'Imagen de portada'));
      st.inner.appendChild(ph);
    }
    const main = el('div', 'cv-main');
    main.appendChild(tx('h1', 'cv-title', 'title', titleB ? titleB.html : X.esc(this.doc.title), !!titleB));
    if (subB) main.appendChild(tx('p', 'cv-sub', 'sub', subB.html, true));
    st.inner.appendChild(main);
    const meta = [o.author, o.date].filter(Boolean).map(X.esc).join('<br>');
    if (meta) {
      const foot = el('div', 'cv-foot');
      foot.appendChild(el('div', 'cv-line bx'));
      foot.appendChild(tx('div', 'cv-meta', 'folio', meta));
      st.inner.appendChild(foot);
    }
  };

  // ----- render de bloques de flujo -----
  Layout.prototype.render = function (b) {
    switch (b.type) {
      case 'h1': return tx('h2', 'b b-h1f', 'h1', b.html, true);
      case 'h2': { const e = tx('h2', 'b b-h2 bx', 'h2', b.html, true); return e; }
      case 'h3': return tx('h3', 'b b-h3', 'h3', b.html, true);
      case 'lead': return tx('p', 'b b-lead' + (b.cont ? ' cont' : ''), 'lead', b.html, true);
      case 'subtitle': return tx('p', 'b b-lead' + (b.cont ? ' cont' : ''), 'lead', b.html, true);
      case 'quote': {
        const q = el('div', 'b b-quote bx');
        q.appendChild(tx('p', 'q-text' + (b.cont ? ' cont' : ''), 'quote', b.html, true));
        return q;
      }
      case 'caption': return tx('p', 'b b-caption', 'caption', b.html, true);
      case 'ul': case 'ol': {
        const L = el('div', 'b b-list b-' + b.type);
        const start = b.start || 1;
        b.items.forEach(function (h, i) {
          const li = el('div', 'li');
          li.appendChild(tx('span', 'mk', 'body', b.type === 'ol' ? (start + i) + '.' : '•'));
          li.appendChild(tx('div', 'lt', 'body', h, true));
          L.appendChild(li);
        });
        return L;
      }
      case 'table': {
        const t = el('div', 'b b-table');
        const n = Math.max.apply(null, b.rows.map(function (r) { return r.length; }));
        t.style.setProperty('--n', n);
        b.rows.forEach(function (r, i) {
          const head = b.header && i === 0;
          const tr = el('div', 'tr bx' + (head ? ' th' : ''));
          for (let k = 0; k < n; k++) {
            const td = tx('div', 'td', 'table', r[k] || '', !(head && b.repeated));
            tr.appendChild(td);
          }
          t.appendChild(tr);
        });
        return t;
      }
      case 'image': {
        const f = el('figure', 'b b-fig');
        const im = el('img', 'im');
        im.src = b.src;
        im.alt = b.alt || '';
        im.style.aspectRatio = b.w + ' / ' + b.h;
        f.appendChild(im);
        if (b.caption) f.appendChild(tx('figcaption', 'b-caption', 'caption', b.caption.html, true));
        return f;
      }
      default: return tx('p', 'b b-p' + (b.cont ? ' cont' : ''), 'body', b.html, true);
    }
  };

  Layout.prototype.splittable = function (b) {
    return ['p', 'lead', 'subtitle', 'quote', 'ul', 'ol', 'table'].indexOf(b.type) >= 0;
  };

  // Intenta poner una parte del bloque en la columna actual. Devuelve el resto (o null si entró completo,
  // o el mismo bloque si no entró nada).
  Layout.prototype.split = function (b) {
    const col = this.col();
    if (b.type === 'ul' || b.type === 'ol' || b.type === 'table') {
      const arr = b.type === 'table' ? b.rows : b.items;
      const keepHead = b.type === 'table' && b.header ? 1 : 0;
      const node = this.render(b);
      col.appendChild(node);
      let n = arr.length;
      const kids = Array.from(node.children);
      while (n > keepHead + 1 && !this.fits(col)) { n--; kids[n].remove(); }
      if (!this.fits(col) || n <= keepHead) { node.remove(); return b; }
      if (n === arr.length) return null;
      const rest = Object.assign({}, b);
      if (b.type === 'table') {
        rest.rows = (keepHead ? [b.rows[0]] : []).concat(b.rows.slice(n));
        rest.repeated = !!keepHead;
      } else {
        rest.items = b.items.slice(n);
        rest.start = (b.start || 1) + n;
      }
      return rest;
    }
    // Párrafos: búsqueda binaria del último espacio que cabe
    const sp = spaces(b.html);
    if (!sp.cuts.length) return b;
    const node = this.render(b);
    const t = node.classList.contains('tx') ? node : node.querySelector('.tx');
    col.appendChild(node);
    let lo = 0, hi = sp.cuts.length - 1, best = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      t.innerHTML = sliceHtml(b.html, 0, sp.cuts[mid]);
      if (this.fits(col)) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    if (best < 0) { node.remove(); return b; }
    const lh = parseFloat(getComputedStyle(t).lineHeight) || 12;
    const measure = function () { return Math.round(t.offsetHeight / lh); };
    t.innerHTML = sliceHtml(b.html, 0, sp.cuts[best]);
    let lines = measure();
    const perLine = sp.cuts[best] / Math.max(lines, 1);
    const restChars = sp.text.length - sp.cuts[best];
    // Viuda: si al siguiente bloque le quedaría menos de 2 líneas, se baja una línea más
    if (restChars < perLine * 1.6 && lines > 2) {
      const target = sp.cuts[best] - perLine;
      let k = best;
      while (k > 0 && sp.cuts[k] > target) k--;
      best = k;
      t.innerHTML = sliceHtml(b.html, 0, sp.cuts[best]);
      lines = measure();
    }
    // Huérfana: no dejamos una sola línea al pie de la columna
    if (lines < 2 && sp.text.length > perLine * 1.5) { node.remove(); return b; }
    const rest = Object.assign({}, b, { html: sliceHtml(b.html, sp.cuts[best] + 1, sp.text.length), cont: true });
    if (b.type === 'subtitle') rest.type = 'lead';
    return rest;
  };

  // Los títulos que quedaron al final de una columna se van con el bloque siguiente.
  Layout.prototype.popOrphanHeads = function () {
    const col = this.col();
    const out = [];
    let last = col.lastElementChild;
    while (last && (last.classList.contains('b-h2') || last.classList.contains('b-h3') || last.classList.contains('b-h1f'))) {
      if (last === col.firstElementChild) break;
      out.unshift(last);
      last.remove();
      last = col.lastElementChild;
    }
    return out;
  };

  Layout.prototype.place = function (b, guard) {
    guard = (guard || 0) + 1;
    if (guard > 400) return;
    const col = this.col();
    const node = this.render(b);
    col.appendChild(node);
    if (this.fits(col)) return;
    node.remove();
    if (this.splittable(b)) {
      const rest = this.split(b);
      if (rest === null) return;
      if (rest !== b) { this.nextCol(); return this.place(rest, guard); }
    }
    if (col.children.length === 0) {
      // No cabe ni en una columna vacía: se ajusta (imágenes) o se acepta el desborde.
      if (b.type === 'image') {
        const f = this.render(b);
        col.appendChild(f);
        const im = f.querySelector('img');
        const capH = f.offsetHeight - im.offsetHeight;
        const avail = col.clientHeight - capH - 2;
        im.style.height = avail + 'px';
        im.style.width = Math.min(col.clientWidth, avail * b.w / b.h) + 'px';
        return;
      }
      col.appendChild(this.render(b));
      return;
    }
    const carry = this.popOrphanHeads();
    this.nextCol();
    const nc = this.col();
    carry.forEach(function (h) { nc.appendChild(h); });
    return this.place(b, guard);
  };

  Layout.prototype.chapterHead = function (b, lead, divider) {
    if (this.hasContent()) this.newPage('body');
    const st = this.cur;
    this.chapter++;
    st.el.classList.add('opener');
    if (divider) st.el.classList.add('divider');
    const h = st.head;
    h.classList.add('bx');
    if (this.opts.numbers && !/^\s*(\d+[.)\s]|[IVXLC]+[.)])/.test(X.textOf(b.html))) h.appendChild(tx('div', 'ch-num', 'kicker', pad(this.chapter)));
    h.appendChild(tx('h1', 'b-h1', 'h1', b.html, true));
    if (lead) h.appendChild(tx('p', 'ch-lead', 'lead', lead.html, true));
    if (divider) this.newPage('body');
  };

  Layout.prototype.slideHead = function (b) {
    if (this.hasContent()) this.newPage('body');
    this.cur.el.classList.add('slide-head');
    this.cur.head.appendChild(tx('h2', 'b-h2s', 'h2', b.html, true));
  };

  Layout.prototype.run = function () {
    const o = this.opts;
    const fmt = this.fmt;
    let blocks = this.doc.blocks.filter(function (b) { return !b.excluded; });
    const titleB = blocks.find(function (b) { return b.type === 'title'; });
    const subB = titleB && blocks[blocks.indexOf(titleB) + 1] && blocks[blocks.indexOf(titleB) + 1].type === 'subtitle'
      ? blocks[blocks.indexOf(titleB) + 1] : null;

    if (o.cover) {
      this.cover(titleB, subB);
      blocks = blocks.filter(function (b) { return b !== titleB && b !== subB; });
    }
    this.newPage('body');
    // Pie de foto pegado a su imagen
    const flow = [];
    blocks.forEach(function (b, i) {
      if (b.type === 'caption' && flow.length && flow[flow.length - 1].type === 'image' && !flow[flow.length - 1].caption) {
        flow[flow.length - 1] = Object.assign({}, flow[flow.length - 1], { caption: b });
        return;
      }
      flow.push(b);
    });

    for (let i = 0; i < flow.length; i++) {
      const b = flow[i];
      const next = flow[i + 1];
      if (b.type === 'title') {
        // Sin portada: el título abre la primera página
        const h = this.cur.head;
        this.cur.el.classList.add('opener', 'first');
        h.classList.add('bx');
        h.appendChild(tx('h1', 'b-h1 b-title', 'h1', b.html, true));
        if (next && next.type === 'subtitle') { h.appendChild(tx('p', 'ch-lead', 'lead', next.html, true)); i++; }
        continue;
      }
      if (b.type === 'h1' && fmt.chapterBreak && o.chapterBreak) {
        const lead = next && next.type === 'lead' ? next : null;
        this.chapterHead(b, lead, !fmt.print);
        if (lead) i++;
        continue;
      }
      if (b.type === 'h2' && fmt.sectionBreak) { this.slideHead(b); continue; }
      this.place(b);
    }

    // Limpieza: páginas vacías al final
    while (this.pages.length > 1 && this.pages[this.pages.length - 1].el.dataset.kind === 'body' && !this.hasContent(this.pages[this.pages.length - 1])) {
      this.pages.pop().el.remove();
    }
    // Folios
    const running = (this.doc.title || '').length > 64 ? this.doc.title.slice(0, 62).trim() + '…' : this.doc.title;
    this.pages.forEach(function (st, i) {
      if (st.el.dataset.kind === 'cover' || st.el.classList.contains('divider')) return;
      const f = el('div', 'pg-foot');
      f.appendChild(tx('div', 'folio-l', 'folio', X.esc(running || '')));
      f.appendChild(tx('div', 'folio-r', 'folio', pad(i + 1)));
      st.el.appendChild(f);
    });
    return this.pages.map(function (p) { return p.el; });
  };

  // Carga las fuentes de la plantilla antes de medir (si no, los cortes saldrían mal).
  async function loadFonts(tpl) {
    const fams = {};
    Object.keys(tpl.roles).forEach(function (k) { fams[tpl.roles[k].f] = 1; });
    const jobs = [];
    document.fonts.forEach(function (f) {
      if (fams[f.family.replace(/"/g, '')]) jobs.push(f.load().catch(function () {}));
    });
    await Promise.all(jobs);
    await document.fonts.ready;
  }

  function applyVars(container, fmt, tpl) {
    const v = T.cssVars(fmt, tpl);
    Object.keys(v).forEach(function (k) { container.style.setProperty(k, v[k]); });
    container.className = 'pages tpl-' + (tpl.base || tpl.id) + ' fmt-' + fmt.id + (fmt.print ? ' is-print' : ' is-screen');
  }

  async function render(container, doc, ctx) {
    applyVars(container, ctx.fmt, ctx.tpl);
    await loadFonts(ctx.tpl);
    container.innerHTML = '';
    const L = new Layout(container, doc, ctx);
    const pages = L.run();
    return { pages: pages, integrity: integrity(container, doc) };
  }

  // Verificación: el texto diagramado es exactamente el texto de origen, en el mismo orden.
  function integrity(container, doc) {
    const words = function (s) { return s.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean); };
    let src = [];
    doc.blocks.forEach(function (b) { if (!b.excluded) src = src.concat(words(X.blockText(b))); });
    let out = [];
    container.querySelectorAll('[data-src]').forEach(function (e) { out = out.concat(words(e.textContent)); });
    let same = 0;
    const n = Math.min(src.length, out.length);
    for (let i = 0; i < n; i++) { if (src[i] === out[i]) same++; else break; }
    const exact = same === src.length && src.length === out.length;
    let firstDiff = null;
    if (!exact) firstDiff = { at: same, expected: src.slice(same, same + 6).join(' '), got: out.slice(same, same + 6).join(' ') };
    const omitted = doc.blocks.filter(function (b) { return b.excluded; }).reduce(function (a, b) { return a + X.countWords(b); }, 0);
    return { exact: exact, source: src.length, placed: out.length, omitted: omitted, firstDiff: firstDiff };
  }

  window.MedLayout = { render: render, applyVars: applyVars, loadFonts: loadFonts };
})();
