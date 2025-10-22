import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { translateText } from '../../../../lib/translation-service';
import { resolveClientId, validateClientId } from '../../../../lib/client-resolver';
import { handleApiError } from '../../../../lib/error-handler';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Translation mappings for relationship data
const toneTranslations = {
  // English to French
  'Professional and direct': 'Professionnel et direct',
  'Frustrated but motivated': 'Frustré mais motivé',
  'Satisfied and technical': 'Satisfait et technique',
  'Enthusiastic and engaged': 'Enthousiaste et engagé',
  'Excited and committed': 'Excité et engagé',
  'Strategic and analytical': 'Stratégique et analytique',
  'Curious and exploratory': 'Curieux et exploratoire',
  'Formal': 'Formel',
  'Casual': 'Décontracté',
  'Urgent': 'Urgent',
  'Neutral': 'Neutre',
  'Friendly': 'Amical',
  'Professional': 'Professionnel',
  'Analytical': 'Analytique',
  'Exploratory and open': 'Exploratoire et ouvert',
  'Interested and specific': 'Intéressé et spécifique',
  // French to English
  'Professionnel et direct': 'Professional and direct',
  'Frustré mais motivé': 'Frustrated but motivated',
  'Satisfait et technique': 'Satisfied and technical',
  'Enthousiaste et engagé': 'Enthusiastic and engaged',
  'Excité et engagé': 'Excited and committed',
  'Stratégique et analytique': 'Strategic and analytical',
  'Curieux et exploratoire': 'Curious and exploratory',
  'Formel': 'Formal',
  'Décontracté': 'Casual',
  'Neutre': 'Neutral',
  'Amical': 'Friendly',
  'Professionnel': 'Professional',
  'Analytique': 'Analytical',
  'Exploratoire et ouvert': 'Exploratory and open',
  'Intéressé et spécifique': 'Interested and specific',
};

const urgencyTranslations = {
  // English to French
  'High': 'Élevée',
  'Medium': 'Moyenne',
  'Low': 'Faible',
  // French to English
  'Élevée': 'High',
  'Moyenne': 'Medium',
  'Faible': 'Low',
};

const insightTranslations = {
  // English to French
  'Demo successful. Moving to technical phase. High conversion probability.': 'Démonstration réussie. Passage à la phase technique. Probabilité de conversion élevée.',
  'CONVERTED! Excellent relationship progression. Ready for onboarding process.': 'CONVERTI! Excellente progression relationnelle. Prêt pour le processus d\'intégration.',
  'Strong initial interest, follow up soon.': 'Fort intérêt initial, suivi bientôt.',
  'Technical discussion phase, high potential.': 'Phase de discussion technique, potentiel élevé.',
  'Marketing pilot phase, monitor closely.': 'Phase pilote marketing, surveiller de près.',
  'Effective recommendations. Ready for personalized demonstration.': 'Recommandations efficaces. Prêt pour démonstration personnalisée.',
  'Lead showing strong engagement, schedule follow-up.': 'Lead montrant un fort engagement, planifier un suivi.',
  'High-value prospect, prioritize outreach.': 'Prospect de haute valeur, prioriser la prospection.',
  'Technical evaluation in progress, provide support.': 'Évaluation technique en cours, fournir un support.',
  'Ready for proposal phase, prepare materials.': 'Prêt pour la phase de proposition, préparer les documents.',
  // French to English
  'Démonstration réussie. Passage à la phase technique. Probabilité de conversion élevée.': 'Demo successful. Moving to technical phase. High conversion probability.',
  'CONVERTI! Excellente progression relationnelle. Prêt pour le processus d\'intégration.': 'CONVERTED! Excellent relationship progression. Ready for onboarding process.',
  'Fort intérêt initial, suivi bientôt.': 'Strong initial interest, follow up soon.',
  'Phase de discussion technique, potentiel élevé.': 'Technical discussion phase, high potential.',
  'Phase pilote marketing, surveiller de près.': 'Marketing pilot phase, monitor closely.',
  'Recommandations efficaces. Prêt pour démonstration personnalisée.': 'Effective recommendations. Ready for personalized demonstration.',
  'Lead montrant un fort engagement, planifier un suivi.': 'Lead showing strong engagement, schedule follow-up.',
  'Prospect de haute valeur, prioriser la prospection.': 'High-value prospect, prioritize outreach.',
  'Évaluation technique en cours, fournir un support.': 'Technical evaluation in progress, provide support.',
  'Prêt pour la phase de proposition, préparer les documents.': 'Ready for proposal phase, prepare materials.',
};

