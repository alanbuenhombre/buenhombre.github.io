/* FULL-WIDTH TEXT FIT */
function fitFullWidth() {
  const vw = document.documentElement.clientWidth;
  document.querySelectorAll('.hero__bigname, .footer__bigname').forEach(el => {
    el.style.fontSize = '100px';
    const range = document.createRange();
    range.selectNodeContents(el);
    const textW = range.getBoundingClientRect().width;
    if (textW > 0) el.style.fontSize = (100 * vw / textW) + 'px';
  });
}

fitFullWidth();
document.fonts.ready.then(() => requestAnimationFrame(fitFullWidth));
window.addEventListener('resize', fitFullWidth);

/* NAV SCROLL HIDE/SHOW */
(function() {
  const nav = document.getElementById('nav');
  let lastY = 0;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > 80) {
          nav.classList.add('scrolled');
          if (y > lastY + 4) nav.classList.add('nav--hidden');
          else if (y < lastY - 4) nav.classList.remove('nav--hidden');
        } else {
          nav.classList.remove('scrolled', 'nav--hidden');
        }
        lastY = y;
        ticking = false;
      });
      ticking = true;
    }
  });
})();

/* MOBILE NAV TOGGLE */
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

/* SCROLL FADE-IN */
const fadeEls = document.querySelectorAll(
  '.about__content, .gallery__img, ' +
  '.service-card, .impact__left, .impact-row, ' +
  '.port-card, .stat, .testi-card, .price-card, ' +
  '.cta-float__content, .metrics__left'
);

fadeEls.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(28px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, i * 60);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

fadeEls.forEach(el => observer.observe(el));

/* COPY EMAIL */
const copyBtn = document.getElementById('copyEmailBtn');
const copiedToast = document.getElementById('copiedToast');
if (copyBtn && copiedToast) {
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText('alangtres@gmail.com').then(() => {
      copiedToast.classList.add('show');
      setTimeout(() => copiedToast.classList.remove('show'), 2000);
    });
  });
}
