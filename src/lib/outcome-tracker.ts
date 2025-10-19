/**
 * Phase 2.1 Module 1: Outcome Tracker
 * 
 * Tracks AI outcomes over time for adaptive learning and performance optimization.
 * Completely isolated from existing systems - only reads from existing tables.
 * 
 * Features:
 * - AI accuracy tracking over time
 * - Lead conversion outcome analysis
 * - Email response rate monitoring
 * - System performance trend analysis
 * - Bilingual support (EN/FR)
 * - Learning algorithm preparation
 */

import { createClient } from '@supabase/supabase-js';
import { logFeedback, logPerformanceMetric, type FeedbackOptions, type PerformanceOptions } from './feedback-processor';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types for outcome tracking
export interface OutcomeAnalysis {
  period_start: string;
  period_end: string;
  total_events: number;
  positive_outcomes: number;
  negative_outcomes: number;
  neutral_outcomes: number;
  success_rate: number;
  accuracy_score: number;
  trend_direction: 'improving' | 'stable' | 'declining';
  confidence_level: number;
}

export interface AiOutcomeMetrics {
  component: string;
  total_analyses: number;
  accurate_predictions: number;
  accuracy_rate: number;
  avg_confidence: number;
  response_time_avg: number;
  error_rate: number;
  trend_data: Array<{
    date: string;
    accuracy: number;
    confidence: number;
    response_time: number;
  }>;
}

export interface LeadConversionOutcome {
  lead_id: string;
  conversion_status: 'converted' | 'not_converted' | 'pending';
  ai_prediction: {
    confidence: number;
    predicted_likelihood: number;
    factors: string[];
  };
  actual_outcome: {
    converted: boolean;
    conversion_time_days?: number;
    conversion_value?: number;
  };
  accuracy_score: number;
  feedback_notes?: string;
}

export interface EmailOutcomeMetrics {
  campaign_id?: string;
  total_sent: number;
  opened: number;
  clicked: number;
  responded: number;
  converted: number;
  open_rate: number;
  click_rate: number;
  response_rate: number;
  conversion_rate: number;
  ai_optimization_score: number;
}

/**
 * Track AI analysis outcome
 */
