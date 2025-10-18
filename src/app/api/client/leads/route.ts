import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to translate text values
function translateValue(value: string, locale: string, type: 'tone' | 'intent' | 'urgency'): string {
  if (!value) return value;
  
  const valueLower = value.toLowerCase();
  
  if (locale === 'fr') {
    // English to French
    const translations: Record<string, Record<string, string>> = {
      tone: {
        'formal': 'Formel',
        'urgent': 'Urgent',
        'casual': 'Décontracté',
        'professional': 'Professionnel',
        'friendly': 'Amical',
        'business': 'Affaires',
      },
      intent: {
        'b2b partnership': 'Partenariat B2B',
        'consultation': 'Consultation',
        'sales inquiry': 'Demande de vente',
        'support': 'Support',
        'information': 'Information',
        'demo request': 'Demande de démo',
      },
      urgency: {
        'high': 'Haute',
        'medium': 'Moyenne',
        'low': 'Faible',
      }
    };
    
    const translated = translations[type]?.[valueLower];
    if (translated) return translated;
  } else if (locale === 'en') {
    // French to English
    const translations: Record<string, Record<string, string>> = {
      tone: {
        'formel': 'Formal',
        'urgent': 'Urgent',
        'décontracté': 'Casual',
        'professionnel': 'Professional',
        'amical': 'Friendly',
        'affaires': 'Business',
      },
      intent: {
        'partenariat b2b': 'B2B partnership',
        'consultation': 'Consultation',
        'demande de vente': 'Sales inquiry',
        'support': 'Support',
        'information': 'Information',
        'demande de démo': 'Demo request',
      },
      urgency: {
        'haute': 'High',
        'élevée': 'High',
        'moyenne': 'Medium',
        'faible': 'Low',
      }
    };
    
    const translated = translations[type]?.[valueLower];
    if (translated) return translated;
  }
  
  // Capitalize first letter
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Helper function to detect if text is in French
function detectFrench(text: string): boolean {
  if (!text) return false;
  
  const frenchIndicators = [
    'entreprise', 'demande', 'besoin', 'équipe', 'secteur',
    'québec', 'montréal', 'rénovation', 'automatisation',
    'nous', 'pour', 'avec', 'dans', 'cette', 'sont'
  ];
  
  const textLower = text.toLowerCase();
  const frenchMatches = frenchIndicators.filter(indicator => textLower.includes(indicator)).length;
  
  return frenchMatches >= 2; // At least 2 French indicators
}

// Helper function to detect if text is in English
function detectEnglish(text: string): boolean {
  if (!text) return false;
  
  const englishIndicators = [
    'company', 'business', 'need', 'team', 'looking',
    'automation', 'inquiry', 'support', 'service',
    'we', 'for', 'with', 'this', 'are', 'have'
  ];
  
  const textLower = text.toLowerCase();
  const englishMatches = englishIndicators.filter(indicator => textLower.includes(indicator)).length;
  
  return englishMatches >= 2; // At least 2 English indicators
}

// Helper function to translate text (AI summary, relationship insight, etc.)
async function translateText(text: string, targetLocale: string, context: string = 'text'): Promise<string> {
  if (!text || !process.env.OPENAI_API_KEY) return text;
  
  // Detect if translation is needed
  const isFrench = detectFrench(text);
  const isEnglish = detectEnglish(text);
  
  // Don't translate if already in target language
  if (targetLocale === 'fr' && isFrench && !isEnglish) {
    console.log(`[Dashboard i18n] ${context} already in French — no translation needed`);
    return text;
  }
  if (targetLocale === 'en' && isEnglish && !isFrench) {
    console.log(`[Dashboard i18n] ${context} already in English — no translation needed`);
    return text;
  }
  
  // If mixed or unclear, assume translation is needed if going to French and not clearly French
  const needsTranslation = (targetLocale === 'fr' && !isFrench) || (targetLocale === 'en' && !isEnglish);
  
  if (!needsTranslation) {
    return text;
  }
  
  try {
    const fromLang = targetLocale === 'fr' ? 'English' : 'French';
    const toLang = targetLocale === 'fr' ? 'French' : 'English';
    
    console.log(`[Dashboard i18n] Translated ${context} → ${toLang.toUpperCase()} (was ${fromLang.toUpperCase()})`);
    
    const systemPrompt = targetLocale === 'fr'
      ? 'You are a professional translator. Translate to natural French, keeping business tone and technical accuracy. Return ONLY the translation, no explanations.'
      : 'You are a professional translator. Translate to natural English, keeping business tone and technical accuracy. Return ONLY the translation, no explanations.';
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });
    
    return completion.choices[0].message.content?.trim() || text;
  } catch (error) {
    console.warn('[ClientLeads] ⚠️ Translation failed, using original:', error);
    return text;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const locale = searchParams.get('locale') || 'en';
    const status = searchParams.get('status') || 'active';

    console.log('[E2E-Test] [ClientLeads] ============================================');
    console.log('[E2E-Test] [ClientLeads] Request received');
    console.log('[E2E-Test] [ClientLeads] Client ID:', clientId);
    console.log('[E2E-Test] [ClientLeads] Locale:', locale);
    console.log('[E2E-Test] [ClientLeads] Status filter:', status);

    // Validate clientId
    if (!clientId || clientId.trim() === '' || clientId === 'unknown' || clientId === 'null' || clientId === 'undefined') {
      console.error('[E2E-Test] [ClientLeads] ❌ Missing or invalid clientId parameter:', clientId);
      return NextResponse.json(
        { success: false, error: 'Valid clientId required' },
        { status: 400 }
      );
    }

    // First, get the client's UUID from the TEXT client_id
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, client_id')
      .eq('client_id', clientId)
      .single();
    
    if (clientError || !clientData) {
      console.error('[E2E-Test] [ClientLeads] ❌ Client not found:', clientId);
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }
    
    const clientUuid = clientData.id;
    console.log('[E2E-Test] [ClientLeads] Client UUID:', clientUuid);
    
    // Fetch leads by joining lead_actions with lead_memory
    // lead_actions.client_id identifies which client owns the lead (stores UUID)
    // lead_actions.lead_id links to lead_memory.id
    console.log('[E2E-Test] [ClientLeads] Building query to join lead_actions with lead_memory');
    console.log('[E2E-Test] [ClientLeads] Query: SELECT lead_memory.*, lead_actions.client_id, lead_actions.tag');
    console.log('[E2E-Test] [ClientLeads] JOIN: lead_actions.lead_id = lead_memory.id');
    console.log('[E2E-Test] [ClientLeads] WHERE: lead_actions.client_id = ' + clientUuid);
    console.log('[E2E-Test] [ClientLeads] Filter: status = ' + status);

    const { data: leadActions, error: actionsError } = await supabase
      .from('lead_actions')
      .select(`
        client_id,
        tag,
        lead_id,
        lead_memory:lead_id (
          id,
          name,
          email,
          message,
          ai_summary,
          language,
          timestamp,
          intent,
          tone,
          urgency,
          confidence_score,
          archived,
          deleted,
          current_tag,
          relationship_insight,
          last_updated
        )
      `)
      .eq('client_id', clientUuid)
      .order('created_at', { ascending: false });

    console.log('[E2E-Test] [ClientLeads] Query executed');
    console.log('[E2E-Test] [ClientLeads] Supabase response:', {
      hasData: !!leadActions,
      rowCount: leadActions?.length || 0,
      hasError: !!actionsError,
      errorMessage: actionsError?.message || 'none',
      errorCode: actionsError?.code || 'none',
    });

    if (actionsError) {
      console.error('[E2E-Test] [ClientLeads] ❌ Database error:', actionsError);
      console.error('[E2E-Test] [ClientLeads] ❌ Error details:', {
        message: actionsError.message,
        code: actionsError.code,
        hint: actionsError.hint,
        details: actionsError.details,
      });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leads: ' + actionsError.message },
        { status: 500 }
      );
    }

    // Transform the joined data
    const leadsRaw = (leadActions || [])
      .filter(action => {
        const leadMemory = Array.isArray(action.lead_memory) ? action.lead_memory[0] : action.lead_memory;
        if (!leadMemory) return false;
        
        // Filter by status
        if (status === 'active') {
          return !leadMemory.deleted && !leadMemory.archived;
        } else if (status === 'archived') {
          return leadMemory.archived && !leadMemory.deleted;
        } else if (status === 'deleted') {
          return leadMemory.deleted;
        }
        return true;
      })
      .map(action => {
        const leadMemory = Array.isArray(action.lead_memory) ? action.lead_memory[0] : action.lead_memory;
        return {
          ...leadMemory,
          client_id: action.client_id,
          action_tag: action.tag,
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Translate leads based on locale
    console.log('[ClientLeads] 🔄 Translating', leadsRaw.length, 'leads to locale:', locale.toUpperCase());
    console.log('[ClientLeads] Target language:', locale === 'fr' ? 'French' : 'English');
    console.log('');
    
    const leads = await Promise.all(leadsRaw.map(async (lead, index) => {
      console.log(`[ClientLeads] [${index + 1}/${leadsRaw.length}] Processing lead: ${lead.name} (original: ${lead.language})`);
      
      // Translate ai_summary to match dashboard locale
      const translatedSummary = await translateText(
        lead.ai_summary || '',
        locale,
        `ai_summary for ${lead.name}`
      );
      
      // Translate relationship_insight to match dashboard locale
      const translatedInsight = lead.relationship_insight
        ? await translateText(
            lead.relationship_insight,
            locale,
            `relationship_insight for ${lead.name}`
          )
        : undefined;
      
      // Translate values
      const translatedTone = translateValue(lead.tone || '', locale, 'tone');
      const translatedIntent = translateValue(lead.intent || '', locale, 'intent');
      const translatedUrgency = translateValue(lead.urgency || '', locale, 'urgency');
      
      console.log(`[ClientLeads]   → tone: "${lead.tone}" → "${translatedTone}"`);
      console.log(`[ClientLeads]   → intent: "${lead.intent}" → "${translatedIntent}"`);
      console.log(`[ClientLeads]   → urgency: "${lead.urgency}" → "${translatedUrgency}"`);
      console.log('');
      
      return {
        ...lead,
        ai_summary: translatedSummary,
        relationship_insight: translatedInsight,
        tone: translatedTone,
        intent: translatedIntent,
        urgency: translatedUrgency,
      };
    }));

    console.log('[E2E-Test] [ClientLeads] ✅ Found', leadActions?.length || 0, 'lead actions for client', clientId);
    console.log('[E2E-Test] [ClientLeads] ✅ Filtered to', leads.length, status, 'leads');
    console.log('[E2E-Test] [ClientLeads] ✅ Client-scoped data loaded successfully');
    
    if (leads.length > 0) {
      console.log('[E2E-Test] [ClientLeads] Sample lead:', {
        id: leads[0].id,
        name: leads[0].name,
        email: leads[0].email,
        intent: leads[0].intent,
        client_id: leads[0].client_id,
      });
    }

    return NextResponse.json({
      success: true,
      data: leads,
    });

  } catch (error) {
    console.error('[E2E-Test] [ClientLeads] ❌ Unexpected error:', error);
    console.error('[E2E-Test] [ClientLeads] ❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

