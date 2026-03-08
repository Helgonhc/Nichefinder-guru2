-- Migration: Adicionar colunas para Remake Preview Engine
-- Tabela: leads

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS site_preview JSONB,
ADD COLUMN IF NOT EXISTS site_preview_summary TEXT;

-- Comentários para documentação do schema
COMMENT ON COLUMN leads.site_preview IS 'JSON contendo headline, subheadline, benefícios, serviços e CTA da nova proposta de site.';
COMMENT ON COLUMN leads.site_preview_summary IS 'Resumo explicativo da melhoria gerada pela IA.';
