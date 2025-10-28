-- Fix lead_notes foreign key constraint
-- The issue: lead_notes.client_id references clients.id but should reference clients.client_id
-- This migration safely updates the foreign key constraint

-- First, drop the existing foreign key constraint
ALTER TABLE public.lead_notes 
DROP CONSTRAINT IF EXISTS lead_notes_client_id_fkey;

-- Add the correct foreign key constraint that references clients.client_id
ALTER TABLE public.lead_notes 
ADD CONSTRAINT lead_notes_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(client_id) ON DELETE SET NULL;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ lead_notes foreign key constraint fixed successfully!';
  RAISE NOTICE '   - Dropped old constraint referencing clients.id';
  RAISE NOTICE '   - Added new constraint referencing clients.client_id';
  RAISE NOTICE '   - This allows notes to be created with the correct client_id';
END $$;
