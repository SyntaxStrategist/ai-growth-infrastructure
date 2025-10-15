/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { randomUUID } from "crypto";

export interface LeadAction {
  id: string;
  lead_id: string;
  action: string;
  tag: string | null;
  performed_by: string;
  timestamp: string;
}

// POST /api/lead-actions - Log a lead action (delete, archive, tag)
export async function POST(req: NextRequest) {
  try {
    const { lead_id, action, tag, performed_by } = await req.json();

    console.log(`[LeadActions] POST received - type: ${action}, lead_id: ${lead_id}`);

    if (!lead_id || !action) {
      console.error('[LeadActions] Missing required fields');
      return NextResponse.json(
        { success: false, message: "lead_id and action are required" },
        { status: 400 }
      );
    }

    // Validate action type
    if (!['delete', 'archive', 'tag', 'reactivate'].includes(action)) {
      console.error(`[LeadActions] Invalid action type: ${action}`);
      return NextResponse.json(
        { success: false, message: `Invalid action type: ${action}` },
        { status: 400 }
      );
    }

    // Perform the actual lead action first
    if (action === 'delete') {
      console.log(`[LeadActions] Soft deleting lead ${lead_id}...`);
      
      const { error: deleteError } = await supabase
        .from('lead_memory')
        .update({ deleted: true })
        .eq('id', lead_id);

      console.log(`[LeadActions] Delete response:`, { error: deleteError || 'success' });

      if (deleteError) {
        console.error('[LeadActions] Failed to soft delete lead:', JSON.stringify(deleteError));
        return NextResponse.json(
          { success: false, message: "Error deleting lead", error: deleteError.message },
          { status: 500 }
        );
      }
    } else if (action === 'archive') {
      console.log(`[LeadActions] Archiving lead ${lead_id}...`);
      
      const { error: archiveError } = await supabase
        .from('lead_memory')
        .update({ archived: true })
        .eq('id', lead_id);

      console.log(`[LeadActions] Archive response:`, { error: archiveError || 'success' });

      if (archiveError) {
        console.error('[LeadActions] Failed to archive lead:', JSON.stringify(archiveError));
        return NextResponse.json(
          { success: false, message: "Error archiving lead", error: archiveError.message },
          { status: 500 }
        );
      }
    } else if (action === 'reactivate') {
      console.log(`[LeadActions] Reactivating lead ${lead_id}...`);
      
      const { error: reactivateError } = await supabase
        .from('lead_memory')
        .update({ archived: false, deleted: false })
        .eq('id', lead_id);

      console.log(`[LeadActions] Reactivate response:`, { error: reactivateError || 'success' });

      if (reactivateError) {
        console.error('[LeadActions] Failed to reactivate lead:', JSON.stringify(reactivateError));
        return NextResponse.json(
          { success: false, message: "Error reactivating lead", error: reactivateError.message },
          { status: 500 }
        );
      }
    } else if (action === 'tag') {
      console.log(`[LeadActions] Tagging lead ${lead_id} with ${tag}...`);
      
      // Update current_tag in lead_memory
      const { error: tagError } = await supabase
        .from('lead_memory')
        .update({ current_tag: tag })
        .eq('id', lead_id);

      console.log(`[LeadActions] Tag update response:`, { error: tagError || 'success' });

      if (tagError) {
        console.error('[LeadActions] Failed to update tag in lead_memory:', JSON.stringify(tagError));
        return NextResponse.json(
          { success: false, message: "Error tagging lead", error: tagError.message },
          { status: 500 }
        );
      }
    }

    // Log the action to lead_actions table
    console.log(`[LeadActions] Logging action to lead_actions table...`);
    
    const actionId = randomUUID();
    const { data: logData, error: logError } = await supabase
      .from('lead_actions')
      .insert({
        id: actionId,
        lead_id,
        action,
        tag: tag || null,
        performed_by: performed_by || 'admin',
      })
      .select()
      .single();

    console.log(`[LeadActions] Log response:`, JSON.stringify({ data: logData, error: logError || 'success' }));

    if (logError) {
      console.error('[LeadActions] Failed to log lead action:', JSON.stringify(logError));
      // Don't fail the request if logging fails - the main action succeeded
      console.warn('[LeadActions] Main action succeeded but logging failed');
    }

    // Return success with appropriate message
    let message = '';
    switch (action) {
      case 'delete':
        message = 'Lead deleted successfully';
        break;
      case 'archive':
        message = 'Lead archived successfully';
        break;
      case 'tag':
        message = `Lead tagged successfully`;
        break;
      case 'reactivate':
        message = 'Lead reactivated successfully';
        break;
    }

    console.log(`[LeadActions] ${message}`);
    return NextResponse.json({ success: true, message, data: logData });
    
  } catch (error) {
    console.error('[LeadActions] Error processing lead action:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal server error", 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// GET /api/lead-actions - Fetch recent lead actions
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);

    const { data, error } = await supabase
      .from('lead_actions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[API] Failed to fetch lead actions:', error);
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[API] Error fetching lead actions:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
