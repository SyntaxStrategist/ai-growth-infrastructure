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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS clients_api_key_idx ON clients(api_key);
CREATE INDEX IF NOT EXISTS clients_created_at_idx ON clients(created_at);

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
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS lead_memory_timestamp_idx ON lead_memory(timestamp);
CREATE INDEX IF NOT EXISTS lead_memory_email_idx ON lead_memory(email);
CREATE INDEX IF NOT EXISTS lead_memory_urgency_idx ON lead_memory(urgency);
CREATE INDEX IF NOT EXISTS lead_memory_confidence_idx ON lead_memory(confidence_score);
CREATE INDEX IF NOT EXISTS lead_memory_client_id_idx ON lead_memory(client_id);

-- Enable Row Level Security (RLS) for clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to clients" ON clients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable Row Level Security (RLS) for lead_memory table
ALTER TABLE lead_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to lead_memory" ON lead_memory
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: Allow authenticated users to read all data
CREATE POLICY "Users can read all leads" ON lead_memory
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all clients" ON clients
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE clients IS 'Multi-tenant clients with API key authentication for external integrations';
COMMENT ON TABLE lead_memory IS 'Stores lead capture data from Avenir AI Solutions growth infrastructure';

