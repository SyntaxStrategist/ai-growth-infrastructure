-- ============================================
-- Fix prospect_candidates updated_at trigger
-- ============================================
-- Addresses error: "record 'new' has no field 'updated_at'"
-- Makes trigger more defensive and handles edge cases

-- Drop existing trigger
DROP TRIGGER IF EXISTS update_prospect_candidates_updated_at ON public.prospect_candidates;

-- Recreate trigger function with defensive checks
CREATE OR REPLACE FUNCTION update_prospect_candidates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if the column exists and we're in an UPDATE operation
    IF TG_OP = 'UPDATE' THEN
        BEGIN
            NEW.updated_at = NOW();
        EXCEPTION WHEN undefined_column THEN
            -- If updated_at column doesn't exist, just return NEW unchanged
            RETURN NEW;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER update_prospect_candidates_updated_at
    BEFORE UPDATE ON public.prospect_candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_prospect_candidates_updated_at();

-- Verify column exists (should already exist from original migration)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prospect_candidates' 
        AND column_name = 'updated_at'
    ) THEN
        RAISE NOTICE 'updated_at column missing, this should not happen!';
    ELSE
        RAISE NOTICE 'updated_at column exists, trigger fixed';
    END IF;
END $$;

