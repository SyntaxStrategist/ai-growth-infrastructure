-- Add ICP (Ideal Client Profile) data column to clients table
-- This enables richer client profiles for AI personalization

-- Add ICP data as JSONB column to existing clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS icp_data JSONB DEFAULT '{}';

-- Create GIN index for efficient JSONB querying
CREATE INDEX IF NOT EXISTS idx_clients_icp_data 
ON public.clients USING GIN (icp_data);

-- Add comment for documentation
COMMENT ON COLUMN public.clients.icp_data IS 
'Client ICP (Ideal Client Profile) data for AI personalization. Contains target_client_type, deal_size, business_goal, main_challenge, and other profile information.';

-- Create index for specific ICP fields for faster filtering
CREATE INDEX IF NOT EXISTS idx_clients_icp_business_goal 
ON public.clients ((icp_data->>'main_business_goal'));

CREATE INDEX IF NOT EXISTS idx_clients_icp_target_client_type 
ON public.clients ((icp_data->>'target_client_type'));

-- Add constraint to ensure icp_data is always an object
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'icp_data_must_be_object'
    ) THEN
        ALTER TABLE public.clients 
        ADD CONSTRAINT icp_data_must_be_object 
        CHECK (jsonb_typeof(icp_data) = 'object');
    END IF;
END $$;

-- Update existing clients to have empty ICP data object
UPDATE public.clients 
SET icp_data = '{}' 
WHERE icp_data IS NULL;

-- Verify the migration
DO $$
DECLARE
    client_count INTEGER;
    icp_data_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO client_count FROM public.clients;
    SELECT COUNT(*) INTO icp_data_count FROM public.clients WHERE icp_data IS NOT NULL;
    
    RAISE NOTICE 'Migration completed successfully:';
    RAISE NOTICE '- Total clients: %', client_count;
    RAISE NOTICE '- Clients with ICP data: %', icp_data_count;
    RAISE NOTICE '- ICP data column added and indexed';
END $$;
