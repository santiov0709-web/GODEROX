/* GODEROX ADMIN — CATEGORIES MODULE */
import { getAllCategories, createCategory, updateCategory, deleteCategory, toggleCategoryActive } from '../api/categories.api.js';
import { showToast } from './admin-app.js';

let allCategories = [];
let editingCategoryId = null;

export async function initCategoriesModule(container) {
  try {
    allCategories = await getAllCategories({});
    renderCategoriesTable(container, allCategories);
    attachCategoryTableEvents(container);
    initCategoryDrawer();
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p style="color:#fca5a5;">Error: ${err.message}</p></div>`;
  }
}

function renderCategoriesTable(container, categories) {
  const hombreCats = categories.filter(c => c.section === 'hombre');
  const mujerCats = categories.filter(c => c.section === 'mujer');

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title-group">
        <h1>Categorías</h1>
        <p>${categories.length} categorías · Hombre: ${hombreCats.length} · Mujer: ${mujerCats.length}</p>
      </div>
      <button class="btn btn-primary" id="add-category-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nueva Categoría
      </button>
    </div>

    <div class="admin-card" style="margin-bottom:1rem;">
      <div class="form-section-label" style="margin-bottom:0.5rem;">ℹ️ Cómo funcionan las categorías</div>
      <p style="font-size:0.8rem; color:var(--text-muted);">
        Las categorías definen cómo se organiza el catálogo. Puedes crear nuevas categorías en cualquier momento 
        (ej. Chaquetas, Tenis, Accesorios) y asignarles productos sin necesidad de modificar el código.
      </p>
    </div>

    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>NOMBRE</th>
            <th>SLUG / ID</th>
            <th>SECCIÓN</th>
            <th>ORDEN</th>
            <th>ESTADO</th>
            <th>ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          ${categories.length > 0 ? categories.map(c => `
            <tr data-id="${c.id}">
              <td><strong>${c.name}</strong></td>
              <td><code style="font-size:0.75rem; color:var(--text-muted); background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:3px;">${c.slug}</code></td>
              <td>
                <span style="font-size:0.75rem; font-weight:600; color:${c.section === 'hombre' ? 'var(--gold-light)' : '#e879f9'}; text-transform:uppercase;">
                  ${c.section}
                </span>
              </td>
              <td style="text-align:center;">${c.display_order || '—'}</td>
              <td>
                <label class="toggle-switch">
                  <input type="checkbox" class="cat-toggle-cb" data-id="${c.id}" data-status="${c.is_active}" ${c.is_active ? 'checked' : ''} />
                  <span class="toggle-track"></span>
                </label>
              </td>
              <td>
                <div class="table-actions">
                  <button class="btn btn-ghost btn-sm edit-cat-btn" data-id="${c.id}" title="Editar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Editar
                  </button>
                  <button class="btn btn-danger btn-sm delete-cat-btn" data-id="${c.id}" data-name="${c.name}" title="Eliminar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          `).join('') : `
            <tr><td colspan="6" style="text-align:center; padding:3rem; color:var(--text-muted);">No hay categorías registradas.</td></tr>
          `}
        </tbody>
      </table>
    </div>
  `;
}

function attachCategoryTableEvents(container) {
  container.addEventListener('click', (e) => {
    if (e.target.closest('#add-category-btn')) window.openCategoryDrawer();
  });

  container.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-cat-btn');
    if (editBtn) {
      const cat = allCategories.find(c => c.id === editBtn.dataset.id);
      if (cat) window.openCategoryDrawer(cat);
    }
  });

  container.addEventListener('click', async (e) => {
    const delBtn = e.target.closest('.delete-cat-btn');
    if (delBtn) {
      const { id, name } = delBtn.dataset;
      if (!confirm(`¿Eliminar la categoría "${name}"? Asegúrate de no tener productos asignados a ella.`)) return;
      try {
        await deleteCategory(id);
        showToast(`Categoría "${name}" eliminada.`, 'success');
        allCategories = allCategories.filter(c => c.id !== id);
        renderCategoriesTable(container, allCategories);
        attachCategoryTableEvents(container);
      } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
      }
    }
  });

  container.addEventListener('change', async (e) => {
    const cb = e.target.closest('.cat-toggle-cb');
    if (cb) {
      const { id, status } = cb.dataset;
      const currentStatus = status === 'true';
      try {
        await toggleCategoryActive(id, currentStatus);
        const c = allCategories.find(cat => cat.id === id);
        if (c) c.is_active = !currentStatus;
        showToast(`Categoría ${!currentStatus ? 'activada' : 'desactivada'}.`, 'success');
      } catch (err) {
        showToast('Error al cambiar estado.', 'error');
        cb.checked = currentStatus;
      }
    }
  });
}

