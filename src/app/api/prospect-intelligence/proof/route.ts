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
 * Get proof data for a prospect
 * Query params: ?id=<prospect_id>
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const locale = searchParams.get('locale') || 'en';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing prospect ID' },
        { status: 400 }
      );
    }

    console.log('[ProofAPI] Fetching proof for prospect:', id, '| Locale:', locale);

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
    
    // Auto-translate fit_reasoning if French locale and reasoning is in English
    let fitReasoning = metadata.fit_reasoning;
    
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
    
    // Update metadata with translated reasoning
    const updatedMetadata = {
      ...metadata,
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

