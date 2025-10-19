// ============================================
// Phase 3: Conversion Analyzer
// ============================================
// Analyzes prospect conversion patterns and identifies high-performing characteristics

import { createClient } from '@supabase/supabase-js';
import { ICPScore } from './icp_profile';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export interface ConversionPattern {
  id: string;
  patternType: 'industry' | 'company_size' | 'tech_stack' | 'pain_point' | 'geography' | 'icp_score';
  patternValue: string;
  conversionRate: number;
  totalProspects: number;
  totalConversions: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastUpdated: string;
}

export interface ConversionInsight {
  id: string;
  insightType: 'high_converter' | 'low_converter' | 'emerging_trend' | 'declining_trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  data: any;
  recommendations: string[];
  createdAt: string;
}

export interface ConversionMetrics {
  overallConversionRate: number;
  totalProspects: number;
  totalConversions: number;
  averageICPScore: number;
  topConvertingPatterns: ConversionPattern[];
  insights: ConversionInsight[];
  trends: {
    conversionRate: { current: number; previous: number; change: number };
    icpScore: { current: number; previous: number; change: number };
    volume: { current: number; previous: number; change: number };
  };
  lastUpdated: string;
}

/**
 * Analyze conversion patterns from prospect data
 */
export async function analyzeConversionPatterns(daysBack: number = 90): Promise<ConversionPattern[]> {
  console.log('[ConversionAnalyzer] ============================================');
  console.log('[ConversionAnalyzer] Analyzing conversion patterns...');
  console.log('[ConversionAnalyzer] Days back:', daysBack);
  
  try {
    const patterns: ConversionPattern[] = [];
    
    // Get conversion data
    const { data: conversions, error: convError } = await supabase
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
    
    if (convError) {
      console.error('[ConversionAnalyzer] Error fetching conversions:', convError);
      throw convError;
    }
    
    // Get total prospects for comparison
    const { data: totalProspects, error: totalError } = await supabase
      .from('prospect_candidates')
      .select('id, industry, region, automation_need_score, metadata')
      .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());
    
    if (totalError) {
      console.error('[ConversionAnalyzer] Error fetching total prospects:', totalError);
      throw totalError;
    }
    
    console.log('[ConversionAnalyzer] Conversions:', conversions?.length || 0);
    console.log('[ConversionAnalyzer] Total prospects:', totalProspects?.length || 0);
    
    // Analyze by industry
    const industryPatterns = analyzeIndustryPatterns(conversions || [], totalProspects || []);
    patterns.push(...industryPatterns);
    
    // Analyze by company size
    const sizePatterns = analyzeCompanySizePatterns(conversions || [], totalProspects || []);
    patterns.push(...sizePatterns);
    
    // Analyze by tech stack
    const techPatterns = analyzeTechStackPatterns(conversions || [], totalProspects || []);
    patterns.push(...techPatterns);
    
    // Analyze by pain points
    const painPointPatterns = analyzePainPointPatterns(conversions || [], totalProspects || []);
    patterns.push(...painPointPatterns);
    
    // Analyze by geography
    const geoPatterns = analyzeGeographyPatterns(conversions || [], totalProspects || []);
    patterns.push(...geoPatterns);
    
    // Analyze by ICP score ranges
    const icpPatterns = analyzeICPScorePatterns(conversions || [], totalProspects || []);
    patterns.push(...icpPatterns);
    
    console.log('[ConversionAnalyzer] ✅ Analysis complete');
    console.log('[ConversionAnalyzer] Patterns found:', patterns.length);
    console.log('[ConversionAnalyzer] ============================================');
    
    return patterns;
    
  } catch (error) {
    console.error('[ConversionAnalyzer] ❌ Analysis failed:', error);
    return [];
  }
}

/**
 * Generate conversion insights from patterns
 */
