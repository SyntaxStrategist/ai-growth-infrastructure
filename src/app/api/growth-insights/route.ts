/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

// GET /api/growth-insights - Fetch latest growth_brain insights
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');

    let query = supabase
      .from('growth_brain')
      .select('*')
      .order('analyzed_at', { ascending: false })
      .limit(1);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[API] Failed to fetch growth insights:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: 'No growth insights available yet' 
      });
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('[API] Error fetching growth insights:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