function initCategoryDrawer() {
  const backdrop = document.getElementById('category-drawer-backdrop');
  const closeBtn = document.getElementById('close-category-drawer');
  const cancelBtn = document.getElementById('cancel-category-btn');
  const saveBtn = document.getElementById('save-category-btn');
  const nameInput = document.getElementById('c-name');
  const slugInput = document.getElementById('c-slug');

  // Auto-generate slug from name
  nameInput?.addEventListener('input', () => {
    if (!editingCategoryId) {
      slugInput.value = nameInput.value
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
  });

  closeBtn?.addEventListener('click', closeCategoryDrawer);
  cancelBtn?.addEventListener('click', closeCategoryDrawer);
  backdrop?.addEventListener('click', (e) => { if (e.target === backdrop) closeCategoryDrawer(); });
  saveBtn?.addEventListener('click', handleSaveCategory);
}

function resetCategoryForm() {
  editingCategoryId = null;
  document.getElementById('category-id-field').value = '';
  document.getElementById('c-name').value = '';
  document.getElementById('c-slug').value = '';
  document.getElementById('c-section').value = '';
  document.getElementById('c-order').value = '';
  document.getElementById('c-is-active').checked = true;
}

window.openCategoryDrawer = function(category = null) {
  resetCategoryForm();
  if (category) {
    document.getElementById('category-drawer-title').textContent = 'Editar Categoría';
    document.getElementById('category-id-field').value = category.id;
    document.getElementById('c-name').value = category.name || '';
    document.getElementById('c-slug').value = category.slug || '';
    document.getElementById('c-section').value = category.section || '';
    document.getElementById('c-order').value = category.display_order || '';
    document.getElementById('c-is-active').checked = category.is_active !== false;
    editingCategoryId = category.id;
  } else {
    document.getElementById('category-drawer-title').textContent = 'Nueva Categoría';
  }
  document.getElementById('category-drawer-backdrop').classList.add('open');
};

function closeCategoryDrawer() {
  document.getElementById('category-drawer-backdrop').classList.remove('open');
}

async function handleSaveCategory() {
  const saveBtn = document.getElementById('save-category-btn');
  const name = document.getElementById('c-name').value.trim();
  const slug = document.getElementById('c-slug').value.trim();
  const section = document.getElementById('c-section').value;
  const order = parseInt(document.getElementById('c-order').value) || 1;
  const isActive = document.getElementById('c-is-active').checked;

  if (!name || !slug || !section) {
    showToast('Nombre, slug y sección son obligatorios.', 'error');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.innerHTML = '<div class="spinner"></div> Guardando...';

  try {
    const payload = { name, slug, section, display_order: order, is_active: isActive };

    if (editingCategoryId) {
      await updateCategory(editingCategoryId, payload);
      showToast(`Categoría "${name}" actualizada. ✓`, 'success');
    } else {
      await createCategory(payload);
      showToast(`Categoría "${name}" creada. ✓`, 'success');
    }

    closeCategoryDrawer();
    const content = document.getElementById('admin-content-area');
    if (content) await initCategoriesModule(content);

  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Guardar Categoría`;
  }
}
