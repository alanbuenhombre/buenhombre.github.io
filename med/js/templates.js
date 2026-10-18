/* Med · Formatos de salida y plantillas editoriales.
   Todo es local: las tipografías están en /fonts y son las mismas de Google Fonts
   que Figma trae instaladas, para que el editable conserve el diseño. */
(function () {
  'use strict';

  // w/h en la unidad del formato. Impresos en pt (Figma usa 1pt = 1px en sus presets
  // carta/tabloide), digitales en px. base = tamaño del cuerpo de texto.
  const FORMATS = [
    { id: 'carta', name: 'Carta', note: '8,5 × 11 in', w: 612, h: 792, unit: 'pt', base: 10,
      margin: [58, 50, 64, 50], cols: 2, print: true, chapterBreak: true, sectionBreak: false },
    { id: 'media-carta', name: 'Media carta', note: '5,5 × 8,5 in', w: 396, h: 612, unit: 'pt', base: 9,
      margin: [44, 36, 50, 36], cols: 1, print: true, chapterBreak: true, sectionBreak: false },
    { id: 'tabloide', name: 'Tabloide', note: '11 × 17 in', w: 792, h: 1224, unit: 'pt', base: 11,
      margin: [72, 60, 80, 60], cols: 3, print: true, chapterBreak: true, sectionBreak: false },
    { id: 'widescreen', name: 'Widescreen', note: '1920 × 1080 px · 16:9', w: 1920, h: 1080, unit: 'px', base: 27,
      margin: [120, 150, 120, 150], cols: 2, print: false, chapterBreak: true, sectionBreak: true },
    { id: 'mobile', name: 'Mobile', note: '1080 × 1920 px · 9:16', w: 1080, h: 1920, unit: 'px', base: 38,
      margin: [170, 96, 170, 96], cols: 1, print: false, chapterBreak: true, sectionBreak: true }
  ];

  // Roles tipográficos. Cada uno se traduce a variables CSS --<rol>-f/-w/-st/-z/-lh/-ls/-c/-tt.
  const ROLE_NAMES = {
    title: 'Título de portada', sub: 'Subtítulo de portada', kicker: 'Antetítulo / etiqueta',
    h1: 'Capítulo', h2: 'Sección', h3: 'Subsección', lead: 'Entradilla', body: 'Cuerpo',
    quote: 'Cita destacada', caption: 'Pie de foto', table: 'Tabla', folio: 'Folio'
  };

  function r(f, w, z, lh, extra) {
    return Object.assign({ f: f, w: w, st: 'normal', z: z, lh: lh, ls: 0, c: 'ink', tt: 'none' }, extra || {});
  }

  const TEMPLATES = [
    {
      id: 'clasico', name: 'Editorial clásico',
      description: 'Serif de alto contraste, cuerpo en serif de lectura y etiquetas en sans. Revista / informe anual.',
      fonts: ['Playfair Display', 'Source Serif 4', 'Inter'],
      colors: { paper: '#FBFAF7', ink: '#1C1B19', muted: '#6E6A62', accent: '#9A2F1F', soft: '#EFEBE3', coverPaper: '#FBFAF7', coverInk: '#1C1B19' },
      roles: {
        title: r('Playfair Display', 400, 4.8, 1.02, { ls: -0.01 }),
        sub: r('Source Serif 4', 400, 1.45, 1.32, { st: 'italic', c: 'muted' }),
        kicker: r('Inter', 600, 0.7, 1.3, { ls: 0.16, c: 'accent', tt: 'uppercase' }),
        h1: r('Playfair Display', 400, 3.1, 1.06, { ls: -0.005 }),
        h2: r('Playfair Display', 700, 1.6, 1.16),
        h3: r('Inter', 600, 0.78, 1.35, { ls: 0.1, tt: 'uppercase' }),
        lead: r('Source Serif 4', 400, 1.3, 1.42, { st: 'italic' }),
        body: r('Source Serif 4', 400, 1, 1.48),
        quote: r('Playfair Display', 400, 1.55, 1.24, { st: 'italic', c: 'accent' }),
        caption: r('Inter', 400, 0.7, 1.4, { c: 'muted' }),
        table: r('Inter', 400, 0.76, 1.38),
        folio: r('Inter', 500, 0.66, 1.2, { ls: 0.08, c: 'muted', tt: 'uppercase' })
      }
    },
    {
      id: 'suizo', name: 'Suizo / retícula',
      description: 'Una sola familia sans, retícula estricta, rojo de acento y números de capítulo grandes.',
      fonts: ['Inter'],
      colors: { paper: '#FFFFFF', ink: '#111111', muted: '#77746F', accent: '#E2231A', soft: '#F1F1EF', coverPaper: '#FFFFFF', coverInk: '#111111' },
      roles: {
        title: r('Inter', 800, 5.4, 0.96, { ls: -0.04 }),
        sub: r('Inter', 500, 1.35, 1.28, { ls: -0.01, c: 'muted' }),
        kicker: r('Inter', 700, 0.72, 1.3, { ls: 0.06, c: 'accent', tt: 'uppercase' }),
        h1: r('Inter', 700, 3.3, 1.0, { ls: -0.035 }),
        h2: r('Inter', 700, 1.38, 1.15, { ls: -0.015 }),
        h3: r('Inter', 600, 0.95, 1.3),
        lead: r('Inter', 500, 1.32, 1.32, { ls: -0.01 }),
        body: r('Inter', 400, 0.94, 1.48),
        quote: r('Inter', 700, 1.6, 1.16, { ls: -0.02, c: 'accent' }),
        caption: r('Inter', 400, 0.72, 1.38, { c: 'muted' }),
        table: r('Inter', 400, 0.78, 1.36),
        folio: r('Inter', 700, 0.68, 1.2, { c: 'ink' })
      }
    },
    {
      id: 'catalogo', name: 'Catálogo cálido',
      description: 'Serif display con cursivas, sans geométrica, papel crema y terracota. Catálogos y portafolios.',
      fonts: ['DM Serif Display', 'DM Sans'],
      colors: { paper: '#F5F0E7', ink: '#2A2420', muted: '#8A7E71', accent: '#B4532F', soft: '#EAE1D2', coverPaper: '#2A2420', coverInk: '#F5F0E7' },
      roles: {
        title: r('DM Serif Display', 400, 5.0, 1.0, { ls: -0.01, c: 'coverInk' }),
        sub: r('DM Serif Display', 400, 1.55, 1.25, { st: 'italic', c: 'coverInk' }),
        kicker: r('DM Sans', 700, 0.7, 1.3, { ls: 0.18, c: 'accent', tt: 'uppercase' }),
        h1: r('DM Serif Display', 400, 3.1, 1.04),
        h2: r('DM Serif Display', 400, 1.65, 1.15),
        h3: r('DM Sans', 700, 0.76, 1.35, { ls: 0.14, c: 'accent', tt: 'uppercase' }),
        lead: r('DM Serif Display', 400, 1.4, 1.32, { st: 'italic' }),
        body: r('DM Sans', 400, 0.94, 1.52),
        quote: r('DM Serif Display', 400, 1.7, 1.18, { st: 'italic', c: 'accent' }),
        caption: r('DM Sans', 400, 0.72, 1.4, { st: 'italic', c: 'muted' }),
        table: r('DM Sans', 400, 0.78, 1.38),
        folio: r('DM Sans', 500, 0.68, 1.2, { ls: 0.1, c: 'muted', tt: 'uppercase' })
      }
    },
    {
      id: 'contemporaneo', name: 'Contemporáneo',
      description: 'Fraunces ligera y IBM Plex Sans, portada oscura y bandas de capítulo. Presentaciones y reportes.',
      fonts: ['Fraunces', 'IBM Plex Sans'],
      colors: { paper: '#F7F6F2', ink: '#16181C', muted: '#6C6F75', accent: '#3E6B4F', soft: '#E9E8E2', coverPaper: '#16181C', coverInk: '#F7F6F2', band: '#16181C', bandInk: '#F7F6F2' },
      roles: {
        title: r('Fraunces', 300, 5.1, 0.98, { ls: -0.025, c: 'coverInk' }),
        sub: r('Fraunces', 300, 1.5, 1.28, { st: 'italic', c: 'coverInk' }),
        kicker: r('IBM Plex Sans', 600, 0.7, 1.3, { ls: 0.14, c: 'accent', tt: 'uppercase' }),
        h1: r('Fraunces', 300, 3.2, 1.02, { ls: -0.02, c: 'bandInk' }),
        h2: r('Fraunces', 600, 1.5, 1.16, { ls: -0.01 }),
        h3: r('IBM Plex Sans', 600, 0.78, 1.35, { ls: 0.1, c: 'accent', tt: 'uppercase' }),
        lead: r('Fraunces', 300, 1.42, 1.34, { st: 'italic' }),
        body: r('IBM Plex Sans', 400, 0.92, 1.52),
        quote: r('Fraunces', 300, 1.75, 1.18, { st: 'italic', c: 'accent' }),
        caption: r('IBM Plex Sans', 400, 0.7, 1.4, { c: 'muted' }),
        table: r('IBM Plex Sans', 400, 0.76, 1.38),
        folio: r('IBM Plex Sans', 500, 0.66, 1.2, { ls: 0.08, c: 'muted', tt: 'uppercase' })
      }
    }
  ];

  // Familias de respaldo cuando el usuario no tiene una fuente (CSS) o Figma no la encuentra.
  const FALLBACKS = {
    'Source Serif 4': ['Source Serif Pro', 'Georgia', 'Times New Roman'],
    'Playfair Display': ['Playfair', 'Georgia'],
    'DM Serif Display': ['DM Serif Text', 'Georgia'],
    'DM Sans': ['Inter', 'Helvetica Neue', 'Arial'],
    'Fraunces': ['Georgia'],
    'IBM Plex Sans': ['Inter', 'Helvetica Neue', 'Arial'],
    'Inter': ['Helvetica Neue', 'Arial']
  };

  function fontStack(f) {
    const serif = /serif|playfair|fraunces|georgia|times|garamond|caslon|bodoni/i.test(f) && !/sans/i.test(f);
    return [f].concat(FALLBACKS[f] || []).map(function (x) { return '"' + x + '"'; }).join(', ') + (serif ? ', serif' : ', sans-serif');
  }

  // Variables CSS para un formato + plantilla.
  function cssVars(fmt, tpl) {
    const v = {};
    const u = fmt.unit;
    v['--pw'] = fmt.w + u;
    v['--ph'] = fmt.h + u;
    v['--base'] = fmt.base + u;
    v['--mt'] = fmt.margin[0] + u; v['--mr'] = fmt.margin[1] + u;
    v['--mb'] = fmt.margin[2] + u; v['--ml'] = fmt.margin[3] + u;
    const c = Object.assign({ band: tpl.colors.ink, bandInk: tpl.colors.paper }, tpl.colors);
    Object.keys(c).forEach(function (k) { v['--c-' + k] = c[k]; });
    Object.keys(tpl.roles).forEach(function (k) {
      const x = tpl.roles[k];
      v['--' + k + '-f'] = fontStack(x.f);
      v['--' + k + '-w'] = String(x.w);
      v['--' + k + '-st'] = x.st;
      v['--' + k + '-z'] = x.z + 'em';
      v['--' + k + '-lh'] = String(x.lh);
      v['--' + k + '-ls'] = x.ls + 'em';
      v['--' + k + '-c'] = 'var(--c-' + x.c + ')';
      v['--' + k + '-tt'] = x.tt;
    });
    return v;
  }

  // Ficha tipográfica legible: qué fuente, peso y tamaño usa cada rol en este formato.
  const WEIGHT_NAMES = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };
  function typeSpec(fmt, tpl) {
    return Object.keys(ROLE_NAMES).filter(function (k) { return tpl.roles[k]; }).map(function (k) {
      const x = tpl.roles[k];
      const size = Math.round(fmt.base * x.z * 10) / 10;
      const lead = Math.round(size * x.lh * 10) / 10;
      let style = WEIGHT_NAMES[x.w] || String(x.w);
      if (x.st === 'italic') style = style === 'Regular' ? 'Italic' : style + ' Italic';
      return {
        role: k, name: ROLE_NAMES[k], family: x.f, style: style,
        size: size, leading: lead, unit: fmt.unit, color: tpl.colors[x.c] || x.c,
        tracking: Math.round(x.ls * 1000), upper: x.tt === 'uppercase'
      };
    });
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  window.MedTemplates = {
    FORMATS: FORMATS, TEMPLATES: TEMPLATES, ROLE_NAMES: ROLE_NAMES, FALLBACKS: FALLBACKS,
    cssVars: cssVars, typeSpec: typeSpec, fontStack: fontStack, clone: clone
  };
})();
