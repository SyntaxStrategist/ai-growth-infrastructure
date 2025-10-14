import { NextRequest, NextResponse } from "next/server";
import { rotateApiKey } from "../../../lib/supabase";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { client_id } = body;

    if (!client_id) {
      return NextResponse.json(
        { success: false, error: "client_id is required" },
        { status: 400 }
      );
    }

    // Generate new API key
    const newApiKey = `ak_${randomUUID().replace(/-/g, '')}`;

    // Rotate the key and log the event
    const updatedClient = await rotateApiKey(client_id, newApiKey);

    return NextResponse.json({
      success: true,
      data: updatedClient,
    });
  } catch (error) {
    console.error('[API] Failed to rotate API key:', error);
    return NextResponse.json(
      { success: false, error: "Failed to rotate API key" },
      { status: 500 }
    );
  }
}

