// ============================================
// Prospect Proof API
// Returns proof data for a specific prospect
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleApiError } from '../../../../lib/error-handler';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate business fit analysis using AI
 */
async function generateBusinessFitAnalysis(
  prospectName: string,
  prospectIndustry: string,
  prospectWebsite: string,
  clientIcpData: any,
  locale: string
): Promise<{ score: number; reasoning: string }> {
  const isFrench = locale === 'fr';
  
  const systemPrompt = isFrench
    ? `Tu es un analyste de correspondance commerciale. Analyse la correspondance entre un prospect et le profil client idéal (ICP) d'un client. Fournis un score de 0 à 100 et un raisonnement bref.`
    : `You are a business fit analyst. Analyze the match between a prospect and a client's ideal client profile (ICP). Provide a score from 0 to 100 and brief reasoning.`;
  
  const userPrompt = isFrench
    ? `Prospect: ${prospectName}
Industrie: ${prospectIndustry}
Site Web: ${prospectWebsite}

Profil Client Idéal du Client:
- Type de client cible: ${clientIcpData.target_client_type || 'Non spécifié'}
- Taille moyenne des transactions: ${clientIcpData.average_deal_size || 'Non spécifié'}
- Objectif commercial principal: ${clientIcpData.main_business_goal || 'Non spécifié'}
- Défi principal: ${clientIcpData.biggest_challenge || 'Non spécifié'}

Fournis un score de correspondance (0-100) et un bref raisonnement (2-3 phrases) expliquant pourquoi ce prospect correspond ou non au profil client idéal.

Format de réponse:
Score: [nombre]
Raisonnement: [2-3 phrases]`
    : `Prospect: ${prospectName}
Industry: ${prospectIndustry}
Website: ${prospectWebsite}

Client's Ideal Client Profile:
- Target client type: ${clientIcpData.target_client_type || 'Not specified'}
- Average deal size: ${clientIcpData.average_deal_size || 'Not specified'}
- Main business goal: ${clientIcpData.main_business_goal || 'Not specified'}
- Biggest challenge: ${clientIcpData.biggest_challenge || 'Not specified'}

Provide a fit score (0-100) and brief reasoning (2-3 sentences) explaining why this prospect does or doesn't match the ideal client profile.

Response format:
Score: [number]
Reasoning: [2-3 sentences]`;

  try {
    console.log('[ProofAPI] 🤖 Generating business fit analysis...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 300,
    });
    
    const response = completion.choices[0].message.content?.trim() || '';
    
    console.log('[ProofAPI] AI response:', response);
    
    // Parse score and reasoning with safer regex
    const scoreMatch = response.match(/Score:\s*(\d+)/i);
    const reasoningMatch = response.match(/(?:Reasoning|Raisonnement):\s*([\s\S]+)/i);
    
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 70;
    const reasoning = (reasoningMatch && reasoningMatch[1]) ? reasoningMatch[1].trim() : response;
    
    console.log('[ProofAPI] ✅ Business fit generated - Score:', score);
    console.log('[ProofAPI] Generated reasoning preview:', reasoning.substring(0, 100) + '...');
    
    return { score, reasoning };
  } catch (error) {
    console.error('[ProofAPI] ❌ Failed to generate business fit:', error);
    return {
      score: 70,
      reasoning: isFrench 
        ? 'Analyse automatique non disponible pour ce prospect.'
        : 'Automatic analysis not available for this prospect.'
    };
  }
}

