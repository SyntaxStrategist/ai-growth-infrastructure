-- ============================================
-- Add is_test Column to prospect_candidates
-- ============================================
-- Differentiates test prospects from real production prospects
-- Allows filtering in dashboard without data deletion

-- Add is_test column (default false for production prospects)
ALTER TABLE public.prospect_candidates 
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

-- Index for faster filtering by test status
CREATE INDEX IF NOT EXISTS idx_prospect_candidates_is_test
ON public.prospect_candidates(is_test);

-- Comment for documentation
COMMENT ON COLUMN public.prospect_candidates.is_test IS 'True if prospect was created in Test Mode, false for real production prospects';

-- Update existing records to false (assume all existing are production)
UPDATE public.prospect_candidates 
SET is_test = false 
WHERE is_test IS NULL;

