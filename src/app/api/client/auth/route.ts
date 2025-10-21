import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { verifyPassword } from '../../../../lib/clients';

import { handleApiError } from '../../../../lib/error-handler';
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    console.log('[E2E-Test] [ClientAuth] Login attempt:', { email });
    console.log('[E2E-Test] [ClientAuth] Request body:', { email: email, hasPassword: !!password });

    // Validation
    if (!email || !password) {
      console.error('[E2E-Test] [ClientAuth] ❌ Missing credentials');
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Fetch client by email (matching actual table column)
    console.log('[E2E-Test] [ClientAuth] Querying Supabase for email:', email);
    
    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .single();

    console.log('[E2E-Test] [ClientAuth] Supabase query result:', {
      found: !!client,
      error: fetchError?.message || 'none',
      errorCode: fetchError?.code || 'none',
    });

    if (fetchError || !client) {
      console.error('[E2E-Test] [ClientAuth] ❌ Client not found:', email);
      console.error('[E2E-Test] [ClientAuth] ❌ Fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('[E2E-Test] [ClientAuth] ✅ Client found in database:', {
      id: client.id,
      client_id: client.client_id,
      name: client.name,
      email: client.email,
      business_name: client.business_name,
      has_password_hash: !!client.password_hash,
    });

    // Verify password
    console.log('[E2E-Test] [ClientAuth] Verifying password...');
    const isValid = await verifyPassword(password, client.password_hash);

    console.log('[E2E-Test] [ClientAuth] Password verification result:', isValid);

    if (!isValid) {
      console.error('[E2E-Test] [ClientAuth] ❌ Invalid password for:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last_login
    console.log('[E2E-Test] [ClientAuth] Updating last_login timestamp...');
    const { error: updateError } = await supabase
      .from('clients')
      .update({ last_login: new Date().toISOString() })
      .eq('id', client.id);

    if (updateError) {
      console.warn('[E2E-Test] [ClientAuth] ⚠️  Failed to update last_login:', updateError);
    } else {
      console.log('[E2E-Test] [ClientAuth] ✅ last_login updated');
    }

    console.log('[E2E-Test] [ClientAuth] ✅ Login successful:', { 
      clientId: client.client_id, 
      businessName: client.business_name || client.company_name 
    });
    console.log('[E2E-Test] [ClientAuth] ✅ Credentials verified, session created');

    // Return client data (excluding password_hash)
    const { password_hash, ...clientData } = client;

    console.log('[E2E-Test] [ClientAuth] Preparing response data:', {
      id: clientData.id,
      clientId: clientData.client_id,
      businessName: clientData.business_name,
      name: clientData.name,
      email: clientData.email,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: clientData.id,
        clientId: clientData.client_id,
        businessName: clientData.business_name,
        contactName: clientData.name || clientData.contact_name,
        email: clientData.email,
        language: clientData.language,
        apiKey: clientData.api_key,
        lastConnection: clientData.last_connection,
        createdAt: clientData.created_at,
      },
    });

  } catch (error) {
    return handleApiError(error, 'API');
  }
}

