-- ============================================
-- Make prospect_id nullable in outreach_emails table
-- ============================================
-- Reason: Daily prospect queue generates emails before prospects are saved
-- Prospects may not have IDs yet when emails are queued for approval

ALTER TABLE outreach_emails 
ALTER COLUMN prospect_id DROP NOT NULL;

-- Add comment explaining why it's nullable
COMMENT ON COLUMN outreach_emails.prospect_id IS 'Foreign key to prospect_candidates table. Nullable to support email generation before prospect is saved to database.';

