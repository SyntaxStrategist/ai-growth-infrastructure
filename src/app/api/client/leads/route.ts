import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const locale = searchParams.get('locale') || 'en';

    console.log('[E2E-Test] [ClientLeads] ============================================');
    console.log('[E2E-Test] [ClientLeads] Request received');
    console.log('[E2E-Test] [ClientLeads] Client ID:', clientId);
    console.log('[E2E-Test] [ClientLeads] Locale:', locale);

    if (!clientId) {
      console.error('[E2E-Test] [ClientLeads] ❌ Missing clientId parameter');
      return NextResponse.json(
        { success: false, error: 'clientId required' },
        { status: 400 }
      );
    }

    // Fetch leads by joining lead_actions with lead_memory
    // lead_actions.client_id identifies which client owns the lead
    // lead_actions.lead_id links to lead_memory.id
    console.log('[E2E-Test] [ClientLeads] Building query to join lead_actions with lead_memory');
    console.log('[E2E-Test] [ClientLeads] Query: SELECT lead_memory.*, lead_actions.client_id, lead_actions.tag');
    console.log('[E2E-Test] [ClientLeads] JOIN: lead_actions.lead_id = lead_memory.id');
    console.log('[E2E-Test] [ClientLeads] WHERE: lead_actions.client_id = ' + clientId);
    console.log('[E2E-Test] [ClientLeads] AND: lead_memory.deleted = false, archived = false');

    const { data: leadActions, error: actionsError } = await supabase
      .from('lead_actions')
      .select(`
        client_id,
        tag,
        lead_id,
        lead_memory:lead_id (
          id,
          name,
          email,
          message,
          ai_summary,
          language,
          timestamp,
          intent,
          tone,
          urgency,
          confidence_score,
          archived,
          deleted,
          current_tag,
          relationship_insight,
          last_updated
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    console.log('[E2E-Test] [ClientLeads] Query executed');
    console.log('[E2E-Test] [ClientLeads] Supabase response:', {
      hasData: !!leadActions,
      rowCount: leadActions?.length || 0,
      hasError: !!actionsError,
      errorMessage: actionsError?.message || 'none',
      errorCode: actionsError?.code || 'none',
    });

    if (actionsError) {
      console.error('[E2E-Test] [ClientLeads] ❌ Database error:', actionsError);
      console.error('[E2E-Test] [ClientLeads] ❌ Error details:', {
        message: actionsError.message,
        code: actionsError.code,
        hint: actionsError.hint,
        details: actionsError.details,
      });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leads: ' + actionsError.message },
        { status: 500 }
      );
    }

    // Transform the joined data
    const leads = (leadActions || [])
      .filter(action => {
        const leadMemory = Array.isArray(action.lead_memory) ? action.lead_memory[0] : action.lead_memory;
        return leadMemory && !leadMemory.deleted && !leadMemory.archived;
      })
      .map(action => {
        const leadMemory = Array.isArray(action.lead_memory) ? action.lead_memory[0] : action.lead_memory;
        return {
          ...leadMemory,
          client_id: action.client_id,
          action_tag: action.tag,
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log('[E2E-Test] [ClientLeads] ✅ Found', leadActions?.length || 0, 'lead actions for client', clientId);
    console.log('[E2E-Test] [ClientLeads] ✅ Filtered to', leads.length, 'active leads');
    console.log('[E2E-Test] [ClientLeads] ✅ Client-scoped data loaded successfully');
    
    if (leads.length > 0) {
      console.log('[E2E-Test] [ClientLeads] Sample lead:', {
        id: leads[0].id,
        name: leads[0].name,
        email: leads[0].email,
        intent: leads[0].intent,
        client_id: leads[0].client_id,
      });
    }

    return NextResponse.json({
      success: true,
      data: leads,
    });

  } catch (error) {
    console.error('[E2E-Test] [ClientLeads] ❌ Unexpected error:', error);
    console.error('[E2E-Test] [ClientLeads] ❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

