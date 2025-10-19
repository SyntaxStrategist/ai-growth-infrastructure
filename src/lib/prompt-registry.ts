/**
 * Phase 2.2: Prompt Registry System
 * 
 * Manages prompt variants, versioning, and baseline prompt registration.
 * Provides a centralized system for prompt management and optimization.
 * 
 * Features:
 * - Baseline prompt registration
 * - Prompt variant management
 * - Version control and rollback
 * - Traffic routing for A/B testing
 * - Complete isolation from production systems
 */

import { createClient } from '@supabase/supabase-js';
import { PromptVariant } from './prompt-optimizer';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Baseline prompts for the system
export const BASELINE_PROMPTS = {
  ai_enrichment_en: {
    prompt_name: 'ai_enrichment_en',
    version: '1.0.0',
    variant_id: 'baseline',
    prompt_content: `You are an AI growth analyst. Analyze this lead and return ONLY strict JSON with these exact fields:

{
  "intent": "what the lead wants (B2B partnership, AI scaling, consultation, etc.)",
  "tone": "communication style (formal, casual, urgent, hesitant, confident, etc.)",
  "urgency": "Low" | "Medium" | "High",
  "confidence_score": number between 0 and 1 (e.g. 0.93)
}

Lead message: "{{message}}"
AI summary: "{{aiSummary}}"`,
    prompt_type: 'user' as const,
    language: 'en' as const,
    optimization_strategy: 'baseline',
    is_baseline: true,
    is_active: true,
    traffic_percentage: 100.0,
    tags: ['baseline', 'ai_enrichment', 'english']
  },
  
  ai_enrichment_fr: {
    prompt_name: 'ai_enrichment_fr',
    version: '1.0.0',
    variant_id: 'baseline',
    prompt_content: `Vous êtes un analyste de croissance IA. Analysez ce lead et retournez SEULEMENT du JSON strict avec ces champs exacts :

{
  "intent": "description de l'intention du lead (B2B, scaling, partnership, etc.)",
  "tone": "ton de communication (formel, décontracté, urgent, hésitant, confiant, etc.)",
  "urgency": "Low" | "Medium" | "High",
  "confidence_score": nombre entre 0 et 1 (ex: 0.93)
}

Message du lead: "{{message}}"
Résumé IA: "{{aiSummary}}"`,
    prompt_type: 'user' as const,
    language: 'fr' as const,
    optimization_strategy: 'baseline',
    is_baseline: true,
    is_active: true,
    traffic_percentage: 100.0,
    tags: ['baseline', 'ai_enrichment', 'french']
  }
};

