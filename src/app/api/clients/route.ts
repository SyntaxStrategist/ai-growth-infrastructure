/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAllClients, createClientRecord, deleteClient } from "../../../lib/supabase";
import { randomUUID } from "crypto";

import { handleApiError } from '../../../lib/error-handler';
// GET /api/clients - Fetch all clients
export async function GET() {
  try {
    const clients = await getAllClients();
    return NextResponse.json({ success: true, data: clients });
  } catch (error) {
    return handleApiError(error, 'API');
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
    return handleApiError(error, 'API');
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
    return handleApiError(error, 'API');
  }
}

