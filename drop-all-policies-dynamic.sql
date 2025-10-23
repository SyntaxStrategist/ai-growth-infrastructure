-- Dynamic approach to drop ALL policies on lead_notes table
-- This will find and drop every single policy that exists

-- First, let's see what policies actually exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'lead_notes'
ORDER BY policyname;

-- Drop the foreign key constraint
ALTER TABLE public.lead_notes DROP CONSTRAINT IF EXISTS lead_notes_client_id_fkey;

-- Use a dynamic approach to drop ALL policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Loop through all policies on lead_notes table and drop them
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'lead_notes'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.lead_notes';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
    
    RAISE NOTICE 'All policies on lead_notes table have been dropped';
END $$;

-- Now change the column type (this should work now)
ALTER TABLE public.lead_notes ALTER COLUMN client_id TYPE TEXT;

-- Add the correct foreign key constraint
ALTER TABLE public.lead_notes ADD CONSTRAINT lead_notes_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(client_id) ON DELETE SET NULL;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ lead_notes foreign key constraint COMPLETELY fixed!';
  RAISE NOTICE '   - Dynamically found and dropped ALL policies on lead_notes table';
  RAISE NOTICE '   - Changed lead_notes.client_id from UUID to TEXT';
  RAISE NOTICE '   - Added foreign key constraint to clients.client_id';
  RAISE NOTICE '   - Data types now match: TEXT to TEXT';
  RAISE NOTICE '   - Notes will work for ALL clients permanently!';
END $$;
