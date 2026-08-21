/* GODEROX ADMIN — SIZE GUIDE MODULE */
import { uploadProductImage } from '../api/storage.api.js';
import { showToast } from './admin-app.js';

export function initSizeGuideModule(container) {
  const savedGuide = localStorage.getItem('goderox_size_guide');
  let currentGuide = { imageUrl: '', note: '' };
  try {
    if (savedGuide) currentGuide = JSON.parse(savedGuide);
  } catch (e) {}

  container.innerHTML = `
    <div class="admin-card" style="max-width: 800px; margin: 0 auto;">
      <div style="margin-bottom: 1.5rem;">
        <h2 style="font-family: var(--font-heading); font-size: 1.4rem; color: #fff; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.5rem;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" stroke-width="2"><path d="M21 3H3v18h18V3z"/><path d="M7 3v4M12 3v8M17 3v4"/></svg>
          Gestión de Guía de Tallas
        </h2>
        <p style="color: var(--text-muted); font-size: 0.88rem;">
          Sube o personaliza la imagen oficial de la guía de tallas que verán los clientes al pulsar "Guía de Tallas" en cualquier producto.
        </p>
      </div>

      <form id="size-guide-form">
        <!-- IMAGE UPLOAD -->
        <div class="form-section-label">📐 Imagen de la Guía de Tallas</div>
        <div class="form-group">
          <div class="upload-zone" id="sg-upload-zone">
            <input type="file" id="sg-image-file" class="upload-input" accept="image/*" />
            <div class="upload-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <div class="upload-title">Arrastra la imagen de la guía de tallas aquí</div>
            <div class="upload-sub">o haz clic para buscar en tus archivos · JPG, PNG, WEBP · Alta Resolución</div>
          </div>

          <div style="margin-top: 0.85rem;">
            <label class="form-label" for="sg-image-url" style="font-size:0.8rem; color:var(--text-muted);">o pega una URL directa de imagen:</label>
            <input type="text" id="sg-image-url" class="form-input" placeholder="https://ejemplo.com/guia-tallas.jpg" value="${currentGuide.imageUrl || ''}" />
          </div>
        </div>

        <!-- LIVE PREVIEW -->
        <div class="form-group" id="sg-preview-container" style="${currentGuide.imageUrl ? '' : 'display:none;'} margin-top: 1.25rem;">
          <label class="form-label">Vista Previa de la Guía Actual</label>
          <div style="text-align: center; background: rgba(0,0,0,0.5); border: 1px solid var(--border-gold); border-radius: 12px; padding: 1rem; position: relative;">
            <img id="sg-preview-img" src="${currentGuide.imageUrl || ''}" alt="Vista Previa Guía de Tallas" style="max-height: 380px; width: auto; max-width: 100%; border-radius: 8px; object-fit: contain;" />
            <button type="button" id="sg-remove-img-btn" class="btn btn-ghost btn-icon" style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.7); color: #fca5a5;" title="Quitar imagen">✕</button>
          </div>
        </div>

        <hr class="divider" style="margin: 1.5rem 0;" />

        <!-- ADDITIONAL RECOMMENDATION NOTE -->
        <div class="form-section-label">💡 Recomendaciones o Notas de Corte</div>
        <div class="form-group">
          <label class="form-label" for="sg-note">Nota de Ajuste (Aparecerá bajo la imagen)</label>
          <textarea id="sg-note" class="form-textarea" rows="3" placeholder="Ej: Nuestras prendas cuentan con patronaje Oversized. Te recomendamos pedir tu talla habitual para un fit holgado o una talla menos para un fit entallado.">${currentGuide.note || ''}</textarea>
        </div>

        <!-- SAVE BUTTON -->
        <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
          <button type="submit" class="btn btn-primary" id="save-sg-btn" style="padding: 0.9rem 2rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Guardar Guía de Tallas
          </button>
        </div>
      </form>
    </div>
  `;

  // Attach event handlers
  const form = container.querySelector('#size-guide-form');
  const fileInput = container.querySelector('#sg-image-file');
  const urlInput = container.querySelector('#sg-image-url');
  const previewContainer = container.querySelector('#sg-preview-container');
  const previewImg = container.querySelector('#sg-preview-img');
  const removeBtn = container.querySelector('#sg-remove-img-btn');
  const noteInput = container.querySelector('#sg-note');

  let pendingFile = null;

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      pendingFile = file;
      const previewUrl = URL.createObjectURL(file);
      previewImg.src = previewUrl;
      previewContainer.style.display = 'block';
      urlInput.value = '';
    }
  });

  urlInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val) {
      pendingFile = null;
      previewImg.src = val;
      previewContainer.style.display = 'block';
    } else if (!pendingFile) {
      previewContainer.style.display = 'none';
    }
  });

  removeBtn.addEventListener('click', () => {
    pendingFile = null;
    fileInput.value = '';
    urlInput.value = '';
    previewImg.src = '';
    previewContainer.style.display = 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = container.querySelector('#save-sg-btn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span>Guardando...</span>`;

    try {
      let finalImageUrl = urlInput.value.trim();

      if (pendingFile) {
        finalImageUrl = await uploadProductImage(pendingFile, 'sizeguide');
      }

      const payload = {
        imageUrl: finalImageUrl,
        note: noteInput.value.trim(),
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('goderox_size_guide', JSON.stringify(payload));
      showToast('Guía de tallas actualizada y publicada en la tienda. ✓', 'success');

      // Dispatch event for live storefront sync if open in another tab
      window.dispatchEvent(new Event('goderox:sizeguide-updated'));
    } catch (err) {
      showToast(`Error al guardar: ${err.message}`, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Guardar Guía de Tallas`;
    }
  });
}
