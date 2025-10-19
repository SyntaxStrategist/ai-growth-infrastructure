// ============================================
// Phase 3: Optimized Prospect Pipeline
// ============================================
// Enhanced pipeline with ICP targeting and adaptive learning

import { ProspectCandidate, ProspectPipelineResult } from '../types';
import { AVENIR_ICP, getICPOptimizedCriteria, calculateICPScore } from './icp_profile';
import { analyzeConversions, generateAdaptiveWeights, saveLearningInsights } from './adaptive_learning';
import { analyzeConversionPatterns, generateConversionInsights, getConversionMetrics, saveConversionPatterns, saveConversionInsights } from './conversion_analyzer';
import { calculateDynamicScore } from './dynamic_scoring';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export interface OptimizedPipelineConfig {
  // ICP-based targeting
  useICPTargeting: boolean;
  minICPScore: number;
  
  // Adaptive learning
  useAdaptiveLearning: boolean;
  learningDaysBack: number;
  
  // Dynamic scoring
  useDynamicScoring: boolean;
  minDynamicScore: number;
  
  // Traditional pipeline config
  industries: string[];
  regions: string[];
  minAutomationScore: number;
  maxProspectsPerRun: number;
  testMode: boolean;
  usePdl?: boolean;
  scanForms?: boolean;
}

export interface OptimizedPipelineResult extends ProspectPipelineResult {
  // Phase 3 enhancements
  icpOptimization: {
    totalProspects: number;
    highICPScore: number;
    averageICPScore: number;
    icpRecommendations: string[];
  };
  
  adaptiveLearning: {
    insightsGenerated: boolean;
    patternsDiscovered: number;
    weightsUpdated: boolean;
    recommendations: string[];
  };
  
  dynamicScoring: {
    totalScored: number;
    highDynamicScore: number;
    averageDynamicScore: number;
    scoringInsights: string[];
  };
  
  optimizationMetrics: {
    conversionRate: number;
    topConvertingPatterns: any[];
    learningConfidence: number;
    optimizationImpact: string;
  };
}

/**
 * Run optimized prospect pipeline with Phase 3 enhancements
 */
