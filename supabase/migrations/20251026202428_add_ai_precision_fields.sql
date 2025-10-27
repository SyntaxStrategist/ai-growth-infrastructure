-- Migration: Add AI Precision Enhancement fields to clients table
-- Created: January 2025
-- Purpose: Allow clients to provide additional context for more precise AI lead analysis

-- Add new columns for AI precision enhancement
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS typical_deal_size TEXT,
  ADD COLUMN IF NOT EXISTS geographic_area TEXT,
  ADD COLUMN IF NOT EXISTS main_pain_points TEXT,
  ADD COLUMN IF NOT EXISTS custom_urgency_rules TEXT,
  ADD COLUMN IF NOT EXISTS target_customer_profile TEXT,
  ADD COLUMN IF NOT EXISTS avg_response_time_goal TEXT,
  ADD COLUMN IF NOT EXISTS competitive_behavior TEXT,
  ADD COLUMN IF NOT EXISTS seasonal_patterns TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_geographic_area ON clients(geographic_area);

-- Add comments for documentation
COMMENT ON COLUMN clients.typical_deal_size IS 'Typical deal size range for the client';
COMMENT ON COLUMN clients.geographic_area IS 'Geographic service area (e.g., city, province, country)';
COMMENT ON COLUMN clients.main_pain_points IS 'Main pain points and challenges the client faces';
COMMENT ON COLUMN clients.custom_urgency_rules IS 'Custom urgency scoring rules specific to this client';
COMMENT ON COLUMN clients.target_customer_profile IS 'Description of the ideal customer profile';
COMMENT ON COLUMN clients.avg_response_time_goal IS 'Target average response time goal';
COMMENT ON COLUMN clients.competitive_behavior IS 'Competitive behavior and market positioning';
COMMENT ON COLUMN clients.seasonal_patterns IS 'Seasonal patterns and business cycles';