// Helper function to detect if text is in French
function isFrenchText(text: string): boolean {
  const frenchAccents = /[éèêëàùûüïîôç]/i;
  const hasAccents = frenchAccents.test(text);
  const isFrench = hasAccents;
  
  console.log(`[💡 Translation Fix] Detection: hasAccents=${hasAccents}, isFrench=${isFrench}`);
  
  return isFrench;
}

// Translation functions
function translateTone(value: string, targetLocale: string): string {
  const isValueFrench = isFrenchText(value);
  const isTargetFrench = targetLocale === 'fr';
  
  if (isTargetFrench && !isValueFrench) {
    // We need French, but value is in English - translate to French
    const translated = toneTranslations[value as keyof typeof toneTranslations] || value;
    if (translated !== value) {
      console.log(`[LeadsInsightsAPI] Translating tone from EN → FR: "${value}" → "${translated}"`);
    }
    return translated;
  } else if (!isTargetFrench && isValueFrench) {
    // We need English, but value is in French - translate to English
    const translated = toneTranslations[value as keyof typeof toneTranslations] || value;
    if (translated !== value) {
      console.log(`[LeadsInsightsAPI] Translating tone from FR → EN: "${value}" → "${translated}"`);
    }
    return translated;
  }
  
  return value;
}

function translateUrgency(value: string, targetLocale: string): string {
  const isValueFrench = isFrenchText(value);
  const isTargetFrench = targetLocale === 'fr';
  
  if (isTargetFrench && !isValueFrench) {
    // We need French, but value is in English - translate to French
    const translated = urgencyTranslations[value as keyof typeof urgencyTranslations] || value;
    if (translated !== value) {
      console.log(`[LeadsInsightsAPI] Translating urgency from EN → FR: "${value}" → "${translated}"`);
    }
    return translated;
  } else if (!isTargetFrench && isValueFrench) {
    // We need English, but value is in French - translate to English
    const translated = urgencyTranslations[value as keyof typeof urgencyTranslations] || value;
    if (translated !== value) {
      console.log(`[LeadsInsightsAPI] Translating urgency from FR → EN: "${value}" → "${translated}"`);
    }
    return translated;
  }
  
  return value;
}

// Force translation function that always translates regardless of detected language

function translateInsight(value: string, targetLocale: string): string {
  const isValueFrench = isFrenchText(value);
  const isTargetFrench = targetLocale === 'fr';
  
  // Always log the detection and original value
  console.log(`[RelationshipInsights] Detected locale: ${targetLocale}`);
  console.log(`[RelationshipInsights] Original insight: "${value}"`);
  
  // Enforce strict translation logic
  if (isTargetFrench && !isValueFrench) {
    // French locale but English text - force EN→FR translation
    console.log(`[💡 Translation Fix] Detected English text in FR locale → translating EN→FR`);
    const translated = insightTranslations[value as keyof typeof insightTranslations] || value;
    console.log(`[RelationshipInsights] Translated insight → "${translated}"`);
    return translated;
  } else if (!isTargetFrench && isValueFrench) {
    // English locale but French text - force FR→EN translation
    console.log(`[💡 Translation Fix] Detected French text in EN locale → translating FR→EN`);
    const translated = insightTranslations[value as keyof typeof insightTranslations] || value;
    console.log(`[RelationshipInsights] Translated insight → "${translated}"`);
    return translated;
  }
  
  // Text matches locale - no translation needed
  if (isValueFrench) {
    console.log(`[💡 Translation Fix] Detected French text in FR locale → already correct`);
  } else {
    console.log(`[💡 Translation Fix] Detected English text in EN locale → already correct`);
  }
  return value;
}

// Main translation function for relationship data
async function translateRelationshipData(data: any[], locale: string): Promise<any[]> {
  console.log(`[RelationshipInsights] Starting translation for ${data.length} leads with locale: ${locale}`);
  
  return await Promise.all(data.map(async (lead: any, index: number) => {
    console.log(`[RelationshipInsights] Processing lead ${index + 1}: ${lead.name} (${lead.email})`);
    const translatedLead = { ...lead };
    
        // Force translate relationship insight regardless of detected language
        if (lead.relationship_insight) {
          console.log(`[💡 Translation] Force translating insight to ${locale}:`, lead.relationship_insight);
          const originalInsight = lead.relationship_insight;
          
          // Use 3-layer translation service
          translatedLead.relationship_insight = await translateText(lead.relationship_insight, locale, {
            context: 'relationship_insight',
            priority: 8
          });
          console.log(`[💡 Translation Applied] ${lead.name} → ${translatedLead.relationship_insight}`);
        }
    
    // Force translate tone history values
    if (lead.tone_history && Array.isArray(lead.tone_history)) {
      translatedLead.tone_history = await Promise.all(
        lead.tone_history.map(async (entry: any) => ({
          ...entry,
          value: typeof entry.value === 'string' ? await translateText(entry.value, locale, {
            context: 'tone_history',
            priority: 6
          }) : entry.value,
        }))
      );
    }
    
    // Force translate urgency history values
    if (lead.urgency_history && Array.isArray(lead.urgency_history)) {
      translatedLead.urgency_history = await Promise.all(
        lead.urgency_history.map(async (entry: any) => ({
          ...entry,
          value: typeof entry.value === 'string' ? await translateText(entry.value, locale, {
            context: 'urgency_history',
            priority: 6
          }) : entry.value,
        }))
      );
    }
    
    return translatedLead;
  }));
}

