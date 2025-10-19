/**
 * Phase 2.2: Prompt Optimization Engine
 * 
 * Automatically tests and evolves prompts using feedback and performance data.
 * Maintains full isolation and backward compatibility with production systems.
 * 
 * Features:
 * - Prompt variant management and versioning
 * - A/B testing of prompt variants
 * - Automated prompt evolution based on feedback
 * - Performance scoring and optimization
 * - Complete isolation from production systems
 */

import { createClient } from '@supabase/supabase-js';
import { logPerformanceMetric, logFeedback } from './feedback-processor';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types for prompt optimization
export interface PromptVariant {
  id?: string;
  prompt_name: string;
  version: string;
  variant_id: string;
  prompt_content: string;
  prompt_type: 'system' | 'user' | 'few_shot' | 'chain_of_thought';
  language: 'en' | 'fr' | 'auto';
  optimization_strategy?: string;
  parent_version?: string;
  generation_method?: 'manual' | 'ai_generated' | 'evolutionary' | 'ab_test';
  is_active?: boolean;
  is_baseline?: boolean;
  traffic_percentage?: number;
  overall_score?: number;
  accuracy_score?: number;
  response_time_score?: number;
  consistency_score?: number;
  user_satisfaction_score?: number;
  total_uses?: number;
  successful_uses?: number;
  failed_uses?: number;
  avg_response_time_ms?: number;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface PromptExecution {
  id?: string;
  prompt_registry_id: string;
  execution_id: string;
  request_id?: string;
  client_id?: string;
  input_data: Record<string, any>;
  input_hash?: string;
  output_data: Record<string, any>;
  output_quality_score?: number;
  response_time_ms: number;
  token_count?: number;
  cost_usd?: number;
  accuracy_score?: number;
  consistency_score?: number;
  completeness_score?: number;
  error_occurred?: boolean;
  error_message?: string;
  error_type?: string;
  feedback_id?: string;
  user_rating?: number;
  metadata?: Record<string, any>;
  environment?: 'production' | 'staging' | 'test';
}

export interface ABTestConfig {
  test_name: string;
  test_description?: string;
  prompt_name: string;
  control_variant_id: string;
  treatment_variant_id: string;
  control_traffic_percentage?: number;
  treatment_traffic_percentage?: number;
  min_sample_size?: number;
  max_duration_days?: number;
  significance_level?: number;
}

export interface PromptOptimizationOptions {
  clientId?: string;
  requestId?: string;
  environment?: 'production' | 'staging' | 'test';
  metadata?: Record<string, any>;
}

/**
 * Register a new prompt variant
 */
export async function registerPromptVariant(
  variant: Omit<PromptVariant, 'id' | 'total_uses' | 'successful_uses' | 'failed_uses' | 'avg_response_time_ms'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    console.log(`[PromptOptimizer] Registering prompt variant: ${variant.prompt_name} v${variant.version} (${variant.variant_id})`);
    
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
      console.error('[PromptOptimizer] Failed to register prompt variant:', error);
      return { success: false, error: error.message };
    }

