// PDF guía → ficha técnica de 7 páginas (mismo formato de catálogo: páginas con plantilla, datos y fotos).
// Las reglas viven aquí y son deterministas: rótulos del PDF guía → campos de cada página.
// Lo que no llega como texto (rótulos dentro de imágenes, posiciones de callouts) va a «pendientes».
'use strict';

const fs = require('fs');
const path = require('path');
const guia = require('./guia');

function txt(block, tipos) {
  if (!block) return '';
  return block.contenido.filter(function (c) { return !tipos || tipos.indexOf(c.tipo) >= 0; }).map(function (c) { return c.texto; }).join(' ').trim();
}
function finder(p) {
  const bl = p.bloques || [];
  function get(clave) { return bl.find(function (b) { return b.clave === clave; }); }
  function getRe(re) { return bl.find(function (b) { return re.test(b.clave); }); }
  // Bloques que siguen a un rótulo de sección, hasta el siguiente de tamaño igual o mayor
  function under(clave) {
    const i = bl.findIndex(function (b) { return b.clave === clave; });
    if (i < 0) return [];
    const s = bl[i].size, out = [];
    // se detiene en el siguiente rótulo de sección (igual o mayor y sin contenido propio)
    for (let j = i + 1; j < bl.length; j++) {
      if (bl[j].clave === '_SUELTOS' || (bl[j].size >= s - 0.01 && !bl[j].contenido.length)) break;
      out.push(bl[j]);
    }
    return out;
  }
  return { get: get, getRe: getRe, under: under, all: bl };
}
const item = function (b) { return { titulo: b.rotulo, texto: txt(b) }; };

