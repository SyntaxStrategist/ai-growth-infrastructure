// ============================================
// Phase 3: Dynamic Scoring System
// ============================================
// Adapts scoring algorithms based on learning data

import { createClient } from '@supabase/supabase-js';
import { AVENIR_ICP, ICPProfile, ICPScore, calculateICPScore } from './icp_profile';
import { AdaptiveWeights, getLatestInsights } from './adaptive_learning';
import { ConversionPattern, getConversionMetrics } from './conversion_analyzer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export interface DynamicScore {
  overall: number; // 0-100
  breakdown: {
    icpScore: number; // Base ICP score
    conversionProbability: number; // Predicted conversion probability
    marketFit: number; // Market timing and fit
    engagementPotential: number; // Likelihood of engagement
    priority: number; // Overall priority score
  };
  factors: {
    industryMultiplier: number;
    sizeMultiplier: number;
    techStackMultiplier: number;
    painPointMultiplier: number;
    geographicMultiplier: number;
    trendMultiplier: number;
  };
  reasoning: string;
  confidence: number;
  recommendations: string[];
  lastUpdated: string;
}

export interface ScoringModel {
  id: string;
  name: string;
  version: string;
  weights: AdaptiveWeights;
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  trainingData: {
    totalProspects: number;
    totalConversions: number;
    trainingPeriod: string;
  };
  createdAt: string;
  isActive: boolean;
}

/**
 * Calculate dynamic score for a prospect using adaptive learning
 */
