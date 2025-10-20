-- ============================================
-- Prospect Intelligence Module - Database Schema
-- ============================================
-- Creates tables for autonomous prospecting system

-- Prospect Candidates Table
CREATE TABLE IF NOT EXISTS public.prospect_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  website TEXT NOT NULL UNIQUE,
  contact_email TEXT,
  industry TEXT,
  region TEXT,
  language TEXT DEFAULT 'en',
  form_url TEXT,
  last_tested TIMESTAMPTZ,
  response_score NUMERIC DEFAULT 0,
  automation_need_score NUMERIC DEFAULT 0,
  contacted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Prospect Outreach Log Table
CREATE TABLE IF NOT EXISTS public.prospect_outreach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES public.prospect_candidates(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  email_body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'replied', 'bounced', 'ignored')),
  reply_content TEXT,
  metadata JSONB
);

-- Industry Performance Tracking
CREATE TABLE IF NOT EXISTS public.prospect_industry_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry TEXT NOT NULL UNIQUE,
  total_contacted INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,
  open_rate NUMERIC DEFAULT 0,
  reply_rate NUMERIC DEFAULT 0,
  avg_response_time_hours NUMERIC,
  priority_score NUMERIC DEFAULT 50,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Form Test Results Table
CREATE TABLE IF NOT EXISTS public.prospect_form_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES public.prospect_candidates(id) ON DELETE CASCADE,
  test_submitted_at TIMESTAMPTZ NOT NULL,
  response_received_at TIMESTAMPTZ,
  response_time_minutes NUMERIC,
  has_autoresponder BOOLEAN DEFAULT FALSE,
  autoresponder_tone TEXT CHECK (autoresponder_tone IN ('robotic', 'human', 'personalized', 'none')),
  autoresponder_content TEXT,
  score NUMERIC DEFAULT 0,
  test_status TEXT DEFAULT 'pending' CHECK (test_status IN ('pending', 'completed', 'failed', 'timeout')),
  metadata JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prospects_automation_score ON public.prospect_candidates(automation_need_score DESC);
CREATE INDEX IF NOT EXISTS idx_prospects_contacted ON public.prospect_candidates(contacted);
CREATE INDEX IF NOT EXISTS idx_prospects_industry ON public.prospect_candidates(industry);
CREATE INDEX IF NOT EXISTS idx_prospects_region ON public.prospect_candidates(region);
CREATE INDEX IF NOT EXISTS idx_outreach_status ON public.prospect_outreach_log(status);
CREATE INDEX IF NOT EXISTS idx_outreach_prospect ON public.prospect_outreach_log(prospect_id);
CREATE INDEX IF NOT EXISTS idx_form_tests_prospect ON public.prospect_form_tests(prospect_id);
CREATE INDEX IF NOT EXISTS idx_industry_performance ON public.prospect_industry_performance(priority_score DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to prospect_candidates
CREATE TRIGGER update_prospect_candidates_updated_at
    BEFORE UPDATE ON public.prospect_candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.prospect_candidates IS 'Stores potential clients discovered by the prospect intelligence system';
COMMENT ON TABLE public.prospect_outreach_log IS 'Tracks all outreach emails sent to prospects with engagement metrics';
COMMENT ON TABLE public.prospect_industry_performance IS 'Aggregates performance data by industry for learning loop';
COMMENT ON TABLE public.prospect_form_tests IS 'Records results of automated form testing for response quality analysis';

