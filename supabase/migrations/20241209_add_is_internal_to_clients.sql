-- ============================================
-- Add is_internal Column to Clients Table
-- ============================================
-- This allows marking first-party clients (like Avenir AI Solutions)
-- as internal so they appear in admin filters but are excluded from
-- user-facing signup validation queries

-- Add is_internal column (defaults to false for external clients)
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT FALSE;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_clients_is_internal
ON public.clients(is_internal);

-- Mark Avenir AI Solutions as internal
UPDATE public.clients
SET is_internal = TRUE
WHERE client_id = 'avenir-internal-client';

-- Verify the update
DO $$
DECLARE
  avenir_record RECORD;
BEGIN
  SELECT client_id, business_name, is_internal
  INTO avenir_record
  FROM public.clients
  WHERE client_id = 'avenir-internal-client';
  
  IF avenir_record.is_internal = TRUE THEN
    RAISE NOTICE '✅ Avenir AI Solutions marked as internal';
    RAISE NOTICE '   client_id: %', avenir_record.client_id;
    RAISE NOTICE '   business_name: %', avenir_record.business_name;
    RAISE NOTICE '   is_internal: %', avenir_record.is_internal;
  ELSE
    RAISE WARNING '⚠️  Avenir AI Solutions not marked as internal';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.clients.is_internal IS 
'Marks first-party/internal clients (like Avenir AI Solutions). 
Internal clients appear in admin dashboard filters but are excluded from external signup validation queries.';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration complete!';
  RAISE NOTICE '   - Added is_internal column (default: false)';
  RAISE NOTICE '   - Created index on is_internal';
  RAISE NOTICE '   - Marked Avenir AI Solutions as internal';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Client Types:';
  RAISE NOTICE '   Internal (is_internal = true): Avenir AI Solutions';
  RAISE NOTICE '   External (is_internal = false): All other clients';
END $$;

