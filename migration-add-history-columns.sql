-- ============================================
-- AI Memory System - Add History Columns
-- ============================================
-- Run this SQL in Supabase SQL Editor to add the new history tracking columns

-- Add tone_history column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'tone_history'
  ) THEN
    ALTER TABLE lead_memory ADD COLUMN tone_history JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Added tone_history column';
  ELSE
    RAISE NOTICE 'ℹ️  tone_history column already exists';
  END IF;
END $$;

-- Add confidence_history column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'confidence_history'
  ) THEN
    ALTER TABLE lead_memory ADD COLUMN confidence_history JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Added confidence_history column';
  ELSE
    RAISE NOTICE 'ℹ️  confidence_history column already exists';
  END IF;
END $$;

-- Add urgency_history column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'urgency_history'
  ) THEN
    ALTER TABLE lead_memory ADD COLUMN urgency_history JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Added urgency_history column';
  ELSE
    RAISE NOTICE 'ℹ️  urgency_history column already exists';
  END IF;
END $$;

-- Add last_updated column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'last_updated'
  ) THEN
    ALTER TABLE lead_memory ADD COLUMN last_updated TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Added last_updated column';
  ELSE
    RAISE NOTICE 'ℹ️  last_updated column already exists';
  END IF;
END $$;

-- Add relationship_insight column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'relationship_insight'
  ) THEN
    ALTER TABLE lead_memory ADD COLUMN relationship_insight TEXT;
    RAISE NOTICE '✅ Added relationship_insight column';
  ELSE
    RAISE NOTICE 'ℹ️  relationship_insight column already exists';
  END IF;
END $$;

-- Create index for last_updated
CREATE INDEX IF NOT EXISTS lead_memory_last_updated_idx ON lead_memory(last_updated);

-- Refresh PostgREST schema cache
ALTER TABLE lead_memory REPLICA IDENTITY FULL;

-- Final verification
DO $$
DECLARE
  missing_columns TEXT := '';
BEGIN
  -- Check for tone_history
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'tone_history'
  ) THEN
    missing_columns := missing_columns || 'tone_history, ';
  END IF;
  
  -- Check for confidence_history
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'confidence_history'
  ) THEN
    missing_columns := missing_columns || 'confidence_history, ';
  END IF;
  
  -- Check for urgency_history
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'urgency_history'
  ) THEN
    missing_columns := missing_columns || 'urgency_history, ';
  END IF;
  
  -- Check for relationship_insight
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'relationship_insight'
  ) THEN
    missing_columns := missing_columns || 'relationship_insight, ';
  END IF;
  
  -- Check for last_updated
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'last_updated'
  ) THEN
    missing_columns := missing_columns || 'last_updated, ';
  END IF;
  
  IF missing_columns != '' THEN
    RAISE EXCEPTION '❌ Missing columns in lead_memory: %', missing_columns;
  ELSE
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ SUCCESS: All history columns present in lead_memory';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Columns verified:';
    RAISE NOTICE '  - tone_history (jsonb)';
    RAISE NOTICE '  - confidence_history (jsonb)';
    RAISE NOTICE '  - urgency_history (jsonb)';
    RAISE NOTICE '  - last_updated (timestamptz)';
    RAISE NOTICE '  - relationship_insight (text)';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Schema cache refreshed. Ready to accept leads!';
    RAISE NOTICE '============================================';
  END IF;
END $$;

