import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tclfdkjqqppskyhkkrnf.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjbGZka2pxcXBwc2t5aGtrcm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjEwOTMsImV4cCI6MjA5NTAzNzA5M30.inc9y7iyG0HTkCOLuS4hszEiQZweXOtjNahuMBQ4sCs';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@gmail.com',
  password: '12345678',
});

if (error) {
  console.log('ERRO:', error.message);
  console.log('Código:', error.status);
  process.exit(1);
}

console.log(' LOGIN FUNCIONOU!');
console.log(' User ID:', data.user.id);
console.log(' Email:', data.user.email);
console.log(' Confirmado:', data.user.email_confirmed_at ? 'sim' : 'não');
