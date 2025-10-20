-- ============================================
-- Add Avenir AI Solutions as Internal Client
-- ============================================
-- This creates a first-party client record for Avenir AI Solutions
-- so all marketing site leads can be tracked in the admin dashboard

-- Insert Avenir AI Solutions as internal client (if not exists)
INSERT INTO public.clients (
  client_id,
  business_name,
  contact_name,
  email,
  password_hash,
  language,
  api_key,
  created_at
)
SELECT 
  'avenir-internal-client',                           -- Fixed client_id for internal use
  'Avenir AI Solutions',                              -- Business name
  'Avenir Team',                                       -- Contact name
  'info@aveniraisolutions.ca',                        -- Internal email
  '$2a$10$placeholder.hash.not.used.for.login',      -- Placeholder hash (login disabled)
  'en',                                                -- Default language
  'internal-avenir-key-do-not-use-externally',        -- Placeholder API key
  NOW()                                                -- Creation timestamp
WHERE NOT EXISTS (
  SELECT 1 FROM public.clients WHERE email = 'info@aveniraisolutions.ca'
);  -- Only insert if doesn't exist

-- Add comment for documentation
COMMENT ON TABLE public.clients IS 
'Client records for external businesses using Avenir AI. 
The record with client_id = ''avenir-internal-client'' is for first-party leads from the Avenir marketing site.';

-- Create index on client_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_client_id ON public.clients(client_id);

-- Log the insertion
DO $$
BEGIN
  RAISE NOTICE '✅ Avenir AI Solutions added as internal client';
  RAISE NOTICE '   client_id: avenir-internal-client';
  RAISE NOTICE '   business_name: Avenir AI Solutions';
  RAISE NOTICE '   All marketing site leads will be linked to this client';
END $$;

