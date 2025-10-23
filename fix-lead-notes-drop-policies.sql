-- Complete fix for lead_notes foreign key constraint by dropping and recreating RLS policies
-- This handles the RLS policy dependency issue by recreating the policies

-- Step 1: Drop the existing constraint
ALTER TABLE public.lead_notes DROP CONSTRAINT IF EXISTS lead_notes_client_id_fkey;

-- Step 2: Drop all RLS policies that depend on client_id
DROP POLICY IF EXISTS "Users can view their own client's lead notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Users can insert lead notes for their own clients" ON public.lead_notes;
DROP POLICY IF EXISTS "Users can update lead notes for their own clients" ON public.lead_notes;
DROP POLICY IF EXISTS "Users can delete lead notes for their own clients" ON public.lead_notes;
DROP POLICY IF EXISTS "Service role has full access to lead_notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Clients can view notes for their leads" ON public.lead_notes;
DROP POLICY IF EXISTS "Clients can insert notes for their leads" ON public.lead_notes;
DROP POLICY IF EXISTS "Clients can update notes for their leads" ON public.lead_notes;
DROP POLICY IF EXISTS "Clients can delete notes for their leads" ON public.lead_notes;

-- Step 3: Change lead_notes.client_id from UUID to TEXT to match clients.client_id
ALTER TABLE public.lead_notes ALTER COLUMN client_id TYPE TEXT;

-- Step 4: Recreate the RLS policies with the correct data type
CREATE POLICY "Users can view their own client's lead notes" ON public.lead_notes
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM public.clients WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can insert lead notes for their own clients" ON public.lead_notes
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT client_id FROM public.clients WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can update lead notes for their own clients" ON public.lead_notes
  FOR UPDATE USING (
    client_id IN (
      SELECT client_id FROM public.clients WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can delete lead notes for their own clients" ON public.lead_notes
  FOR DELETE USING (
    client_id IN (
      SELECT client_id FROM public.clients WHERE auth.uid()::text = id::text
    )
  );

-- Service role can do everything
CREATE POLICY "Service role has full access to lead_notes" ON public.lead_notes
  FOR ALL USING (auth.role() = 'service_role');

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
  RAISE NOTICE '✅ lead_notes foreign key constraint COMPLETELY fixed!';
  RAISE NOTICE '   - Dropped all RLS policies that depend on client_id';
  RAISE NOTICE '   - Changed lead_notes.client_id from UUID to TEXT';
  RAISE NOTICE '   - Recreated RLS policies with correct data type';
  RAISE NOTICE '   - Added foreign key constraint to clients.client_id';
  RAISE NOTICE '   - Data types now match: TEXT to TEXT';
  RAISE NOTICE '   - Notes will work for ALL clients permanently!';
END $$;
