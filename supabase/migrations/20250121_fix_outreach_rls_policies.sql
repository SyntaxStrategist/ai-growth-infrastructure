-- Fix Row Level Security for Outreach Tables
-- Adds client_id columns and proper RLS policies for multi-tenant access

-- Add client_id columns to outreach tables for multi-tenant support
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE public.outreach_campaigns ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE public.outreach_emails ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE public.outreach_metrics ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE public.outreach_tracking ADD COLUMN IF NOT EXISTS client_id TEXT;

-- Add indexes for efficient client-based queries
CREATE INDEX IF NOT EXISTS idx_email_templates_client_id ON public.email_templates (client_id);
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_client_id ON public.outreach_campaigns (client_id);
CREATE INDEX IF NOT EXISTS idx_outreach_emails_client_id ON public.outreach_emails (client_id);
CREATE INDEX IF NOT EXISTS idx_outreach_metrics_client_id ON public.outreach_metrics (client_id);
CREATE INDEX IF NOT EXISTS idx_outreach_tracking_client_id ON public.outreach_tracking (client_id);

-- Enable RLS on all outreach tables
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_tracking ENABLE ROW LEVEL SECURITY;

-- ============================================
-- EMAIL TEMPLATES RLS POLICIES
-- ============================================

-- Service role has full access (for admin API routes)
CREATE POLICY "Service role full access to email_templates"
ON public.email_templates
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read their own templates
CREATE POLICY "Client can read own email_templates"
ON public.email_templates
FOR SELECT
TO authenticated
USING (
  has_client_access(client_id)
);

-- Authenticated users can insert templates for their client
CREATE POLICY "Client can insert own email_templates"
ON public.email_templates
FOR INSERT
TO authenticated
WITH CHECK (
  client_id = get_current_client_id()
);

-- Authenticated users can update their own templates
CREATE POLICY "Client can update own email_templates"
ON public.email_templates
FOR UPDATE
TO authenticated
USING (
  has_client_access(client_id)
)
WITH CHECK (
  client_id = get_current_client_id()
);

-- Authenticated users can delete their own templates
CREATE POLICY "Client can delete own email_templates"
ON public.email_templates
FOR DELETE
TO authenticated
USING (
  has_client_access(client_id)
);

-- ============================================
-- OUTREACH CAMPAIGNS RLS POLICIES
-- ============================================

-- Service role has full access (for admin API routes)
CREATE POLICY "Service role full access to outreach_campaigns"
ON public.outreach_campaigns
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read their own campaigns
CREATE POLICY "Client can read own outreach_campaigns"
ON public.outreach_campaigns
FOR SELECT
TO authenticated
USING (
  has_client_access(client_id)
);

-- Authenticated users can insert campaigns for their client
CREATE POLICY "Client can insert own outreach_campaigns"
ON public.outreach_campaigns
FOR INSERT
TO authenticated
WITH CHECK (
  client_id = get_current_client_id()
);

-- Authenticated users can update their own campaigns
CREATE POLICY "Client can update own outreach_campaigns"
ON public.outreach_campaigns
FOR UPDATE
TO authenticated
USING (
  has_client_access(client_id)
)
WITH CHECK (
  client_id = get_current_client_id()
);

-- Authenticated users can delete their own campaigns
CREATE POLICY "Client can delete own outreach_campaigns"
ON public.outreach_campaigns
FOR DELETE
TO authenticated
USING (
  has_client_access(client_id)
);

-- ============================================
-- OUTREACH EMAILS RLS POLICIES
-- ============================================

-- Service role has full access (for admin API routes)
CREATE POLICY "Service role full access to outreach_emails"
ON public.outreach_emails
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read their own emails
CREATE POLICY "Client can read own outreach_emails"
ON public.outreach_emails
FOR SELECT
TO authenticated
USING (
  has_client_access(client_id)
);

-- Authenticated users can insert emails for their client
CREATE POLICY "Client can insert own outreach_emails"
ON public.outreach_emails
FOR INSERT
TO authenticated
WITH CHECK (
  client_id = get_current_client_id()
);

