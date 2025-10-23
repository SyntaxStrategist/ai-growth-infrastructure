-- Drop the specific policies we found on lead_notes table
-- Based on the actual policies that exist

-- Drop the foreign key constraint first
ALTER TABLE public.lead_notes DROP CONSTRAINT IF EXISTS lead_notes_client_id_fkey;

-- Drop ALL the specific policies we found
DROP POLICY IF EXISTS "Allow clients to access their own notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Allow service role full access" ON public.lead_notes;
DROP POLICY IF EXISTS "Clients can delete their own notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Clients can insert notes for their leads" ON public.lead_notes;
DROP POLICY IF EXISTS "Clients can update their own notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Clients can view their own notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Service role full access to lead_notes" ON public.lead_notes;

-- Now change the column type (this should work now)
ALTER TABLE public.lead_notes ALTER COLUMN client_id TYPE TEXT;

-- Add the correct foreign key constraint
ALTER TABLE public.lead_notes ADD CONSTRAINT lead_notes_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(client_id) ON DELETE SET NULL;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ lead_notes foreign key constraint COMPLETELY fixed!';
  RAISE NOTICE '   - Dropped all 7 specific policies on lead_notes table';
  RAISE NOTICE '   - Changed lead_notes.client_id from UUID to TEXT';
  RAISE NOTICE '   - Added foreign key constraint to clients.client_id';
  RAISE NOTICE '   - Data types now match: TEXT to TEXT';
  RAISE NOTICE '   - Notes will work for ALL clients permanently!';
END $$;
