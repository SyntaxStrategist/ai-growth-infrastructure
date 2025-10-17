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
 * Dashboard-safe: Guarantees data is never undefined
 */
export async function GET() {
  console.log('[ProspectAPI] GET request - Fetching from prospect_candidates');

  try {
    // Fetch all prospects from prospect_candidates table
    const { data, error } = await supabase
      .from('prospect_candidates')
      .select('*')
      .order('created_at', { ascending: false });

    // Handle Supabase errors
    if (error) {
      console.error('[ProspectAPI] Supabase query failed:', error.message);
      console.log('[ProspectAPI] Loaded 0 prospects (error)');
      
      return new Response(
        JSON.stringify({ 
          data: [], // Always return empty array, never undefined
          error: error.message
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Success - return prospects with safe fallback
    const safeData = data || []; // Ensure data is never null/undefined
    const prospectCount = safeData.length;
    
    console.log('[ProspectAPI] Loaded', prospectCount, 'prospects from prospect_candidates');
    
    if (prospectCount === 0) {
      console.log('[ProspectAPI] No prospects found in database');
    }

    return new Response(
      JSON.stringify({ data: safeData }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        } 
      }
    );

  } catch (err) {
    // Catch unexpected errors
    console.error('[ProspectAPI] Unexpected error:', err);
    console.log('[ProspectAPI] Loaded 0 prospects (exception)');
    
    return new Response(
      JSON.stringify({ 
        data: [], // Always return empty array, never undefined
        error: err instanceof Error ? err.message : 'Unknown error'
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
