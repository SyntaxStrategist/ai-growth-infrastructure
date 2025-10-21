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
import { enqueueJob, getJobStatus } from '../../../../lib/queue-manager';

// Fast response - no heavy processing
export const runtime = 'nodejs';
export const maxDuration = 10; // 10 seconds (just for enqueuing)

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

    // Trigger the worker endpoint asynchronously (fire and forget)
    const workerUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', '') || 'https://www.aveniraisolutions.ca'}/api/worker/daily-prospect-queue`;
    
    console.log('[DailyCron] 🚀 Triggering background worker...');
    
    // Fire and forget - don't wait for worker to complete
    fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Triggered-By': 'cron',
        'X-Job-Id': jobId
      }
    }).catch(err => {
      console.error('[DailyCron] ⚠️ Failed to trigger worker (non-blocking):', err.message);
    });

    const executionTime = Date.now() - startTime;
    
    console.log('[DailyCron] ✅ Cron job completed (job enqueued)');
    console.log('[DailyCron] Execution time:', executionTime, 'ms');
    console.log('[DailyCron] Job ID:', jobId);
    console.log('[DailyCron] Worker will process in background (max 5 minutes)');
    console.log('[DailyCron] ============================================');

    return NextResponse.json({
      success: true,
      message: 'Daily prospect queue job enqueued successfully',
      jobId,
      workerUrl: '/api/worker/daily-prospect-queue',
      meta: {
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString(),
        note: 'Background worker will process this job (check worker logs for progress)'
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('[DailyCron] ❌ Failed to enqueue job after', executionTime, 'ms');
    console.error('[DailyCron] Error:', error);
    console.error('[DailyCron] Stack:', error instanceof Error ? error.stack : 'N/A');
    
    if (handleApiError) {
      return handleApiError(error, 'DailyCron');
    } else {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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

    // Trigger worker
    const workerUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', '') || 'https://www.aveniraisolutions.ca'}/api/worker/daily-prospect-queue`;
    
    console.log('[DailyCron] 🚀 Triggering background worker...');
    fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Triggered-By': 'manual',
        'X-Job-Id': newJobId
      }
    }).catch(err => {
      console.error('[DailyCron] ⚠️ Failed to trigger worker:', err.message);
    });

    console.log('[DailyCron] ✅ Manual trigger completed');
    console.log('[DailyCron] ============================================');
    
    return NextResponse.json({
      success: true,
      message: 'Job enqueued successfully',
      jobId: newJobId,
      statusUrl: `/api/cron/daily-prospect-queue?jobId=${newJobId}`,
      meta: {
        trigger: 'manual',
        timestamp: new Date().toISOString()
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
