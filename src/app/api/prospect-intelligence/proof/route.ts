// ============================================
// Prospect Proof API
// Returns proof data for a specific prospect
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Get proof data for a prospect
 * Query params: ?id=<prospect_id>
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing prospect ID' },
        { status: 400 }
      );
    }

    console.log('[ProofAPI] Fetching proof for prospect:', id);

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Fetch prospect data
    const { data, error } = await supabase
      .from('prospect_candidates')
      .select('id, business_name, website, industry, region, metadata, automation_need_score, contacted, created_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[ProofAPI] Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Prospect not found' },
        { status: 404 }
      );
    }

    if (!data) {
      console.warn('[ProofAPI] No data returned for ID:', id);
      return NextResponse.json(
        { success: false, error: 'Prospect not found' },
        { status: 404 }
      );
    }

    console.log('[ProofAPI] ✅ Prospect found:', data.business_name);

    // Extract metadata
    const metadata = data.metadata || {};
    const formScan = metadata.form_scan || {};
    
    // Check if this is simulated test data
    const isSimulated = metadata.source === 'test' || metadata.simulated === true;

    // Build response
    const proofData = {
      success: true,
      simulated: isSimulated,
      prospect: {
        id: data.id,
        business_name: data.business_name,
        website: data.website,
        industry: data.industry,
        region: data.region,
        automation_need_score: data.automation_need_score,
        contacted: data.contacted,
        created_at: data.created_at,
      },
      proof: {
        // Form scan results
        has_form: formScan.has_form || false,
        form_count: formScan.form_count || 0,
        has_mailto: formScan.has_mailto || false,
        has_captcha: formScan.has_captcha || false,
        submit_method: formScan.submit_method || null,
        recommended_approach: formScan.recommended_approach || 'manual-outreach',
        
        // Response time
        response_time: metadata.response_time || 'N/A',
        
        // Screenshot
        screenshot_url: metadata.screenshot_url || null,
        
        // Contact paths
        contact_paths: formScan.contact_paths || [],
        
        // Scan timestamp
        scanned_at: formScan.scanned_at || metadata.enriched_at || null,
      },
      // Full metadata for debug
      raw_metadata: metadata,
    };

    console.log('[ProofAPI] Returning proof data with simulated flag:', isSimulated);

    return NextResponse.json(proofData);

  } catch (error) {
    console.error('[ProofAPI] Exception:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch proof data'
      },
      { status: 500 }
    );
  }
}

