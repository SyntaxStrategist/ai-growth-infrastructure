-- Fix duplicate_index issues by dropping redundant indexes
-- Keep only one index per column to reduce storage and maintenance overhead

-- Fix clients table duplicate indexes
-- Keep unique constraints, drop redundant regular indexes
DROP INDEX IF EXISTS idx_clients_api_key;
DROP INDEX IF EXISTS idx_clients_email;
DROP INDEX IF EXISTS idx_clients_client_id;

-- Fix avenir_profile_embeddings table duplicate indexes
-- Keep unique constraint, drop redundant regular index
DROP INDEX IF EXISTS idx_avenir_profile_embeddings_chunk_id;

-- Fix prompt_registry table duplicate indexes
-- Keep the composite index, drop the individual ones
DROP INDEX IF EXISTS idx_prompt_registry_prompt_name;
DROP INDEX IF EXISTS idx_prompt_registry_variant_version;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Duplicate indexes fixed!';
  RAISE NOTICE '   - Dropped redundant indexes on clients table (api_key, email, client_id)';
  RAISE NOTICE '   - Dropped redundant index on avenir_profile_embeddings (chunk_id)';
  RAISE NOTICE '   - Dropped redundant indexes on prompt_registry (prompt_name, variant_version)';
  RAISE NOTICE '   - Kept unique constraints and composite indexes for performance';
  RAISE NOTICE '   - Reduced storage overhead and maintenance cost';
END $$;
