// Sistema visual MED (sección 4 del brief). Única fuente de valores de diseño.
'use strict';

module.exports = {
  page: { width: 1056, height: 816, margin: 64, folio: { right: 64, bottom: 36 } },
  color: {
    teal: '#2E4A52', ink: '#141B1E', inkDeep: '#0D1B22', ivory: '#F8F7F4',
    stone: '#ECEAE5', cream: '#EFEAE2', steel: '#5B7282', line: '#C2CCD2',
    text: '#222223', goldLight: '#D9C29A', gold: '#B8975E'
  },
  type: {
    display: "font-family: 'Instrument Serif', serif; font-weight: 400",
    body: 'Manrope, sans-serif',
    mono: "font-family: 'IBM Plex Mono', monospace; font-size: 10px",
    bodySize: 14, bodyLine: 1.6, monoTracking: 1.6, kickerTracking: 2.4
  },
  titles: { chapter: 54, page: 40, poster: 88, productRef: 96 },
  // Fuentes empaquetadas (sin Google Fonts)
  fonts: [
    ['Instrument Serif', 400, 'normal', 'instrument-serif-latin-400-normal.woff2'],
    ['Instrument Serif', 400, 'italic', 'instrument-serif-latin-400-italic.woff2'],
    ['Manrope', 300, 'normal', 'manrope-latin-300-normal.woff2'],
    ['Manrope', 400, 'normal', 'manrope-latin-400-normal.woff2'],
    ['Manrope', 500, 'normal', 'manrope-latin-500-normal.woff2'],
    ['Manrope', 600, 'normal', 'manrope-latin-600-normal.woff2'],
    ['IBM Plex Mono', 400, 'normal', 'ibm-plex-mono-latin-400-normal.woff2'],
    ['IBM Plex Mono', 500, 'normal', 'ibm-plex-mono-latin-500-normal.woff2']
  ]
};
