-- Create prompt_registry table for storing prompt variants and their metadata
-- This table supports the prompt optimization system by tracking different versions
-- of prompts with their performance scores and usage statistics

CREATE TABLE IF NOT EXISTS public.prompt_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_name TEXT NOT NULL,
    variant_version INTEGER NOT NULL,
    prompt_text TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    score NUMERIC DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_prompt_registry_prompt_name ON public.prompt_registry (prompt_name);
CREATE INDEX IF NOT EXISTS idx_prompt_registry_variant_version ON public.prompt_registry (variant_version);

-- Disable RLS for now (as requested)
ALTER TABLE public.prompt_registry DISABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE public.prompt_registry IS 'Registry for storing prompt variants with performance tracking';
COMMENT ON COLUMN public.prompt_registry.id IS 'Unique identifier for each prompt variant';
COMMENT ON COLUMN public.prompt_registry.prompt_name IS 'Name/identifier of the prompt (e.g., ai_enrichment_en)';
COMMENT ON COLUMN public.prompt_registry.variant_version IS 'Version number of the prompt variant';
COMMENT ON COLUMN public.prompt_registry.prompt_text IS 'The actual prompt text content';
COMMENT ON COLUMN public.prompt_registry.language IS 'Language code (en, fr, etc.)';
COMMENT ON COLUMN public.prompt_registry.score IS 'Performance score for this prompt variant';
COMMENT ON COLUMN public.prompt_registry.usage_count IS 'Number of times this variant has been used';
COMMENT ON COLUMN public.prompt_registry.created_at IS 'Timestamp when this variant was created';
COMMENT ON COLUMN public.prompt_registry.updated_at IS 'Timestamp when this variant was last updated';
