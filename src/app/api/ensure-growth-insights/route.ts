import { NextRequest, NextResponse } from "next/server";
import { ensureGrowthInsightsForClient, ensureGrowthInsightsForAllClients } from "../../../lib/auto-intelligence-trigger";
import { handleApiError } from '../../../lib/error-handler';

/**
 * POST /api/ensure-growth-insights
 * Ensure growth insights exist for a specific client or all clients
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { client_id, all_clients } = body;

    console.log('[EnsureGrowthInsights] ============================================');
    console.log('[EnsureGrowthInsights] Request received:', { client_id, all_clients });
    console.log('[EnsureGrowthInsights] ============================================');

    if (all_clients) {
      // Ensure growth insights for all clients
      console.log('[EnsureGrowthInsights] Processing all clients...');
      const result = await ensureGrowthInsightsForAllClients();

      return NextResponse.json({
        success: true,
        data: result,
        message: `Processed ${result.processed} clients with ${result.errors} errors`,
      });
    } else if (client_id) {
      // Ensure growth insights for specific client
      console.log('[EnsureGrowthInsights] Processing client:', client_id);
      const success = await ensureGrowthInsightsForClient(client_id);

      return NextResponse.json({
        success,
        data: { client_id, success },
        message: success 
          ? `Growth insights ensured for client ${client_id}`
          : `Failed to ensure growth insights for client ${client_id}`,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Missing client_id or all_clients parameter',
      }, { status: 400 });
    }
  } catch (error) {
    return handleApiError(error, 'API');
  }
}

/**
 * GET /api/ensure-growth-insights
 * Manual trigger for ensuring growth insights
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');

    console.log('[EnsureGrowthInsights] Manual trigger:', { client_id: clientId });

    if (clientId) {
      const success = await ensureGrowthInsightsForClient(clientId);
      return NextResponse.json({
        success,
        data: { client_id: clientId, success },
        message: success 
          ? `Growth insights ensured for client ${clientId}`
          : `Failed to ensure growth insights for client ${clientId}`,
      });
    } else {
      const result = await ensureGrowthInsightsForAllClients();
      return NextResponse.json({
        success: true,
        data: result,
        message: `Processed ${result.processed} clients with ${result.errors} errors`,
      });
    }
  } catch (error) {
    return handleApiError(error, 'API');
  }
}
