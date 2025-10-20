-- ============================================
-- Add metadata JSONB column to prospect_candidates
-- ============================================
-- This migration ensures the metadata column exists
-- Safe to run multiple times (IF NOT EXISTS)

-- Add metadata column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prospect_candidates' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.prospect_candidates 
        ADD COLUMN metadata JSONB;
        
        RAISE NOTICE 'Added metadata column to prospect_candidates';
    ELSE
        RAISE NOTICE 'metadata column already exists in prospect_candidates';
    END IF;
END $$;

-- Create index on metadata for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_prospect_metadata 
ON public.prospect_candidates USING GIN (metadata);

-- Add comment for documentation
COMMENT ON COLUMN public.prospect_candidates.metadata IS 'Flexible JSONB field for storing additional prospect data, test results, and enrichment information';

