/* GODEROX — CATEGORIES API MODULE */
import { supabase } from '../supabase.js';

export async function getAllCategories(filters = {}) {
  if (!supabase) return [];

  let query = supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (filters.section) {
    query = query.eq('section', filters.section);
  }

  if (filters.activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCategoryById(id) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCategory(categoryData) {
  const { data, error } = await supabase
    .from('categories')
    .insert([categoryData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id, categoryData) {
  const { data, error } = await supabase
    .from('categories')
    .update(categoryData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function toggleCategoryActive(id, currentStatus) {
  const { data, error } = await supabase
    .from('categories')
    .update({ is_active: !currentStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
