/**
 * Phase 2.2: Prompt Optimization API
 * 
 * REST API for prompt optimization, A/B testing, and variant management.
 * Completely isolated from existing systems - only manages prompt variants.
 * 
 * Endpoints:
 * - POST /api/prompt-optimization - Execute prompt with optimization
 * - GET /api/prompt-optimization - Get prompt variants and performance
 * - PUT /api/prompt-optimization - Update prompt configuration
 * - POST /api/prompt-optimization/ab-test - Create A/B test
 * - POST /api/prompt-optimization/evolve - Evolve prompt based on feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  executePromptWithTracking,
  createABTest,
  evolvePrompt,
  updatePromptScores,
  type PromptOptimizationOptions
} from '../../../lib/prompt-optimizer';
import { 
  getActivePromptVariant,
  getPromptVariants,
  activatePromptVariant,
  getPromptContent,
  initializePromptRegistry
} from '../../../lib/prompt-registry';

// Types for API requests
interface ExecutePromptRequest {
  prompt_name: string;
  input_data: Record<string, any>;
  language?: string;
  options?: PromptOptimizationOptions;
}

interface CreateABTestRequest {
  test_name: string;
  test_description?: string;
  prompt_name: string;
  control_variant_id: string;
  treatment_variant_id: string;
  control_traffic_percentage?: number;
  treatment_traffic_percentage?: number;
  min_sample_size?: number;
  max_duration_days?: number;
}

interface EvolvePromptRequest {
  prompt_name: string;
  parent_variant_id: string;
  evolution_strategy: string;
  feedback_data?: Record<string, any>;
}

interface ActivateVariantRequest {
  prompt_name: string;
  variant_id: string;
  version: string;
}

// POST /api/prompt-optimization - Execute prompt with optimization
export async function POST(req: NextRequest) {
  try {
    console.log('[PromptOptimizationAPI] POST /api/prompt-optimization - Execute prompt with optimization');
    
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      console.error('[PromptOptimizationAPI] Invalid JSON body');
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { action, data } = body;

    if (!action || !data) {
      console.error('[PromptOptimizationAPI] Missing required fields: action, data');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: action, data' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'execute':
        result = await handleExecutePrompt(data as ExecutePromptRequest);
        break;
      
      case 'ab_test':
        result = await handleCreateABTest(data as CreateABTestRequest);
        break;
      
      case 'evolve':
        result = await handleEvolvePrompt(data as EvolvePromptRequest);
        break;
      
      case 'initialize':
        result = await handleInitializeRegistry();
        break;
      
      default:
        console.error('[PromptOptimizationAPI] Unknown action:', action);
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    if (result.success) {
      console.log(`[PromptOptimizationAPI] ✅ ${action} completed successfully`);
      return NextResponse.json({
        success: true,
        action,
        data: ('data' in result ? result.data : null),
        message: `${action} completed successfully`
      });
    } else {
      console.error(`[PromptOptimizationAPI] Failed to ${action}:`, result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[PromptOptimizationAPI] Error processing request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET /api/prompt-optimization - Get prompt variants and performance
export async function GET(req: NextRequest) {
  try {
    console.log('[PromptOptimizationAPI] GET /api/prompt-optimization - Get prompt data');
    
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'variants';
    const promptName = url.searchParams.get('prompt_name');
    const language = url.searchParams.get('language') || 'en';
    const variantId = url.searchParams.get('variant_id');

    let result;

    switch (action) {
      case 'variants':
        if (!promptName) {
          return NextResponse.json(
            { success: false, error: 'prompt_name parameter required for variants action' },
            { status: 400 }
          );
        }
        result = await getPromptVariants(promptName, language);
        break;
      
      case 'active':
        if (!promptName) {
          return NextResponse.json(
            { success: false, error: 'prompt_name parameter required for active action' },
            { status: 400 }
          );
        }
        result = await getActivePromptVariant(promptName, language);
        break;
      
      case 'performance':
        // This would integrate with performance analysis
        result = { success: true, data: { message: 'Performance analysis not yet implemented' } };
        break;
      
      default:
        console.error('[PromptOptimizationAPI] Unknown action:', action);
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    if (result.success) {
      console.log(`[PromptOptimizationAPI] ✅ Retrieved ${action} data successfully`);
      return NextResponse.json({
        success: true,
        action,
        data: ('data' in result ? result.data : ('variants' in result ? result.variants : ('variant' in result ? result.variant : null))),
        metadata: {
          prompt_name: promptName,
          language,
          variant_id: variantId
        }
      });
    } else {
      console.error(`[PromptOptimizationAPI] Failed to retrieve ${action} data:`, result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[PromptOptimizationAPI] Error retrieving data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/prompt-optimization - Update prompt configuration
export async function PUT(req: NextRequest) {
  try {
    console.log('[PromptOptimizationAPI] PUT /api/prompt-optimization - Update prompt configuration');
    
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      console.error('[PromptOptimizationAPI] Invalid JSON body');
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { action, data } = body;

    if (!action || !data) {
      console.error('[PromptOptimizationAPI] Missing required fields: action, data');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: action, data' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'activate_variant':
        result = await handleActivateVariant(data as ActivateVariantRequest);
        break;
      
      case 'update_scores':
        result = await updatePromptScores();
        break;
      
      default:
        console.error('[PromptOptimizationAPI] Unknown update action:', action);
        return NextResponse.json(
          { success: false, error: `Unknown update action: ${action}` },
          { status: 400 }
        );
    }

    if (result.success) {
      console.log(`[PromptOptimizationAPI] ✅ ${action} completed successfully`);
      return NextResponse.json({
        success: true,
        action,
        message: `${action} completed successfully`,
        data: ('data' in result ? result.data : null),
      });
    } else {
      console.error(`[PromptOptimizationAPI] Failed to ${action}:`, result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[PromptOptimizationAPI] Error updating configuration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Helper functions for handling different actions

async function handleExecutePrompt(data: ExecutePromptRequest) {
  const { prompt_name, input_data, language = 'en', options = {} } = data;
  
  // Add language to options
  const executionOptions: PromptOptimizationOptions = {
    ...options,
    metadata: {
      ...options.metadata,
      language
    }
  };

  return await executePromptWithTracking(prompt_name, input_data, executionOptions);
}

async function handleCreateABTest(data: CreateABTestRequest) {
  const {
    test_name,
    test_description,
    prompt_name,
    control_variant_id,
    treatment_variant_id,
    control_traffic_percentage = 50.0,
    treatment_traffic_percentage = 50.0,
    min_sample_size = 100,
    max_duration_days = 7
  } = data;

  return await createABTest({
    test_name,
    test_description,
    prompt_name,
    control_variant_id,
    treatment_variant_id,
    control_traffic_percentage,
    treatment_traffic_percentage,
    min_sample_size,
    max_duration_days
  });
}

async function handleEvolvePrompt(data: EvolvePromptRequest) {
  const { prompt_name, parent_variant_id, evolution_strategy, feedback_data } = data;
  
  return await evolvePrompt(prompt_name, parent_variant_id, evolution_strategy, feedback_data);
}

async function handleActivateVariant(data: ActivateVariantRequest) {
  const { prompt_name, variant_id, version } = data;
  
  return await activatePromptVariant(prompt_name, variant_id, version);
}

async function handleInitializeRegistry() {
  return await initializePromptRegistry();
}

// API Documentation endpoint
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Prompt Optimization API Documentation',
    endpoints: {
      'POST /api/prompt-optimization': {
        description: 'Execute prompts with optimization and create A/B tests',
        actions: {
          execute: {
            description: 'Execute a prompt with optimization tracking',
            body: {
              action: 'execute',
              data: {
                prompt_name: 'string',
                input_data: 'object',
                language: 'string (optional)',
                options: 'object (optional)'
              }
            }
          },
          ab_test: {
            description: 'Create an A/B test for prompt variants',
            body: {
              action: 'ab_test',
              data: {
                test_name: 'string',
                prompt_name: 'string',
                control_variant_id: 'string',
                treatment_variant_id: 'string',
                control_traffic_percentage: 'number (optional)',
                treatment_traffic_percentage: 'number (optional)'
              }
            }
          },
          evolve: {
            description: 'Evolve a prompt based on feedback data',
            body: {
              action: 'evolve',
              data: {
                prompt_name: 'string',
                parent_variant_id: 'string',
                evolution_strategy: 'string',
                feedback_data: 'object (optional)'
              }
            }
          },
          initialize: {
            description: 'Initialize the prompt registry with baseline prompts',
            body: {
              action: 'initialize',
              data: {}
            }
          }
        }
      },
      'GET /api/prompt-optimization': {
        description: 'Retrieve prompt variants and performance data',
        query_params: {
          action: 'variants | active | performance',
          prompt_name: 'Required for variants and active actions',
          language: 'Optional language filter (default: en)',
          variant_id: 'Optional variant ID filter'
        }
      },
      'PUT /api/prompt-optimization': {
        description: 'Update prompt configuration and activate variants',
        actions: {
          activate_variant: {
            description: 'Activate a specific prompt variant',
            body: {
              action: 'activate_variant',
              data: {
                prompt_name: 'string',
                variant_id: 'string',
                version: 'string'
              }
            }
          },
          update_scores: {
            description: 'Update prompt scores based on performance data',
            body: {
              action: 'update_scores',
              data: {}
            }
          }
        }
      }
    },
    examples: {
      execute_prompt: {
        action: 'execute',
        data: {
          prompt_name: 'ai_enrichment_en',
          input_data: {
            message: 'We need AI automation for our customer support team',
            aiSummary: 'Enterprise B2B inquiry for AI integration'
          },
          language: 'en',
          options: {
            clientId: 'uuid',
            environment: 'production'
          }
        }
      },
      create_ab_test: {
        action: 'ab_test',
        data: {
          test_name: 'AI Enrichment Few-Shot Test',
          test_description: 'Testing few-shot examples in AI enrichment prompts',
          prompt_name: 'ai_enrichment_en',
          control_variant_id: 'baseline',
          treatment_variant_id: 'few_shot_v1',
          control_traffic_percentage: 50.0,
          treatment_traffic_percentage: 50.0
        }
      }
    }
  });
}
