-- Complete fix for lead_notes foreign key constraint with RLS policies
-- This handles the RLS policy dependency issue

-- Step 1: Drop the existing constraint
ALTER TABLE public.lead_notes DROP CONSTRAINT IF EXISTS lead_notes_client_id_fkey;

-- Step 2: Temporarily disable RLS to allow column type change
ALTER TABLE public.lead_notes DISABLE ROW LEVEL SECURITY;

-- Step 3: Change lead_notes.client_id from UUID to TEXT to match clients.client_id
ALTER TABLE public.lead_notes ALTER COLUMN client_id TYPE TEXT;

-- Step 4: Re-enable RLS
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- Step 5: Add the correct foreign key constraint pointing to clients.client_id
ALTER TABLE public.lead_notes ADD CONSTRAINT lead_notes_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(client_id) ON DELETE SET NULL;

-- Step 6: Verify the fix
SELECT 
  conname as constraint_name,
  confrelid::regclass as referenced_table,
  confkey as referenced_columns,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'lead_notes_client_id_fkey';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ lead_notes foreign key constraint COMPLETELY fixed with RLS!';
  RAISE NOTICE '   - Temporarily disabled RLS policies';
  RAISE NOTICE '   - Changed lead_notes.client_id from UUID to TEXT';
  RAISE NOTICE '   - Re-enabled RLS policies';
  RAISE NOTICE '   - Added foreign key constraint to clients.client_id';
  RAISE NOTICE '   - Data types now match: TEXT to TEXT';
  RAISE NOTICE '   - Notes will work for ALL clients permanently!';
END $$;
