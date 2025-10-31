import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { verifyPassword } from '../../../../lib/clients';

import { handleApiError } from '../../../../lib/error-handler';
import { ClientAuthSchema, validateData } from '../../../../lib/validation-schemas';
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    console.log('[E2E-Test] [ClientAuth] Login attempt');

    // Validate input with Zod schema
    const validation = validateData(ClientAuthSchema, rawBody);
    
    if (!validation.success) {
      console.error('[E2E-Test] [ClientAuth] ❌ Validation failed:', validation.error);
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    
    console.log('[E2E-Test] [ClientAuth] ✅ Input validated:', { email });

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

    // Check account approval status
    if (client.status && client.status !== 'active') {
      console.log('[ClientAuth] ❌ Account not approved. Status:', client.status);
      
      let errorMessage = '';
      if (client.status === 'pending_approval') {
        errorMessage = 'Your account is pending admin approval. Please check your email for updates.';
      } else if (client.status === 'rejected') {
        errorMessage = 'Your account has been rejected. Please contact support for more information.';
      } else {
        errorMessage = 'Your account is not active. Please contact support.';
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage, status: client.status },
        { status: 403 }
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

