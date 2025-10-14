/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAllClients, createClientRecord, deleteClient } from "../../../lib/supabase";
import { randomUUID } from "crypto";

// GET /api/clients - Fetch all clients
export async function GET() {
  try {
    const clients = await getAllClients();
    return NextResponse.json({ success: true, data: clients });
  } catch (error) {
    console.error('[API] Failed to fetch clients:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create new client
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company_name, contact_email } = body;

    if (!company_name || !contact_email) {
      return NextResponse.json(
        { success: false, error: "company_name and contact_email are required" },
        { status: 400 }
      );
    }

    // Generate unique API key
    const api_key = `ak_${randomUUID().replace(/-/g, '')}`;

    const newClient = await createClientRecord({
      company_name,
      contact_email,
      api_key,
    });

    return NextResponse.json({ success: true, data: newClient });
  } catch (error) {
    console.error('[API] Failed to create client:', error);
    return NextResponse.json(
      { success: false, error: "Failed to create client" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients?id=xxx - Delete client
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('id');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "client id is required" },
        { status: 400 }
      );
    }

    await deleteClient(clientId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to delete client:', error);
    return NextResponse.json(
      { success: false, error: "Failed to delete client" },
      { status: 500 }
    );
  }
}

