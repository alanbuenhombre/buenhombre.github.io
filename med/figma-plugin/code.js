// Med · Importador para Figma.
// 1) Construye frames editables a partir de un paquete .med.json exportado por Med.
// 2) Convierte un frame de Figma en plantilla de Med (.json) leyendo capas con nombres de rol.
// Sin conexión a internet (ver manifest.json → networkAccess: none).

figma.showUI(__html__, { width: 360, height: 470, themeColors: true });

// ---------------- Fuentes ----------------
const WEIGHT_WORDS = [
  [/thin|hairline/, 100], [/extra ?light|ultra ?light/, 200], [/light/, 300], [/medium/, 500],
  [/semi ?bold|demi ?bold/, 600], [/extra ?bold|ultra ?bold/, 800], [/black|heavy/, 900], [/bold/, 700]
];
function styleWeight(style) {
  const s = style.toLowerCase();
  for (const [re, w] of WEIGHT_WORDS) if (re.test(s)) return w;
  return 400;
}
function styleItalic(style) { return /italic|oblique/i.test(style); }

let fontIndex = null;
async function indexFonts() {
  if (fontIndex) return fontIndex;
  const list = await figma.listAvailableFontsAsync();
  fontIndex = {};
  for (const f of list) {
    const k = f.fontName.family.toLowerCase();
    (fontIndex[k] = fontIndex[k] || []).push(f.fontName);
  }
  return fontIndex;
}
const resolved = {};
const missing = new Set();
async function resolveFont(st) {
  const key = [st.family, st.weight, st.italic].join('|');
  if (resolved[key]) return resolved[key];
  const idx = await indexFonts();
  const families = [st.family].concat(st.fallbacks || [], ['Inter']);
  let pick = null;
  for (const fam of families) {
    const styles = idx[(fam || '').toLowerCase()];
    if (!styles) continue;
    let best = null, score = Infinity;
    for (const fn of styles) {
      const s = Math.abs(styleWeight(fn.style) - st.weight) + (styleItalic(fn.style) === !!st.italic ? 0 : 1000);
      if (s < score) { score = s; best = fn; }
    }
    if (best) { pick = best; break; }
  }
  if (!pick) pick = { family: 'Inter', style: 'Regular' };
  if (pick.family.toLowerCase() !== (st.family || '').toLowerCase()) missing.add(st.family);
  await figma.loadFontAsync(pick);
  resolved[key] = pick;
  return pick;
}

// ---------------- Utilidades ----------------
function paint(c) {
  if (!c) return [];
  return [{ type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity: c.a == null ? 1 : c.a }];
}
function sameStyle(a, b) {
  return a && b && a.family === b.family && a.weight === b.weight && a.italic === b.italic &&
    a.size === b.size && a.lineHeight === b.lineHeight && a.letterSpacing === b.letterSpacing && a.upper === b.upper;
}
async function setStyleId(node, id) {
  if (typeof node.setTextStyleIdAsync === 'function') await node.setTextStyleIdAsync(id);
  else node.textStyleId = id;
}

