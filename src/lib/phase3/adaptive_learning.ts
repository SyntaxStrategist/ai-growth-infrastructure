// ============================================
// Phase 3: Adaptive Learning System
// ============================================
// Learns from conversion data to optimize prospect targeting

import { createClient } from '@supabase/supabase-js';
import { AVENIR_ICP, ICPProfile, ICPScore } from './icp_profile';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export interface ConversionData {
  prospectId: string;
  businessName: string;
  industry: string;
  region: string;
  companySize?: number;
  techStack?: string[];
  painPoints?: string[];
  icpScore: ICPScore;
  conversionType: 'email_response' | 'meeting_scheduled' | 'proposal_sent' | 'deal_closed';
  conversionValue?: number;
  conversionDate: string;
  metadata?: any;
}

export interface LearningInsights {
  highConvertingIndustries: Array<{ industry: string; conversionRate: number; count: number }>;
  optimalCompanySizes: Array<{ sizeRange: string; conversionRate: number; count: number }>;
  effectiveTechStacks: Array<{ tech: string; conversionRate: number; count: number }>;
  painPointPatterns: Array<{ painPoint: string; conversionRate: number; count: number }>;
  geographicPerformance: Array<{ region: string; conversionRate: number; count: number }>;
  icpScoreCorrelation: {
    highConverters: number; // Average ICP score of high converters
    lowConverters: number;  // Average ICP score of low converters
    correlation: number;    // Correlation coefficient
  };
  recommendations: string[];
  confidence: number;
  lastUpdated: string;
}

export interface AdaptiveWeights {
  industry: Record<string, number>;
  companySize: { min: number; max: number; weight: number };
  techStack: Record<string, number>;
  painPoints: Record<string, number>;
  geography: Record<string, number>;
  icpThreshold: number;
  lastUpdated: string;
}

/**
 * Analyze conversion data to generate learning insights
 */
export async function analyzeConversions(daysBack: number = 90): Promise<LearningInsights> {
  console.log('[AdaptiveLearning] ============================================');
  console.log('[AdaptiveLearning] Analyzing conversion data...');
  console.log('[AdaptiveLearning] Days back:', daysBack);
  
  try {
    // Get conversion data from feedback_tracking
    const { data: conversions, error } = await supabase
      .from('feedback_tracking')
      .select(`
        *,
        prospect_candidates!inner(
          id,
          business_name,
          industry,
          region,
          automation_need_score,
          metadata
        )
      `)
      .eq('action_type', 'lead_conversion')
      .eq('outcome', 'positive')
      .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());
    
    if (error) {
      console.error('[AdaptiveLearning] Error fetching conversions:', error);
      throw error;
    }
    
    console.log('[AdaptiveLearning] Found', conversions?.length || 0, 'conversions');
    
    if (!conversions || conversions.length === 0) {
      return getDefaultInsights();
    }
    
    // Get total prospects for conversion rate calculation
    const { data: totalProspects, error: totalError } = await supabase
      .from('prospect_candidates')
      .select('id, industry, region, metadata')
      .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());
    
    if (totalError) {
      console.error('[AdaptiveLearning] Error fetching total prospects:', totalError);
      throw totalError;
    }
    
    console.log('[AdaptiveLearning] Total prospects:', totalProspects?.length || 0);
    
    // Analyze by industry
    const industryAnalysis = analyzeByIndustry(conversions, totalProspects || []);
    
    // Analyze by company size
    const sizeAnalysis = analyzeByCompanySize(conversions, totalProspects || []);
    
    // Analyze by tech stack
    const techAnalysis = analyzeByTechStack(conversions, totalProspects || []);
    
    // Analyze by pain points
    const painPointAnalysis = analyzeByPainPoints(conversions, totalProspects || []);
    
    // Analyze by geography
    const geoAnalysis = analyzeByGeography(conversions, totalProspects || []);
    
    // Analyze ICP score correlation
    const icpCorrelation = analyzeICPCorrelation(conversions);
    
    // Generate recommendations
    const recommendations = generateRecommendations({
      industryAnalysis,
      sizeAnalysis,
      techAnalysis,
      painPointAnalysis,
      geoAnalysis,
      icpCorrelation
    });
    
    const insights: LearningInsights = {
      highConvertingIndustries: industryAnalysis,
      optimalCompanySizes: sizeAnalysis,
      effectiveTechStacks: techAnalysis,
      painPointPatterns: painPointAnalysis,
      geographicPerformance: geoAnalysis,
      icpScoreCorrelation: icpCorrelation,
      recommendations,
      confidence: calculateInsightsConfidence(conversions.length, totalProspects?.length || 0),
      lastUpdated: new Date().toISOString()
    };
    
    console.log('[AdaptiveLearning] ✅ Analysis complete');
    console.log('[AdaptiveLearning] High-converting industries:', industryAnalysis.length);
    console.log('[AdaptiveLearning] Recommendations:', recommendations.length);
    console.log('[AdaptiveLearning] ============================================');
    
    return insights;
    
  } catch (error) {
    console.error('[AdaptiveLearning] ❌ Analysis failed:', error);
    return getDefaultInsights();
  }
}

