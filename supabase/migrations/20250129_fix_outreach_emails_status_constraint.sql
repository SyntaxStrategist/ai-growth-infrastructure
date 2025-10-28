-- Fix outreach_emails status constraint to include pending, approved, rejected
-- This aligns the database constraint with the Prisma schema

-- Drop the existing constraint
ALTER TABLE outreach_emails DROP CONSTRAINT IF EXISTS outreach_emails_status_check;

-- Add the updated constraint with all valid status values
ALTER TABLE outreach_emails ADD CONSTRAINT outreach_emails_status_check 
CHECK (status IN (
  'draft', 
  'pending', 
  'approved', 
  'rejected', 
  'scheduled', 
  'sent', 
  'delivered', 
  'opened', 
  'replied', 
  'bounced', 
  'unsubscribed', 
  'converted'
));