// ---------------- Importar paquete ----------------
async function importPackage(data) {
  if (!data || data.type !== 'med-figma') throw new Error('El archivo no es un paquete de Med (.med.json).');
  const total = data.pages.length;

  // Página nueva de Figma para este documento
  const page = figma.createPage();
  page.name = (data.name || 'Documento') + ' · ' + data.format.name;
  if (typeof figma.setCurrentPageAsync === 'function') await figma.setCurrentPageAsync(page);
  else figma.currentPage = page;

  // Estilos de texto locales (uno por rol): cambiar uno actualiza todo el documento
  const styleIds = {};
  const existing = typeof figma.getLocalTextStylesAsync === 'function' ? await figma.getLocalTextStylesAsync() : figma.getLocalTextStyles();
  for (const role of Object.keys(data.textStyles || {})) {
    const def = data.textStyles[role];
    const st = def.style;
    const name = 'Med/' + data.template.name + '/' + def.name;
    let ts = existing.find(s => s.name === name);
    if (!ts) { ts = figma.createTextStyle(); ts.name = name; }
    ts.fontName = await resolveFont(st);
    ts.fontSize = st.size;
    ts.lineHeight = { unit: 'PIXELS', value: st.lineHeight };
    ts.letterSpacing = { unit: 'PIXELS', value: st.letterSpacing || 0 };
    ts.textCase = st.upper ? 'UPPER' : 'ORIGINAL';
    styleIds[role] = { id: ts.id, style: st };
  }

  // Estilos de color
  const colorStyles = typeof figma.getLocalPaintStylesAsync === 'function' ? await figma.getLocalPaintStylesAsync() : figma.getLocalPaintStyles();
  const hexToRgb = h => { const n = parseInt(h.slice(1), 16); return { r: (n >> 16 & 255) / 255, g: (n >> 8 & 255) / 255, b: (n & 255) / 255 }; };
  const colorNames = { paper: 'Papel', ink: 'Tinta', muted: 'Secundario', accent: 'Acento', soft: 'Fondo suave' };
  for (const k of Object.keys(colorNames)) {
    const hex = data.template.colors && data.template.colors[k];
    if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) continue;
    const name = 'Med/' + data.template.name + '/' + colorNames[k];
    let ps = colorStyles.find(s => s.name === name);
    if (!ps) { ps = figma.createPaintStyle(); ps.name = name; }
    ps.paints = [{ type: 'SOLID', color: hexToRgb(hex) }];
  }

  const frames = [];
  const gap = Math.round(Math.max(data.format.w, data.format.h) * 0.08);
  const perRow = data.format.w > data.format.h ? 4 : 8;
  for (let i = 0; i < total; i++) {
    const pg = data.pages[i];
    figma.ui.postMessage({ type: 'progress', text: 'Página ' + (i + 1) + ' de ' + total + '…' });
    const fr = figma.createFrame();
    fr.name = pg.name;
    fr.resize(pg.w, pg.h);
    fr.x = (i % perRow) * (pg.w + gap);
    fr.y = Math.floor(i / perRow) * (pg.h + gap * 1.5);
    fr.fills = paint(pg.fill);
    fr.clipsContent = true;
    // Retícula de columnas como guía para el diseñador
    if (data.margins && data.columns) {
      const m = data.margins;
      fr.layoutGrids = [
        { pattern: 'COLUMNS', alignment: 'STRETCH', count: data.columns, gutterSize: data.gutter || Math.round(data.format.w * 0.03), offset: m[3], visible: false, color: { r: 1, g: 0, b: 0, a: 0.08 } },
        { pattern: 'ROWS', alignment: 'STRETCH', count: 1, gutterSize: 0, offset: m[0], visible: false, color: { r: 0, g: 0, b: 1, a: 0.05 } }
      ];
    }
    page.appendChild(fr);
    for (const n of pg.nodes) {
      try { await addNode(fr, n, styleIds); } catch (e) { console.error('Nodo omitido', n.name, e); }
    }
    frames.push(fr);
  }
  figma.viewport.scrollAndZoomIntoView(frames);
  return { pages: total, missing: Array.from(missing) };
}

async function addNode(fr, n, styleIds) {
  if (n.type === 'rect') {
    const r = figma.createRectangle();
    r.name = n.name || 'Rectángulo';
    r.resize(Math.max(n.w, 0.01), Math.max(n.h, 0.01));
    r.x = n.x; r.y = n.y;
    r.fills = paint(n.fill);
    if (n.radius) r.cornerRadius = n.radius;
    fr.appendChild(r);
    return;
  }
  if (n.type === 'image') {
    const r = figma.createRectangle();
    r.name = n.name || 'Imagen';
    r.resize(Math.max(n.w, 1), Math.max(n.h, 1));
    r.x = n.x; r.y = n.y;
    if (n.b64) {
      const img = figma.createImage(figma.base64Decode(n.b64));
      r.fills = [{ type: 'IMAGE', imageHash: img.hash, scaleMode: n.scaleMode || 'FILL' }];
    } else {
      r.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
    }
    fr.appendChild(r);
    return;
  }
  if (n.type === 'text') {
    const t = figma.createText();
    const base = n.style;
    t.fontName = await resolveFont(base);
    t.characters = n.chars;
    t.name = n.name || 'Texto';
    const roleStyle = styleIds[n.role];
    if (roleStyle && sameStyle(roleStyle.style, base)) {
      await setStyleId(t, roleStyle.id);
    } else {
      t.fontSize = base.size;
      t.lineHeight = { unit: 'PIXELS', value: base.lineHeight };
      t.letterSpacing = { unit: 'PIXELS', value: base.letterSpacing || 0 };
      t.textCase = base.upper ? 'UPPER' : 'ORIGINAL';
    }
    t.fills = paint(base.color);
    t.textAlignHorizontal = n.align || 'LEFT';
    if (n.indent) t.paragraphIndent = n.indent;
    // Tramos con negrita, cursiva, color o tamaño distintos
    for (const r of n.runs || []) {
      if (r.end <= r.start) continue;
      const s = r.style;
      if (s.family !== base.family || s.weight !== base.weight || s.italic !== base.italic) {
        t.setRangeFontName(r.start, r.end, await resolveFont(s));
      }
      if (s.size !== base.size) t.setRangeFontSize(r.start, r.end, s.size);
      if (JSON.stringify(s.color) !== JSON.stringify(base.color)) t.setRangeFills(r.start, r.end, paint(s.color));
      if (s.underline) t.setRangeTextDecoration(r.start, r.end, 'UNDERLINE');
      if (s.upper !== base.upper) t.setRangeTextCase(r.start, r.end, s.upper ? 'UPPER' : 'ORIGINAL');
    }
    t.x = n.x; t.y = n.y;
    t.resize(Math.max(n.w, 1), Math.max(n.h, 1));
    t.textAutoResize = 'HEIGHT';
    fr.appendChild(t);
  }
}

