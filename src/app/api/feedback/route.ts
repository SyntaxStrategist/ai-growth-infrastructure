/**
 * Phase 2.1 Module 1: Feedback API Endpoint
 * 
 * REST API for logging and retrieving feedback data for adaptive learning.
 * Completely isolated from existing systems - only reads from existing tables.
 * 
 * Endpoints:
 * - POST /api/feedback - Log new feedback
 * - GET /api/feedback - Retrieve feedback data
 * - GET /api/feedback/stats - Get feedback statistics
 * - GET /api/feedback/performance - Get performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  logFeedback, 
  logPerformanceMetric, 
  getFeedbackSummary, 
  getPerformanceSummary,
  getFeedbackStats,
  getUnprocessedFeedback,
  markFeedbackProcessed,
  cleanupExpiredFeedback,
  type FeedbackOptions,
  type PerformanceOptions
} from '../../../lib/feedback-processor';
import {
  trackAiOutcome,
  trackLeadConversionOutcome,
  trackEmailOutcome,
  getAiOutcomeAnalysis,
  getLeadConversionAnalysis,
  getEmailOutcomeAnalysis
} from '../../../lib/outcome-tracker';

import { handleApiError } from '../../../lib/error-handler';
// Types for API requests
interface LogFeedbackRequest {
  action_type: 'lead_conversion' | 'email_response' | 'user_action' | 'system_performance';
  outcome: 'positive' | 'negative' | 'neutral';
  lead_id?: string;
  client_id?: string;
  confidence_score?: number;
  impact_score?: number;
  notes?: string;
  notes_en?: string;
  notes_fr?: string;
  context_data?: Record<string, any>;
}

interface LogPerformanceRequest {
  event_type: 'api_response' | 'ai_analysis' | 'translation' | 'lead_processing';
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  source_component: string;
  client_id?: string;
  request_id?: string;
  response_time_ms?: number;
  success_rate?: number;
  ai_accuracy?: number;
  error_count?: number;
  metadata?: Record<string, any>;
  error_message_en?: string;
  error_message_fr?: string;
}

interface TrackAiOutcomeRequest {
  component: string;
  prediction: {
    confidence: number;
    predicted_value: any;
    factors: string[];
  };
  actual_outcome: {
    actual_value: any;
    success: boolean;
    response_time_ms: number;
  };
  lead_id?: string;
  client_id?: string;
  notes?: string;
  notes_en?: string;
  notes_fr?: string;
}

interface TrackLeadConversionRequest {
  lead_id: string;
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
  client_id?: string;
  notes?: string;
  notes_en?: string;
  notes_fr?: string;
}

// POST /api/feedback - Log new feedback
export async function POST(req: NextRequest) {
  try {
    console.log('[FeedbackAPI] POST /api/feedback - Logging new feedback');
    
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      console.error('[FeedbackAPI] Invalid JSON body');
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { type, data } = body;

    if (!type || !data) {
      console.error('[FeedbackAPI] Missing required fields: type, data');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, data' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'feedback':
        result = await handleLogFeedback(data as LogFeedbackRequest);
        break;
      
      case 'performance':
        result = await handleLogPerformance(data as LogPerformanceRequest);
        break;
      
      case 'ai_outcome':
        result = await handleTrackAiOutcome(data as TrackAiOutcomeRequest);
        break;
      
      case 'lead_conversion':
        result = await handleTrackLeadConversion(data as TrackLeadConversionRequest);
        break;
      
      default:
        console.error('[FeedbackAPI] Unknown feedback type:', type);
        return NextResponse.json(
          { success: false, error: `Unknown feedback type: ${type}` },
          { status: 400 }
        );
    }

    if (result.success) {
      if ('id' in result) console.log(`[FeedbackAPI] ✅ ${type} logged successfully:`, result.id);
      else console.log(`[FeedbackAPI] ✅ ${type} logged successfully.`);
      return NextResponse.json({
        success: true,
        message: `${type} logged successfully`,
        ...( 'id' in result ? { id: result.id } : {} ),
        data: result
      });
    } else {
      console.error(`[FeedbackAPI] Failed to log ${type}:`, result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    return handleApiError(error, 'API');
  }
}

// GET /api/feedback - Retrieve feedback data
export async function GET(req: NextRequest) {
  try {
    console.log('[FeedbackAPI] GET /api/feedback - Retrieving feedback data');
    
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'summary';
    const clientId = url.searchParams.get('client_id');
    const daysBack = parseInt(url.searchParams.get('days_back') || '30', 10);
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);

    let result;

    switch (action) {
      case 'summary':
        result = await getFeedbackSummary(clientId || undefined, undefined, daysBack);
        break;
      
      case 'performance':
        const sourceComponent = url.searchParams.get('source_component');
        const metricName = url.searchParams.get('metric_name');
        result = await getPerformanceSummary(sourceComponent || undefined, metricName || undefined, daysBack);
        break;
      
      case 'stats':
        result = await getFeedbackStats(clientId || undefined, daysBack);
        break;
      
      case 'unprocessed':
        result = await getUnprocessedFeedback(limit);
        break;
      
      case 'ai_analysis':
        const component = url.searchParams.get('component');
        if (!component) {
          return NextResponse.json(
            { success: false, error: 'Component parameter required for ai_analysis' },
            { status: 400 }
          );
        }
        result = await getAiOutcomeAnalysis(component, daysBack);
        break;
      
      case 'lead_conversion':
        result = await getLeadConversionAnalysis(clientId || undefined, daysBack);
        break;
      
      case 'email_outcome':
        result = await getEmailOutcomeAnalysis(clientId || undefined, daysBack);
        break;
      
      default:
        console.error('[FeedbackAPI] Unknown action:', action);
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    if (result.success) {
      console.log(`[FeedbackAPI] ✅ Retrieved ${action} data successfully`);
      return NextResponse.json({
        success: true,
        action,
        data: ('data' in result ? result.data : ('analysis' in result ? result.analysis : ('stats' in result ? result.stats : null))),
        metadata: {
          client_id: clientId,
          days_back: daysBack,
          limit: action === 'unprocessed' ? limit : undefined
        }
      });
    } else {
      console.error(`[FeedbackAPI] Failed to retrieve ${action} data:`, result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    return handleApiError(error, 'API');
  }
}

// PUT /api/feedback - Update feedback (mark as processed)
export async function PUT(req: NextRequest) {
  try {
    console.log('[FeedbackAPI] PUT /api/feedback - Updating feedback');
    
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      console.error('[FeedbackAPI] Invalid JSON body');
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { action, feedback_id, learning_impact } = body;

    if (!action || !feedback_id) {
      console.error('[FeedbackAPI] Missing required fields: action, feedback_id');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: action, feedback_id' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'mark_processed':
        result = await markFeedbackProcessed(feedback_id, learning_impact || 0.0);
        break;
      
      case 'cleanup_expired':
        result = await cleanupExpiredFeedback();
        break;
      
      default:
        console.error('[FeedbackAPI] Unknown update action:', action);
        return NextResponse.json(
          { success: false, error: `Unknown update action: ${action}` },
          { status: 400 }
        );
    }

    if (result.success) {
      console.log(`[FeedbackAPI] ✅ ${action} completed successfully`);
      return NextResponse.json({
        success: true,
        message: `${action} completed successfully`,
        data: result
      });
    } else {
      console.error(`[FeedbackAPI] Failed to ${action}:`, result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    return handleApiError(error, 'API');
  }
}

// Helper functions for handling different feedback types

async function handleLogFeedback(data: LogFeedbackRequest) {
  const options: FeedbackOptions = {
    leadId: data.lead_id,
    clientId: data.client_id,
    confidence: data.confidence_score,
    impact: data.impact_score,
    notes: data.notes,
    notesEn: data.notes_en,
    notesFr: data.notes_fr,
    context: data.context_data
  };

  return await logFeedback(data.action_type, data.outcome, options);
}

async function handleLogPerformance(data: LogPerformanceRequest) {
  const options: PerformanceOptions = {
    clientId: data.client_id,
    requestId: data.request_id,
    metadata: data.metadata,
    errorMessageEn: data.error_message_en,
    errorMessageFr: data.error_message_fr
  };

  return await logPerformanceMetric(
    data.event_type,
    data.metric_name,
    data.metric_value,
    data.source_component,
    options
  );
}

async function handleTrackAiOutcome(data: TrackAiOutcomeRequest) {
  const options = {
    leadId: data.lead_id,
    clientId: data.client_id,
    notes: data.notes,
    notesEn: data.notes_en,
    notesFr: data.notes_fr
  };

  return await trackAiOutcome(
    data.component,
    data.prediction,
    data.actual_outcome,
    options
  );
}

async function handleTrackLeadConversion(data: TrackLeadConversionRequest) {
  const options = {
    clientId: data.client_id,
    notes: data.notes,
    notesEn: data.notes_en,
    notesFr: data.notes_fr
  };

  return await trackLeadConversionOutcome(
    data.lead_id,
    data.ai_prediction,
    data.actual_outcome,
    options
  );
}

// API Documentation endpoint
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Feedback API Documentation',
    endpoints: {
      'POST /api/feedback': {
        description: 'Log new feedback data',
        body: {
          type: 'feedback | performance | ai_outcome | lead_conversion',
          data: 'Object containing feedback data'
        }
      },
      'GET /api/feedback': {
        description: 'Retrieve feedback data',
        query_params: {
          action: 'summary | performance | stats | unprocessed | ai_analysis | lead_conversion | email_outcome',
          client_id: 'Optional client ID filter',
          days_back: 'Number of days to look back (default: 30)',
          limit: 'Limit for unprocessed feedback (default: 100)',
          component: 'Required for ai_analysis action',
          source_component: 'Optional for performance action',
          metric_name: 'Optional for performance action'
        }
      },
      'PUT /api/feedback': {
        description: 'Update feedback data',
        body: {
          action: 'mark_processed | cleanup_expired',
          feedback_id: 'Required for mark_processed action',
          learning_impact: 'Optional learning impact score'
        }
      }
    },
    examples: {
      log_feedback: {
        type: 'feedback',
        data: {
          action_type: 'lead_conversion',
          outcome: 'positive',
          lead_id: 'uuid',
          client_id: 'uuid',
          confidence_score: 0.85,
          impact_score: 75,
          notes: 'Lead converted successfully',
          notes_en: 'Lead converted successfully',
          notes_fr: 'Lead converti avec succès'
        }
      },
      log_performance: {
        type: 'performance',
        data: {
          event_type: 'api_response',
          metric_name: 'response_time',
          metric_value: 150,
          metric_unit: 'ms',
          source_component: 'lead_api',
          client_id: 'uuid',
          response_time_ms: 150,
          success_rate: 1.0
        }
      }
    }
  });
}
