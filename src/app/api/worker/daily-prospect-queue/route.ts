// ============================================
// Background Worker - Daily Prospect Queue
// Processes queued daily prospect discovery jobs
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { runDailyProspectQueue } from '../../../../lib/daily-prospect-queue';
import { handleApiError } from '../../../../lib/error-handler';
import { 
  getNextPendingJob, 
  markJobAsProcessing, 
  markJobAsCompleted, 
  markJobAsFailed 
} from '../../../../lib/queue-manager';

// This is a background worker - allow longer execution time
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes (300 seconds)

/**
 * Background worker endpoint
 * Processes one pending daily prospect queue job
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  console.log('[Worker] ============================================');
  console.log('[Worker] 🔧 BACKGROUND WORKER TRIGGERED');
  console.log('[Worker] Timestamp:', new Date().toISOString());
  console.log('[Worker] Max Duration: 300 seconds');
  console.log('[Worker] ============================================');

  try {
    // Check if specific job ID was provided in headers
    const specificJobId = req.headers.get('X-Job-Id');
    
    let job;
    if (specificJobId) {
      console.log(`[Worker] 🎯 Processing specific job: ${specificJobId}`);
      // Get the specific job by ID
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: jobData, error } = await supabase
        .from('queue_jobs')
        .select('*')
        .eq('id', specificJobId)
        .eq('status', 'pending')
        .single();
      
      if (error || !jobData) {
        console.log(`[Worker] ❌ Specific job not found or not pending: ${specificJobId}`);
        return NextResponse.json({
          success: false,
          error: 'Specific job not found or not pending',
          jobId: specificJobId
        }, { status: 404 });
      }
      
      job = jobData;
    } else {
      // Get next pending job (FIFO)
      console.log('[Worker] 🔍 Checking for pending jobs...');
      job = await getNextPendingJob('daily_prospect_queue');

      if (!job) {
        console.log('[Worker] ℹ️  No pending jobs found');
        return NextResponse.json({
          success: true,
          message: 'No pending jobs to process',
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log(`[Worker] ✅ Found job: ${job.id}`);
    console.log('[Worker] Job details:', {
      id: job.id,
      type: job.job_type,
      created_at: job.created_at,
      payload: job.payload
    });

    // Mark job as processing
    const marked = await markJobAsProcessing(job.id);
    if (!marked) {
      console.error('[Worker] ❌ Failed to mark job as processing');
      return NextResponse.json({
        success: false,
        error: 'Failed to mark job as processing'
      }, { status: 500 });
    }

    console.log('[Worker] 🚀 Starting job execution...');
    console.log('[Worker] ============================================\n');

    // Execute the daily prospect queue
    const result = await runDailyProspectQueue();

    const executionTime = Date.now() - startTime;
    
    console.log('\n[Worker] ============================================');
    console.log('[Worker] ✅ Job execution completed');
    console.log('[Worker] Execution time:', executionTime, 'ms');
    console.log('[Worker] Results:', {
      prospectsDiscovered: result.prospectsDiscovered,
      prospectsQueued: result.prospectsQueued,
      emailsGenerated: result.emailsGenerated,
      errors: result.errors.length
    });

    // Mark job as completed
    await markJobAsCompleted(job.id, {
      prospectsDiscovered: result.prospectsDiscovered,
      prospectsScored: result.prospectsScored,
      prospectsQueued: result.prospectsQueued,
      emailsGenerated: result.emailsGenerated,
      dailyLimit: result.dailyLimit,
      errors: result.errors,
      executionTime: result.executionTime
    });

    console.log('[Worker] ✅ Job marked as completed');
    console.log('[Worker] ============================================');

    return NextResponse.json({
      success: true,
      message: 'Daily prospect queue job completed',
      jobId: job.id,
      data: result,
      meta: {
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('[Worker] ❌ Job execution failed after', executionTime, 'ms');
    console.error('[Worker] Error:', errorMessage);
    console.error('[Worker] Stack:', error instanceof Error ? error.stack : 'N/A');

    // Try to mark job as failed if we have a job ID
    try {
      const job = await getNextPendingJob('daily_prospect_queue');
      if (job) {
        await markJobAsFailed(job.id, errorMessage);
      }
    } catch (markError) {
      console.error('[Worker] Failed to mark job as failed:', markError);
    }

    if (handleApiError) {
      return handleApiError(error, 'DailyQueueWorker');
    } else {
      return NextResponse.json({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  }
}

/**
 * GET endpoint - Check worker status
 */
export async function GET(req: NextRequest) {
  console.log('[Worker] Health check requested');
  
  try {
    // Check for pending jobs
    const pendingJob = await getNextPendingJob('daily_prospect_queue');
    
    return NextResponse.json({
      status: 'active',
      worker: 'daily-prospect-queue',
      maxDuration: 300,
      pendingJobs: pendingJob ? 1 : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

