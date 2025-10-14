/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";

export type LeadEnrichment = {
  intent: string;
  tone: string;
  urgency: "Low" | "Medium" | "High";
  confidence_score: number;
};

export async function enrichLeadWithAI(params: {
  message: string;
  aiSummary: string;
  language: string;
}): Promise<LeadEnrichment> {
  const { message, aiSummary, language } = params;
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const isFrench = language === 'fr';
  
  const enrichmentPrompt = isFrench
    ? `Vous êtes un analyste de croissance IA. Analysez ce lead et retournez SEULEMENT du JSON strict avec ces champs exacts :

{
  "intent": "description de l'intention du lead (B2B, scaling, partnership, etc.)",
  "tone": "ton de communication (formel, décontracté, urgent, hésitant, confiant, etc.)",
  "urgency": "Low" | "Medium" | "High",
  "confidence_score": nombre entre 0 et 1 (ex: 0.93)
}

Message du lead: "${message}"
Résumé IA: "${aiSummary}"`
    : `You are an AI growth analyst. Analyze this lead and return ONLY strict JSON with these exact fields:

{
  "intent": "what the lead wants (B2B partnership, AI scaling, consultation, etc.)",
  "tone": "communication style (formal, casual, urgent, hesitant, confident, etc.)",
  "urgency": "Low" | "Medium" | "High",
  "confidence_score": number between 0 and 1 (e.g. 0.93)
}

Lead message: "${message}"
AI summary: "${aiSummary}"`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a growth intelligence system. Return only valid JSON without markdown, explanations, or extra text." 
        },
        { role: "user", content: enrichmentPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    return {
      intent: parsed.intent || "Unknown",
      tone: parsed.tone || "Neutral",
      urgency: ["Low", "Medium", "High"].includes(parsed.urgency) ? parsed.urgency : "Medium",
      confidence_score: Math.max(0, Math.min(1, Number(parsed.confidence_score) || 0.5)),
    };
  } catch (error) {
    console.error('[AI Enrichment] Failed:', error instanceof Error ? error.message : error);
    
    // Return safe defaults on failure
    return {
      intent: "Unknown",
      tone: "Neutral",
      urgency: "Medium",
      confidence_score: 0.5,
    };
  }
}

