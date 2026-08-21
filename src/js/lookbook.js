/* GODEROX HIGH FASHION LOOKBOOK CONTROLLER */

import { LOOKBOOK_LOOKS, PRODUCTS } from './data.js';
import { audio } from './audio.js';

export function setupLookbook() {
  const lookbookGrid = document.getElementById('lookbook-grid');
  if (!lookbookGrid) return;

  lookbookGrid.innerHTML = LOOKBOOK_LOOKS.map(look => {
    const featuredProds = look.featuredItems
      .map(id => PRODUCTS.find(p => p.id === id))
      .filter(Boolean);

    return `
      <div class="lb-card" data-look="${look.id}">
        <div class="lb-image-wrap">
          <img src="${look.image}" alt="${look.title}" class="lb-img" loading="lazy" />
          <div class="lb-overlay">
            <span class="lb-subtitle">${look.subtitle}</span>
            <h3 class="lb-title">${look.title}</h3>
            <p class="lb-desc">${look.description}</p>

            <div class="lb-products-tags">
              ${featuredProds.map(p => `
                <button class="lb-product-pill" onclick="event.stopPropagation(); window.openQuickView('${p.id}')">
                  <span>${p.name}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add click to view full screen
  lookbookGrid.querySelectorAll('.lb-card').forEach(card => {
    card.onclick = () => {
      audio.playTick(500);
      const lookId = card.dataset.look;
      const look = LOOKBOOK_LOOKS.find(l => l.id === lookId);
      if (look) {
        window.openLookbookModal(look);
      }
    };
  });

  window.openLookbookModal = function(look) {
    const modal = document.getElementById('lookbook-modal');
    const content = document.getElementById('lookbook-modal-content');
    if (!modal || !content) return;

    audio.playChime();
    content.innerHTML = `
      <div class="lb-modal-body">
        <button class="qv-close-btn" onclick="window.closeLookbookModal()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div class="lb-modal-image-wrap">
          <img src="${look.image}" alt="${look.title}" />
        </div>
        <div class="lb-modal-details">
          <span class="gold-text-shimmer">${look.subtitle}</span>
          <h2>${look.title}</h2>
          <p>${look.description}</p>
          <div class="lb-modal-cta-box">
            <h4>PIEZAS DEL LOOK EDITORIAL</h4>
            <div class="lb-modal-items-list">
              ${look.featuredItems.map(id => {
                const prod = PRODUCTS.find(p => p.id === id);
                if (!prod) return '';
                return `
                  <div class="lb-modal-item-row" onclick="window.closeLookbookModal(); window.openQuickView('${prod.id}')">
                    <img src="${prod.images[0]}" alt="${prod.name}" />
                    <div>
                      <h5>${prod.name}</h5>
                      <span class="gold-text">${prod.priceUSD} USD</span>
                    </div>
                    <button class="lb-view-btn">VER PIEZA</button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeLookbookModal = function() {
    audio.playWhoosh();
    const modal = document.getElementById('lookbook-modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
  };
}
