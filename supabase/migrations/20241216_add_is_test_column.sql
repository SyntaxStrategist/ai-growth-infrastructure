-- ============================================
-- Add is_test Column to Track Test Data
-- ============================================
-- This allows filtering out test/demo data from production analytics
-- while still keeping it available for debugging

-- Add is_test column to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

-- Add is_test column to lead_memory table
ALTER TABLE public.lead_memory
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

-- Add is_test column to lead_actions table
ALTER TABLE public.lead_actions
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_clients_is_test
ON public.clients(is_test);

CREATE INDEX IF NOT EXISTS idx_lead_memory_is_test
ON public.lead_memory(is_test);

CREATE INDEX IF NOT EXISTS idx_lead_actions_is_test
ON public.lead_actions(is_test);

-- Add comments for documentation
COMMENT ON COLUMN public.clients.is_test IS 
'Marks test/demo accounts. True for accounts created with test data (business_name/email contains "Test" or "example.com").';

COMMENT ON COLUMN public.lead_memory.is_test IS 
'Marks test/demo leads. True for leads with test data (name/email/message contains "Test" or "example.com").';

COMMENT ON COLUMN public.lead_actions.is_test IS 
'Marks test/demo actions. Inherits from parent lead or client is_test flag.';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ is_test column migration complete!';
  RAISE NOTICE '   - Added to: clients, lead_memory, lead_actions';
  RAISE NOTICE '   - Default: FALSE (production data)';
  RAISE NOTICE '   - Indexes created for performance';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Usage:';
  RAISE NOTICE '   Production queries: WHERE is_test = FALSE';
  RAISE NOTICE '   Test data queries: WHERE is_test = TRUE';
  RAISE NOTICE '   All data: No filter';
END $$;

