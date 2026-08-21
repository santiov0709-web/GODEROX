/* GODEROX BRANDS RENDERER & DYNAMIC ADMIN MODAL */

import { brandRegistry } from './brands-data.js';
import { audio } from './audio.js';

export function setupBrandsSection() {
  const brandsGrid = document.getElementById('brands-grid');
  if (!brandsGrid) return;

  function renderGrid(brands) {
    brandsGrid.innerHTML = brands.map(brand => {
      let logoContent = '';

      if (brand.logoUrl) {
        logoContent = `<img src="${brand.logoUrl}" alt="${brand.name} Official Logo" class="brand-logo-img" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'brand-placeholder-badge\\'><span>${brand.placeholder}</span><small>SELLO ATELIER</small></div>'" />`;
      } else if (brand.svgPath) {
        logoContent = brand.svgPath;
      } else {
        logoContent = `
          <div class="brand-placeholder-badge">
            <span>${brand.placeholder}</span>
            <small>LOGOTIPO EN PANEL</small>
          </div>
        `;
      }

      return `
        <div class="brand-item-card" data-brand-id="${brand.id}" title="${brand.name} - Ver colección">
          <div class="brand-logo-wrap">
            ${logoContent}
          </div>
          <span class="brand-subtext">${brand.subtext}</span>
          <button class="brand-edit-badge" onclick="event.stopPropagation(); window.openBrandAdminModal('${brand.id}')" title="Actualizar logotipo desde Panel de Administración">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            PANEL
          </button>
        </div>
      `;
    }).join('');

    // Attach click to scroll to catalog
    brandsGrid.querySelectorAll('.brand-item-card').forEach(card => {
      card.onclick = () => {
        audio.playChime();
        const catalogEl = document.getElementById('catalog');
        if (catalogEl) {
          catalogEl.scrollIntoView({ behavior: 'smooth' });
        }
      };
    });
  }

  brandRegistry.subscribe(renderGrid);
  renderGrid(brandRegistry.brands);

  // Admin Modal Window
  window.openBrandAdminModal = function(selectedBrandId = '') {
    audio.playTick(550);
    const modal = document.getElementById('brand-admin-modal');
    const content = document.getElementById('brand-admin-content');
    if (!modal || !content) return;

    const brandList = brandRegistry.brands;
    const activeBrand = brandList.find(b => b.id === selectedBrandId) || brandList[0];

    content.innerHTML = `
      <div class="brand-admin-box animate-fade-in">
        <button class="qv-close-btn" onclick="window.closeBrandAdminModal()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div class="brand-admin-header">
          <span class="gold-text-shimmer">PANEL ADMINISTRATIVO GODEROX</span>
          <h2>GESTIÓN DE LOGOTIPOS DE MARCAS</h2>
          <p>Actualiza o carga logotipos oficiales (SVG/PNG transparente). Los cambios se actualizarán instantáneamente en toda la tienda.</p>
        </div>

        <div class="brand-admin-selector-row">
          ${brandList.map(b => `
            <button class="brand-select-btn ${b.id === activeBrand.id ? 'active' : ''}" onclick="window.openBrandAdminModal('${b.id}')">
              ${b.name}
            </button>
          `).join('')}
        </div>

        <div class="brand-edit-form">
          <div class="brand-preview-card">
            <label>VISTA PREVIA EN TIENDA (${activeBrand.name})</label>
            <div class="brand-item-card preview-card">
              <div class="brand-logo-wrap">
                ${activeBrand.logoUrl 
                  ? `<img src="${activeBrand.logoUrl}" alt="Preview" class="brand-logo-img" />`
                  : activeBrand.svgPath
                }
              </div>
              <span class="brand-subtext">${activeBrand.subtext}</span>
            </div>
          </div>

          <form id="brand-upload-form" class="brand-form-group">
            <div class="form-group">
              <label>URL DEL LOGOTIPO OFICIAL (SVG / PNG TRANSPARENTE)</label>
              <input type="text" id="brand-url-input" class="form-input" placeholder="Ej: /images/mi_logo.svg o https://dominio.com/logo.png" value="${activeBrand.logoUrl}" />
            </div>

            <div class="form-group">
              <label>O CARGAR ARCHIVO DESDE TU DISPOSITIVO</label>
              <input type="file" id="brand-file-input" accept="image/png, image/svg+xml, image/jpeg, image/webp" class="form-input" style="padding: 0.5rem;" />
            </div>

            <div style="display:flex; gap: 1rem; margin-top: 1rem;">
              <button type="submit" class="primary-btn" style="flex:1;">GUARDAR LOGOTIPO OFICIAL</button>
              <button type="button" class="secondary-btn" id="reset-brand-logo-btn">RESTAURAR OFICIAL DEFAULT</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Form submit listener
    const form = document.getElementById('brand-upload-form');
    const urlInput = document.getElementById('brand-url-input');
    const fileInput = document.getElementById('brand-file-input');
    const resetBtn = document.getElementById('reset-brand-logo-btn');

    // Convert uploaded file to Data URL if chosen
    fileInput.onchange = (evt) => {
      const file = evt.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          urlInput.value = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    };

    form.onsubmit = (e) => {
      e.preventDefault();
      const val = urlInput.value.trim();
      brandRegistry.updateBrandLogo(activeBrand.id, val);
      window.closeBrandAdminModal();
      alert(`¡Logotipo oficial de ${activeBrand.name} actualizado con éxito! Se ha reflejado en toda la tienda.`);
    };

    resetBtn.onclick = () => {
      brandRegistry.resetBrandLogo(activeBrand.id);
      window.closeBrandAdminModal();
    };
  };

  window.closeBrandAdminModal = function() {
    audio.playWhoosh();
    const modal = document.getElementById('brand-admin-modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
  };
}
