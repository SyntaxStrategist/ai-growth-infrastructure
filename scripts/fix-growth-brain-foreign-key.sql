-- Fix growth_brain foreign key setup for intelligence engine upsert
-- This script fixes the client_id column type and foreign key constraint

BEGIN;

-- Step 1: Drop the existing foreign key constraint if it exists
ALTER TABLE growth_brain DROP CONSTRAINT IF EXISTS fk_growth_brain_client;
ALTER TABLE growth_brain DROP CONSTRAINT IF EXISTS growth_brain_client_id_fkey;

-- Step 2: Drop the RLS policy temporarily so we can change column types
DROP POLICY IF EXISTS "Client can view own growth data" ON growth_brain;
DROP POLICY IF EXISTS "Service role full access to growth_brain" ON growth_brain;

-- Step 3: Change the client_id column type from text → uuid, casting existing values
-- First, let's check what type client_id currently is and handle accordingly
DO $$
BEGIN
    -- Check if client_id column exists and what type it is
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'growth_brain' AND column_name = 'client_id'
    ) THEN
        -- If it's text, convert to uuid
        IF (
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'growth_brain' AND column_name = 'client_id'
        ) = 'text' THEN
            ALTER TABLE growth_brain
            ALTER COLUMN client_id TYPE uuid USING client_id::uuid;
        ELSIF (
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'growth_brain' AND column_name = 'client_id'
        ) = 'character varying' THEN
            ALTER TABLE growth_brain
            ALTER COLUMN client_id TYPE uuid USING client_id::uuid;
        END IF;
    ELSE
        -- If column doesn't exist, add it
        ALTER TABLE growth_brain ADD COLUMN client_id uuid;
    END IF;
END $$;

-- Step 4: Recreate the correct foreign key constraint linking to clients.id
ALTER TABLE growth_brain
ADD CONSTRAINT fk_growth_brain_client
FOREIGN KEY (client_id)
REFERENCES clients (id)
ON DELETE CASCADE;

-- Step 5: Recreate the RLS policy for service role (admin + intelligence engine)
CREATE POLICY "Service role full access to growth_brain" ON growth_brain
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 6: Recreate the RLS policy for clients viewing their own analytics
CREATE POLICY "Client can view own growth data"
ON growth_brain
FOR SELECT
USING (auth.uid() = client_id);

-- Step 7: Ensure RLS is enabled
ALTER TABLE growth_brain ENABLE ROW LEVEL SECURITY;

-- Step 8: Refresh Supabase schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- Log success
DO $$
BEGIN
    RAISE NOTICE '✅ growth_brain foreign key setup fixed successfully';
    RAISE NOTICE '✅ client_id column converted to uuid type';
    RAISE NOTICE '✅ Foreign key constraint recreated';
    RAISE NOTICE '✅ RLS policies recreated';
    RAISE NOTICE '✅ Schema cache refreshed';
END $$;
