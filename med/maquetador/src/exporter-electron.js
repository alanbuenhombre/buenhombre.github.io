// Exportación dentro de la app de escritorio: en vez del Chromium de Playwright usa una ventana
// oculta de Electron (mismo motor). Expone la mínima interfaz que usa exporter.js
// (browser → ctx.newPage / b.newPage → setViewportSize, goto, evaluate, pdf, screenshot).
// Una sola ventana se reutiliza para todas las páginas: crear una segunda ventana oculta
// tras destruir la primera deja de cargar archivos locales.
'use strict';

const fs = require('fs');
const netguard = require('./netguard');

const PARTITION = 'med-export';

function withTimeout(p, ms, what) {
  return Promise.race([p, new Promise(function (_, ko) { setTimeout(function () { ko(new Error('Tiempo agotado: ' + what)); }, ms); })]);
}

class Page {
  constructor(win, scale) { this.win = win; this.scale = scale || 1; }
  async setViewportSize(s) {
    const cur = this.win.getContentSize();
    if (cur[0] !== s.width || cur[1] !== s.height) this.win.setContentSize(s.width, s.height);
  }
  async goto(url) {
    const wc = this.win.webContents;
    await withTimeout(wc.loadURL(url), 30000, 'cargar la página');
    // espera a que las fuentes locales estén listas y a un cuadro pintado
    await wc.executeJavaScript('document.fonts.ready.then(function(){return new Promise(function(r){requestAnimationFrame(function(){requestAnimationFrame(r)})})})', true);
  }
  async setContent(html) { await this.goto('data:text/html;charset=utf-8,' + encodeURIComponent(html)); }
  async waitForLoadState() {}
  async evaluate(fn) { return this.win.webContents.executeJavaScript('(' + fn.toString() + ')()', true); }
  async route() {}
  async pdf(o) {
    return withTimeout(this.win.webContents.printToPDF({
      printBackground: o.printBackground !== false, preferCSSPageSize: true, pageRanges: o.pageRanges || '1',
      pageSize: { width: parseFloat(o.width) / 96, height: parseFloat(o.height) / 96 },
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    }), 60000, 'generar el PDF');
  }
  // Captura por el protocolo de depuración de Chromium con el factor de píxeles pedido (300 dpi)
  async screenshot(o) {
    const wc = this.win.webContents;
    const [w, h] = this.win.getContentSize();
    try { wc.debugger.attach('1.3'); } catch (e) { /* ya conectado */ }
    await wc.debugger.sendCommand('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: this.scale, mobile: false });
    await wc.executeJavaScript('new Promise(function(r){requestAnimationFrame(function(){requestAnimationFrame(r)})})', true);
    const r = await withTimeout(wc.debugger.sendCommand('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } }), 60000, 'capturar la página');
    await wc.debugger.sendCommand('Emulation.clearDeviceMetricsOverride');
    const buf = Buffer.from(r.data, 'base64');
    if (o && o.path) fs.writeFileSync(o.path, buf);
    return buf;
  }
  async close() { /* la ventana compartida se cierra en b.close() */ }
}

// La ventana de exportación vive mientras viva la app (se crea en la primera exportación)
let shared = null;
let intentos = [];
function sharedWindow() {
  const { BrowserWindow, session } = require('electron');
  if (shared && !shared.isDestroyed()) return shared;
  // cualquier petición que no sea un archivo local se cancela y se cuenta (igual que en Playwright)
  session.fromPartition(PARTITION, { cache: false }).webRequest.onBeforeRequest(function (d, cb) {
    const ok = /^(file|data|blob|about|devtools):/.test(d.url);
    if (!ok) intentos.push(d.url);
    cb({ cancel: !ok });
  });
  shared = new BrowserWindow({
    show: false, width: 1056, height: 816, useContentSize: true, frame: false,
    webPreferences: { offscreen: true, sandbox: true, contextIsolation: true, backgroundThrottling: false, partition: PARTITION }
  });
  shared.webContents.setFrameRate(5);
  return shared;
}

async function browser() {
  const win = sharedWindow();
  intentos = [];
  return {
    intentos: intentos,
    ctx: { newPage: async function () { return new Page(win, 1); } },
    b: {
      newPage: async function (opts) {
        const p = new Page(win, (opts && opts.deviceScaleFactor) || 1);
        if (opts && opts.viewport) await p.setViewportSize(opts.viewport);
        return p;
      },
      close: async function () { await win.webContents.loadURL('about:blank'); }
    },
    bloqueos: netguard.blocked
  };
}

module.exports = { browser };
