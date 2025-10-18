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
 * Supabase: https://uvkxmugmrvwwbqqxrzob.supabase.co
 * Table: prospect_candidates (id, business_name, website, contact_email, industry, 
 *        region, language, form_url, last_tested, response_score, automation_need_score, 
 *        contacted, created_at, metadata)
 * Always returns valid JSON: { data: [...], count: N }
 */
export async function GET() {
  try {
    console.log('[ProspectAPI] Fetching prospects...');
    const { data, error } = await supabase
      .from('prospect_candidates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ProspectAPI Error]', error.message);
      return new Response(JSON.stringify({ error: error.message, data: [] }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[ProspectAPI] ✅ Returning', data?.length || 0, 'prospects');
    return new Response(JSON.stringify({ data, count: data?.length || 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[ProspectAPI Crash]', err);
    return new Response(JSON.stringify({ error: String(err), data: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
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
