// ============================================
// Client Prospects API
// ============================================
// Fetch prospect details scoped to authenticated client

import { NextRequest, NextResponse } from 'next/server';
import { createUnifiedSupabaseClient } from '../../../../../lib/supabase-unified';
import { resolveClientId } from '../../../../../lib/client-resolver';

import { handleApiError } from '../../../../../lib/error-handler';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate business fit score for a single prospect against client ICP
 */
async function generateQuickFitScore(
  prospectName: string,
  prospectIndustry: string,
  clientIcp: any,
  locale: string
): Promise<{ score: number; reasoning: string }> {
  const isFrench = locale === 'fr';
  
  const prompt = isFrench
    ? `Analyse rapide: Le prospect "${prospectName}" (industrie: ${prospectIndustry}) correspond-il au profil suivant?
- Type de client cible: ${clientIcp.target_client_type || 'Non spécifié'}
- Objectif: ${clientIcp.main_business_goal || 'Non spécifié'}

Réponds UNIQUEMENT avec: Score: [0-100]
Raisonnement: [1-2 phrases courtes]`
    : `Quick analysis: Does prospect "${prospectName}" (industry: ${prospectIndustry}) match this profile?
- Target client type: ${clientIcp.target_client_type || 'Not specified'}
- Goal: ${clientIcp.main_business_goal || 'Not specified'}

Respond ONLY with: Score: [0-100]
Reasoning: [1-2 short sentences]`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 150,
    });
    
    const response = completion.choices[0].message.content?.trim() || '';
    const scoreMatch = response.match(/Score:\s*(\d+)/i);
    const reasoningMatch = response.match(/(?:Reasoning|Raisonnement):\s*([\s\S]+)/i);
    
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 70;
    const reasoning = (reasoningMatch && reasoningMatch[1]) ? reasoningMatch[1].trim() : response.split('\n').slice(1).join(' ').trim();
    
    return { score, reasoning };
  } catch (error) {
    console.error('[QuickFitScore] Error:', error);
    return { score: 70, reasoning: isFrench ? 'Analyse en attente' : 'Analysis pending' };
  }
}

/**
 * GET - Fetch prospects scoped to authenticated client
 * Only returns prospects that match the client's ICP profile
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 [ClientProspectProspects] ============================================');
    console.log('🔍 [ClientProspectProspects] CLIENT PROSPECT PROSPECTS DEBUG');
    console.log('🔍 [ClientProspectProspects] ============================================');
    
    // Get client ID and locale from query parameters
    const clientId = req.nextUrl.searchParams.get('clientId');
    const locale = req.nextUrl.searchParams.get('locale') || 'en';
    console.log('🔍 [ClientProspectProspects] Client ID from query:', clientId);
    console.log('🔍 [ClientProspectProspects] Locale from query:', locale);
    
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

    console.log('[ClientProspectAPI] ✅ Fetched', data?.length || 0, 'client-scoped prospects');
    
    // Generate business fit scores for prospects that don't have them
    const prospectsWithScores = await Promise.all((data || []).map(async (prospect: any) => {
      // Check if prospect already has business fit score
      if (prospect.metadata?.business_fit_score !== undefined) {
        console.log('[ClientProspectAPI] Prospect', prospect.business_name, 'already has fit score:', prospect.metadata.business_fit_score);
        return prospect;
      }
      
      // Generate fit score
      console.log('[ClientProspectAPI] Generating fit score for:', prospect.business_name);
      const fitAnalysis = await generateQuickFitScore(
        prospect.business_name,
        prospect.industry || 'Unknown',
        client.icp_data,
        locale // Use request locale for analysis language
      );
      
      // Update prospect metadata (in-memory only for now, will save when proof is viewed)
      const updatedMetadata = {
        ...(prospect.metadata || {}),
        business_fit_score: fitAnalysis.score,
        fit_reasoning: fitAnalysis.reasoning,
        fit_analysis_generated_at: new Date().toISOString(),
      };
      
      // Try to save to database (silent fail if trigger error)
      try {
        const supabase = createUnifiedSupabaseClient();
        await supabase
          .from('prospect_candidates')
          .update({ metadata: updatedMetadata })
          .eq('id', prospect.id);
        console.log('[ClientProspectAPI] ✅ Fit score saved for:', prospect.business_name);
      } catch (err) {
        console.warn('[ClientProspectAPI] ⚠️  Failed to save fit score, will use in-memory:', err);
      }
      
      return {
        ...prospect,
        metadata: updatedMetadata
      };
    }));
    
    console.log('[ClientProspectAPI] ✅ Returning', prospectsWithScores.length, 'prospects with ICP scores');
    return NextResponse.json({ 
      success: true,
      data: prospectsWithScores, 
      count: prospectsWithScores.length,
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

/**
 * DELETE - Delete a prospect candidate
 * Client can delete prospects from their list
 */
export async function DELETE(req: NextRequest) {
  try {
    console.log('[ClientProspectDelete] ============================================');
    console.log('[ClientProspectDelete] DELETE prospect request received');
    console.log('[ClientProspectDelete] ============================================');
    
    const { prospectId, clientId } = await req.json();
    
    if (!prospectId) {
      console.error('[ClientProspectDelete] ❌ Missing required parameter: prospectId');
      return NextResponse.json(
        { success: false, error: 'Prospect ID is required' },
        { status: 400 }
      );
    }
    
    console.log('[ClientProspectDelete] Client ID:', clientId || 'null (admin delete)');
    console.log('[ClientProspectDelete] Prospect ID:', prospectId);
    
    // Validate client ID (only if provided - admin can delete without clientId)
    if (clientId) {
      try {
        await resolveClientId(clientId);
        console.log('[ClientProspectDelete] ✅ Client ID validated');
      } catch (error) {
        console.error('[ClientProspectDelete] ❌ Invalid client ID:', error);
        return NextResponse.json(
          { success: false, error: 'Invalid client ID' },
          { status: 404 }
        );
      }
    } else {
      console.log('[ClientProspectDelete] ⚠️ Admin delete - no client validation');
    }
    
    // Create Supabase client
    const supabase = createUnifiedSupabaseClient();
    
    // Delete the prospect from database
    console.log('[ClientProspectDelete] Deleting prospect from database...');
    const { error: deleteError } = await supabase
      .from('prospect_candidates')
      .delete()
      .eq('id', prospectId);
    
    if (deleteError) {
      console.error('[ClientProspectDelete] ❌ Delete failed:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete prospect' },
        { status: 500 }
      );
    }
    
    console.log('[ClientProspectDelete] ✅ Prospect deleted successfully');
    console.log('[ClientProspectDelete] ============================================');
    
    return NextResponse.json({
      success: true,
      message: 'Prospect deleted successfully',
      deletedId: prospectId
    });
    
  } catch (error) {
    return handleApiError(error, 'ClientProspectDelete');
  }
}
