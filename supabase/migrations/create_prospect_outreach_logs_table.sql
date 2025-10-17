-- ============================================
-- Prospect Outreach Logs Table
-- ============================================
-- Tracks all outreach emails sent to prospects

CREATE TABLE IF NOT EXISTS public.prospect_outreach_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_body TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending', 'test')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster querying by prospect_id
CREATE INDEX IF NOT EXISTS idx_prospect_outreach_logs_prospect_id
ON public.prospect_outreach_logs(prospect_id);

-- Index for faster querying by status and date
CREATE INDEX IF NOT EXISTS idx_prospect_outreach_logs_status_sent_at
ON public.prospect_outreach_logs(status, sent_at DESC);

COMMENT ON TABLE public.prospect_outreach_logs IS 'Tracks all outreach emails sent to prospects through the Prospect Intelligence system.';
COMMENT ON COLUMN public.prospect_outreach_logs.prospect_id IS 'ID of the prospect (from prospect_candidates table)';
COMMENT ON COLUMN public.prospect_outreach_logs.recipient_email IS 'Email address where the outreach was sent';
COMMENT ON COLUMN public.prospect_outreach_logs.subject IS 'Email subject line';
COMMENT ON COLUMN public.prospect_outreach_logs.email_body IS 'Full email body (HTML or text)';
COMMENT ON COLUMN public.prospect_outreach_logs.status IS 'Sent status: sent, failed, pending, test';
COMMENT ON COLUMN public.prospect_outreach_logs.sent_at IS 'Timestamp when email was sent';
COMMENT ON COLUMN public.prospect_outreach_logs.metadata IS 'Additional metadata (language, test_mode, etc.)';

