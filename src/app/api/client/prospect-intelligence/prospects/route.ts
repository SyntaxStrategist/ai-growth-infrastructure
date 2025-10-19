// ============================================
// Client Prospects API
// ============================================
// Fetch prospect details scoped to authenticated client

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
 * Get authenticated client ID from request
 */
async function getAuthenticatedClientId(req: NextRequest): Promise<string> {
  // Try to get client ID from API key header
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    const { data: client } = await supabase
      .from('clients')
      .select('client_id')
      .eq('api_key', apiKey)
      .single();
    
    if (client) {
      return client.client_id;
    }
  }
  
  // Try to get from request body
  const body = await req.json().catch(() => ({}));
  if (body.clientId) {
    return body.clientId;
  }
  
  throw new Error('Client authentication required');
}

/**
 * GET - Fetch prospects scoped to authenticated client
 * Only returns prospects that match the client's ICP profile
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[ClientProspectAPI] Fetching client-scoped prospects...');
    
    // Authenticate client
    const clientId = await getAuthenticatedClientId(req);
    console.log('[ClientProspectAPI] Authenticated client:', clientId);

    // Fetch client's ICP data to filter prospects
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('icp_data, business_name, industry_category')
      .eq('client_id', clientId)
      .single();

    if (clientError) {
      console.error('[ClientProspectAPI] Failed to fetch client data:', clientError);
      return NextResponse.json(
        { error: 'Client not found', data: [] },
        { status: 404 }
      );
    }

    // If no ICP data, return empty results
    if (!client.icp_data || Object.keys(client.icp_data).length === 0) {
      console.log('[ClientProspectAPI] No ICP data found, returning empty results');
      return NextResponse.json({ data: [], count: 0 });
    }

    // Build query based on client's ICP data
    let query = supabase
      .from('prospect_candidates')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by industry if specified in ICP data
    if (client.industry_category) {
      query = query.ilike('industry', `%${client.industry_category}%`);
    }

    // Filter by minimum score based on ICP data
    const minScore = calculateMinScoreFromICP(client.icp_data);
    query = query.gte('automation_need_score', minScore);

    // Limit results for performance
    query = query.limit(50);

    const { data, error } = await query;

    if (error) {
      console.error('[ClientProspectAPI Error]', error.message);
      return NextResponse.json(
        { error: error.message, data: [] },
        { status: 500 }
      );
    }

    console.log('[ClientProspectAPI] ✅ Returning', data?.length || 0, 'client-scoped prospects');
    return NextResponse.json({ 
      data: data || [], 
      count: data?.length || 0,
      clientInfo: {
        businessName: client.business_name,
        clientId: clientId
      }
    });

  } catch (error) {
    console.error('[ClientProspectAPI Crash]', error);
    return NextResponse.json(
      { error: 'Internal server error', data: [] },
      { status: 500 }
    );
  }
}

/**
 * Calculate minimum score based on ICP data
 */
function calculateMinScoreFromICP(icpData: any): number {
  let baseScore = 70; // Default minimum score
  
  // Adjust based on business goal
  if (icpData.main_business_goal) {
    switch (icpData.main_business_goal) {
      case 'Generate more qualified leads':
        baseScore = 75; // Higher quality leads needed
        break;
      case 'Improve follow-ups and conversions':
        baseScore = 70; // Standard score
        break;
      case 'Nurture existing clients':
        baseScore = 65; // Lower threshold for nurturing
        break;
      case 'Save time with automation':
        baseScore = 80; // High automation readiness needed
        break;
    }
  }
  
  // Adjust based on deal size (higher deal size = higher score threshold)
  if (icpData.average_deal_size) {
    const dealSize = icpData.average_deal_size.toLowerCase();
    if (dealSize.includes('$10,000') || dealSize.includes('$10000')) {
      baseScore += 10; // Higher value deals
    } else if (dealSize.includes('$5,000') || dealSize.includes('$5000')) {
      baseScore += 5; // Medium value deals
    }
  }
  
  return Math.min(baseScore, 90); // Cap at 90
}
