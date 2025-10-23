-- Fix lead_notes foreign key constraint with correct data types
-- The issue: lead_notes.client_id (UUID) vs clients.client_id (TEXT)

-- First, drop the existing foreign key constraint
ALTER TABLE public.lead_notes 
DROP CONSTRAINT IF EXISTS lead_notes_client_id_fkey;

-- Option 1: Change lead_notes.client_id to TEXT to match clients.client_id
-- This is the safest approach since clients.client_id is already TEXT
ALTER TABLE public.lead_notes 
ALTER COLUMN client_id TYPE TEXT;

-- Now add the correct foreign key constraint
ALTER TABLE public.lead_notes 
ADD CONSTRAINT lead_notes_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(client_id) ON DELETE SET NULL;

-- Verify the fix
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
  RAISE NOTICE '✅ lead_notes foreign key constraint fixed with correct data types!';
  RAISE NOTICE '   - Changed lead_notes.client_id from UUID to TEXT';
  RAISE NOTICE '   - Added foreign key constraint to clients.client_id';
  RAISE NOTICE '   - Notes should now work with client_id: bba2bb74-4473-4ee3-8ef1-c356cd1428a8';
END $$;
