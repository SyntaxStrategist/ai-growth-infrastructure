-- ============================================
-- Add Avenir AI Solutions as Internal Client
-- ============================================
-- This creates a first-party client record for Avenir AI Solutions
-- so all marketing site leads can be tracked in the admin dashboard

-- Insert Avenir AI Solutions as internal client (if not exists)
INSERT INTO public.clients (
  client_id,
  business_name,
  name,
  email,
  contact_name,
  password_hash,
  language,
  api_key,
  is_internal,
  created_at
)
VALUES (
  'avenir-internal-client',                           -- Fixed client_id for internal use
  'Avenir AI Solutions',                              -- Business name
  'Avenir Team',                                       -- Contact name
  'info@aveniraisolutions.ca',                        -- Internal email
  'Avenir Team',                                       -- Contact name (duplicate for compatibility)
  '$2a$10$placeholder.hash.not.used.for.login',      -- Placeholder hash (login disabled)
  'en',                                                -- Default language
  'internal-avenir-key-do-not-use-externally',        -- Placeholder API key
  TRUE,                                                -- Mark as internal client
  NOW()                                                -- Creation timestamp
)
ON CONFLICT (email) DO UPDATE SET is_internal = TRUE;  -- Update if already exists

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

