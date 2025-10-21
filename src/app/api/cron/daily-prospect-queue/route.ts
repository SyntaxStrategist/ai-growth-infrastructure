// ============================================
// Daily Prospect Queue Cron Job (Background Queue Version)
// Runs at 8 AM Eastern (12 PM UTC) to queue prospects for outreach
// Schedule: 0 12 * * * (handles both EST and EDT)
// 
// NEW: This endpoint now enqueues a background job instead of running directly
// Worker endpoint: /api/worker/daily-prospect-queue
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '../../../../lib/error-handler';
import { enqueueJob, getJobStatus, markJobAsProcessing, markJobAsCompleted, markJobAsFailed } from '../../../../lib/queue-manager';
import { runDailyProspectQueue } from '../../../../lib/daily-prospect-queue';

// Executes the full prospect pipeline directly
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds (executes pipeline directly)

// Health check endpoint
export async function HEAD(req: NextRequest) {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'X-Cron-Status': 'active',
      'X-Queue-Based': 'true',
      'X-Last-Check': new Date().toISOString()
    }
  });
}

/**
 * POST - Vercel Cron trigger endpoint
 * Enqueues a background job and triggers the worker
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  console.log('[DailyCron] ============================================');
  console.log('[DailyCron] 🚀 CRON JOB TRIGGERED');
  console.log('[DailyCron] Timestamp:', new Date().toISOString());
  console.log('[DailyCron] Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  console.log('[DailyCron] Request method:', req.method);
  console.log('[DailyCron] User-Agent:', req.headers.get('user-agent'));
  console.log('[DailyCron] ============================================');

  try {
    // Verify this is a legitimate cron request (optional security check)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    console.log('[DailyCron] Auth check:', {
      hasCronSecret: !!cronSecret,
      hasAuthHeader: !!authHeader,
      authMatches: cronSecret ? authHeader === `Bearer ${cronSecret}` : 'N/A (no secret set)'
    });
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('[DailyCron] ⚠️ Unauthorized cron request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[DailyCron] ✅ Auth check passed');

    // Enqueue background job
    console.log('[DailyCron] 📝 Enqueueing daily prospect queue job...');
    const enqueueResult = await enqueueJob('daily_prospect_queue', {
      triggeredBy: 'cron',
      triggeredAt: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    if (!enqueueResult.success) {
      throw new Error(`Failed to enqueue job: ${enqueueResult.error}`);
    }

    const jobId = enqueueResult.jobId;
    console.log(`[DailyCron] ✅ Job enqueued: ${jobId}`);

    // Mark job as processing
    console.log('[DailyCron] 🔄 Marking job as processing...');
    const marked = await markJobAsProcessing(jobId);
    if (!marked) {
      throw new Error('Failed to mark job as processing');
    }

    // Execute daily prospect queue directly (no HTTP fetch needed)
    console.log('[DailyCron] 🚀 Executing daily prospect queue directly...');
    console.log('[DailyCron] ============================================\n');
    
    const result = await runDailyProspectQueue();
    
    console.log('\n[DailyCron] ============================================');
    console.log('[DailyCron] ✅ Daily prospect queue completed');
    console.log('[DailyCron] Results:', {
      prospectsDiscovered: result.prospectsDiscovered,
      prospectsQueued: result.prospectsQueued,
      emailsGenerated: result.emailsGenerated,
      errors: result.errors.length
    });

    // Mark job as completed
    await markJobAsCompleted(jobId, {
      prospectsDiscovered: result.prospectsDiscovered,
      prospectsScored: result.prospectsScored,
      prospectsQueued: result.prospectsQueued,
      emailsGenerated: result.emailsGenerated,
      dailyLimit: result.dailyLimit,
      errors: result.errors,
      executionTime: result.executionTime
    });

    console.log('[DailyCron] ✅ Job marked as completed');

    const executionTime = Date.now() - startTime;
    
    console.log('[DailyCron] ✅ Cron job completed successfully');
    console.log('[DailyCron] Total execution time:', executionTime, 'ms');
    console.log('[DailyCron] Job ID:', jobId);
    console.log('[DailyCron] ============================================');

    return NextResponse.json({
      success: true,
      message: 'Daily prospect queue job completed successfully',
      jobId,
      data: result,
      meta: {
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString(),
        note: 'Executed directly (no HTTP fetch)'
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('[DailyCron] ❌ Job execution failed after', executionTime, 'ms');
    console.error('[DailyCron] Error:', errorMessage);
    console.error('[DailyCron] Stack:', error instanceof Error ? error.stack : 'N/A');
    
    // Try to mark job as failed if we have a job ID
    try {
      // Extract jobId from scope if available
      const failedJobId = (error as any).jobId;
      if (failedJobId) {
        await markJobAsFailed(failedJobId, errorMessage);
        console.log('[DailyCron] ✅ Job marked as failed');
      }
    } catch (markError) {
      console.error('[DailyCron] Failed to mark job as failed:', markError);
    }
    
    if (handleApiError) {
      return handleApiError(error, 'DailyCron');
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
 * GET - Manual trigger for testing
 * Check job status by providing jobId query param
 */
