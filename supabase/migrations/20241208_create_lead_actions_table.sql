-- Create lead_actions table
-- This table tracks all actions performed on leads (tagging, conversion, etc.)

CREATE TABLE IF NOT EXISTS public.lead_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.lead_memory(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  tag VARCHAR(100),
  performed_by VARCHAR(100) NOT NULL DEFAULT 'admin',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Conversion Tracking
  conversion_outcome BOOLEAN DEFAULT NULL,
  reversion_reason TEXT,
  
  -- Flags
  is_test BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_actions_lead_id ON public.lead_actions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_actions_timestamp ON public.lead_actions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lead_actions_action ON public.lead_actions(action);
CREATE INDEX IF NOT EXISTS idx_lead_actions_client_id ON public.lead_actions(client_id);
CREATE INDEX IF NOT EXISTS idx_lead_actions_conversion_outcome ON public.lead_actions(conversion_outcome);
CREATE INDEX IF NOT EXISTS idx_lead_actions_reversion_reason ON public.lead_actions(reversion_reason);
CREATE INDEX IF NOT EXISTS idx_lead_actions_is_test ON public.lead_actions(is_test);

-- Add comments for documentation
COMMENT ON TABLE public.lead_actions IS 'Tracks all actions performed on leads including tagging, conversion tracking, and audit trail';
COMMENT ON COLUMN public.lead_actions.action IS 'Type of action performed (e.g., "tagged", "converted", "reverted")';
COMMENT ON COLUMN public.lead_actions.tag IS 'Tag applied to the lead (e.g., "Converted", "Hot Lead")';
COMMENT ON COLUMN public.lead_actions.performed_by IS 'Who performed the action (admin, system, etc.)';
COMMENT ON COLUMN public.lead_actions.conversion_outcome IS 'Tracks whether this action was a lead conversion. NULL for non-conversion actions, TRUE when lead is marked as converted.';
COMMENT ON COLUMN public.lead_actions.reversion_reason IS 'Tracks the reason why a converted lead was reverted back to active. Options include: "Placed in converted by accident", "Other: [custom reason]", or NULL for non-reversion actions.';
COMMENT ON COLUMN public.lead_actions.is_test IS 'Marks test/demo actions. Inherits from parent lead or client is_test flag.';

-- Enable RLS
ALTER TABLE public.lead_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own client's lead actions" ON public.lead_actions
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM public.clients WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can insert lead actions for their own clients" ON public.lead_actions
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can update lead actions for their own clients" ON public.lead_actions
  FOR UPDATE USING (
    client_id IN (
      SELECT id FROM public.clients WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can delete lead actions for their own clients" ON public.lead_actions
  FOR DELETE USING (
    client_id IN (
      SELECT id FROM public.clients WHERE auth.uid()::text = id::text
    )
  );

-- Service role can do everything
CREATE POLICY "Service role has full access to lead_actions" ON public.lead_actions
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON public.lead_actions TO authenticated;
GRANT ALL ON public.lead_actions TO service_role;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ lead_actions table created successfully!';
  RAISE NOTICE '   - Tracks all lead actions and conversions';
  RAISE NOTICE '   - Includes audit trail and performance indexes';
  RAISE NOTICE '   - RLS policies configured for client isolation';
END $$;
