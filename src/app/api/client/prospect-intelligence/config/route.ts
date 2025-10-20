// ============================================
// Client Prospect Intelligence Config API
// ============================================
// Get client's ICP configuration for prospect intelligence

import { NextRequest, NextResponse } from 'next/server';
import { createUnifiedSupabaseClient } from '../../../../../lib/supabase-unified';
import { resolveClientId } from '../../../../../lib/client-resolver';

import { handleApiError } from '../../../../../lib/error-handler';
/**
 * GET - Get client's ICP configuration
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 [ClientProspectConfig] ============================================');
    console.log('🔍 [ClientProspectConfig] CLIENT PROSPECT CONFIG DEBUG');
    console.log('🔍 [ClientProspectConfig] ============================================');
    
    // Get client ID from query parameters
    const clientId = req.nextUrl.searchParams.get('clientId');
    console.log('🔍 [ClientProspectConfig] Client ID from query:', clientId);
    
    if (!clientId) {
      console.error('🔍 [ClientProspectConfig] ❌ No client ID provided');
      return NextResponse.json(
        { success: false, error: 'Client ID required' },
        { status: 400 }
      );
    }

    // Resolve client ID to UUID
    let resolvedClientId: string;
    try {
      resolvedClientId = await resolveClientId(clientId);
      console.log('🔍 [ClientProspectConfig] ✅ Resolved client ID:', resolvedClientId);
    } catch (error) {
      console.error('🔍 [ClientProspectConfig] ❌ Failed to resolve client ID:', error);
      return NextResponse.json(
        { success: false, error: `Failed to resolve client ID: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 404 }
      );
    }

    // Create Supabase client for database operations
    const supabase = createUnifiedSupabaseClient();

    // Fetch client's ICP data using resolved UUID
    console.log('🔍 [ClientProspectConfig] Querying clients table with resolved UUID:', resolvedClientId);
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('icp_data, business_name, industry_category, primary_service, client_id')
      .eq('id', resolvedClientId)
      .single();

    console.log('🔍 [ClientProspectConfig] ============================================');
    console.log('🔍 [ClientProspectConfig] DATABASE QUERY RESULT');
    console.log('🔍 [ClientProspectConfig] ============================================');
    console.log('🔍 [ClientProspectConfig] Success:', !clientError);
    console.log('🔍 [ClientProspectConfig] Error:', clientError);
    console.log('🔍 [ClientProspectConfig] Client Data:', client);
    console.log('🔍 [ClientProspectConfig] ============================================');

    if (clientError) {
      console.error('[ClientProspectAPI] Failed to fetch client data:', clientError);
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check if ICP data exists and has meaningful values
    const hasValidIcpData = client.icp_data && 
      Object.keys(client.icp_data).length > 0 && 
      (client.icp_data.target_client_type || 
       client.icp_data.average_deal_size || 
       client.icp_data.main_business_goal || 
       client.icp_data.biggest_challenge);
    
    if (!hasValidIcpData) {
      console.log('[ClientProspectAPI] No valid ICP data found for client');
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
    console.log('[ClientProspectAPI] Transforming ICP data into configuration...');
    console.log('[ClientProspectAPI] Client ICP data:', JSON.stringify(client.icp_data, null, 2));
    
    let config;
    try {
      config = {
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
    } catch (configError) {
      console.error('[ClientProspectAPI] Error creating config:', configError);
      return NextResponse.json({
        success: false,
        error: 'Failed to process ICP configuration',
        details: configError instanceof Error ? configError.message : String(configError)
      }, { status: 500 });
    }

    console.log('[ClientProspectAPI] ✅ Client ICP configuration retrieved');
    return NextResponse.json({
      success: true,
      data: config
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
