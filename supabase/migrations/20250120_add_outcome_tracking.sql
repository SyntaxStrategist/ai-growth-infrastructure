-- Migration: Add outcome tracking columns to lead_memory table
-- This migration adds columns to track client outcomes for leads

-- Add outcome tracking columns to lead_memory table
ALTER TABLE public.lead_memory 
ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS meeting_booked_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS client_closed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS no_sale_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS outcome_status TEXT DEFAULT NULL CHECK (outcome_status IN ('contacted', 'meeting_booked', 'client_closed', 'no_sale'));

-- Add indexes for outcome tracking columns
CREATE INDEX IF NOT EXISTS idx_lead_memory_contacted_at ON lead_memory(contacted_at);
CREATE INDEX IF NOT EXISTS idx_lead_memory_meeting_booked_at ON lead_memory(meeting_booked_at);
CREATE INDEX IF NOT EXISTS idx_lead_memory_client_closed_at ON lead_memory(client_closed_at);
CREATE INDEX IF NOT EXISTS idx_lead_memory_no_sale_at ON lead_memory(no_sale_at);
CREATE INDEX IF NOT EXISTS idx_lead_memory_outcome_status ON lead_memory(outcome_status);

-- Add comments for documentation
COMMENT ON COLUMN lead_memory.contacted_at IS 'Timestamp when client marked lead as contacted';
COMMENT ON COLUMN lead_memory.meeting_booked_at IS 'Timestamp when client marked lead as having a meeting booked';
COMMENT ON COLUMN lead_memory.client_closed_at IS 'Timestamp when client marked lead as closed (converted to client)';
COMMENT ON COLUMN lead_memory.no_sale_at IS 'Timestamp when client marked lead as no sale';
COMMENT ON COLUMN lead_memory.outcome_status IS 'Current outcome status: contacted, meeting_booked, client_closed, no_sale';

-- Update RLS policies to include new outcome columns
-- The existing policies already cover all columns, but let's ensure they're explicit

-- Drop and recreate the service role policy to include new columns
DROP POLICY IF EXISTS "Service role full access to lead_memory" ON lead_memory;

CREATE POLICY "Service role full access to lead_memory" ON lead_memory
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add a composite index for outcome analytics queries
CREATE INDEX IF NOT EXISTS idx_lead_memory_client_outcome ON lead_memory(client_id, outcome_status, contacted_at, meeting_booked_at, client_closed_at, no_sale_at);

-- Add a function to update outcome status and timestamps
CREATE OR REPLACE FUNCTION update_lead_outcome(
  p_lead_id TEXT,
  p_outcome_status TEXT,
  p_client_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status TEXT;
BEGIN
  -- Validate outcome status
  IF p_outcome_status NOT IN ('contacted', 'meeting_booked', 'client_closed', 'no_sale') THEN
    RAISE EXCEPTION 'Invalid outcome status: %', p_outcome_status;
  END IF;

  -- Get current status
  SELECT outcome_status INTO v_current_status
  FROM lead_memory
  WHERE id = p_lead_id
    AND (p_client_id IS NULL OR client_id = p_client_id);

  -- Check if lead exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found or access denied';
  END IF;

  -- Update the lead with new outcome status and timestamp
  UPDATE lead_memory
  SET 
    outcome_status = p_outcome_status,
    contacted_at = CASE WHEN p_outcome_status = 'contacted' THEN NOW() ELSE contacted_at END,
    meeting_booked_at = CASE WHEN p_outcome_status = 'meeting_booked' THEN NOW() ELSE meeting_booked_at END,
    client_closed_at = CASE WHEN p_outcome_status = 'client_closed' THEN NOW() ELSE client_closed_at END,
    no_sale_at = CASE WHEN p_outcome_status = 'no_sale' THEN NOW() ELSE no_sale_at END,
    last_updated = NOW()
  WHERE id = p_lead_id;

  -- Log the action in lead_actions table
  INSERT INTO lead_actions (lead_id, client_id, action_type, tag, timestamp)
  VALUES (p_lead_id, p_client_id, 'outcome_update', p_outcome_status, NOW());

  RETURN TRUE;
END;
$$;

-- Add comment for the function
COMMENT ON FUNCTION update_lead_outcome IS 'Updates lead outcome status and timestamps, logs action in lead_actions table';

-- Create a view for outcome analytics
CREATE OR REPLACE VIEW lead_outcome_analytics AS
SELECT 
  client_id,
  COUNT(*) as total_leads,
  COUNT(contacted_at) as contacted_leads,
  COUNT(meeting_booked_at) as meeting_booked_leads,
  COUNT(client_closed_at) as client_closed_leads,
  COUNT(no_sale_at) as no_sale_leads,
  ROUND(COUNT(contacted_at) * 100.0 / NULLIF(COUNT(*), 0), 2) as contact_rate,
  ROUND(COUNT(meeting_booked_at) * 100.0 / NULLIF(COUNT(contacted_at), 0), 2) as meeting_rate,
  ROUND(COUNT(client_closed_at) * 100.0 / NULLIF(COUNT(meeting_booked_at), 0), 2) as close_rate,
  ROUND(COUNT(client_closed_at) * 100.0 / NULLIF(COUNT(*), 0), 2) as overall_conversion_rate
FROM lead_memory
WHERE is_test = false
  AND deleted = false
GROUP BY client_id;

-- Add comment for the view
COMMENT ON VIEW lead_outcome_analytics IS 'Analytics view for lead outcome tracking and conversion rates';

-- Grant permissions
GRANT SELECT ON lead_outcome_analytics TO service_role;
GRANT EXECUTE ON FUNCTION update_lead_outcome TO service_role;

-- Verify the migration
DO $$
BEGIN
  -- Check if all columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'contacted_at'
  ) THEN
    RAISE EXCEPTION 'Migration failed: contacted_at column not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'meeting_booked_at'
  ) THEN
    RAISE EXCEPTION 'Migration failed: meeting_booked_at column not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'client_closed_at'
  ) THEN
    RAISE EXCEPTION 'Migration failed: client_closed_at column not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'no_sale_at'
  ) THEN
    RAISE EXCEPTION 'Migration failed: no_sale_at column not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'outcome_status'
  ) THEN
    RAISE EXCEPTION 'Migration failed: outcome_status column not found';
  END IF;

  RAISE NOTICE '✅ Outcome tracking migration completed successfully';
END $$;