    console.log(`[PromptOptimizer] ✅ Prompt variant registered: ${data.id}`);
    return { success: true, id: data.id };

  } catch (error) {
    console.error('[PromptOptimizer] Error registering prompt variant:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get the best performing prompt variant for a given prompt name
 */
export async function getBestPromptVariant(
  promptName: string,
  minExecutions: number = 10
): Promise<{ success: boolean; variant?: PromptVariant; error?: string }> {
  try {
    console.log(`[PromptOptimizer] Getting best prompt variant for: ${promptName}`);
    
    const { data, error } = await supabase
      .rpc('get_best_prompt_variant', {
        p_prompt_name: promptName,
        p_min_executions: minExecutions
      });

    if (error) {
      console.error('[PromptOptimizer] Failed to get best prompt variant:', error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      console.log(`[PromptOptimizer] No variants found for prompt: ${promptName}`);
      return { success: true, variant: undefined };
    }

    const bestVariant = data[0];
    console.log(`[PromptOptimizer] ✅ Best variant found: ${bestVariant.variant_id} (score: ${bestVariant.overall_score})`);
    
    return { success: true, variant: bestVariant };

  } catch (error) {
    console.error('[PromptOptimizer] Error getting best prompt variant:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Execute a prompt and track performance
 */
export async function executePromptWithTracking(
  promptName: string,
  inputData: Record<string, any>,
  options: PromptOptimizationOptions = {}
): Promise<{ success: boolean; output?: any; executionId?: string; error?: string }> {
  try {
    console.log(`[PromptOptimizer] Executing prompt: ${promptName}`);
    
    // Get the best prompt variant
    const { success: variantSuccess, variant, error: variantError } = await getBestPromptVariant(promptName);
    
    if (!variantSuccess || !variant) {
      console.error('[PromptOptimizer] Failed to get prompt variant:', variantError);
      return { success: false, error: variantError };
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // Execute the prompt (this would integrate with your AI service)
    const output = await executePromptVariant(variant, inputData);
    const responseTime = Date.now() - startTime;

    // Calculate quality scores
    const qualityScores = await calculateQualityScores(variant, inputData, output, responseTime);

    // Log execution performance
    const execution: Omit<PromptExecution, 'id'> = {
      prompt_registry_id: variant.id!,
      execution_id: executionId,
      request_id: options.requestId,
      client_id: options.clientId,
      input_data: inputData,
      input_hash: generateInputHash(inputData),
      output_data: output,
      output_quality_score: qualityScores.overall,
      response_time_ms: responseTime,
      accuracy_score: qualityScores.accuracy,
      consistency_score: qualityScores.consistency,
      completeness_score: qualityScores.completeness,
      error_occurred: false,
      metadata: options.metadata,
      environment: options.environment || 'production'
    };

    await logPromptExecution(execution);

    // Log performance metrics
    await logPerformanceMetric(
      'ai_analysis',
      'prompt_execution_time',
      responseTime,
      'prompt_optimizer',
      {
        clientId: options.clientId,
        metadata: {
          prompt_name: promptName,
          variant_id: variant.variant_id,
          execution_id: executionId,
          quality_score: qualityScores.overall
        }
      }
    ).catch(() => {
      // Silent failure
    });

    console.log(`[PromptOptimizer] ✅ Prompt executed successfully: ${executionId}`);
    return { success: true, output, executionId };

  } catch (error) {
    console.error('[PromptOptimizer] Error executing prompt:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Create an A/B test for prompt variants
 */
export async function createABTest(
  config: ABTestConfig
): Promise<{ success: boolean; testId?: string; error?: string }> {
  try {
    console.log(`[PromptOptimizer] Creating A/B test: ${config.test_name}`);
    
    const { data, error } = await supabase
      .from('prompt_ab_tests')
      .insert({
        test_name: config.test_name,
        test_description: config.test_description,
        prompt_name: config.prompt_name,
        control_variant_id: config.control_variant_id,
        treatment_variant_id: config.treatment_variant_id,
        control_traffic_percentage: config.control_traffic_percentage || 50.0,
        treatment_traffic_percentage: config.treatment_traffic_percentage || 50.0,
        min_sample_size: config.min_sample_size || 100,
        max_duration_days: config.max_duration_days || 7,
        significance_level: config.significance_level || 0.05,
        status: 'draft'
      })
      .select('id')
      .single();

    if (error) {
      console.error('[PromptOptimizer] Failed to create A/B test:', error);
      return { success: false, error: error.message };
    }

    console.log(`[PromptOptimizer] ✅ A/B test created: ${data.id}`);
    return { success: true, testId: data.id };

  } catch (error) {
    console.error('[PromptOptimizer] Error creating A/B test:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Evolve a prompt based on feedback data
 */
export async function evolvePrompt(
  promptName: string,
  parentVariantId: string,
  evolutionStrategy: string,
  feedbackData?: Record<string, any>
): Promise<{ success: boolean; newVariantId?: string; error?: string }> {
  try {
    console.log(`[PromptOptimizer] Evolving prompt: ${promptName} (${parentVariantId})`);
    
    // Get parent variant
    const { data: parentVariant, error: parentError } = await supabase
      .from('prompt_registry')
      .select('*')
      .eq('id', parentVariantId)
      .single();

    if (parentError || !parentVariant) {
      console.error('[PromptOptimizer] Failed to get parent variant:', parentError);
      return { success: false, error: parentError?.message || 'Parent variant not found' };
    }

    // Generate evolved prompt content
    const evolvedContent = await generateEvolvedPrompt(parentVariant, evolutionStrategy, feedbackData);
    
    // Create new version
    const newVersion = incrementVersion(parentVariant.version);
    const newVariantId = `evolved_${Date.now()}`;

    // Register new variant
    const { success: registerSuccess, id: newId, error: registerError } = await registerPromptVariant({
      prompt_name: promptName,
      version: newVersion,
      variant_id: newVariantId,
      prompt_content: evolvedContent,
      prompt_type: parentVariant.prompt_type,
      language: parentVariant.language,
      optimization_strategy: evolutionStrategy,
      parent_version: parentVariant.version,
      generation_method: 'evolutionary',
      is_active: false, // Start inactive until tested
      metadata: {
        parent_variant_id: parentVariantId,
        evolution_strategy: evolutionStrategy,
        feedback_data: feedbackData
      },
      tags: [...(parentVariant.tags || []), 'evolved']
    });

    if (!registerSuccess) {
      console.error('[PromptOptimizer] Failed to register evolved variant:', registerError);
      return { success: false, error: registerError };
    }

    // Log evolution history
    await logEvolutionHistory(parentVariantId, newId!, evolutionStrategy, feedbackData);

    console.log(`[PromptOptimizer] ✅ Prompt evolved successfully: ${newVariantId}`);
    return { success: true, newVariantId };

  } catch (error) {
    console.error('[PromptOptimizer] Error evolving prompt:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update prompt scores based on performance data
 */
export async function updatePromptScores(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[PromptOptimizer] Updating prompt scores...');
    
    const { error } = await supabase.rpc('update_prompt_scores');

    if (error) {
      console.error('[PromptOptimizer] Failed to update prompt scores:', error);
      return { success: false, error: error.message };
    }

    console.log('[PromptOptimizer] ✅ Prompt scores updated successfully');
    return { success: true };

  } catch (error) {
    console.error('[PromptOptimizer] Error updating prompt scores:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Helper functions

async function executePromptVariant(variant: PromptVariant, inputData: Record<string, any>): Promise<any> {
  // This would integrate with your actual AI service
  // For now, return a mock response
  return {
    intent: "Mock intent",
    tone: "Mock tone", 
    urgency: "Medium",
    confidence_score: 0.85
  };
}

async function calculateQualityScores(
  variant: PromptVariant,
  inputData: Record<string, any>,
  output: any,
  responseTime: number
): Promise<{ overall: number; accuracy: number; consistency: number; completeness: number }> {
  // Calculate quality scores based on various factors
  const accuracy = calculateAccuracyScore(output);
  const consistency = calculateConsistencyScore(output);
  const completeness = calculateCompletenessScore(output);
  const responseTimeScore = calculateResponseTimeScore(responseTime);
  
  const overall = (accuracy * 0.4 + consistency * 0.3 + completeness * 0.2 + responseTimeScore * 0.1);
  
  return { overall, accuracy, consistency, completeness };
}

function calculateAccuracyScore(output: any): number {
  // Simple accuracy calculation based on output structure
  if (output && typeof output === 'object') {
    const requiredFields = ['intent', 'tone', 'urgency', 'confidence_score'];
    const presentFields = requiredFields.filter(field => output[field] !== undefined);
    return presentFields.length / requiredFields.length;
  }
  return 0.0;
}

function calculateConsistencyScore(output: any): number {
  // Check if output follows expected format
  if (output && typeof output === 'object') {
    const urgencyValues = ['Low', 'Medium', 'High'];
    const hasValidUrgency = urgencyValues.includes(output.urgency);
    const hasValidConfidence = typeof output.confidence_score === 'number' && 
                              output.confidence_score >= 0 && output.confidence_score <= 1;
    return (hasValidUrgency && hasValidConfidence) ? 1.0 : 0.5;
  }
  return 0.0;
}

function calculateCompletenessScore(output: any): number {
  // Check if all required fields are present and non-empty
  if (output && typeof output === 'object') {
    const requiredFields = ['intent', 'tone', 'urgency', 'confidence_score'];
    const completeFields = requiredFields.filter(field => {
      const value = output[field];
      return value !== undefined && value !== null && value !== '';
    });
    return completeFields.length / requiredFields.length;
  }
  return 0.0;
}

function calculateResponseTimeScore(responseTime: number): number {
  // Score based on response time (lower is better)
  if (responseTime <= 1000) return 1.0;
  if (responseTime <= 2000) return 0.8;
  if (responseTime <= 3000) return 0.6;
  if (responseTime <= 5000) return 0.4;
  return 0.2;
}

function generateInputHash(inputData: Record<string, any>): string {
  // Simple hash generation for input deduplication
  const inputString = JSON.stringify(inputData);
  let hash = 0;
  for (let i = 0; i < inputString.length; i++) {
    const char = inputString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

async function logPromptExecution(execution: Omit<PromptExecution, 'id'>): Promise<void> {
  try {
    await supabase
      .from('prompt_performance')
      .insert(execution);
  } catch (error) {
    console.error('[PromptOptimizer] Failed to log prompt execution:', error);
  }
}

async function logEvolutionHistory(
  parentId: string,
  childId: string,
  evolutionType: string,
  feedbackData?: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('prompt_evolution')
      .insert({
        parent_prompt_id: parentId,
        child_prompt_id: childId,
        evolution_type: evolutionType,
        evolution_strategy: evolutionType,
        feedback_data: feedbackData,
        optimization_goals: ['improve_accuracy', 'reduce_response_time'],
        evolution_algorithm: 'feedback_driven'
      });
  } catch (error) {
    console.error('[PromptOptimizer] Failed to log evolution history:', error);
  }
}

async function generateEvolvedPrompt(
  parentVariant: any,
  evolutionStrategy: string,
  feedbackData?: Record<string, any>
): Promise<string> {
  // This would use AI to generate evolved prompts based on feedback
  // For now, return a simple evolution
  let evolvedContent = parentVariant.prompt_content;
  
  switch (evolutionStrategy) {
    case 'few_shot_enhancement':
      evolvedContent = addFewShotExamples(evolvedContent);
      break;
    case 'role_improvement':
      evolvedContent = improveRoleDefinition(evolvedContent);
      break;
    case 'context_expansion':
      evolvedContent = expandContext(evolvedContent);
      break;
    default:
      evolvedContent = addOptimizationHints(evolvedContent);
  }
  
  return evolvedContent;
}

function addFewShotExamples(content: string): string {
  return content + '\n\nExamples:\n- High urgency: "We need this implemented ASAP"\n- Medium urgency: "Looking to implement in the next quarter"\n- Low urgency: "Just exploring options"';
}

function improveRoleDefinition(content: string): string {
  return content.replace(
    'You are an AI growth analyst',
    'You are an expert AI growth analyst with deep experience in lead qualification and business intelligence'
  );
}

function expandContext(content: string): string {
  return content + '\n\nConsider the business context, industry trends, and typical lead behavior patterns in your analysis.';
}

function addOptimizationHints(content: string): string {
  return content + '\n\nFocus on accuracy and consistency in your analysis.';
}

function incrementVersion(version: string): string {
  const parts = version.split('.');
  const major = parseInt(parts[0]) || 1;
  const minor = parseInt(parts[1]) || 0;
  const patch = parseInt(parts[2]) || 0;
  return `${major}.${minor}.${patch + 1}`;
}
