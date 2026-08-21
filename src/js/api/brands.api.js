/* GODEROX — BRANDS API MODULE */
import { supabase } from '../supabase.js';

export async function getAllBrands(activeOnly = false) {
  let query = supabase
    .from('brands')
    .select('*')
    .order('display_order', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getBrandById(id) {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createBrand(brandData) {
  const { data, error } = await supabase
    .from('brands')
    .insert([brandData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBrand(id, brandData) {
  const { data, error } = await supabase
    .from('brands')
    .update(brandData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBrand(id) {
  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function toggleBrandActive(id, currentStatus) {
  const { data, error } = await supabase
    .from('brands')
    .update({ is_active: !currentStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBrandOrder(id, newOrder) {
  const { data, error } = await supabase
    .from('brands')
    .update({ display_order: newOrder })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