export async function generateConversionInsights(patterns: ConversionPattern[]): Promise<ConversionInsight[]> {
  console.log('[ConversionAnalyzer] Generating conversion insights...');
  
  const insights: ConversionInsight[] = [];
  
  // High converter insights
  const highConverters = patterns.filter(p => p.conversionRate > 0.15 && p.totalConversions >= 3);
  highConverters.forEach(pattern => {
    insights.push({
      id: `high_converter_${pattern.id}`,
      insightType: 'high_converter',
      title: `High Converting ${pattern.patternType.replace('_', ' ')}: ${pattern.patternValue}`,
      description: `${pattern.patternValue} shows a ${(pattern.conversionRate * 100).toFixed(1)}% conversion rate with ${pattern.totalConversions} conversions.`,
      impact: pattern.conversionRate > 0.25 ? 'high' : 'medium',
      confidence: pattern.confidence,
      data: pattern,
      recommendations: [
        `Increase targeting for ${pattern.patternValue}`,
        `Prioritize prospects matching this pattern`,
        `Create specific outreach templates for this segment`
      ],
      createdAt: new Date().toISOString()
    });
  });
  
  // Low converter insights
  const lowConverters = patterns.filter(p => p.conversionRate < 0.05 && p.totalProspects >= 10);
  lowConverters.forEach(pattern => {
    insights.push({
      id: `low_converter_${pattern.id}`,
      insightType: 'low_converter',
      title: `Low Converting ${pattern.patternType.replace('_', ' ')}: ${pattern.patternValue}`,
      description: `${pattern.patternValue} shows only a ${(pattern.conversionRate * 100).toFixed(1)}% conversion rate despite ${pattern.totalProspects} prospects.`,
      impact: 'medium',
      confidence: pattern.confidence,
      data: pattern,
      recommendations: [
        `Reduce targeting for ${pattern.patternValue}`,
        `Investigate why this segment underperforms`,
        `Consider different messaging for this segment`
      ],
      createdAt: new Date().toISOString()
    });
  });
  
  // Emerging trends (increasing conversion rates)
  const emergingTrends = patterns.filter(p => p.trend === 'increasing' && p.conversionRate > 0.1);
  emergingTrends.forEach(pattern => {
    insights.push({
      id: `emerging_trend_${pattern.id}`,
      insightType: 'emerging_trend',
      title: `Emerging Trend: ${pattern.patternValue}`,
      description: `${pattern.patternValue} is showing increasing conversion rates, currently at ${(pattern.conversionRate * 100).toFixed(1)}%.`,
      impact: 'medium',
      confidence: pattern.confidence,
      data: pattern,
      recommendations: [
        `Monitor this trend closely`,
        `Consider increasing investment in this segment`,
        `Document what's working for this pattern`
      ],
      createdAt: new Date().toISOString()
    });
  });
  
  // Declining trends (decreasing conversion rates)
  const decliningTrends = patterns.filter(p => p.trend === 'decreasing' && p.totalConversions >= 5);
  decliningTrends.forEach(pattern => {
    insights.push({
      id: `declining_trend_${pattern.id}`,
      insightType: 'declining_trend',
      title: `Declining Trend: ${pattern.patternValue}`,
      description: `${pattern.patternValue} is showing decreasing conversion rates, currently at ${(pattern.conversionRate * 100).toFixed(1)}%.`,
      impact: 'medium',
      confidence: pattern.confidence,
      data: pattern,
      recommendations: [
        `Investigate why this segment is declining`,
        `Consider adjusting targeting strategy`,
        `Review messaging and approach for this segment`
      ],
      createdAt: new Date().toISOString()
    });
  });
  
  console.log('[ConversionAnalyzer] ✅ Insights generated:', insights.length);
  return insights;
}

/**
 * Get comprehensive conversion metrics
 */
