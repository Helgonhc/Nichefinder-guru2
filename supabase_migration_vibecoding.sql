-- Migration: Adicionar campos para o Sistema Vibecoding Elite Preview
-- Tabela: leads

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS vibe_prompt TEXT,
ADD COLUMN IF NOT EXISTS generated_site_code TEXT;

-- Comentários para documentação do schema
COMMENT ON COLUMN leads.vibe_prompt IS 'Armazena o prompt estratégico enviado ao Vibecoder.';
COMMENT ON COLUMN leads.generated_site_code IS 'Armazena o HTML completo retornado pelo Vibecoder.';
