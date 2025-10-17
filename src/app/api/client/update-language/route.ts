// ============================================
// Update Client Language Preference API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PUT(req: NextRequest) {
  try {
    const { clientId, language } = await req.json();

    if (!clientId || !language) {
      return NextResponse.json(
        { success: false, error: 'Client ID and language are required' },
        { status: 400 }
      );
    }

    if (language !== 'en' && language !== 'fr') {
      return NextResponse.json(
        { success: false, error: 'Invalid language. Must be "en" or "fr"' },
        { status: 400 }
      );
    }

    console.log('[UpdateLanguageAPI] ============================================');
    console.log('[UpdateLanguageAPI] Updating language for client:', clientId);
    console.log('[UpdateLanguageAPI] New language:', language);

    // Use service role key for update
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    const { data, error } = await supabase
      .from('clients')
      .update({ language })
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) {
      console.error('[UpdateLanguageAPI] ❌ Update failed:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('[UpdateLanguageAPI] ✅ Language preference updated successfully');
    console.log('[UpdateLanguageAPI] Client:', data.business_name);

    return NextResponse.json({
      success: true,
      data: {
        clientId: data.client_id,
        language: data.language,
        businessName: data.business_name
      }
    });

  } catch (error) {
    console.error('[UpdateLanguageAPI] ❌ Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update language'
      },
      { status: 500 }
    );
  }
}

