import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://[SEU_PROJETO].supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "[SUA_CHAVE_ANON]";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const email = 'admin@seudominio.com';
const password = 'sua_senha_segura';

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
