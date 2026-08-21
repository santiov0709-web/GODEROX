/* GODEROX ADMIN — PRODUCTS MODULE */
import { getAllProducts, createProduct, updateProduct, deleteProduct, toggleProductActive } from '../api/products.api.js';
import { getAllBrands } from '../api/brands.api.js';
import { getAllCategories } from '../api/categories.api.js';
import { uploadProductImage } from '../api/storage.api.js';
import { showToast, updateSidebarCounters } from './admin-app.js';

let allProducts = [];
let allBrands = [];
let allCategories = [];
let editingProductId = null;
let pendingImages = []; // { file, previewUrl, uploadedUrl }

/* ─── RENDER PRODUCTS TABLE ─── */
export async function initProductsModule(container) {
  try {
    [allProducts, allBrands, allCategories] = await Promise.all([
      getAllProducts({ isActive: undefined }),
      getAllBrands(),
      getAllCategories({})
    ]);

    renderProductsTable(container, allProducts);
    attachProductTableEvents(container);
    initProductDrawer();
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p style="color:#fca5a5;">Error: ${err.message}</p></div>`;
  }
}

function renderProductsTable(container, products) {
  container.innerHTML = `
    <div class="section-header">
      <div class="section-title-group">
        <h1>Productos</h1>
        <p>${products.length} productos en la base de datos</p>
      </div>
      <button class="btn btn-primary" id="add-product-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nuevo Producto
      </button>
    </div>

    <div class="filters-bar">
      <div class="search-input-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="product-search" class="input-search" placeholder="Buscar por nombre, marca, categoría..." />
      </div>
      <select id="filter-section" class="select-filter">
        <option value="">Todas las secciones</option>
        <option value="hombre">Hombre</option>
        <option value="mujer">Mujer</option>
        <option value="perfumes">Perfumería Luxury</option>
      </select>
      <select id="filter-status" class="select-filter">
        <option value="">Todos los estados</option>
        <option value="active">Activos</option>
        <option value="inactive">Inactivos</option>
        <option value="promo">En Promociones</option>
      </select>
    </div>

    ${products.length === 0 ? `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <h3>No hay productos aún</h3>
        <p>Haz clic en "Nuevo Producto" para agregar el primer producto al catálogo.</p>
      </div>
    ` : `
      <div class="data-table-wrap">
        <table class="data-table" id="products-data-table">
          <thead>
            <tr>
              <th>PRODUCTO</th>
              <th>MARCA</th>
              <th>SECCIÓN / CATEGORÍA</th>
              <th>PRECIO</th>
              <th>ESTADO</th>
              <th>PROMO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => renderProductRow(p)).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
}

function renderProductRow(p) {
  const brandName = p.brand?.name || (allBrands.find(b => b.id === p.brand_id)?.name) || '—';
  const catName = p.category?.name || (allCategories.find(c => c.id === p.category_id)?.name) || '—';

  return `
    <tr data-id="${p.id}">
      <td>
        <div style="display:flex; align-items:center; gap:0.875rem;">
          <img
            src="${p.images?.[0] || ''}"
            alt="${p.name}"
            class="table-img"
            onerror="this.style.display='none'"
          />
          <div>
            <span class="table-product-name">${p.name}</span>
            <span class="table-product-sub">GSM: ${p.gsm || '—'}</span>
          </div>
        </div>
      </td>
      <td>${brandName}</td>
      <td>
        <span style="font-size:0.75rem; text-transform:uppercase; color:var(--gold-light);">${p.section || '—'}</span>
        <br/><span style="font-size:0.75rem; color:var(--text-muted);">${catName}</span>
      </td>
      <td class="table-price">
        $${(p.price_usd < 1000 ? p.price_usd * 1000 : p.price_usd).toLocaleString('es-CO')} COP
        ${p.old_price_usd ? `<br/><span style="font-size:0.72rem; color:var(--text-muted); text-decoration:line-through;">$${(p.old_price_usd < 1000 ? p.old_price_usd * 1000 : p.old_price_usd).toLocaleString('es-CO')} COP</span>` : ''}
      </td>
      <td>
        <label class="toggle-switch" title="${p.is_active ? 'Desactivar' : 'Activar'}">
          <input type="checkbox" class="toggle-active-cb" data-id="${p.id}" data-status="${p.is_active}" ${p.is_active ? 'checked' : ''} />
          <span class="toggle-track"></span>
        </label>
      </td>
      <td>
        ${p.is_promo ? '<span class="status-badge status-promo">★ Promo</span>' : '<span style="color:var(--text-muted); font-size:0.75rem;">—</span>'}
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm edit-product-btn" data-id="${p.id}" title="Editar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar
          </button>
          <button class="btn btn-danger btn-sm delete-product-btn" data-id="${p.id}" data-name="${p.name}" title="Eliminar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function attachProductTableEvents(container) {
  // Add product btn
  container.addEventListener('click', (e) => {
    if (e.target.closest('#add-product-btn')) {
      window.openProductDrawer();
    }
  });

  // Search & filters
  container.querySelector('#product-search')?.addEventListener('input', (e) => {
    applyProductFilters(container);
  });
  container.querySelector('#filter-section')?.addEventListener('change', () => applyProductFilters(container));
  container.querySelector('#filter-status')?.addEventListener('change', () => applyProductFilters(container));

  // Edit buttons
  container.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-product-btn');
    if (editBtn) {
      const product = allProducts.find(p => p.id === editBtn.dataset.id);
      if (product) window.openProductDrawer(product);
    }
  });

  // Delete buttons
  container.addEventListener('click', async (e) => {
    const delBtn = e.target.closest('.delete-product-btn');
    if (delBtn) {
      const { id, name } = delBtn.dataset;
      if (!confirm(`¿Eliminar permanentemente "${name}"? Esta acción no se puede deshacer.`)) return;
      try {
        await deleteProduct(id);
        showToast(`"${name}" eliminado correctamente.`, 'success');
        allProducts = allProducts.filter(p => p.id !== id);
        renderProductsTable(container, allProducts);
        attachProductTableEvents(container);
        updateSidebarCounters();
      } catch (err) {
        showToast(`Error al eliminar: ${err.message}`, 'error');
      }
    }
  });

  // Toggle active
  container.addEventListener('change', async (e) => {
    const cb = e.target.closest('.toggle-active-cb');
    if (cb) {
      const { id, status } = cb.dataset;
      const currentStatus = status === 'true';
      try {
        await toggleProductActive(id, currentStatus);
        const p = allProducts.find(prod => prod.id === id);
        if (p) p.is_active = !currentStatus;
        showToast(`Producto ${!currentStatus ? 'activado' : 'desactivado'}.`, 'success');
      } catch (err) {
        showToast('Error al cambiar estado.', 'error');
        cb.checked = currentStatus; // Revert UI
      }
    }
  });
}

