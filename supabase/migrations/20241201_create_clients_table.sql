-- Create clients table for client onboarding and authentication
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'fr')),
  api_key TEXT UNIQUE NOT NULL,
  client_id TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  lead_source_description TEXT,
  estimated_leads_per_week INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  last_connection TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Create index for fast API key lookups
CREATE INDEX IF NOT EXISTS idx_clients_api_key ON public.clients(api_key);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_client_id ON public.clients(client_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can only read their own data
CREATE POLICY "Clients can view own data" ON public.clients
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Policy: Anyone can insert (for signup)
CREATE POLICY "Anyone can create account" ON public.clients
  FOR INSERT
  WITH CHECK (true);

-- Policy: Clients can update their own data
CREATE POLICY "Clients can update own data" ON public.clients
  FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Grant access
GRANT SELECT, INSERT, UPDATE ON public.clients TO anon, authenticated;

-- Add comment
COMMENT ON TABLE public.clients IS 'Client accounts for API access and private dashboards';

