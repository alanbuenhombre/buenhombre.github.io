// Lectura del PDF guía ficticio (misma plantilla genérica que el cliente, datos inventados).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const guia = require('../src/guia');
const ficha = require('../src/ficha');

const PDF = path.join(__dirname, '..', 'ejemplos', 'guia-ficticia.pdf');

test('extrae identidad, texto literal, tabla de tallas y secciones de las 7 páginas', async function () {
  const est = await guia.read(fs.readFileSync(PDF));
  assert.strictEqual(est.paginas.length, 7);
  const f = ficha.build({ paginas: est.paginas }, {});
  const d = function (i) { return f.paginas[i].datos; };
  assert.strictEqual(f.producto.nombre, 'CONTOURA™ BRA');
  assert.strictEqual(f.producto.ref, '9001');
  assert.strictEqual(d(0).meta.length, 6);
  assert.strictEqual(d(0).tallas, 'XS-3XL');
  assert.strictEqual(d(0).cobertura[0].titulo, 'Thoracic Region');
  assert.strictEqual(d(0).beneficios.length, 4);
  assert.strictEqual(d(1).h1, 'FLEXWEAVE™');
  assert.deepStrictEqual(d(1).materiales.map(function (m) { return m.nombre; }), ['MICROMESH', 'SOFTKNIT', 'AIRFOAM']);
  assert.match(d(1).cierre, /^Three demo materials/);
  assert.strictEqual(d(2).features.length, 6);
  assert.strictEqual(d(2).detalles.length, 4);
  assert.strictEqual(d(3).relacion.length, 6);
  assert.strictEqual(d(3).credenciales.length, 2);
  assert.strictEqual(d(4).tabla.filas.length, 7);
  assert.deepStrictEqual(d(4).tabla.filas[0], ['XS', '24-26 / 61.0-66.0', '30-32 / 76.2-81.3', '26-28 / 66.0-71.1']);
  assert.match(d(4).tabla_nota, /^Example note below the size table/);
  assert.strictEqual(d(4).medir.length, 3);
  assert.strictEqual(d(5).pasos.length, 5);
  assert.strictEqual(d(5).pasos[0].numero, '01');
  assert.strictEqual(d(6).regulatorio.length, 3);
  assert.strictEqual(d(6).desempeno.length, 2);
  // Lo que no viene como texto en el PDF guía queda pendiente, nunca inventado
  assert.ok(f.pendientes.length >= 5);
  assert.strictEqual(d(5).cuidados.length, 0);
});

test('el copy se conserva literal (sin reescribir)', async function () {
  const est = await guia.read(fs.readFileSync(PDF));
  const f = ficha.build({ paginas: est.paginas }, {});
  assert.strictEqual(f.paginas[0].datos.overview, 'CONTOURA™ BRA is a fictitious garment created only to test the layout tool. It describes a front closure, a soft support band and breathable panels. None of this text belongs to a real product.');
  assert.strictEqual(f.paginas[1].datos.system_logic, 'Fiber choice -> panel placement -> garment assembly -> finished-product behavior.');
});
