-- 1. ADICIONAR COLUNAS AO PERFIL (Executar 1x)
-- Adiciona os campos que faltam na tabela de perfis para evitar erro 400
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT;

-- 2. CRIAR BUCKET DE LOGOS (Se não existir)
insert into storage.buckets (id, name, public) 
values ('branding', 'branding', true) 
on conflict (id) do nothing;

-- 3. PERMISSÕES DE ARMAZENAMENTO (Essenciais para upload funcionar)
-- Removemos policies antigas para evitar duplicidade e recriamos
drop policy if exists "Images are publicly accessible" on storage.objects;
drop policy if exists "Anyone can upload an image" on storage.objects;
drop policy if exists "Anyone can update their own image" on storage.objects;

create policy "Images are publicly accessible" 
  on storage.objects for select 
  using ( bucket_id = 'branding' );

create policy "Anyone can upload an image" 
  on storage.objects for insert 
  with check ( bucket_id = 'branding' );

create policy "Anyone can update their own image" 
  on storage.objects for update 
  using ( bucket_id = 'branding' );
