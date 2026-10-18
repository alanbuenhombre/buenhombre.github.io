/* Med · Extracción local de contenido y reconocimiento de jerarquías.
   Entrada: File (DOCX, PDF, TXT, MD). Salida: { title, blocks[], stats, warnings[] }.
   Bloque: { id, type, html?, items?, rows?, header?, src?, w?, h? }
   Tipos: title, subtitle, h1, h2, h3, lead, p, quote, caption, ul, ol, table, image.
   Nada sale del navegador: pdf.js y mammoth corren aquí mismo. */
(function () {
  'use strict';

  let uid = 0;
  const nid = function () { return 'b' + (++uid); };

  // ---------- utilidades de texto ----------
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  // Conserva solo formato de línea (negrita, cursiva, sup/sub, saltos). Todo lo demás se aplana.
  const KEEP = { STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', SUP: 'sup', SUB: 'sub', BR: 'br' };
  function cleanInline(node) {
    let out = '';
    node.childNodes.forEach(function (n) {
      if (n.nodeType === 3) { out += esc(n.data.replace(/\s+/g, ' ')); return; }
      if (n.nodeType !== 1) return;
      const tag = KEEP[n.tagName];
      if (tag === 'br') { out += '<br>'; return; }
      const inner = cleanInline(n);
      if (!inner.trim()) { out += inner; return; }
      out += tag ? '<' + tag + '>' + inner + '</' + tag + '>' : inner;
    });
    return out;
  }
  function tidy(html) {
    return html.replace(/\s+/g, ' ').replace(/^(\s|<br>)+|(\s|<br>)+$/g, '')
      .replace(/<(strong|em)>\s*<\/\1>/g, '').trim();
  }
  function textOf(html) {
    const d = document.createElement('div'); d.innerHTML = html; return d.textContent.replace(/\s+/g, ' ').trim();
  }
  function isAllBold(el) {
    const t = el.textContent.replace(/\s+/g, '');
    if (!t) return false;
    let b = '';
    el.querySelectorAll('strong,b').forEach(function (s) { b += s.textContent.replace(/\s+/g, ''); });
    return b.length >= t.length * 0.9;
  }
  function loadImage(src) {
    return new Promise(function (res) {
      const im = new Image();
      im.onload = function () { res({ w: im.naturalWidth || 1, h: im.naturalHeight || 1 }); };
      im.onerror = function () { res(null); };
      im.src = src;
    });
  }
  function inlineFromText(s) {
    // **negrita** y *cursiva* estilo Markdown
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>');
  }

  const BULLET = /^\s*([•·▪◦●○■□➢➤►\-–—*])\s+/;
  const NUMBER = /^\s*(\(?\d{1,3}[.)]|\(?[a-zA-Z][.)])\s+/;

  // ---------- DOCX (mammoth) ----------
  async function fromDocx(file) {
    const buf = await file.arrayBuffer();
    const styleMap = [
      "p[style-name='Title'] => h1.doc-title:fresh",
      "p[style-name='Título'] => h1.doc-title:fresh",
      "p[style-name='Subtitle'] => p.doc-subtitle:fresh",
      "p[style-name='Subtítulo'] => p.doc-subtitle:fresh",
      "p[style-name='Quote'] => blockquote > p:fresh",
      "p[style-name='Intense Quote'] => blockquote > p:fresh",
      "p[style-name='Cita'] => blockquote > p:fresh",
      "p[style-name='Cita destacada'] => blockquote > p:fresh",
      "p[style-name='Caption'] => p.caption:fresh",
      "p[style-name='Descripción'] => p.caption:fresh",
      "p[style-name='Epígrafe'] => p.caption:fresh"
    ];
    const res = await window.mammoth.convertToHtml({ arrayBuffer: buf }, { styleMap: styleMap, includeDefaultStyleMap: true });
    const warnings = res.messages.filter(function (m) { return m.type === 'warning'; })
      .slice(0, 3).map(function (m) { return m.message; });
    const root = document.createElement('div');
    root.innerHTML = res.value;
    const blocks = [];
    const walk = async function (parent) {
      for (const el of Array.from(parent.children)) {
        const tag = el.tagName;
        if (/^H[1-6]$/.test(tag)) {
          const html = tidy(cleanInline(el));
          if (!html) continue;
          if (el.classList.contains('doc-title')) blocks.push({ id: nid(), type: 'title', html: html });
          else blocks.push({ id: nid(), type: 'h' + Math.min(+tag[1], 6), html: html, level: +tag[1] });
        } else if (tag === 'P') {
          const imgs = el.querySelectorAll('img');
          for (const im of Array.from(imgs)) {
            const dim = await loadImage(im.src);
            if (dim) blocks.push({ id: nid(), type: 'image', src: im.src, w: dim.w, h: dim.h, alt: im.alt || '' });
            im.remove();
          }
          const html = tidy(cleanInline(el));
          if (!html) continue;
          let type = 'p';
          if (el.classList.contains('doc-subtitle')) type = 'subtitle';
          else if (el.classList.contains('caption')) type = 'caption';
          const b = { id: nid(), type: type, html: html };
          if (type === 'p' && isAllBold(el) && textOf(html).length < 120 && !/[.:;,]$/.test(textOf(html))) b.boldLine = true;
          blocks.push(b);
        } else if (tag === 'BLOCKQUOTE') {
          el.querySelectorAll('p').forEach(function (p) {
            const html = tidy(cleanInline(p)); if (html) blocks.push({ id: nid(), type: 'quote', html: html });
          });
        } else if (tag === 'UL' || tag === 'OL') {
          const items = [];
          const collect = function (list, depth) {
            Array.from(list.children).forEach(function (li) {
              const copy = li.cloneNode(true);
              copy.querySelectorAll('ul,ol').forEach(function (x) { x.remove(); });
              const html = tidy(cleanInline(copy));
              if (html) items.push(depth ? '— ' + html : html);
              li.querySelectorAll(':scope > ul, :scope > ol').forEach(function (sub) { collect(sub, depth + 1); });
            });
          };
          collect(el, 0);
          if (items.length) blocks.push({ id: nid(), type: tag === 'OL' ? 'ol' : 'ul', items: items });
        } else if (tag === 'TABLE') {
          const rows = [];
          el.querySelectorAll('tr').forEach(function (tr) {
            const cells = [];
            tr.querySelectorAll('td,th').forEach(function (td) {
              const parts = [];
              (td.querySelectorAll('p').length ? td.querySelectorAll('p') : [td]).forEach(function (p) { parts.push(tidy(cleanInline(p))); });
              cells.push(parts.filter(Boolean).join('<br>'));
            });
            if (cells.some(Boolean)) rows.push(cells);
          });
          if (rows.length) {
            const head = el.querySelector('thead') || el.querySelector('th') || (rows.length > 1 && isAllBold(el.querySelector('tr')));
            blocks.push({ id: nid(), type: 'table', rows: rows, header: !!head });
          }
        } else if (tag === 'IMG') {
          const dim = await loadImage(el.src);
          if (dim) blocks.push({ id: nid(), type: 'image', src: el.src, w: dim.w, h: dim.h, alt: el.alt || '' });
        } else if (el.children.length) {
          await walk(el);
        }
      }
    };
    await walk(root);
    return { blocks: blocks, warnings: warnings, source: 'docx' };
  }

  // ---------- PDF (pdf.js) ----------
  async function fromPdf(file) {
    const pdfjs = window.pdfjsLib;
    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjs.getDocument({ data: data, isEvalSupported: false, disableFontFace: true, useSystemFonts: false }).promise;
    const pages = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const vp = page.getViewport({ scale: 1 });
      await page.getOperatorList(); // resuelve los nombres reales de las fuentes
      const tc = await page.getTextContent();
      const fontInfo = {};
      const lines = [];
      let cur = null;
      tc.items.forEach(function (it) {
        if (!('str' in it)) return;
        const size = Math.round(Math.hypot(it.transform[2], it.transform[3]) * 10) / 10;
        const x = it.transform[4], y = it.transform[5];
        if (!fontInfo[it.fontName]) {
          let name = '';
          try { const f = page.commonObjs.get(it.fontName); name = (f && (f.name || f.loadedName)) || ''; } catch (e) { name = ''; }
          fontInfo[it.fontName] = { bold: /bold|black|heavy|semibold|demi/i.test(name), italic: /italic|oblique/i.test(name) };
        }
        const fi = fontInfo[it.fontName];
        if (!it.str.length) { if (it.hasEOL && cur) cur.eol = true; return; }
        const sameLine = cur && !cur.eol && Math.abs(cur.y - y) < Math.max(size, cur.size) * 0.45 && x >= cur.x1 - size * 0.5;
        if (!sameLine) {
          cur = { y: y, x0: x, x1: x, size: size, parts: [], page: p, eol: false };
          lines.push(cur);
        }
        const gap = x - cur.x1;
        let s = it.str;
        if (cur.parts.length && gap > size * 0.18) {
          const prev = cur.parts[cur.parts.length - 1];
          if (!/\s$/.test(prev.s) && !/^\s/.test(s)) s = ' ' + s;
        }
        cur.parts.push({ s: s, bold: fi.bold, italic: fi.italic, size: size });
        cur.x1 = x + (it.width || 0);
        // El tamaño de la línea es el del texto con más caracteres (no el de una viñeta más grande)
        cur.bySize = cur.bySize || {};
        cur.bySize[size] = (cur.bySize[size] || 0) + s.trim().length;
        cur.size = +Object.keys(cur.bySize).sort(function (a, b) { return cur.bySize[b] - cur.bySize[a]; })[0];
        if (it.hasEOL) cur.eol = true;
      });
      lines.forEach(function (l) {
        l.text = l.parts.map(function (x) { return x.s; }).join('').replace(/\s+/g, ' ').trim();
        const chars = l.parts.reduce(function (a, x) { return a + x.s.trim().length; }, 0) || 1;
        l.bold = l.parts.reduce(function (a, x) { return a + (x.bold ? x.s.trim().length : 0); }, 0) / chars > 0.85;
        l.italic = l.parts.reduce(function (a, x) { return a + (x.italic ? x.s.trim().length : 0); }, 0) / chars > 0.85;
        l.top = vp.height - l.y; // distancia desde arriba
      });
      pages.push({ lines: lines.filter(function (l) { return l.text; }), height: vp.height, width: vp.width });
    }

    // Cabeceras / pies repetidos y números de página
    const norm = function (t) { return t.toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim(); };
    const counts = {};
    pages.forEach(function (pg) {
      const seen = {};
      pg.lines.forEach(function (l) {
        const edge = l.top < pg.height * 0.1 || l.top > pg.height * 0.9;
        if (!edge) return;
        const k = norm(l.text); if (!seen[k]) { seen[k] = 1; counts[k] = (counts[k] || 0) + 1; }
      });
    });
    let removed = 0;
    pages.forEach(function (pg) {
      pg.lines = pg.lines.filter(function (l) {
        const edge = l.top < pg.height * 0.1 || l.top > pg.height * 0.9;
        if (!edge) return true;
        const pageNum = /^(p[áa]g(ina)?\.?\s*)?\d{1,4}(\s*(de|of|\/)\s*\d{1,4})?$/i.test(l.text);
        const repeated = pages.length >= 3 && counts[norm(l.text)] >= Math.max(2, pages.length * 0.5);
        if (pageNum || repeated) { removed++; return false; }
        return true;
      });
    });

    const all = [];
    pages.forEach(function (pg) { pg.lines.forEach(function (l) { all.push(l); }); });
    if (!all.length) {
      return { blocks: [], warnings: ['El PDF no tiene texto seleccionable (parece escaneado). Esta versión no hace OCR todavía.'], source: 'pdf' };
    }

    // Tamaño del cuerpo = tamaño con más caracteres
    const hist = {};
    all.forEach(function (l) { const k = Math.round(l.size * 2) / 2; hist[k] = (hist[k] || 0) + l.text.length; });
    const body = +Object.keys(hist).sort(function (a, b) { return hist[b] - hist[a]; })[0];
    // Interlineado típico del cuerpo
    const gaps = [];
    for (let i = 1; i < all.length; i++) {
      const a = all[i - 1], b = all[i];
      if (a.page === b.page && Math.abs(a.size - body) < 0.6 && Math.abs(b.size - body) < 0.6) {
        const g = a.y - b.y; if (g > 0 && g < body * 3) gaps.push(g);
      }
    }
    gaps.sort(function (a, b) { return a - b; });
    const lineGap = gaps.length ? gaps[Math.floor(gaps.length / 2)] : body * 1.3;
    const left = (function () {
      const xs = all.filter(function (l) { return Math.abs(l.size - body) < 0.6; }).map(function (l) { return Math.round(l.x0); });
      const h = {}; xs.forEach(function (x) { h[x] = (h[x] || 0) + 1; });
      return +Object.keys(h).sort(function (a, b) { return h[b] - h[a]; })[0] || 0;
    })();

    // Líneas → párrafos
    const paras = [];
    let P = null;
    const lineHtml = function (l) {
      return l.parts.map(function (x) {
        let s = esc(x.s);
        if (x.bold && !l.bold) s = '<strong>' + s + '</strong>';
        if (x.italic && !l.italic) s = '<em>' + s + '</em>';
        return s;
      }).join('').replace(/<\/strong><strong>/g, '').replace(/<\/em><em>/g, '');
    };
    all.forEach(function (l, i) {
      const prev = all[i - 1];
      // Solo es lista si va en tamaño de cuerpo ("1. Alcance" en 18 pt es un título numerado)
      const list = (BULLET.test(l.text) || NUMBER.test(l.text)) && Math.abs(l.size - body) <= Math.max(2, body * 0.3);
      const sizeKey = Math.round(l.size * 2) / 2;
      let start = !P || list;
      if (!start) {
        const samePage = prev.page === l.page;
        const gap = samePage ? prev.y - l.y : lineGap;
        if (Math.abs(P.sizeKey - sizeKey) >= 0.5 || P.bold !== l.bold) start = true;
        else if (samePage && (gap > lineGap * 1.45 || gap < 0)) start = true;
        else if (samePage && P.lines.length && l.x0 > left + body * 1.2 && !P.list && Math.abs(l.size - body) < 0.6) start = true;
        else if (!samePage && /[.!?:»"”]$/.test(prev.text)) start = true;
        else if (P.list && l.x0 <= left + 1 && !list && /[.;:]$/.test(prev.text) && gap > lineGap * 1.1) start = true;
      }
      if (start) {
        P = { sizeKey: sizeKey, size: l.size, bold: l.bold, italic: l.italic, lines: [], list: list ? (BULLET.test(l.text) ? 'ul' : 'ol') : null, page: l.page };
        paras.push(P);
      }
      P.lines.push(l);
    });
    paras.forEach(function (p) {
      let html = '';
      p.lines.forEach(function (l, i) {
        let h = lineHtml(l).trim();
        if (i === 0 && p.list) h = h.replace(p.list === 'ul' ? BULLET : NUMBER, '');
        if (!html) { html = h; return; }
        if (/[a-záéíóúñü]-$/i.test(html) && /^[a-záéíóúñü]/.test(h)) html = html.slice(0, -1) + h; // guion de partición
        else html += ' ' + h;
      });
      p.html = tidy(html.replace(/^\s*<\/(strong|em)>/, ''));
      if (p.bold) p.html = p.html.replace(/<\/?strong>/g, '');
      p.text = textOf(p.html);
    });

    // Tamaños de títulos: los mayores al cuerpo en párrafos cortos
    const headSizes = {};
    paras.forEach(function (p) {
      if (!p.list && p.size > body * 1.12 && p.text.length < 220) headSizes[p.sizeKey] = 1;
    });
    const levels = Object.keys(headSizes).map(Number).sort(function (a, b) { return b - a; });
    const blocks = [];
    let lastList = null;
    paras.forEach(function (p) {
      if (!p.text) return;
      if (p.list) {
        if (lastList && lastList.type === p.list) lastList.items.push(p.html);
        else { lastList = { id: nid(), type: p.list, items: [p.html] }; blocks.push(lastList); }
        return;
      }
      lastList = null;
      let type = 'p';
      const lv = levels.indexOf(p.sizeKey);
      if (lv >= 0) type = 'h' + Math.min(lv + 1, 3);
      else if (p.bold && p.text.length < 120 && !/[.;,]$/.test(p.text) && Math.abs(p.size - body) < 1.5) type = 'bold';
      else if (p.size < body * 0.88 && p.text.length < 300) type = 'caption';
      else if (p.italic && p.text.length < 400 && p.size >= body) type = 'quote';
      const b = { id: nid(), type: type === 'bold' ? 'p' : type, html: p.html };
      if (type === 'bold') b.boldLine = true;
      if (/^h/.test(type)) b.level = lv + 1;
      blocks.push(b);
    });
    const w = [];
    if (removed) w.push('Se quitaron ' + removed + ' cabeceras, pies o números de página repetidos del PDF.');
    return { blocks: blocks, warnings: w, source: 'pdf' };
  }

  // ---------- TXT / Markdown ----------
  function fromText(text, isMd) {
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    const blocks = [];
    let para = [];
    let list = null;
    let table = null;
    const flush = function () {
      if (para.length) {
        const raw = para.join(' ').replace(/\s+/g, ' ').trim();
        const b = { id: nid(), type: 'p', html: inlineFromText(raw) };
        // Texto plano: línea sola, corta y sin punto final → título
        if (!isMd && para.length === 1 && raw.length < 90 && !/[.,;:]$/.test(raw) && /\p{L}/u.test(raw)) {
          const caps = raw === raw.toUpperCase() && /\p{Lu}/u.test(raw);
          b.type = caps ? 'h1' : 'h2'; b.level = caps ? 1 : 2;
        }
        blocks.push(b);
      }
      para = [];
    };
    const endList = function () { list = null; };
    const endTable = function () {
      if (table) {
        const rows = table.filter(function (r) { return !r.every(function (c) { return /^:?-{2,}:?$/.test(c.trim()); }); });
        if (rows.length) blocks.push({ id: nid(), type: 'table', rows: rows.map(function (r) { return r.map(function (c) { return inlineFromText(c.trim()); }); }), header: table.length > 1 && /^\s*\|?\s*:?-{2,}/.test(table[1].join('|')) });
      }
      table = null;
    };
    lines.forEach(function (ln) {
      const t = ln.trim();
      if (!t) { flush(); endList(); endTable(); return; }
      if (isMd && /^\|.*\|$/.test(t)) {
        flush(); endList();
        table = table || [];
        table.push(t.slice(1, -1).split('|'));
        return;
      }
      endTable();
      let m;
      if (isMd && (m = t.match(/^(#{1,6})\s+(.+?)\s*#*$/))) {
        flush(); endList();
        blocks.push({ id: nid(), type: 'h' + Math.min(m[1].length, 6), html: inlineFromText(m[2]), level: m[1].length });
        return;
      }
      if (isMd && /^!\[.*\]\(.*\)$/.test(t)) return;
      if (isMd && (m = t.match(/^>\s?(.*)$/))) {
        flush(); endList();
        const last = blocks[blocks.length - 1];
        if (last && last.type === 'quote' && last.open) last.html += ' ' + inlineFromText(m[1]);
        else blocks.push({ id: nid(), type: 'quote', html: inlineFromText(m[1]), open: true });
        return;
      }
      const isB = BULLET.test(t), isN = NUMBER.test(t) && (isMd || /^\d/.test(t));
      if (isB || isN) {
        flush();
        const type = isB ? 'ul' : 'ol';
        const html = inlineFromText(t.replace(isB ? BULLET : NUMBER, ''));
        if (list && list.type === type) list.items.push(html);
        else { list = { id: nid(), type: type, items: [html] }; blocks.push(list); }
        return;
      }
      if (list && /^\s{2,}/.test(ln)) { list.items[list.items.length - 1] += ' ' + inlineFromText(t); return; }
      endList();
      para.push(t);
    });
    flush(); endTable();
    blocks.forEach(function (b) { delete b.open; });
    return { blocks: blocks, warnings: [], source: isMd ? 'md' : 'txt' };
  }

  // ---------- Normalización de la jerarquía ----------
  function normalize(res, fileName) {
    let blocks = res.blocks.filter(function (b) {
      return b.type === 'image' || (b.items && b.items.length) || (b.rows && b.rows.length) || (b.html && textOf(b.html));
    });

    // Si no hay títulos con estilo, las líneas cortas en negrita se vuelven títulos.
    const hasHeads = blocks.some(function (b) { return /^h\d$/.test(b.type) || b.type === 'title'; });
    blocks.forEach(function (b) {
      if (b.boldLine) { if (!hasHeads) { b.type = 'h2'; b.level = 2; } else if (b.type === 'p') { b.type = 'h3'; b.level = 9; } }
      delete b.boldLine;
    });

    // Título del documento
    let title = blocks.find(function (b) { return b.type === 'title'; });
    if (!title) {
      const first = blocks.find(function (b) { return b.type !== 'image'; });
      const heads = blocks.filter(function (b) { return /^h\d$/.test(b.type); });
      const topLevel = heads.length ? Math.min.apply(null, heads.map(function (b) { return b.level || +b.type[1]; })) : 0;
      const sameTop = heads.filter(function (b) { return (b.level || +b.type[1]) === topLevel; });
      // El primer bloque es el título del documento si es el único título de nivel superior
      // (o si entre él y el siguiente título solo hay una línea corta, como en una portada).
      if (first && first === blocks[0] && /^h\d$/.test(first.type) && (first.level || +first.type[1]) === topLevel) {
        let j = 1;
        while (j < blocks.length && !/^h\d$/.test(blocks[j].type)) j++;
        const between = blocks.slice(1, j);
        const coverLike = j < blocks.length && between.length <= 2 && between.every(function (b) {
          return b.type === 'subtitle' || (b.type === 'p' && textOf(b.html).length < 200);
        });
        if (sameTop.length === 1 || coverLike) { first.type = 'title'; title = first; }
      }
    }
    // Subtítulo: párrafo corto pegado al título
    if (title) {
      const i = blocks.indexOf(title);
      const nx = blocks[i + 1];
      const nx2 = blocks[i + 2];
      const noSub = !blocks.some(function (b) { return b.type === 'subtitle'; });
      if (nx && nx.type === 'p' && textOf(nx.html).length < 160 && noSub) nx.type = 'subtitle';
      // Un "título" pegado al título del documento y seguido de otro título es en realidad un subtítulo
      else if (nx && /^h\d$/.test(nx.type) && nx2 && /^h\d$/.test(nx2.type) && noSub) { nx.type = 'subtitle'; delete nx.level; }
    }

    // Niveles de título → h1 (capítulo), h2 (sección), h3 (subsección)
    const lv = [];
    blocks.forEach(function (b) {
      if (/^h\d$/.test(b.type)) { const L = b.level || +b.type[1]; if (lv.indexOf(L) < 0) lv.push(L); }
    });
    lv.sort(function (a, b) { return a - b; });
    // Si el nivel superior aparece una sola vez fuera del título, no merece salto de página: se trata como sección.
    blocks.forEach(function (b) {
      if (/^h\d$/.test(b.type)) b.type = 'h' + Math.min(lv.indexOf(b.level || +b.type[1]) + 1, 3);
      delete b.level;
    });
    const h1s = blocks.filter(function (b) { return b.type === 'h1'; }).length;
    if (h1s === 1 && blocks.filter(function (b) { return b.type === 'h2'; }).length > 2) {
      blocks.forEach(function (b) { if (b.type === 'h1') b.type = 'h2'; });
    }

    // Entradilla: primer párrafo después del título (si no hay subtítulo) o tras cada capítulo
    blocks.forEach(function (b, i) {
      const prev = blocks[i - 1];
      if (b.type === 'p' && prev && (prev.type === 'h1' || prev.type === 'subtitle' || (prev.type === 'title' && !blocks.some(function (x) { return x.type === 'subtitle'; })))) {
        const n = textOf(b.html).length;
        if (n > 60 && n < 480) b.type = 'lead';
      }
    });

    const stats = { words: 0, blocks: blocks.length, heads: 0, images: 0, tables: 0, lists: 0 };
    blocks.forEach(function (b) {
      stats.words += countWords(b);
      if (/^h\d$/.test(b.type)) stats.heads++;
      if (b.type === 'image') stats.images++;
      if (b.type === 'table') stats.tables++;
      if (b.type === 'ul' || b.type === 'ol') stats.lists++;
    });
    const name = fileName.replace(/\.[^.]+$/, '');
    return {
      name: name,
      title: title ? textOf(title.html) : name,
      blocks: blocks, stats: stats, warnings: res.warnings || [], source: res.source
    };
  }

  function blockText(b) {
    if (b.html) return textOf(b.html);
    if (b.items) return b.items.map(textOf).join(' ');
    if (b.rows) return b.rows.map(function (r) { return r.map(textOf).join(' '); }).join(' ');
    return '';
  }
  function countWords(b) { const t = blockText(b); return t ? t.split(/\s+/).length : 0; }

  async function extract(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    let res;
    if (ext === 'docx') res = await fromDocx(file);
    else if (ext === 'pdf') res = await fromPdf(file);
    else if (ext === 'md' || ext === 'markdown') res = fromText(await file.text(), true);
    else if (ext === 'txt' || file.type.indexOf('text') === 0) res = fromText(await file.text(), false);
    else if (ext === 'doc') throw new Error('El formato .doc (Word 97-2003) no se puede leer. Ábrelo en Word y guárdalo como .docx.');
    else throw new Error('Formato no soportado: .' + ext + '. Usa DOCX, PDF, TXT o MD.');
    return normalize(res, file.name);
  }

  window.MedExtract = { extract: extract, textOf: textOf, blockText: blockText, countWords: countWords, esc: esc };
})();