function applyProductFilters(container) {
  const searchVal = container.querySelector('#product-search')?.value.toLowerCase() || '';
  const sectionVal = container.querySelector('#filter-section')?.value || '';
  const statusVal = container.querySelector('#filter-status')?.value || '';

  let filtered = allProducts.filter(p => {
    const brand = allBrands.find(b => b.id === p.brand_id);
    const matchSearch = !searchVal
      || p.name.toLowerCase().includes(searchVal)
      || (brand?.name || '').toLowerCase().includes(searchVal);

    const matchSection = !sectionVal || p.section === sectionVal;
    const matchStatus = !statusVal
      || (statusVal === 'active' && p.is_active)
      || (statusVal === 'inactive' && !p.is_active)
      || (statusVal === 'promo' && p.is_promo);

    return matchSearch && matchSection && matchStatus;
  });

  const tbody = container.querySelector('#products-data-table tbody');
  if (tbody) {
    tbody.innerHTML = filtered.length > 0
      ? filtered.map(p => renderProductRow(p)).join('')
      : `<tr><td colspan="7" style="text-align:center; padding:3rem; color:var(--text-muted);">No se encontraron productos con estos filtros.</td></tr>`;
  }
}

/* ─── PRODUCT DRAWER (CREATE / EDIT) ─── */
function initProductDrawer() {
  const backdrop = document.getElementById('product-drawer-backdrop');
  const closeBtn = document.getElementById('close-product-drawer');
  const cancelBtn = document.getElementById('cancel-product-btn');
  const saveBtn = document.getElementById('save-product-btn');
  const sectionSelect = document.getElementById('p-section');

  // Close events
  closeBtn?.addEventListener('click', closeProductDrawer);
  cancelBtn?.addEventListener('click', closeProductDrawer);
  backdrop?.addEventListener('click', (e) => { if (e.target === backdrop) closeProductDrawer(); });

  // Section → Update category options
  sectionSelect?.addEventListener('change', () => {
    populateCategorySelect(sectionSelect.value);
  });

  // Save
  saveBtn?.addEventListener('click', handleSaveProduct);

  // Setup chips
  setupChipGroup('sizes-chip-group', 'p-selected-sizes');
  setupChipGroup('tags-chip-group', 'p-selected-tags');

  // Setup Drag & Drop upload
  setupProductImageUpload();
}