// Optimized prompt variants for testing
export const OPTIMIZED_VARIANTS = {
  ai_enrichment_en_few_shot: {
    prompt_name: 'ai_enrichment_en',
    version: '1.1.0',
    variant_id: 'few_shot_v1',
    prompt_content: `You are an expert AI growth analyst with deep experience in lead qualification and business intelligence. Analyze this lead and return ONLY strict JSON with these exact fields:

{
  "intent": "what the lead wants (B2B partnership, AI scaling, consultation, etc.)",
  "tone": "communication style (formal, casual, urgent, hesitant, confident, etc.)",
  "urgency": "Low" | "Medium" | "High",
  "confidence_score": number between 0 and 1 (e.g. 0.93)
}

Examples:
- High urgency: "We need this implemented ASAP", "This is urgent", "Can we start immediately?"
- Medium urgency: "Looking to implement in the next quarter", "We're planning for Q2", "Timeline is flexible"
- Low urgency: "Just exploring options", "No rush", "Researching possibilities"

Lead message: "{{message}}"
AI summary: "{{aiSummary}}"

Focus on accuracy and consistency in your analysis.`,
    prompt_type: 'user' as const,
    language: 'en' as const,
    optimization_strategy: 'few_shot_enhancement',
    parent_version: '1.0.0',
    generation_method: 'ai_generated' as const,
    is_baseline: false,
    is_active: false,
    traffic_percentage: 0.0,
    tags: ['optimized', 'few_shot', 'ai_enrichment', 'english']
  },
  
  ai_enrichment_en_role_enhanced: {
    prompt_name: 'ai_enrichment_en',
    version: '1.2.0',
    variant_id: 'role_enhanced_v1',
    prompt_content: `You are an expert AI growth analyst with deep experience in lead qualification and business intelligence. You specialize in understanding business intent, communication patterns, and urgency signals. Analyze this lead and return ONLY strict JSON with these exact fields:

{
  "intent": "what the lead wants (B2B partnership, AI scaling, consultation, etc.)",
  "tone": "communication style (formal, casual, urgent, hesitant, confident, etc.)",
  "urgency": "Low" | "Medium" | "High",
  "confidence_score": number between 0 and 1 (e.g. 0.93)
}

Consider the business context, industry trends, and typical lead behavior patterns in your analysis.

Lead message: "{{message}}"
AI summary: "{{aiSummary}}"`,
    prompt_type: 'user' as const,
    language: 'en' as const,
    optimization_strategy: 'role_improvement',
    parent_version: '1.0.0',
    generation_method: 'ai_generated' as const,
    is_baseline: false,
    is_active: false,
    traffic_percentage: 0.0,
    tags: ['optimized', 'role_enhanced', 'ai_enrichment', 'english']
  },
  
  ai_enrichment_fr_few_shot: {
    prompt_name: 'ai_enrichment_fr',
    version: '1.1.0',
    variant_id: 'few_shot_v1',
    prompt_content: `Vous êtes un expert analyste de croissance IA avec une expérience approfondie en qualification de leads et intelligence d'affaires. Analysez ce lead et retournez SEULEMENT du JSON strict avec ces champs exacts :

{
  "intent": "description de l'intention du lead (B2B, scaling, partnership, etc.)",
  "tone": "ton de communication (formel, décontracté, urgent, hésitant, confiant, etc.)",
  "urgency": "Low" | "Medium" | "High",
  "confidence_score": nombre entre 0 et 1 (ex: 0.93)
}

Exemples :
- Urgence élevée : "Nous avons besoin que ce soit implémenté ASAP", "C'est urgent", "Pouvons-nous commencer immédiatement ?"
- Urgence moyenne : "Nous prévoyons d'implémenter au prochain trimestre", "Nous planifions pour Q2", "L'échéancier est flexible"
- Urgence faible : "Nous explorons simplement les options", "Pas de presse", "Recherche de possibilités"

Message du lead: "{{message}}"
Résumé IA: "{{aiSummary}}"

Concentrez-vous sur la précision et la cohérence dans votre analyse.`,
    prompt_type: 'user' as const,
    language: 'fr' as const,
    optimization_strategy: 'few_shot_enhancement',
    parent_version: '1.0.0',
    generation_method: 'ai_generated' as const,
    is_baseline: false,
    is_active: false,
    traffic_percentage: 0.0,
    tags: ['optimized', 'few_shot', 'ai_enrichment', 'french']
  }
};

/**
 * Initialize the prompt registry with baseline prompts
 */