/**
 * Generate adaptive weights based on learning insights
 */
export async function generateAdaptiveWeights(insights: LearningInsights): Promise<AdaptiveWeights> {
  console.log('[AdaptiveLearning] Generating adaptive weights...');
  
  // Start with base ICP weights
  const baseICP = AVENIR_ICP;
  
  // Adjust industry weights based on conversion data
  const industryWeights: Record<string, number> = { ...baseICP.industries.weights };
  insights.highConvertingIndustries.forEach(item => {
    if (item.conversionRate > 0.1) { // 10% conversion rate threshold
      industryWeights[item.industry] = Math.min(1.0, industryWeights[item.industry] * 1.2);
    } else if (item.conversionRate < 0.05) { // 5% conversion rate threshold
      industryWeights[item.industry] = Math.max(0.1, industryWeights[item.industry] * 0.8);
    }
  });
  
  // Adjust company size based on optimal ranges
  let optimalMin = baseICP.companySize.min;
  let optimalMax = baseICP.companySize.max;
  let sizeWeight = baseICP.companySize.weight;
  
  if (insights.optimalCompanySizes.length > 0) {
    const bestSize = insights.optimalCompanySizes.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    );
    
    // Parse size range (e.g., "10-50", "50-100")
    const sizeMatch = bestSize.sizeRange.match(/(\d+)-(\d+)/);
    if (sizeMatch) {
      optimalMin = parseInt(sizeMatch[1]);
      optimalMax = parseInt(sizeMatch[2]);
      sizeWeight = Math.min(1.0, sizeWeight * 1.1);
    }
  }
  
  // Adjust tech stack weights
  const techWeights: Record<string, number> = { ...baseICP.techStack.weights };
  insights.effectiveTechStacks.forEach(item => {
    if (item.conversionRate > 0.15) { // 15% conversion rate threshold
      techWeights[item.tech] = Math.min(1.0, techWeights[item.tech] * 1.15);
    }
  });
  
  // Adjust pain point weights
  const painPointWeights: Record<string, number> = {};
  insights.painPointPatterns.forEach(item => {
    if (item.conversionRate > 0.12) { // 12% conversion rate threshold
      painPointWeights[item.painPoint] = 0.9; // High weight for effective pain points
    }
  });
  
  // Adjust geography weights
  const geoWeights: Record<string, number> = { ...baseICP.geography.weights };
  insights.geographicPerformance.forEach(item => {
    if (item.conversionRate > 0.1) { // 10% conversion rate threshold
      geoWeights[item.region] = Math.min(1.0, geoWeights[item.region] * 1.1);
    }
  });
  
  // Adjust ICP threshold based on correlation
  let icpThreshold = 70; // Default threshold
  if (insights.icpScoreCorrelation.correlation > 0.7) {
    icpThreshold = Math.max(60, insights.icpScoreCorrelation.highConverters - 10);
  }
  
  const adaptiveWeights: AdaptiveWeights = {
    industry: industryWeights,
    companySize: { min: optimalMin, max: optimalMax, weight: sizeWeight },
    techStack: techWeights,
    painPoints: painPointWeights,
    geography: geoWeights,
    icpThreshold,
    lastUpdated: new Date().toISOString()
  };
  
  console.log('[AdaptiveLearning] ✅ Adaptive weights generated');
  console.log('[AdaptiveLearning] ICP threshold:', icpThreshold);
  console.log('[AdaptiveLearning] Optimal company size:', optimalMin, '-', optimalMax);
  
  return adaptiveWeights;
}

/**
 * Save learning insights to database
 */
