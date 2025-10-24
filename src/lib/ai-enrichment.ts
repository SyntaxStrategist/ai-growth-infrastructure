/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";
import { logPerformanceMetric } from "./feedback-processor";
import { getActivePromptVariant, getPromptContent } from "./prompt-registry";
import { executePromptWithTracking } from "./prompt-optimizer";

export type LeadEnrichment = {
  intent: string;
  tone: string;
  urgency: "Low" | "Medium" | "High";
  confidence_score: number;
};

/**
 * Enhanced AI enrichment with prompt optimization (Phase 2.2)
 * Uses the prompt optimization system while maintaining backward compatibility
 */
export async function enrichLeadWithAIOptimized(params: {
  message: string;
  aiSummary: string;
  language: string;
  clientId?: string;
  requestId?: string;
  useOptimization?: boolean;
}): Promise<LeadEnrichment> {
  const { message, aiSummary, language, clientId, requestId, useOptimization = true } = params;
  
  if (!useOptimization) {
    // Fallback to original function for backward compatibility
    return enrichLeadWithAI({ message, aiSummary, language });
  }

  try {
    console.log('[AI Enrichment] Using optimized prompt system...');
    
    const promptName = `ai_enrichment_${language}`;
    const inputData = {
      message,
      aiSummary
    };

    const options = {
      clientId,
      requestId,
      environment: 'production' as const,
      metadata: {
        language,
        message_length: message.length,
        ai_summary_length: aiSummary.length
      }
    };

    // Execute with prompt optimization
    const { success, output, executionId, error } = await executePromptWithTracking(
      promptName,
      inputData,
      options
    );

    if (!success || !output) {
      console.error('[AI Enrichment] Optimized prompt execution failed:', error);
      // Fallback to original function
      return enrichLeadWithAI({ message, aiSummary, language });
    }

    // Validate and format output
    const enrichment = {
      intent: output.intent || "Unknown",
      tone: output.tone || "Neutral",
      urgency: ["Low", "Medium", "High"].includes(output.urgency) ? output.urgency : "Medium",
      confidence_score: Math.max(0, Math.min(1, Number(output.confidence_score) || 0.5)),
    };

    console.log('[AI Enrichment] ✅ Optimized enrichment complete:', {
      intent: enrichment.intent,
      tone: enrichment.tone,
      urgency: enrichment.urgency,
      confidence: enrichment.confidence_score,
      executionId
    });

    return enrichment;

  } catch (error) {
    console.error('[AI Enrichment] Error in optimized enrichment:', error);
    // Fallback to original function
    return enrichLeadWithAI({ message, aiSummary, language });
  }
}

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
  "intent": "description de l'intention du lead",
  "tone": "ton de communication (formel, décontracté, urgent, hésitant, confiant, etc.)",
  "urgency": "Low" | "Medium" | "High",
  "confidence_score": nombre entre 0 et 1 (ex: 0.93)
}

CATÉGORIES D'INTENTION:
- "Demande de devis" : pour les demandes de prix/estimations (rénovation, construction, services)
- "Demande de service" : pour les demandes de services (réparation, installation, etc.)
- "Partenariat B2B" : pour les collaborations d'entreprise, alliances stratégiques
- "Consultation" : pour les demandes de conseil professionnel
- "Information générale" : pour les questions générales
- "Support technique" : pour les problèmes techniques

EXEMPLES:
- "J'ai besoin d'un devis pour rénovation cuisine" → "Demande de devis"
- "Nous voulons collaborer avec votre entreprise" → "Partenariat B2B"
- "J'ai un problème avec mon système" → "Support technique"

Message du lead: "${message}"
Résumé IA: "${aiSummary}"`
    : `You are an AI growth analyst. Analyze this lead and return ONLY strict JSON with these exact fields:

{
  "intent": "what the lead wants",
  "tone": "communication style (formal, casual, urgent, hesitant, confident, etc.)",
  "urgency": "Low" | "Medium" | "High",
  "confidence_score": number between 0 and 1 (e.g. 0.93)
}

INTENT CATEGORIES:
- "Quote Request" : for price/estimate requests (renovation, construction, services)
- "Service Request" : for service requests (repair, installation, etc.)
- "B2B Partnership" : for business collaborations, strategic alliances
- "Consultation" : for professional advice requests
- "General Information" : for general questions
- "Technical Support" : for technical issues

EXAMPLES:
- "I need a quote for kitchen renovation" → "Quote Request"
- "We want to partner with your company" → "B2B Partnership"
- "I have a problem with my system" → "Technical Support"

Lead message: "${message}"
AI summary: "${aiSummary}"`;

  const startTime = Date.now();
  
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
    const responseTime = Date.now() - startTime;

    const enrichment = {
      intent: parsed.intent || "Unknown",
      tone: parsed.tone || "Neutral",
      urgency: ["Low", "Medium", "High"].includes(parsed.urgency) ? parsed.urgency : "Medium",
      confidence_score: Math.max(0, Math.min(1, Number(parsed.confidence_score) || 0.5)),
    };

    // Log AI analysis performance metrics silently
    logPerformanceMetric(
      'ai_analysis',
      'response_time',
      responseTime,
      'ai_enrichment_analysis',
      {
        metadata: {
          model: 'gpt-4o-mini',
          language: language,
          message_length: message.length,
          ai_summary_length: aiSummary.length,
          confidence_score: enrichment.confidence_score,
          intent: enrichment.intent,
          tone: enrichment.tone,
          urgency: enrichment.urgency
        }
      }
    ).catch(() => {
      // Silent failure - don't affect existing functionality
    });

    return enrichment;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('[AI Enrichment] Failed:', error instanceof Error ? error.message : error);
    
    // Log error performance metrics silently
    logPerformanceMetric(
      'ai_analysis',
      'error_count',
      1,
      'ai_enrichment_analysis',
      {
        metadata: {
          model: 'gpt-4o-mini',
          language: language,
          message_length: message.length,
          ai_summary_length: aiSummary.length,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          response_time_ms: responseTime
        },
        errorMessageEn: error instanceof Error ? error.message : 'AI enrichment failed',
        errorMessageFr: error instanceof Error ? error.message : 'Enrichissement IA échoué'
      }
    ).catch(() => {
      // Silent failure - don't affect existing functionality
    });
    
    // Return safe defaults on failure
    return {
      intent: "Unknown",
      tone: "Neutral",
      urgency: "Medium",
      confidence_score: 0.5,
    };
  }
}