export async function initializePromptRegistry(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[PromptRegistry] Initializing prompt registry with baseline prompts...');
    
    // Register baseline prompts
    for (const [key, prompt] of Object.entries(BASELINE_PROMPTS)) {
      const { success, error } = await registerPromptVariant(prompt);
      if (!success) {
        console.error(`[PromptRegistry] Failed to register baseline prompt ${key}:`, error);
        return { success: false, error: `Failed to register ${key}: ${error}` };
      }
    }
    
    // Register optimized variants
    for (const [key, prompt] of Object.entries(OPTIMIZED_VARIANTS)) {
      const { success, error } = await registerPromptVariant(prompt);
      if (!success) {
        console.error(`[PromptRegistry] Failed to register optimized variant ${key}:`, error);
        // Don't fail initialization for optimized variants
      }
    }
    
    console.log('[PromptRegistry] ✅ Prompt registry initialized successfully');
    return { success: true };

  } catch (error) {
    console.error('[PromptRegistry] Error initializing prompt registry:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Register a prompt variant
 */
async function registerPromptVariant(variant: PromptVariant): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('prompt_registry')
      .insert({
        prompt_name: variant.prompt_name,
        version: variant.version,
        variant_id: variant.variant_id,
        prompt_content: variant.prompt_content,
        prompt_type: variant.prompt_type,
        language: variant.language,
        optimization_strategy: variant.optimization_strategy,
        parent_version: variant.parent_version,
        generation_method: variant.generation_method || 'manual',
        is_active: variant.is_active || false,
        is_baseline: variant.is_baseline || false,
        traffic_percentage: variant.traffic_percentage || 0.0,
        overall_score: variant.overall_score || 0.0,
        accuracy_score: variant.accuracy_score || 0.0,
        response_time_score: variant.response_time_score || 0.0,
        consistency_score: variant.consistency_score || 0.0,
        user_satisfaction_score: variant.user_satisfaction_score || 0.0,
        metadata: variant.metadata,
        tags: variant.tags || []
      })
      .select('id')
      .single();

    if (error) {
      // Check if it's a duplicate key error (already exists)
      if (error.code === '23505') {
        console.log(`[PromptRegistry] Prompt variant already exists: ${variant.prompt_name} v${variant.version} (${variant.variant_id})`);
        return { success: true };
      }
      return { success: false, error: error.message };
    }

    console.log(`[PromptRegistry] ✅ Registered prompt variant: ${variant.prompt_name} v${variant.version} (${variant.variant_id})`);
    return { success: true };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get active prompt variant for a given prompt name and language
 */
export async function getActivePromptVariant(
  promptName: string,
  language: string = 'en'
): Promise<{ success: boolean; variant?: PromptVariant; error?: string }> {
  try {
    console.log(`[PromptRegistry] Getting active prompt variant: ${promptName} (${language})`);
    
    const { data, error } = await supabase
      .from('prompt_registry')
      .select('*')
      .eq('prompt_name', promptName)
      .eq('language', language)
      .eq('is_active', true)
      .order('overall_score', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[PromptRegistry] Failed to get active prompt variant:', error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      console.log(`[PromptRegistry] No active variant found for: ${promptName} (${language})`);
      return { success: true, variant: undefined };
    }

    const variant = data[0];
    console.log(`[PromptRegistry] ✅ Active variant found: ${variant.variant_id} (score: ${variant.overall_score})`);
    
    return { success: true, variant };

  } catch (error) {
    console.error('[PromptRegistry] Error getting active prompt variant:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get all variants for a prompt name
 */
export async function getPromptVariants(
  promptName: string,
  language?: string
): Promise<{ success: boolean; variants?: PromptVariant[]; error?: string }> {
  try {
    console.log(`[PromptRegistry] Getting prompt variants: ${promptName}${language ? ` (${language})` : ''}`);
    
    let query = supabase
      .from('prompt_registry')
      .select('*')
      .eq('prompt_name', promptName);
    
    if (language) {
      query = query.eq('language', language);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[PromptRegistry] Failed to get prompt variants:', error);
      return { success: false, error: error.message };
    }

    console.log(`[PromptRegistry] ✅ Found ${data?.length || 0} variants for: ${promptName}`);
    return { success: true, variants: data || [] };

  } catch (error) {
    console.error('[PromptRegistry] Error getting prompt variants:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Activate a prompt variant
 */
export async function activatePromptVariant(
  promptName: string,
  variantId: string,
  version: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[PromptRegistry] Activating prompt variant: ${promptName} v${version} (${variantId})`);
    
    // First, deactivate all other variants for this prompt
    const { error: deactivateError } = await supabase
      .from('prompt_registry')
      .update({ is_active: false })
      .eq('prompt_name', promptName);

    if (deactivateError) {
      console.error('[PromptRegistry] Failed to deactivate other variants:', deactivateError);
      return { success: false, error: deactivateError.message };
    }

    // Activate the specified variant
    const { error: activateError } = await supabase
      .from('prompt_registry')
      .update({ 
        is_active: true,
        activated_at: new Date().toISOString()
      })
      .eq('prompt_name', promptName)
      .eq('variant_id', variantId)
      .eq('version', version);

    if (activateError) {
      console.error('[PromptRegistry] Failed to activate variant:', activateError);
      return { success: false, error: activateError.message };
    }

    console.log(`[PromptRegistry] ✅ Prompt variant activated: ${promptName} v${version} (${variantId})`);
    return { success: true };

  } catch (error) {
    console.error('[PromptRegistry] Error activating prompt variant:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get prompt content with variable substitution
 */
export function getPromptContent(
  variant: PromptVariant,
  variables: Record<string, string>
): string {
  let content = variant.prompt_content;
  
  // Replace variables in the format {{variableName}}
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    content = content.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return content;
}

/**
 * Get baseline prompt for a given name and language
 */
export function getBaselinePrompt(promptName: string, language: string = 'en'): PromptVariant | null {
  const key = `${promptName}_${language}` as keyof typeof BASELINE_PROMPTS;
  return BASELINE_PROMPTS[key] || null;
}

/**
 * Get optimized variant for a given name and language
 */
export function getOptimizedVariant(promptName: string, language: string = 'en', strategy: string = 'few_shot'): PromptVariant | null {
  const key = `${promptName}_${language}_${strategy}` as keyof typeof OPTIMIZED_VARIANTS;
  return OPTIMIZED_VARIANTS[key] || null;
}
