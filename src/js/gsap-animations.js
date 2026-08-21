/**
 * GODEROX — GSAP Premium Animations
 * Parallax · Cursor magnético · Text Scramble · Stagger Cards · Counters
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────
//  CURSOR MAGNÉTICO PERSONALIZADO
// ─────────────────────────────────────────────────
function initMagneticCursor() {
  if (window.matchMedia('(hover: none)').matches) return; // skip mobile

  const cursor   = document.querySelector('.gdr-cursor');
  const cursorDot = document.querySelector('.gdr-cursor-dot');
  if (!cursor || !cursorDot) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Dot sigue instantáneamente
    gsap.set(cursorDot, { x: mouseX, y: mouseY });
  });

  // Anillo sigue con retraso suave
  gsap.ticker.add(() => {
    cursorX += (mouseX - cursorX) * 0.1;
    cursorY += (mouseY - cursorY) * 0.1;
    gsap.set(cursor, { x: cursorX, y: cursorY });
  });

  // Hover en elementos interactivos
  const magneticTargets = document.querySelectorAll(
    'a, button, .product-card, .brand-card, .section-tab-btn, .icon-btn'
  );

  magneticTargets.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('is-hovering');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-hovering');
    });
  });

  // Ocultar cursor cuando sale del viewport
  document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
  document.addEventListener('mouseenter', () => cursor.classList.remove('is-hidden'));
}

// ─────────────────────────────────────────────────
//  HERO PARALLAX
// ─────────────────────────────────────────────────
function initHeroParallax() {
  const hero          = document.querySelector('.hero-section');
  const heroBg        = document.querySelector('.hero-bg-container');
  const heroSpots     = document.querySelector('.hero-spotlights-wrap');
  const heroParticles = document.querySelector('.hero-particles-wrap');
  const heroContent   = document.querySelector('.hero-center-content');
  const heroOrnTop    = document.querySelector('.hero-ornament-top');
  const heroOrnBot    = document.querySelector('.hero-ornament-bottom');
  const heroBtn       = document.querySelector('.hero-exclusive-btn');

  if (!hero || !heroContent) return;

  // Capa de fondo se mueve más lento (profundidad)
  if (heroBg) {
    gsap.to(heroBg, {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  // Spotlights se mueven lento (medio)
  if (heroSpots) {
    gsap.to(heroSpots, {
      yPercent: 20,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  // Partículas se mueven a velocidad media
  if (heroParticles) {
    gsap.to(heroParticles, {
      yPercent: 50,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  // Contenido principal se mueve más rápido + se desvanece
  if (heroContent) {
    gsap.to(heroContent, {
      yPercent: -15,
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: '60% top',
        scrub: true,
      },
    });
  }

  // Intro animation al cargar la página (después del preloader)
  const heroTl = gsap.timeline({ delay: 0.2 });

  if (heroOrnTop) {
    heroTl.from(heroOrnTop, {
      scaleX: 0,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out',
    }, 0);
  }

  const heroLabelTop = document.querySelector('.hero-label-top');
  const heroLabelBot = document.querySelector('.hero-label-bottom');

  if (heroLabelTop) {
    heroTl.from(heroLabelTop, {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
    }, 0.3);
  }

  if (heroLabelBot) {
    heroTl.from(heroLabelBot, {
      y: 60,
      opacity: 0,
      duration: 1.2,
      ease: 'expo.out',
    }, 0.5);
  }

  if (heroOrnBot) {
    heroTl.from(heroOrnBot, {
      scaleX: 0,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
    }, 0.7);
  }

  if (heroBtn) {
    heroTl.from(heroBtn, {
      y: 30,
      opacity: 0,
      duration: 1,
      ease: 'back.out(1.7)',
    }, 0.9);
  }
}

// ─────────────────────────────────────────────────
//  TEXT SCRAMBLE — Títulos de sección
// ─────────────────────────────────────────────────
function initTextScramble() {
  const titles = document.querySelectorAll('.gsap-title');

  titles.forEach((title) => {
    const original = title.textContent;
    const chars    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789✦◆';
    let interval   = null;
    let iteration  = 0;

    const scramble = () => {
      title.textContent = original
        .split('')
        .map((char, idx) => {
          if (char === ' ') return ' ';
          if (idx < iteration) return original[idx];
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      if (iteration >= original.length) {
        clearInterval(interval);
        title.textContent = original;
      }
      iteration += 0.5;
    };

    ScrollTrigger.create({
      trigger: title,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        iteration = 0;
        clearInterval(interval);
        interval = setInterval(scramble, 35);
      },
    });
  });
}

// ─────────────────────────────────────────────────
//  STAGGER PRODUCT CARDS
// ─────────────────────────────────────────────────
function initCardStagger() {
  // Observar dinámicamente cuando los productos se renderizan
  const observer = new MutationObserver(() => {
    const cards = document.querySelectorAll('.product-card:not(.gsap-animated)');
    if (cards.length === 0) return;

    cards.forEach((card) => card.classList.add('gsap-animated'));

    // Agrupar por filas visibles
    const visibleCards = [...cards].filter((c) => !c.closest('[style*="display: none"]'));

    if (visibleCards.length > 0) {
      gsap.from(visibleCards, {
        y: 60,
        opacity: 0,
        scale: 0.95,
        duration: 0.7,
        stagger: {
          amount: 0.6,
          from: 'start',
        },
        ease: 'power3.out',
        clearProps: 'all',
      });
    }
  });

  const grid = document.querySelector('#products-grid, .products-grid, [id*="product"]');
  if (grid) {
    observer.observe(grid, { childList: true, subtree: true });
  }

  // También aplicar a los que ya existen al cargar
  ScrollTrigger.create({
    trigger: '.catalog-section',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      const existing = document.querySelectorAll('.product-card:not(.gsap-animated)');
      if (existing.length > 0) {
        existing.forEach((c) => c.classList.add('gsap-animated'));
        gsap.from([...existing], {
          y: 60,
          opacity: 0,
          scale: 0.95,
          duration: 0.7,
          stagger: { amount: 0.8, from: 'start' },
          ease: 'power3.out',
          clearProps: 'all',
        });
      }
    },
  });
}

// ─────────────────────────────────────────────────
//  SECTION HEADERS — Línea que se dibuja + fade up
// ─────────────────────────────────────────────────
function initSectionReveal() {
  const headers = document.querySelectorAll('.section-header');

  headers.forEach((header) => {
    const tag      = header.querySelector('.section-tag');
    const title    = header.querySelector('.section-title');
    const subtitle = header.querySelector('.section-subtitle');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: header,
        start: 'top 82%',
        once: true,
      },
    });

    if (tag) {
      tl.from(tag, {
        scaleX: 0,
        transformOrigin: 'left center',
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
      }, 0);
    }

    if (title) {
      tl.from(title, {
        y: 50,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
      }, 0.2);
    }

    if (subtitle) {
      tl.from(subtitle, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      }, 0.4);
    }
  });
}

// ─────────────────────────────────────────────────
//  BRAND CARDS — Stagger en marcas
// ─────────────────────────────────────────────────
function initBrandReveal() {
  ScrollTrigger.create({
    trigger: '.brands-section',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      const brandCards = document.querySelectorAll('.brand-card, .brand-item');
      if (brandCards.length > 0) {
        gsap.from([...brandCards], {
          y: 40,
          opacity: 0,
          scale: 0.9,
          duration: 0.6,
          stagger: { amount: 0.5, from: 'start' },
          ease: 'back.out(1.4)',
          clearProps: 'all',
        });
      }
    },
  });
}

// ─────────────────────────────────────────────────
//  COUNTER ANIMADO — brand-ticker / stats
// ─────────────────────────────────────────────────
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  counters.forEach((el) => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to({ val: 0 }, {
          val: target,
          duration: 2,
          ease: 'power2.out',
          onUpdate: function () {
            el.textContent = '+' + Math.floor(this.targets()[0].val).toLocaleString('es-CO');
          },
        });
      },
    });
  });
}

// ─────────────────────────────────────────────────
//  TICKER — Parallax horizontal en el brand ticker
// ─────────────────────────────────────────────────
function initTickerParallax() {
  const ticker = document.querySelector('.brand-ticker-wrap');
  if (!ticker) return;

  gsap.to(ticker, {
    x: '-5%',
    ease: 'none',
    scrollTrigger: {
      trigger: ticker,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
    },
  });
}

// ─────────────────────────────────────────────────
//  FLOATING LOGO — Header parallax sutil
// ─────────────────────────────────────────────────
function initHeaderParallax() {
  const logo = document.querySelector('.header-brand-logo-img');
  if (!logo) return;

  gsap.to(logo, {
    yPercent: -8,
    ease: 'none',
    scrollTrigger: {
      trigger: 'body',
      start: 'top top',
      end: '20% top',
      scrub: true,
    },
  });
}

// ─────────────────────────────────────────────────
//  NOSOTROS / CONTACTO — Reveal lateral
// ─────────────────────────────────────────────────
function initSideReveal() {
  const nosotros = document.querySelector('#nosotros');
  const contacto = document.querySelector('#contacto');

  [nosotros, contacto].forEach((section, i) => {
    if (!section) return;
    const children = [...section.querySelectorAll('.reveal-on-scroll, p, h2, h3, img, iframe, .contact-info, .nosotros-content')];

    gsap.from(children, {
      x: i === 0 ? -60 : 60,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
      clearProps: 'all',
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        once: true,
      },
    });
  });
}

// ─────────────────────────────────────────────────
//  MAIN INIT — Export
// ─────────────────────────────────────────────────
export function initGSAPAnimations() {
  // Esperar a que el preloader termine (si existe)
  const preloader = document.getElementById('preloader');
  
  if (preloader) {
    const waitForPreloader = () => {
      if (preloader.style.display === 'none' || preloader.classList.contains('fade-out') || 
          getComputedStyle(preloader).opacity === '0') {
        runAnimations();
      } else {
        setTimeout(waitForPreloader, 100);
      }
    };
    // Esperar 3.5 segundos que es lo que tarda el preloader
    setTimeout(runAnimations, 3500);
  } else {
    runAnimations();
  }
}

function runAnimations() {
  initMagneticCursor();
  initHeroParallax();
  initTextScramble();
  initSectionReveal();
  initBrandReveal();
  initCardStagger();
  initCounters();
  initTickerParallax();
  initHeaderParallax();
  initSideReveal();

  // Refresh ScrollTrigger después de que todo el DOM esté listo
  ScrollTrigger.refresh();
}