function build(estructura, opts) {
  opts = opts || {};
  const P = estructura.paginas;
  const pend = [];
  const pg = function (n) { return P[n - 1] || { bloques: [] }; };
  // Identidad: «NOMBRE · REF. 0000 · 01» en la cabecera derecha
  const linea = (pg(1).producto_linea || '').replace(/\s*·\s*\d{1,2}\s*$/, '');
  const m = linea.match(/^(.*?)\s*·\s*REF\.?\s*([\w-]+)/i);
  const nombre = m ? m[1].trim() : linea;
  const ref = m ? m[2] : '';
  if (!nombre || !ref) pend.push('Nombre o referencia no reconocidos en la cabecera del PDF guía.');

  // Encabezado: dos líneas izquierdas de la cabecera (se leen del propio PDF)
  const marca = opts.marca || {};
  const comunes = function (n) {
    return { marca_l1: marca.l1 || '', marca_l2: marca.l2 || '', seccion: pg(n).seccion || '', producto_linea: linea, nombre: nombre, ref: ref, eyebrow: pg(n).eyebrow || '', h1: pg(n).h1 || '', entradilla: pg(n).entradilla || '' };
  };
  const paginas = [];

  // ---- 01 · Product overview
  (function () {
    const p = pg(1), f = finder(p), d = comunes(1);
    d.eyebrow = p.seccion || d.eyebrow;
    d.descripcion = p.entradilla || '';
    d.meta = p.meta || [];
    d.tallas = txt(f.get('AVAILABLE SIZES'));
    d.colores = txt(f.get('AVAILABLE COLORS')).replace(/^[●•\s]+/, '').trim();
    d.overview = txt(f.get('PRODUCT OVERVIEW'));
    d.cobertura = ['PRIMARY COVERAGE', 'SECONDARY COVERAGE'].map(function (c) {
      const b = f.get(c);
      return b ? { rotulo: b.rotulo, titulo: txt(b, ['serif']), texto: txt(b, ['texto']) } : null;
    }).filter(Boolean);
    // Beneficios: rótulos de sección sin nombre conocido después del overview
    const known = ['ANATOMICAL COVERAGE', 'PRIMARY COVERAGE', 'SECONDARY COVERAGE', 'PRODUCT CONFIGURATION', 'AVAILABLE SIZES', 'AVAILABLE COLORS', 'PRODUCT OVERVIEW', '_SUELTOS'];
    const ov = f.get('PRODUCT OVERVIEW');
    d.beneficios = f.all.filter(function (b) { return known.indexOf(b.clave) < 0 && (!ov || b.y > ov.y); }).map(item);
    if (!d.cobertura.length) pend.push('01 · Cobertura anatómica no encontrada.');
    pend.push('01 · Figuras de cobertura primaria y secundaria: cargar las ilustraciones (no vienen en el PDF guía).');
    paginas.push({ id: 'f01', plantilla: 'F01', seccion: 'Ficha técnica', titulo: '01 · Product overview', datos: d, fotos: {} });
  })();

  // ---- 02 · Technology & material intelligence
  (function () {
    const p = pg(2), f = finder(p), d = comunes(2);
    d.system_logic = txt(f.get('SYSTEM LOGIC'));
    d.scientific_boundary = txt(f.get('SCIENTIFIC BOUNDARY'));
    d.materiales = f.under('MATERIAL ARCHITECTURE').map(function (b) { return { rol: '', nombre: b.rotulo, texto: txt(b) }; });
    const sueltos = f.get('_SUELTOS');
    d.cierre = sueltos ? txt(sueltos, ['serif']) : '';
    d.materiales.forEach(function (mm) { mm.rol = '[ROL DEL MATERIAL]'; mm.corto = '[Texto corto del material]'; });
    if (d.materiales.length) pend.push('02 · Rol de cada material (p. ej. «STRUCTURAL TEXTILE»): en el PDF guía está dentro de una imagen.');
    pend.push('02 · Fotos de textura: se recortan del PDF guía (≈200 dpi). Reemplazar por los originales para imprenta.');
    pend.push('02 · Infografía de rayos X de materiales: cargar la ilustración.');
    paginas.push({ id: 'f02', plantilla: 'F02', seccion: 'Ficha técnica', titulo: '02 · Technology & material intelligence', datos: d, fotos: {} });
  })();

  // ---- 03 · Product engineering
  (function () {
    const p = pg(3), f = finder(p), d = comunes(3);
    const s = f.get('_SUELTOS');
    d.nota = s ? txt(s, ['italica']) : '';
    d.detalles = f.under('ENGINEERED DETAIL VIEWS').map(item);
    d.features = f.under('ENGINEERED PRODUCT FEATURES').map(item);
    pend.push('03 · Título del stage y los 4 callouts (zona + texto + posición): en el PDF guía están dentro de una imagen.');
    pend.push('03 · Figura frontal de ingeniería: cargar la ilustración.');
    paginas.push({ id: 'f03', plantilla: 'F03', seccion: 'Ficha técnica', titulo: '03 · Product engineering', datos: d, fotos: {} });
  })();

  // ---- 04 · Component engineering
  (function () {
    const p = pg(4), f = finder(p), d = comunes(4);
    const rel = f.all.find(function (b) { return /COMPONENT RELATIONSHIP|PRODUCT CONSTRUCTION/.test(b.clave); });
    if (rel) { d.relacion_label = rel.rotulo; d.relacion = f.under(rel.clave).map(item); }
    d.credenciales = f.under('MATERIAL CREDENTIALS').filter(function (b) { return b.clave !== 'MATERIAL SYSTEM'; }).map(item);
    d.sistema = txt(f.get('MATERIAL SYSTEM'));
    pend.push('04 · Los 3 callouts del stage (zona + texto + posición): en el PDF guía están dentro de una imagen.');
    pend.push('04 · Figura 3/4 con el componente resaltado: cargar la ilustración.');
    paginas.push({ id: 'f04', plantilla: 'F04', seccion: 'Ficha técnica', titulo: '04 · Component engineering', datos: d, fotos: {} });
  })();

  // ---- 05 · Size & measurement
  (function () {
    const p = pg(5), f = finder(p), d = comunes(5);
    d.uso = txt(f.get('INTENDED PROFESSIONAL USE'));
    const ap = f.get('POTENTIAL PROFESSIONAL APPLICATIONS');
    d.aplicaciones = ap ? ap.contenido.filter(function (c) { return c.tipo === 'vineta'; }).map(function (c) { return c.texto; }) : [];
    d.aplicaciones_nota = ap ? ap.contenido.filter(function (c) { return c.tipo !== 'vineta'; }).map(function (c) { return c.texto; }).join(' ') : '';
    const ts = f.get('AVAILABLE SIZES');
    d.tallas = txt(ts, ['destacado']) || txt(ts);
    d.colores = txt(f.get('AVAILABLE COLORS'));
    d.medidas = txt(f.get('PATIENT MEASUREMENTS'));
    // la nota bajo la tabla (texto pequeño) cae en la columna de tallas
    const su = f.get('_SUELTOS');
    d.tabla_nota = (su ? txt(su, ['texto', 'italica']) : '') || (ts ? txt(ts, ['texto']) : '');
    const fv = f.get('FRONT VIEW'), pv = f.all.find(function (b) { return /REFERENCE VIEW|POSTERIOR/.test(b.clave) && !b.contenido.length; });
    if (fv) d.cap_frente = fv.rotulo;
    if (pv) d.cap_espalda = pv.rotulo;
    if (p.tabla) d.tabla = p.tabla; else pend.push('05 · Tabla de tallas no reconocida.');
    d.medir = f.under('HOW TO MEASURE').map(item);
    // Nota de la tabla: texto pequeño suelto bajo la tabla
    pend.push('05 · Figura de medidas: cargar la ilustración del cuerpo y ajustar la posición de las 3 cintas.');
    paginas.push({ id: 'f05', plantilla: 'F05', seccion: 'Ficha técnica', titulo: '05 · Size & measurement', datos: d, fotos: {} });
  })();

  // ---- 06 · Professional fitting & care
  (function () {
    const p = pg(6), f = finder(p), d = comunes(6);
    const seq = f.all.find(function (b) { return /FITTING SEQUENCE|HOW TO WEAR/.test(b.clave); });
    if (seq) { d.secuencia_label = seq.rotulo; d.pasos = f.under(seq.clave).filter(function (b) { return b.numero; }).map(function (b) { return { numero: b.numero || '', titulo: b.rotulo, texto: txt(b) }; }); }
    const fc = f.get('PROFESSIONAL FIT CHECK'), kp = f.get('KEY PRECAUTIONS');
    d.fitcheck = fc ? fc.contenido.map(function (c) { return c.texto; }) : [];
    d.precauciones = kp ? kp.contenido.map(function (c) { return c.texto; }) : [];
    d.metodo = txt(f.get('CARE METHOD'));
    d.proteccion = txt(f.get('MATERIAL PROTECTION'));
    d.cuidados = [];
    pend.push('06 · Íconos de cuidado: en el PDF guía son una imagen. Elegir íconos y escribir sus rótulos.');
    paginas.push({ id: 'f06', plantilla: 'F06', seccion: 'Ficha técnica', titulo: '06 · Professional fitting & care', datos: d, fotos: {} });
  })();

  // ---- 07 · Regulatory & quality
  (function () {
    const p = pg(7), f = finder(p), d = comunes(7);
    const perfSec = f.all.find(function (b) { return /PROFESSIONAL USE$/.test(b.clave) && b.contenido.length === 0 && b.size >= 8 && /·/.test(b.rotulo); });
    const perfY = perfSec ? perfSec.y : 1e9;
    d.regulatorio = f.all.filter(function (b) { return b.y < perfY && b.contenido.length && b.clave !== '_SUELTOS'; }).map(function (b) { return { rotulo: b.rotulo, contenido: b.contenido }; });
    if (perfSec) { d.perf_label = perfSec.rotulo; d.desempeno = f.under(perfSec.clave).map(item); }
    d.meta = pg(1).meta || []; // el cierre repite sistema y línea de producto
    paginas.push({ id: 'f07', plantilla: 'F07', seccion: 'Ficha técnica', titulo: '07 · Regulatory & quality', datos: d, fotos: {} });
  })();

  return { tipo: 'ficha', version: 1, producto: { nombre: nombre, ref: ref, linea: linea }, marca: {}, paginas: paginas, pendientes: pend };
}

