// ============================================
// Phase 3: Prospect Optimization API
// ============================================
// API endpoint for running optimized prospect pipeline

import { NextRequest, NextResponse } from 'next/server';
import { runOptimizedProspectPipeline, getDefaultOptimizedConfig, OptimizedPipelineConfig } from '../../../../lib/phase3/optimized_pipeline';
import { analyzeConversions, generateAdaptiveWeights } from '../../../../lib/phase3/adaptive_learning';
import { analyzeConversionPatterns, getConversionMetrics } from '../../../../lib/phase3/conversion_analyzer';
import { calculateDynamicScore } from '../../../../lib/phase3/dynamic_scoring';

import { handleApiError } from '../../../../lib/error-handler';
export async function POST(request: NextRequest) {
  console.log('[ProspectOptimizationAPI] ============================================');
  console.log('[ProspectOptimizationAPI] Phase 3 optimization request received');
  
  try {
    const body = await request.json();
    const { action, config } = body;
    
    if (!action) {
      console.error('[ProspectOptimizationAPI] Missing required field: action');
      return NextResponse.json(
        { success: false, error: 'Missing required field: action' },
        { status: 400 }
      );
    }
    
    console.log('[ProspectOptimizationAPI] Action:', action);
    
    switch (action) {
      case 'run_optimized_pipeline':
        return await handleRunOptimizedPipeline(config);
      
      case 'analyze_conversions':
        return await handleAnalyzeConversions(body);
      
      case 'generate_adaptive_weights':
        return await handleGenerateAdaptiveWeights(body);
      
      case 'get_conversion_metrics':
        return await handleGetConversionMetrics(body);
      
      case 'calculate_dynamic_score':
        return await handleCalculateDynamicScore(body);
      
      case 'get_optimization_status':
        return await handleGetOptimizationStatus();
      
      default:
        console.error('[ProspectOptimizationAPI] Unknown action:', action);
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}

export async function GET(request: NextRequest) {
  console.log('[ProspectOptimizationAPI] GET request received');
  
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'get_optimization_status';
    
    switch (action) {
      case 'get_optimization_status':
        return await handleGetOptimizationStatus();
      
      case 'get_default_config':
        return await handleGetDefaultConfig();
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown GET action: ${action}` },
          { status: 400 }
        );
    }
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}

/**
 * Handle running optimized prospect pipeline
 */
async function handleRunOptimizedPipeline(config?: OptimizedPipelineConfig) {
  console.log('[ProspectOptimizationAPI] Running optimized prospect pipeline...');
  
  try {
    const pipelineConfig = config || getDefaultOptimizedConfig();
    
    console.log('[ProspectOptimizationAPI] Pipeline configuration:');
    console.log('  ICP Targeting:', pipelineConfig.useICPTargeting);
    console.log('  Adaptive Learning:', pipelineConfig.useAdaptiveLearning);
    console.log('  Dynamic Scoring:', pipelineConfig.useDynamicScoring);
    console.log('  Min ICP Score:', pipelineConfig.minICPScore);
    console.log('  Min Dynamic Score:', pipelineConfig.minDynamicScore);
    
    const result = await runOptimizedProspectPipeline(pipelineConfig);
    
    console.log('[ProspectOptimizationAPI] ✅ Optimized pipeline completed');
    console.log(`  Total prospects: ${result.totalCrawled}`);
    console.log(`  High-priority prospects: ${result.highPriorityProspects.length}`);
    console.log(`  ICP optimized: ${result.icpOptimization.highICPScore}/${result.icpOptimization.totalProspects}`);
    console.log(`  Dynamic scored: ${result.dynamicScoring.highDynamicScore}/${result.dynamicScoring.totalScored}`);
    
    return NextResponse.json({
      success: true,
      action: 'run_optimized_pipeline',
      data: result,
      message: 'Optimized prospect pipeline completed successfully'
    });
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}

/**
 * Handle conversion analysis
 */
async function handleAnalyzeConversions(body: any) {
  console.log('[ProspectOptimizationAPI] Analyzing conversions...');
  
  try {
    const { daysBack = 90 } = body;
    
    console.log('[ProspectOptimizationAPI] Days back:', daysBack);
    
    const patterns = await analyzeConversionPatterns(daysBack);
    const insights = await analyzeConversions(daysBack);
    
    console.log('[ProspectOptimizationAPI] ✅ Conversion analysis completed');
    console.log(`  Patterns discovered: ${patterns.length}`);
    console.log(`  Insights generated: ${insights.recommendations.length}`);
    
    return NextResponse.json({
      success: true,
      action: 'analyze_conversions',
      data: {
        patterns,
        insights,
        daysBack
      },
      message: 'Conversion analysis completed successfully'
    });
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}

/**
 * Handle adaptive weights generation
 */
async function handleGenerateAdaptiveWeights(body: any) {
  console.log('[ProspectOptimizationAPI] Generating adaptive weights...');
  
  try {
    const { daysBack = 90 } = body;
    
    console.log('[ProspectOptimizationAPI] Days back:', daysBack);
    
    const insights = await analyzeConversions(daysBack);
    const weights = await generateAdaptiveWeights(insights);
    
    console.log('[ProspectOptimizationAPI] ✅ Adaptive weights generated');
    console.log('  ICP threshold:', weights.icpThreshold);
    console.log('  Company size range:', weights.companySize.min, '-', weights.companySize.max);
    
    return NextResponse.json({
      success: true,
      action: 'generate_adaptive_weights',
      data: {
        weights,
        insights,
        daysBack
      },
      message: 'Adaptive weights generated successfully'
    });
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}

/**
 * Handle conversion metrics retrieval
 */
async function handleGetConversionMetrics(body: any) {
  console.log('[ProspectOptimizationAPI] Getting conversion metrics...');
  
  try {
    const { daysBack = 90 } = body;
    
    console.log('[ProspectOptimizationAPI] Days back:', daysBack);
    
    const metrics = await getConversionMetrics(daysBack);
    
    console.log('[ProspectOptimizationAPI] ✅ Conversion metrics retrieved');
    console.log(`  Conversion rate: ${(metrics.overallConversionRate * 100).toFixed(2)}%`);
    console.log(`  Total prospects: ${metrics.totalProspects}`);
    console.log(`  Total conversions: ${metrics.totalConversions}`);
    
    return NextResponse.json({
      success: true,
      action: 'get_conversion_metrics',
      data: metrics,
      message: 'Conversion metrics retrieved successfully'
    });
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}

/**
 * Handle dynamic score calculation
 */
async function handleCalculateDynamicScore(body: any) {
  console.log('[ProspectOptimizationAPI] Calculating dynamic score...');
  
  try {
    const { prospect } = body;
    
    if (!prospect) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: prospect' },
        { status: 400 }
      );
    }
    
    console.log('[ProspectOptimizationAPI] Prospect:', prospect.business_name);
    
    const dynamicScore = await calculateDynamicScore(prospect);
    
    console.log('[ProspectOptimizationAPI] ✅ Dynamic score calculated');
    console.log(`  Overall score: ${dynamicScore.overall}/100`);
    console.log(`  Confidence: ${(dynamicScore.confidence * 100).toFixed(1)}%`);
    
    return NextResponse.json({
      success: true,
      action: 'calculate_dynamic_score',
      data: {
        prospect: prospect.business_name,
        dynamicScore
      },
      message: 'Dynamic score calculated successfully'
    });
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}

/**
 * Handle optimization status retrieval
 */
async function handleGetOptimizationStatus() {
  console.log('[ProspectOptimizationAPI] Getting optimization status...');
  
  try {
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Check if Phase 3 tables exist and have data
    const status = {
      phase3Tables: {
        learningInsights: false,
        adaptiveWeights: false,
        conversionPatterns: false,
        conversionInsights: false,
        scoringModels: false,
        dynamicScores: false
      },
      dataAvailability: {
        hasLearningInsights: false,
        hasAdaptiveWeights: false,
        hasConversionPatterns: false,
        hasConversionInsights: false,
        hasScoringModels: false,
        hasDynamicScores: false
      },
      lastUpdated: {
        learningInsights: null,
        adaptiveWeights: null,
        conversionPatterns: null,
        conversionInsights: null,
        scoringModels: null,
        dynamicScores: null
      }
    };
    
    // Check learning insights
    try {
      const { data: insights, error } = await supabase
        .from('prospect_learning_insights')
        .select('created_at')
        .eq('id', 'current_insights')
        .single();
      
      if (!error && insights) {
        status.phase3Tables.learningInsights = true;
        status.dataAvailability.hasLearningInsights = true;
        status.lastUpdated.learningInsights = insights.created_at;
      }
    } catch (error) {
      console.log('[ProspectOptimizationAPI] Learning insights table not available');
    }
    
    // Check adaptive weights
    try {
      const { data: weights, error } = await supabase
        .from('prospect_adaptive_weights')
        .select('created_at')
        .eq('id', 'current_weights')
        .single();
      
      if (!error && weights) {
        status.phase3Tables.adaptiveWeights = true;
        status.dataAvailability.hasAdaptiveWeights = true;
        status.lastUpdated.adaptiveWeights = weights.created_at;
      }
    } catch (error) {
      console.log('[ProspectOptimizationAPI] Adaptive weights table not available');
    }
    
    // Check conversion patterns
    try {
      const { data: patterns, error } = await supabase
        .from('prospect_conversion_patterns')
        .select('last_updated')
        .limit(1);
      
      if (!error && patterns && patterns.length > 0) {
        status.phase3Tables.conversionPatterns = true;
        status.dataAvailability.hasConversionPatterns = true;
        status.lastUpdated.conversionPatterns = patterns[0].last_updated;
      }
    } catch (error) {
      console.log('[ProspectOptimizationAPI] Conversion patterns table not available');
    }
    
    // Check conversion insights
    try {
      const { data: insights, error } = await supabase
        .from('prospect_conversion_insights')
        .select('created_at')
        .limit(1);
      
      if (!error && insights && insights.length > 0) {
        status.phase3Tables.conversionInsights = true;
        status.dataAvailability.hasConversionInsights = true;
        status.lastUpdated.conversionInsights = insights[0].created_at;
      }
    } catch (error) {
      console.log('[ProspectOptimizationAPI] Conversion insights table not available');
    }
    
    // Check scoring models
    try {
      const { data: models, error } = await supabase
        .from('prospect_scoring_models')
        .select('created_at')
        .limit(1);
      
      if (!error && models && models.length > 0) {
        status.phase3Tables.scoringModels = true;
        status.dataAvailability.hasScoringModels = true;
        status.lastUpdated.scoringModels = models[0].created_at;
      }
    } catch (error) {
      console.log('[ProspectOptimizationAPI] Scoring models table not available');
    }
    
    // Check dynamic scores
    try {
      const { data: scores, error } = await supabase
        .from('prospect_dynamic_scores')
        .select('created_at')
        .limit(1);
      
      if (!error && scores && scores.length > 0) {
        status.phase3Tables.dynamicScores = true;
        status.dataAvailability.hasDynamicScores = true;
        status.lastUpdated.dynamicScores = scores[0].created_at;
      }
    } catch (error) {
      console.log('[ProspectOptimizationAPI] Dynamic scores table not available');
    }
    
    console.log('[ProspectOptimizationAPI] ✅ Optimization status retrieved');
    
    return NextResponse.json({
      success: true,
      action: 'get_optimization_status',
      data: status,
      message: 'Optimization status retrieved successfully'
    });
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}

/**
 * Handle default config retrieval
 */
async function handleGetDefaultConfig() {
  console.log('[ProspectOptimizationAPI] Getting default configuration...');
  
  try {
    const defaultConfig = getDefaultOptimizedConfig();
    
    console.log('[ProspectOptimizationAPI] ✅ Default configuration retrieved');
    
    return NextResponse.json({
      success: true,
      action: 'get_default_config',
      data: defaultConfig,
      message: 'Default configuration retrieved successfully'
    });
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}
