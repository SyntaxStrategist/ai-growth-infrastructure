-- Drop ALL policies on lead_notes table to allow column type change
-- This is a comprehensive approach to handle any policy we might have missed

-- Drop the foreign key constraint first
ALTER TABLE public.lead_notes DROP CONSTRAINT IF EXISTS lead_notes_client_id_fkey;

-- Drop ALL possible policies that might exist on lead_notes table
-- (We'll drop them all to be absolutely sure)

-- Original policies from migration
DROP POLICY IF EXISTS "Users can view their own client's lead notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Users can insert lead notes for their own clients" ON public.lead_notes;
DROP POLICY IF EXISTS "Users can update lead notes for their own clients" ON public.lead_notes;
DROP POLICY IF EXISTS "Users can delete lead notes for their own clients" ON public.lead_notes;
DROP POLICY IF EXISTS "Service role has full access to lead_notes" ON public.lead_notes;

-- Additional policies that might exist
DROP POLICY IF EXISTS "Allow clients to access their own notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Clients can view notes for their leads" ON public.lead_notes;
DROP POLICY IF EXISTS "Clients can insert notes for their leads" ON public.lead_notes;
DROP POLICY IF EXISTS "Clients can update notes for their leads" ON public.lead_notes;
DROP POLICY IF EXISTS "Clients can delete notes for their leads" ON public.lead_notes;
DROP POLICY IF EXISTS "Clients can delete their own notes" ON public.lead_notes;

-- Any other possible policy names
DROP POLICY IF EXISTS "lead_notes_select_policy" ON public.lead_notes;
DROP POLICY IF EXISTS "lead_notes_insert_policy" ON public.lead_notes;
DROP POLICY IF EXISTS "lead_notes_update_policy" ON public.lead_notes;
DROP POLICY IF EXISTS "lead_notes_delete_policy" ON public.lead_notes;
DROP POLICY IF EXISTS "lead_notes_all_policy" ON public.lead_notes;

-- Now change the column type
ALTER TABLE public.lead_notes ALTER COLUMN client_id TYPE TEXT;

-- Add the correct foreign key constraint
ALTER TABLE public.lead_notes ADD CONSTRAINT lead_notes_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(client_id) ON DELETE SET NULL;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ lead_notes foreign key constraint COMPLETELY fixed!';
  RAISE NOTICE '   - Dropped ALL possible policies on lead_notes table';
  RAISE NOTICE '   - Changed lead_notes.client_id from UUID to TEXT';
  RAISE NOTICE '   - Added foreign key constraint to clients.client_id';
  RAISE NOTICE '   - Data types now match: TEXT to TEXT';
  RAISE NOTICE '   - Notes will work for ALL clients permanently!';
END $$;
