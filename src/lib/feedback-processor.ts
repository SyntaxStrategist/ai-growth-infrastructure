/**
 * Phase 2.1 Module 1: Feedback Processor
 * 
 * Handles insertion and processing of feedback data for adaptive learning.
 * Completely isolated from existing systems - only reads from existing tables.
 * 
 * Features:
 * - Safe feedback collection from existing systems
 * - Bilingual support (EN/FR)
 * - Confidence scoring and impact assessment
 * - Learning integration preparation
 * - Comprehensive error handling
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types for feedback tracking
export interface FeedbackRecord {
  id?: string;
  lead_id?: string;
  client_id?: string;
  action_type: 'lead_conversion' | 'email_response' | 'user_action' | 'system_performance';
  outcome: 'positive' | 'negative' | 'neutral';
  confidence_score?: number;
  impact_score?: number;
  context_data?: Record<string, any>;
  notes?: string;
  notes_en?: string;
  notes_fr?: string;
  created_at?: string;
  processed_at?: string;
  learning_applied?: boolean;
  learning_impact?: number;
}

export interface PerformanceMetric {
  id?: string;
  event_type: 'api_response' | 'ai_analysis' | 'translation' | 'lead_processing' | 'email_response';
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  response_time_ms?: number;
  success_rate?: number;
  ai_accuracy?: number;
  error_count?: number;
  source_component: string;
  client_id?: string;
  request_id?: string;
  user_agent?: string;
  ip_address?: string;
  recorded_at?: string;
  metadata?: Record<string, any>;
  error_message_en?: string;
  error_message_fr?: string;
}

export interface FeedbackOptions {
  clientId?: string;
  leadId?: string;
  confidence?: number;
  impact?: number;
  notes?: string;
  notesEn?: string;
  notesFr?: string;
  context?: Record<string, any>;
}

export interface PerformanceOptions {
  clientId?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  errorMessageEn?: string;
  errorMessageFr?: string;
}

/**
 * Log feedback for adaptive learning
 */
