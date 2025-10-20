-- RLS Helper Functions
-- Provides utility functions for Row Level Security context management

-- Create a function to set client context for RLS policies
CREATE OR REPLACE FUNCTION set_client_context(client_id_param TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set the client_id in the current session for RLS policies
  PERFORM set_config('request.jwt.claims', json_build_object('client_id', client_id_param)::text, true);
END;
$$;

-- Create a function to get current client context
CREATE OR REPLACE FUNCTION get_current_client_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claims JSONB;
  client_id TEXT;
BEGIN
  -- Get the JWT claims from the current session
  claims := current_setting('request.jwt.claims', true)::jsonb;
  
  -- Extract client_id from claims
  client_id := claims->>'client_id';
  
  RETURN client_id;
END;
$$;

-- Create a function to check if current user has access to a resource
CREATE OR REPLACE FUNCTION has_client_access(resource_client_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_client_id TEXT;
BEGIN
  -- Get current client ID
  current_client_id := get_current_client_id();
  
  -- Allow access if client IDs match
  IF current_client_id = resource_client_id THEN
    RETURN TRUE;
  END IF;
  
  -- Allow access to global resources (client_id is null)
  IF resource_client_id IS NULL THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Create a function to validate client access with error handling
CREATE OR REPLACE FUNCTION validate_client_access(resource_client_id TEXT, operation TEXT DEFAULT 'access')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has access
  IF NOT has_client_access(resource_client_id) THEN
    RAISE EXCEPTION 'Access denied: Client does not have permission to % this resource', operation;
  END IF;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION set_client_context(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_client_id() TO authenticated;
GRANT EXECUTE ON FUNCTION has_client_access(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_client_access(TEXT, TEXT) TO authenticated;

-- Grant execute permissions to service role (for admin operations)
GRANT EXECUTE ON FUNCTION set_client_context(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_current_client_id() TO service_role;
GRANT EXECUTE ON FUNCTION has_client_access(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION validate_client_access(TEXT, TEXT) TO service_role;

-- Add comments for documentation
COMMENT ON FUNCTION set_client_context(TEXT) IS 'Sets the client context for RLS policies in the current session';
COMMENT ON FUNCTION get_current_client_id() IS 'Gets the current client ID from the JWT claims';
COMMENT ON FUNCTION has_client_access(TEXT) IS 'Checks if the current client has access to a resource';
COMMENT ON FUNCTION validate_client_access(TEXT, TEXT) IS 'Validates client access and raises an exception if denied';