export async function getConversionMetrics(daysBack: number = 90): Promise<ConversionMetrics> {
  console.log('[ConversionAnalyzer] Getting conversion metrics...');
  
  try {
    // Get current period data
    const currentStart = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const previousStart = new Date(Date.now() - (daysBack * 2) * 24 * 60 * 60 * 1000);
    const previousEnd = currentStart;
    
    // Current period conversions
    const { data: currentConversions, error: currentConvError } = await supabase
      .from('feedback_tracking')
      .select('*')
      .eq('action_type', 'lead_conversion')
      .eq('outcome', 'positive')
      .gte('created_at', currentStart.toISOString());
    
    if (currentConvError) {
      console.error('[ConversionAnalyzer] Error fetching current conversions:', currentConvError);
      throw currentConvError;
    }
    
    // Current period prospects
    const { data: currentProspects, error: currentProspectsError } = await supabase
      .from('prospect_candidates')
      .select('automation_need_score')
      .gte('created_at', currentStart.toISOString());
    
    if (currentProspectsError) {
      console.error('[ConversionAnalyzer] Error fetching current prospects:', currentProspectsError);
      throw currentProspectsError;
    }
    
    // Previous period conversions
    const { data: previousConversions, error: prevConvError } = await supabase
      .from('feedback_tracking')
      .select('*')
      .eq('action_type', 'lead_conversion')
      .eq('outcome', 'positive')
      .gte('created_at', previousStart.toISOString())
      .lt('created_at', previousEnd.toISOString());
    
    if (prevConvError) {
      console.error('[ConversionAnalyzer] Error fetching previous conversions:', prevConvError);
      throw prevConvError;
    }
    
    // Previous period prospects
    const { data: previousProspects, error: prevProspectsError } = await supabase
      .from('prospect_candidates')
      .select('automation_need_score')
      .gte('created_at', previousStart.toISOString())
      .lt('created_at', previousEnd.toISOString());
    
    if (prevProspectsError) {
      console.error('[ConversionAnalyzer] Error fetching previous prospects:', prevProspectsError);
      throw prevProspectsError;
    }
    
    // Calculate metrics
    const currentConversionRate = currentProspects?.length > 0 ? 
      (currentConversions?.length || 0) / currentProspects.length : 0;
    
    const previousConversionRate = previousProspects?.length > 0 ? 
      (previousConversions?.length || 0) / previousProspects.length : 0;
    
    const currentAvgICPScore = currentProspects?.length > 0 ?
      currentProspects.reduce((sum, p) => sum + (p.automation_need_score || 0), 0) / currentProspects.length : 0;
    
    const previousAvgICPScore = previousProspects?.length > 0 ?
      previousProspects.reduce((sum, p) => sum + (p.automation_need_score || 0), 0) / previousProspects.length : 0;
    
    // Get patterns and insights
    const patterns = await analyzeConversionPatterns(daysBack);
    const insights = await generateConversionInsights(patterns);
    
    const metrics: ConversionMetrics = {
      overallConversionRate: currentConversionRate,
      totalProspects: currentProspects?.length || 0,
      totalConversions: currentConversions?.length || 0,
      averageICPScore: currentAvgICPScore,
      topConvertingPatterns: patterns
        .filter(p => p.conversionRate > 0.1)
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 10),
      insights,
      trends: {
        conversionRate: {
          current: currentConversionRate,
          previous: previousConversionRate,
          change: previousConversionRate > 0 ? 
            ((currentConversionRate - previousConversionRate) / previousConversionRate) * 100 : 0
        },
        icpScore: {
          current: currentAvgICPScore,
          previous: previousAvgICPScore,
          change: previousAvgICPScore > 0 ? 
            ((currentAvgICPScore - previousAvgICPScore) / previousAvgICPScore) * 100 : 0
        },
        volume: {
          current: currentProspects?.length || 0,
          previous: previousProspects?.length || 0,
          change: previousProspects?.length > 0 ? 
            (((currentProspects?.length || 0) - previousProspects.length) / previousProspects.length) * 100 : 0
        }
      },
      lastUpdated: new Date().toISOString()
    };
    
    console.log('[ConversionAnalyzer] ✅ Metrics calculated');
    console.log('[ConversionAnalyzer] Conversion rate:', (currentConversionRate * 100).toFixed(2) + '%');
    console.log('[ConversionAnalyzer] Total prospects:', metrics.totalProspects);
    console.log('[ConversionAnalyzer] Total conversions:', metrics.totalConversions);
    
    return metrics;
    
  } catch (error) {
    console.error('[ConversionAnalyzer] ❌ Failed to get metrics:', error);
    return getDefaultMetrics();
  }
}

