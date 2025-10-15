-- ============================================
-- Fix lead_actions Table - Add timestamp Column
-- ============================================
-- Run this SQL in Supabase SQL Editor to ensure timestamp column exists

-- Add timestamp column to lead_actions if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_actions' AND column_name = 'timestamp'
  ) THEN
    ALTER TABLE lead_actions ADD COLUMN timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE '✅ Added timestamp column to lead_actions';
  ELSE
    RAISE NOTICE 'ℹ️  timestamp column already exists in lead_actions';
  END IF;
END $$;

-- Create index for timestamp
CREATE INDEX IF NOT EXISTS lead_actions_timestamp_idx ON lead_actions(timestamp);

-- Verify the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_actions' AND column_name = 'timestamp'
  ) THEN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ SUCCESS: timestamp column present in lead_actions';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Column verified:';
    RAISE NOTICE '  - timestamp (timestamptz, NOT NULL, DEFAULT NOW())';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'lead_actions table is ready!';
    RAISE NOTICE '============================================';
  ELSE
    RAISE EXCEPTION '❌ timestamp column still missing from lead_actions';
  END IF;
END $$;

