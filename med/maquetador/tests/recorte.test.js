// Regla «corte en la mandíbula»: la mandíbula queda en el borde superior y la foto cubre el marco.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { jawCrop } = require('../src/crop');

test('el recorte en la mandíbula da top ≤ 0 y cubre el marco completo', function () {
  let n = 0;
  for (const img of [{ w: 2752, h: 1536 }, { w: 1856, h: 2304 }, { w: 1200, h: 1200 }, { w: 800, h: 3000 }]) {
    for (const frame of [{ W: 1056, H: 816 }, { W: 300, H: 380 }, { W: 528, H: 620 }, { W: 1056, H: 340 }, { W: 216, H: 420 }]) {
      for (const jawY of [0, 0.1, 0.25, 0.4, 0.6]) {
        for (const subjectX of [0, 0.3, 0.5, 0.9]) {
          for (const zoom of [1, 1.3]) {
            const b = jawCrop(img, frame, { jawY, subjectX, targetX: 0.6, zoom });
            assert.ok(b.top <= 0, 'top > 0');
            assert.ok(Math.abs(b.top + jawY * b.height) < 1e-6, 'la mandíbula no queda en el borde superior');
            assert.ok(b.left <= 1e-6 && b.left + b.width >= frame.W - 1e-6, 'no cubre el ancho');
            assert.ok(b.top + b.height >= frame.H - 1e-6, 'no cubre el alto');
            n++;
          }
        }
      }
    }
  }
  assert.ok(n > 700);
});
