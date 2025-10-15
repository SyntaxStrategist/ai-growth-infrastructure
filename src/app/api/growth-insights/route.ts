/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

// GET /api/growth-insights - Fetch latest growth_brain insights
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');

    console.log('[GrowthInsightsAPI] Fetching latest insights, client_id:', clientId || 'global');

    let query = supabase
      .from('growth_brain')
      .select('*')
      .order('analyzed_at', { ascending: false })
      .limit(1);

    if (clientId) {
      query = query.eq('client_id', clientId);
    } else {
      // For global insights, look for records where client_id IS NULL
      query = query.is('client_id', null);
    }

    console.log('[GrowthInsightsAPI] Executing query...');
    const { data, error } = await query;

    console.log('[GrowthInsightsAPI] Query result:', {
      found: data?.length || 0,
      error: error ? JSON.stringify(error) : 'none',
    });

    if (error) {
      console.error('[GrowthInsightsAPI] Failed to fetch growth insights:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('[GrowthInsightsAPI] No insights found - returning null');
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: 'No growth insights available yet' 
      });
    }

    console.log('[GrowthInsightsAPI] ✅ Returning latest insight, ID:', data[0].id);
    console.log('[GrowthInsightsAPI] Insight data:', {
      total_leads: data[0].total_leads,
      engagement_score: data[0].engagement_score,
      analyzed_at: data[0].analyzed_at,
      has_predictive: !!data[0].predictive_insights,
    });

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('[GrowthInsightsAPI] Error fetching growth insights:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
