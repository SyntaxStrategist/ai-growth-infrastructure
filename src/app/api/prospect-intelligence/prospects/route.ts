// ============================================
// Prospect Intelligence Data API
// Fetch prospects from Supabase
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  console.log('[ProspectDataAPI] ============================================');
  console.log('[ProspectDataAPI] Fetching prospects from Supabase');

  try {
    // Use service role key for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Fetch all prospects
    const { data: prospects, error: prospectsError } = await supabase
      .from('prospect_candidates')
      .select('*')
      .order('automation_need_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (prospectsError) {
      console.error('[ProspectDataAPI] ❌ Prospects fetch error:', prospectsError);
      throw prospectsError;
    }

    // Calculate metrics
    const totalCrawled = prospects?.length || 0;
    const totalTested = prospects?.filter(p => p.last_tested).length || 0;
    const totalScored = prospects?.filter(p => p.automation_need_score !== null && p.automation_need_score > 0).length || 0;
    const totalContacted = prospects?.filter(p => p.contacted === true).length || 0;
    const highPriorityCount = prospects?.filter(p => (p.automation_need_score || 0) >= 70).length || 0;

    console.log('[ProspectDataAPI] ✅ Prospects loaded');
    console.log('[ProspectDataAPI] Total:', totalCrawled);
    console.log('[ProspectDataAPI] Tested:', totalTested);
    console.log('[ProspectDataAPI] Scored:', totalScored);
    console.log('[ProspectDataAPI] Contacted:', totalContacted);
    console.log('[ProspectDataAPI] High-Priority:', highPriorityCount);

    return NextResponse.json({
      success: true,
      data: {
        prospects: prospects || [],
        metrics: {
          totalCrawled,
          totalTested,
          totalScored,
          totalContacted,
          highPriorityCount
        }
      }
    });

  } catch (error) {
    console.error('[ProspectDataAPI] ❌ Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch prospects'
      },
      { status: 500 }
    );
  }
}

