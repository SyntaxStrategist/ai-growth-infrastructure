-- ============================================
-- Add Foreign Key Constraint for outreach_emails -> prospect_candidates
-- ============================================
-- Purpose: Enable PostgREST joins for Outreach Center UI
-- Date: October 21, 2025

-- Step 1: Clean invalid prospect_id values (set non-UUID values to NULL)
DO $$
DECLARE
  invalid_count INT;
BEGIN
  -- Check current data type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'outreach_emails' 
    AND column_name = 'prospect_id' 
    AND data_type = 'text'
  ) THEN
    RAISE NOTICE 'Cleaning invalid prospect_id values...';
    
    -- Count invalid UUIDs
    SELECT COUNT(*) INTO invalid_count
    FROM outreach_emails
    WHERE prospect_id IS NOT NULL 
    AND prospect_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    RAISE NOTICE 'Found % invalid prospect_id values', invalid_count;
    
    -- Set invalid UUIDs to NULL (these were from old test data)
    UPDATE outreach_emails
    SET prospect_id = NULL
    WHERE prospect_id IS NOT NULL 
    AND prospect_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    RAISE NOTICE '✅ Cleaned % invalid prospect_id values (set to NULL)', invalid_count;
    
    -- Now convert TEXT to UUID
    RAISE NOTICE 'Converting prospect_id from TEXT to UUID...';
    ALTER TABLE outreach_emails 
    ALTER COLUMN prospect_id TYPE UUID USING prospect_id::UUID;
    
    RAISE NOTICE '✅ Converted prospect_id to UUID';
  ELSE
    RAISE NOTICE 'prospect_id is already UUID type';
  END IF;
END $$;

-- Step 2: Add foreign key constraint to establish relationship
ALTER TABLE outreach_emails
ADD CONSTRAINT outreach_emails_prospect_id_fkey
FOREIGN KEY (prospect_id) 
REFERENCES prospect_candidates(id)
ON DELETE SET NULL;

-- Add comment
COMMENT ON CONSTRAINT outreach_emails_prospect_id_fkey ON outreach_emails 
IS 'Foreign key to prospect_candidates - enables PostgREST joins for enriched prospect data';

-- Verify the constraint was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'outreach_emails_prospect_id_fkey'
  ) THEN
    RAISE NOTICE '✅ Foreign key constraint created successfully';
  ELSE
    RAISE EXCEPTION '❌ Foreign key constraint was not created';
  END IF;
END $$;

