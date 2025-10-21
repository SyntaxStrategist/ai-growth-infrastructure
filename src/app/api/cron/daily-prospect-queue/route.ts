// ============================================
// Daily Prospect Queue Cron Job
// Runs at 8 AM Eastern (12 PM UTC) to queue prospects for outreach
// Schedule: 0 12 * * * (handles both EST and EDT)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { runDailyProspectQueue } from '../../../../lib/daily-prospect-queue';
import { handleApiError } from '../../../../lib/error-handler';

// Health check endpoint
export async function HEAD(req: NextRequest) {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'X-Cron-Status': 'active',
      'X-Last-Check': new Date().toISOString()
    }
  });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  // CRITICAL: Log immediately to confirm function is called
  console.log('[DailyQueue] ============================================');
  console.log('[DailyQueue] 🚀 CRON JOB TRIGGERED');
  console.log('[DailyQueue] Timestamp:', new Date().toISOString());
  console.log('[DailyQueue] Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  console.log('[DailyQueue] Request method:', req.method);
  console.log('[DailyQueue] User-Agent:', req.headers.get('user-agent'));
  console.log('[DailyQueue] ============================================');

  try {
    // Verify this is a legitimate cron request (optional security check)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    console.log('[DailyQueue] Auth check:', {
      hasCronSecret: !!cronSecret,
      hasAuthHeader: !!authHeader,
      authMatches: cronSecret ? authHeader === `Bearer ${cronSecret}` : 'N/A (no secret set)'
    });
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('[DailyQueue] ⚠️ Unauthorized cron request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[DailyQueue] ✅ Auth check passed, running queue...');

    // Run the daily prospect queue
    const result = await runDailyProspectQueue();

    const executionTime = Date.now() - startTime;
    
    console.log('[DailyQueue] ✅ Daily prospect queue completed successfully');
    console.log('[DailyQueue] Execution time:', executionTime, 'ms');
    console.log('[DailyQueue] Results:', {
      discovered: result.prospectsDiscovered,
      queued: result.prospectsQueued,
      errors: result.errors.length
    });
    console.log('[DailyQueue] ============================================');

    return NextResponse.json({
      success: true,
      message: 'Daily prospect queue completed successfully',
      data: result,
      meta: {
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('[DailyQueue] ❌ Daily prospect queue failed after', executionTime, 'ms');
    console.error('[DailyQueue] Error:', error);
    console.error('[DailyQueue] Stack:', error instanceof Error ? error.stack : 'N/A');
    
    if (handleApiError) {
      return handleApiError(error, 'DailyQueue');
    } else {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  }
}

export async function GET(req: NextRequest) {
  // Allow manual triggering for testing (no auth required)
  console.log('[DailyQueue] ============================================');
  console.log('[DailyQueue] 🔧 MANUAL TRIGGER requested');
  console.log('[DailyQueue] Timestamp:', new Date().toISOString());
  console.log('[DailyQueue] ============================================');
  
  try {
    const result = await runDailyProspectQueue();
    
    console.log('[DailyQueue] ✅ Manual trigger completed');
    console.log('[DailyQueue] ============================================');
    
    return NextResponse.json({
      success: true,
      message: 'Manual prospect queue completed successfully',
      data: result,
      meta: {
        trigger: 'manual',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[DailyQueue] ❌ Manual trigger failed:', error);
    
    if (handleApiError) {
      return handleApiError(error, 'DailyQueue');
    } else {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
}

// Explicitly set runtime to nodejs (not edge)
export const runtime = 'nodejs';

// Allow function to run for up to 60 seconds (queue can take time)
export const maxDuration = 60;