-- Authenticated users can update their own emails
CREATE POLICY "Client can update own outreach_emails"
ON public.outreach_emails
FOR UPDATE
TO authenticated
USING (
  has_client_access(client_id)
)
WITH CHECK (
  client_id = get_current_client_id()
);

-- Authenticated users can delete their own emails
CREATE POLICY "Client can delete own outreach_emails"
ON public.outreach_emails
FOR DELETE
TO authenticated
USING (
  has_client_access(client_id)
);

-- ============================================
-- OUTREACH METRICS RLS POLICIES
-- ============================================

-- Service role has full access (for admin API routes)
CREATE POLICY "Service role full access to outreach_metrics"
ON public.outreach_metrics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read their own metrics
CREATE POLICY "Client can read own outreach_metrics"
ON public.outreach_metrics
FOR SELECT
TO authenticated
USING (
  has_client_access(client_id)
);

-- Authenticated users can insert metrics for their client
CREATE POLICY "Client can insert own outreach_metrics"
ON public.outreach_metrics
FOR INSERT
TO authenticated
WITH CHECK (
  client_id = get_current_client_id()
);

-- Authenticated users can update their own metrics
CREATE POLICY "Client can update own outreach_metrics"
ON public.outreach_metrics
FOR UPDATE
TO authenticated
USING (
  has_client_access(client_id)
)
WITH CHECK (
  client_id = get_current_client_id()
);

-- Authenticated users can delete their own metrics
CREATE POLICY "Client can delete own outreach_metrics"
ON public.outreach_metrics
FOR DELETE
TO authenticated
USING (
  has_client_access(client_id)
);

-- ============================================
-- OUTREACH TRACKING RLS POLICIES
-- ============================================

-- Service role has full access (for admin API routes)
CREATE POLICY "Service role full access to outreach_tracking"
ON public.outreach_tracking
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read their own tracking data
CREATE POLICY "Client can read own outreach_tracking"
ON public.outreach_tracking
FOR SELECT
TO authenticated
USING (
  has_client_access(client_id)
);

-- Authenticated users can insert tracking data for their client
CREATE POLICY "Client can insert own outreach_tracking"
ON public.outreach_tracking
FOR INSERT
TO authenticated
WITH CHECK (
  client_id = get_current_client_id()
);

-- Authenticated users can update their own tracking data
CREATE POLICY "Client can update own outreach_tracking"
ON public.outreach_tracking
FOR UPDATE
TO authenticated
USING (
  has_client_access(client_id)
)
WITH CHECK (
  client_id = get_current_client_id()
);

-- Authenticated users can delete their own tracking data
CREATE POLICY "Client can delete own outreach_tracking"
ON public.outreach_tracking
FOR DELETE
TO authenticated
USING (
  has_client_access(client_id)
);

-- ============================================
-- COMMENTS AND DOCUMENTATION
-- ============================================

COMMENT ON COLUMN public.email_templates.client_id IS 'Client identifier for multi-tenant access control';
COMMENT ON COLUMN public.outreach_campaigns.client_id IS 'Client identifier for multi-tenant access control';
COMMENT ON COLUMN public.outreach_emails.client_id IS 'Client identifier for multi-tenant access control';
COMMENT ON COLUMN public.outreach_metrics.client_id IS 'Client identifier for multi-tenant access control';
COMMENT ON COLUMN public.outreach_tracking.client_id IS 'Client identifier for multi-tenant access control';

-- Add comments for RLS policies
COMMENT ON POLICY "Service role full access to email_templates" ON public.email_templates IS 'Allows service role (admin API routes) full access to all email templates';
COMMENT ON POLICY "Client can read own email_templates" ON public.email_templates IS 'Allows authenticated clients to read their own email templates and global templates';
COMMENT ON POLICY "Client can insert own email_templates" ON public.email_templates IS 'Allows authenticated clients to create email templates for their client_id';
COMMENT ON POLICY "Client can update own email_templates" ON public.email_templates IS 'Allows authenticated clients to update their own email templates';
COMMENT ON POLICY "Client can delete own email_templates" ON public.email_templates IS 'Allows authenticated clients to delete their own email templates';