// ---------------- Exportar plantilla desde un frame ----------------
const ROLE_KEYS = [
  ['title', /^(portada|titulo portada|title|cover)$/],
  ['sub', /^(subtitulo|subtitle|sub)$/],
  ['kicker', /^(antetitulo|etiqueta|kicker|label)$/],
  ['h1', /^(capitulo|titulo 1|h1|chapter)$/],
  ['h2', /^(seccion|titulo 2|h2|section)$/],
  ['h3', /^(subseccion|titulo 3|h3|subsection)$/],
  ['lead', /^(entradilla|lead|intro)$/],
  ['body', /^(cuerpo|parrafo|body|texto)$/],
  ['quote', /^(cita|quote)$/],
  ['caption', /^(pie|pie de foto|caption)$/],
  ['table', /^(tabla|table)$/],
  ['folio', /^(folio|numero de pagina|page number)$/]
];
const COLOR_KEYS = [['accent', /^(acento|accent)$/], ['soft', /^(fondo suave|soft)$/], ['muted', /^(secundario|muted)$/]];
function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }
function solid(fills) {
  if (!Array.isArray(fills)) return null;
  const f = fills.find(x => x.type === 'SOLID' && x.visible !== false);
  return f ? { r: f.color.r, g: f.color.g, b: f.color.b } : null;
}

function exportTemplate() {
  const sel = figma.currentPage.selection[0];
  if (!sel || !('findAll' in sel)) throw new Error('Selecciona un frame con capas de texto nombradas (cuerpo, capitulo, seccion, cita…).');
  const roles = {};
  const colors = {};
  sel.findAll(n => n.type === 'TEXT').forEach(n => {
    const k = norm(n.name);
    const hit = ROLE_KEYS.find(([, re]) => re.test(k));
    if (!hit || roles[hit[0]]) return;
    const fn = n.fontName === figma.mixed ? n.getRangeFontName(0, 1) : n.fontName;
    const size = n.fontSize === figma.mixed ? n.getRangeFontSize(0, 1) : n.fontSize;
    const lh = n.lineHeight === figma.mixed ? n.getRangeLineHeight(0, 1) : n.lineHeight;
    const ls = n.letterSpacing === figma.mixed ? n.getRangeLetterSpacing(0, 1) : n.letterSpacing;
    const tc = n.textCase === figma.mixed ? n.getRangeTextCase(0, 1) : n.textCase;
    roles[hit[0]] = {
      family: fn.family, style: fn.style, weight: styleWeight(fn.style), italic: styleItalic(fn.style),
      size: size,
      lineHeight: lh.unit === 'PIXELS' ? lh.value : lh.unit === 'PERCENT' ? size * lh.value / 100 : size * 1.25,
      letterSpacing: ls.unit === 'PIXELS' ? ls.value : size * ls.value / 100,
      upper: tc === 'UPPER',
      color: solid(n.fills === figma.mixed ? n.getRangeFills(0, 1) : n.fills)
    };
  });
  sel.findAll(n => 'fills' in n && n.type !== 'TEXT').forEach(n => {
    const k = norm(n.name);
    const hit = COLOR_KEYS.find(([, re]) => re.test(k));
    if (hit && !colors[hit[0]]) colors[hit[0]] = solid(n.fills);
  });
  const paper = solid(sel.fills);
  if (paper) colors.paper = paper;
  if (roles.body && roles.body.color) colors.ink = roles.body.color;
  if (!Object.keys(roles).length) throw new Error('No encontré capas de texto con nombres de rol. Nombra tus textos: portada, capitulo, seccion, subseccion, entradilla, cuerpo, cita, pie, etiqueta.');

  // Columnas y márgenes desde la retícula del frame, si la tiene
  const page = { w: Math.round(sel.width), h: Math.round(sel.height), name: sel.name };
  const grids = sel.layoutGrids || [];
  const cols = grids.find(g => g.pattern === 'COLUMNS');
  const rows = grids.find(g => g.pattern === 'ROWS');
  if (cols) {
    page.cols = cols.count;
    const side = cols.offset || Math.round(sel.width * 0.08);
    const tb = rows ? rows.offset : Math.round(sel.height * 0.075);
    page.margin = [tb, side, tb, side];
  }
  return { type: 'med-template', version: 1, name: sel.name, base: 'clasico', page, roles, colors };
}

figma.ui.onmessage = async msg => {
  try {
    if (msg.type === 'import') {
      const res = await importPackage(msg.data);
      let text = 'Listo: ' + res.pages + ' páginas creadas.';
      if (res.missing.length) text += ' Fuentes no instaladas (se reemplazaron): ' + res.missing.join(', ') + '.';
      figma.ui.postMessage({ type: 'done', text });
      figma.notify('Med: ' + res.pages + ' páginas importadas');
    } else if (msg.type === 'export-template') {
      const tpl = exportTemplate();
      figma.ui.postMessage({ type: 'template', data: tpl, text: 'Plantilla con ' + Object.keys(tpl.roles).length + ' estilos de texto.' });
    } else if (msg.type === 'close') {
      figma.closePlugin();
    }
  } catch (e) {
    figma.ui.postMessage({ type: 'error', text: e.message || String(e) });
  }
};