function populateBrandSelect(selectedId = '') {
  const select = document.getElementById('p-brand');
  if (!select) return;
  select.innerHTML = `<option value="">Seleccionar marca...</option>`;
  allBrands.filter(b => b.is_active).forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = b.name;
    opt.selected = b.id === selectedId;
    select.appendChild(opt);
  });
}

function populateCategorySelect(section, selectedId = '') {
  const select = document.getElementById('p-category');
  if (!select) return;
  const cats = allCategories.filter(c => c.section === section && c.is_active);
  if (cats.length === 0) {
    select.innerHTML = `<option value="">No hay categorías para esta sección</option>`;
    return;
  }
  select.innerHTML = `<option value="">Seleccionar categoría...</option>`;
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    opt.selected = c.id === selectedId;
    select.appendChild(opt);
  });
}

function setupChipGroup(groupId, hiddenInputId) {
  const group = document.getElementById(groupId);
  const hidden = document.getElementById(hiddenInputId);
  if (!group || !hidden) return;

  group.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      const selected = [...group.querySelectorAll('.chip.selected')].map(c => c.dataset.size || c.dataset.tag);
      hidden.value = JSON.stringify(selected);
    });
  });
}

function setupProductImageUpload() {
  const zone = document.getElementById('product-upload-zone');
  const input = document.getElementById('product-image-input');
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleImageFiles(Array.from(e.dataTransfer.files));
  });

  input.addEventListener('change', () => {
    handleImageFiles(Array.from(input.files));
    input.value = ''; // Reset so same file can be re-added
  });
}

function handleImageFiles(files) {
  const preview = document.getElementById('product-image-preview');
  if (!preview) return;

  files.filter(f => f.type.startsWith('image/')).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const entry = { file, previewUrl: e.target.result, uploadedUrl: null };
      pendingImages.push(entry);
      updateImagePreview();
    };
    reader.readAsDataURL(file);
  });
}

function updateImagePreview() {
  const preview = document.getElementById('product-image-preview');
  if (!preview) return;

  preview.innerHTML = pendingImages.map((img, idx) => `
    <div class="image-preview-item">
      <img src="${img.uploadedUrl || img.previewUrl}" alt="Preview ${idx + 1}" />
      <button class="image-preview-remove" data-idx="${idx}" title="Eliminar imagen">✕</button>
      ${!img.uploadedUrl ? '<div class="image-upload-progress" style="transform:scaleX(0);"></div>' : ''}
    </div>
  `).join('');

  preview.querySelectorAll('.image-preview-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingImages.splice(Number(btn.dataset.idx), 1);
      updateImagePreview();
    });
  });
}

async function uploadPendingImages() {
  const results = [];
  for (const img of pendingImages) {
    if (img.uploadedUrl) {
      results.push(img.uploadedUrl);
      continue;
    }
    try {
      const url = await uploadProductImage(img.file);
      img.uploadedUrl = url;
      results.push(url);
    } catch (err) {
      showToast(`Error subiendo imagen: ${err.message}`, 'error');
    }
  }
  return results;
}

function resetProductForm() {
  editingProductId = null;
  pendingImages = [];

  document.getElementById('product-id-field').value = '';
  document.getElementById('p-name').value = '';
  document.getElementById('p-description').value = '';
  document.getElementById('p-gsm').value = '';
  document.getElementById('p-price').value = '';
  document.getElementById('p-old-price').value = '';
  document.getElementById('p-stock').value = '';
  document.getElementById('p-is-promo').checked = false;
  document.getElementById('p-is-active').checked = true;
  document.getElementById('p-selected-sizes').value = '[]';
  document.getElementById('p-selected-tags').value = '[]';
  document.getElementById('p-images-json').value = '[]';

  document.querySelectorAll('#sizes-chip-group .chip').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('#tags-chip-group .chip').forEach(c => c.classList.remove('selected'));

  const preview = document.getElementById('product-image-preview');
  if (preview) preview.innerHTML = '';

  populateBrandSelect();
  populateCategorySelect('');
}