export async function runOptimizedProspectPipeline(config: OptimizedPipelineConfig): Promise<OptimizedPipelineResult> {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  🚀 PHASE 3: OPTIMIZED PROSPECT PIPELINE                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const result: OptimizedPipelineResult = {
    totalCrawled: 0,
    totalTested: 0,
    totalScored: 0,
    totalContacted: 0,
    highPriorityProspects: [],
    errors: [],
    icpOptimization: {
      totalProspects: 0,
      highICPScore: 0,
      averageICPScore: 0,
      icpRecommendations: []
    },
    adaptiveLearning: {
      insightsGenerated: false,
      patternsDiscovered: 0,
      weightsUpdated: false,
      recommendations: []
    },
    dynamicScoring: {
      totalScored: 0,
      highDynamicScore: 0,
      averageDynamicScore: 0,
      scoringInsights: []
    },
    optimizationMetrics: {
      conversionRate: 0,
      topConvertingPatterns: [],
      learningConfidence: 0,
      optimizationImpact: 'No data available'
    }
  };

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 OPTIMIZED PIPELINE CONFIGURATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ICP Targeting:', config.useICPTargeting ? 'ENABLED' : 'DISABLED');
  console.log('Adaptive Learning:', config.useAdaptiveLearning ? 'ENABLED' : 'DISABLED');
  console.log('Dynamic Scoring:', config.useDynamicScoring ? 'ENABLED' : 'DISABLED');
  console.log('Min ICP Score:', config.minICPScore);
  console.log('Min Dynamic Score:', config.minDynamicScore);
  console.log('Learning Days Back:', config.learningDaysBack);
  console.log('');

  try {
    // ============================================
    // PHASE 3.1: ADAPTIVE LEARNING ANALYSIS
    // ============================================
    if (config.useAdaptiveLearning) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🧠 PHASE 3.1: ADAPTIVE LEARNING ANALYSIS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

      try {
        // Analyze conversion data
        console.log('📊 Analyzing conversion patterns...');
        const conversionPatterns = await analyzeConversionPatterns(config.learningDaysBack);
        result.adaptiveLearning.patternsDiscovered = conversionPatterns.length;
        
        // Generate conversion insights
        console.log('💡 Generating conversion insights...');
        const conversionInsights = await generateConversionInsights(conversionPatterns);
        
        // Save patterns and insights
        await saveConversionPatterns(conversionPatterns);
        await saveConversionInsights(conversionInsights);
        
        // Generate adaptive weights
        console.log('⚖️ Generating adaptive weights...');
        const learningInsights = await analyzeConversions(config.learningDaysBack);
        const adaptiveWeights = await generateAdaptiveWeights(learningInsights);
        
        // Save learning insights and weights
        await saveLearningInsights(learningInsights);
        await saveAdaptiveWeights(adaptiveWeights);
        
        result.adaptiveLearning.insightsGenerated = true;
        result.adaptiveLearning.weightsUpdated = true;
        result.adaptiveLearning.recommendations = learningInsights.recommendations;
        
        console.log('✅ Adaptive learning analysis complete');
        console.log(`   Patterns discovered: ${conversionPatterns.length}`);
        console.log(`   Insights generated: ${conversionInsights.length}`);
        console.log(`   Recommendations: ${learningInsights.recommendations.length}`);
        console.log('');

      } catch (error) {
        console.error('❌ Adaptive learning analysis failed:', error);
        result.errors.push('Adaptive learning analysis failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }

    // ============================================
    // PHASE 3.2: ICP-OPTIMIZED TARGETING
    // ============================================
    if (config.useICPTargeting) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎯 PHASE 3.2: ICP-OPTIMIZED TARGETING');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

      try {
        // Get ICP-optimized criteria
        const icpCriteria = getICPOptimizedCriteria();
        console.log('🎯 ICP-optimized targeting criteria:');
        console.log('   Industries:', icpCriteria.industries.join(', '));
        console.log('   Company Size:', icpCriteria.companySize.min, '-', icpCriteria.companySize.max);
        console.log('   Regions:', icpCriteria.regions.join(', '));
        console.log('   Min ICP Score:', icpCriteria.minICPScore);
        console.log('');

        // Update config with ICP criteria
        config.industries = icpCriteria.industries;
        config.regions = icpCriteria.regions;
        
        console.log('✅ ICP targeting criteria applied');
        console.log('');

      } catch (error) {
        console.error('❌ ICP targeting setup failed:', error);
        result.errors.push('ICP targeting setup failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }

    // ============================================
    // PHASE 3.3: ENHANCED PROSPECT DISCOVERY
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 PHASE 3.3: ENHANCED PROSPECT DISCOVERY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Import and run the original pipeline with optimized config
    const { runProspectPipeline } = await import('../prospect_pipeline');
    const pipelineResult = await runProspectPipeline({
      industries: config.industries,
      regions: config.regions,
      minAutomationScore: config.minAutomationScore,
      maxProspectsPerRun: config.maxProspectsPerRun,
      testMode: config.testMode,
      usePdl: config.usePdl,
      scanForms: config.scanForms
    });

    // Copy basic results
    result.totalCrawled = pipelineResult.totalCrawled;
    result.totalTested = pipelineResult.totalTested;
    result.totalScored = pipelineResult.totalScored;
    result.totalContacted = pipelineResult.totalContacted;
    result.highPriorityProspects = pipelineResult.highPriorityProspects;
    result.errors.push(...pipelineResult.errors);

    console.log('✅ Enhanced prospect discovery complete');
    console.log(`   Prospects discovered: ${result.totalCrawled}`);
    console.log(`   High-priority prospects: ${result.highPriorityProspects.length}`);
    console.log('');

    // ============================================
    // PHASE 3.4: ICP SCORING AND FILTERING
    // ============================================
    if (config.useICPTargeting && result.highPriorityProspects.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 PHASE 3.4: ICP SCORING AND FILTERING');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

      try {
        let totalICPScore = 0;
        let highICPScoreCount = 0;
        const icpFilteredProspects: ProspectCandidate[] = [];

        for (const prospect of result.highPriorityProspects) {
          console.log(`🧠 Calculating ICP score for: ${prospect.business_name}`);
          
          const icpScore = calculateICPScore(prospect);
          totalICPScore += icpScore.overall;
          
          if (icpScore.overall >= config.minICPScore) {
            icpFilteredProspects.push(prospect);
            highICPScoreCount++;
            
            // Store ICP score in prospect metadata
            if (!prospect.metadata) {
              prospect.metadata = {};
            }
            prospect.metadata.icpScore = icpScore;
            
            console.log(`   ✅ ICP Score: ${icpScore.overall}/100 (${icpScore.reasoning.substring(0, 60)}...)`);
          } else {
            console.log(`   ❌ ICP Score: ${icpScore.overall}/100 (below threshold)`);
          }
        }

        // Update results with ICP optimization
        result.icpOptimization.totalProspects = result.highPriorityProspects.length;
        result.icpOptimization.highICPScore = highICPScoreCount;
        result.icpOptimization.averageICPScore = result.highPriorityProspects.length > 0 ? 
          totalICPScore / result.highPriorityProspects.length : 0;
        result.icpOptimization.icpRecommendations = [
          `Filtered to ${highICPScoreCount}/${result.highPriorityProspects.length} prospects with ICP score >= ${config.minICPScore}`,
          `Average ICP score: ${result.icpOptimization.averageICPScore.toFixed(1)}/100`
        ];

        // Update high-priority prospects with ICP filtering
        result.highPriorityProspects = icpFilteredProspects;

        console.log('✅ ICP scoring and filtering complete');
        console.log(`   Total prospects scored: ${result.highPriorityProspects.length}`);
        console.log(`   High ICP score prospects: ${highICPScoreCount}`);
        console.log(`   Average ICP score: ${result.icpOptimization.averageICPScore.toFixed(1)}/100`);
        console.log('');

      } catch (error) {
        console.error('❌ ICP scoring failed:', error);
        result.errors.push('ICP scoring failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }

    // ============================================
    // PHASE 3.5: DYNAMIC SCORING
    // ============================================
    if (config.useDynamicScoring && result.highPriorityProspects.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚡ PHASE 3.5: DYNAMIC SCORING');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

      try {
        let totalDynamicScore = 0;
        let highDynamicScoreCount = 0;
        const dynamicFilteredProspects: ProspectCandidate[] = [];

        for (const prospect of result.highPriorityProspects) {
          console.log(`⚡ Calculating dynamic score for: ${prospect.business_name}`);
          
          const dynamicScore = await calculateDynamicScore(prospect);
          totalDynamicScore += dynamicScore.overall;
          
          if (dynamicScore.overall >= config.minDynamicScore) {
            dynamicFilteredProspects.push(prospect);
            highDynamicScoreCount++;
            
            // Store dynamic score in prospect metadata
            if (!prospect.metadata) {
              prospect.metadata = {};
            }
            prospect.metadata.dynamicScore = dynamicScore;
            
            console.log(`   ✅ Dynamic Score: ${dynamicScore.overall}/100 (${dynamicScore.reasoning.substring(0, 60)}...)`);
          } else {
            console.log(`   ❌ Dynamic Score: ${dynamicScore.overall}/100 (below threshold)`);
          }
        }

        // Update results with dynamic scoring
        result.dynamicScoring.totalScored = result.highPriorityProspects.length;
        result.dynamicScoring.highDynamicScore = highDynamicScoreCount;
        result.dynamicScoring.averageDynamicScore = result.highPriorityProspects.length > 0 ? 
          totalDynamicScore / result.highPriorityProspects.length : 0;
        result.dynamicScoring.scoringInsights = [
          `Filtered to ${highDynamicScoreCount}/${result.highPriorityProspects.length} prospects with dynamic score >= ${config.minDynamicScore}`,
          `Average dynamic score: ${result.dynamicScoring.averageDynamicScore.toFixed(1)}/100`
        ];

        // Update high-priority prospects with dynamic filtering
        result.highPriorityProspects = dynamicFilteredProspects;

        console.log('✅ Dynamic scoring complete');
        console.log(`   Total prospects scored: ${result.highPriorityProspects.length}`);
        console.log(`   High dynamic score prospects: ${highDynamicScoreCount}`);
        console.log(`   Average dynamic score: ${result.dynamicScoring.averageDynamicScore.toFixed(1)}/100`);
        console.log('');

      } catch (error) {
        console.error('❌ Dynamic scoring failed:', error);
        result.errors.push('Dynamic scoring failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }

    // ============================================
    // PHASE 3.6: OPTIMIZATION METRICS
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 PHASE 3.6: OPTIMIZATION METRICS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    try {
      // Get conversion metrics
      const conversionMetrics = await getConversionMetrics(config.learningDaysBack);
      
      result.optimizationMetrics.conversionRate = conversionMetrics.overallConversionRate;
      result.optimizationMetrics.topConvertingPatterns = conversionMetrics.topConvertingPatterns;
      result.optimizationMetrics.learningConfidence = conversionMetrics.insights.length > 0 ? 
        conversionMetrics.insights.reduce((sum, insight) => sum + insight.confidence, 0) / conversionMetrics.insights.length : 0;
      
      // Calculate optimization impact
      const originalCount = result.totalCrawled;
      const optimizedCount = result.highPriorityProspects.length;
      const optimizationRatio = originalCount > 0 ? optimizedCount / originalCount : 0;
      
      if (optimizationRatio > 0.8) {
        result.optimizationMetrics.optimizationImpact = 'High precision targeting - most prospects are high-quality';
      } else if (optimizationRatio > 0.5) {
        result.optimizationMetrics.optimizationImpact = 'Moderate precision targeting - good balance of quality and quantity';
      } else if (optimizationRatio > 0.2) {
        result.optimizationMetrics.optimizationImpact = 'High precision targeting - focused on highest-quality prospects';
      } else {
        result.optimizationMetrics.optimizationImpact = 'Very high precision targeting - extremely selective';
      }

      console.log('✅ Optimization metrics calculated');
      console.log(`   Conversion rate: ${(conversionMetrics.overallConversionRate * 100).toFixed(2)}%`);
      console.log(`   Top converting patterns: ${conversionMetrics.topConvertingPatterns.length}`);
      console.log(`   Learning confidence: ${(result.optimizationMetrics.learningConfidence * 100).toFixed(1)}%`);
      console.log(`   Optimization impact: ${result.optimizationMetrics.optimizationImpact}`);
      console.log('');

    } catch (error) {
      console.error('❌ Optimization metrics calculation failed:', error);
      result.errors.push('Optimization metrics calculation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }

    // ============================================
    // PHASE 3.7: SUMMARY
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ PHASE 3 OPTIMIZED PIPELINE COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📊 Phase 3 Results:');
    console.log(`   Prospects Discovered:     ${result.totalCrawled}`);
    console.log(`   ICP Optimized:            ${result.icpOptimization.highICPScore}/${result.icpOptimization.totalProspects}`);
    console.log(`   Dynamic Scored:           ${result.dynamicScoring.highDynamicScore}/${result.dynamicScoring.totalScored}`);
    console.log(`   Final High-Priority:      ${result.highPriorityProspects.length}`);
    console.log(`   Conversion Rate:          ${(result.optimizationMetrics.conversionRate * 100).toFixed(2)}%`);
    console.log(`   Learning Confidence:      ${(result.optimizationMetrics.learningConfidence * 100).toFixed(1)}%`);
    console.log(`   Errors:                   ${result.errors.length}`);
    console.log('');

    if (result.highPriorityProspects.length > 0) {
      console.log('🎯 Top 3 Optimized Prospects:');
      result.highPriorityProspects.slice(0, 3).forEach((p, i) => {
        const icpScore = p.metadata?.icpScore?.overall || 0;
        const dynamicScore = p.metadata?.dynamicScore?.overall || 0;
        console.log(`   ${i + 1}. ${p.business_name} - ICP: ${icpScore}/100, Dynamic: ${dynamicScore}/100`);
      });
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    const errorMsg = 'Phase 3 optimized pipeline execution failed';
    console.error(`❌ ${errorMsg}:`, error);
    result.errors.push(errorMsg + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
  }

  return result;
}

/**
 * Save adaptive weights to database
 */
async function saveAdaptiveWeights(weights: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('prospect_adaptive_weights')
      .upsert({
        id: 'current_weights',
        weights_data: weights,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('[OptimizedPipeline] Error saving adaptive weights:', error);
      throw error;
    }
    
    console.log('[OptimizedPipeline] ✅ Adaptive weights saved to database');
  } catch (error) {
    console.error('[OptimizedPipeline] ❌ Failed to save adaptive weights:', error);
  }
}

/**
 * Get default optimized pipeline configuration
 */
export function getDefaultOptimizedConfig(): OptimizedPipelineConfig {
  return {
    useICPTargeting: true,
    minICPScore: 70,
    useAdaptiveLearning: true,
    learningDaysBack: 90,
    useDynamicScoring: true,
    minDynamicScore: 60,
    industries: ['Software Development', 'Digital Marketing', 'E-commerce', 'SaaS'],
    regions: ['CA', 'US'],
    minAutomationScore: 70,
    maxProspectsPerRun: 20,
    testMode: false,
    usePdl: true,
    scanForms: true
  };
}

/**
 * Quick test run with Phase 3 optimizations
 */
export async function runOptimizedQuickTest(): Promise<OptimizedPipelineResult> {
  const config = getDefaultOptimizedConfig();
  config.testMode = true;
  config.maxProspectsPerRun = 5;
  config.learningDaysBack = 30;
  
  return runOptimizedProspectPipeline(config);
}

/**
 * Full production run with Phase 3 optimizations
 */
export async function runOptimizedProductionScan(): Promise<OptimizedPipelineResult> {
  const config = getDefaultOptimizedConfig();
  config.testMode = false;
  config.maxProspectsPerRun = 50;
  config.learningDaysBack = 90;
  
  return runOptimizedProspectPipeline(config);
}
