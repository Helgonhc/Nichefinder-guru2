-- ================================================================
-- MIGRATION: Correção de Segurança RLS — Storage Bucket + Profiles
-- Data: 2026-03-05
-- Descrição: Corrige políticas inseguras do bucket 'branding' que
--            permitiam upload/update por qualquer pessoa sem auth.
--            Também adiciona política de INSERT para profiles e
--            garante que DELETE no storage seja restrito ao dono.
--
-- Execute este SQL no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ================================================================


-- ================================================================
-- PARTE 1: CORRIGIR POLICIES DO STORAGE BUCKET 'branding'
-- ================================================================
-- PROBLEMA: As policies anteriores permitiam upload e update por
-- qualquer pessoa (sem verificar auth.uid()), permitindo que
-- qualquer usuário não autenticado sobrescrevesse logos de outros.

-- Remover policies inseguras existentes
DROP POLICY IF EXISTS "Images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an image" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their own image" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "User Upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own logo" ON storage.objects;

-- SELECT público (logos precisam ser visíveis publicamente)
CREATE POLICY "branding_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'branding');

-- INSERT: apenas usuários autenticados, restrito ao seu próprio folder
-- Convenção de path: {user_id}/logo.png
CREATE POLICY "branding_authenticated_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'branding'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: apenas o próprio usuário pode atualizar sua logo
CREATE POLICY "branding_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'branding'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: apenas o próprio usuário pode deletar sua logo
CREATE POLICY "branding_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'branding'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ================================================================
-- PARTE 2: GARANTIR POLÍTICA INSERT NO profiles
-- ================================================================
-- O trigger handle_new_user insere o perfil automaticamente, mas
-- para operações manuais, o usuário precisa poder inserir SEU próprio perfil.

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ================================================================
-- PARTE 3: ATUALIZAR CONVENÇÃO DE NOME DO ARQUIVO NO STORAGE
-- ================================================================
-- ATENÇÃO: O código frontend em Settings.tsx precisa ser atualizado
-- para usar o padrão {user_id}/logo.png em vez de logo_{timestamp}.png
-- Isso garante que a policy baseada em folder funcione corretamente.
-- Veja a migration do código em: src/pages/Settings.tsx


-- ================================================================
-- VERIFICAÇÃO: Consulte as policies ativas após executar
-- ================================================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('profiles', 'leads')
--    OR (schemaname = 'storage' AND tablename = 'objects')
-- ORDER BY tablename, cmd;
