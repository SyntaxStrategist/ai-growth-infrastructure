-- ============================================
-- Create secure RPC function for lead insertion
-- ============================================
-- This replaces the vulnerable manual SQL construction with a secure parameterized function

CREATE OR REPLACE FUNCTION insert_lead_memory(
  p_id TEXT,
  p_name TEXT,
  p_email TEXT,
  p_message TEXT,
  p_ai_summary TEXT DEFAULT NULL,
  p_language TEXT DEFAULT 'en',
  p_timestamp TIMESTAMPTZ DEFAULT NOW(),
  p_client_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_temp
AS $$
BEGIN
  -- Insert lead with parameterized values (prevents SQL injection)
  INSERT INTO public.lead_memory (
    id, 
    name, 
    email, 
    message, 
    ai_summary, 
    language, 
    timestamp,
    client_id
  )
  VALUES (
    p_id,
    p_name,
    p_email,
    p_message,
    p_ai_summary,
    p_language,
    p_timestamp,
    p_client_id
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION insert_lead_memory(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, UUID) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION insert_lead_memory IS 'Secure parameterized function for inserting leads - prevents SQL injection';
