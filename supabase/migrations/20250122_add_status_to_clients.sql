-- Add status column to clients table for admin approval workflow
-- Status values: 'pending_approval', 'active', 'rejected'

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_approval' 
  CONSTRAINT clients_status_check 
  CHECK (status IN ('pending_approval', 'active', 'rejected'));

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Set existing clients to 'active' status
UPDATE clients SET status = 'active' WHERE status IS NULL OR status = '';

-- Add comment
COMMENT ON COLUMN clients.status IS 'Account approval status: pending_approval, active, or rejected';
