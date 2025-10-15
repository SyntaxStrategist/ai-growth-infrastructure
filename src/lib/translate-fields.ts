/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";

const translationCache = new Map<string, any>();

// Hardcoded translation maps for common short terms
const TONE_TRANSLATIONS: Record<string, { en: string; fr: string }> = {
  'formal': { en: 'formal', fr: 'formel' },
  'formel': { en: 'formal', fr: 'formel' },
  'casual': { en: 'casual', fr: 'décontracté' },
  'décontracté': { en: 'casual', fr: 'décontracté' },
  'decontracte': { en: 'casual', fr: 'décontracté' },
  'professional': { en: 'professional', fr: 'professionnel' },
  'professionnel': { en: 'professional', fr: 'professionnel' },
  'strategic': { en: 'strategic', fr: 'stratégique' },
  'stratégique': { en: 'strategic', fr: 'stratégique' },
  'strategique': { en: 'strategic', fr: 'stratégique' },
  'direct': { en: 'direct', fr: 'direct' },
  'confident': { en: 'confident', fr: 'confiant' },
  'confiant': { en: 'confident', fr: 'confiant' },
  'urgent': { en: 'urgent', fr: 'urgent' },
  'hesitant': { en: 'hesitant', fr: 'hésitant' },
  'hésitant': { en: 'hesitant', fr: 'hésitant' },
  'curious': { en: 'curious', fr: 'curieux' },
  'curieux': { en: 'curious', fr: 'curieux' },
};

const URGENCY_TRANSLATIONS: Record<string, { en: string; fr: string }> = {
  'high': { en: 'High', fr: 'Élevée' },
  'élevée': { en: 'High', fr: 'Élevée' },
  'elevee': { en: 'High', fr: 'Élevée' },
  'medium': { en: 'Medium', fr: 'Moyenne' },
  'moyenne': { en: 'Medium', fr: 'Moyenne' },
  'low': { en: 'Low', fr: 'Faible' },
  'faible': { en: 'Low', fr: 'Faible' },
  'n/a': { en: 'N/A', fr: 'N/A' },
};

// Helper function to detect language of text (enhanced heuristic)
function detectLanguage(text: string | null | undefined): 'en' | 'fr' | 'unknown' {
  if (!text || text.length < 3) return 'unknown';
  
  const lowerText = text.toLowerCase();
  
  // French indicators (accents + keywords)
  const frenchIndicators = [
    'à', 'é', 'è', 'ê', 'ç', 'œ', 'ù', 'û', 'î', 'ô',
    'demande', 'partenariat', 'entreprise', 'stratégique', 'service',
    'élevée', 'moyenne', 'faible', 'professionnel', 'décontracté',
    'urgence', 'confiance', 'ton', 'intention', 'client', 'solution',
    'opportunité', 'intérêt', 'besoin', 'recherche'
  ];
  
  // English indicators (common words)
  const englishIndicators = [
    'the ', ' is ', ' and ', ' for ', ' with ', ' from ',
    'partnership', 'inquiry', 'support', 'service', 'opportunity',
    'interest', 'need', 'looking', 'want', 'help', 'information',
    'high', 'medium', 'low', 'professional', 'casual', 'urgent'
  ];
  
  const frenchMatches = frenchIndicators.filter(i => lowerText.includes(i)).length;
  const englishMatches = englishIndicators.filter(i => lowerText.includes(i)).length;
  
  // Strong indicators
  if (frenchMatches >= 2) return 'fr';
  if (englishMatches >= 2) return 'en';
  
  // Weak indicators - check for accents
  if (/[àâäéèêëïîôùûüÿæœç]/i.test(text)) return 'fr';
  
  // Default to unknown if can't determine
  return 'unknown';
}

// Helper function to translate short terms using hardcoded maps
function translateShortTerm(
  term: string | null | undefined,
  targetLocale: string,
  fieldName: 'tone' | 'urgency'
): string {
  if (!term || term === 'N/A') return 'N/A';
  
  const normalizedTerm = term.toLowerCase().trim();
  const map = fieldName === 'tone' ? TONE_TRANSLATIONS : URGENCY_TRANSLATIONS;
  const mapping = map[normalizedTerm];
  
  if (mapping) {
    const translated = targetLocale === 'fr' ? mapping.fr : mapping.en;
    if (translated !== term) {
      console.log(`[Translation] Translating ${fieldName} '${term}' → '${translated}'`);
    }
    return translated;
  }
  
  // If not in map, return original
  return term;
}

