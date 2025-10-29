import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateRequestSize } from '../../../../../lib/security';
import { getClientIdFromRequest } from '../../../../../lib/rls-helper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

export async function POST(request: NextRequest) {
  try {
    // Validate request size
    const sizeValidation = await validateRequestSize(request);
    if (!sizeValidation.valid) {
      return NextResponse.json(
        { success: false, error: sizeValidation.error || 'Request too large' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const { lead_id, outcome_status } = body;

    // Get client_id from query parameters (like other client API routes)
    const url = new URL(request.url);
    const client_id = url.searchParams.get('clientId');

        // Validate required fields (allow null for outcome_status to clear)
        if (!lead_id) {
          return NextResponse.json(
            { success: false, error: 'Missing required field: lead_id' },
            { status: 400 }
          );
        }

    if (!client_id) {
      return NextResponse.json(
        { success: false, error: 'Client ID required' },
        { status: 400 }
      );
    }

        // Validate outcome status (allow null to clear)
        const validOutcomes = ['contacted', 'meeting_booked', 'client_closed', 'no_sale'];
        if (outcome_status !== null && !validOutcomes.includes(outcome_status)) {
          return NextResponse.json(
            { success: false, error: `Invalid outcome_status. Must be one of: ${validOutcomes.join(', ')} or null to clear` },
            { status: 400 }
          );
        }

    console.log(`[OutcomeAPI] Updating lead ${lead_id} outcome to ${outcome_status} for client ${client_id}`);

    // Verify the lead belongs to the client
    const { data: lead, error: leadError } = await supabase
      .from('lead_memory')
      .select('id, client_id, name, email')
      .eq('id', lead_id)
      .eq('client_id', client_id)
      .single();

    if (leadError || !lead) {
      console.error('[OutcomeAPI] Lead not found or access denied:', leadError);
      return NextResponse.json(
        { success: false, error: 'Lead not found or access denied' },
        { status: 404 }
      );
    }

    // Update the lead outcome using the proper outcome tracking columns
    const updateData: any = {
      outcome_status: outcome_status,
      last_updated: new Date().toISOString()
    };

    // Set the appropriate timestamp based on outcome (or clear if null)
    if (outcome_status === null) {
      // Clear all outcome timestamps
      updateData.contacted_at = null;
      updateData.meeting_booked_at = null;
      updateData.client_closed_at = null;
      updateData.no_sale_at = null;
    } else {
      // Set the appropriate timestamp based on outcome
      switch (outcome_status) {
        case 'contacted':
          updateData.contacted_at = new Date().toISOString();
          break;
        case 'meeting_booked':
          updateData.meeting_booked_at = new Date().toISOString();
          break;
        case 'client_closed':
          updateData.client_closed_at = new Date().toISOString();
          break;
        case 'no_sale':
          updateData.no_sale_at = new Date().toISOString();
          break;
      }
    }

    const { data: updateResult, error: updateError } = await supabase
      .from('lead_memory')
      .update(updateData)
      .eq('id', lead_id)
      .eq('client_id', client_id);

    if (updateError) {
      console.error('[OutcomeAPI] Database update failed:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update lead outcome' },
        { status: 500 }
      );
    }

    // Log the action in lead_actions table
    const { error: actionError } = await supabase
      .from('lead_actions')
      .insert({
        lead_id: lead_id,
        client_id: client_id,
        action_type: 'outcome_update',
        tag: outcome_status,
        timestamp: new Date().toISOString()
      });

    if (actionError) {
      console.warn('[OutcomeAPI] Failed to log action (non-critical):', actionError);
    }

    console.log(`[OutcomeAPI] ✅ Successfully updated lead ${lead_id} outcome to ${outcome_status}`);

    return NextResponse.json({
      success: true,
      data: {
        lead_id,
        outcome_status,
        client_id: client_id,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[OutcomeAPI] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get client_id from query parameters (like other client API routes)
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID required' },
        { status: 400 }
      );
    }

    // Get lead ID from URL path parameter
    const leadId = url.pathname.split('/').pop();

    if (leadId) {
      // Get specific lead outcome data
      const { data: lead, error } = await supabase
        .from('lead_memory')
        .select(`
          id,
          name,
          email,
          outcome_status,
          contacted_at,
          meeting_booked_at,
          client_closed_at,
          no_sale_at,
          last_updated
        `)
        .eq('id', leadId)
        .eq('client_id', clientId)
        .single();

      if (error || !lead) {
        return NextResponse.json(
          { success: false, error: 'Lead not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: lead
      });
    } else {
      // Get outcome analytics for the client
      const { data: analytics, error } = await supabase
        .from('lead_outcome_analytics')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (error) {
        console.error('[OutcomeAPI] Analytics query failed:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch analytics' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: analytics || {
          client_id: clientId,
          total_leads: 0,
          contacted_leads: 0,
          meeting_booked_leads: 0,
          client_closed_leads: 0,
          no_sale_leads: 0,
          contact_rate: 0,
          meeting_rate: 0,
          close_rate: 0,
          overall_conversion_rate: 0
        }
      });
    }

  } catch (error) {
    console.error('[OutcomeAPI] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
