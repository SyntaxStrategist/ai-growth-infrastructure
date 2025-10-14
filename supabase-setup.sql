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

-- Create the lead_memory table with AI enrichment fields
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
  confidence_score NUMERIC(5,2)
);

CREATE INDEX IF NOT EXISTS lead_memory_timestamp_idx ON lead_memory(timestamp);
CREATE INDEX IF NOT EXISTS lead_memory_email_idx ON lead_memory(email);
CREATE INDEX IF NOT EXISTS lead_memory_urgency_idx ON lead_memory(urgency);
CREATE INDEX IF NOT EXISTS lead_memory_confidence_idx ON lead_memory(confidence_score);

-- Enable Row Level Security (RLS)
ALTER TABLE lead_memory ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to insert/select
CREATE POLICY "Allow service role full access" ON lead_memory
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: Allow authenticated users to read their own leads
CREATE POLICY "Users can read all leads" ON lead_memory
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE lead_memory IS 'Stores lead capture data from Avenir AI Solutions growth infrastructure';

