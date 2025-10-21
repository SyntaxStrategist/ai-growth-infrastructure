-- ============================================
-- Cleanup Old Queue Jobs
-- Run this in Supabase SQL Editor to clean up test jobs
-- ============================================

-- 1. Delete old completed/failed jobs (older than 1 day)
DELETE FROM queue_jobs 
WHERE status IN ('completed', 'failed')
AND created_at < NOW() - INTERVAL '1 day';

-- 2. Mark stuck jobs as failed (pending for over 1 hour)
UPDATE queue_jobs 
SET 
  status = 'failed',
  error = 'Job stuck in pending status - marked as failed for cleanup',
  completed_at = NOW()
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '1 hour';

-- 3. Show remaining jobs
SELECT 
  id,
  job_type,
  status,
  created_at,
  started_at,
  completed_at,
  error
FROM queue_jobs 
ORDER BY created_at DESC
LIMIT 10;

-- Expected: Should see clean queue with only recent jobs

