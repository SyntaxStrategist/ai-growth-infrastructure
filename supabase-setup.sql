-- Run this SQL in your Supabase SQL Editor to set up the lead_memory table
-- This only needs to be run once when setting up your Supabase project

-- Create the exec_sql function for dynamic SQL execution
create or replace function public.exec_sql(query text)
returns void
language plpgsql
security definer
as $$
begin
execute query;
end;
$$;

-- Create the clients table for multi-tenant API key management
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_rotated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS clients_api_key_idx ON clients(api_key);
CREATE INDEX IF NOT EXISTS clients_created_at_idx ON clients(created_at);

-- Create the api_key_logs table for audit trail
CREATE TABLE IF NOT EXISTS api_key_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  old_key TEXT NOT NULL,
  new_key TEXT NOT NULL,
  rotated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_key_logs_client_id_idx ON api_key_logs(client_id);
CREATE INDEX IF NOT EXISTS api_key_logs_rotated_at_idx ON api_key_logs(rotated_at);

-- Create the lead_memory table with AI enrichment fields and client_id
CREATE TABLE IF NOT EXISTS lead_memory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  ai_summary TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  intent TEXT,
  tone TEXT,
  urgency TEXT,
  confidence_score NUMERIC(5,2),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  archived BOOLEAN DEFAULT FALSE,
  deleted BOOLEAN DEFAULT FALSE,
  current_tag TEXT,
  tone_history JSONB DEFAULT '[]'::jsonb,
  confidence_history JSONB DEFAULT '[]'::jsonb,
  urgency_history JSONB DEFAULT '[]'::jsonb,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  relationship_insight TEXT
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'archived'
  ) THEN
    ALTER TABLE lead_memory ADD COLUMN archived BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'deleted'
  ) THEN
    ALTER TABLE lead_memory ADD COLUMN deleted BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'current_tag'
  ) THEN
    ALTER TABLE lead_memory ADD COLUMN current_tag TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'tone_history'
  ) THEN
    ALTER TABLE lead_memory ADD COLUMN tone_history JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'confidence_history'
  ) THEN
    ALTER TABLE lead_memory ADD COLUMN confidence_history JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'urgency_history'
  ) THEN
    ALTER TABLE lead_memory ADD COLUMN urgency_history JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'last_updated'
  ) THEN
    ALTER TABLE lead_memory ADD COLUMN last_updated TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'relationship_insight'
  ) THEN
    ALTER TABLE lead_memory ADD COLUMN relationship_insight TEXT;
  END IF;
END $$;

-- Refresh schema cache to ensure PostgREST picks up new columns
ALTER TABLE lead_memory REPLICA IDENTITY FULL;

-- Verify all required columns exist
DO $$
DECLARE
  missing_columns TEXT := '';
BEGIN
  -- Check for tone_history
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'tone_history'
  ) THEN
    missing_columns := missing_columns || 'tone_history, ';
  END IF;
  
  -- Check for confidence_history
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'confidence_history'
  ) THEN
    missing_columns := missing_columns || 'confidence_history, ';
  END IF;
  
  -- Check for urgency_history
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'urgency_history'
  ) THEN
    missing_columns := missing_columns || 'urgency_history, ';
  END IF;
  
  -- Check for relationship_insight
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'relationship_insight'
  ) THEN
    missing_columns := missing_columns || 'relationship_insight, ';
  END IF;
  
  -- Check for last_updated
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'last_updated'
  ) THEN
    missing_columns := missing_columns || 'last_updated, ';
  END IF;
  
  IF missing_columns != '' THEN
    RAISE EXCEPTION 'Missing columns in lead_memory: %', missing_columns;
  ELSE
    RAISE NOTICE '✅ All required columns present in lead_memory table';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS lead_memory_timestamp_idx ON lead_memory(timestamp);
CREATE INDEX IF NOT EXISTS lead_memory_email_idx ON lead_memory(email);
CREATE INDEX IF NOT EXISTS lead_memory_urgency_idx ON lead_memory(urgency);
CREATE INDEX IF NOT EXISTS lead_memory_confidence_idx ON lead_memory(confidence_score);
CREATE INDEX IF NOT EXISTS lead_memory_client_id_idx ON lead_memory(client_id);
CREATE INDEX IF NOT EXISTS lead_memory_archived_idx ON lead_memory(archived);
CREATE INDEX IF NOT EXISTS lead_memory_deleted_idx ON lead_memory(deleted);
CREATE INDEX IF NOT EXISTS lead_memory_current_tag_idx ON lead_memory(current_tag);
CREATE INDEX IF NOT EXISTS lead_memory_last_updated_idx ON lead_memory(last_updated);

