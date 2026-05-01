import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
// A chave precisa ser a 'anon key' do Supabase. A 'publishable key' pode causar erro se usada de forma errada,
// mas vamos instanciar assim mesmo e tratar com o try-catch caso ela seja rejeitada.
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.warn('Falha ao iniciar o Supabase, os dados usarão o modo local (localStorage).', e);
  }
} else {
  console.warn('Variáveis do Supabase ausentes no arquivo .env. Usando modo local (localStorage).');
}

export const supabase = supabaseInstance;
export const supabaseAvailable = supabaseInstance !== null;