export async function logFeedback(
  actionType: FeedbackRecord['action_type'],
  outcome: FeedbackRecord['outcome'],
  options: FeedbackOptions = {}
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    console.log(`[FeedbackProcessor] Logging feedback: ${actionType} -> ${outcome}`);
    
    const feedbackRecord: Omit<FeedbackRecord, 'id' | 'created_at'> = {
      lead_id: options.leadId,
      client_id: options.clientId,
      action_type: actionType,
      outcome,
      confidence_score: options.confidence || 0.5,
      impact_score: options.impact || 0,
      context_data: options.context,
      notes: options.notes,
      notes_en: options.notesEn,
      notes_fr: options.notesFr,
      learning_applied: false,
      learning_impact: 0.0
    };

    const { data, error } = await supabase
      .from('feedback_tracking')
      .insert(feedbackRecord)
      .select('id')
      .single();

    if (error) {
      console.error('[FeedbackProcessor] Failed to log feedback:', error);
      return { success: false, error: error.message };
    }

    console.log(`[FeedbackProcessor] ✅ Feedback logged successfully: ${data.id}`);
    return { success: true, id: data.id };

  } catch (error) {
    console.error('[FeedbackProcessor] Error logging feedback:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Log performance metrics
 */
export async function logPerformanceMetric(
  eventType: PerformanceMetric['event_type'],
  metricName: string,
  metricValue: number,
  sourceComponent: string,
  options: PerformanceOptions = {}
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    console.log(`[FeedbackProcessor] Logging performance: ${eventType}.${metricName} = ${metricValue}`);
    
    const performanceRecord: Omit<PerformanceMetric, 'id' | 'recorded_at'> = {
      event_type: eventType,
      metric_name: metricName,
      metric_value: metricValue,
      source_component: sourceComponent,
      client_id: options.clientId,
      request_id: options.requestId,
      user_agent: options.userAgent,
      ip_address: options.ipAddress,
      metadata: options.metadata,
      error_message_en: options.errorMessageEn,
      error_message_fr: options.errorMessageFr,
      error_count: 0
    };

    const { data, error } = await supabase
      .from('performance_metrics')
      .insert(performanceRecord)
      .select('id')
      .single();

    if (error) {
      console.error('[FeedbackProcessor] Failed to log performance metric:', error);
      return { success: false, error: error.message };
    }

    console.log(`[FeedbackProcessor] ✅ Performance metric logged: ${data.id}`);
    return { success: true, id: data.id };

  } catch (error) {
    console.error('[FeedbackProcessor] Error logging performance metric:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Log API response time and success metrics
 */
export async function logApiPerformance(
  endpoint: string,
  responseTimeMs: number,
  success: boolean,
  options: PerformanceOptions = {}
): Promise<{ success: boolean; id?: string; error?: string }> {
  const eventType: PerformanceMetric['event_type'] = 'api_response';
  const successRate = success ? 1.0 : 0.0;
  
  // Log response time
  const timeResult = await logPerformanceMetric(
    eventType,
    'response_time',
    responseTimeMs,
    endpoint,
    { ...options, metadata: { ...options.metadata, success } }
  );

  // Log success rate
  const successResult = await logPerformanceMetric(
    eventType,
    'success_rate',
    successRate,
    endpoint,
    { ...options, metadata: { ...options.metadata, response_time_ms: responseTimeMs } }
  );

  return timeResult.success ? timeResult : successResult;
}

/**
 * Log AI analysis performance
 */
export async function logAiPerformance(
  aiComponent: string,
  accuracy: number,
  responseTimeMs: number,
  options: PerformanceOptions = {}
): Promise<{ success: boolean; id?: string; error?: string }> {
  const eventType: PerformanceMetric['event_type'] = 'ai_analysis';
  
  // Log accuracy
  const accuracyResult = await logPerformanceMetric(
    eventType,
    'accuracy',
    accuracy,
    aiComponent,
    { ...options, metadata: { ...options.metadata, response_time_ms: responseTimeMs } }
  );

  // Log response time
  const timeResult = await logPerformanceMetric(
    eventType,
    'response_time',
    responseTimeMs,
    aiComponent,
    { ...options, metadata: { ...options.metadata, accuracy } }
  );

  return accuracyResult.success ? accuracyResult : timeResult;
}

/**
 * Get feedback summary for analysis
 */
export async function getFeedbackSummary(
  clientId?: string,
  actionType?: string,
  daysBack: number = 30
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    console.log(`[FeedbackProcessor] Getting feedback summary for client: ${clientId || 'all'}`);
    
    const { data, error } = await supabase
      .rpc('get_feedback_summary', {
        p_client_id: clientId,
        p_action_type: actionType,
        p_days_back: daysBack
      });

    if (error) {
      console.error('[FeedbackProcessor] Failed to get feedback summary:', error);
      return { success: false, error: error.message };
    }

    console.log(`[FeedbackProcessor] ✅ Retrieved ${data?.length || 0} feedback summary records`);
    return { success: true, data };

  } catch (error) {
    console.error('[FeedbackProcessor] Error getting feedback summary:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get performance summary for analysis
 */
export async function getPerformanceSummary(
  sourceComponent?: string,
  metricName?: string,
  daysBack: number = 7
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    console.log(`[FeedbackProcessor] Getting performance summary for component: ${sourceComponent || 'all'}`);
    
    const { data, error } = await supabase
      .rpc('get_performance_summary', {
        p_source_component: sourceComponent,
        p_metric_name: metricName,
        p_days_back: daysBack
      });

    if (error) {
      console.error('[FeedbackProcessor] Failed to get performance summary:', error);
      return { success: false, error: error.message };
    }

    console.log(`[FeedbackProcessor] ✅ Retrieved ${data?.length || 0} performance summary records`);
    return { success: true, data };

  } catch (error) {
    console.error('[FeedbackProcessor] Error getting performance summary:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Mark feedback as processed by learning system
 */
export async function markFeedbackProcessed(
  feedbackId: string,
  learningImpact: number = 0.0
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[FeedbackProcessor] Marking feedback as processed: ${feedbackId}`);
    
    const { error } = await supabase
      .from('feedback_tracking')
      .update({
        learning_applied: true,
        learning_impact: learningImpact,
        processed_at: new Date().toISOString()
      })
      .eq('id', feedbackId);

    if (error) {
      console.error('[FeedbackProcessor] Failed to mark feedback as processed:', error);
      return { success: false, error: error.message };
    }

    console.log(`[FeedbackProcessor] ✅ Feedback marked as processed: ${feedbackId}`);
    return { success: true };

  } catch (error) {
    console.error('[FeedbackProcessor] Error marking feedback as processed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get unprocessed feedback for learning system
 */
export async function getUnprocessedFeedback(
  limit: number = 100
): Promise<{ success: boolean; data?: FeedbackRecord[]; error?: string }> {
  try {
    console.log(`[FeedbackProcessor] Getting unprocessed feedback (limit: ${limit})`);
    
    const { data, error } = await supabase
      .from('feedback_tracking')
      .select('*')
      .eq('learning_applied', false)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[FeedbackProcessor] Failed to get unprocessed feedback:', error);
      return { success: false, error: error.message };
    }

    console.log(`[FeedbackProcessor] ✅ Retrieved ${data?.length || 0} unprocessed feedback records`);
    return { success: true, data };

  } catch (error) {
    console.error('[FeedbackProcessor] Error getting unprocessed feedback:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Clean up expired feedback (older than 1 year)
 */
export async function cleanupExpiredFeedback(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    console.log('[FeedbackProcessor] Cleaning up expired feedback records');
    
    const { data, error } = await supabase
      .from('feedback_tracking')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      console.error('[FeedbackProcessor] Failed to cleanup expired feedback:', error);
      return { success: false, error: error.message };
    }

    const deletedCount = data?.length || 0;
    console.log(`[FeedbackProcessor] ✅ Cleaned up ${deletedCount} expired feedback records`);
    return { success: true, deletedCount };

  } catch (error) {
    console.error('[FeedbackProcessor] Error cleaning up expired feedback:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get feedback statistics for dashboard
 */
export async function getFeedbackStats(
  clientId?: string,
  daysBack: number = 30
): Promise<{ success: boolean; stats?: any; error?: string }> {
  try {
    console.log(`[FeedbackProcessor] Getting feedback stats for client: ${clientId || 'all'}`);
    
    // Get total feedback count
    let countQuery = supabase
      .from('feedback_tracking')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());
    
    if (clientId) {
      countQuery = countQuery.eq('client_id', clientId);
    }
    
    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('[FeedbackProcessor] Failed to get feedback count:', countError);
      return { success: false, error: countError.message };
    }

    // Get outcome distribution
    let outcomeQuery = supabase
      .from('feedback_tracking')
      .select('outcome')
      .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());
    
    if (clientId) {
      outcomeQuery = outcomeQuery.eq('client_id', clientId);
    }
    
    const { data: outcomeData, error: outcomeError } = await outcomeQuery;

    if (outcomeError) {
      console.error('[FeedbackProcessor] Failed to get outcome distribution:', outcomeError);
      return { success: false, error: outcomeError.message };
    }

    // Calculate outcome distribution
    const outcomeStats = (outcomeData || []).reduce((acc: any, record: any) => {
      acc[record.outcome] = (acc[record.outcome] || 0) + 1;
      return acc;
    }, {});

    const stats = {
      total_feedback: totalCount || 0,
      days_back: daysBack,
      outcome_distribution: outcomeStats,
      positive_percentage: totalCount ? ((outcomeStats.positive || 0) / totalCount * 100).toFixed(1) : 0,
      negative_percentage: totalCount ? ((outcomeStats.negative || 0) / totalCount * 100).toFixed(1) : 0,
      neutral_percentage: totalCount ? ((outcomeStats.neutral || 0) / totalCount * 100).toFixed(1) : 0
    };

    console.log(`[FeedbackProcessor] ✅ Retrieved feedback stats: ${totalCount} total records`);
    return { success: true, stats };

  } catch (error) {
    console.error('[FeedbackProcessor] Error getting feedback stats:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
