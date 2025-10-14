import { NextRequest, NextResponse } from "next/server";
import { runWeeklyAnalysis } from "../../../lib/intelligence-engine";

/**
 * POST /api/intelligence-engine
 * Trigger weekly intelligence analysis
 * This endpoint should be called by a cron job (e.g., Vercel Cron)
 */
export async function POST(req: NextRequest) {
  try {
    // Optional: Add authorization header check for cron jobs
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('[Intelligence Engine] Unauthorized request');
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('[Intelligence Engine] Starting weekly analysis...');
    
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