export async function GET(req: NextRequest) {
  console.log('[DailyCron] ============================================');
  console.log('[DailyCron] 🔧 MANUAL TRIGGER/STATUS CHECK requested');
  console.log('[DailyCron] Timestamp:', new Date().toISOString());
  console.log('[DailyCron] ============================================');
  
  try {
    // Check if this is a status check (has jobId param)
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      // Status check
      console.log('[DailyCron] 📊 Checking status for job:', jobId);
      const jobStatus = await getJobStatus(jobId);
      
      if (!jobStatus) {
        return NextResponse.json({
          success: false,
          error: 'Job not found'
        }, { status: 404 });
      }

      console.log('[DailyCron] Job status:', jobStatus.status);
      return NextResponse.json({
        success: true,
        job: jobStatus,
        timestamp: new Date().toISOString()
      });
    }

    // Manual trigger - enqueue a new job
    console.log('[DailyCron] 📝 Manually enqueueing job...');
    const enqueueResult = await enqueueJob('daily_prospect_queue', {
      triggeredBy: 'manual',
      triggeredAt: new Date().toISOString()
    });

    if (!enqueueResult.success) {
      throw new Error(`Failed to enqueue job: ${enqueueResult.error}`);
    }

    const newJobId = enqueueResult.jobId;
    console.log(`[DailyCron] ✅ Job enqueued: ${newJobId}`);

    // Mark job as processing
    console.log('[DailyCron] 🔄 Marking job as processing...');
    const marked = await markJobAsProcessing(newJobId);
    if (!marked) {
      throw new Error('Failed to mark job as processing');
    }

    // Execute daily prospect queue directly (no HTTP fetch needed)
    console.log('[DailyCron] 🚀 Executing daily prospect queue directly...');
    console.log('[DailyCron] ============================================\n');
    
    const result = await runDailyProspectQueue();
    
    console.log('\n[DailyCron] ============================================');
    console.log('[DailyCron] ✅ Daily prospect queue completed');
    console.log('[DailyCron] Results:', {
      prospectsDiscovered: result.prospectsDiscovered,
      prospectsQueued: result.prospectsQueued,
      emailsGenerated: result.emailsGenerated,
      errors: result.errors.length
    });

    // Mark job as completed
    await markJobAsCompleted(newJobId, {
      prospectsDiscovered: result.prospectsDiscovered,
      prospectsScored: result.prospectsScored,
      prospectsQueued: result.prospectsQueued,
      emailsGenerated: result.emailsGenerated,
      dailyLimit: result.dailyLimit,
      errors: result.errors,
      executionTime: result.executionTime
    });

    console.log('[DailyCron] ✅ Job marked as completed');

    console.log('[DailyCron] ✅ Manual trigger completed');
    console.log('[DailyCron] ============================================');
    
    return NextResponse.json({
      success: true,
      message: 'Job completed successfully',
      jobId: newJobId,
      data: result,
      meta: {
        trigger: 'manual',
        timestamp: new Date().toISOString(),
        note: 'Executed directly (no HTTP fetch)'
      }
    });
  } catch (error) {
    console.error('[DailyCron] ❌ Manual trigger failed:', error);
    
    if (handleApiError) {
      return handleApiError(error, 'DailyCron');
    } else {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
}
