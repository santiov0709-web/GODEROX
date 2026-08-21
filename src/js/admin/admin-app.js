/* GODEROX ADMIN — CORE APPLICATION CONTROLLER */
import { supabase } from '../supabase.js';
import { initProductsModule } from './admin-products.js';
import { initBrandsModule } from './admin-brands.js';
import { initCategoriesModule } from './admin-categories.js';
import { initSizeGuideModule } from './admin-sizeguide.js';
import { getAllProducts } from '../api/products.api.js';
import { getAllBrands } from '../api/brands.api.js';
import { getAllCategories } from '../api/categories.api.js';

/* ─── TOAST NOTIFICATION SYSTEM ─── */
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>`,
    error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ─── UPDATE SIDEBAR COUNTERS ─── */
export async function updateSidebarCounters() {
  try {
    const [products, brands] = await Promise.all([
      getAllProducts({ isActive: undefined }),
      getAllBrands()
    ]);
    const pEl = document.getElementById('sidebar-products-count');
    const bEl = document.getElementById('sidebar-brands-count');
    if (pEl) pEl.textContent = products.length;
    if (bEl) bEl.textContent = brands.length;
  } catch (e) {
    // Silent fail for counters
  }
}

/* ─── MODULE ROUTER ─── */
let currentModule = null;

async function navigateTo(module) {
  const content = document.getElementById('admin-content-area');
  const topbarPage = document.getElementById('topbar-current-page');
  const topbarAction = document.getElementById('topbar-primary-action');

  // Update sidebar active state
  document.querySelectorAll('.nav-item[data-module]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.module === module);
  });

  currentModule = module;

  const moduleConfig = {
    dashboard: { label: 'Dashboard', actionLabel: null, action: null },
    products: { label: 'Productos', actionLabel: '+ Nuevo Producto', action: () => window.openProductDrawer() },
    brands: { label: 'Marcas', actionLabel: '+ Nueva Marca', action: () => window.openBrandDrawer() },
    categories: { label: 'Categorías', actionLabel: '+ Nueva Categoría', action: () => window.openCategoryDrawer() },
    sizeguide: { label: 'Guía de Tallas', actionLabel: null, action: null },
  };

  const config = moduleConfig[module] || moduleConfig.dashboard;
  if (topbarPage) topbarPage.textContent = config.label;

  if (topbarAction) {
    if (config.actionLabel) {
      topbarAction.style.display = 'inline-flex';
      topbarAction.textContent = config.actionLabel;
      topbarAction.onclick = config.action;
    } else {
      topbarAction.style.display = 'none';
    }
  }

  // Show loading
  if (content) {
    content.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Cargando...</span></div>`;
  }

  // Render module
  switch (module) {
    case 'dashboard': await renderDashboard(content); break;
    case 'products': await initProductsModule(content); break;
    case 'brands': await initBrandsModule(content); break;
    case 'categories': await initCategoriesModule(content); break;
    case 'sizeguide': await initSizeGuideModule(content); break;
    default: await renderDashboard(content);
  }
}

