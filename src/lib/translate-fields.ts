/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";

const translationCache = new Map<string, any>();

export async function translateLeadFields(
  fields: {
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
}> {
  // If target is English or fields are empty, return as-is
  if (targetLocale === 'en' || !fields.ai_summary) {
    return {
      ai_summary: fields.ai_summary || 'N/A',
      intent: fields.intent || 'N/A',
      tone: fields.tone || 'N/A',
      urgency: fields.urgency || 'N/A',
    };
  }

  // Check cache
  const cacheKey = `${targetLocale}_${fields.ai_summary}_${fields.intent}_${fields.tone}_${fields.urgency}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Translate these lead analysis fields to French. Return ONLY JSON with these exact fields:

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
- Urgency: ${fields.urgency || 'N/A'}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You translate lead analysis fields to French. Return only valid JSON." },
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
    };

    // Cache the result
    translationCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error('[Translation] Failed:', error);
    // Return original on error
    return {
      ai_summary: fields.ai_summary || 'N/A',
      intent: fields.intent || 'N/A',
      tone: fields.tone || 'N/A',
      urgency: fields.urgency || 'N/A',
    };
  }
}

