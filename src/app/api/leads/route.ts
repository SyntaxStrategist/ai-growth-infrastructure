import { NextRequest } from "next/server";
import { getRecentLeads } from "../../../lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // Optional: Add authentication check here in production
    // For now, we'll return leads with basic security
    
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Fetch recent leads from Supabase
    const { data: leads, total } = await getRecentLeads(Math.min(limit, 100), offset);

    return new Response(
      JSON.stringify({
        success: true,
        data: leads,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + leads.length < total,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch leads";
    console.error("leads_fetch_error", error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const runtime = "nodejs";

