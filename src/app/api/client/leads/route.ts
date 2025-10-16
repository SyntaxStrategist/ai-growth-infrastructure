import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const locale = searchParams.get('locale') || 'en';

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId required' },
        { status: 400 }
      );
    }

    console.log('[ClientLeads] Fetching leads for client:', clientId, 'locale:', locale);

    // Fetch leads filtered by client_id
    const { data, error } = await supabase
      .from('lead_memory')
      .select('*')
      .eq('client_id', clientId)
      .eq('deleted', false)
      .eq('archived', false)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[ClientLeads] ❌ Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    console.log('[ClientLeads] ✅ Found', data?.length || 0, 'leads for client', clientId);

    // Translate if needed (server-side)
    // For now, return as-is since the AI already generates in the correct language
    // You could add translation logic here similar to the admin dashboard

    return NextResponse.json({
      success: true,
      data: data || [],
    });

  } catch (error) {
    console.error('[ClientLeads] ❌ Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

