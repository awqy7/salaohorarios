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
const SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('');
  console.error(' Erro: Variáveis necessárias não encontradas no .env');
  console.error('');
  console.error(' Adicione no .env:');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=suachaveaqui');
  console.error('');
  console.error(' Onde obter: Supabase Dashboard > Settings > API > service_role key');
  console.error(' (NUNCA compartilhe essa chave — ela dá acesso total ao projeto)');
  console.error('');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = 'admin@gmail.com';
const password = '12345678';

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  if (error.message?.includes('already exists')) {
    console.log(' Usuário admin já existe no Supabase Auth.');
  } else {
    console.error(' Erro ao criar usuário:', error.message);
    process.exit(1);
  }
} else {
  console.log('');
  console.log(' Usuário admin criado com sucesso!');
  console.log(`   E-mail: ${email}`);
  console.log(`   Senha:  ${password}`);
  console.log('');
  console.log(' Já pode fazer login em /barber/login');
}

console.log('');
console.log(' IMPORTANTE: Para os agendamentos funcionarem, rode o SQL abaixo');
console.log(' no Supabase Dashboard > SQL Editor:');
console.log('');
console.log('  Abra o arquivo scripts/setup-db.sql, copie o conteúdo');
console.log('  e cole no SQL Editor do Supabase, depois clique em "Run".');
console.log('');