/**
 * Save conversion patterns to database
 */
export async function saveConversionPatterns(patterns: ConversionPattern[]): Promise<void> {
  try {
    // Clear existing patterns
    await supabase
      .from('prospect_conversion_patterns')
      .delete()
      .neq('id', 'dummy'); // Delete all records
    
    // Insert new patterns
    if (patterns.length > 0) {
      const { error } = await supabase
        .from('prospect_conversion_patterns')
        .insert(patterns);
      
      if (error) {
        console.error('[ConversionAnalyzer] Error saving patterns:', error);
        throw error;
      }
    }
    
    console.log('[ConversionAnalyzer] ✅ Patterns saved to database');
  } catch (error) {
    console.error('[ConversionAnalyzer] ❌ Failed to save patterns:', error);
  }
}

/**
 * Save conversion insights to database
 */
export async function saveConversionInsights(insights: ConversionInsight[]): Promise<void> {
  try {
    // Clear existing insights
    await supabase
      .from('prospect_conversion_insights')
      .delete()
      .neq('id', 'dummy'); // Delete all records
    
    // Insert new insights
    if (insights.length > 0) {
      const { error } = await supabase
        .from('prospect_conversion_insights')
        .insert(insights);
      
      if (error) {
        console.error('[ConversionAnalyzer] Error saving insights:', error);
        throw error;
      }
    }
    
    console.log('[ConversionAnalyzer] ✅ Insights saved to database');
  } catch (error) {
    console.error('[ConversionAnalyzer] ❌ Failed to save insights:', error);
  }
}

// Helper functions for pattern analysis

function analyzeIndustryPatterns(conversions: any[], totalProspects: any[]): ConversionPattern[] {
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
  
  return Array.from(industryStats.entries())
    .map(([industry, stats]) => ({
      id: `industry_${industry.toLowerCase().replace(/\s+/g, '_')}`,
      patternType: 'industry' as const,
      patternValue: industry,
      conversionRate: stats.total > 0 ? stats.conversions / stats.total : 0,
      totalProspects: stats.total,
      totalConversions: stats.conversions,
      confidence: calculateConfidence(stats.conversions, stats.total),
      trend: 'stable' as const, // Would need historical data to calculate
      lastUpdated: new Date().toISOString()
    }))
    .filter(p => p.totalProspects >= 3); // Only include patterns with sufficient data
}

function analyzeCompanySizePatterns(conversions: any[], totalProspects: any[]): ConversionPattern[] {
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
  
  return Array.from(sizeStats.entries())
    .map(([range, stats]) => ({
      id: `size_${range.replace('-', '_')}`,
      patternType: 'company_size' as const,
      patternValue: range,
      conversionRate: stats.total > 0 ? stats.conversions / stats.total : 0,
      totalProspects: stats.total,
      totalConversions: stats.conversions,
      confidence: calculateConfidence(stats.conversions, stats.total),
      trend: 'stable' as const,
      lastUpdated: new Date().toISOString()
    }))
    .filter(p => p.totalProspects >= 3);
}

function analyzeTechStackPatterns(conversions: any[], totalProspects: any[]): ConversionPattern[] {
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
  
  return Array.from(techStats.entries())
    .map(([tech, stats]) => ({
      id: `tech_${tech.toLowerCase().replace(/\s+/g, '_')}`,
      patternType: 'tech_stack' as const,
      patternValue: tech,
      conversionRate: stats.total > 0 ? stats.conversions / stats.total : 0,
      totalProspects: stats.total,
      totalConversions: stats.conversions,
      confidence: calculateConfidence(stats.conversions, stats.total),
      trend: 'stable' as const,
      lastUpdated: new Date().toISOString()
    }))
    .filter(p => p.totalProspects >= 3 && p.totalConversions >= 2);
}

