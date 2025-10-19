// ============================================
// Client Prospect Intelligence Scan API
// Trigger prospect discovery pipeline using client's ICP data
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runProspectPipeline } from '../../../../../../prospect-intelligence/prospect_pipeline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

/**
 * Transform client ICP data into pipeline configuration
 */
function transformClientICPToPipelineConfig(icpData: any, clientInfo: any): any {
  if (!icpData || Object.keys(icpData).length === 0) {
    throw new Error('No ICP data found');
  }

  // Extract industries from ICP data
  const industries = extractIndustriesFromICP(icpData, clientInfo);
  
  // Calculate minimum score based on ICP data
  const minScore = calculateMinScoreFromICP(icpData);
  
  // Determine regions (default to CA/US for now)
  const regions = ['CA', 'US'];

  return {
    industries,
    regions,
    minAutomationScore: minScore,
    maxProspectsPerRun: 20, // Limit to 20 prospects per client scan
    testMode: false,
    clientICP: icpData,
    clientInfo: {
      businessName: clientInfo.business_name,
      industryCategory: clientInfo.industry_category,
      primaryService: clientInfo.primary_service
    }
  };
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

export async function POST(req: NextRequest) {
  console.log('[ClientProspectAPI] ============================================');
  console.log('[ClientProspectAPI] Client prospect scan request received');

  try {
    // 1. Authenticate client
    const clientId = await getAuthenticatedClientId(req);
    console.log('[ClientProspectAPI] Authenticated client:', clientId);

    // 2. Fetch client's ICP data from clients table
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

    console.log('[ClientProspectAPI] Client data fetched:', {
      businessName: client.business_name,
      hasIcpData: !!client.icp_data && Object.keys(client.icp_data).length > 0
    });

    // 3. Check if ICP data exists
    if (!client.icp_data || Object.keys(client.icp_data).length === 0) {
      console.log('[ClientProspectAPI] No ICP data found for client');
      return NextResponse.json(
        { 
          success: false, 
          error: 'No ICP data found',
          message: 'Please update your business preferences in your account settings to enable prospect intelligence.'
        },
        { status: 400 }
      );
    }

    // 4. Transform client ICP data into pipeline config
    const pipelineConfig = transformClientICPToPipelineConfig(client.icp_data, client);
    
    console.log('[ClientProspectAPI] Pipeline configuration:');
    console.log('[ClientProspectAPI]   Industries:', pipelineConfig.industries);
    console.log('[ClientProspectAPI]   Regions:', pipelineConfig.regions);
    console.log('[ClientProspectAPI]   Min Score:', pipelineConfig.minAutomationScore);
    console.log('[ClientProspectAPI]   Max Results:', pipelineConfig.maxProspectsPerRun);

    // 5. Run prospect pipeline with client-specific config
    const result = await runProspectPipeline(pipelineConfig);

    console.log('[ClientProspectAPI] ✅ Client prospect scan complete');
    console.log('[ClientProspectAPI]   Crawled:', result.totalCrawled);
    console.log('[ClientProspectAPI]   Tested:', result.totalTested);
    console.log('[ClientProspectAPI]   Contacted:', result.totalContacted);

    return NextResponse.json({
      success: true,
      data: result,
      clientInfo: {
        businessName: client.business_name,
        clientId: client.client_id
      }
    });

  } catch (error) {
    console.error('[ClientProspectAPI] ❌ Client prospect scan failed:', error);
    
    if (error instanceof Error && error.message === 'No ICP data found') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No ICP data found',
          message: 'Please update your business preferences in your account settings to enable prospect intelligence.'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Prospect scan failed' },
      { status: 500 }
    );
  }
}
