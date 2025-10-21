-- ============================================
-- Queue Jobs Table - Background Job Processing
-- ============================================

-- Create queue_jobs table
CREATE TABLE IF NOT EXISTS queue_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payload JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT queue_jobs_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_queue_jobs_status ON queue_jobs(status);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_job_type ON queue_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_created_at ON queue_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_status_created ON queue_jobs(status, created_at);

-- Add comment
COMMENT ON TABLE queue_jobs IS 'Background job queue for long-running operations';
COMMENT ON COLUMN queue_jobs.job_type IS 'Type of job (e.g., daily_prospect_queue)';
COMMENT ON COLUMN queue_jobs.status IS 'Current status: pending, processing, completed, failed';
COMMENT ON COLUMN queue_jobs.payload IS 'Input data for the job';
COMMENT ON COLUMN queue_jobs.result IS 'Output data after job completion';
COMMENT ON COLUMN queue_jobs.error IS 'Error message if job failed';