export async function saveLearningInsights(insights: LearningInsights): Promise<void> {
  try {
    const { error } = await supabase
      .from('prospect_learning_insights')
      .upsert({
        id: 'current_insights',
        insights_data: insights,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('[AdaptiveLearning] Error saving insights:', error);
      throw error;
    }
    
    console.log('[AdaptiveLearning] ✅ Insights saved to database');
  } catch (error) {
    console.error('[AdaptiveLearning] ❌ Failed to save insights:', error);
  }
}

/**
 * Get latest learning insights from database
 */
export async function getLatestInsights(): Promise<LearningInsights | null> {
  try {
    const { data, error } = await supabase
      .from('prospect_learning_insights')
      .select('insights_data')
      .eq('id', 'current_insights')
      .single();
    
    if (error) {
      console.error('[AdaptiveLearning] Error fetching insights:', error);
      return null;
    }
    
    return data?.insights_data || null;
  } catch (error) {
    console.error('[AdaptiveLearning] ❌ Failed to fetch insights:', error);
    return null;
  }
}

// Helper functions for analysis

function analyzeByIndustry(conversions: any[], totalProspects: any[]): Array<{ industry: string; conversionRate: number; count: number }> {
  const industryStats = new Map<string, { conversions: number; total: number }>();
  
  // Count conversions by industry
  conversions.forEach(conv => {
    const industry = conv.prospect_candidates.industry || 'Unknown';
    const current = industryStats.get(industry) || { conversions: 0, total: 0 };
    industryStats.set(industry, { ...current, conversions: current.conversions + 1 });
  });
  
  // Count total prospects by industry
  totalProspects.forEach(prospect => {
    const industry = prospect.industry || 'Unknown';
    const current = industryStats.get(industry) || { conversions: 0, total: 0 };
    industryStats.set(industry, { ...current, total: current.total + 1 });
  });
  
  // Calculate conversion rates
  return Array.from(industryStats.entries())
    .map(([industry, stats]) => ({
      industry,
      conversionRate: stats.total > 0 ? stats.conversions / stats.total : 0,
      count: stats.conversions
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate);
}

function analyzeByCompanySize(conversions: any[], totalProspects: any[]): Array<{ sizeRange: string; conversionRate: number; count: number }> {
  const sizeRanges = ['1-10', '10-50', '50-100', '100-200', '200+'];
  const sizeStats = new Map<string, { conversions: number; total: number }>();
  
  // Initialize all ranges
  sizeRanges.forEach(range => {
    sizeStats.set(range, { conversions: 0, total: 0 });
  });
  
  // Count conversions by size
  conversions.forEach(conv => {
    const size = conv.prospect_candidates.metadata?.employeeCount || 0;
    const range = getSizeRange(size);
    const current = sizeStats.get(range) || { conversions: 0, total: 0 };
    sizeStats.set(range, { ...current, conversions: current.conversions + 1 });
  });
  
  // Count total prospects by size
  totalProspects.forEach(prospect => {
    const size = prospect.metadata?.employeeCount || 0;
    const range = getSizeRange(size);
    const current = sizeStats.get(range) || { conversions: 0, total: 0 };
    sizeStats.set(range, { ...current, total: current.total + 1 });
  });
  
  // Calculate conversion rates
  return Array.from(sizeStats.entries())
    .map(([range, stats]) => ({
      sizeRange: range,
      conversionRate: stats.total > 0 ? stats.conversions / stats.total : 0,
      count: stats.conversions
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate);
}

function analyzeByTechStack(conversions: any[], totalProspects: any[]): Array<{ tech: string; conversionRate: number; count: number }> {
  const techStats = new Map<string, { conversions: number; total: number }>();
  
  // Count conversions by tech stack
  conversions.forEach(conv => {
    const techStack = conv.prospect_candidates.metadata?.techStack || [];
    techStack.forEach((tech: string) => {
      const current = techStats.get(tech) || { conversions: 0, total: 0 };
      techStats.set(tech, { ...current, conversions: current.conversions + 1 });
    });
  });
  
  // Count total prospects by tech stack
  totalProspects.forEach(prospect => {
    const techStack = prospect.metadata?.techStack || [];
    techStack.forEach((tech: string) => {
      const current = techStats.get(tech) || { conversions: 0, total: 0 };
      techStats.set(tech, { ...current, total: current.total + 1 });
    });
  });
  
  // Calculate conversion rates
  return Array.from(techStats.entries())
    .map(([tech, stats]) => ({
      tech,
      conversionRate: stats.total > 0 ? stats.conversions / stats.total : 0,
      count: stats.conversions
    }))
    .filter(item => item.count >= 2) // Only include tech with at least 2 conversions
    .sort((a, b) => b.conversionRate - a.conversionRate);
}

function analyzeByPainPoints(conversions: any[], totalProspects: any[]): Array<{ painPoint: string; conversionRate: number; count: number }> {
  const painPointStats = new Map<string, { conversions: number; total: number }>();
  
  // Count conversions by pain points
  conversions.forEach(conv => {
    const painPoints = conv.prospect_candidates.metadata?.painPoints || [];
    painPoints.forEach((painPoint: string) => {
      const current = painPointStats.get(painPoint) || { conversions: 0, total: 0 };
      painPointStats.set(painPoint, { ...current, conversions: current.conversions + 1 });
    });
  });
  
  // Count total prospects by pain points
  totalProspects.forEach(prospect => {
    const painPoints = prospect.metadata?.painPoints || [];
    painPoints.forEach((painPoint: string) => {
      const current = painPointStats.get(painPoint) || { conversions: 0, total: 0 };
      painPointStats.set(painPoint, { ...current, total: current.total + 1 });
    });
  });
  
  // Calculate conversion rates
  return Array.from(painPointStats.entries())
    .map(([painPoint, stats]) => ({
      painPoint,
      conversionRate: stats.total > 0 ? stats.conversions / stats.total : 0,
      count: stats.conversions
    }))
    .filter(item => item.count >= 2) // Only include pain points with at least 2 conversions
    .sort((a, b) => b.conversionRate - a.conversionRate);
}

function analyzeByGeography(conversions: any[], totalProspects: any[]): Array<{ region: string; conversionRate: number; count: number }> {
  const geoStats = new Map<string, { conversions: number; total: number }>();
  
  // Count conversions by geography
  conversions.forEach(conv => {
    const region = conv.prospect_candidates.region || 'Unknown';
    const current = geoStats.get(region) || { conversions: 0, total: 0 };
    geoStats.set(region, { ...current, conversions: current.conversions + 1 });
  });
  
  // Count total prospects by geography
  totalProspects.forEach(prospect => {
    const region = prospect.region || 'Unknown';
    const current = geoStats.get(region) || { conversions: 0, total: 0 };
    geoStats.set(region, { ...current, total: current.total + 1 });
  });
  
  // Calculate conversion rates
  return Array.from(geoStats.entries())
    .map(([region, stats]) => ({
      region,
      conversionRate: stats.total > 0 ? stats.conversions / stats.total : 0,
      count: stats.conversions
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate);
}

function analyzeICPCorrelation(conversions: any[]): { highConverters: number; lowConverters: number; correlation: number } {
  const icpScores = conversions.map(conv => conv.prospect_candidates.automation_need_score || 0);
  
  if (icpScores.length === 0) {
    return { highConverters: 0, lowConverters: 0, correlation: 0 };
  }
  
  const highConverters = icpScores.reduce((sum, score) => sum + score, 0) / icpScores.length;
  const lowConverters = 50; // Default assumption for non-converters
  
  // Simple correlation calculation (in real implementation, you'd compare with non-converters)
  const correlation = Math.min(1.0, highConverters / 100);
  
  return {
    highConverters,
    lowConverters,
    correlation
  };
}

function generateRecommendations(analysis: any): string[] {
  const recommendations: string[] = [];
  
  // Industry recommendations
  if (analysis.industryAnalysis.length > 0) {
    const topIndustry = analysis.industryAnalysis[0];
    if (topIndustry.conversionRate > 0.15) {
      recommendations.push(`Focus on ${topIndustry.industry} industry (${(topIndustry.conversionRate * 100).toFixed(1)}% conversion rate)`);
    }
  }
  
  // Company size recommendations
  if (analysis.sizeAnalysis.length > 0) {
    const topSize = analysis.sizeAnalysis[0];
    if (topSize.conversionRate > 0.12) {
      recommendations.push(`Target companies with ${topSize.sizeRange} employees (${(topSize.conversionRate * 100).toFixed(1)}% conversion rate)`);
    }
  }
  
  // Tech stack recommendations
  if (analysis.techAnalysis.length > 0) {
    const topTech = analysis.techAnalysis[0];
    if (topTech.conversionRate > 0.2) {
      recommendations.push(`Prioritize prospects using ${topTech.tech} (${(topTech.conversionRate * 100).toFixed(1)}% conversion rate)`);
    }
  }
  
  // ICP score recommendations
  if (analysis.icpCorrelation.correlation > 0.7) {
    recommendations.push(`Increase minimum ICP score threshold to ${Math.round(analysis.icpCorrelation.highConverters - 10)}`);
  }
  
  return recommendations;
}

function calculateInsightsConfidence(conversions: number, totalProspects: number): number {
  if (totalProspects === 0) return 0;
  
  const conversionRate = conversions / totalProspects;
  const sampleSize = Math.min(conversions, 100); // Cap at 100 for confidence calculation
  
  // Higher confidence with more conversions and higher conversion rates
  return Math.min(1.0, (sampleSize / 50) * (conversionRate * 10));
}

function getSizeRange(size: number): string {
  if (size <= 10) return '1-10';
  if (size <= 50) return '10-50';
  if (size <= 100) return '50-100';
  if (size <= 200) return '100-200';
  return '200+';
}

function getDefaultInsights(): LearningInsights {
  return {
    highConvertingIndustries: [],
    optimalCompanySizes: [],
    effectiveTechStacks: [],
    painPointPatterns: [],
    geographicPerformance: [],
    icpScoreCorrelation: { highConverters: 0, lowConverters: 0, correlation: 0 },
    recommendations: ['Insufficient data for analysis. Continue collecting conversion data.'],
    confidence: 0,
    lastUpdated: new Date().toISOString()
  };
}
