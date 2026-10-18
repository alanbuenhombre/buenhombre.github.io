/* MED Fichas · Exportación local.
   PDF de impresión (vectorial, imágenes a resolución original), PDF digital liviano
   (imágenes reducidas), PNG por página a 300/600 dpi y SVG por página para Figma o
   Illustrator. Los archivos se escriben en la carpeta que Alan elija; si el navegador
   no lo permite, se descargan (varios archivos van en un .zip). */
(function () {
  'use strict';

  // ---------- SVG para Figma / Illustrator ----------
  // Texto real (editable) con los nombres de familia del sistema; las ilustraciones SVG
  // van como vectores y las fotos embebidas.
  function svgFile(svg) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + svg.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
  }

  // ---------- PNG ----------
  let fontCss = null;
  function embeddedFonts() {
    if (fontCss) return fontCss;
    fontCss = (window.MED_FONT_DATA || []).map(function (f) {
      return '@font-face{font-family:"' + f.family + '";font-weight:' + f.weight + ';font-style:' + f.style + ';src:url(data:font/ttf;base64,' + f.b64 + ') format("truetype");}';
    }).join('');
    return fontCss;
  }
  function png(svg, dpi) {
    const scale = dpi / 72;
    const withFonts = svg.replace(/(<svg[^>]*>)/, '$1<defs><style>' + embeddedFonts() + '</style></defs>');
    return new Promise(function (res, rej) {
      const blob = new Blob([withFonts], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const im = new Image();
      im.onload = function () {
        // pequeña espera: las fuentes embebidas en una imagen SVG se decodifican en diferido
        setTimeout(function () {
          const c = document.createElement('canvas');
          c.width = Math.round(612 * scale); c.height = Math.round(792 * scale);
          const g = c.getContext('2d');
          g.drawImage(im, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          c.toBlob(function (b) { b ? res(b) : rej(new Error('No se pudo generar el PNG')); }, 'image/png');
        }, 150);
      };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('No se pudo rasterizar la página')); };
      im.src = url;
    });
  }

  // ---------- imágenes livianas para el PDF digital ----------
  async function makeLight(data, maxPx) {
    maxPx = maxPx || 1100;
    const ids = Object.keys(data.imagenes);
    for (const id of ids) {
      const im = data.imagenes[id];
      if (/svg/.test(im.tipo) || im.liviana || !(im.ancho > maxPx || im.alto > maxPx)) continue;
      im.liviana = await new Promise(function (res) {
        const i = new Image();
        i.onload = function () {
          const k = maxPx / Math.max(i.naturalWidth, i.naturalHeight);
          const c = document.createElement('canvas');
          c.width = Math.round(i.naturalWidth * k); c.height = Math.round(i.naturalHeight * k);
          c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', 0.82));
        };
        i.onerror = function () { res(null); };
        i.src = im.src;
      });
    }
  }

  // ---------- PDF (diálogo de impresión → «Guardar como PDF») ----------
  function print(pages) {
    let box = document.getElementById('print-pages');
    if (!box) { box = document.createElement('div'); box.id = 'print-pages'; document.body.appendChild(box); }
    box.innerHTML = pages.map(function (p) { return '<div class="print-page">' + p.svg + '</div>'; }).join('');
    return new Promise(function (res) {
      setTimeout(function () {
        window.print();
        setTimeout(function () { box.innerHTML = ''; res(); }, 500);
      }, 200);
    });
  }

  // ---------- ZIP (sin compresión, suficiente para empaquetar) ----------
  const CRC = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  async function zip(files) {
    const enc = new TextEncoder();
    const parts = [], central = [];
    let offset = 0;
    for (const f of files) {
      const data = f.data instanceof Blob ? new Uint8Array(await f.data.arrayBuffer()) : enc.encode(f.data);
      const name = enc.encode(f.name);
      const crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
      h.setUint16(26, name.length, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name);
      offset += 30 + name.length + data.length;
    }
    const size = central.reduce(function (a, b) { return a + b.length; }, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, size, true); e.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: 'application/zip' });
  }

  // ---------- guardar ----------
  let dir = null;
  async function chooseFolder() {
    if (!window.showDirectoryPicker) throw new Error('Este navegador no permite elegir carpeta; los archivos se descargarán.');
    dir = await window.showDirectoryPicker({ mode: 'readwrite' });
    return dir.name;
  }
  function download(name, blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  }
  // files: [{ name, data: Blob|string }]. zipName: nombre del .zip si hay que descargar varios.
  async function save(files, zipName) {
    if (dir) {
      for (const f of files) {
        const h = await dir.getFileHandle(f.name, { create: true });
        const w = await h.createWritable();
        await w.write(f.data); await w.close();
      }
      return 'Guardado en la carpeta «' + dir.name + '» (' + files.length + ' archivo' + (files.length > 1 ? 's' : '') + ').';
    }
    if (files.length === 1) {
      const f = files[0];
      download(f.name, f.data instanceof Blob ? f.data : new Blob([f.data]));
      return 'Descargado: ' + f.name;
    }
    download(zipName, await zip(files));
    return 'Descargado: ' + zipName;
  }

  window.MedExport = { svgFile: svgFile, png: png, makeLight: makeLight, print: print, zip: zip, save: save, chooseFolder: chooseFolder, hasFolder: function () { return dir ? dir.name : null; } };
})();
