/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

import { handleApiError } from '../../../lib/error-handler';
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
    const publicClientId = url.searchParams.get('client_id');

    console.log('[GrowthInsightsAPI] Fetching latest insights, public client_id:', publicClientId || 'global');

    let internalClientId = null;

    if (publicClientId) {
      console.log('[GrowthInsightsAPI] Resolving public client_id to internal UUID...');
      
      // Look up the internal UUID for the public client_id
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('client_id', publicClientId)
        .single();

      if (clientError) {
        console.error('[GrowthInsightsAPI] ❌ Failed to resolve client_id:', clientError);
        console.error('[GrowthInsightsAPI] Client error details:', JSON.stringify(clientError, null, 2));
        
        return NextResponse.json({
          success: false,
          error: 'Client not found',
          errorCode: clientError.code,
          errorDetails: clientError.details,
          publicClientId: publicClientId,
        }, { status: 404 });
      }

      if (!client) {
        console.error('[GrowthInsightsAPI] ❌ No client found for public client_id:', publicClientId);
        
        return NextResponse.json({
          success: false,
          error: 'Client not found',
          publicClientId: publicClientId,
        }, { status: 404 });
      }

      internalClientId = client.id;
      console.log('[GrowthInsightsAPI] ✅ Resolved client_id:', {
        public: publicClientId,
        internal: internalClientId,
      });
    }

    let query = supabase
      .from('growth_brain')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (publicClientId) {
      // Query with PUBLIC client_id (not UUID) because that's what's stored in growth_brain
      console.log('[GrowthInsightsAPI] Filtering for specific client (public ID):', publicClientId);
      query = query.eq('client_id', publicClientId);
    } else {
      // For global insights, look for records where client_id IS NULL
      console.log('[GrowthInsightsAPI] Filtering for global insights (client_id IS NULL)');
      query = query.is('client_id', null);
    }

    console.log('[GrowthInsightsAPI] Executing Supabase query (ORDER BY created_at DESC)...');
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
        client_id_filter: publicClientId || 'IS NULL (global)',
        order: 'created_at DESC',
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
    console.log('[GrowthInsightsAPI] Public Client ID:', publicClientId || 'N/A');
    console.log('[GrowthInsightsAPI] Internal Client ID:', insight.client_id || 'global');
    console.log('[GrowthInsightsAPI] Total leads:', insight.total_leads);
    console.log('[GrowthInsightsAPI] Engagement score:', insight.engagement_score);
    console.log('[GrowthInsightsAPI] Created at:', insight.created_at);
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
    console.error('[GrowthInsightsAPI] Error code:', error?.code || 'N/A');
    console.error('[GrowthInsightsAPI] Error details:', error?.details || 'N/A');
    console.error('[GrowthInsightsAPI] Error hint:', error?.hint || 'N/A');
    console.error('[GrowthInsightsAPI] Error stack:', error?.stack || 'N/A');
    console.error('[GrowthInsightsAPI] Full error object:', JSON.stringify(error, null, 2));
    console.error('[GrowthInsightsAPI] ============================================');
    
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Internal Server Error",
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        errorType: error?.constructor?.name || 'Unknown',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