export async function translateLeadFields(
  fields: {
    id: string;
    ai_summary?: string | null;
    intent?: string | null;
    tone?: string | null;
    urgency?: string | null;
  },
  targetLocale: string
): Promise<{
  ai_summary: string;
  intent: string;
  tone: string;
  urgency: string;
  locale: string;
}> {
  // If fields are empty, return N/A
  if (!fields.ai_summary && !fields.intent && !fields.tone && !fields.urgency) {
    return {
      ai_summary: 'N/A',
      intent: 'N/A',
      tone: 'N/A',
      urgency: 'N/A',
      locale: targetLocale,
    };
  }

  // Check cache using lead ID and locale
  const cacheKey = `translation_${fields.id}_${targetLocale}`;
  
  console.log(`[Translation] Locale detected: ${targetLocale}`);
  
  if (translationCache.has(cacheKey)) {
    const cached = translationCache.get(cacheKey);
    console.log(`[Translation] Using cached translation for lead_${fields.id.slice(-8)} (locale: ${targetLocale})`);
    console.log(`[Translation] Rendering for dashboard locale: ${targetLocale}`);
    console.log(`[Translation] Final AI Summary language: ${targetLocale}`);
    console.log(`[Translation] Final Intent language: ${targetLocale}`);
    return cached;
  }

  // Detect current language of AI summary (not message!)
  const summaryLang = detectLanguage(fields.ai_summary || fields.intent || '');
  
  // ALWAYS force translation if summary language doesn't match dashboard locale
  // OR if we can't detect the language (unknown)
  const needsGptTranslation = summaryLang !== targetLocale || summaryLang === 'unknown';
  
  if (summaryLang === 'unknown') {
    console.log(`[Translation] Dashboard locale=${targetLocale} | summaryLang=unknown | force translation → ${targetLocale === 'fr' ? 'French' : 'English'}`);
  } else if (needsGptTranslation) {
    console.log(`[Translation] Dashboard locale=${targetLocale} | summaryLang=${summaryLang} | force translation → ${targetLocale === 'fr' ? 'French' : 'English'}`);
  } else {
    console.log(`[Translation] Dashboard locale=${targetLocale} | summaryLang=${summaryLang} | skip (already ${targetLocale === 'fr' ? 'French' : 'English'})`);
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const isFrench = targetLocale === 'fr';
    const targetLanguageName = isFrench ? 'French' : 'English';
    
    // If source matches target, skip GPT and just apply hardcoded maps
    let translated: any;
    
    if (!needsGptTranslation) {
      console.log(`[Translation] Skipping GPT - applying hardcoded maps for tone/urgency`);
      translated = {
        ai_summary: fields.ai_summary,
        intent: fields.intent,
        tone: fields.tone,
        urgency: fields.urgency,
      };
    } else {
      // Call GPT to translate
      const prompt = isFrench
      ? `Translate ALL of these lead analysis fields to French. ALWAYS translate every field, even if it's short or looks already localized. Return ONLY JSON with these exact fields:

{
  "ai_summary": "translated summary in French",
  "intent": "translated intent in French",
  "tone": "translated tone in French (examples: formel, décontracté, professionnel, stratégique)",
  "urgency": "translated urgency in French (must be exactly: Faible, Moyenne, or Élevée)"
}

IMPORTANT: Translate ALL fields to French, including short words like "Low" → "Faible", "casual" → "décontracté", etc.

Original fields:
- AI Summary: ${fields.ai_summary || 'N/A'}
- Intent: ${fields.intent || 'N/A'}
- Tone: ${fields.tone || 'N/A'}
- Urgency: ${fields.urgency || 'N/A'}`
      : `Translate ALL of these lead analysis fields to English. ALWAYS translate every field, even if it's short or looks already localized. Return ONLY JSON with these exact fields:

{
  "ai_summary": "translated summary in English",
  "intent": "translated intent in English",
  "tone": "translated tone in English (examples: formal, casual, professional, strategic)",
  "urgency": "translated urgency in English (must be exactly: Low, Medium, or High)"
}

IMPORTANT: Translate ALL fields to English, including short words like "Élevée" → "High", "décontracté" → "casual", etc.

Original fields:
- AI Summary: ${fields.ai_summary || 'N/A'}
- Intent: ${fields.intent || 'N/A'}
- Tone: ${fields.tone || 'N/A'}
- Urgency: ${fields.urgency || 'N/A'}`;

      const systemPrompt = `You are a professional translator. Translate this text into ${targetLanguageName}, preserving tone and business context. ALWAYS translate ALL fields, including short words. Return only valid JSON.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      const content = response.choices?.[0]?.message?.content || "{}";
      translated = JSON.parse(content);
      
      console.log(`[Translation] Translation complete for lead_${fields.id.slice(-8)}`);
    }

    // Apply hardcoded translations for tone and urgency (overrides GPT if needed)
    const translatedTone = translateShortTerm(
      translated.tone || fields.tone,
      targetLocale,
      'tone'
    );
    
    const translatedUrgency = translateShortTerm(
      translated.urgency || fields.urgency,
      targetLocale,
      'urgency'
    );

    const result = {
      ai_summary: translated.ai_summary || fields.ai_summary || 'N/A',
      intent: translated.intent || fields.intent || 'N/A',
      tone: translatedTone,
      urgency: translatedUrgency,
      locale: targetLocale,
    };

    // Cache the result
    translationCache.set(cacheKey, result);
    
    // Final render debug logs
    console.log(`[Translation] Rendering for dashboard locale: ${targetLocale}`);
    console.log(`[Translation] Final AI Summary language: ${targetLocale}`);
    console.log(`[Translation] Final Intent language: ${targetLocale}`);

    return result;
  } catch (error) {
    console.error('[Translation] Failed:', error);
    // On error, still apply hardcoded translations for tone/urgency
    const fallbackTone = translateShortTerm(fields.tone, targetLocale, 'tone');
    const fallbackUrgency = translateShortTerm(fields.urgency, targetLocale, 'urgency');
    
    return {
      ai_summary: fields.ai_summary || 'N/A',
      intent: fields.intent || 'N/A',
      tone: fallbackTone,
      urgency: fallbackUrgency,
      locale: targetLocale,
    };
  }
}

// Export function to clear cache (useful for debugging)
export function clearTranslationCache() {
  translationCache.clear();
  console.log('[Translation] Cache cleared');
}

