-- Fix lead_notes foreign key constraint
-- This fixes the issue where lead_notes.client_id references clients.id 
-- but should reference clients.client_id

-- First, drop the existing foreign key constraint
ALTER TABLE public.lead_notes 
DROP CONSTRAINT IF EXISTS lead_notes_client_id_fkey;

-- Add the correct foreign key constraint that references clients.client_id
ALTER TABLE public.lead_notes 
ADD CONSTRAINT lead_notes_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(client_id) ON DELETE SET NULL;

-- Verify the fix
SELECT 
  conname as constraint_name,
  confrelid::regclass as referenced_table,
  confkey as referenced_columns
FROM pg_constraint 
WHERE conname = 'lead_notes_client_id_fkey';
