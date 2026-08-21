/* GODEROX — PRODUCTS API MODULE */
import { supabase } from '../supabase.js';

/**
 * Get all products with optional filters.
 * @param {Object} filters - { section, categorySlug, isPromo, isActive }
 */
export async function getAllProducts(filters = {}) {
  if (!supabase) return [];

  let query = supabase
    .from('products')
    .select(`
      *,
      brand:brands(id, name, logo_url),
      category:categories(id, name, slug, section)
    `)
    .order('created_at', { ascending: false });

  // Filter by active status (default: only active on storefront)
  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  } else {
    query = query.eq('is_active', true);
  }

  if (filters.section && filters.section !== 'all') {
    query = query.eq('section', filters.section);
  }

  if (filters.categorySlug && filters.categorySlug !== 'all') {
    query = query.eq('categories.slug', filters.categorySlug);
  }

  if (filters.isPromo === true) {
    query = query.eq('is_promo', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get a single product by ID.
 */
export async function getProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      brand:brands(id, name, logo_url),
      category:categories(id, name, slug, section)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new product.
 */
export async function createProduct(productData) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("Supabase insert no disponible, guardando producto localmente:", err.message);
    const newProduct = {
      id: 'god-prod-' + Date.now(),
      created_at: new Date().toISOString(),
      ...productData
    };
    const stored = JSON.parse(localStorage.getItem('goderox_products_db') || '[]');
    stored.unshift(newProduct);
    localStorage.setItem('goderox_products_db', JSON.stringify(stored));
    return newProduct;
  }
}

/**
 * Update an existing product.
 */
export async function updateProduct(id, productData) {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ ...productData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("Supabase update no disponible, actualizando localmente:", err.message);
    const stored = JSON.parse(localStorage.getItem('goderox_products_db') || '[]');
    const idx = stored.findIndex(p => p.id === id);
    if (idx > -1) {
      stored[idx] = { ...stored[idx], ...productData, updated_at: new Date().toISOString() };
      localStorage.setItem('goderox_products_db', JSON.stringify(stored));
      return stored[idx];
    }
    return productData;
  }
}

/**
 * Soft delete a product (sets is_active = false).
 */
export async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Toggle product active status.
 */
export async function toggleProductActive(id, currentStatus) {
  const { data, error } = await supabase
    .from('products')
    .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