/**
 * Get proof data for a prospect
 * Query params: ?id=<prospect_id>
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const locale = searchParams.get('locale') || 'en';
    const clientId = searchParams.get('clientId'); // Optional: for client-specific ICP context

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing prospect ID' },
        { status: 400 }
      );
    }

    console.log('[ProofAPI] Fetching proof for prospect:', id, '| Locale:', locale, '| Client:', clientId || 'none');

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
    let metadata = data.metadata || {};
    const formScan = metadata.form_scan || {};
    
    // Check if this is simulated test data
    const isSimulated = metadata.source === 'test' || metadata.simulated === true;
    
    // Auto-generate business fit analysis if missing
    let fitReasoning = metadata.fit_reasoning;
    let fitScore = metadata.business_fit_score;
    
    if (!fitReasoning || fitScore === undefined || fitScore === null) {
      console.log('[ProofAPI] ⚠️  Business fit data missing, generating now...');
      
      // Fetch client ICP data to generate fit analysis
      let clientQuery = supabase
        .from('clients')
        .select('icp_data, business_name, industry_category, client_id')
        .not('icp_data', 'is', null);
      
      // If clientId provided, fetch that specific client's ICP
      if (clientId) {
        console.log('[ProofAPI] Fetching ICP for specific client:', clientId);
        clientQuery = clientQuery.eq('client_id', clientId);
      }
      
      clientQuery = clientQuery.limit(1);
      
      const { data: clients } = await clientQuery;
      
      if (clients && clients.length > 0 && clients[0].icp_data) {
        const clientIcp = clients[0].icp_data;
        console.log('[ProofAPI] Using ICP from client:', clients[0].business_name);
        const fitAnalysis = await generateBusinessFitAnalysis(
          data.business_name,
          data.industry || 'Unknown',
          data.website,
          clientIcp,
          locale
        );
        
        fitScore = fitAnalysis.score;
        fitReasoning = fitAnalysis.reasoning;
        
        // Update metadata in database for future use
        const updatedMetadataForSave = {
          ...metadata,
          business_fit_score: fitScore,
          fit_reasoning: fitReasoning,
          fit_analysis_generated_at: new Date().toISOString(), // Track when generated
          fit_analysis_method: 'ai_generated', // Mark as auto-generated
        };
        
        // Only update metadata field, avoid triggering updated_at issues
        const { error: updateError } = await supabase
          .from('prospect_candidates')
          .update({ 
            metadata: updatedMetadataForSave
          })
          .eq('id', id);
        
        if (updateError) {
          console.warn('[ProofAPI] ⚠️  Failed to update metadata with fit analysis:', updateError);
          // Continue anyway - we can still return the generated data
        } else {
          console.log('[ProofAPI] ✅ Metadata updated with generated fit analysis');
        }
        
        // Use updated metadata for response even if save failed
        metadata = updatedMetadataForSave;
      } else {
        console.log('[ProofAPI] ⚠️  No client ICP data available, using default');
        fitScore = 70;
        fitReasoning = locale === 'fr'
          ? 'Score par défaut - aucune donnée ICP client disponible pour l\'analyse.'
          : 'Default score - no client ICP data available for analysis.';
      }
    }
    
    // Auto-translate fit_reasoning if French locale and reasoning is in English
    if (locale === 'fr' && fitReasoning && typeof fitReasoning === 'string') {
      // Check if reasoning appears to be in English (simple heuristic)
      const isEnglish = fitReasoning.includes('Strong match') || 
                        fitReasoning.includes('Good fit') || 
                        fitReasoning.includes('company') ||
                        !fitReasoning.includes('entreprise');
      
      if (isEnglish && process.env.OPENAI_API_KEY) {
        try {
          console.log('[ProofAPI] 🔄 Translating fit reasoning to French...');
          
          const translation = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: 'You are a professional translator. Translate to natural French, keeping business tone and technical accuracy. Return ONLY the translation, no explanations.' 
              },
              { 
                role: 'user', 
                content: fitReasoning 
              }
            ],
            temperature: 0.3,
            max_tokens: 250,
          });
          
          const translatedReasoning = translation.choices[0].message.content?.trim();
          
          if (translatedReasoning) {
            fitReasoning = translatedReasoning;
            console.log('[ProofAPI] ✅ Fit reasoning translated to French');
          }
          
        } catch (error) {
          console.warn('[ProofAPI] ⚠️  Translation failed, using original:', error);
          // Keep original reasoning if translation fails
        }
      }
    }
    
    // Update metadata with fit analysis (and translation if applicable)
    const updatedMetadata = {
      ...metadata,
      business_fit_score: fitScore,
      fit_reasoning: fitReasoning,
    };

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
      // Full metadata for debug (with translated reasoning if applicable)
      raw_metadata: updatedMetadata,
    };

    console.log('[ProofAPI] Returning proof data with simulated flag:', isSimulated);

    return NextResponse.json(proofData);

  } catch (error) {
    return handleApiError(error, 'API');
  }
}

