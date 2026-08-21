/* GODEROX MAIN APPLICATION CONTROLLER — Supabase API Connected */
import { CURRENCIES } from './data.js';
import { getAllProducts } from './api/products.api.js';
import { getAllBrands } from './api/brands.api.js';
import { getAllCategories } from './api/categories.api.js';
import { cart } from './cart.js';
import { audio } from './audio.js';
import { wishlist } from './wishlist.js';
import { setupQuickView } from './quickview.js';
import { setupLookbook } from './lookbook.js';
import { setupVipGate } from './vip-gate.js';

import { INITIAL_PRODUCTS } from './data.js';

let activeSection = 'all';
let activeSubcategory = 'all';
let PRODUCTS = [];
let BRANDS = [];
let CATEGORIES = [];

function loadLocalUserProducts() {
  try {
    const saved = localStorage.getItem('goderox_products_db');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function normalizeProduct(p) {
  if (!p) return null;

  // ── Price: soporta camelCase y snake_case ──
  const priceUSD = p.priceUSD !== undefined ? p.priceUSD : (p.price_usd !== undefined ? Number(p.price_usd) : 0);
  const oldPriceUSD = p.oldPriceUSD !== undefined ? p.oldPriceUSD : (p.old_price_usd !== undefined ? Number(p.old_price_usd) : null);

  // ── Brand name: objeto Supabase, string o brand_id ──
  let brandName = 'GODEROX';
  if (typeof p.brand === 'object' && p.brand !== null) {
    brandName = p.brand.name || 'GODEROX';
  } else if (p.brand && typeof p.brand === 'string') {
    const matchedBrand = BRANDS.find(b => b.id === p.brand || b.name?.toLowerCase() === p.brand.toLowerCase());
    brandName = matchedBrand ? matchedBrand.name : p.brand;
  } else if (p.brand_id) {
    const matchedBrand = BRANDS.find(b => b.id === p.brand_id);
    if (matchedBrand) brandName = matchedBrand.name;
  }

  // ── Images ──
  const images = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : (typeof p.images === 'string' && p.images ? [p.images] : ['/images/goderox_official_logo.jpeg']);

  // ── Sizes ──
  const sizes = Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['S', 'M', 'L', 'XL'];

  // ── Section: soporta snake_case ──
  const section = p.section || '';

  // ── Category slug/name: objeto Supabase ({ id, name, slug }) o string plano ──
  let categorySlug = '';
  let categoryName = '';
  if (typeof p.category === 'object' && p.category !== null) {
    categorySlug = p.category.slug || p.category.name?.toLowerCase() || '';
    categoryName = p.category.name || '';
  } else if (typeof p.category === 'string') {
    categorySlug = p.category;
    categoryName = p.category;
  } else if (p.category_id && CATEGORIES.length > 0) {
    const cat = CATEGORIES.find(c => c.id === p.category_id);
    if (cat) {
      categorySlug = cat.slug || cat.name?.toLowerCase() || '';
      categoryName = cat.name || '';
    }
  }

  // ── Promo: soporta is_promo y isPromo ──
  const isPromo = p.is_promo === true || p.isPromo === true;

  // ── Discount ──
  const discountPercentage = p.discount_percentage !== undefined ? p.discount_percentage : p.discountPercentage;

  return {
    ...p,
    id: p.id || 'god-prod-' + Date.now(),
    name: p.name || 'Pieza Exclusiva',
    brand: brandName,
    brandName,
    priceUSD,
    oldPriceUSD,
    images,
    sizes,
    section,
    category: categorySlug,
    categoryName,
    isPromo,
    discountPercentage,
    description: p.description || p.shortDescription || 'Pieza exclusiva GODEROX confeccionada con materiales de alta gama.',
    shortDescription: p.shortDescription || p.description || '',
    gsm: p.gsm || '320 GSM Heavy Premium',
    stock: p.stock !== undefined ? p.stock : 5,
    is_active: p.is_active !== false
  };
}
window.normalizeProduct = normalizeProduct;

window.getGlobalProduct = function(productId) {
  if (!productId) return null;
  let found = PRODUCTS.find(p => p.id === productId || String(p.id) === String(productId));

  if (!found) {
    const local = loadLocalUserProducts();
    found = local.find(p => p.id === productId || String(p.id) === String(productId));
  }

  if (!found && Array.isArray(INITIAL_PRODUCTS)) {
    found = INITIAL_PRODUCTS.find(p => p.id === productId || String(p.id) === String(productId));
  }

  return normalizeProduct(found);
};

document.addEventListener('DOMContentLoaded', async () => {
  initPreloader();
  initHeader();
  initCountdown();
  initScrollReveal();

  const localProducts = loadLocalUserProducts();
  let supabaseProducts = [];

  // Load data from Supabase if connected
  try {
    const [spProducts, spBrands, spCategories] = await Promise.all([
      getAllProducts({ isActive: true }),
      getAllBrands(true),
      getAllCategories({ activeOnly: true })
    ]);
    if (Array.isArray(spProducts)) supabaseProducts = spProducts;
    if (Array.isArray(spBrands) && spBrands.length > 0) BRANDS = spBrands;
    if (Array.isArray(spCategories) && spCategories.length > 0) CATEGORIES = spCategories;
  } catch (err) {
    console.warn('Supabase no conectado, cargando productos creados en el panel:', err.message);
  }

  // Combine products using Map to keep local + Supabase + initial products without loss
  const productMap = new Map();
  (INITIAL_PRODUCTS || []).forEach(p => productMap.set(String(p.id), p));
  (localProducts || []).forEach(p => productMap.set(String(p.id), p));
  (supabaseProducts || []).forEach(p => productMap.set(String(p.id), p));

  PRODUCTS = Array.from(productMap.values());

  renderProducts('all', 'all');
  initCategoryFilters();
  initCartDrawer();
  initCurrencySelector();
  initAudioToggle();
  initCheckoutModal();
  initSearchModal();
  initWishlistModal();
  setupBrandsFromAPI();
  setupQuickView();
  setupLookbook();
  setupVipGate();

  window.addEventListener('storage', (e) => {
    if (e.key === 'goderox_products_db') refreshProductList();
  });
  window.addEventListener('goderox:product-updated', refreshProductList);
});

function refreshProductList() {
  const localProducts = loadLocalUserProducts();
  const productMap = new Map();
  PRODUCTS.forEach(p => productMap.set(String(p.id), p));
  (localProducts || []).forEach(p => productMap.set(String(p.id), p));
  PRODUCTS = Array.from(productMap.values());
  renderProducts(activeSection, activeSubcategory);
}

/* ─── LOAD BRANDS FROM SUPABASE ─── */
const DEFAULT_BRAND_DESCRIPTIONS = {
  'CLEMONT': 'Sastrería urbana contemporánea. Piezas de cortes estructurales y siluetas holgadas confeccionadas en telas importadas de alto gramaje para máxima presencia.',
  'LABEUR': 'Concepto heavywear minimalista. Estética industrial con acabados pulidos, enfocado en hoodies de 500 GSM y camisetas de caída pesada.',
  'AURUM': 'Detalles sutiles y acabados dorados de alta gama. Piezas diseñadas con elegancia discreta y un sello de exclusividad atemporal.',
  'Y/OUT': 'Streetwear vanguardista con influencias de moda internacional. Diseños audaces pensados para quienes imponen su propio estilo.',
  'ANTES REAL ROPA': 'Nuestra línea de origen legendario. Piezas que rinden homenaje al legado urbano clásico con patrones reforzados.'
};

async function setupBrandsFromAPI() {
  const brandsGrid = document.getElementById('brands-grid');
  if (!brandsGrid) return;

  try {
    const rawBrands = BRANDS.length > 0 ? BRANDS : await getAllBrands(true);
    const brands = rawBrands.length > 0 ? rawBrands : [
      { id: 'clemont', name: 'CLEMONT', subtext: 'Sastrería Urbana', description: DEFAULT_BRAND_DESCRIPTIONS['CLEMONT'] },
      { id: 'labeur', name: 'LABEUR', subtext: 'Heavywear Minimalista', description: DEFAULT_BRAND_DESCRIPTIONS['LABEUR'] },
      { id: 'aurum', name: 'AURUM', subtext: 'Alta Gama', description: DEFAULT_BRAND_DESCRIPTIONS['AURUM'] },
      { id: 'yout', name: 'Y/OUT', subtext: 'Streetwear Vanguardia', description: DEFAULT_BRAND_DESCRIPTIONS['Y/OUT'] },
      { id: 'realropa', name: 'ANTES REAL ROPA', subtext: 'Legado Original', description: DEFAULT_BRAND_DESCRIPTIONS['ANTES REAL ROPA'] }
    ];

    brandsGrid.innerHTML = brands.map(brand => {
      const desc = brand.description || DEFAULT_BRAND_DESCRIPTIONS[brand.name.toUpperCase()] || 'Distribuidor oficial 100% original en GODEROX Sabaneta.';
      const sub = brand.subtext || 'Distribución Oficial';

      return `
        <div class="brand-feature-card animate-fade-in" data-brand-name="${brand.name}">
          <div class="brand-card-header">
            <div class="brand-logo-frame">
              ${brand.logo_url
                ? `<img src="${brand.logo_url}" alt="${brand.name} Logo" class="brand-frame-img" />`
                : `<span class="brand-initials">${brand.name.substring(0, 2)}</span>`
              }
            </div>
            <div class="brand-card-titles">
              <h3 class="brand-card-title">${brand.name}</h3>
              <span class="brand-card-subtag">${sub}</span>
            </div>
          </div>

          <p class="brand-card-desc">${desc}</p>

          <div class="brand-card-footer">
            <button class="btn-brand-filter" onclick="window.filterProductsByBrand('${brand.name}')">
              <span>VER PRODUCTOS</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.warn('Error cargando marcas:', err);
  }
}

window.filterProductsByBrand = function(brandName) {
  const catalogEl = document.getElementById('catalog');
  if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });

  // Actualizar el estado y los tabs
  activeSection = 'all';
  activeSubcategory = 'all';
  document.querySelectorAll('.section-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.section === 'all'));

  const brandLower = brandName.toLowerCase();
  const brandProducts = PRODUCTS
    .map(p => normalizeProduct(p))
    .filter(p => p && p.is_active !== false)
    .filter(p => {
      const pBrand = (p.brandName || p.brand || '').toLowerCase();
      return pBrand === brandLower || pBrand.includes(brandLower);
    });

  if (brandProducts.length > 0) {
    renderProductsFiltered(brandProducts);
  } else {
    renderProducts('all', 'all');
  }
};

function createProductCardHTML(productRaw) {
  const product = normalizeProduct(productRaw);
  if (!product) return '';
  const isFav = wishlist.has(product.id);
  const badgeText = product.discountPercentage ? `-${product.discountPercentage}% OFF` : (product.tags && product.tags[0] ? product.tags[0] : null);

  return `
    <article class="product-card animate-fade-in" data-id="${product.id}" onclick="window.openQuickView('${product.id}')" style="cursor:pointer;">
      <div class="product-image-container">
        <img src="${product.images[0]}" alt="${product.name}" class="product-img" loading="lazy" />
        <div class="product-overlay-gradient"></div>
        ${badgeText ? `<span class="product-badge">${badgeText}</span>` : ''}
        <button class="product-wishlist-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); window.toggleWishlist('${product.id}')" title="Guardar en Favoritos">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? '#E53935' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
      <div class="product-info">
        <div class="product-brand-row">
          <span class="product-brand">${product.brandName}</span>
          <span class="product-orig-badge">100% ORIGINAL</span>
        </div>
        <h3 class="product-name">${product.name}</h3>
        
        <div class="product-price-row">
          <span class="product-price">${cart.formatPrice(product.priceUSD)}</span>
          ${product.oldPriceUSD ? `<span class="product-old-price">${cart.formatPrice(product.oldPriceUSD)}</span>` : ''}
        </div>

        <!-- SELECTOR INTERACTIVO DE TALLAS DISPONIBLES -->
        <div class="product-sizes-wrap" onclick="event.stopPropagation();">
          <span class="sizes-title">Tallas disponibles:</span>
          <div class="sizes-pills-container">
            ${product.sizes.map((sz, idx) => `
              <button type="button" class="card-size-pill ${idx === 0 ? 'active' : ''}" data-size="${sz}" onclick="event.stopPropagation(); window.selectCardSize(event, '${sz}')">
                ${sz}
              </button>
            `).join('')}
          </div>
        </div>

        <button class="product-add-cart-btn" onclick="event.stopPropagation(); window.quickAddToCart('${product.id}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span>AGREGAR AL CARRITO</span>
        </button>
      </div>
    </article>
  `;
}

function renderProductsFiltered(filteredList) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.innerHTML = filteredList.map(p => createProductCardHTML(p)).join('');
}

/* DYNAMIC PRODUCT GRID RENDERER */
function renderProducts(section = 'all', subcategory = 'all') {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  // Normalizar todos los productos antes de filtrar
  let filtered = PRODUCTS.map(p => normalizeProduct(p)).filter(Boolean);

  // Solo mostrar activos
  filtered = filtered.filter(p => p.is_active !== false);

  // Primary Section Filter
  if (section === 'promo') {
    filtered = filtered.filter(p => p.isPromo === true);
  } else if (section !== 'all') {
    filtered = filtered.filter(p => p.section === section);
  }

  // Subcategory Filter — compara slug normalizado
  if (subcategory !== 'all') {
    const subLower = subcategory.toLowerCase();
    filtered = filtered.filter(p => {
      const catSlug = (p.category || '').toLowerCase();
      const catName = (p.categoryName || '').toLowerCase();
      return catSlug === subLower || catName === subLower;
    });
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-catalog-card animate-fade-in" style="grid-column: 1/-1; text-align:center; padding: 4.5rem 2rem; background: rgba(20, 20, 20, 0.85); border: 1px solid var(--border-gold); border-radius: 12px; backdrop-filter: blur(12px);">
        <img src="/images/goderox_official_logo.jpeg" alt="GODEROX Emblem" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--gold-primary); box-shadow: 0 0 30px rgba(200,165,91,0.5); margin: 0 auto 1.5rem auto;" />
        <span class="gold-text-shimmer" style="font-size: 0.75rem; letter-spacing: 0.35em; display: block; margin-bottom: 0.5rem; text-transform: uppercase;">✦ GODEROX LUXURY SELECTION ✦</span>
        <h3 style="font-family: var(--font-heading); font-size: 1.8rem; color: #FFF; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.12em;">PREPARANDO EXCLUSIVIDAD</h3>
        <p style="color: var(--text-secondary); max-width: 540px; margin: 0 auto; font-size: 0.95rem; line-height: 1.6;">
          Estamos curando las mejores piezas y prendas exclusivas para esta sección. Muy pronto disponible en tienda física y envíos.
        </p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => createProductCardHTML(p)).join('');

  if (window.observeScrollReveals) {
    setTimeout(window.observeScrollReveals, 50);
  }
}

window.selectCardSize = function(event, size) {
  event.stopPropagation();
  const card = event.currentTarget.closest('.product-card');
  if (!card) return;
  card.querySelectorAll('.card-size-pill').forEach(btn => btn.classList.remove('active'));
  event.currentTarget.classList.add('active');
  if (typeof audio !== 'undefined' && audio.playTick) audio.playTick(600);
};

window.quickAddToCart = function(productId) {
  const card = document.querySelector(`.product-card[data-id="${productId}"]`);
  const selectedSizeBtn = card ? card.querySelector('.card-size-pill.active') : null;
  const p = window.getGlobalProduct(productId);
  if (p) {
    const size = selectedSizeBtn ? selectedSizeBtn.dataset.size : (p.sizes ? p.sizes[0] : 'M');
    cart.addItem(p, size);
    if (typeof showToast === 'function') {
      showToast(`Añadido: ${p.name} (Talla ${size}) al carrito`, 'success');
    }
    if (typeof window.openCartDrawer === 'function') {
      window.openCartDrawer();
    }
  }
};

window.toggleWishlist = function(productId) {
  wishlist.toggle(productId);
  renderProducts(activeSection, activeSubcategory);
};

/* HIERARCHICAL CATEGORY FILTERS */
function initCategoryFilters() {
  const sectionBtns = document.querySelectorAll('.section-tab-btn');
  const subcatBar = document.getElementById('subcategories-filter-bar');

  const SUBCATS_MAP = {
    all: [
      { id: 'all', label: 'TODAS LAS PIEZAS' },
      { id: 'camisetas', label: 'CAMISETAS' },
      { id: 'buzos', label: 'BUZOS' },
      { id: 'pantalones', label: 'PANTALONES' },
      { id: 'sudaderas', label: 'SUDADERAS' },
      { id: 'gorras', label: 'GORRAS' },
      { id: 'perfumes', label: 'PERFUMES' }
    ],
    hombre: [
      { id: 'all', label: 'TODOS HOMBRE' },
      { id: 'camisetas', label: 'CAMISETAS' },
      { id: 'buzos', label: 'BUZOS' },
      { id: 'pantalones', label: 'PANTALONES' },
      { id: 'sudaderas', label: 'SUDADERAS' },
      { id: 'gorras', label: 'GORRAS' }
    ],
    mujer: [
      { id: 'all', label: 'TODOS MUJER' },
      { id: 'bodys', label: 'BODYS' },
      { id: 'blusas', label: 'BLUSAS' },
      { id: 'pantalones', label: 'PANTALONES' },
      { id: 'sudaderas', label: 'SUDADERAS' }
    ],
    perfumes: [
      { id: 'all', label: 'TODAS LAS FRAGANCIAS' },
      { id: 'perfumes', label: 'EXTRAIT DE PARFUM' }
    ],
    promo: [
      { id: 'all', label: 'TODAS LAS OFERTAS' }
    ]
  };

  window.filterBySection = function(sectionName) {
    activeSection = sectionName;
    activeSubcategory = 'all';
    sectionBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.section === sectionName);
    });
    updateSubcategoriesBar(activeSection);
    renderProducts(activeSection, activeSubcategory);
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  function updateSubcategoriesBar(section) {
    if (!subcatBar) return;
    const subcats = SUBCATS_MAP[section] || SUBCATS_MAP.all;

    subcatBar.innerHTML = subcats.map(sc => `
      <button class="subcat-btn ${sc.id === activeSubcategory ? 'active' : ''}" data-subcat="${sc.id}">
        ${sc.label}
      </button>
    `).join('');

    subcatBar.querySelectorAll('.subcat-btn').forEach(btn => {
      btn.onclick = () => {
        if (typeof audio !== 'undefined' && audio.playTick) audio.playTick(500);
        subcatBar.querySelectorAll('.subcat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSubcategory = btn.dataset.subcat;
        renderProducts(activeSection, activeSubcategory);
      };
    });
  }

  sectionBtns.forEach(btn => {
    btn.onclick = () => {
      if (typeof audio !== 'undefined' && audio.playTick) audio.playTick(500);
      sectionBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSection = btn.dataset.section;
      activeSubcategory = 'all';
      updateSubcategoriesBar(activeSection);
      renderProducts(activeSection, activeSubcategory);
    };
  });

  // Initial render of subcategories bar
  updateSubcategoriesBar(activeSection);
}

/* ULTRA LUXURY PRELOADER ANIMATION */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  const bar = document.getElementById('preloader-bar');
  const percentEl = document.getElementById('preloader-percent');

  if (!preloader) return;

  document.body.style.overflow = 'hidden';

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 12) + 8;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);

      if (bar) bar.style.width = '100%';
      if (percentEl) percentEl.textContent = '100%';

      setTimeout(() => {
        preloader.classList.add('fade-out');
        document.body.style.overflow = '';
      }, 350);
    } else {
      if (bar) bar.style.width = `${progress}%`;
      if (percentEl) percentEl.textContent = `${progress}%`;
    }
  }, 40);
}

/* HIGH FASHION SCROLL REVEAL CONTROLLER */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.12
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  function observeElements() {
    const targets = document.querySelectorAll('.reveal-on-scroll:not(.is-visible)');
    targets.forEach(el => observer.observe(el));
  }

  observeElements();
  window.observeScrollReveals = observeElements;

  setTimeout(observeElements, 400);
  setTimeout(observeElements, 1200);
}

/* HEADER & SCROLL BEHAVIOR */
function initHeader() {
  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav-drawer');
  const mobileClose = document.getElementById('mobile-nav-close');

  if (mobileToggle && mobileNav) {
    mobileToggle.onclick = () => {
      audio.playTick(500);
      mobileNav.classList.add('active');
    };
    if (mobileClose) {
      mobileClose.onclick = () => {
        audio.playWhoosh();
        mobileNav.classList.remove('active');
      };
    }
  }
}

/* COUNTDOWN TIMER FOR DROP 004 */
function initCountdown() {
  const daysEl = document.getElementById('timer-days');
  const hoursEl = document.getElementById('timer-hours');
  const minsEl = document.getElementById('timer-mins');
  const secsEl = document.getElementById('timer-secs');

  if (!daysEl) return;

  // Set target date 5 days from now
  const targetDate = new Date().getTime() + (5 * 24 * 60 * 60 * 1000) + (14 * 60 * 60 * 1000);

  function updateTimer() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minsEl.textContent = '00';
      secsEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minsEl.textContent = String(minutes).padStart(2, '0');
    secsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/* CART DRAWER & CONTROLLERS */
function initCartDrawer() {
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartOpenBtns = document.querySelectorAll('.cart-open-trigger');
  const cartCloseBtn = document.getElementById('cart-close-btn');

  window.openCartDrawer = function() {
    audio.playWhoosh();
    cartDrawer.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeCartDrawer = function() {
    audio.playWhoosh();
    cartDrawer.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  cartOpenBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      window.openCartDrawer();
    };
  });

  if (cartCloseBtn) cartCloseBtn.onclick = window.closeCartDrawer;
  if (cartOverlay) cartOverlay.onclick = window.closeCartDrawer;

  // Listen to cart changes
  cart.subscribe(renderCartUI);
  renderCartUI();
}

function renderCartUI() {
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartCountBadges = document.querySelectorAll('.cart-count-badge');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-total');
  const discountRow = document.getElementById('cart-discount-row');
  const discountEl = document.getElementById('cart-discount');
  const promoMessageEl = document.getElementById('promo-message');
  const freeShipBar = document.getElementById('free-ship-progress');
  const freeShipText = document.getElementById('free-ship-text');

  const totals = cart.getTotals();

  // Update badge count
  cartCountBadges.forEach(badge => {
    badge.textContent = totals.totalCount;
    badge.style.display = totals.totalCount > 0 ? 'inline-flex' : 'none';
  });

  if (!cartItemsContainer) return;

  if (cart.cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" stroke-width="1"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <p class="cart-empty-title">SU BOLSO ATELIER ESTÁ VACÍO</p>
        <p class="cart-empty-sub">Explore las piezas numeradas de la Colección 004.</p>
        <button class="cart-explore-btn" onclick="window.closeCartDrawer();">DESCUBRIR COLECCIÓN</button>
      </div>
    `;
  } else {
    cartItemsContainer.innerHTML = cart.cart.map((item, idx) => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
        <div class="cart-item-details">
          <div class="cart-item-header">
            <h4>${item.name}</h4>
            <button class="cart-remove-btn" onclick="window.removeCartItem(${idx})">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="cart-item-specs">
            <span>TALLA: ${item.size}</span>
            ${item.monogram ? `<span class="gold-text">INICIALES: ${item.monogram}</span>` : ''}
            <span class="cart-item-number">EDICIÓN ${item.numbered}</span>
          </div>
          <div class="cart-item-price-row">
            <div class="cart-qty-ctrl">
              <button onclick="window.updateCartQty(${idx}, -1)">-</button>
              <span>${item.quantity}</span>
              <button onclick="window.updateCartQty(${idx}, 1)">+</button>
            </div>
            <span class="cart-item-price">${cart.formatPrice(item.priceUSD * item.quantity)}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Update Totals
  if (subtotalEl) subtotalEl.textContent = totals.subtotalFormatted;
  if (totalEl) totalEl.textContent = totals.totalFormatted;

  if (cart.promoApplied && discountRow && discountEl) {
    discountRow.style.display = 'flex';
    discountEl.textContent = `-${totals.discountFormatted}`;
  } else if (discountRow) {
    discountRow.style.display = 'none';
  }

  // Free shipping bar ($500 USD threshold)
  const freeThreshold = 500;
  const currentUSD = totals.subtotalUSD;
  const pct = Math.min(100, (currentUSD / freeThreshold) * 100);
  if (freeShipBar) freeShipBar.style.width = `${pct}%`;

  if (freeShipText) {
    if (currentUSD >= freeThreshold) {
      freeShipText.innerHTML = '<span class="gold-text-shimmer">¡ENVÍO VIP EXPRES DE CORTESÍA DESBLOQUEADO!</span>';
    } else {
      const remaining = freeThreshold - currentUSD;
      freeShipText.textContent = `Añada ${cart.formatPrice(remaining)} más para envío VIP de cortesía.`;
    }
  }
}

window.removeCartItem = (idx) => cart.removeItem(idx);
window.updateCartQty = (idx, delta) => cart.updateQuantity(idx, delta);

/* CURRENCY SELECTOR */
function initCurrencySelector() {
  const selectBtn = document.getElementById('currency-btn');
  const dropdown = document.getElementById('currency-dropdown');

  if (!selectBtn || !dropdown) return;

  selectBtn.onclick = (e) => {
    e.stopPropagation();
    audio.playTick(500);
    dropdown.classList.toggle('active');
  };

  document.addEventListener('click', () => dropdown.classList.remove('active'));

  dropdown.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      const code = btn.dataset.currency;
      cart.setCurrency(code);
      const curr = CURRENCIES[code];
      selectBtn.querySelector('.curr-code').textContent = curr.code;
      dropdown.classList.remove('active');
      // Re-render product grid prices
      const activeFilter = document.querySelector('.filter-btn.active')?.dataset.category || 'all';
      renderProducts(activeFilter);
    };
  });
}

/* AUDIO AMBIENCE TOGGLE */
function initAudioToggle() {
  const audioBtn = document.getElementById('audio-toggle-btn');
  if (!audioBtn) return;

  audioBtn.onclick = () => {
    const isMuted = audio.toggleMute();
    if (isMuted) {
      audioBtn.classList.remove('playing');
      audioBtn.querySelector('.audio-label').textContent = 'SONIDO: OFF';
    } else {
      audioBtn.classList.add('playing');
      audioBtn.querySelector('.audio-label').textContent = 'SONIDO: ON (24K)';
    }
  };
}

/* SIMULATED LUXURY CHECKOUT MODAL & WHATSAPP REDIRECT */
function initCheckoutModal() {
  const checkoutTrigger = document.getElementById('cart-checkout-btn');
  const promoBtn = document.getElementById('cart-apply-promo-btn');
  const promoInput = document.getElementById('cart-promo-input');

  if (promoBtn && promoInput) {
    promoBtn.onclick = () => {
      const result = cart.applyPromo(promoInput.value);
      alert(result.message);
      promoInput.value = '';
    };
  }

  if (!checkoutTrigger) return;

  checkoutTrigger.onclick = () => {
    if (cart.cart.length === 0) {
      alert('Añada piezas a su bolso antes de proceder al pago.');
      return;
    }

    audio.playChime();
    window.closeCartDrawer();

    const checkoutModal = document.getElementById('checkout-modal');
    if (!checkoutModal) return;

    const totals = cart.getTotals();
    const content = document.getElementById('checkout-modal-content');

    const itemsSummaryHTML = cart.cart.map(item => `
      <div class="checkout-item-row">
        <img src="${item.image || '/images/goderox_official_logo.jpeg'}" alt="${item.name}" class="checkout-item-img" onerror="this.src='/images/goderox_official_logo.jpeg'" />
        <div class="checkout-item-info">
          <div class="checkout-item-name">${item.name}</div>
          <div class="checkout-item-meta">
            <span class="checkout-item-pill">Talla ${item.size}</span>
            ${item.brand ? `<span>· ${item.brand}</span>` : ''}
            <span>(x${item.quantity})</span>
          </div>
        </div>
        <div class="checkout-item-price">${cart.formatPrice(item.priceUSD * item.quantity)}</div>
      </div>
    `).join('');

    content.innerHTML = `
      <div class="checkout-box animate-fade-in">
        <button class="qv-close-btn" onclick="document.getElementById('checkout-modal').classList.remove('active'); document.body.style.overflow=''">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div class="checkout-header">
          <span class="gold-text-shimmer">CHECKOUT PRIVADO GODEROX</span>
          <h2>FINALIZAR COMPRA POR WHATSAPP</h2>
          <p>Revisa tu resumen e indica tus datos para enviarte la información de pago.</p>
        </div>

        <!-- RESUMEN DE COMPRA -->
        <div class="checkout-summary-box">
          <div class="checkout-summary-title">
            <span>🛍️</span> RESUMEN DEL PEDIDO (${totals.totalCount} ${totals.totalCount === 1 ? 'PIEZA' : 'PIEZAS'})
          </div>
          <div class="checkout-items-list">
            ${itemsSummaryHTML}
          </div>
          <div class="checkout-total-row">
            <span>TOTAL A PAGAR:</span>
            <span>${totals.totalFormatted}</span>
          </div>
        </div>

        <form id="checkout-form" class="checkout-form">
          <div class="form-row">
            <div class="form-group">
              <label for="co-name">NOMBRE COMPLETO <span style="color:#ef4444;">*</span></label>
              <input type="text" id="co-name" required placeholder="Ej: Santiago Morales" class="checkout-field-input" />
            </div>
            <div class="form-group">
              <label for="co-phone">TELÉFONO / WHATSAPP <span style="color:#ef4444;">*</span></label>
              <input type="tel" id="co-phone" required placeholder="Ej: +57 300 123 4567" class="checkout-field-input" />
            </div>
          </div>

          <div class="form-group">
            <label for="co-address">DIRECCIÓN Y CIUDAD DE ENTREGA <span style="color:#ef4444;">*</span></label>
            <input type="text" id="co-address" required placeholder="Ej: Cra 43A # 14-20, Sabaneta, Antioquia" class="checkout-field-input" />
          </div>

          <div class="form-group">
            <label for="co-payment">MÉTODO DE PAGO PREFERIDO <span style="color:#ef4444;">*</span></label>
            <select id="co-payment" class="checkout-field-input">
              <option value="Transferencia Bancolombia / Nequi / Daviplata">💳 Transferencia Bancolombia / Nequi / Daviplata</option>
              <option value="ADDI (Cuotas sin tarjeta)">⚡ Financiamiento ADDI (Cuotas)</option>
              <option value="SISTECRÉDITO">💎 Financiamiento SISTECRÉDITO</option>
              <option value="Tarjeta Crédito / Débito">💳 Tarjeta Crédito / Débito</option>
              <option value="Pago Contra Entrega (Medellín / Sabaneta)">🛵 Pago Contra Entrega (Área Metropolitana)</option>
              <option value="Retiro y Pago en Tienda Física (Sabaneta Mall Zona Sur)">🏢 Retiro en Tienda Física (Sabaneta LC-101)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="co-notes">NOTAS / INSTRUCCIONES ADICIONALES (OPCIONAL)</label>
            <input type="text" id="co-notes" placeholder="Ej: Entregar en horario de la tarde / Nota para regalo..." class="checkout-field-input" />
          </div>

          <button type="submit" class="checkout-submit-btn checkout-wpp-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
            <span>FINALIZAR Y ENVIAR PEDIDO A WHATSAPP</span>
          </button>
        </form>
      </div>
    `;

    checkoutModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    checkoutModal.onclick = (e) => {
      if (e.target === checkoutModal) {
        checkoutModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    };

    document.getElementById('checkout-form').onsubmit = (e) => {
      e.preventDefault();

      const name = document.getElementById('co-name').value.trim();
      const phone = document.getElementById('co-phone').value.trim();
      const address = document.getElementById('co-address').value.trim();
      const paymentMethod = document.getElementById('co-payment').value;
      const notes = document.getElementById('co-notes').value.trim();

      const orderRef = `GDX-${Date.now().toString().slice(-6)}`;
      const now = new Date();
      const orderDate = now.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

      // Detalle de los ítems del pedido con enlace absoluto a la imagen para vista previa en WhatsApp
      const itemLines = cart.cart
        .map((it) => {
          let imgUrl = it.image;
          try {
            imgUrl = new URL(it.image, window.location.origin).href;
          } catch(e){}
          
          return `✦ *${it.name}*\n   Talla: ${it.size} | Cant: ${it.quantity} | ${cart.formatPrice(it.priceUSD * it.quantity)}\n   Enlace: ${imgUrl}`;
        })
        .join('\n\n');

      // Construcción del mensaje minimalista de lujo para GODEROX
      let msg = `*GODEROX* ✨\n\n`;
      msg += `*Orden:* #${orderRef}\n`;
      msg += `*Fecha:* ${orderDate}\n\n`;

      msg += `*Envío a:*\n`;
      msg += `${name}\n`;
      msg += `${phone}\n`;
      msg += `${address}\n\n`;

      msg += `*Piezas (${totals.totalCount}):*\n`;
      msg += `${itemLines}\n\n`;

      msg += `*Resumen:*\n`;
      msg += `Subtotal: ${totals.subtotalFormatted}\n`;
      if (totals.discountUSD > 0) {
        msg += `Descuento VIP: -${totals.discountFormatted}\n`;
      }
      msg += `*Total: ${totals.totalFormatted}*\n\n`;

      msg += `*Pago:* ${paymentMethod}\n`;
      if (notes) {
        msg += `*Nota:* ${notes}\n`;
      }
      msg += `\nHola equipo GODEROX, mi pedido está confirmado en la web. Quedo atento(a) para proceder con el pago. 🖤`;

      const waUrl = `https://wa.me/573046599888?text=${encodeURIComponent(msg)}`;

      audio.playChime();

      // Abrir WhatsApp directamente con el mensaje pre-cargado
      window.open(waUrl, '_blank');

      // Limpiar carrito y cerrar modal
      cart.cart = [];
      cart.saveCart();
      checkoutModal.classList.remove('active');
      document.body.style.overflow = '';
    };
  };
}

/* LIVE SEARCH MODAL (BUSCADOR) */
function initSearchModal() {
  const triggerBtn = document.getElementById('search-trigger-btn');
  const modal = document.getElementById('search-modal');
  const closeBtn = document.getElementById('search-modal-close');
  const searchInput = document.getElementById('search-input');
  const resultsGrid = document.getElementById('search-results-grid');

  if (!triggerBtn || !modal || !searchInput || !resultsGrid) return;

  function renderSearchResults(query = '') {
    const clean = query.toLowerCase().trim();
    const normalized = PRODUCTS.map(p => normalizeProduct(p)).filter(p => p && p.is_active !== false);
    const matches = clean
      ? normalized.filter(p => {
          const inName = (p.name || '').toLowerCase().includes(clean);
          const inBrand = (p.brandName || '').toLowerCase().includes(clean);
          const inCat = (p.categoryName || '').toLowerCase().includes(clean);
          const inDesc = (p.description || '').toLowerCase().includes(clean);
          return inName || inBrand || inCat || inDesc;
        })
      : normalized;

    if (matches.length === 0) {
      resultsGrid.innerHTML = `<p style="text-align:center; color: var(--text-muted); padding: 2rem;">No se encontraron piezas que coincidan con "${query}".</p>`;
      return;
    }

    resultsGrid.innerHTML = matches.slice(0, 20).map(p => `
      <div class="search-result-item" onclick="window.closeSearchModal(); window.openQuickView('${p.id}')">
        <img src="${p.images[0]}" alt="${p.name}" class="search-result-img" onerror="this.src='/images/goderox_official_logo.jpeg'" />
        <div class="search-result-info">
          <h4>${p.name}</h4>
          <span>${p.brandName ? p.brandName + ' · ' : ''}${cart.formatPrice(p.priceUSD)}</span>
        </div>
      </div>
    `).join('');
  }

  triggerBtn.onclick = () => {
    audio.playTick(550);
    renderSearchResults('');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => searchInput.focus(), 100);
  };

  window.closeSearchModal = () => {
    audio.playWhoosh();
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (closeBtn) closeBtn.onclick = window.closeSearchModal;
  modal.onclick = (e) => {
    if (e.target === modal) window.closeSearchModal();
  };

  searchInput.oninput = (e) => {
    audio.playTick(600);
    renderSearchResults(e.target.value);
  };
}

/* BRANDS CARDS INTERACTION */
function initBrandCards() {
  const brandCards = document.querySelectorAll('.brand-item-card');
  brandCards.forEach(card => {
    card.onclick = () => {
      audio.playChime();
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    };
  });
}

/* WISHLIST FAVORITES MODAL */
function initWishlistModal() {
  const triggerBtn = document.getElementById('wishlist-trigger-btn');
  const badgeEl = document.getElementById('wishlist-count-badge');
  const modal = document.getElementById('wishlist-modal');
  const closeBtn = document.getElementById('wishlist-modal-close');
  const resultsGrid = document.getElementById('wishlist-results-grid');

  function updateBadge(items) {
    if (badgeEl) {
      badgeEl.textContent = items.length;
      badgeEl.style.display = items.length > 0 ? 'inline-flex' : 'none';
    }
  }

  wishlist.subscribe(updateBadge);
  updateBadge(wishlist.items);

  if (!triggerBtn || !modal || !resultsGrid) return;

  function renderWishlistItems() {
    const favIds = wishlist.items;
    const favProducts = PRODUCTS.filter(p => favIds.includes(p.id));

    if (favProducts.length === 0) {
      resultsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted); padding: 3rem;">No tienes piezas guardadas en tus favoritos aún.</p>`;
      return;
    }

    resultsGrid.innerHTML = favProducts.map(p => `
      <div class="search-result-item" onclick="window.closeWishlistModal(); window.openQuickView('${p.id}')">
        <img src="${p.images[0]}" alt="${p.name}" class="search-result-img" />
        <div class="search-result-info">
          <h4>${p.name}</h4>
          <span>${cart.formatPrice(p.priceUSD)}</span>
        </div>
      </div>
    `).join('');
  }

  triggerBtn.onclick = () => {
    audio.playTick(550);
    renderWishlistItems();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeWishlistModal = () => {
    audio.playWhoosh();
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (closeBtn) closeBtn.onclick = window.closeWishlistModal;
  modal.onclick = (e) => {
    if (e.target === modal) window.closeWishlistModal();
  };
}
