/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";

// Simple language detector based on AI summary text (not message!)
function detectLang(text: string): 'en' | 'fr' {
  if (!text) return 'en';
  const frHints = /[àâäçéèêëîïôöùûüÿœ]|(le|la|les|des|un|une|et|ou|mais|pour|avec|sans|chez|entre)\b/i;
  return frHints.test(text) ? 'fr' : 'en';
}

// Hardcoded translation maps (bidirectional)
const MAPS = {
  intent: {
    frToEn: {
      'Partenariat B2B': 'B2B partnership',
      'Demande de support': 'Support inquiry',
      'Exploration de solutions': 'Solution exploration',
      'Demande d\'information': 'Information request',
      'Consultation': 'Consultation',
      'N/A': 'N/A',
    },
    enToFr: {
      'B2B partnership': 'Partenariat B2B',
      'Support inquiry': 'Demande de support',
      'Solution exploration': 'Exploration de solutions',
      'Information request': 'Demande d\'information',
      'Consultation': 'Consultation',
      'N/A': 'N/A',
    },
  },
  tone: {
    frToEn: {
      'décontracté': 'casual',
      'professionnel': 'professional',
      'formel': 'formal',
      'stratégique': 'strategic',
      'confiant': 'confident',
      'urgent': 'urgent',
      'hésitant': 'hesitant',
      'curieux': 'curious',
      'direct': 'direct',
      'N/A': 'N/A',
    },
    enToFr: {
      'casual': 'décontracté',
      'professional': 'professionnel',
      'formal': 'formel',
      'strategic': 'stratégique',
      'confident': 'confiant',
      'urgent': 'urgent',
      'hesitant': 'hésitant',
      'curious': 'curieux',
      'direct': 'direct',
      'N/A': 'N/A',
    },
  },
  urgency: {
    frToEn: {
      'Faible': 'Low',
      'Moyenne': 'Medium',
      'Élevée': 'High',
      'Elevee': 'High',
      'N/A': 'N/A',
    },
    enToFr: {
      'Low': 'Faible',
      'Medium': 'Moyenne',
      'High': 'Élevée',
      'N/A': 'N/A',
    },
  },
};

// OpenAI translation helper
async function openAITranslate(text: string, targetLocale: 'en' | 'fr'): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[Translation] Missing OPENAI_API_KEY - skipping translation');
      return text;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const targetLanguage = targetLocale === 'fr' ? 'French' : 'English';

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: `You are a translator. Output only ${targetLanguage} text. No commentary. Preserve business context and tone.`
        },
        { role: "user", content: text },
      ],
      temperature: 0,
    });

    const translated = response.choices?.[0]?.message?.content?.trim() || text;
    return translated;
  } catch (error) {
    console.error('[Translation] OpenAI translation failed:', error);
    return text;
  }
}

// Main translation function - ALWAYS returns fields in target locale
export async function translateAIFields(
  fields: {
    ai_summary?: string | null;
    intent?: string | null;
    tone?: string | null;
    urgency?: string | null;
  },
  locale: 'en' | 'fr'
): Promise<{
  ai_summary: string;
  intent: string;
  tone: string;
  urgency: string;
}> {
  const toEn = locale === 'en';
  const summaryLang = detectLang(fields.ai_summary || '');
  
  // Select appropriate maps
  const intentMap = toEn ? MAPS.intent.frToEn : MAPS.intent.enToFr;
  const toneMap = toEn ? MAPS.tone.frToEn : MAPS.tone.enToFr;
  const urgencyMap = toEn ? MAPS.urgency.frToEn : MAPS.urgency.enToFr;

  // Apply hardcoded maps
  const intent = fields.intent ? ((intentMap as any)[fields.intent] ?? fields.intent) : 'N/A';
  const tone = fields.tone ? ((toneMap as any)[fields.tone.toLowerCase()] ?? (toneMap as any)[fields.tone] ?? fields.tone) : 'N/A';
  const urgency = fields.urgency ? ((urgencyMap as any)[fields.urgency] ?? fields.urgency) : 'N/A';

  let ai_summary = fields.ai_summary || 'N/A';

  // Force translate summary if source language doesn't match dashboard locale
  const needsTranslation = summaryLang !== locale;
  
  if (ai_summary && ai_summary !== 'N/A' && needsTranslation) {
    console.log(`[Translation] summaryLang=${summaryLang} → ${locale} | forced`);
    ai_summary = await openAITranslate(ai_summary, locale);
  } else if (ai_summary !== 'N/A') {
    console.log(`[Translation] summaryLang=${summaryLang} matches ${locale} | skipped`);
  }

  return { ai_summary, intent, tone, urgency };
}

