import { NextRequest, NextResponse } from "next/server";
import { runWeeklyAnalysis } from "../../../../lib/intelligence-engine";

import { handleApiError } from '../../../../lib/error-handler';
/**
 * GET /api/intelligence-engine/cron
 * Vercel Cron Job endpoint - runs daily at 03:00 UTC
 * Automatically refreshes intelligence for all clients
 */
export async function GET(req: NextRequest) {
  try {
    // Verify this is a Vercel Cron request
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('[Scheduler] ❌ Unauthorized request - invalid cron secret');
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('[Scheduler] ============================================');
    console.log('[Scheduler] Running intelligence engine automatically (cron)');
    console.log('[Scheduler] Date:', new Date().toISOString());
    console.log('[Scheduler] Trigger: Vercel Cron Job (daily 03:00 UTC)');
    console.log('[Scheduler] ============================================');

    const result = await runWeeklyAnalysis();

    console.log('[Scheduler] ============================================');
    console.log('[Scheduler] ✅ Intelligence engine run complete');
    console.log('[Scheduler] Results:', {
      processed: result.processed,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
    console.log('[Scheduler] Analytics refreshed for:');
    console.log('[Scheduler]   - Global analytics (admin dashboard)');
    console.log('[Scheduler]   - Per-client analytics (client dashboards)');
    console.log('[Scheduler] ============================================');

    return NextResponse.json({
      success: true,
      data: result,
      message: `Cron job completed: Processed ${result.processed} analyses with ${result.errors} errors`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Scheduler] ❌ Cron job failed:', error);
    console.error('[Scheduler] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack',
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Cron job failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