export async function trackAiOutcome(
  component: string,
  prediction: {
    confidence: number;
    predicted_value: any;
    factors: string[];
  },
  actualOutcome: {
    actual_value: any;
    success: boolean;
    response_time_ms: number;
  },
  options: {
    leadId?: string;
    clientId?: string;
    notes?: string;
    notesEn?: string;
    notesFr?: string;
  } = {}
): Promise<{ success: boolean; accuracyScore?: number; error?: string }> {
  try {
    console.log(`[OutcomeTracker] Tracking AI outcome for component: ${component}`);
    
    // Calculate accuracy score
    const accuracyScore = calculateAccuracyScore(prediction, actualOutcome);
    
    // Log performance metrics
    await logPerformanceMetric(
      'ai_analysis',
      'accuracy',
      accuracyScore,
      component,
      {
        clientId: options.clientId,
        metadata: {
          prediction_confidence: prediction.confidence,
          predicted_value: prediction.predicted_value,
          actual_value: actualOutcome.actual_value,
          factors: prediction.factors
        }
      }
    );

    // Log response time
    await logPerformanceMetric(
      'ai_analysis',
      'response_time',
      actualOutcome.response_time_ms,
      component,
      {
        clientId: options.clientId,
        metadata: {
          accuracy_score: accuracyScore,
          prediction_confidence: prediction.confidence
        }
      }
    );

    // Log feedback based on outcome
    const outcome = actualOutcome.success ? 'positive' : 'negative';
    await logFeedback(
      'system_performance',
      outcome,
      {
        leadId: options.leadId,
        clientId: options.clientId,
        confidence: prediction.confidence,
        impact: Math.round(accuracyScore * 100),
        notes: options.notes,
        notesEn: options.notesEn,
        notesFr: options.notesFr,
        context: {
          component,
          prediction: prediction.predicted_value,
          actual: actualOutcome.actual_value,
          accuracy_score: accuracyScore,
          factors: prediction.factors
        }
      }
    );

    console.log(`[OutcomeTracker] ✅ AI outcome tracked: accuracy=${accuracyScore.toFixed(3)}`);
    return { success: true, accuracyScore };

  } catch (error) {
    console.error('[OutcomeTracker] Error tracking AI outcome:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Track lead conversion outcome
 */
export async function trackLeadConversionOutcome(
  leadId: string,
  aiPrediction: {
    confidence: number;
    predicted_likelihood: number;
    factors: string[];
  },
  actualOutcome: {
    converted: boolean;
    conversion_time_days?: number;
    conversion_value?: number;
  },
  options: {
    clientId?: string;
    notes?: string;
    notesEn?: string;
    notesFr?: string;
  } = {}
): Promise<{ success: boolean; accuracyScore?: number; error?: string }> {
  try {
    console.log(`[OutcomeTracker] Tracking lead conversion outcome for lead: ${leadId}`);
    
    // Calculate accuracy score
    const accuracyScore = calculateConversionAccuracy(aiPrediction, actualOutcome);
    
    // Log conversion outcome
    await logFeedback(
      'lead_conversion',
      actualOutcome.converted ? 'positive' : 'negative',
      {
        leadId,
        clientId: options.clientId,
        confidence: aiPrediction.confidence,
        impact: Math.round(accuracyScore * 100),
        notes: options.notes,
        notesEn: options.notesEn,
        notesFr: options.notesFr,
        context: {
          predicted_likelihood: aiPrediction.predicted_likelihood,
          actual_converted: actualOutcome.converted,
          conversion_time_days: actualOutcome.conversion_time_days,
          conversion_value: actualOutcome.conversion_value,
          accuracy_score: accuracyScore,
          factors: aiPrediction.factors
        }
      }
    );

    // Log performance metrics
    await logPerformanceMetric(
      'lead_processing',
      'conversion_accuracy',
      accuracyScore,
      'lead_conversion_tracker',
      {
        clientId: options.clientId,
        metadata: {
          lead_id: leadId,
          predicted_likelihood: aiPrediction.predicted_likelihood,
          actual_converted: actualOutcome.converted,
          conversion_time_days: actualOutcome.conversion_time_days
        }
      }
    );

    console.log(`[OutcomeTracker] ✅ Lead conversion outcome tracked: accuracy=${accuracyScore.toFixed(3)}`);
    return { success: true, accuracyScore };

  } catch (error) {
    console.error('[OutcomeTracker] Error tracking lead conversion outcome:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Track email campaign outcome
 */
export async function trackEmailOutcome(
  campaignId: string,
  emailMetrics: {
    total_sent: number;
    opened: number;
    clicked: number;
    responded: number;
    converted: number;
  },
  aiOptimization: {
    predicted_open_rate: number;
    predicted_response_rate: number;
    optimization_score: number;
  },
  options: {
    clientId?: string;
    notes?: string;
    notesEn?: string;
    notesFr?: string;
  } = {}
): Promise<{ success: boolean; performanceScore?: number; error?: string }> {
  try {
    console.log(`[OutcomeTracker] Tracking email outcome for campaign: ${campaignId}`);
    
    // Calculate actual rates
    const actualOpenRate = emailMetrics.total_sent > 0 ? emailMetrics.opened / emailMetrics.total_sent : 0;
    const actualResponseRate = emailMetrics.total_sent > 0 ? emailMetrics.responded / emailMetrics.total_sent : 0;
    const actualConversionRate = emailMetrics.total_sent > 0 ? emailMetrics.converted / emailMetrics.total_sent : 0;
    
    // Calculate performance score
    const performanceScore = calculateEmailPerformanceScore(
      { actualOpenRate, actualResponseRate, actualConversionRate },
      aiOptimization
    );
    
    // Log email performance metrics
    await logPerformanceMetric(
      'email_response',
      'open_rate',
      actualOpenRate,
      'email_campaign',
      {
        clientId: options.clientId,
        metadata: {
          campaign_id: campaignId,
          total_sent: emailMetrics.total_sent,
          predicted_open_rate: aiOptimization.predicted_open_rate,
          optimization_score: aiOptimization.optimization_score
        }
      }
    );

    await logPerformanceMetric(
      'email_response',
      'response_rate',
      actualResponseRate,
      'email_campaign',
      {
        clientId: options.clientId,
        metadata: {
          campaign_id: campaignId,
          total_sent: emailMetrics.total_sent,
          predicted_response_rate: aiOptimization.predicted_response_rate,
          optimization_score: aiOptimization.optimization_score
        }
      }
    );

    // Log feedback
    const outcome = performanceScore > 0.7 ? 'positive' : performanceScore > 0.4 ? 'neutral' : 'negative';
    await logFeedback(
      'email_response',
      outcome,
      {
        clientId: options.clientId,
        confidence: aiOptimization.optimization_score,
        impact: Math.round(performanceScore * 100),
        notes: options.notes,
        notesEn: options.notesEn,
        notesFr: options.notesFr,
        context: {
          campaign_id: campaignId,
          email_metrics: emailMetrics,
          ai_optimization: aiOptimization,
          performance_score: performanceScore,
          actual_rates: {
            open_rate: actualOpenRate,
            response_rate: actualResponseRate,
            conversion_rate: actualConversionRate
          }
        }
      }
    );

    console.log(`[OutcomeTracker] ✅ Email outcome tracked: performance=${performanceScore.toFixed(3)}`);
    return { success: true, performanceScore };

  } catch (error) {
    console.error('[OutcomeTracker] Error tracking email outcome:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get AI outcome analysis for a specific component
 */
export async function getAiOutcomeAnalysis(
  component: string,
  daysBack: number = 30
): Promise<{ success: boolean; analysis?: AiOutcomeMetrics; error?: string }> {
  try {
    console.log(`[OutcomeTracker] Getting AI outcome analysis for component: ${component}`);
    
    // Get performance metrics for the component
    const { data: metrics, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('source_component', component)
      .eq('event_type', 'ai_analysis')
      .gte('recorded_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: true });

    if (error) {
      console.error('[OutcomeTracker] Failed to get AI outcome metrics:', error);
      return { success: false, error: error.message };
    }

    if (!metrics || metrics.length === 0) {
      console.log(`[OutcomeTracker] No metrics found for component: ${component}`);
      return { success: true, analysis: createEmptyAiOutcomeMetrics(component) };
    }

    // Process metrics into analysis
    const analysis = processAiOutcomeMetrics(metrics, component);
    
    console.log(`[OutcomeTracker] ✅ AI outcome analysis completed: ${analysis.total_analyses} analyses`);
    return { success: true, analysis };

  } catch (error) {
    console.error('[OutcomeTracker] Error getting AI outcome analysis:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get lead conversion outcome analysis
 */
export async function getLeadConversionAnalysis(
  clientId?: string,
  daysBack: number = 30
): Promise<{ success: boolean; analysis?: OutcomeAnalysis; error?: string }> {
  try {
    console.log(`[OutcomeTracker] Getting lead conversion analysis for client: ${clientId || 'all'}`);
    
    // Get feedback data for lead conversions
    let query = supabase
      .from('feedback_tracking')
      .select('*')
      .eq('action_type', 'lead_conversion')
      .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    const { data: feedback, error } = await query;

    if (error) {
      console.error('[OutcomeTracker] Failed to get lead conversion feedback:', error);
      return { success: false, error: error.message };
    }

    if (!feedback || feedback.length === 0) {
      console.log(`[OutcomeTracker] No lead conversion data found`);
      return { success: true, analysis: createEmptyOutcomeAnalysis(daysBack) };
    }

    // Process feedback into analysis
    const analysis = processLeadConversionFeedback(feedback, daysBack);
    
    console.log(`[OutcomeTracker] ✅ Lead conversion analysis completed: ${analysis.total_events} events`);
    return { success: true, analysis };

  } catch (error) {
    console.error('[OutcomeTracker] Error getting lead conversion analysis:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get email outcome analysis
 */
export async function getEmailOutcomeAnalysis(
  clientId?: string,
  daysBack: number = 30
): Promise<{ success: boolean; analysis?: EmailOutcomeMetrics; error?: string }> {
  try {
    console.log(`[OutcomeTracker] Getting email outcome analysis for client: ${clientId || 'all'}`);
    
    // Get feedback data for email responses
    let query = supabase
      .from('feedback_tracking')
      .select('*')
      .eq('action_type', 'email_response')
      .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    const { data: feedback, error } = await query;

    if (error) {
      console.error('[OutcomeTracker] Failed to get email outcome feedback:', error);
      return { success: false, error: error.message };
    }

    if (!feedback || feedback.length === 0) {
      console.log(`[OutcomeTracker] No email outcome data found`);
      return { success: true, analysis: createEmptyEmailOutcomeMetrics() };
    }

    // Process feedback into analysis
    const analysis = processEmailOutcomeFeedback(feedback);
    
    console.log(`[OutcomeTracker] ✅ Email outcome analysis completed: ${analysis.total_sent} emails`);
    return { success: true, analysis };

  } catch (error) {
    console.error('[OutcomeTracker] Error getting email outcome analysis:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Helper functions

function calculateAccuracyScore(prediction: any, actualOutcome: any): number {
  // Simple accuracy calculation - can be enhanced based on specific use cases
  if (prediction.predicted_value === actualOutcome.actual_value) {
    return 1.0;
  }
  
  // For numeric predictions, calculate relative accuracy
  if (typeof prediction.predicted_value === 'number' && typeof actualOutcome.actual_value === 'number') {
    const diff = Math.abs(prediction.predicted_value - actualOutcome.actual_value);
    const maxValue = Math.max(prediction.predicted_value, actualOutcome.actual_value);
    return maxValue > 0 ? Math.max(0, 1 - (diff / maxValue)) : 0;
  }
  
  // For boolean predictions
  if (typeof prediction.predicted_value === 'boolean' && typeof actualOutcome.actual_value === 'boolean') {
    return prediction.predicted_value === actualOutcome.actual_value ? 1.0 : 0.0;
  }
  
  // Default accuracy based on confidence
  return prediction.confidence || 0.5;
}

function calculateConversionAccuracy(prediction: any, actualOutcome: any): number {
  const predictedLikelihood = prediction.predicted_likelihood || 0.5;
  const actualConverted = actualOutcome.converted ? 1.0 : 0.0;
  
  // Calculate accuracy based on how close the prediction was to reality
  const accuracy = 1 - Math.abs(predictedLikelihood - actualConverted);
  return Math.max(0, accuracy);
}

function calculateEmailPerformanceScore(actual: any, predicted: any): number {
  const openRateAccuracy = 1 - Math.abs(actual.actualOpenRate - predicted.predicted_open_rate);
  const responseRateAccuracy = 1 - Math.abs(actual.actualResponseRate - predicted.predicted_response_rate);
  
  return (openRateAccuracy + responseRateAccuracy) / 2;
}

function processAiOutcomeMetrics(metrics: any[], component: string): AiOutcomeMetrics {
  const accuracyMetrics = metrics.filter(m => m.metric_name === 'accuracy');
  const responseTimeMetrics = metrics.filter(m => m.metric_name === 'response_time');
  
  const totalAnalyses = accuracyMetrics.length;
  const accuratePredictions = accuracyMetrics.filter(m => m.metric_value > 0.7).length;
  const accuracyRate = totalAnalyses > 0 ? accuratePredictions / totalAnalyses : 0;
  const avgConfidence = accuracyMetrics.reduce((sum, m) => sum + (m.metadata?.prediction_confidence || 0), 0) / totalAnalyses || 0;
  const responseTimeAvg = responseTimeMetrics.reduce((sum, m) => sum + m.metric_value, 0) / responseTimeMetrics.length || 0;
  const errorRate = 1 - accuracyRate;
  
  // Create trend data
  const trendData = accuracyMetrics.map(m => ({
    date: m.recorded_at.split('T')[0],
    accuracy: m.metric_value,
    confidence: m.metadata?.prediction_confidence || 0,
    response_time: responseTimeMetrics.find(rt => 
      Math.abs(new Date(rt.recorded_at).getTime() - new Date(m.recorded_at).getTime()) < 60000
    )?.metric_value || 0
  }));
  
  return {
    component,
    total_analyses: totalAnalyses,
    accurate_predictions: accuratePredictions,
    accuracy_rate: accuracyRate,
    avg_confidence: avgConfidence,
    response_time_avg: responseTimeAvg,
    error_rate: errorRate,
    trend_data: trendData
  };
}

function processLeadConversionFeedback(feedback: any[], daysBack: number): OutcomeAnalysis {
  const totalEvents = feedback.length;
  const positiveOutcomes = feedback.filter(f => f.outcome === 'positive').length;
  const negativeOutcomes = feedback.filter(f => f.outcome === 'negative').length;
  const neutralOutcomes = feedback.filter(f => f.outcome === 'neutral').length;
  const successRate = totalEvents > 0 ? positiveOutcomes / totalEvents : 0;
  
  // Calculate average accuracy from context data
  const accuracyScores = feedback
    .map(f => f.context_data?.accuracy_score)
    .filter(score => typeof score === 'number');
  const accuracyScore = accuracyScores.length > 0 
    ? accuracyScores.reduce((sum, score) => sum + score, 0) / accuracyScores.length 
    : 0;
  
  // Determine trend direction (simplified)
  const recentFeedback = feedback.slice(-Math.floor(totalEvents * 0.3));
  const recentSuccessRate = recentFeedback.length > 0 
    ? recentFeedback.filter(f => f.outcome === 'positive').length / recentFeedback.length 
    : 0;
  
  let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';
  if (recentSuccessRate > successRate + 0.1) trendDirection = 'improving';
  else if (recentSuccessRate < successRate - 0.1) trendDirection = 'declining';
  
  const confidenceLevel = Math.min(1.0, totalEvents / 10); // More data = higher confidence
  
  return {
    period_start: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString(),
    period_end: new Date().toISOString(),
    total_events: totalEvents,
    positive_outcomes: positiveOutcomes,
    negative_outcomes: negativeOutcomes,
    neutral_outcomes: neutralOutcomes,
    success_rate: successRate,
    accuracy_score: accuracyScore,
    trend_direction: trendDirection,
    confidence_level: confidenceLevel
  };
}

function processEmailOutcomeFeedback(feedback: any[]): EmailOutcomeMetrics {
  // Aggregate email metrics from feedback context data
  let totalSent = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalResponded = 0;
  let totalConverted = 0;
  let totalOptimizationScore = 0;
  
  feedback.forEach(f => {
    const emailMetrics = f.context_data?.email_metrics;
    const aiOptimization = f.context_data?.ai_optimization;
    
    if (emailMetrics) {
      totalSent += emailMetrics.total_sent || 0;
      totalOpened += emailMetrics.opened || 0;
      totalClicked += emailMetrics.clicked || 0;
      totalResponded += emailMetrics.responded || 0;
      totalConverted += emailMetrics.converted || 0;
    }
    
    if (aiOptimization) {
      totalOptimizationScore += aiOptimization.optimization_score || 0;
    }
  });
  
  const openRate = totalSent > 0 ? totalOpened / totalSent : 0;
  const clickRate = totalSent > 0 ? totalClicked / totalSent : 0;
  const responseRate = totalSent > 0 ? totalResponded / totalSent : 0;
  const conversionRate = totalSent > 0 ? totalConverted / totalSent : 0;
  const avgOptimizationScore = feedback.length > 0 ? totalOptimizationScore / feedback.length : 0;
  
  return {
    total_sent: totalSent,
    opened: totalOpened,
    clicked: totalClicked,
    responded: totalResponded,
    converted: totalConverted,
    open_rate: openRate,
    click_rate: clickRate,
    response_rate: responseRate,
    conversion_rate: conversionRate,
    ai_optimization_score: avgOptimizationScore
  };
}

function createEmptyAiOutcomeMetrics(component: string): AiOutcomeMetrics {
  return {
    component,
    total_analyses: 0,
    accurate_predictions: 0,
    accuracy_rate: 0,
    avg_confidence: 0,
    response_time_avg: 0,
    error_rate: 0,
    trend_data: []
  };
}

function createEmptyOutcomeAnalysis(daysBack: number): OutcomeAnalysis {
  return {
    period_start: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString(),
    period_end: new Date().toISOString(),
    total_events: 0,
    positive_outcomes: 0,
    negative_outcomes: 0,
    neutral_outcomes: 0,
    success_rate: 0,
    accuracy_score: 0,
    trend_direction: 'stable',
    confidence_level: 0
  };
}

function createEmptyEmailOutcomeMetrics(): EmailOutcomeMetrics {
  return {
    total_sent: 0,
    opened: 0,
    clicked: 0,
    responded: 0,
    converted: 0,
    open_rate: 0,
    click_rate: 0,
    response_rate: 0,
    conversion_rate: 0,
    ai_optimization_score: 0
  };
}
