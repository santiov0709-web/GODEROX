/* GODEROX — STORAGE API MODULE (Supabase Storage + DataURL Fallback) */
import { supabase } from '../supabase.js';

const PRODUCT_IMAGES_BUCKET = 'product-images';
const BRAND_LOGOS_BUCKET = 'brand-logos';

/**
 * Upload a product image file with automatic DataURL fallback if bucket missing.
 * @param {File} file - The image file to upload.
 * @param {string} folder - Optional subfolder within the bucket.
 * @returns {Promise<string>} Public URL or DataURL of the image.
 */
export async function uploadProductImage(file, folder = '') {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (!error) {
      const { data } = supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .getPublicUrl(filePath);

      if (data?.publicUrl) return data.publicUrl;
    }
  } catch (err) {
    console.warn('Storage upload warning, using DataURL fallback:', err);
  }

  // Fallback to DataURL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a brand logo file with automatic DataURL fallback if bucket missing.
 * @param {File} file - The logo file to upload.
 * @returns {Promise<string>} Public URL or DataURL of the logo.
 */
export async function uploadBrandLogo(file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `logo_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from(BRAND_LOGOS_BUCKET)
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (!error) {
      const { data } = supabase.storage
        .from(BRAND_LOGOS_BUCKET)
        .getPublicUrl(fileName);

      if (data?.publicUrl) return data.publicUrl;
    }
  } catch (err) {
    console.warn('Brand storage upload warning, using DataURL fallback:', err);
  }

  // Fallback to DataURL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

/**
 * Delete a product image from storage.
 */
export async function deleteProductImage(publicUrl) {
  if (!publicUrl || publicUrl.startsWith('data:')) return;
  const filePath = extractPathFromUrl(publicUrl, PRODUCT_IMAGES_BUCKET);
  if (!filePath) return;

  try {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([filePath]);
  } catch (e) {
    console.warn('Error deleting product image:', e);
  }
}

/**
 * Delete a brand logo from storage.
 */
export async function deleteBrandLogo(publicUrl) {
  if (!publicUrl || publicUrl.startsWith('data:')) return;
  const filePath = extractPathFromUrl(publicUrl, BRAND_LOGOS_BUCKET);
  if (!filePath) return;

  try {
    await supabase.storage.from(BRAND_LOGOS_BUCKET).remove([filePath]);
  } catch (e) {
    console.warn('Error deleting brand logo:', e);
  }
}

function extractPathFromUrl(publicUrl, bucket) {
  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    return url.pathname.substring(idx + marker.length);
  } catch (e) {
    return null;
  }
}
