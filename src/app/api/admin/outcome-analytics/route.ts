import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminAuth } from '../../../../lib/auth-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAuthenticated = verifyAdminAuth(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    console.log('[AdminOutcomeAnalytics] Fetching outcome analytics for all clients');

    // Get outcome analytics for all clients
    const { data: analytics, error } = await supabase
      .from('lead_outcome_analytics')
      .select(`
        client_id,
        total_leads,
        contacted_leads,
        meeting_booked_leads,
        client_closed_leads,
        no_sale_leads,
        contact_rate,
        meeting_rate,
        close_rate
      `)
      .order('contact_rate', { ascending: false });

    if (error) {
      console.error('[AdminOutcomeAnalytics] Database query failed:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Get client business names
    const clientIds = analytics?.map(a => a.client_id) || [];
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('client_id, business_name')
      .in('client_id', clientIds);

    if (clientsError) {
      console.error('[AdminOutcomeAnalytics] Client lookup failed:', clientsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch client information' },
        { status: 500 }
      );
    }

    // Merge analytics with client names
    const enrichedAnalytics = analytics?.map(analytic => {
      const client = clients?.find(c => c.client_id === analytic.client_id);
      return {
        ...analytic,
        business_name: client?.business_name || 'Unknown Client'
      };
    }) || [];

    console.log(`[AdminOutcomeAnalytics] ✅ Retrieved analytics for ${enrichedAnalytics.length} clients`);

    return NextResponse.json({
      success: true,
      data: enrichedAnalytics
    });

  } catch (error) {
    console.error('[AdminOutcomeAnalytics] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
