-- ================================================================
-- MIGRATION: Histórico de Contatos por Lead (A2)
-- Data: 2026-03-05
-- Cria tabela contact_history para rastrear timeline de interações
-- Execute no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ================================================================

CREATE TABLE IF NOT EXISTS public.contact_history (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id      UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL CHECK (event_type IN (
    'ligacao',       -- Ligação telefônica
    'whatsapp',      -- Mensagem WhatsApp
    'email',         -- E-mail enviado
    'proposta',      -- Proposta PDF enviada
    'reuniao',       -- Reunião agendada/realizada
    'fechamento',    -- Venda fechada
    'sem_resposta',  -- Sem retorno
    'anotacao'       -- Nota interna
  )),
  notes        TEXT,                             -- Observações/detalhes do contato
  result       TEXT CHECK (result IN (
    'positivo', 'neutro', 'negativo', 'pendente'
  )) DEFAULT 'neutro',
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contact_history_lead_id 
  ON public.contact_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_user_id 
  ON public.contact_history(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_created_at 
  ON public.contact_history(created_at DESC);

-- RLS: cada usuário só vê e gerencia seus próprios históricos
ALTER TABLE public.contact_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_history_select_own"
  ON public.contact_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "contact_history_insert_own"
  ON public.contact_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contact_history_delete_own"
  ON public.contact_history FOR DELETE
  USING (auth.uid() = user_id);

-- Verificação após executar:
-- SELECT COUNT(*) FROM public.contact_history;
-- SELECT * FROM pg_policies WHERE tablename = 'contact_history';
