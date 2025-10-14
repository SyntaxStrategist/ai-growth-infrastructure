-- Run this SQL in your Supabase SQL Editor to set up the lead_memory table
-- This only needs to be run once when setting up your Supabase project

-- Create the exec_sql function for dynamic SQL execution
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE query;
  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- Create the lead_memory table
CREATE TABLE IF NOT EXISTS lead_memory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  ai_summary TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lead_memory_timestamp_idx ON lead_memory(timestamp);
CREATE INDEX IF NOT EXISTS lead_memory_email_idx ON lead_memory(email);

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

