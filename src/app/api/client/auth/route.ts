import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { verifyPassword } from '../../../../lib/clients';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    console.log('[ClientAuth] Login attempt:', { email });

    // Validation
    if (!email || !password) {
      console.error('[ClientAuth] ❌ Missing credentials');
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Fetch client by email
    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError || !client) {
      console.error('[ClientAuth] ❌ Client not found:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, client.password_hash);

    if (!isValid) {
      console.error('[ClientAuth] ❌ Invalid password for:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last_login
    await supabase
      .from('clients')
      .update({ last_login: new Date().toISOString() })
      .eq('id', client.id);

    console.log('[ClientAuth] ✅ Login successful:', { clientId: client.client_id, businessName: client.business_name });

    // Return client data (excluding password_hash)
    const { password_hash, ...clientData } = client;

    return NextResponse.json({
      success: true,
      data: {
        id: clientData.id,
        clientId: clientData.client_id,
        businessName: clientData.business_name,
        contactName: clientData.contact_name,
        email: clientData.email,
        language: clientData.language,
        apiKey: clientData.api_key,
      },
    });

  } catch (error) {
    console.error('[ClientAuth] ❌ Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

