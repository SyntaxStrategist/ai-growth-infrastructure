-- ============================================
-- Enable RLS on lead_notes table
-- ============================================
-- This migration enables Row Level Security on the lead_notes table
-- with policies for both client access and service role access

-- Enable RLS on lead_notes table
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CLIENT ACCESS POLICIES
-- ============================================

-- Policy: Clients can only see their own notes
CREATE POLICY "Clients can view their own notes"
ON public.lead_notes
FOR SELECT
TO authenticated
USING (
  -- Allow if the note belongs to the authenticated client
  client_id = auth.uid()
);

-- Policy: Clients can insert notes for their own leads
CREATE POLICY "Clients can insert notes for their leads"
ON public.lead_notes
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if the note is being created for the authenticated client
  client_id = auth.uid()
);

-- Policy: Clients can update their own notes
CREATE POLICY "Clients can update their own notes"
ON public.lead_notes
FOR UPDATE
TO authenticated
USING (
  -- Allow if the note belongs to the authenticated client
  client_id = auth.uid()
)
WITH CHECK (
  -- Ensure the client_id doesn't change during update
  client_id = auth.uid()
);

-- Policy: Clients can delete their own notes
CREATE POLICY "Clients can delete their own notes"
ON public.lead_notes
FOR DELETE
TO authenticated
USING (
  -- Allow if the note belongs to the authenticated client
  client_id = auth.uid()
);

-- ============================================
-- SERVICE ROLE ACCESS POLICIES
-- ============================================

-- Policy: Service role has full access to all notes
CREATE POLICY "Service role full access to lead_notes"
ON public.lead_notes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- VERIFICATION AND LOGGING
-- ============================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ RLS Enabled on lead_notes table!';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Client Access Policies:';
  RAISE NOTICE '   - Clients can view their own notes (client_id = auth.uid())';
  RAISE NOTICE '   - Clients can insert notes for their leads';
  RAISE NOTICE '   - Clients can update their own notes';
  RAISE NOTICE '   - Clients can delete their own notes';
  RAISE NOTICE '';
  RAISE NOTICE '🛡️ Service Role Access:';
  RAISE NOTICE '   - Full access to all notes (auth.role() = service_role)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Security Status: PROTECTED';
  RAISE NOTICE '   - Client isolation enforced';
  RAISE NOTICE '   - Admin access preserved';
  RAISE NOTICE '   - All operations secured';
  RAISE NOTICE '';
END $$;
