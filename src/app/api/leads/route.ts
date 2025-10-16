import { NextRequest } from "next/server";
import { getRecentLeads } from "../../../lib/supabase";
import { translateAIFields } from "../../../lib/ai-translation";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const locale = (url.searchParams.get('locale') === 'fr' ? 'fr' : 'en') as 'en' | 'fr';
    const clientId = url.searchParams.get('clientId');

    console.log(`[LeadsAPI] dashboardLocale=${locale}`);
    if (clientId) {
      console.log(`[LeadsAPI] [CommandCenter] Filtering by clientId=${clientId}`);
    }

    // Fetch recent leads from Supabase (with optional client filter)
    const { data: leads, total } = await getRecentLeads(Math.min(limit, 100), offset, clientId || undefined);
    
    // Translate AI fields server-side based on dashboard locale
    const translatedLeads = await Promise.all(
      leads.map(async (lead) => {
        const translated_ai = await translateAIFields({
          ai_summary: lead.ai_summary,
          intent: lead.intent,
          tone: lead.tone,
          urgency: lead.urgency,
        }, locale);
        
        console.log(`[LeadsAPI] lead=${lead.id.slice(-12)} | translated to ${locale}`);
        
        // Return lead with translated_ai object (original fields preserved)
        return {
          ...lead,
          translated_ai,
        };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: translatedLeads,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + translatedLeads.length < total,
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

