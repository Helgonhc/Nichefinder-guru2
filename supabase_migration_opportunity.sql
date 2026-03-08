-- Migration: Add Opportunity Engine columns to leads table
-- Description: Adds dedicated columns for better filtering and sorting of lead opportunities.

DO $$ 
BEGIN
    -- Add opportunity_score
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'opportunity_score') THEN
        ALTER TABLE public.leads ADD COLUMN opportunity_score INTEGER;
    END IF;

    -- Add opportunity_level
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'opportunity_level') THEN
        ALTER TABLE public.leads ADD COLUMN opportunity_level TEXT;
    END IF;

    -- Add primary_reason
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'primary_reason') THEN
        ALTER TABLE public.leads ADD COLUMN primary_reason TEXT;
    END IF;

    -- Add secondary_reason
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'secondary_reason') THEN
        ALTER TABLE public.leads ADD COLUMN secondary_reason TEXT;
    END IF;

    -- Add recommended_offer
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'recommended_offer') THEN
        ALTER TABLE public.leads ADD COLUMN recommended_offer TEXT;
    END IF;

    -- Add opportunity_summary (maps to 'summary' in code)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'opportunity_summary') THEN
        ALTER TABLE public.leads ADD COLUMN opportunity_summary TEXT;
    END IF;

    -- Add opportunity_flags (maps to 'flags' in code)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'opportunity_flags') THEN
        ALTER TABLE public.leads ADD COLUMN opportunity_flags JSONB DEFAULT '[]'::jsonb;
    END IF;

END $$;

-- Optional: Create an index for performance on score and level
CREATE INDEX IF NOT EXISTS idx_leads_opportunity_score ON public.leads(opportunity_score);
CREATE INDEX IF NOT EXISTS idx_leads_opportunity_level ON public.leads(opportunity_level);
