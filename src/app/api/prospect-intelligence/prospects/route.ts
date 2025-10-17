// ============================================
// Prospect Update API
// ============================================
// Update prospect details (e.g., contact_email)

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
 */
export async function GET() {
  console.log('[ProspectsAPI] ============================================');
  console.log('[ProspectsAPI] Fetching all prospects from prospect_candidates');

  try {
    // Fetch all prospects from prospect_candidates table, ordered by creation date descending
    const { data, error } = await supabase
      .from('prospect_candidates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ProspectsAPI] ❌ Database error:', error.message);
      throw error;
    }

    console.log('[ProspectsAPI] ✅ Fetched', data?.length || 0, 'prospects from prospect_candidates');
    console.log('[ProspectsAPI] ============================================');

    // Always return { data: [] } structure
    return new Response(
      JSON.stringify({ data: data || [] }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (err) {
    console.error('[ProspectsAPI] ❌ Error fetching prospects:', err);
    console.log('[ProspectsAPI] ============================================');
    
    // Return safe structure with empty data array on error
    return new Response(
      JSON.stringify({
        data: [],
        error: 'Database connection failed',
        details: err instanceof Error ? err.message : String(err)
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