export async function calculateDynamicScore(prospect: any): Promise<DynamicScore> {
  console.log('[DynamicScoring] Calculating dynamic score for:', prospect.business_name);
  
  try {
    // Get base ICP score
    const icpScore = calculateICPScore(prospect);
    
    // Get adaptive weights
    const adaptiveWeights = await getAdaptiveWeights();
    
    // Get conversion patterns
    const conversionPatterns = await getConversionPatterns();
    
    // Calculate conversion probability
    const conversionProbability = calculateConversionProbability(prospect, conversionPatterns);
    
    // Calculate market fit
    const marketFit = calculateMarketFit(prospect, adaptiveWeights);
    
    // Calculate engagement potential
    const engagementPotential = calculateEngagementPotential(prospect);
    
    // Calculate priority score
    const priority = calculatePriorityScore({
      icpScore: icpScore.overall,
      conversionProbability,
      marketFit,
      engagementPotential
    });
    
    // Calculate multipliers based on adaptive learning
    const factors = calculateAdaptiveFactors(prospect, adaptiveWeights, conversionPatterns);
    
    // Apply multipliers to overall score
    const overall = Math.min(100, Math.max(0, 
      (icpScore.overall * 0.4) +
      (conversionProbability * 0.3) +
      (marketFit * 0.2) +
      (engagementPotential * 0.1)
    ));
    
    // Generate reasoning
    const reasoning = generateDynamicReasoning({
      icpScore: icpScore.overall,
      conversionProbability,
      marketFit,
      engagementPotential,
      factors
    });
    
    // Generate recommendations
    const recommendations = generateDynamicRecommendations(prospect, factors, overall);
    
    // Calculate confidence
    const confidence = calculateDynamicConfidence(prospect, adaptiveWeights);
    
    const dynamicScore: DynamicScore = {
      overall: Math.round(overall),
      breakdown: {
        icpScore: icpScore.overall,
        conversionProbability: Math.round(conversionProbability),
        marketFit: Math.round(marketFit),
        engagementPotential: Math.round(engagementPotential),
        priority: Math.round(priority)
      },
      factors,
      reasoning,
      confidence,
      recommendations,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('[DynamicScoring] ✅ Dynamic score calculated:', overall);
    return dynamicScore;
    
  } catch (error) {
    console.error('[DynamicScoring] ❌ Error calculating dynamic score:', error);
    return getDefaultDynamicScore(prospect);
  }
}

/**
 * Get adaptive weights from learning system
 */
async function getAdaptiveWeights(): Promise<AdaptiveWeights> {
  try {
    const { data, error } = await supabase
      .from('prospect_adaptive_weights')
      .select('weights_data')
      .eq('id', 'current_weights')
      .single();
    
    if (error || !data) {
      console.log('[DynamicScoring] No adaptive weights found, using base ICP');
      return getBaseAdaptiveWeights();
    }
    
    return data.weights_data;
  } catch (error) {
    console.error('[DynamicScoring] Error fetching adaptive weights:', error);
    return getBaseAdaptiveWeights();
  }
}

/**
 * Get conversion patterns for probability calculation
 */
async function getConversionPatterns(): Promise<ConversionPattern[]> {
  try {
    const { data, error } = await supabase
      .from('prospect_conversion_patterns')
      .select('*')
      .gte('conversion_rate', 0.05); // Only patterns with 5%+ conversion rate
    
    if (error) {
      console.error('[DynamicScoring] Error fetching conversion patterns:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('[DynamicScoring] Error fetching conversion patterns:', error);
    return [];
  }
}

/**
 * Calculate conversion probability based on patterns
 */
function calculateConversionProbability(prospect: any, patterns: ConversionPattern[]): number {
  let probability = 0.05; // Base 5% probability
  let matches = 0;
  let totalWeight = 0;
  
  // Match prospect characteristics to conversion patterns
  patterns.forEach(pattern => {
    let matches = false;
    
    switch (pattern.patternType) {
      case 'industry':
        matches = prospect.industry?.toLowerCase() === pattern.patternValue.toLowerCase();
        break;
      case 'company_size':
        const size = prospect.metadata?.employeeCount || 0;
        matches = getSizeRange(size) === pattern.patternValue;
        break;
      case 'tech_stack':
        const techStack = prospect.metadata?.techStack || [];
        matches = techStack.includes(pattern.patternValue);
        break;
      case 'pain_point':
        const painPoints = prospect.metadata?.painPoints || [];
        matches = painPoints.includes(pattern.patternValue);
        break;
      case 'geography':
        matches = prospect.region?.toUpperCase() === pattern.patternValue.toUpperCase();
        break;
      case 'icp_score':
        const icpScore = prospect.automation_need_score || 0;
        matches = getICPRange(icpScore) === pattern.patternValue;
        break;
    }
    
    if (matches) {
      probability += pattern.conversionRate * pattern.confidence;
      matches++;
      totalWeight += pattern.confidence;
    }
  });
  
  // Normalize probability
  if (totalWeight > 0) {
    probability = Math.min(0.95, probability / totalWeight);
  }
  
  return probability * 100; // Convert to 0-100 scale
}

/**
 * Calculate market fit based on adaptive weights
 */
function calculateMarketFit(prospect: any, weights: AdaptiveWeights): number {
  let marketFit = 50; // Base 50% market fit
  
  // Industry fit
  if (prospect.industry && weights.industry[prospect.industry]) {
    marketFit += (weights.industry[prospect.industry] - 0.5) * 40;
  }
  
  // Company size fit
  if (prospect.metadata?.employeeCount) {
    const size = prospect.metadata.employeeCount;
    if (size >= weights.companySize.min && size <= weights.companySize.max) {
      marketFit += 20;
    } else {
      marketFit -= 10;
    }
  }
  
  // Tech stack fit
  if (prospect.metadata?.techStack) {
    const techStack = prospect.metadata.techStack;
    let techFit = 0;
    let techCount = 0;
    
    techStack.forEach((tech: string) => {
      if (weights.techStack[tech]) {
        techFit += weights.techStack[tech];
        techCount++;
      }
    });
    
    if (techCount > 0) {
      marketFit += (techFit / techCount - 0.5) * 20;
    }
  }
  
  // Geographic fit
  if (prospect.region && weights.geography[prospect.region]) {
    marketFit += (weights.geography[prospect.region] - 0.5) * 20;
  }
  
  return Math.min(100, Math.max(0, marketFit));
}

/**
 * Calculate engagement potential
 */
function calculateEngagementPotential(prospect: any): number {
  let engagement = 50; // Base 50% engagement potential
  
  // Contact method availability
  if (prospect.contact_email) engagement += 20;
  if (prospect.metadata?.form_scan?.has_form) engagement += 15;
  if (prospect.metadata?.form_scan?.has_mailto) engagement += 10;
  
  // Website quality indicators
  if (prospect.metadata?.websiteContent) {
    const content = prospect.metadata.websiteContent.toLowerCase();
    
    // Positive engagement indicators
    if (content.includes('contact') || content.includes('get in touch')) engagement += 10;
    if (content.includes('free') || content.includes('demo')) engagement += 10;
    if (content.includes('consultation') || content.includes('quote')) engagement += 15;
    
    // Negative engagement indicators
    if (content.includes('not accepting') || content.includes('no longer')) engagement -= 20;
    if (prospect.metadata?.form_scan?.has_captcha) engagement -= 10;
  }
  
  // Company size factor (smaller companies often more responsive)
  if (prospect.metadata?.employeeCount) {
    const size = prospect.metadata.employeeCount;
    if (size < 50) engagement += 10;
    else if (size > 200) engagement -= 5;
  }
  
  return Math.min(100, Math.max(0, engagement));
}

/**
 * Calculate priority score
 */
function calculatePriorityScore(scores: {
  icpScore: number;
  conversionProbability: number;
  marketFit: number;
  engagementPotential: number;
}): number {
  // Weighted combination of all factors
  const priority = (
    scores.icpScore * 0.3 +
    scores.conversionProbability * 0.3 +
    scores.marketFit * 0.25 +
    scores.engagementPotential * 0.15
  );
  
  return Math.min(100, Math.max(0, priority));
}

/**
 * Calculate adaptive factors/multipliers
 */
function calculateAdaptiveFactors(
  prospect: any, 
  weights: AdaptiveWeights, 
  patterns: ConversionPattern[]
): DynamicScore['factors'] {
  // Industry multiplier
  const industryMultiplier = prospect.industry && weights.industry[prospect.industry] 
    ? weights.industry[prospect.industry] 
    : 1.0;
  
  // Size multiplier
  let sizeMultiplier = 1.0;
  if (prospect.metadata?.employeeCount) {
    const size = prospect.metadata.employeeCount;
    if (size >= weights.companySize.min && size <= weights.companySize.max) {
      sizeMultiplier = 1.2;
    } else {
      sizeMultiplier = 0.8;
    }
  }
  
  // Tech stack multiplier
  let techStackMultiplier = 1.0;
  if (prospect.metadata?.techStack) {
    const techStack = prospect.metadata.techStack;
    let totalWeight = 0;
    let count = 0;
    
    techStack.forEach((tech: string) => {
      if (weights.techStack[tech]) {
        totalWeight += weights.techStack[tech];
        count++;
      }
    });
    
    if (count > 0) {
      techStackMultiplier = totalWeight / count;
    }
  }
  
  // Pain point multiplier
  let painPointMultiplier = 1.0;
  if (prospect.metadata?.painPoints) {
    const painPoints = prospect.metadata.painPoints;
    let totalWeight = 0;
    let count = 0;
    
    painPoints.forEach((painPoint: string) => {
      if (weights.painPoints[painPoint]) {
        totalWeight += weights.painPoints[painPoint];
        count++;
      }
    });
    
    if (count > 0) {
      painPointMultiplier = totalWeight / count;
    }
  }
  
  // Geographic multiplier
  const geographicMultiplier = prospect.region && weights.geography[prospect.region]
    ? weights.geography[prospect.region]
    : 1.0;
  
  // Trend multiplier (based on recent conversion patterns)
  let trendMultiplier = 1.0;
  const recentPatterns = patterns.filter(p => 
    p.patternType === 'industry' && 
    p.patternValue === prospect.industry &&
    p.trend === 'increasing'
  );
  
  if (recentPatterns.length > 0) {
    trendMultiplier = 1.1; // 10% boost for trending industries
  }
  
  return {
    industryMultiplier,
    sizeMultiplier,
    techStackMultiplier,
    painPointMultiplier,
    geographicMultiplier,
    trendMultiplier
  };
}

/**
 * Generate dynamic reasoning
 */
function generateDynamicReasoning(data: any): string {
  const { icpScore, conversionProbability, marketFit, engagementPotential, factors } = data;
  
  let reasoning = `Dynamic Score Analysis: `;
  
  // ICP Score reasoning
  if (icpScore >= 80) {
    reasoning += `Excellent ICP fit (${icpScore}/100). `;
  } else if (icpScore >= 60) {
    reasoning += `Good ICP fit (${icpScore}/100). `;
  } else {
    reasoning += `Moderate ICP fit (${icpScore}/100). `;
  }
  
  // Conversion probability reasoning
  if (conversionProbability >= 20) {
    reasoning += `High conversion probability (${conversionProbability.toFixed(1)}%). `;
  } else if (conversionProbability >= 10) {
    reasoning += `Moderate conversion probability (${conversionProbability.toFixed(1)}%). `;
  } else {
    reasoning += `Low conversion probability (${conversionProbability.toFixed(1)}%). `;
  }
  
  // Market fit reasoning
  if (marketFit >= 80) {
    reasoning += `Strong market fit (${marketFit.toFixed(1)}%). `;
  } else if (marketFit >= 60) {
    reasoning += `Good market fit (${marketFit.toFixed(1)}%). `;
  } else {
    reasoning += `Moderate market fit (${marketFit.toFixed(1)}%). `;
  }
  
  // Engagement potential reasoning
  if (engagementPotential >= 80) {
    reasoning += `High engagement potential (${engagementPotential.toFixed(1)}%). `;
  } else if (engagementPotential >= 60) {
    reasoning += `Good engagement potential (${engagementPotential.toFixed(1)}%). `;
  } else {
    reasoning += `Moderate engagement potential (${engagementPotential.toFixed(1)}%). `;
  }
  
  // Factor analysis
  const highFactors = [];
  const lowFactors = [];
  
  if (factors.industryMultiplier > 1.1) highFactors.push('industry');
  if (factors.industryMultiplier < 0.9) lowFactors.push('industry');
  
  if (factors.sizeMultiplier > 1.1) highFactors.push('company size');
  if (factors.sizeMultiplier < 0.9) lowFactors.push('company size');
  
  if (factors.techStackMultiplier > 1.1) highFactors.push('tech stack');
  if (factors.techStackMultiplier < 0.9) lowFactors.push('tech stack');
  
  if (highFactors.length > 0) {
    reasoning += `Strong factors: ${highFactors.join(', ')}. `;
  }
  
  if (lowFactors.length > 0) {
    reasoning += `Weak factors: ${lowFactors.join(', ')}.`;
  }
  
  return reasoning;
}

/**
 * Generate dynamic recommendations
 */
function generateDynamicRecommendations(prospect: any, factors: any, overallScore: number): string[] {
  const recommendations: string[] = [];
  
  // High score recommendations
  if (overallScore >= 80) {
    recommendations.push('High priority prospect - prioritize outreach');
    recommendations.push('Consider premium outreach approach');
    recommendations.push('Fast-track to personalized email sequence');
  } else if (overallScore >= 60) {
    recommendations.push('Good prospect - include in standard outreach');
    recommendations.push('Monitor for engagement signals');
  } else if (overallScore >= 40) {
    recommendations.push('Moderate prospect - consider nurturing sequence');
    recommendations.push('Focus on education and value demonstration');
  } else {
    recommendations.push('Low priority - consider deprioritizing');
    recommendations.push('May benefit from different messaging approach');
  }
  
  // Factor-specific recommendations
  if (factors.industryMultiplier > 1.1) {
    recommendations.push('Leverage industry-specific case studies');
  }
  
  if (factors.sizeMultiplier > 1.1) {
    recommendations.push('Emphasize scalability and growth benefits');
  }
  
  if (factors.techStackMultiplier > 1.1) {
    recommendations.push('Highlight technical integration capabilities');
  }
  
  if (factors.engagementPotential < 0.8) {
    recommendations.push('Consider alternative contact methods');
    recommendations.push('Focus on value-driven content approach');
  }
  
  return recommendations;
}

/**
 * Calculate dynamic confidence
 */
function calculateDynamicConfidence(prospect: any, weights: AdaptiveWeights): number {
  let confidence = 0.5; // Base 50% confidence
  
  // Data completeness factors
  if (prospect.industry) confidence += 0.1;
  if (prospect.metadata?.employeeCount) confidence += 0.1;
  if (prospect.metadata?.techStack) confidence += 0.1;
  if (prospect.metadata?.painPoints) confidence += 0.1;
  if (prospect.contact_email) confidence += 0.1;
  
  // Learning data availability
  if (weights.industry[prospect.industry]) confidence += 0.05;
  if (prospect.metadata?.techStack) {
    const hasKnownTech = prospect.metadata.techStack.some((tech: string) => weights.techStack[tech]);
    if (hasKnownTech) confidence += 0.05;
  }
  
  return Math.min(1.0, confidence);
}

// Helper functions

function getSizeRange(size: number): string {
  if (size <= 10) return '1-10';
  if (size <= 50) return '10-50';
  if (size <= 100) return '50-100';
  if (size <= 200) return '100-200';
  return '200+';
}

function getICPRange(score: number): string {
  if (score < 30) return '0-30';
  if (score < 50) return '30-50';
  if (score < 70) return '50-70';
  if (score < 85) return '70-85';
  return '85-100';
}

function getBaseAdaptiveWeights(): AdaptiveWeights {
  return {
    industry: AVENIR_ICP.industries.weights,
    companySize: AVENIR_ICP.companySize,
    techStack: AVENIR_ICP.techStack.weights,
    painPoints: {},
    geography: AVENIR_ICP.geography.weights,
    icpThreshold: 70,
    lastUpdated: new Date().toISOString()
  };
}

function getDefaultDynamicScore(prospect: any): DynamicScore {
  return {
    overall: 50,
    breakdown: {
      icpScore: 50,
      conversionProbability: 5,
      marketFit: 50,
      engagementPotential: 50,
      priority: 50
    },
    factors: {
      industryMultiplier: 1.0,
      sizeMultiplier: 1.0,
      techStackMultiplier: 1.0,
      painPointMultiplier: 1.0,
      geographicMultiplier: 1.0,
      trendMultiplier: 1.0
    },
    reasoning: 'Insufficient data for dynamic scoring. Using default values.',
    confidence: 0.3,
    recommendations: ['Collect more prospect data for better scoring'],
    lastUpdated: new Date().toISOString()
  };
}
