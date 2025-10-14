/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";

const translationCache = new Map<string, any>();

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
  const cacheKey = `${fields.id}_${targetLocale}`;
  if (translationCache.has(cacheKey)) {
    console.log(`[Translation] Using cached translation for ${fields.id} (${targetLocale})`);
    return translationCache.get(cacheKey);
  }

  console.log(`[Translation] Forcing translation for lead ${fields.id} to ${targetLocale}`);

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const isFrench = targetLocale === 'fr';
    
    const prompt = isFrench
      ? `Translate these lead analysis fields to French. Return ONLY JSON with these exact fields:

{
  "ai_summary": "translated summary",
  "intent": "translated intent",
  "tone": "translated tone",
  "urgency": "translated urgency (must be: Faible, Moyenne, or Élevée)"
}

Original fields:
- AI Summary: ${fields.ai_summary || 'N/A'}
- Intent: ${fields.intent || 'N/A'}
- Tone: ${fields.tone || 'N/A'}
- Urgency: ${fields.urgency || 'N/A'}`
      : `Translate these lead analysis fields to English. Return ONLY JSON with these exact fields:

{
  "ai_summary": "translated summary",
  "intent": "translated intent",
  "tone": "translated tone",
  "urgency": "translated urgency (must be: Low, Medium, or High)"
}

Original fields:
- AI Summary: ${fields.ai_summary || 'N/A'}
- Intent: ${fields.intent || 'N/A'}
- Tone: ${fields.tone || 'N/A'}
- Urgency: ${fields.urgency || 'N/A'}`;

    const systemPrompt = isFrench
      ? "You translate lead analysis fields to French. Return only valid JSON."
      : "You translate lead analysis fields to English. Return only valid JSON.";

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
    const translated = JSON.parse(content);

    const result = {
      ai_summary: translated.ai_summary || fields.ai_summary || 'N/A',
      intent: translated.intent || fields.intent || 'N/A',
      tone: translated.tone || fields.tone || 'N/A',
      urgency: translated.urgency || fields.urgency || 'N/A',
      locale: targetLocale,
    };

    // Cache the result
    translationCache.set(cacheKey, result);
    console.log(`[Translation] Translation complete and cached for ${fields.id} (${targetLocale})`);

    return result;
  } catch (error) {
    console.error('[Translation] Failed:', error);
    // Return original on error
    return {
      ai_summary: fields.ai_summary || 'N/A',
      intent: fields.intent || 'N/A',
      tone: fields.tone || 'N/A',
      urgency: fields.urgency || 'N/A',
      locale: targetLocale,
    };
  }
}

// Export function to clear cache (useful for debugging)
export function clearTranslationCache() {
  translationCache.clear();
  console.log('[Translation] Cache cleared');
}

