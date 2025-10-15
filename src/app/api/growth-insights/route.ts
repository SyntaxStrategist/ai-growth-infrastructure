/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// GET /api/growth-insights - Fetch latest growth_brain insights
export async function GET(req: NextRequest) {
  try {
    console.log('[GrowthInsightsAPI] ============================================');
    console.log('[GrowthInsightsAPI] Starting growth insights fetch...');
    console.log('[GrowthInsightsAPI] ============================================');

    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('[GrowthInsightsAPI] Environment check:', {
      hasUrl: !!supabaseUrl,
      urlValue: supabaseUrl || 'MISSING',
      hasServiceKey: !!supabaseKey,
      serviceKeyLength: supabaseKey?.length || 0,
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('[GrowthInsightsAPI] ❌ Missing Supabase credentials');
      console.error('[GrowthInsightsAPI] SUPABASE_URL:', supabaseUrl ? 'present' : 'MISSING');
      console.error('[GrowthInsightsAPI] SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'present' : 'MISSING');
      
      return NextResponse.json({
        success: false,
        error: 'Supabase credentials not configured',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseKey,
        }
      }, { status: 500 });
    }

    // Create Supabase client with service role
    console.log('[GrowthInsightsAPI] Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');

    console.log('[GrowthInsightsAPI] Fetching latest insights, client_id:', clientId || 'global');

    let query = supabase
      .from('growth_brain')
      .select('*')
      .order('analyzed_at', { ascending: false })
      .limit(1);

    if (clientId) {
      console.log('[GrowthInsightsAPI] Filtering for specific client:', clientId);
      query = query.eq('client_id', clientId);
    } else {
      // For global insights, look for records where client_id IS NULL
      console.log('[GrowthInsightsAPI] Filtering for global insights (client_id IS NULL)');
      query = query.is('client_id', null);
    }

    console.log('[GrowthInsightsAPI] Executing Supabase query...');
    const queryStart = Date.now();
    const { data, error } = await query;
    const queryDuration = Date.now() - queryStart;

    console.log('[GrowthInsightsAPI] Query completed in', queryDuration, 'ms');
    console.log('[GrowthInsightsAPI] Query result:', {
      found: data?.length || 0,
      hasError: !!error,
    });

    if (error) {
      console.error('[GrowthInsightsAPI] ❌ Supabase query failed');
      console.error('[GrowthInsightsAPI] Error code:', error.code);
      console.error('[GrowthInsightsAPI] Error message:', error.message);
      console.error('[GrowthInsightsAPI] Error details:', error.details);
      console.error('[GrowthInsightsAPI] Error hint:', error.hint);
      console.error('[GrowthInsightsAPI] Full error object:', JSON.stringify(error, null, 2));
      
      return NextResponse.json({
        success: false,
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
      }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log('[GrowthInsightsAPI] No insights found - growth_brain table is empty or no matching records');
      console.log('[GrowthInsightsAPI] Query filters:', {
        client_id: clientId || 'IS NULL',
        order: 'analyzed_at DESC',
        limit: 1,
      });
      
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: 'No growth insights available yet. Run /api/intelligence-engine first.' 
      });
    }

    const insight = data[0];
    
    console.log('[GrowthInsightsAPI] ✅ Found insight record');
    console.log('[GrowthInsightsAPI] Record ID:', insight.id);
    console.log('[GrowthInsightsAPI] Client ID:', insight.client_id || 'global');
    console.log('[GrowthInsightsAPI] Total leads:', insight.total_leads);
    console.log('[GrowthInsightsAPI] Engagement score:', insight.engagement_score);
    console.log('[GrowthInsightsAPI] Analyzed at:', insight.analyzed_at);
    console.log('[GrowthInsightsAPI] Has predictive_insights:', !!insight.predictive_insights);
    
    if (insight.predictive_insights) {
      console.log('[GrowthInsightsAPI] Predictive insights structure:', {
        has_en: !!insight.predictive_insights.en,
        has_fr: !!insight.predictive_insights.fr,
        en_keys: insight.predictive_insights.en ? Object.keys(insight.predictive_insights.en) : [],
        fr_keys: insight.predictive_insights.fr ? Object.keys(insight.predictive_insights.fr) : [],
      });
    }

    console.log('[GrowthInsightsAPI] ============================================');
    console.log('[GrowthInsightsAPI] ✅ Returning insight data');
    console.log('[GrowthInsightsAPI] ============================================');

    return NextResponse.json({ success: true, data: insight });
    
  } catch (error: any) {
    console.error('[GrowthInsightsAPI] ============================================');
    console.error('[GrowthInsightsAPI] ❌ CRITICAL ERROR');
    console.error('[GrowthInsightsAPI] ============================================');
    console.error('[GrowthInsightsAPI] Error type:', error?.constructor?.name || typeof error);
    console.error('[GrowthInsightsAPI] Error message:', error?.message || String(error));
    console.error('[GrowthInsightsAPI] Error stack:', error?.stack || 'N/A');
    console.error('[GrowthInsightsAPI] ============================================');
    
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Internal Server Error",
        errorType: error?.constructor?.name || 'Unknown',
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
}
