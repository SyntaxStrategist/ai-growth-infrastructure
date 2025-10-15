import { NextRequest, NextResponse } from "next/server";
import { runWeeklyAnalysis } from "../../../lib/intelligence-engine";

/**
 * POST /api/intelligence-engine
 * Trigger weekly intelligence analysis
 * This endpoint should be called by a cron job (e.g., Vercel Cron)
 */
export async function POST(req: NextRequest) {
  try {
    // Check if triggered by Vercel Cron
    const isCron = req.headers.get('user-agent')?.includes('vercel-cron');
    const triggerSource = isCron ? 'CRON (Vercel)' : 'Manual (User/API)';
    
    console.log('[Intelligence Engine] ============================================');
    console.log('[Intelligence Engine] Trigger source:', triggerSource);
    console.log('[Intelligence Engine] ============================================');

    // Optional: Add authorization header check for manual requests
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    // Skip auth check for Vercel Cron or if auth header matches
    if (!isCron && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      console.log('[Intelligence Engine] Unauthorized manual request');
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('[Intelligence Engine] Starting weekly analysis...');
    
    const result = await runWeeklyAnalysis();

    console.log('[Intelligence Engine] Analysis complete:', {
      processed: result.processed,
      errors: result.errors,
      trigger: triggerSource,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Processed ${result.processed} analyses with ${result.errors} errors`,
      trigger: triggerSource,
    });
  } catch (error) {
    console.error('[Intelligence Engine] Analysis failed:', error);
    return NextResponse.json(
      { success: false, error: "Analysis failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/intelligence-engine
 * Manual trigger for testing (admin only)
 */
export async function GET() {
  try {
    console.log('[Intelligence Engine] Manual trigger - starting analysis...');
    
    const result = await runWeeklyAnalysis();

    return NextResponse.json({
      success: true,
      data: result,
      message: `Processed ${result.processed} analyses with ${result.errors} errors`,
    });
  } catch (error) {
    console.error('[Intelligence Engine] Analysis failed:', error);
    return NextResponse.json(
      { success: false, error: "Analysis failed" },
      { status: 500 }
    );
  }
}

