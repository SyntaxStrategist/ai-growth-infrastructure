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

    if (!lead_id || !action) {
      return NextResponse.json(
        { success: false, error: "lead_id and action are required" },
        { status: 400 }
      );
    }

    // Log the action
    const { data, error } = await supabase
      .from('lead_actions')
      .insert({
        id: randomUUID(),
        lead_id,
        action,
        tag: tag || null,
        performed_by: performed_by || 'admin',
      })
      .select()
      .single();

    if (error) {
      console.error('[API] Failed to log lead action:', error);
      throw error;
    }

    // Perform the actual lead action if it's a delete
    if (action === 'delete') {
      const { error: deleteError } = await supabase
        .from('lead_memory')
        .delete()
        .eq('id', lead_id);

      if (deleteError) {
        console.error('[API] Failed to delete lead from lead_memory:', deleteError);
        throw deleteError;
      }
    }
    // Archive and tag don't require additional database changes beyond logging

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[API] Error processing lead action:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
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
