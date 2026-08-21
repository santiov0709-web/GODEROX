/**
 * GODEROX — Cinema-Grade Luxury Animations
 * Lenis Smooth Scroll · GSAP ScrollTrigger · Clip-Path Reveals
 * Magnetic Buttons · Line-by-Line Text Reveals · Velocity Marquee
 *
 * Reference: Bottega Veneta / Rick Owens / Balenciaga level
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────
//  1. LENIS SMOOTH SCROLL  (silky 60fps momentum-based scroll)
// ─────────────────────────────────────────────────────────────
export function initLenis() {
  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo ease
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.85,
    touchMultiplier: 1.5,
  });

  // Sync Lenis with GSAP ticker (critical for ScrollTrigger sync)
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Store globally so other functions can pause/resume
  window.__lenis = lenis;
  return lenis;
}

// ─────────────────────────────────────────────────────────────
//  2. MAGNETIC CURSOR  (real attraction physics — not just scale)
// ─────────────────────────────────────────────────────────────
function initMagneticCursor() {
  if (window.matchMedia('(hover: none)').matches) return;

  const ring = document.querySelector('.gdr-cursor');
  const dot  = document.querySelector('.gdr-cursor-dot');
  const label = document.querySelector('.gdr-cursor-label');
  if (!ring || !dot) return;

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    gsap.set(dot, { x: mx, y: my });
  });

  // Ring follows with high-quality lerp
  gsap.ticker.add(() => {
    const rx = parseFloat(gsap.getProperty(ring, 'x')) || 0;
    const ry = parseFloat(gsap.getProperty(ring, 'y')) || 0;
    gsap.set(ring, {
      x: rx + (mx - rx) * 0.08,
      y: ry + (my - ry) * 0.08,
    });
    if (label) {
      gsap.set(label, {
        x: rx + (mx - rx) * 0.08,
        y: ry + (my - ry) * 0.08,
      });
    }
  });

  // Magnetic pull on CTA buttons
  document.querySelectorAll('.btn-primary, .hero-exclusive-btn, .gdr-popup-btn').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.35;
      const dy = (e.clientY - cy) * 0.35;
      gsap.to(btn, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    });
  });

  // Cursor state changes
  const hovers = document.querySelectorAll('a, button, .product-card, .brand-card, .section-tab-btn');
  hovers.forEach((el) => {
    const cursorText = el.dataset.cursor || '';
    el.addEventListener('mouseenter', () => {
      ring.classList.add('is-hovering');
      if (label && cursorText) {
        label.textContent = cursorText;
        label.style.opacity = '1';
      }
    });
    el.addEventListener('mouseleave', () => {
      ring.classList.remove('is-hovering');
      if (label) label.style.opacity = '0';
    });
  });

  document.addEventListener('mouseleave', () => {
    ring.classList.add('is-hidden');
    dot.classList.add('is-hidden');
  });
  document.addEventListener('mouseenter', () => {
    ring.classList.remove('is-hidden');
    dot.classList.remove('is-hidden');
  });
}

// ─────────────────────────────────────────────────────────────
//  3. CLIP-PATH TEXT REVEALS  (luxury line-by-line reveal)
//     Words emerge from behind an invisible mask — Balenciaga style
// ─────────────────────────────────────────────────────────────
function initLineReveal() {
  // Find all elements with data-reveal="lines"
  document.querySelectorAll('[data-reveal="lines"]').forEach((el) => {
    const text = el.textContent.trim();
    const words = text.split(' ');

    // Wrap each word in a line-mask span
    el.innerHTML = words
      .map(
        (word) =>
          `<span class="reveal-line-wrap"><span class="reveal-line-inner">${word}</span></span>`
      )
      .join(' ');

    const inners = el.querySelectorAll('.reveal-line-inner');

    gsap.set(inners, { yPercent: 110, opacity: 0 });

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(inners, {
          yPercent: 0,
          opacity: 1,
          duration: 1.1,
          stagger: 0.06,
          ease: 'power4.out',
        });
      },
    });
  });
}

// ─────────────────────────────────────────────────────────────
//  4. CLIP-PATH SECTION REVEALS  (wipe from left — luxury wipe)
// ─────────────────────────────────────────────────────────────
function initClipReveal() {
  document.querySelectorAll('[data-reveal="clip"]').forEach((el) => {
    gsap.set(el, { clipPath: 'inset(0 100% 0 0)', opacity: 1 });

    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.to(el, {
          clipPath: 'inset(0 0% 0 0)',
          duration: 1.4,
          ease: 'expo.inOut',
        });
      },
    });
  });
}

// ─────────────────────────────────────────────────────────────
//  5. HERO PARALLAX  (multi-layer depth — cinema quality)
// ─────────────────────────────────────────────────────────────
function initHeroParallax() {
  const hero    = document.querySelector('.hero-section');
  const heroBg  = document.querySelector('.hero-bg-container');
  const spots   = document.querySelector('.hero-spotlights-wrap');
  const parts   = document.querySelector('.hero-particles-wrap');
  const content = document.querySelector('.hero-center-content');

  if (!hero) return;

  if (heroBg) {
    gsap.to(heroBg, {
      yPercent: 25,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1.5 },
    });
  }

  if (spots) {
    gsap.to(spots, {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 },
    });
  }

  if (parts) {
    gsap.to(parts, {
      yPercent: 45,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 2 },
    });
  }

  if (content) {
    gsap.to(content, {
      yPercent: -20,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: '55% top', scrub: 1 },
    });
  }

  // ── Cinematic entry: hero elements fly in after preloader ──
  const ornTop    = document.querySelector('.hero-ornament-top');
  const ornBot    = document.querySelector('.hero-ornament-bottom');
  const labelTop  = document.querySelector('.hero-label-top');
  const labelBot  = document.querySelector('.hero-label-bottom');
  const heroBtn   = document.querySelector('.hero-exclusive-btn');
  const heroStar  = document.querySelector('.hero-star-icon');

  const tl = gsap.timeline({ delay: 0, defaults: { ease: 'expo.out' } });

  // Lines draw
  if (ornTop)   tl.fromTo(ornTop,  { scaleX: 0, transformOrigin: 'center' }, { scaleX: 1, duration: 1.6 }, 0);
  if (ornBot)   tl.fromTo(ornBot,  { scaleX: 0, transformOrigin: 'center' }, { scaleX: 1, duration: 1.6 }, 0.1);
  if (heroStar) tl.fromTo(heroStar, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(2)' }, 0.4);

  // Label top: slide up + fade
  if (labelTop) {
    tl.fromTo(labelTop,
      { yPercent: 120, opacity: 0, clipPath: 'inset(0 0 100% 0)' },
      { yPercent: 0,   opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: 1.2 },
      0.5
    );
  }

  // Label bottom: staggered chars feel
  if (labelBot) {
    tl.fromTo(labelBot,
      { yPercent: 80, opacity: 0, filter: 'blur(12px)' },
      { yPercent: 0,  opacity: 1, filter: 'blur(0px)', duration: 1.4 },
      0.75
    );
  }

  if (heroBtn) {
    tl.fromTo(heroBtn,
      { y: 30, opacity: 0, scale: 0.9 },
      { y: 0,  opacity: 1, scale: 1,   duration: 1, ease: 'back.out(1.7)' },
      1
    );
  }
}

// ─────────────────────────────────────────────────────────────
//  6. VELOCITY MARQUEE  (GSAP-powered brand ticker with drag)
// ─────────────────────────────────────────────────────────────
function initVelocityMarquee() {
  const tickerWrap = document.querySelector('.brand-ticker-wrap');
  const ticker     = document.querySelector('.brand-ticker');
  if (!tickerWrap || !ticker) return;

  // Duplicate content for seamless loop
  ticker.innerHTML += ticker.innerHTML;

  const tickerWidth = ticker.scrollWidth / 2;
  let speed = -0.5; // px per frame (negative = left direction)
  let xPos = 0;

  // Scroll velocity boost
  let lastScrollY = window.scrollY;
  let velocityBoost = 0;

  window.addEventListener('scroll', () => {
    const dy = window.scrollY - lastScrollY;
    velocityBoost = dy * 0.04;
    lastScrollY = window.scrollY;
  });

  gsap.ticker.add(() => {
    velocityBoost *= 0.93; // friction decay
    xPos += speed + velocityBoost;

    if (Math.abs(xPos) >= tickerWidth) xPos = 0;

    gsap.set(ticker, { x: xPos });
  });
}

// ─────────────────────────────────────────────────────────────
//  7. SECTION HEADERS  — staggered orchestrated reveal
// ─────────────────────────────────────────────────────────────
function initSectionHeaders() {
  document.querySelectorAll('.section-header').forEach((header) => {
    const tag      = header.querySelector('.section-tag');
    const title    = header.querySelector('.section-title');
    const subtitle = header.querySelector('.section-subtitle');

    // Wrap title in overflow clip
    if (title && !title.closest('[data-reveal]')) {
      title.style.overflow = 'hidden';
      title.style.display  = 'block';
    }

    const tl = gsap.timeline({
      scrollTrigger: { trigger: header, start: 'top 82%', once: true },
    });

    if (tag) {
      tl.fromTo(tag,
        { x: -40, opacity: 0 },
        { x: 0,   opacity: 1, duration: 0.8, ease: 'power3.out' },
        0
      );
    }

    if (title) {
      tl.fromTo(title,
        { y: '110%', opacity: 0 },
        { y: '0%',   opacity: 1, duration: 1.1, ease: 'expo.out' },
        0.15
      );
    }

    if (subtitle) {
      tl.fromTo(subtitle,
        { y: 28, opacity: 0, filter: 'blur(6px)' },
        { y: 0,  opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out' },
        0.4
      );
    }
  });
}

// ─────────────────────────────────────────────────────────────
//  8. STAGGERED PRODUCT CARDS  (ultra-smooth scale + translate)
// ─────────────────────────────────────────────────────────────
function initCardReveal() {
  // For dynamically loaded cards we use MutationObserver
  const grid = document.querySelector('#products-grid, .products-grid, [id*="product"]');

  function animateCards(cards) {
    const fresh = [...cards].filter((c) => !c.hasAttribute('data-gsap-done'));
    if (!fresh.length) return;
    fresh.forEach((c) => c.setAttribute('data-gsap-done', '1'));

    gsap.fromTo(fresh,
      {
        y: 80,
        opacity: 0,
        scale: 0.94,
        filter: 'blur(4px)',
      },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.9,
        stagger: { each: 0.08, from: 'start' },
        ease: 'power4.out',
        clearProps: 'filter,scale',
      }
    );
  }

  if (grid) {
    new MutationObserver(() => {
      const cards = grid.querySelectorAll('.product-card:not([data-gsap-done])');
      if (cards.length) animateCards(cards);
    }).observe(grid, { childList: true, subtree: true });
  }

  // Also handle already-rendered cards on scroll
  ScrollTrigger.create({
    trigger: '.catalog-section',
    start: 'top 78%',
    once: true,
    onEnter: () => {
      const cards = document.querySelectorAll('.product-card:not([data-gsap-done])');
      if (cards.length) animateCards(cards);
    },
  });
}

// ─────────────────────────────────────────────────────────────
//  9. HORIZONTAL PINNED BRAND STRIP  (optional premium scroll)
// ─────────────────────────────────────────────────────────────
function initBrandReveal() {
  const brandsGrid = document.querySelector('.brands-grid, #brands-grid');
  if (!brandsGrid) return;

  ScrollTrigger.create({
    trigger: brandsGrid,
    start: 'top 82%',
    once: true,
    onEnter: () => {
      const cards = brandsGrid.querySelectorAll('.brand-card, .brand-item, .brand-item-card');
      if (!cards.length) return;

      gsap.fromTo([...cards],
        { y: 50, opacity: 0, scale: 0.92, rotateX: 6 },
        {
          y: 0, opacity: 1, scale: 1, rotateX: 0,
          duration: 0.8,
          stagger: 0.07,
          ease: 'back.out(1.6)',
          clearProps: 'all',
        }
      );
    },
  });
}

// ─────────────────────────────────────────────────────────────
//  10. NOSOTROS / CONTACTO  (lateral clip wipes)
// ─────────────────────────────────────────────────────────────
function initSideReveal() {
  ['#nosotros', '#contacto'].forEach((sel, i) => {
    const section = document.querySelector(sel);
    if (!section) return;

    const children = [
      ...section.querySelectorAll('h2, h3, p, img, iframe, .contact-info, [class*="nosotros"]'),
    ];
    if (!children.length) return;

    gsap.fromTo(children,
      {
        x: i === 0 ? -70 : 70,
        opacity: 0,
        filter: 'blur(8px)',
      },
      {
        x: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 1,
        stagger: 0.12,
        ease: 'expo.out',
        clearProps: 'filter',
        scrollTrigger: { trigger: section, start: 'top 80%', once: true },
      }
    );
  });
}

// ─────────────────────────────────────────────────────────────
//  MAIN ENTRY — waits for preloader then fires all animations
// ─────────────────────────────────────────────────────────────
function runAll() {
  initHeroParallax();
  initLineReveal();
  initClipReveal();
  initSectionHeaders();
  initCardReveal();
  initBrandReveal();
  initVelocityMarquee();
  initSideReveal();
  ScrollTrigger.refresh();
}

export function initGSAPAnimations() {
  // Init Lenis first — always
  initLenis();

  const preloader = document.getElementById('preloader');
  const PRELOADER_DURATION = 800; // ms — fires shortly after preloader fades

  if (preloader) {
    setTimeout(runAll, PRELOADER_DURATION);
  } else {
    runAll();
  }
}
