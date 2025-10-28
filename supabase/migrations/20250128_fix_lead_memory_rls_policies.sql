-- ============================================
-- Fix RLS policy type mismatch
-- ============================================
-- Fix the auth.uid() comparison issue in lead_memory policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own client's leads" ON public.lead_memory;
DROP POLICY IF EXISTS "Users can insert leads for their own clients" ON public.lead_memory;
DROP POLICY IF EXISTS "Users can update leads for their own clients" ON public.lead_memory;
DROP POLICY IF EXISTS "Users can delete leads for their own clients" ON public.lead_memory;

-- Recreate with correct type casting
CREATE POLICY "Users can view their own client's leads" ON public.lead_memory
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM public.clients WHERE auth.uid() = id
    )
  );

CREATE POLICY "Users can insert leads for their own clients" ON public.lead_memory
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE auth.uid() = id
    )
  );

CREATE POLICY "Users can update leads for their own clients" ON public.lead_memory
  FOR UPDATE USING (
    client_id IN (
      SELECT id FROM public.clients WHERE auth.uid() = id
    )
  );

CREATE POLICY "Users can delete leads for their own clients" ON public.lead_memory
  FOR DELETE USING (
    client_id IN (
      SELECT id FROM public.clients WHERE auth.uid() = id
    )
  );

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed RLS policies for lead_memory table!';
  RAISE NOTICE '   - Corrected auth.uid() type casting';
  RAISE NOTICE '   - All policies now use proper UUID comparison';
END $$;
