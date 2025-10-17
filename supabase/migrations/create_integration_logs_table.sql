-- ============================================
-- Integration Logs Table
-- ============================================
-- Stores integration API logs for debugging (replaces filesystem logs in serverless)

CREATE TABLE IF NOT EXISTS public.integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_integration_logs_source ON public.integration_logs(source);
CREATE INDEX IF NOT EXISTS idx_integration_logs_level ON public.integration_logs(level);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON public.integration_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_logs_source_created ON public.integration_logs(source, created_at DESC);

-- Enable RLS (admin-only access)
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to integration_logs" ON public.integration_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.integration_logs IS 'Centralized logging for API integrations (Apollo, PDL, etc.) - replaces filesystem logs in serverless environments';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ integration_logs table created';
  RAISE NOTICE '   - Stores API integration logs';
  RAISE NOTICE '   - Replaces filesystem logging in production';
  RAISE NOTICE '   - Accessible via Supabase dashboard';
END $$;