-- Enable Row Level Security (RLS) for clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Allow service role full access to clients" ON clients;
DROP POLICY IF EXISTS "Users can read all clients" ON clients;

-- Service role has full access (admin dashboard)
CREATE POLICY "Service role full access to clients" ON clients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Clients can only read their own record via API key validation
-- (This is enforced server-side via validateApiKey function)

-- Enable Row Level Security (RLS) for lead_memory table
ALTER TABLE lead_memory ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Allow service role full access to lead_memory" ON lead_memory;
DROP POLICY IF EXISTS "Users can read all leads" ON lead_memory;

-- Service role has full access (admin dashboard)
CREATE POLICY "Service role full access to lead_memory" ON lead_memory
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Clients can only read their own leads (enforced via client_id)
-- Note: This is a placeholder - actual enforcement happens server-side
-- since we use service role key for API calls

-- Enable Row Level Security (RLS) for api_key_logs table
ALTER TABLE api_key_logs ENABLE ROW LEVEL SECURITY;

-- Service role has full access (admin only)
CREATE POLICY "Service role full access to api_key_logs" ON api_key_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE clients IS 'Multi-tenant clients with API key authentication for external integrations';
COMMENT ON TABLE lead_memory IS 'Stores lead capture data from Avenir AI Solutions growth infrastructure';
COMMENT ON TABLE api_key_logs IS 'Audit log for API key rotation events';

-- Create the growth_brain table for AI-generated meta-insights
CREATE TABLE IF NOT EXISTS growth_brain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  analysis_period_start TIMESTAMPTZ NOT NULL,
  analysis_period_end TIMESTAMPTZ NOT NULL,
  total_leads INTEGER NOT NULL DEFAULT 0,
  top_intents JSONB,
  urgency_distribution JSONB,
  urgency_trend_percentage NUMERIC(5,2),
  tone_distribution JSONB,
  tone_sentiment_score NUMERIC(5,2),
  avg_confidence NUMERIC(5,2),
  confidence_trajectory JSONB,
  language_ratio JSONB,
  engagement_score NUMERIC(5,2),
  predictive_insights JSONB,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS growth_brain_client_id_idx ON growth_brain(client_id);
CREATE INDEX IF NOT EXISTS growth_brain_analyzed_at_idx ON growth_brain(analyzed_at);
CREATE INDEX IF NOT EXISTS growth_brain_period_idx ON growth_brain(analysis_period_start, analysis_period_end);

-- Enable Row Level Security (RLS) for growth_brain table
ALTER TABLE growth_brain ENABLE ROW LEVEL SECURITY;

-- Service role has full access (admin + intelligence engine)
CREATE POLICY "Service role full access to growth_brain" ON growth_brain
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE growth_brain IS 'AI-generated meta-insights and predictive analytics from lead intelligence patterns';

-- Create the lead_actions table for operational management audit trail
CREATE TABLE IF NOT EXISTS lead_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT NOT NULL REFERENCES lead_memory(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  tag TEXT,
  performed_by TEXT NOT NULL DEFAULT 'admin',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure timestamp column exists in lead_actions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_actions' AND column_name = 'timestamp'
  ) THEN
    ALTER TABLE lead_actions ADD COLUMN timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE '✅ Added timestamp column to lead_actions';
  ELSE
    RAISE NOTICE 'ℹ️  timestamp column already exists in lead_actions';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS lead_actions_lead_id_idx ON lead_actions(lead_id);
CREATE INDEX IF NOT EXISTS lead_actions_timestamp_idx ON lead_actions(timestamp);
CREATE INDEX IF NOT EXISTS lead_actions_action_idx ON lead_actions(action);

-- Enable Row Level Security (RLS) for lead_actions table
ALTER TABLE lead_actions ENABLE ROW LEVEL SECURITY;

-- Service role has full access (admin only)
CREATE POLICY "Service role full access to lead_actions" ON lead_actions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE lead_actions IS 'Audit trail for lead management actions (delete, archive, tag)';

