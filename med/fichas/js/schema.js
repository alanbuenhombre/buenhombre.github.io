/* MED Fichas · Esquema de producto, paleta y utilidades de datos.
   El JSON de producto es la única fuente de verdad: la extracción lo llena, Alan lo revisa
   y el render lo diagrama. Lo que no se extrae con seguridad queda en `revisar`. */
(function () {
  'use strict';

  // Paleta Clinical aprobada. No se usan colores fuera de ella.
  const PALETTE = {
    teal: '#2E4A52',      // Deep MED Teal
    ivory: '#F8F7F4',     // Clinical Ivory
    titanium: '#C2CCD2',  // Titanium
    graphite: '#222223',  // Graphite
    steel: '#5B7282'      // Steel Blue
  };

  // Color por línea de producto (solo color y nombre, sin ícono)
  const LINES = {
    clinical: { name: 'Clinical', color: '#2E4A52' },
    performance: { name: 'Performance', color: '#5B7282' },
    'body-daily': { name: 'Body Daily', color: '#C2B8AD' },
    maternity: { name: 'Maternity', color: '#C9A99A' }
  };

  // Títulos de módulo. El copy del producto nunca se traduce; solo estos rótulos del sistema.
  const LABELS = {
    es: {
      coverage: 'Anatomical Coverage', materials: 'Materiales', mainMaterial: 'Material principal',
      xray: 'Estructura', sizes: 'Guía de tallas', howTo: 'Cómo medir', size: 'Talla', unit: 'Medida',
      view: 'Ver producto', composition: 'Composición'
    },
    en: {
      coverage: 'Anatomical Coverage', materials: 'Materials', mainMaterial: 'Main material',
      xray: 'Structure', sizes: 'Size guide', howTo: 'How to measure', size: 'Size', unit: 'Measure',
      view: 'View product', composition: 'Composition'
    }
  };

  // Módulos disponibles (sección 5 del brief). Los marcados `ready` están implementados.
  const MODULES = [
    { id: 'cover', page: '01', name: 'Portada / Anatomical Coverage', ready: true },
    { id: 'materials', page: '02', name: 'Materiales', ready: true },
    { id: 'construction', page: '03', name: 'Detalles de construcción', ready: false },
    { id: 'sizes', page: '05', name: 'Guía de tallas', ready: true },
    { id: 'closing', page: '07', name: 'Cierre', ready: false }
  ];

  function empty() {
    return {
      esquema: 'med.ficha.v1',
      idioma: 'es',
      linea: 'clinical',
      modulos: ['cover', 'materials', 'sizes'],
      producto: { nombre: '', referencia: '', categoria: '', bajada: '', descripcion: '', url: '' },
      cobertura: {
        figuras: [],          // [{ imagen: id, vista: 'Frente' }]
        zonas: []             // [{ nombre, texto, figura: 0, x: 0..1, y: 0..1 }]
      },
      materiales: {
        lista: [],            // [{ nombre, composicion: [{ fibra, pct }], descripcion, propiedades: [], textura: id, principal: bool }]
        rayos_x: '',          // id de imagen
        rayos_x_nota: ''
      },
      tallas: {
        unidad: 'cm',
        tallas: [],           // ['XS','S',...]
        medidas: [],          // [{ nombre, valores: [], cinta: { y, x1, x2 } }]
        figura: '',
        nota: '',
        como_medir: { pasos: [], ilustracion: '' }
      },
      imagenes: {},           // id → { nombre, src (data URL), ancho, alto, tipo }
      sin_asignar: [],        // secciones de la ficha original que no tienen módulo todavía: [{ titulo, texto }]
      revisar: []             // rutas pendientes de revisión, p. ej. "producto.nombre"
    };
  }

  // ---- rutas tipo "materiales.lista.0.nombre" ----
  function getPath(o, p) {
    return p.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o);
  }
  function setPath(o, p, v) {
    const ks = p.split('.');
    let a = o;
    for (let i = 0; i < ks.length - 1; i++) {
      if (a[ks[i]] == null) a[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {};
      a = a[ks[i]];
    }
    a[ks[ks.length - 1]] = v;
  }
  function flag(d, p) { if (d.revisar.indexOf(p) < 0) d.revisar.push(p); }
  function unflag(d, prefix) {
    d.revisar = d.revisar.filter(function (p) { return p !== prefix && p.indexOf(prefix + '.') !== 0; });
  }
  function isFlagged(d, prefix) {
    return d.revisar.some(function (p) { return p === prefix || p.indexOf(prefix + '.') === 0; });
  }

  // Normaliza un JSON cargado: completa campos faltantes sin tocar los existentes.
  function normalize(d) {
    const base = empty();
    const merge = function (a, b) {
      Object.keys(a).forEach(function (k) {
        if (b[k] === undefined) b[k] = a[k];
        else if (a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) && typeof b[k] === 'object') merge(a[k], b[k]);
      });
      return b;
    };
    d = merge(base, d || {});
    if (!LINES[d.linea]) d.linea = 'clinical';
    d.materiales.lista.forEach(function (m) {
      m.composicion = m.composicion || []; m.propiedades = m.propiedades || [];
    });
    d.tallas.medidas.forEach(function (m) { m.valores = m.valores || []; });
    return d;
  }

  // Problemas que impiden o afean el render (se muestran como avisos, nunca se "arreglan" solos)
  function validate(d) {
    const out = [];
    const p = d.producto;
    if (!p.nombre) out.push({ path: 'producto.nombre', msg: 'Falta el nombre del producto.' });
    if (!p.referencia) out.push({ path: 'producto.referencia', msg: 'Falta la referencia.' });
    d.materiales.lista.forEach(function (m, i) {
      const sum = m.composicion.reduce(function (a, c) { return a + (+c.pct || 0); }, 0);
      if (m.composicion.length && Math.round(sum) !== 100) out.push({ path: 'materiales.lista.' + i, msg: 'La composición de «' + m.nombre + '» suma ' + sum + ' %.' });
    });
    if (d.materiales.lista.length && !d.materiales.lista.some(function (m) { return m.principal; })) {
      out.push({ path: 'materiales.lista', msg: 'Ningún material está marcado como principal.' });
    }
    const n = d.tallas.tallas.length;
    d.tallas.medidas.forEach(function (m, i) {
      if (m.valores.length !== n) out.push({ path: 'tallas.medidas.' + i, msg: '«' + m.nombre + '» tiene ' + m.valores.length + ' valores para ' + n + ' tallas.' });
    });
    if (d.revisar.length) out.push({ path: '', msg: d.revisar.length + ' campo(s) marcados «revisar».' });
    return out;
  }

  // Contraste: color de texto sobre un fondo de la paleta
  function lum(hex) {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function inkOn(bg) { return lum(bg) > 0.3 ? PALETTE.graphite : PALETTE.ivory; }
  // Mezcla de dos colores de la paleta (para el fondo más oscuro de «Cómo medir»)
  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = function (s) { return Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t); };
    return '#' + [16, 8, 0].map(function (s) { return ch(s).toString(16).padStart(2, '0'); }).join('').toUpperCase();
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  window.MedSchema = {
    PALETTE: PALETTE, LINES: LINES, LABELS: LABELS, MODULES: MODULES,
    empty: empty, normalize: normalize, validate: validate,
    getPath: getPath, setPath: setPath, flag: flag, unflag: unflag, isFlagged: isFlagged,
    inkOn: inkOn, mix: mix, lum: lum, clone: clone
  };
})();
