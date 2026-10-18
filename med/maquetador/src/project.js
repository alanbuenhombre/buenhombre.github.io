// Proyectos locales: /proyectos/<nombre>/ con entrada/, rules.yaml, images.json, catalog.json,
// historial de versiones y exports/. Nada se escribe fuera de la carpeta del proyecto.
'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const sharp = require('sharp');

const ROOT = process.env.MED_PROYECTOS || path.join(__dirname, '..', 'proyectos');
const IMG_DIRS = ['entrada/fotos', 'entrada/ilustraciones', 'marca'];
const IMG_EXT = /\.(jpe?g|png|webp|svg)$/i;

function dirOf(name) {
  if (!/^[\w.-]+$/.test(name)) throw new Error('Nombre de proyecto inválido');
  const d = path.join(ROOT, name);
  if (!fs.existsSync(d)) throw new Error('No existe el proyecto ' + name);
  return d;
}
function list() {
  if (!fs.existsSync(ROOT)) return [];
  return fs.readdirSync(ROOT).filter(function (n) { return fs.existsSync(path.join(ROOT, n, 'rules.yaml')); });
}
function readJson(file, def) { return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : def; }
function rules(name) { return yaml.load(fs.readFileSync(path.join(dirOf(name), 'rules.yaml'), 'utf8')); }

// Ruta absoluta de una imagen por su id (= nombre de archivo), solo dentro del proyecto
function imagePath(name, id) {
  const d = dirOf(name);
  for (const sub of IMG_DIRS) {
    const f = path.join(d, sub, path.basename(id));
    if (fs.existsSync(f)) return f;
  }
  return null;
}

// Rol de una foto según la convención de nombres (rules.yaml → fotos)
function roleOf(file, R) {
  const fr = (R && R.fotos) || {};
  if (fr.ilustracion && file.toLowerCase().indexOf(fr.ilustracion) >= 0) return 'ilustracion';
  const m = file.match(/^MED_([A-Z])-/);
  if (m && fr.prefijos && fr.prefijos[m[1]]) return fr.prefijos[m[1]];
  if (/^MED_I-/.test(file)) return 'ilustracion';
  return 'otra';
}

// Propuesta de mandíbula sin IA: caja del sujeto por contraste con el fondo (bordes);
// jawY arranca en el 12 % del alto de esa caja; subjectX = centro de masa del sujeto.
async function proposeJaw(file) {
  const W = 96;
  const { data, info } = await sharp(file).resize(W).greyscale().raw().toBuffer({ resolveWithObject: true });
  const H = info.height;
  const border = [];
  for (let x = 0; x < W; x++) { border.push(data[x], data[(H - 1) * W + x]); }
  for (let y = 0; y < H; y++) { border.push(data[y * W], data[y * W + W - 1]); }
  border.sort(function (a, b) { return a - b; });
  const bg = border[Math.floor(border.length / 2)];
  let top = -1, bottom = -1, sx = 0, n = 0;
  for (let y = 0; y < H; y++) {
    let row = 0;
    for (let x = 0; x < W; x++) { if (Math.abs(data[y * W + x] - bg) > 26) { row++; sx += x; n++; } }
    if (row > W * 0.04) { if (top < 0) top = y; bottom = y; }
  }
  if (top < 0 || !n) return { jawY: 0.25, subjectX: 0.5, auto: true, fiable: false };
  const boxH = bottom - top + 1;
  return { jawY: round((top + 0.12 * boxH) / H), subjectX: round(sx / n / W), auto: true, fiable: true };
}
function round(n) { return Math.round(n * 1000) / 1000; }

// Escanea las imágenes del proyecto y completa images.json (sin pisar ajustes manuales)
async function scanImages(name) {
  const d = dirOf(name), R = rules(name);
  const file = path.join(d, 'images.json');
  const imgs = readJson(file, {});
  const personas = (R.fotos && R.fotos.personas) || [];
  for (const sub of IMG_DIRS) {
    const dd = path.join(d, sub);
    if (!fs.existsSync(dd)) continue;
    for (const f of fs.readdirSync(dd).filter(function (x) { return IMG_EXT.test(x); }).sort()) {
      const cur = imgs[f] || {};
      if (!cur.w) {
        const meta = await sharp(path.join(dd, f)).metadata();
        cur.w = meta.width; cur.h = meta.height;
      }
      cur.carpeta = sub;
      cur.rol = cur.rol || roleOf(f, R);
      if (cur.persona == null) cur.persona = personas.indexOf(cur.rol) >= 0;
      if (cur.persona && cur.jawY == null) Object.assign(cur, await proposeJaw(path.join(dd, f)));
      imgs[f] = cur;
    }
  }
  Object.keys(imgs).forEach(function (k) { if (!imagePath(name, k)) delete imgs[k]; });
  fs.writeFileSync(file, JSON.stringify(imgs, null, 2));
  return imgs;
}
function images(name) { return readJson(path.join(dirOf(name), 'images.json'), {}); }
function saveImages(name, imgs) { fs.writeFileSync(path.join(dirOf(name), 'images.json'), JSON.stringify(imgs, null, 2)); }

function catalog(name) { return readJson(path.join(dirOf(name), 'catalog.json'), null); }

// Guarda con historial: la versión anterior va a .historial/ con fecha
function saveCatalog(name, cat) {
  const d = dirOf(name), f = path.join(d, 'catalog.json'), h = path.join(d, '.historial');
  if (fs.existsSync(f)) {
    fs.mkdirSync(h, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(f, path.join(h, 'catalog-' + ts + '.json'));
    const old = fs.readdirSync(h).sort();
    while (old.length > 200) fs.unlinkSync(path.join(h, old.shift()));
  }
  cat.actualizado = new Date().toISOString();
  fs.writeFileSync(f, JSON.stringify(cat, null, 2));
}
function history(name) {
  const h = path.join(dirOf(name), '.historial');
  return fs.existsSync(h) ? fs.readdirSync(h).sort().reverse() : [];
}
// Deshacer: vuelve a la última versión guardada (la actual pasa al historial como «rehacer»)
function undo(name) {
  const d = dirOf(name), h = path.join(d, '.historial'), list = history(name);
  if (!list.length) return null;
  const prev = path.join(h, list[0]);
  const cur = path.join(d, 'catalog.json');
  fs.copyFileSync(cur, path.join(h, 'deshecho-' + list[0]));
  fs.copyFileSync(prev, cur);
  fs.unlinkSync(prev);
  return catalog(name);
}
function restore(name, version) {
  const f = path.join(dirOf(name), '.historial', path.basename(version));
  if (!fs.existsSync(f)) throw new Error('Versión no encontrada');
  const cat = JSON.parse(fs.readFileSync(f, 'utf8'));
  saveCatalog(name, cat);
  return cat;
}

module.exports = { ROOT, dirOf, list, rules, imagePath, roleOf, proposeJaw, scanImages, images, saveImages, catalog, saveCatalog, history, undo, restore };
