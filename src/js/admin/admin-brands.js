/* GODEROX ADMIN — BRANDS MODULE */
import { getAllBrands, createBrand, updateBrand, deleteBrand, toggleBrandActive } from '../api/brands.api.js';
import { uploadBrandLogo } from '../api/storage.api.js';
import { showToast, updateSidebarCounters } from './admin-app.js';

let allBrands = [];
let editingBrandId = null;
let pendingLogoFile = null;

/* ─── RENDER BRANDS TABLE ─── */
export async function initBrandsModule(container) {
  try {
    allBrands = await getAllBrands();
    renderBrandsTable(container, allBrands);
    attachBrandTableEvents(container);
    initBrandDrawer();
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p style="color:#fca5a5;">Error: ${err.message}</p></div>`;
  }
}

function renderBrandsTable(container, brands) {
  container.innerHTML = `
    <div class="section-header">
      <div class="section-title-group">
        <h1>Marcas</h1>
        <p>${brands.length} marcas registradas en el sistema</p>
      </div>
      <button class="btn btn-primary" id="add-brand-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nueva Marca
      </button>
    </div>

    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>LOGOTIPO</th>
            <th>NOMBRE</th>
            <th>SUBTEXTO</th>
            <th>ORDEN</th>
            <th>ESTADO</th>
            <th>ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          ${brands.length > 0 ? brands.map(b => `
            <tr data-id="${b.id}">
              <td>
                ${b.logo_url
                  ? `<img src="${b.logo_url}" alt="${b.name}" style="max-height:40px; max-width:100px; object-fit:contain; border:1px solid var(--border); border-radius:4px; padding:4px; background:rgba(255,255,255,0.04);" />`
                  : `<span style="font-size:0.75rem; color:var(--text-muted);">Sin logotipo</span>`
                }
              </td>
              <td><strong>${b.name}</strong></td>
              <td style="color:var(--text-muted); font-size:0.8rem;">${b.subtext || '—'}</td>
              <td style="text-align:center;">${b.display_order || '—'}</td>
              <td>
                <label class="toggle-switch" title="${b.is_active ? 'Desactivar' : 'Activar'}">
                  <input type="checkbox" class="brand-toggle-cb" data-id="${b.id}" data-status="${b.is_active}" ${b.is_active ? 'checked' : ''} />
                  <span class="toggle-track"></span>
                </label>
              </td>
              <td>
                <div class="table-actions">
                  <button class="btn btn-ghost btn-sm edit-brand-btn" data-id="${b.id}" title="Editar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Editar
                  </button>
                  <button class="btn btn-danger btn-sm delete-brand-btn" data-id="${b.id}" data-name="${b.name}" title="Eliminar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          `).join('') : `
            <tr><td colspan="6" style="text-align:center; padding:3rem; color:var(--text-muted);">No hay marcas registradas aún.</td></tr>
          `}
        </tbody>
      </table>
    </div>
  `;
}

function attachBrandTableEvents(container) {
  container.addEventListener('click', (e) => {
    if (e.target.closest('#add-brand-btn')) window.openBrandDrawer();
  });

  container.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-brand-btn');
    if (editBtn) {
      const brand = allBrands.find(b => b.id === editBtn.dataset.id);
      if (brand) window.openBrandDrawer(brand);
    }
  });

  container.addEventListener('click', async (e) => {
    const delBtn = e.target.closest('.delete-brand-btn');
    if (delBtn) {
      const { id, name } = delBtn.dataset;
      if (!confirm(`¿Eliminar la marca "${name}"?`)) return;
      try {
        await deleteBrand(id);
        showToast(`Marca "${name}" eliminada.`, 'success');
        allBrands = allBrands.filter(b => b.id !== id);
        renderBrandsTable(container, allBrands);
        attachBrandTableEvents(container);
        updateSidebarCounters();
      } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
      }
    }
  });

  container.addEventListener('change', async (e) => {
    const cb = e.target.closest('.brand-toggle-cb');
    if (cb) {
      const { id, status } = cb.dataset;
      const currentStatus = status === 'true';
      try {
        await toggleBrandActive(id, currentStatus);
        const b = allBrands.find(brand => brand.id === id);
        if (b) b.is_active = !currentStatus;
        showToast(`Marca ${!currentStatus ? 'activada' : 'desactivada'}.`, 'success');
      } catch (err) {
        showToast('Error al cambiar estado.', 'error');
        cb.checked = currentStatus;
      }
    }
  });
}

/* ─── BRAND DRAWER ─── */
function initBrandDrawer() {
  const backdrop = document.getElementById('brand-drawer-backdrop');
  const closeBtn = document.getElementById('close-brand-drawer');
  const cancelBtn = document.getElementById('cancel-brand-btn');
  const saveBtn = document.getElementById('save-brand-btn');
  const logoZone = document.getElementById('brand-logo-upload-zone');
  const logoInput = document.getElementById('brand-logo-input');

  closeBtn?.addEventListener('click', closeBrandDrawer);
  cancelBtn?.addEventListener('click', closeBrandDrawer);
  backdrop?.addEventListener('click', (e) => { if (e.target === backdrop) closeBrandDrawer(); });
  saveBtn?.addEventListener('click', handleSaveBrand);

  logoZone?.addEventListener('click', () => logoInput?.click());
  logoZone?.addEventListener('dragover', (e) => { e.preventDefault(); logoZone.classList.add('drag-over'); });
  logoZone?.addEventListener('dragleave', () => logoZone.classList.remove('drag-over'));
  logoZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    logoZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleLogoFile(file);
  });

  logoInput?.addEventListener('change', () => {
    const file = logoInput.files[0];
    if (file) handleLogoFile(file);
  });

  const logoUrlInput = document.getElementById('brand-logo-url');
  logoUrlInput?.addEventListener('input', () => {
    const url = logoUrlInput.value.trim();
    const preview = document.getElementById('brand-logo-preview');
    const previewImg = document.getElementById('brand-logo-preview-img');
    if (url && preview && previewImg) {
      previewImg.src = url;
      preview.style.display = 'block';
      pendingLogoFile = null;
    } else if (preview && !pendingLogoFile) {
      preview.style.display = 'none';
    }
  });
}

function handleLogoFile(file) {
  pendingLogoFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('brand-logo-preview');
    const previewImg = document.getElementById('brand-logo-preview-img');
    if (preview && previewImg) {
      previewImg.src = e.target.result;
      preview.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
}

function resetBrandForm() {
  editingBrandId = null;
  pendingLogoFile = null;
  document.getElementById('brand-id-field').value = '';
  document.getElementById('b-name').value = '';
  document.getElementById('b-subtext').value = '';
  if (document.getElementById('b-description')) document.getElementById('b-description').value = '';
  document.getElementById('b-order').value = '';
  document.getElementById('b-is-active').checked = true;
  document.getElementById('brand-logo-url').value = '';
  const preview = document.getElementById('brand-logo-preview');
  if (preview) preview.style.display = 'none';
}

window.openBrandDrawer = function(brand = null) {
  resetBrandForm();
  if (brand) {
    document.getElementById('brand-drawer-title').textContent = 'Editar Marca';
    document.getElementById('brand-id-field').value = brand.id;
    document.getElementById('b-name').value = brand.name || '';
    document.getElementById('b-subtext').value = brand.subtext || '';
    if (document.getElementById('b-description')) document.getElementById('b-description').value = brand.description || '';
    document.getElementById('b-order').value = brand.display_order || '';
    document.getElementById('b-is-active').checked = brand.is_active !== false;
    document.getElementById('brand-logo-url').value = brand.logo_url || '';

    if (brand.logo_url) {
      const preview = document.getElementById('brand-logo-preview');
      const previewImg = document.getElementById('brand-logo-preview-img');
      if (preview && previewImg) {
        previewImg.src = brand.logo_url;
        preview.style.display = 'block';
      }
    }

    editingBrandId = brand.id;
  } else {
    document.getElementById('brand-drawer-title').textContent = 'Nueva Marca';
  }
  document.getElementById('brand-drawer-backdrop').classList.add('open');
};

function closeBrandDrawer() {
  document.getElementById('brand-drawer-backdrop').classList.remove('open');
}

async function handleSaveBrand() {
  const saveBtn = document.getElementById('save-brand-btn');
  const name = document.getElementById('b-name').value.trim();
  const subtext = document.getElementById('b-subtext').value.trim();
  const description = document.getElementById('b-description')?.value.trim() || '';
  const order = parseInt(document.getElementById('b-order').value) || 1;
  const isActive = document.getElementById('b-is-active').checked;

  if (!name) {
    showToast('El nombre de la marca es obligatorio.', 'error');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.innerHTML = '<div class="spinner"></div> Guardando...';

  try {
    let logoUrl = document.getElementById('brand-logo-url').value || null;

    if (pendingLogoFile) {
      logoUrl = await uploadBrandLogo(pendingLogoFile);
    }

    const payload = { name, subtext, description, logo_url: logoUrl, display_order: order, is_active: isActive };

    try {
      if (editingBrandId) {
        await updateBrand(editingBrandId, payload);
      } else {
        await createBrand(payload);
      }
    } catch (saveErr) {
      if (saveErr.message && saveErr.message.includes('description')) {
        console.warn('La columna description no existe en Supabase aún. Guardando sin la columna...', saveErr);
        delete payload.description;
        if (editingBrandId) {
          await updateBrand(editingBrandId, payload);
        } else {
          await createBrand(payload);
        }
        showToast('Marca guardada. Tip: ejecuta en Supabase: ALTER TABLE brands ADD COLUMN description TEXT;', 'info');
      } else {
        throw saveErr;
      }
    }

    showToast(`Marca "${name}" guardada con éxito. ✓`, 'success');
    closeBrandDrawer();
    const content = document.getElementById('admin-content-area');
    if (content) await initBrandsModule(content);
    updateSidebarCounters();

  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Guardar Marca`;
  }
}
