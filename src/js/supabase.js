/* GODEROX — SUPABASE CLIENT SINGLETON */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export let supabase = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ GODEROX: Faltan las credenciales de Supabase en el servidor. La tienda funcionará en modo local/fallback.');
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('⚠️ GODEROX: Error inicializando Supabase', err);
  }
}

export default supabase;
