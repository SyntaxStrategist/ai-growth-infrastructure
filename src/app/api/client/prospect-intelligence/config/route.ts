// ============================================
// Client Prospect Intelligence Config API
// ============================================
// Get client's ICP configuration for prospect intelligence

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClientId, createServerSupabaseClient } from '../../../../../lib/supabase-server-auth';

/**
 * GET - Get client's ICP configuration
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[ClientProspectAPI] Fetching client ICP configuration...');
    
    // Authenticate client using new Supabase session system
    const clientId = await getAuthenticatedClientId(req);
    console.log('[ClientProspectAPI] Authenticated client:', clientId);

    // Create Supabase client for database operations
    const supabase = createServerSupabaseClient();

    // Fetch client's ICP data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('icp_data, business_name, industry_category, primary_service, client_id')
      .eq('client_id', clientId)
      .single();

    if (clientError) {
      console.error('[ClientProspectAPI] Failed to fetch client data:', clientError);
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check if ICP data exists
    if (!client.icp_data || Object.keys(client.icp_data).length === 0) {
      console.log('[ClientProspectAPI] No ICP data found for client');
      return NextResponse.json({
        success: false,
        hasIcpData: false,
        message: 'No ICP data found. Please update your business preferences in your account settings.',
        clientInfo: {
          businessName: client.business_name,
          clientId: client.client_id
        }
      });
    }

    // Transform ICP data into configuration
    const config = {
      hasIcpData: true,
      targetClientType: client.icp_data.target_client_type || null,
      averageDealSize: client.icp_data.average_deal_size || null,
      mainBusinessGoal: client.icp_data.main_business_goal || null,
      biggestChallenge: client.icp_data.biggest_challenge || null,
      icpVersion: client.icp_data.icp_version || '1.0',
      clientInfo: {
        businessName: client.business_name,
        industryCategory: client.industry_category,
        primaryService: client.primary_service,
        clientId: client.client_id
      },
      // Derived configuration
      industries: extractIndustriesFromICP(client.icp_data, client),
      minScore: calculateMinScoreFromICP(client.icp_data),
      maxProspects: 20
    };

    console.log('[ClientProspectAPI] ✅ Client ICP configuration retrieved');
    return NextResponse.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('[ClientProspectAPI] ❌ Failed to get client config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get configuration' },
      { status: 500 }
    );
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
    
    // Map common terms to industries
    if (targetType.includes('e-commerce') || targetType.includes('online store')) {
      industries.push('E-commerce');
    }
    if (targetType.includes('real estate') || targetType.includes('agent')) {
      industries.push('Real Estate');
    }
    if (targetType.includes('construction') || targetType.includes('contractor')) {
      industries.push('Construction');
    }
    if (targetType.includes('technology') || targetType.includes('software')) {
      industries.push('Technology');
    }
    if (targetType.includes('marketing') || targetType.includes('agency')) {
      industries.push('Digital Marketing');
    }
    if (targetType.includes('consulting') || targetType.includes('consultant')) {
      industries.push('Professional Services');
    }
  }
  
  // Fallback to common industries if none found
  if (industries.length === 0) {
    industries.push('Technology', 'Professional Services', 'E-commerce');
  }
  
  // Remove duplicates
  return [...new Set(industries)];
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
