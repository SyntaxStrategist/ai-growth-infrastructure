// ============================================
// Prospects API
// ============================================
// Fetch and update prospect details from prospect_candidates table

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

/**
 * GET - Fetch all prospects from prospect_candidates table
 * Always returns { data: [...] } structure for safe client parsing
 * Comprehensive error logging for Vercel debugging
 */
export async function GET() {
  console.log('[ProspectAPI] ============================================');
  console.log('[ProspectAPI] GET request received');
  console.log('[ProspectAPI] Fetching from table: prospect_candidates');
  console.log('[ProspectAPI] Supabase URL:', supabaseUrl ? '✓ Configured' : '✗ Missing');
  console.log('[ProspectAPI] Service key:', supabaseKey ? '✓ Configured' : '✗ Missing');

  try {
    // Fetch all prospects from prospect_candidates table
    console.log('[ProspectAPI] Executing Supabase query...');
    const { data, error } = await supabase
      .from('prospect_candidates')
      .select('*')
      .order('created_at', { ascending: false });

    // Handle Supabase errors
    if (error) {
      console.error('[ProspectAPI Error] ❌ Supabase query failed');
      console.error('[ProspectAPI Error] Error code:', error.code);
      console.error('[ProspectAPI Error] Error message:', error.message);
      console.error('[ProspectAPI Error] Error details:', JSON.stringify(error, null, 2));
      
      return new Response(
        JSON.stringify({ 
          data: [], 
          error: 'Supabase query failed',
          details: error.message,
          code: error.code
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Success - return prospects with safe fallback
    const prospectCount = data?.length || 0;
    console.log('[ProspectAPI] ✅ Query successful');
    console.log('[ProspectAPI] ✅ Fetched', prospectCount, 'prospects from prospect_candidates');
    
    if (prospectCount > 0) {
      console.log('[ProspectAPI] Sample prospect:', {
        id: data[0]?.id,
        business_name: data[0]?.business_name,
        has_email: !!data[0]?.contact_email
      });
    } else {
      console.log('[ProspectAPI] ⚠️  No prospects found in database');
    }
    
    console.log('[ProspectAPI] Returning response with', prospectCount, 'prospects');
    console.log('[ProspectAPI] ============================================');

    return new Response(
      JSON.stringify({ data: data || [] }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (err) {
    // Catch unexpected errors
    console.error('[ProspectAPI Error] ❌ Unexpected failure in GET handler');
    console.error('[ProspectAPI Error] Error type:', err instanceof Error ? err.constructor.name : typeof err);
    console.error('[ProspectAPI Error] Error message:', err instanceof Error ? err.message : String(err));
    console.error('[ProspectAPI Error] Error stack:', err instanceof Error ? err.stack : 'N/A');
    console.error('[ProspectAPI Error] Full error object:', err);
    console.log('[ProspectAPI] ============================================');
    
    return new Response(
      JSON.stringify({ 
        data: [], 
        error: 'Unexpected server error',
        details: err instanceof Error ? err.message : String(err),
        type: err instanceof Error ? err.constructor.name : typeof err
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

/**
 * PUT - Update prospect details
 */
export async function PUT(req: NextRequest) {
  console.log('[ProspectsAPI] ============================================');
  console.log('[ProspectsAPI] Updating prospect');

  try {
    const body = await req.json();
    const { id, contact_email } = body;

    if (!id) {
      console.error('[ProspectsAPI] ❌ Prospect ID is required');
      return NextResponse.json({ success: false, error: 'Prospect ID is required' }, { status: 400 });
    }

    console.log('[ProspectsAPI] Prospect ID:', id);
    console.log('[ProspectsAPI] New contact_email:', contact_email);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (contact_email && !emailRegex.test(contact_email)) {
      console.error('[ProspectsAPI] ❌ Invalid email format');
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    // Update prospect in Supabase
    const { data, error } = await supabase
      .from('prospect_candidates')
      .update({ contact_email })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('[ProspectsAPI] ❌ Failed to update prospect:', error?.message);
      return NextResponse.json({ success: false, error: error?.message || 'Failed to update prospect' }, { status: 500 });
    }

    console.log('[ProspectsAPI] ✅ Prospect updated successfully');
    console.log('[ProspectsAPI] ============================================');

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('[ProspectsAPI] ❌ Error updating prospect:', error);
    console.log('[ProspectsAPI] ============================================');
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update prospect' },
      { status: 500 }
    );
  }
}