export async function GET(req: NextRequest) {
  try {
    console.log('[LeadsInsightsAPI] ============================================');
    console.log('[LeadsInsightsAPI] GET /api/leads/insights triggered');
    console.log('[LeadsInsightsAPI] ============================================');

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('[LeadsInsightsAPI] Environment check:', {
      hasUrl: !!supabaseUrl,
      urlValue: supabaseUrl || 'MISSING',
      hasServiceKey: !!supabaseKey,
      serviceKeyLength: supabaseKey?.length || 0,
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('[LeadsInsightsAPI] ❌ Missing Supabase credentials');
      return NextResponse.json({
        success: false,
        error: 'Supabase credentials not configured',
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') || 'en';
    const clientId = url.searchParams.get('clientId');

    console.log('[ClientResolver] Query params:', {
      locale,
      clientId: clientId || 'all (admin)',
      table: 'lead_memory',
      columns: 'name, email, tone_history, confidence_history, urgency_history, relationship_insight, last_updated',
      filters: {
        archived: false,
        deleted: false,
        relationship_insight: 'IS NOT NULL',
        ...(clientId ? { client_id: clientId } : {}),
      },
      order: 'last_updated DESC',
      limit: 20,
    });

    console.log('[ClientResolver] Executing Supabase query...');
    const queryStart = Date.now();
    
    // If clientId provided, need to resolve to internal UUID first
    let query;
    if (clientId) {
      console.log('[ClientResolver] Resolving client_id:', clientId);
      
      // Validate client ID format
      const validation = validateClientId(clientId);
      if (!validation.isValid) {
        console.error('[ClientResolver] ❌ Invalid client ID format:', clientId, validation.message);
        return NextResponse.json(
          { success: false, error: `Invalid client ID format: ${validation.message}` },
          { status: 400 }
        );
      }

      // Verify client exists by resolving (but don't use the UUID for lead_actions query)
      try {
        await resolveClientId(clientId);
        console.log(`[ClientResolver] ✅ Client ID validated: "${clientId}"`);
      } catch (error) {
        console.error('[ClientResolver] ❌ Client not found:', error);
        return NextResponse.json(
          { success: false, error: `Client not found: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 404 }
        );
      }
      
      // Query lead_actions using the PUBLIC client_id (not the internal UUID)
      // lead_actions.client_id stores the public client_id, not the internal UUID
      const { data: leadActionsData, error: leadActionsError } = await supabase
        .from('lead_actions')
        .select('lead_id')
        .eq('client_id', clientId);
      
      if (leadActionsError) {
        console.error('[LeadsInsightsAPI] Error fetching lead_actions:', leadActionsError);
        throw leadActionsError;
      }
      
      const leadIds = leadActionsData?.map(la => la.lead_id) || [];
      console.log('[LeadsInsightsAPI] Found', leadIds.length, 'leads for client');
      
      if (leadIds.length === 0) {
        console.log('[LeadsInsightsAPI] No leads found for client, returning empty array');
        return NextResponse.json({
          success: true,
          data: [],
          count: 0,
          locale,
        });
      }
      
      query = supabase
        .from('lead_memory')
        .select('name, email, tone_history, confidence_history, urgency_history, relationship_insight, last_updated')
        .in('id', leadIds)
        .eq('archived', false)
        .eq('deleted', false)
        .not('relationship_insight', 'is', null)
        .order('last_updated', { ascending: false })
        .limit(20);
    } else {
      // Admin mode - get all leads
      query = supabase
        .from('lead_memory')
        .select('name, email, tone_history, confidence_history, urgency_history, relationship_insight, last_updated')
        .eq('archived', false)
        .eq('deleted', false)
        .not('relationship_insight', 'is', null)
        .order('last_updated', { ascending: false })
        .limit(20);
    }
    
    const { data, error } = await query;
    const queryDuration = Date.now() - queryStart;

    console.log('[LeadsInsightsAPI] Query completed in', queryDuration, 'ms');
    console.log('[LeadsInsightsAPI] Query result:', {
      success: !error,
      rowCount: data?.length || 0,
      hasError: !!error,
    });

    if (error) {
      console.error('[LeadsInsightsAPI] ============================================');
      console.error('[LeadsInsightsAPI] ❌ Query FAILED');
      console.error('[LeadsInsightsAPI] ============================================');
      console.error('[LeadsInsightsAPI] Error code:', error.code);
      console.error('[LeadsInsightsAPI] Error message:', error.message);
      console.error('[LeadsInsightsAPI] Error details:', error.details);
      console.error('[LeadsInsightsAPI] Error hint:', error.hint);
      console.error('[LeadsInsightsAPI] Full error object:', JSON.stringify(error, null, 2));
      console.error('[LeadsInsightsAPI] ============================================');
      
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log('[LeadsInsightsAPI] ============================================');
      console.log('[LeadsInsightsAPI] ℹ️  No leads with relationship insights found');
      console.log('[LeadsInsightsAPI] ============================================');
      console.log('[LeadsInsightsAPI] This is expected when:');
      console.log('[LeadsInsightsAPI]   - No leads have returned for a second contact');
      console.log('[LeadsInsightsAPI]   - All leads are first-time contacts');
      console.log('[LeadsInsightsAPI]   - relationship_insight is NULL for all leads');
      console.log('[LeadsInsightsAPI] ============================================');
      
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: 'No relationship insights available yet' 
      });
    }

    console.log('[LeadsInsightsAPI] ============================================');
    console.log('[LeadsInsightsAPI] ✅ Found', data.length, 'leads with insights');
    console.log('[LeadsInsightsAPI] ============================================');
    console.log('[LeadsInsightsAPI] Sample data (first lead):');
    if (data[0]) {
      console.log('[LeadsInsightsAPI]   Name:', data[0].name);
      console.log('[LeadsInsightsAPI]   Email:', data[0].email);
      console.log('[LeadsInsightsAPI]   Insight:', data[0].relationship_insight?.substring(0, 80) + '...');
      console.log('[LeadsInsightsAPI]   Last Updated:', data[0].last_updated);
      console.log('[LeadsInsightsAPI]   Tone History Length:', data[0].tone_history?.length || 0);
      console.log('[LeadsInsightsAPI]   Confidence History Length:', data[0].confidence_history?.length || 0);
      console.log('[LeadsInsightsAPI]   Urgency History Length:', data[0].urgency_history?.length || 0);
      
      if (data[0].tone_history && data[0].tone_history.length > 0) {
        console.log('[LeadsInsightsAPI]   Tone History Sample:', data[0].tone_history);
      }
      if (data[0].confidence_history && data[0].confidence_history.length > 0) {
        console.log('[LeadsInsightsAPI]   Confidence History Sample:', data[0].confidence_history);
      }
    }
    
    console.log('[LeadsInsightsAPI] ============================================');
    console.log('[LeadsInsightsAPI] All leads summary:');
    data.forEach((lead: any, idx: number) => {
      console.log(`[LeadsInsightsAPI]   ${idx + 1}. ${lead.name} (${lead.email})`);
      console.log(`[LeadsInsightsAPI]      Insight: ${lead.relationship_insight?.substring(0, 60)}...`);
      console.log(`[LeadsInsightsAPI]      History lengths: tone=${lead.tone_history?.length || 0}, conf=${lead.confidence_history?.length || 0}, urg=${lead.urgency_history?.length || 0}`);
    });
    console.log('[LeadsInsightsAPI] ============================================');

    // Apply locale-aware translation to all data
    console.log(`[LeadsInsightsAPI] Locale detected: ${locale}`);
    const translatedData = await translateRelationshipData(data, locale);
    console.log('[LeadsInsightsAPI] ✅ Translation applied successfully');

    return NextResponse.json({ success: true, data: translatedData }, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300', // Cache for 5 minutes
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error: any) {
    console.error('[LeadsInsightsAPI] ============================================');
    console.error('[LeadsInsightsAPI] ❌ CRITICAL ERROR');
    console.error('[LeadsInsightsAPI] ============================================');
    console.error('[LeadsInsightsAPI] Error type:', error?.constructor?.name || typeof error);
    console.error('[LeadsInsightsAPI] Error message:', error?.message || String(error));
    console.error('[LeadsInsightsAPI] Error stack:', error?.stack || 'N/A');
    console.error('[LeadsInsightsAPI] Full error object:', JSON.stringify(error, null, 2));
    console.error('[LeadsInsightsAPI] ============================================');
    
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

