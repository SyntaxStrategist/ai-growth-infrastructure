-- Create lead_memory table
-- This table stores all lead information and AI enrichment data

CREATE TABLE IF NOT EXISTS public.lead_memory (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  ai_summary TEXT,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- AI Enrichment
  intent VARCHAR(100),
  tone VARCHAR(100),
  urgency VARCHAR(50),
  confidence_score DECIMAL(5,2),
  
  -- History Tracking (JSONB)
  tone_history JSONB NOT NULL DEFAULT '[]',
  confidence_history JSONB NOT NULL DEFAULT '[]',
  urgency_history JSONB NOT NULL DEFAULT '[]',
  
  -- Status & Tags
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  current_tag VARCHAR(100),
  relationship_insight TEXT,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Client Association
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  
  -- Flags
  is_test BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_memory_timestamp ON public.lead_memory(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lead_memory_email ON public.lead_memory(email);
CREATE INDEX IF NOT EXISTS idx_lead_memory_urgency ON public.lead_memory(urgency);
CREATE INDEX IF NOT EXISTS idx_lead_memory_confidence_score ON public.lead_memory(confidence_score);
CREATE INDEX IF NOT EXISTS idx_lead_memory_client_id ON public.lead_memory(client_id);
CREATE INDEX IF NOT EXISTS idx_lead_memory_archived ON public.lead_memory(archived);
CREATE INDEX IF NOT EXISTS idx_lead_memory_deleted ON public.lead_memory(deleted);
CREATE INDEX IF NOT EXISTS idx_lead_memory_current_tag ON public.lead_memory(current_tag);
CREATE INDEX IF NOT EXISTS idx_lead_memory_last_updated ON public.lead_memory(last_updated);
CREATE INDEX IF NOT EXISTS idx_lead_memory_is_test ON public.lead_memory(is_test);

-- Add comments for documentation
COMMENT ON TABLE public.lead_memory IS 'Stores all lead information including AI enrichment data and history tracking';
COMMENT ON COLUMN public.lead_memory.id IS 'Unique identifier for the lead (usually generated from timestamp and random string)';
COMMENT ON COLUMN public.lead_memory.ai_summary IS 'AI-generated summary of the lead message';
COMMENT ON COLUMN public.lead_memory.intent IS 'AI-detected intent of the lead (e.g., "B2B partnership", "Sales inquiry")';
COMMENT ON COLUMN public.lead_memory.tone IS 'AI-detected tone of the lead message (e.g., "Professional", "Urgent")';
COMMENT ON COLUMN public.lead_memory.urgency IS 'AI-detected urgency level (e.g., "High", "Medium", "Low")';
COMMENT ON COLUMN public.lead_memory.confidence_score IS 'AI confidence score for the analysis (0.00 to 1.00)';
COMMENT ON COLUMN public.lead_memory.tone_history IS 'JSON array tracking tone changes over time';
COMMENT ON COLUMN public.lead_memory.confidence_history IS 'JSON array tracking confidence score changes over time';
COMMENT ON COLUMN public.lead_memory.urgency_history IS 'JSON array tracking urgency changes over time';
COMMENT ON COLUMN public.lead_memory.current_tag IS 'Current tag applied to the lead (e.g., "Hot Lead", "Converted")';
COMMENT ON COLUMN public.lead_memory.relationship_insight IS 'AI-generated insights about the lead relationship';
COMMENT ON COLUMN public.lead_memory.is_test IS 'Marks test/demo leads. Inherits from client is_test flag.';

-- Enable RLS
ALTER TABLE public.lead_memory ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own client's leads" ON public.lead_memory
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM public.clients WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can insert leads for their own clients" ON public.lead_memory
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can update leads for their own clients" ON public.lead_memory
  FOR UPDATE USING (
    client_id IN (
      SELECT id FROM public.clients WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can delete leads for their own clients" ON public.lead_memory
  FOR DELETE USING (
    client_id IN (
      SELECT id FROM public.clients WHERE auth.uid()::text = id::text
    )
  );

-- Service role can do everything
CREATE POLICY "Service role has full access to lead_memory" ON public.lead_memory
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON public.lead_memory TO authenticated;
GRANT ALL ON public.lead_memory TO service_role;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ lead_memory table created successfully!';
  RAISE NOTICE '   - Stores all lead information and AI enrichment data';
  RAISE NOTICE '   - Includes history tracking and performance indexes';
  RAISE NOTICE '   - RLS policies configured for client isolation';
END $$;
