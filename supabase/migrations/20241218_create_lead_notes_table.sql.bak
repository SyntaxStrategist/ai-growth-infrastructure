-- Create lead_notes table
-- This table stores notes for leads

CREATE TABLE IF NOT EXISTS public.lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id VARCHAR(255) NOT NULL REFERENCES public.lead_memory(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  performed_by VARCHAR(100) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_test BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_client_id ON public.lead_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON public.lead_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_notes_is_test ON public.lead_notes(is_test);

-- Add comments for documentation
COMMENT ON TABLE public.lead_notes IS 'Stores notes for leads with audit trail';
COMMENT ON COLUMN public.lead_notes.note IS 'The note content';
COMMENT ON COLUMN public.lead_notes.performed_by IS 'Who created the note (admin, system, etc.)';
COMMENT ON COLUMN public.lead_notes.is_test IS 'Marks test/demo notes. Inherits from parent lead or client is_test flag.';

-- Enable RLS
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own client's lead notes" ON public.lead_notes
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM public.clients WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can insert lead notes for their own clients" ON public.lead_notes
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can update lead notes for their own clients" ON public.lead_notes
  FOR UPDATE USING (
    client_id IN (
      SELECT id FROM public.clients WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can delete lead notes for their own clients" ON public.lead_notes
  FOR DELETE USING (
    client_id IN (
      SELECT id FROM public.clients WHERE auth.uid()::text = id::text
    )
  );

-- Service role can do everything
CREATE POLICY "Service role has full access to lead_notes" ON public.lead_notes
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON public.lead_notes TO authenticated;
GRANT ALL ON public.lead_notes TO service_role;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ lead_notes table created successfully!';
  RAISE NOTICE '   - Stores notes for leads with audit trail';
  RAISE NOTICE '   - Includes performance indexes';
  RAISE NOTICE '   - RLS policies configured for client isolation';
END $$;
