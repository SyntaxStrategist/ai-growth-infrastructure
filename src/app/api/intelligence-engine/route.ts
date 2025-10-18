import { NextRequest, NextResponse } from "next/server";
import { runWeeklyAnalysis, runSimulationAnalysis } from "../../../lib/intelligence-engine";

/**
 * POST /api/intelligence-engine
 * Trigger weekly intelligence analysis
 * This endpoint should be called by a cron job (e.g., Vercel Cron)
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body to check for simulate parameter
    const body = await req.json().catch(() => ({}));
    const { client_id, simulate } = body;
    
    // Check if triggered by Vercel Cron
    const isCron = req.headers.get('user-agent')?.includes('vercel-cron');
    const triggerSource = isCron ? 'CRON (Vercel)' : simulate ? 'Simulation (Demo)' : 'Manual (User/API)';
    
    console.log('[Intelligence Engine] ============================================');
    console.log('[Intelligence Engine] Trigger source:', triggerSource);
    if (simulate) {
      console.log('[Intelligence Engine] Simulation mode for client_id:', client_id);
    }
    console.log('[Intelligence Engine] ============================================');

    // Optional: Add authorization header check for manual requests (skip for simulation)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    // Skip auth check for Vercel Cron, simulation mode, or if auth header matches
    if (!isCron && !simulate && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      console.log('[Intelligence Engine] Unauthorized manual request');
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (simulate && client_id) {
      // Simulation mode: analyze specific client and ensure analytics are inserted
      console.log('[Intelligence Engine] Starting simulation analysis for client:', client_id);
      
      const result = await runSimulationAnalysis(client_id);

      console.log('[Intelligence Engine] Simulation complete:', {
        client_id,
        processed: result.processed,
        errors: result.errors,
        trigger: triggerSource,
      });

      return NextResponse.json({
        success: true,
        data: result,
        message: `Simulation completed for client ${client_id}`,
        trigger: triggerSource,
      });
    } else {
      // Regular weekly analysis
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
    }
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

