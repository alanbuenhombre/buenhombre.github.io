// Regla «corte en la mandíbula» (sección 7 del brief). Determinista, sin IA.
'use strict';

// img: { w, h } en px de la imagen original
// frame: { W, H } tamaño del marco
// opts: { jawY 0–1, subjectX 0–1, targetX 0–1 (0.5), zoom (≥1) }
// Devuelve la caja de la imagen relativa al marco: { left, top, width, height }
function jawCrop(img, frame, opts) {
  const ar = img.w / img.h;
  const jawY = clamp(opts.jawY == null ? 0.25 : +opts.jawY, 0, 0.9);
  const subjectX = opts.subjectX == null ? 0.5 : +opts.subjectX;
  const targetX = opts.targetX == null ? 0.5 : +opts.targetX;
  const zoom = Math.max(1, opts.zoom == null ? 1 : +opts.zoom);
  const Hi = Math.max(frame.H / (1 - jawY), frame.W / ar) * zoom; // alto renderizado
  const Wi = Hi * ar;
  const top = -jawY * Hi; // la mandíbula queda en el borde superior del marco
  const left = clamp(targetX * frame.W - subjectX * Wi, frame.W - Wi, 0);
  return { left: left, top: top, width: Wi, height: Hi };
}

// Recorte normal (object-fit: cover) con punto de foco, para fotos sin personas
function coverCrop(img, frame, focusX, focusY) {
  const s = Math.max(frame.W / img.w, frame.H / img.h);
  const Wi = img.w * s, Hi = img.h * s;
  const fx = focusX == null ? 0.5 : focusX, fy = focusY == null ? 0.5 : focusY;
  return {
    left: clamp(frame.W / 2 - fx * Wi, frame.W - Wi, 0),
    top: clamp(frame.H / 2 - fy * Hi, frame.H - Hi, 0),
    width: Wi, height: Hi
  };
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

module.exports = { jawCrop, coverCrop };
