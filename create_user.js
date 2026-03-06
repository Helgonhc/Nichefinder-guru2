import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mteiqxhtdibjvsrlnylh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZWlxeGh0ZGlianZzcmxueWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjI2NTEsImV4cCI6MjA4Njk5ODY1MX0.ldvUtrtS3QUcHyGlyUDzt-pKUq4tLSsHLEHD8CqeJ6s";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const email = 'junioemanuel38@gmail.com';
const password = 'teste@123';

console.log(`Tentando criar usuário: ${email}...`);

const { data, error } = await supabase.auth.signUp({
    email,
    password,
});

if (error) {
    console.error('Erro ao criar usuário:', error.message);
    process.exit(1);
} else {
    console.log('Usuário criado com sucesso (pode requerer confirmação de email se não habilitado auto-confirm):', data.user.id);
    process.exit(0);
}
