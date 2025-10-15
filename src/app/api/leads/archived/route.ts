import { NextRequest } from "next/server";
import { getArchivedLeads } from "../../../../lib/supabase";
import { translateAIFields } from "../../../../lib/ai-translation";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const locale = (url.searchParams.get('locale') === 'fr' ? 'fr' : 'en') as 'en' | 'fr';

    console.log(`[ArchivedLeadsAPI] Fetching archived leads, locale=${locale}`);

    // Fetch archived leads from Supabase
    const { data: leads, total } = await getArchivedLeads(Math.min(limit, 100), offset);
    
    // Translate AI fields server-side based on dashboard locale
    const translatedLeads = await Promise.all(
      leads.map(async (lead) => {
        const translated_ai = await translateAIFields({
          ai_summary: lead.ai_summary,
          intent: lead.intent,
          tone: lead.tone,
          urgency: lead.urgency,
        }, locale);
        
        console.log(`[ArchivedLeadsAPI] lead=${lead.id.slice(-12)} | translated to ${locale}`);
        
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
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('[ArchivedLeadsAPI] Error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fetch archived leads',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