/* ─── DASHBOARD ─── */
async function renderDashboard(container) {
  try {
    const [products, brands, categories] = await Promise.all([
      getAllProducts({ isActive: undefined }),
      getAllBrands(),
      getAllCategories({})
    ]);

    const activeProducts = products.filter(p => p.is_active).length;
    const promoProducts = products.filter(p => p.is_promo).length;
    const activeBrands = brands.filter(b => b.is_active).length;

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          </div>
          <div class="stat-value">${products.length}</div>
          <div class="stat-label">Productos Totales</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(34,197,94,0.1); color:#22c55e;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="stat-value" style="color:#22c55e;">${activeProducts}</div>
          <div class="stat-label">Productos Activos</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(200,165,91,0.15); color:var(--gold-light);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div class="stat-value" style="color:var(--gold-light);">${promoProducts}</div>
          <div class="stat-label">En Promociones</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          </div>
          <div class="stat-value">${activeBrands}</div>
          <div class="stat-label">Marcas Activas</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </div>
          <div class="stat-value">${categories.length}</div>
          <div class="stat-label">Categorías</div>
        </div>
      </div>

      <div class="admin-card" style="margin-bottom:1.5rem;">
        <div class="form-section-label" style="margin-bottom:1rem;">🚀 Acciones Rápidas</div>
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="window.navigateTo('products')">+ Nuevo Producto</button>
          <button class="btn btn-secondary" onclick="window.navigateTo('brands')">+ Nueva Marca</button>
          <button class="btn btn-ghost" onclick="window.navigateTo('categories')">+ Nueva Categoría</button>
          <a href="/" target="_blank" class="btn btn-ghost">Ver Tienda →</a>
        </div>
      </div>

      <div class="admin-card">
        <div class="form-section-label" style="margin-bottom:1rem;">📋 Últimos Productos</div>
        ${products.slice(0, 5).map(p => `
          <div style="display:flex; align-items:center; gap:1rem; padding:0.75rem 0; border-bottom:1px solid var(--border);">
            <img src="${p.images?.[0] || ''}" alt="${p.name}" class="table-img" onerror="this.src=''" />
            <div style="flex:1; min-width:0;">
              <div class="table-product-name" style="font-size:0.85rem;">${p.name}</div>
              <div class="table-product-sub">${p.section?.toUpperCase()} · ${p.brand?.name || '—'}</div>
            </div>
            <div class="table-price">$${(p.price_usd < 1000 ? p.price_usd * 1000 : p.price_usd).toLocaleString('es-CO')} COP</div>
            <span class="status-badge ${p.is_active ? 'status-active' : 'status-inactive'}">
              <span class="status-dot"></span>${p.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        `).join('')}
        ${products.length === 0 ? '<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:2rem;">No hay productos. <button class="btn btn-primary btn-sm" onclick="window.navigateTo(\'products\')">Agregar ahora</button></p>' : ''}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p style="color:#fca5a5;">Error cargando datos: ${err.message}</p></div>`;
  }
}

/* ─── AUTH ─── */
async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

async function handleLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

function showApp(user) {
  document.getElementById('admin-login-screen').classList.add('hidden');
  document.getElementById('admin-app').classList.add('visible');
  const emailEl = document.getElementById('sidebar-user-email');
  if (emailEl) emailEl.querySelector('span').textContent = user.email;
  navigateTo('dashboard');
  updateSidebarCounters();
}

function showLogin() {
  document.getElementById('admin-login-screen').classList.remove('hidden');
  document.getElementById('admin-app').classList.remove('visible');
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', async () => {
  // Check existing session
  const session = await checkAuth();
  if (session) {
    showApp(session.user);
  } else {
    showLogin();
  }

  // Login form
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error-msg');
  const loginBtnText = document.getElementById('login-btn-text');
  const loginSpinner = document.getElementById('login-spinner');

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    loginBtnText.style.display = 'none';
    loginSpinner.style.display = 'block';
    loginError.classList.remove('visible');

    try {
      const { session } = await handleLogin(email, password);
      showApp(session.user);
    } catch (err) {
      loginError.classList.add('visible');
      loginBtnText.style.display = 'block';
      loginSpinner.style.display = 'none';
    }
  });

  // Mobile Sidebar Toggle
  const sidebar = document.getElementById('admin-sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const mobileToggle = document.getElementById('mobile-sidebar-toggle');

  function openMobileSidebar() {
    sidebar?.classList.add('mobile-open');
    sidebarBackdrop?.classList.add('active');
  }

  function closeMobileSidebar() {
    sidebar?.classList.remove('mobile-open');
    sidebarBackdrop?.classList.remove('active');
  }

  mobileToggle?.addEventListener('click', openMobileSidebar);
  sidebarBackdrop?.addEventListener('click', closeMobileSidebar);

  // Sidebar navigation
  document.querySelectorAll('.nav-item[data-module]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateTo(btn.dataset.module);
      closeMobileSidebar();
    });
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    closeMobileSidebar();
    await supabase.auth.signOut();
    showLogin();
  });

  // Auth state change
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') showLogin();
    if (event === 'SIGNED_IN' && session) showApp(session.user);
  });
});


// Expose globally
window.navigateTo = navigateTo;
window.showToast = showToast;
window.updateSidebarCounters = updateSidebarCounters;