function populateProductForm(product) {
  editingProductId = product.id;
  pendingImages = (product.images || []).map(url => ({ file: null, previewUrl: url, uploadedUrl: url }));

  document.getElementById('product-id-field').value = product.id;
  document.getElementById('p-name').value = product.name || '';
  document.getElementById('p-description').value = product.description || '';
  document.getElementById('p-gsm').value = product.gsm || '';
  document.getElementById('p-price').value = product.price_usd || '';
  document.getElementById('p-old-price').value = product.old_price_usd || '';
  document.getElementById('p-stock').value = product.stock || '';
  document.getElementById('p-is-promo').checked = !!product.is_promo;
  document.getElementById('p-is-active').checked = product.is_active !== false;

  populateBrandSelect(product.brand_id);

  const section = product.section || '';
  const sectionEl = document.getElementById('p-section');
  if (sectionEl) sectionEl.value = section;
  populateCategorySelect(section, product.category_id);

  // Tags
  const tags = product.tags || [];
  document.querySelectorAll('#tags-chip-group .chip').forEach(chip => {
    chip.classList.toggle('selected', tags.includes(chip.dataset.tag));
  });
  document.getElementById('p-selected-tags').value = JSON.stringify(tags);

  // Sizes
  const sizes = product.sizes || [];
  document.querySelectorAll('#sizes-chip-group .chip').forEach(chip => {
    chip.classList.toggle('selected', sizes.includes(chip.dataset.size));
  });
  document.getElementById('p-selected-sizes').value = JSON.stringify(sizes);

  updateImagePreview();
}

function closeProductDrawer() {
  document.getElementById('product-drawer-backdrop').classList.remove('open');
}

window.openProductDrawer = function(product = null) {
  resetProductForm();
  if (product) {
    document.getElementById('product-drawer-title').textContent = 'Editar Producto';
    populateProductForm(product);
  } else {
    document.getElementById('product-drawer-title').textContent = 'Nuevo Producto';
  }
  document.getElementById('product-drawer-backdrop').classList.add('open');
};

async function handleSaveProduct() {
  const saveBtn = document.getElementById('save-product-btn');
  const name = document.getElementById('p-name').value.trim();
  const brandId = document.getElementById('p-brand').value;
  const section = document.getElementById('p-section').value;
  const categoryId = document.getElementById('p-category').value;
  const priceUsd = parseFloat(document.getElementById('p-price').value) || 0;
  const oldPriceUsd = parseFloat(document.getElementById('p-old-price').value) || null;
  const stock = parseInt(document.getElementById('p-stock').value) || 0;
  const description = document.getElementById('p-description').value.trim();
  const gsm = document.getElementById('p-gsm').value.trim();
  const isPromo = document.getElementById('p-is-promo').checked;
  const isActive = document.getElementById('p-is-active').checked;

  const sizes = JSON.parse(document.getElementById('p-selected-sizes').value || '[]');
  const tags = JSON.parse(document.getElementById('p-selected-tags').value || '[]');

  if (!name || !brandId || !section || !categoryId || !priceUsd) {
    showToast('Por favor, completa todos los campos obligatorios (*).', 'error');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.innerHTML = '<div class="spinner"></div> Guardando...';

  try {
    // Upload any pending files
    const imageUrls = await uploadPendingImages();

    const discountPercentage = oldPriceUsd && oldPriceUsd > priceUsd
      ? Math.round(((oldPriceUsd - priceUsd) / oldPriceUsd) * 100)
      : null;

    const payload = {
      name,
      brand_id: brandId,
      section,
      category_id: categoryId,
      price_usd: priceUsd,
      old_price_usd: oldPriceUsd,
      discount_percentage: discountPercentage,
      description,
      gsm,
      images: imageUrls,
      sizes,
      tags,
      stock,
      is_promo: isPromo,
      is_active: isActive
    };

    if (editingProductId) {
      await updateProduct(editingProductId, payload);
      showToast(`"${name}" actualizado correctamente. ✓`, 'success');
    } else {
      await createProduct(payload);
      showToast(`"${name}" publicado en la tienda. ✓`, 'success');
    }

    window.dispatchEvent(new CustomEvent('goderox:product-updated'));
    closeProductDrawer();

    // Refresh the products list
    const content = document.getElementById('admin-content-area');
    if (content) await initProductsModule(content);
    updateSidebarCounters();

  } catch (err) {
    showToast(`Error al guardar: ${err.message}`, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Guardar Producto`;
  }
}
