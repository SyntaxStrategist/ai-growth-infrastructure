import { NextRequest, NextResponse } from "next/server";
import { getLatestGrowthInsights, getGrowthInsightsHistory } from "../../../lib/intelligence-engine";

/**
 * GET /api/growth-insights?client_id=xxx&history=true
 * Fetch growth brain insights for a client or globally
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');
    const history = url.searchParams.get('history') === 'true';

    if (history) {
      const insights = await getGrowthInsightsHistory(clientId, 10);
      return NextResponse.json({
        success: true,
        data: insights,
      });
    } else {
      const insight = await getLatestGrowthInsights(clientId);
      return NextResponse.json({
        success: true,
        data: insight,
      });
    }
  } catch (error) {
    console.error('[API] Failed to fetch growth insights:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch insights" },
      { status: 500 }
    );
  }
}

