import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    console.log('[LeadsInsightsAPI] ============================================');
    console.log('[LeadsInsightsAPI] GET /api/leads/insights triggered');
    console.log('[LeadsInsightsAPI] ============================================');

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('[LeadsInsightsAPI] Environment check:', {
      hasUrl: !!supabaseUrl,
      urlValue: supabaseUrl || 'MISSING',
      hasServiceKey: !!supabaseKey,
      serviceKeyLength: supabaseKey?.length || 0,
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('[LeadsInsightsAPI] ❌ Missing Supabase credentials');
      return NextResponse.json({
        success: false,
        error: 'Supabase credentials not configured',
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') || 'en';
    const clientId = url.searchParams.get('clientId');

    console.log('[LeadsInsightsAPI] Query params:', {
      locale,
      clientId: clientId || 'all (admin)',
      table: 'lead_memory',
      columns: 'name, email, tone_history, confidence_history, urgency_history, relationship_insight, last_updated',
      filters: {
        archived: false,
        deleted: false,
        relationship_insight: 'IS NOT NULL',
        ...(clientId ? { client_id: clientId } : {}),
      },
      order: 'last_updated DESC',
      limit: 20,
    });

    console.log('[LeadsInsightsAPI] Executing Supabase query...');
    const queryStart = Date.now();
    
    // If clientId provided, need to join with lead_actions
    let query;
    if (clientId) {
      console.log('[LeadsInsightsAPI] Filtering by client_id:', clientId);
      // Join with lead_actions to get client-specific leads
      const { data: leadActionsData, error: leadActionsError } = await supabase
        .from('lead_actions')
        .select('lead_id')
        .eq('client_id', clientId);
      
      if (leadActionsError) {
        console.error('[LeadsInsightsAPI] Error fetching lead_actions:', leadActionsError);
        throw leadActionsError;
      }
      
      const leadIds = leadActionsData?.map(la => la.lead_id) || [];
      console.log('[LeadsInsightsAPI] Found', leadIds.length, 'leads for client');
      
      if (leadIds.length === 0) {
        console.log('[LeadsInsightsAPI] No leads found for client, returning empty array');
        return NextResponse.json({
          success: true,
          data: [],
          count: 0,
          locale,
        });
      }
      
      query = supabase
        .from('lead_memory')
        .select('name, email, tone_history, confidence_history, urgency_history, relationship_insight, last_updated')
        .in('id', leadIds)
        .eq('archived', false)
        .eq('deleted', false)
        .not('relationship_insight', 'is', null)
        .order('last_updated', { ascending: false })
        .limit(20);
    } else {
      // Admin mode - get all leads
      query = supabase
        .from('lead_memory')
        .select('name, email, tone_history, confidence_history, urgency_history, relationship_insight, last_updated')
        .eq('archived', false)
        .eq('deleted', false)
        .not('relationship_insight', 'is', null)
        .order('last_updated', { ascending: false })
        .limit(20);
    }
    
    const { data, error } = await query;
    const queryDuration = Date.now() - queryStart;

    console.log('[LeadsInsightsAPI] Query completed in', queryDuration, 'ms');
    console.log('[LeadsInsightsAPI] Query result:', {
      success: !error,
      rowCount: data?.length || 0,
      hasError: !!error,
    });

    if (error) {
      console.error('[LeadsInsightsAPI] ============================================');
      console.error('[LeadsInsightsAPI] ❌ Query FAILED');
      console.error('[LeadsInsightsAPI] ============================================');
      console.error('[LeadsInsightsAPI] Error code:', error.code);
      console.error('[LeadsInsightsAPI] Error message:', error.message);
      console.error('[LeadsInsightsAPI] Error details:', error.details);
      console.error('[LeadsInsightsAPI] Error hint:', error.hint);
      console.error('[LeadsInsightsAPI] Full error object:', JSON.stringify(error, null, 2));
      console.error('[LeadsInsightsAPI] ============================================');
      
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log('[LeadsInsightsAPI] ============================================');
      console.log('[LeadsInsightsAPI] ℹ️  No leads with relationship insights found');
      console.log('[LeadsInsightsAPI] ============================================');
      console.log('[LeadsInsightsAPI] This is expected when:');
      console.log('[LeadsInsightsAPI]   - No leads have returned for a second contact');
      console.log('[LeadsInsightsAPI]   - All leads are first-time contacts');
      console.log('[LeadsInsightsAPI]   - relationship_insight is NULL for all leads');
      console.log('[LeadsInsightsAPI] ============================================');
      
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: 'No relationship insights available yet' 
      });
    }

    console.log('[LeadsInsightsAPI] ============================================');
    console.log('[LeadsInsightsAPI] ✅ Found', data.length, 'leads with insights');
    console.log('[LeadsInsightsAPI] ============================================');
    console.log('[LeadsInsightsAPI] Sample data (first lead):');
    if (data[0]) {
      console.log('[LeadsInsightsAPI]   Name:', data[0].name);
      console.log('[LeadsInsightsAPI]   Email:', data[0].email);
      console.log('[LeadsInsightsAPI]   Insight:', data[0].relationship_insight?.substring(0, 80) + '...');
      console.log('[LeadsInsightsAPI]   Last Updated:', data[0].last_updated);
      console.log('[LeadsInsightsAPI]   Tone History Length:', data[0].tone_history?.length || 0);
      console.log('[LeadsInsightsAPI]   Confidence History Length:', data[0].confidence_history?.length || 0);
      console.log('[LeadsInsightsAPI]   Urgency History Length:', data[0].urgency_history?.length || 0);
      
      if (data[0].tone_history && data[0].tone_history.length > 0) {
        console.log('[LeadsInsightsAPI]   Tone History Sample:', data[0].tone_history);
      }
      if (data[0].confidence_history && data[0].confidence_history.length > 0) {
        console.log('[LeadsInsightsAPI]   Confidence History Sample:', data[0].confidence_history);
      }
    }
    
    console.log('[LeadsInsightsAPI] ============================================');
    console.log('[LeadsInsightsAPI] All leads summary:');
    data.forEach((lead: any, idx: number) => {
      console.log(`[LeadsInsightsAPI]   ${idx + 1}. ${lead.name} (${lead.email})`);
      console.log(`[LeadsInsightsAPI]      Insight: ${lead.relationship_insight?.substring(0, 60)}...`);
      console.log(`[LeadsInsightsAPI]      History lengths: tone=${lead.tone_history?.length || 0}, conf=${lead.confidence_history?.length || 0}, urg=${lead.urgency_history?.length || 0}`);
    });
    console.log('[LeadsInsightsAPI] ============================================');

    return NextResponse.json({ success: true, data });
    
  } catch (error: any) {
    console.error('[LeadsInsightsAPI] ============================================');
    console.error('[LeadsInsightsAPI] ❌ CRITICAL ERROR');
    console.error('[LeadsInsightsAPI] ============================================');
    console.error('[LeadsInsightsAPI] Error type:', error?.constructor?.name || typeof error);
    console.error('[LeadsInsightsAPI] Error message:', error?.message || String(error));
    console.error('[LeadsInsightsAPI] Error stack:', error?.stack || 'N/A');
    console.error('[LeadsInsightsAPI] Full error object:', JSON.stringify(error, null, 2));
    console.error('[LeadsInsightsAPI] ============================================');
    
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

