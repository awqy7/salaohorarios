import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');

function loadEnv() {
  if (!existsSync(envPath)) return {};
  const env = {};
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      }
    }
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error: listError } = await supabase.auth.admin.listUsers();
if (listError) {
  console.error('Erro ao listar usuários:', listError.message);
  process.exit(1);
}

const user = data.users.find(u => u.email === 'admin@gmail.com');
if (!user) {
  console.log('Usuário admin@gmail.com não encontrado no Supabase Auth.');
  console.log('Execute primeiro: npm run create-admin');
  process.exit(1);
}

const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
  password: '12345678',
});

if (updateError) {
  console.error('Erro ao atualizar senha:', updateError.message);
  process.exit(1);
}

console.log(' Senha do admin atualizada para 12345678');
console.log(' Já pode fazer login em /barber/login');