// Asignación de las imágenes extraídas del PDF guía a las ranuras de la ficha (propuesta, revisable)
function assignImages(ficha, imgs) {
  const byPage = function (n) { return imgs.filter(function (i) { return i.pagina === n; }); };
  const set = function (pid, slot, file, enc) {
    const p = ficha.paginas.find(function (x) { return x.id === pid; });
    if (!p || !file) return;
    p.fotos[slot] = file;
    if (enc) { p.encuadre = p.encuadre || {}; p.encuadre[slot] = enc; }
  };
  // Fotos de producto: las dos imágenes verticales grandes de la página 1
  const p1 = byPage(1).filter(function (i) { return i.h > i.w; }).sort(function (a, b) { return b.w * b.h - a.w * a.h; });
  if (p1[0]) { set('f01', 'foto_frente', p1[0].archivo); set('f05', 'foto_frente', p1[0].archivo); }
  if (p1[1]) { set('f01', 'foto_espalda', p1[1].archivo); set('f05', 'foto_espalda', p1[1].archivo); }
  // Texturas: recortes de la composición de materiales de la página 2 (plantilla guía MED)
  const comp = byPage(2).sort(function (a, b) { return b.w * b.h - a.w * a.h; })[0];
  if (comp) {
    [[0.039, 0.305], [0.358, 0.616], [0.684, 0.945]].forEach(function (c, i) {
      set('f02', 'textura' + (i + 1), comp.archivo, { crop: { x: c[0], y: 0.2, w: c[1] - c[0], h: 0.215 } });
    });
  }
  // Vistas de detalle (página 3) y pasos de colocación (página 6): imágenes pequeñas en orden
  byPage(3).filter(function (i) { return i.w < 900; }).slice(0, 4).forEach(function (im, i) { set('f03', 'detalle' + (i + 1), im.archivo); });
  byPage(6).filter(function (i) { return i.w < 900; }).slice(0, 5).forEach(function (im, i) { set('f06', 'paso' + (i + 1), im.archivo); });
}

// Proceso completo: PDF guía → carpeta de proyecto lista para revisar y exportar
async function fromPdf(pdfFile, projectDir, opts) {
  const sharp = require('sharp');
  const buf = fs.readFileSync(pdfFile);
  const est = await guia.read(buf);
  const fotos = path.join(projectDir, 'entrada', 'fotos');
  fs.mkdirSync(fotos, { recursive: true });
  const imgs = await guia.extractImages(est._pages, fotos, sharp);
  // Las dos líneas de marca de la cabecera izquierda se leen del PDF (página 1)
  const head = est._pages[0].items.filter(function (it) { return it.y < 70 && it.x < 300 && !/^MED$/.test(it.str.trim()); }).sort(function (a, b) { return a.y - b.y; });
  const marca = { l1: head[0] ? head[0].str.trim() : '', l2: head[1] ? head[1].str.trim() : '' };
  const ficha = build({ paginas: est.paginas }, Object.assign({ marca: marca }, opts || {}));
  assignImages(ficha, imgs);
  ficha.fuente = path.basename(pdfFile);
  return { ficha: ficha, imagenes: imgs, estructura: est.paginas };
}

module.exports = { build, fromPdf, assignImages };
