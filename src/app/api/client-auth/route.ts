import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "../../../lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { api_key } = body;

    if (!api_key) {
      return NextResponse.json(
        { success: false, error: "API key is required" },
        { status: 400 }
      );
    }

    // Validate API key
    const client = await validateApiKey(api_key);

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Invalid API key" },
        { status: 401 }
      );
    }

    // Return client info (without sensitive data)
    return NextResponse.json({
      success: true,
      data: {
        client_id: client.id,
        company_name: client.business_name,
        contact_email: client.email,
      },
    });
  } catch (error) {
    console.error('[API] Client auth failed:', error);
    return NextResponse.json(
      { success: false, error: "Authentication failed" },
      { status: 500 }
    );
  }
}

