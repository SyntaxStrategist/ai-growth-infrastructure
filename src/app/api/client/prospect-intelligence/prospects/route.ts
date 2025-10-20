// ============================================
// Client Prospects API
// ============================================
// Fetch prospect details scoped to authenticated client

import { NextRequest, NextResponse } from 'next/server';
import { createUnifiedSupabaseClient } from '../../../../../lib/supabase-unified';
import { resolveClientId } from '../../../../../lib/client-resolver';

import { handleApiError } from '../../../../../lib/error-handler';
/**
 * GET - Fetch prospects scoped to authenticated client
 * Only returns prospects that match the client's ICP profile
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 [ClientProspectProspects] ============================================');
    console.log('🔍 [ClientProspectProspects] CLIENT PROSPECT PROSPECTS DEBUG');
    console.log('🔍 [ClientProspectProspects] ============================================');
    
    // Get client ID from query parameters
    const clientId = req.nextUrl.searchParams.get('clientId');
    console.log('🔍 [ClientProspectProspects] Client ID from query:', clientId);
    
    if (!clientId) {
      console.error('🔍 [ClientProspectProspects] ❌ No client ID provided');
      return NextResponse.json(
        { success: false, error: 'Client ID required' },
        { status: 400 }
      );
    }

    // Resolve client ID to UUID
    let resolvedClientId: string;
    try {
      resolvedClientId = await resolveClientId(clientId);
      console.log('🔍 [ClientProspectProspects] ✅ Resolved client ID:', resolvedClientId);
    } catch (error) {
      console.error('🔍 [ClientProspectProspects] ❌ Failed to resolve client ID:', error);
      return NextResponse.json(
        { success: false, error: `Failed to resolve client ID: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 404 }
      );
    }

    // Create Supabase client for database operations
    const supabase = createUnifiedSupabaseClient();

    // Fetch client's ICP data to filter prospects using resolved UUID
    console.log('🔍 [ClientProspectProspects] Querying clients table with resolved UUID:', resolvedClientId);
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('icp_data, business_name, industry_category')
      .eq('id', resolvedClientId)
      .single();

    console.log('🔍 [ClientProspectProspects] ============================================');
    console.log('🔍 [ClientProspectProspects] DATABASE QUERY RESULT');
    console.log('🔍 [ClientProspectProspects] ============================================');
    console.log('🔍 [ClientProspectProspects] Success:', !clientError);
    console.log('🔍 [ClientProspectProspects] Error:', clientError);
    console.log('🔍 [ClientProspectProspects] Client Data:', client);
    console.log('🔍 [ClientProspectProspects] ============================================');

    if (clientError) {
      console.error('[ClientProspectAPI] Failed to fetch client data:', clientError);
      return NextResponse.json(
        { success: false, error: 'Client not found', data: [] },
        { status: 404 }
      );
    }

    // If no ICP data, return empty results
    if (!client.icp_data || Object.keys(client.icp_data).length === 0) {
      console.log('[ClientProspectAPI] No ICP data found, returning empty results');
      return NextResponse.json({ 
        success: true, 
        data: [], 
        count: 0,
        clientInfo: {
          businessName: client.business_name,
          clientId: clientId
        }
      });
    }

    // Build query based on client's ICP data
    console.log('[ClientProspectAPI] Building prospect query...');
    console.log('[ClientProspectAPI] Client ICP data:', JSON.stringify(client.icp_data, null, 2));
    
    let query = supabase
      .from('prospect_candidates')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by industry if specified in ICP data
    if (client.industry_category) {
      console.log('[ClientProspectAPI] Filtering by industry:', client.industry_category);
      query = query.ilike('industry', `%${client.industry_category}%`);
    }

    // Filter by minimum score based on ICP data
    try {
      const minScore = calculateMinScoreFromICP(client.icp_data);
      console.log('[ClientProspectAPI] Minimum score calculated:', minScore);
      query = query.gte('automation_need_score', minScore);
    } catch (scoreError) {
      console.error('[ClientProspectAPI] Error calculating min score:', scoreError);
      // Continue without score filter if calculation fails
    }

    // Limit results for performance
    query = query.limit(50);

    console.log('[ClientProspectAPI] Executing prospect query...');
    const { data, error } = await query;

    if (error) {
      console.error('[ClientProspectAPI Error]', error.message);
      return NextResponse.json(
        { success: false, error: error.message, data: [] },
        { status: 500 }
      );
    }

    console.log('[ClientProspectAPI] ✅ Returning', data?.length || 0, 'client-scoped prospects');
    return NextResponse.json({ 
      success: true,
      data: data || [], 
      count: data?.length || 0,
      clientInfo: {
        businessName: client.business_name,
        clientId: clientId
      }
    });

  } catch (error) {
    return handleApiError(error, 'API');
  }
}

/**
 * Extract industries from client ICP data
 */
function extractIndustriesFromICP(icpData: any, clientInfo: any): string[] {
  const industries: string[] = [];
  
  // Use client's industry category as primary
  if (clientInfo.industry_category) {
    industries.push(clientInfo.industry_category);
  }
  
  // Extract from target client type
  if (icpData.target_client_type) {
    const targetType = icpData.target_client_type.toLowerCase();
    
    // Map common target types to industries
    if (targetType.includes('e-commerce') || targetType.includes('ecommerce')) {
      industries.push('E-commerce');
    }
    if (targetType.includes('real estate')) {
      industries.push('Real Estate');
    }
    if (targetType.includes('saas') || targetType.includes('software')) {
      industries.push('Software');
    }
    if (targetType.includes('marketing') || targetType.includes('agency')) {
      industries.push('Marketing');
    }
    if (targetType.includes('consulting')) {
      industries.push('Consulting');
    }
  }
  
  // Remove duplicates and return
  return [...new Set(industries)];
}

/**
 * Calculate minimum score based on ICP data
 */
function calculateMinScoreFromICP(icpData: any): number {
  try {
    let baseScore = 70; // Default minimum score
    
    // Safety check for icpData
    if (!icpData || typeof icpData !== 'object') {
      console.log('[ClientProspectAPI] Invalid ICP data, using default score');
      return baseScore;
    }
    
    // Adjust based on business goal
    if (icpData.main_business_goal && typeof icpData.main_business_goal === 'string') {
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
    if (icpData.average_deal_size && typeof icpData.average_deal_size === 'string') {
      const dealSize = icpData.average_deal_size.toLowerCase();
      if (dealSize.includes('$10,000') || dealSize.includes('$10000')) {
        baseScore += 10; // Higher value deals
      } else if (dealSize.includes('$5,000') || dealSize.includes('$5000')) {
        baseScore += 5; // Medium value deals
      }
    }
    
    return Math.min(baseScore, 90); // Cap at 90
  } catch (error) {
    console.error('[ClientProspectAPI] Error in calculateMinScoreFromICP:', error);
    return 70; // Return default score on error
  }
}
