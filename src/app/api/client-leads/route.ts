import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import type { LeadMemoryRecord } from "../../../lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { client_id, limit = 100 } = body;

    if (!client_id) {
      return NextResponse.json(
        { success: false, error: "client_id is required" },
        { status: 400 }
      );
    }

    // Fetch only leads for this client
    const { data, error } = await supabase
      .from('lead_memory')
      .select('*')
      .eq('client_id', client_id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: (data || []) as LeadMemoryRecord[],
    });
  } catch (error) {
    console.error('[API] Failed to fetch client leads:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

