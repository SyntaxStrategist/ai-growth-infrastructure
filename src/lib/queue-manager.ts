// ============================================
// Queue Manager - Background Job Processing
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface QueueJob {
  id: string;
  job_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payload: Record<string, any>;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
  result?: Record<string, any>;
}

/**
 * Enqueue a new background job
 */
export async function enqueueJob(
  jobType: string,
  payload: Record<string, any>
): Promise<{ jobId: string; success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('queue_jobs')
      .insert([{
        job_type: jobType,
        status: 'pending',
        payload,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('[QueueManager] Failed to enqueue job:', error);
      return { jobId: '', success: false, error: error.message };
    }

    console.log(`[QueueManager] ✅ Job enqueued: ${data.id} (${jobType})`);
    return { jobId: data.id, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[QueueManager] Error enqueueing job:', message);
    return { jobId: '', success: false, error: message };
  }
}

/**
 * Get next pending job
 */
export async function getNextPendingJob(jobType?: string): Promise<QueueJob | null> {
  try {
    let query = supabase
      .from('queue_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);

    if (jobType) {
      query = query.eq('job_type', jobType);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - no pending jobs
        return null;
      }
      console.error('[QueueManager] Error fetching job:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[QueueManager] Error fetching job:', error);
    return null;
  }
}

/**
 * Mark job as processing
 */
export async function markJobAsProcessing(jobId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('queue_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (error) {
      console.error('[QueueManager] Failed to mark job as processing:', error);
      return false;
    }

    console.log(`[QueueManager] Job ${jobId} marked as processing`);
    return true;
  } catch (error) {
    console.error('[QueueManager] Error updating job status:', error);
    return false;
  }
}

/**
 * Mark job as completed
 */
export async function markJobAsCompleted(
  jobId: string,
  result: Record<string, any>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('queue_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result
      })
      .eq('id', jobId);

    if (error) {
      console.error('[QueueManager] Failed to mark job as completed:', error);
      return false;
    }

    console.log(`[QueueManager] ✅ Job ${jobId} completed`);
    return true;
  } catch (error) {
    console.error('[QueueManager] Error marking job as completed:', error);
    return false;
  }
}

/**
 * Mark job as failed
 */
export async function markJobAsFailed(
  jobId: string,
  errorMessage: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('queue_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error: errorMessage
      })
      .eq('id', jobId);

    if (error) {
      console.error('[QueueManager] Failed to mark job as failed:', error);
      return false;
    }

    console.log(`[QueueManager] ❌ Job ${jobId} failed: ${errorMessage}`);
    return true;
  } catch (error) {
    console.error('[QueueManager] Error marking job as failed:', error);
    return false;
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<QueueJob | null> {
  try {
    const { data, error } = await supabase
      .from('queue_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('[QueueManager] Failed to get job status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[QueueManager] Error getting job status:', error);
    return null;
  }
}

/**
 * Clean up old completed/failed jobs (older than 7 days)
 */
export async function cleanupOldJobs(): Promise<number> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('queue_jobs')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('created_at', sevenDaysAgo.toISOString())
      .select();

    if (error) {
      console.error('[QueueManager] Failed to cleanup old jobs:', error);
      return 0;
    }

    const count = data?.length || 0;
    console.log(`[QueueManager] 🧹 Cleaned up ${count} old jobs`);
    return count;
  } catch (error) {
    console.error('[QueueManager] Error cleaning up old jobs:', error);
    return 0;
  }
}

