// Línea de comandos (todo local):
//   node src/cli.js ficha <guia.pdf> [nombre]      PDF guía → proyecto de ficha técnica (vertical)
//   node src/cli.js catalogo <guia.pdf> [nombre]   PDF guía → páginas de catálogo (horizontal)
//   node src/cli.js exportar <proyecto> [pdf|png]  exporta a proyectos/<proyecto>/exports/
//   node src/cli.js proyectos                       lista los proyectos
'use strict';

require('./netguard').install();
const fs = require('fs');
const P = require('./project');

(async function () {
  const [cmd, a, b] = process.argv.slice(2);
  if ((cmd === 'ficha' || cmd === 'catalogo') && a) {
    const { importar } = require('./server');
    const n = await importar(fs.readFileSync(a), b || require('path').basename(a, '.pdf'), cmd);
    const cat = P.catalog(n);
    console.log('Proyecto creado: proyectos/' + n);
    console.log('Pendientes:\n- ' + (cat.pendientes || []).join('\n- '));
  } else if (cmd === 'exportar' && a) {
    const r = await require('./exporter').run(a, { tipo: b || 'pdf' });
    console.log('Exportado en ' + r.carpeta + '\n' + r.archivos.map(function (f) { return '  ' + f; }).join('\n'));
  } else if (cmd === 'proyectos') {
    P.list().forEach(function (n) { console.log(n); });
  } else {
    console.log('Uso:\n  node src/cli.js ficha <guia.pdf> [nombre]\n  node src/cli.js catalogo <guia.pdf> [nombre]\n  node src/cli.js exportar <proyecto> [pdf|png]\n  node src/cli.js proyectos');
    process.exitCode = 1;
  }
})().catch(function (e) { console.error('Error: ' + e.message); process.exitCode = 1; });
