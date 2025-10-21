// ============================================
// Daily Prospect Queue Cron Job
// Runs at 8 AM EST to queue prospects for outreach
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { runDailyProspectQueue } from '../../../../lib/daily-prospect-queue';
import { handleApiError } from '../../../../lib/error-handler';

export async function POST(req: NextRequest) {
  console.log('[DailyQueue] ============================================');
  console.log('[DailyQueue] Daily prospect queue job triggered');
  console.log('[DailyQueue] ============================================');

  try {
    // Verify this is a legitimate cron request (optional security check)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('[DailyQueue] ⚠️ Unauthorized cron request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run the daily prospect queue
    const result = await runDailyProspectQueue();

    console.log('[DailyQueue] ✅ Daily prospect queue completed');
    console.log('[DailyQueue] ============================================');

    return NextResponse.json({
      success: true,
      message: 'Daily prospect queue completed successfully',
      data: result
    });

  } catch (error) {
    console.error('[DailyQueue] ❌ Daily prospect queue failed:', error);
    return handleApiError(error, 'DailyQueue');
  }
}

export async function GET(req: NextRequest) {
  // Allow manual triggering for testing
  console.log('[DailyQueue] Manual trigger requested');
  
  try {
    const result = await runDailyProspectQueue();
    
    return NextResponse.json({
      success: true,
      message: 'Manual prospect queue completed successfully',
      data: result
    });
  } catch (error) {
    return handleApiError(error, 'DailyQueue');
  }
}
