import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  } catch {
    console.warn('Falha ao iniciar o Supabase. Usando modo local (localStorage).');
  }
} else {
  console.warn('Supabase não configurado corretamente. Usando modo local (localStorage).');
}

export const supabase = supabaseInstance;
export const supabaseAvailable = supabaseInstance !== null;
