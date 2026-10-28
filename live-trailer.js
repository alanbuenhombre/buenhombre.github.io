/* Live trailer: muestra el juego corriendo solo dentro del hero del caso.
   Uso: <a class="lt" href="juego/" data-src="juego/?trailer"><img src="poster.jpg"> ...</a>
   - Carga el iframe solo cuando el hero entra en pantalla (y nunca con ahorro de datos).
   - En pantallas chicas se queda con el póster: el juego pesa y gasta batería.
   - Al salir de pantalla vacía el iframe para liberar la GPU. */
'use strict';
(function () {
  var els = document.querySelectorAll('.lt[data-src]');
  if (!els.length) return;
  var conn = navigator.connection || {};
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.matchMedia && matchMedia('(max-width: 700px)').matches;
  if (conn.saveData || reduce || small || !('IntersectionObserver' in window)) return;

  function mount(el) {
    if (el.querySelector('iframe')) return;
    var f = document.createElement('iframe');
    f.src = el.dataset.src;
    f.title = el.getAttribute('aria-label') || 'Vista previa del juego';
    f.setAttribute('tabindex', '-1');
    f.setAttribute('aria-hidden', 'true');
    f.setAttribute('loading', 'lazy');
    f.addEventListener('load', function () { setTimeout(function () { el.classList.add('is-live'); }, 1800); });
    el.appendChild(f);
  }
  function unmount(el) {
    var f = el.querySelector('iframe');
    if (f) { el.classList.remove('is-live'); f.remove(); }
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { e.isIntersecting ? mount(e.target) : unmount(e.target); });
  }, { rootMargin: '200px 0px' });
  els.forEach(function (el) { io.observe(el); });
})();
