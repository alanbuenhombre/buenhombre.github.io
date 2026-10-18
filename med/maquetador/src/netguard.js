// Cero red: cualquier conexión saliente desde este proceso que no sea a 127.0.0.1 / ::1 se bloquea.
// Se carga al inicio del servidor, del CLI y de las pruebas. Además, el Chromium de exportación
// se lanza con --host-resolver-rules que no resuelve ningún dominio (ver exporter.js).
'use strict';

const net = require('net');
const dns = require('dns');

const LOCAL = /^(127\.\d+\.\d+\.\d+|::1|localhost|0\.0\.0\.0)$/i;
const blocked = [];

function deny(where, host) {
  const msg = 'Red bloqueada (MED maquetador es 100 % local): intento de conexión a ' + host + ' desde ' + where;
  blocked.push({ where: where, host: String(host), at: new Date().toISOString() });
  const e = new Error(msg); e.code = 'MED_OFFLINE';
  return e;
}

function install() {
  if (net.Socket.prototype.__medGuard) return;
  const orig = net.Socket.prototype.connect;
  net.Socket.prototype.connect = function () {
    // net.connect() llega aquí con los argumentos ya normalizados en un arreglo
    const a = Array.isArray(arguments[0]) ? arguments[0][0] : arguments[0];
    let host = 'localhost';
    if (a && typeof a === 'object') host = a.path ? 'unix' : (a.host || 'localhost');
    else if (typeof arguments[1] === 'string') host = arguments[1];
    else if (typeof a === 'string' && isNaN(+a)) host = 'unix';
    if (host !== 'unix' && !LOCAL.test(host)) {
      const err = deny('net.Socket.connect', host);
      process.nextTick(() => this.destroy(err));
      return this;
    }
    return orig.apply(this, arguments);
  };
  net.Socket.prototype.__medGuard = true;
  // Nada de resolución DNS hacia fuera
  const origLookup = dns.lookup;
  dns.lookup = function (host, opts, cb) {
    if (typeof opts === 'function') { cb = opts; opts = {}; }
    if (!LOCAL.test(host)) return process.nextTick(() => cb(deny('dns.lookup', host)));
    return origLookup.call(dns, host, opts, cb);
  };
}

module.exports = { install, blocked, LOCAL };
