-- ============================================
-- Add missing_email flag to outreach_emails
-- ============================================
-- Purpose: Track prospects that need manual email input in Outreach Center
-- Date: October 21, 2025

-- Add missing_email column
ALTER TABLE outreach_emails 
ADD COLUMN IF NOT EXISTS missing_email BOOLEAN DEFAULT FALSE;

-- Add index for quick filtering
CREATE INDEX IF NOT EXISTS idx_outreach_emails_missing_email 
ON outreach_emails(missing_email) 
WHERE missing_email = true;

-- Make prospect_email nullable (if not already)
ALTER TABLE outreach_emails 
ALTER COLUMN prospect_email DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN outreach_emails.missing_email IS 'Indicates prospect needs manual email input in Outreach Center';

-- Add sender_email column for manual selection
ALTER TABLE outreach_emails
ADD COLUMN IF NOT EXISTS sender_email TEXT;

COMMENT ON COLUMN outreach_emails.sender_email IS 'The from-address selected for sending this email';

-- Add website column for reference
ALTER TABLE outreach_emails
ADD COLUMN IF NOT EXISTS website TEXT;

COMMENT ON COLUMN outreach_emails.website IS 'Prospect company website for reference in Outreach Center';

