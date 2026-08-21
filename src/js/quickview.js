/* GODEROX QUICK VIEW & MONOGRAM CUSTOMIZER MODAL */

import { PRODUCTS } from './data.js';
import { cart } from './cart.js';
import { audio } from './audio.js';

export function setupQuickView() {
  const modal = document.getElementById('quick-view-modal');
  const modalContainer = document.getElementById('quick-view-content');

  if (!modal || !modalContainer) return;

  window.openQuickView = function(productId) {
    if (!productId) return;
    let product = typeof window.getGlobalProduct === 'function' ? window.getGlobalProduct(productId) : null;

    if (!product && Array.isArray(PRODUCTS)) {
      const found = PRODUCTS.find(p => p.id === productId || String(p.id) === String(productId));
      if (found && typeof window.normalizeProduct === 'function') {
        product = window.normalizeProduct(found);
      } else if (found) {
        product = found;
      }
    }

    if (!product) {
      try {
        const saved = JSON.parse(localStorage.getItem('goderox_products_db') || '[]');
        const found = saved.find(p => p.id === productId || String(p.id) === String(productId));
        if (found && typeof window.normalizeProduct === 'function') {
          product = window.normalizeProduct(found);
        } else if (found) {
          product = found;
        }
      } catch (e) {}
    }

    if (!product) {
      console.warn("Producto no encontrado para QuickView:", productId);
      return;
    }

    if (typeof window.normalizeProduct === 'function') {
      product = window.normalizeProduct(product);
    }

    audio.playTick(550);
    const availableSizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL'];
    let selectedSize = availableSizes[0];
    let activeImage = product.images && product.images.length > 0 ? product.images[0] : '/images/goderox_official_logo.jpeg';
    let appliedDiscount = 0;

    const brandName = typeof product.brand === 'object' && product.brand !== null ? (product.brand.name || 'GODEROX') : (product.brand || 'GODEROX');
    const categoryName = (product.categoryName || product.category || 'Colección Exclusiva').toUpperCase();
    const descriptionText = product.description || product.shortDescription || 'Pieza exclusiva GODEROX de alta gama. Confeccionada con materiales seleccionados y acabados artesanales de alta calidad.';
    const gsmText = product.gsm || '320 GSM Heavy Premium';

    modalContainer.innerHTML = `
      <div class="qv-grid">
        <!-- Left: Image Gallery & Zoom -->
        <div class="qv-gallery">
          <div class="qv-main-image-wrap" id="qv-zoom-container">
            <img src="${activeImage}" id="qv-main-image" alt="${product.name}" class="qv-main-image" />
            <div class="qv-zoom-lens" id="qv-zoom-lens"></div>
            ${product.badge ? `<div class="qv-badge">${product.badge}</div>` : ''}
            ${product.numbered ? `<div class="qv-numbered-tag">PIEZA ${product.numbered}</div>` : ''}
          </div>
          <div class="qv-thumbs">
            ${(product.images || [activeImage]).map((img, idx) => `
              <button class="qv-thumb ${img === activeImage ? 'active' : ''}" data-src="${img}">
                <img src="${img}" alt="Thumb ${idx + 1}" />
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Right: Details & Customizer -->
        <div class="qv-info">
          <button class="qv-close-btn" id="qv-close-modal" aria-label="Cerrar modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <span class="qv-category">${brandName} · ${categoryName}</span>
          <h2 class="qv-title">${product.name}</h2>
          <div class="qv-price-row">
            <span class="qv-price" id="qv-price-tag">${cart.formatPrice(product.priceUSD)}</span>
            <span class="qv-gsm-pill">${gsmText}</span>
          </div>

          <p class="qv-description">${descriptionText}</p>

          <!-- Size Selector -->
          <div class="qv-section">
            <div class="qv-section-header">
              <label>SELECCIONAR TALLA</label>
              <button class="qv-size-guide-btn" id="qv-size-guide-trigger">Guía de Tallas</button>
            </div>
            <div class="qv-sizes-grid">
              ${availableSizes.map(size => `
                <button class="qv-size-btn ${size === selectedSize ? 'active' : ''}" data-size="${size}">
                  ${size}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Discount Code -->
          <div class="qv-section qv-discount-box">
            <div class="qv-section-header">
              <label class="gold-text-shimmer">CÓDIGO DE DESCUENTO</label>
              <span class="qv-free-label" id="qv-discount-status" style="display:none;"></span>
            </div>
            <div class="qv-discount-input-wrap">
              <input
                type="text"
                id="qv-discount-input"
                maxlength="20"
                placeholder="ej: GODEROX10"
                class="qv-discount-input"
                autocomplete="off"
                style="text-transform:uppercase;"
              />
              <button class="qv-discount-apply-btn" id="qv-discount-apply-btn">
                APLICAR
              </button>
            </div>
            <p class="qv-discount-msg" id="qv-discount-msg" style="display:none;"></p>
          </div>

          <!-- Action Button -->
          <div class="qv-actions">
            <button class="qv-add-btn" id="qv-add-to-cart-btn">
              <span>✦ ASEGURAR PIEZA · GODEROX</span>
              <span class="qv-stock-indicator">• ${product.stock || 5} EN COLECCIÓN</span>
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Event Listeners inside modal
    const closeBtn = document.getElementById('qv-close-modal');
    closeBtn.onclick = () => window.closeQuickView();

    // Thumbnail switcher
    modalContainer.querySelectorAll('.qv-thumb').forEach(thumb => {
      thumb.onclick = (e) => {
        audio.playTick(450);
        modalContainer.querySelectorAll('.qv-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        const mainImg = document.getElementById('qv-main-image');
        mainImg.src = thumb.dataset.src;
      };
    });

    // Size Picker
    modalContainer.querySelectorAll('.qv-size-btn').forEach(btn => {
      btn.onclick = () => {
        audio.playTick(500);
        modalContainer.querySelectorAll('.qv-size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSize = btn.dataset.size;
      };
    });

    // Discount Code Logic
    const discountInput = document.getElementById('qv-discount-input');
    const discountApplyBtn = document.getElementById('qv-discount-apply-btn');
    const discountMsg = document.getElementById('qv-discount-msg');
    const discountStatus = document.getElementById('qv-discount-status');
    const priceTag = document.getElementById('qv-price-tag');

    // Códigos de descuento válidos { código: porcentaje }
    const DISCOUNT_CODES = {
      'GODEROX10': 10,
      'GODEROX15': 15,
      'GODEROX20': 20,
      'VIP30': 30,
      'EXCLUSIVE': 25
    };

    function applyDiscountCode() {
      const code = (discountInput.value || '').toUpperCase().trim();
      if (!code) return;

      if (DISCOUNT_CODES[code] !== undefined) {
        appliedDiscount = DISCOUNT_CODES[code];
        const discountedPrice = product.priceUSD * (1 - appliedDiscount / 100);
        if (priceTag) priceTag.textContent = cart.formatPrice(discountedPrice);
        discountMsg.style.display = 'block';
        discountMsg.style.color = '#4ade80';
        discountMsg.textContent = `✓ Código aplicado — ${appliedDiscount}% de descuento activo`;
        discountStatus.textContent = `-${appliedDiscount}%`;
        discountStatus.style.display = 'inline-flex';
        discountStatus.style.background = 'rgba(74,222,128,0.15)';
        discountStatus.style.color = '#4ade80';
        audio.playTick(700);
      } else {
        appliedDiscount = 0;
        if (priceTag) priceTag.textContent = cart.formatPrice(product.priceUSD);
        discountMsg.style.display = 'block';
        discountMsg.style.color = '#f87171';
        discountMsg.textContent = '✕ Código inválido o expirado';
        discountStatus.style.display = 'none';
        audio.playTick(300);
      }
    }

    discountApplyBtn.onclick = applyDiscountCode;
    discountInput.onkeydown = (e) => { if (e.key === 'Enter') applyDiscountCode(); };
    discountInput.oninput = (e) => {
      e.target.value = e.target.value.toUpperCase();
      // Reset si limpia el campo
      if (!e.target.value) {
        appliedDiscount = 0;
        if (priceTag) priceTag.textContent = cart.formatPrice(product.priceUSD);
        discountMsg.style.display = 'none';
        discountStatus.style.display = 'none';
      }
    };

    // Add to Cart Action
    const addBtn = document.getElementById('qv-add-to-cart-btn');
    addBtn.onclick = () => {
      const finalPrice = appliedDiscount > 0
        ? { ...product, priceUSD: product.priceUSD * (1 - appliedDiscount / 100) }
        : product;
      cart.addItem(finalPrice, selectedSize);
      window.closeQuickView();
      window.openCartDrawer();
    };

    // Size Guide Trigger Action
    const sizeGuideBtn = document.getElementById('qv-size-guide-trigger');
    if (sizeGuideBtn) {
      sizeGuideBtn.onclick = () => {
        window.openSizeGuideModal();
      };
    }

    // Image Zoom interaction
    const imgWrap = document.getElementById('qv-zoom-container');
    const mainImg = document.getElementById('qv-main-image');
    imgWrap.onmousemove = (e) => {
      const rect = imgWrap.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mainImg.style.transformOrigin = `${x}% ${y}%`;
      mainImg.style.transform = 'scale(1.7)';
    };
    imgWrap.onmouseleave = () => {
      mainImg.style.transform = 'scale(1)';
    };
  };

  window.closeQuickView = function() {
    audio.playWhoosh();
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  modal.onclick = (e) => {
    if (e.target === modal) {
      window.closeQuickView();
    }
  };

  /* SIZE GUIDE MODAL CONTROLLER */
  window.openSizeGuideModal = function() {
    const modal = document.getElementById('size-guide-modal');
    const container = document.getElementById('size-guide-modal-body');
    if (!modal) return;

    if (typeof audio !== 'undefined' && audio.playTick) audio.playTick(550);

    const savedGuide = localStorage.getItem('goderox_size_guide');
    let guideData = null;
    try {
      if (savedGuide) guideData = JSON.parse(savedGuide);
    } catch (e) {}

    const guideNote = guideData?.note || '';

    if (container) {
      if (guideData?.imageUrl) {
        container.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; gap:1rem;">
            <img src="${guideData.imageUrl}" alt="Guía de Tallas GODEROX" style="max-width:100%; max-height:480px; border-radius:12px; border:1px solid rgba(200,165,91,0.3); box-shadow:0 12px 35px rgba(0,0,0,0.7); object-fit:contain;" />
            ${guideNote ? `<p style="font-size:0.85rem; color:var(--gold-light); font-weight:600; background:rgba(200,165,91,0.1); border:1px solid rgba(200,165,91,0.25); padding:0.75rem 1.2rem; border-radius:8px; width:100%; max-width:600px;">${guideNote}</p>` : ''}
          </div>
        `;
      } else {
        // Fallback default size guide table if no image uploaded yet
        container.innerHTML = `
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(200,165,91,0.2); border-radius:12px; padding:1.2rem; overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; color:#fff; font-size:0.85rem; text-align:center;">
              <thead>
                <tr style="border-bottom:1px solid rgba(200,165,91,0.3); color:var(--gold-primary); font-family:var(--font-sans); letter-spacing:0.1em;">
                  <th style="padding:0.75rem;">TALLA</th>
                  <th style="padding:0.75rem;">PECHO (CM)</th>
                  <th style="padding:0.75rem;">LARGO (CM)</th>
                  <th style="padding:0.75rem;">HOMBRO (CM)</th>
                  <th style="padding:0.75rem;">FIT</th>
                </tr>
              </thead>
              <tbody style="color:rgba(255,255,255,0.85);">
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:0.75rem; font-weight:bold; color:var(--gold-light);">S</td><td>108</td><td>72</td><td>52</td><td>Oversized Boxy</td></tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:0.75rem; font-weight:bold; color:var(--gold-light);">M</td><td>114</td><td>74</td><td>54</td><td>Oversized Boxy</td></tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:0.75rem; font-weight:bold; color:var(--gold-light);">L</td><td>120</td><td>76</td><td>56</td><td>Oversized Boxy</td></tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:0.75rem; font-weight:bold; color:var(--gold-light);">XL</td><td>126</td><td>78</td><td>58</td><td>Oversized Boxy</td></tr>
                <tr><td style="padding:0.75rem; font-weight:bold; color:var(--gold-light);">XXL</td><td>132</td><td>80</td><td>60</td><td>Oversized Boxy</td></tr>
              </tbody>
            </table>
          </div>
          ${guideNote ? `<p style="margin-top:1rem; font-size:0.85rem; color:var(--gold-light); font-weight:600; background:rgba(200,165,91,0.1); border:1px solid rgba(200,165,91,0.25); padding:0.75rem 1.2rem; border-radius:8px;">${guideNote}</p>` : ''}
        `;
      }
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const closeBtn = document.getElementById('size-guide-modal-close');
    if (closeBtn) {
      closeBtn.onclick = () => window.closeSizeGuideModal();
    }
    modal.onclick = (e) => {
      if (e.target === modal) window.closeSizeGuideModal();
    };
  };

  window.closeSizeGuideModal = function() {
    const modal = document.getElementById('size-guide-modal');
    if (modal) {
      if (typeof audio !== 'undefined' && audio.playWhoosh) audio.playWhoosh();
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };
}