function analyzePainPointPatterns(conversions: any[], totalProspects: any[]): ConversionPattern[] {
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
  
  return Array.from(painPointStats.entries())
    .map(([painPoint, stats]) => ({
      id: `pain_${painPoint.toLowerCase().replace(/\s+/g, '_')}`,
      patternType: 'pain_point' as const,
      patternValue: painPoint,
      conversionRate: stats.total > 0 ? stats.conversions / stats.total : 0,
      totalProspects: stats.total,
      totalConversions: stats.conversions,
      confidence: calculateConfidence(stats.conversions, stats.total),
      trend: 'stable' as const,
      lastUpdated: new Date().toISOString()
    }))
    .filter(p => p.totalProspects >= 3 && p.totalConversions >= 2);
}

function analyzeGeographyPatterns(conversions: any[], totalProspects: any[]): ConversionPattern[] {
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
  
  return Array.from(geoStats.entries())
    .map(([region, stats]) => ({
      id: `geo_${region.toLowerCase()}`,
      patternType: 'geography' as const,
      patternValue: region,
      conversionRate: stats.total > 0 ? stats.conversions / stats.total : 0,
      totalProspects: stats.total,
      totalConversions: stats.conversions,
      confidence: calculateConfidence(stats.conversions, stats.total),
      trend: 'stable' as const,
      lastUpdated: new Date().toISOString()
    }))
    .filter(p => p.totalProspects >= 3);
}

function analyzeICPScorePatterns(conversions: any[], totalProspects: any[]): ConversionPattern[] {
  const icpRanges = ['0-30', '30-50', '50-70', '70-85', '85-100'];
  const icpStats = new Map<string, { conversions: number; total: number }>();
  
  // Initialize all ranges
  icpRanges.forEach(range => {
    icpStats.set(range, { conversions: 0, total: 0 });
  });
  
  // Count conversions by ICP score
  conversions.forEach(conv => {
    const score = conv.prospect_candidates.automation_need_score || 0;
    const range = getICPRange(score);
    const current = icpStats.get(range) || { conversions: 0, total: 0 };
    icpStats.set(range, { ...current, conversions: current.conversions + 1 });
  });
  
  // Count total prospects by ICP score
  totalProspects.forEach(prospect => {
    const score = prospect.automation_need_score || 0;
    const range = getICPRange(score);
    const current = icpStats.get(range) || { conversions: 0, total: 0 };
    icpStats.set(range, { ...current, total: current.total + 1 });
  });
  
  return Array.from(icpStats.entries())
    .map(([range, stats]) => ({
      id: `icp_${range.replace('-', '_')}`,
      patternType: 'icp_score' as const,
      patternValue: range,
      conversionRate: stats.total > 0 ? stats.conversions / stats.total : 0,
      totalProspects: stats.total,
      totalConversions: stats.conversions,
      confidence: calculateConfidence(stats.conversions, stats.total),
      trend: 'stable' as const,
      lastUpdated: new Date().toISOString()
    }))
    .filter(p => p.totalProspects >= 3);
}

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

function calculateConfidence(conversions: number, total: number): number {
  if (total === 0) return 0;
  
  // Higher confidence with more data points
  const sampleSize = Math.min(conversions, 50);
  const baseConfidence = sampleSize / 50;
  
  // Adjust for conversion rate (higher rates = higher confidence in pattern)
  const conversionRate = conversions / total;
  const rateAdjustment = Math.min(1.0, conversionRate * 5);
  
  return Math.min(1.0, baseConfidence * rateAdjustment);
}

function getDefaultMetrics(): ConversionMetrics {
  return {
    overallConversionRate: 0,
    totalProspects: 0,
    totalConversions: 0,
    averageICPScore: 0,
    topConvertingPatterns: [],
    insights: [],
    trends: {
      conversionRate: { current: 0, previous: 0, change: 0 },
      icpScore: { current: 0, previous: 0, change: 0 },
      volume: { current: 0, previous: 0, change: 0 }
    },
    lastUpdated: new Date().toISOString()
  };
}
