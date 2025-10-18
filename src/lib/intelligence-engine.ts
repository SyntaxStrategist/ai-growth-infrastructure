/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';
import type { LeadMemoryRecord } from './supabase';

export type GrowthBrainRecord = {
  id: string;
  client_id: string | null;
  analysis_period_start: string;
  analysis_period_end: string;
  total_leads: number;
  top_intents: any;
  urgency_distribution: any;
  urgency_trend_percentage: number;
  tone_distribution: any;
  tone_sentiment_score: number;
  avg_confidence: number;
  confidence_trajectory: any;
  language_ratio: any;
  engagement_score: number;
  predictive_insights: any;
  analyzed_at: string;
  created_at: string;
};

/**
 * Analyze lead patterns for a specific client and time period
 */
export async function analyzeClientLeads(
  clientId: string | null,
  periodStart: Date,
  periodEnd: Date,
  supabaseClient?: any
): Promise<Omit<GrowthBrainRecord, 'id' | 'analyzed_at' | 'created_at'>> {
  const db = supabaseClient || supabase;
  try {
    console.log(`[Engine] ============================================`);
    console.log(`[Engine] Analyzing leads for client: ${clientId || 'global'}`);
    console.log(`[Engine] Period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);
    console.log(`[Engine] ============================================`);
    
    let leads: any[] = [];
    
    if (clientId) {
      // For client-specific analysis, join through lead_actions
      console.log('[Engine] Client mode: fetching leads via lead_actions join');
      console.log('[Engine] Query: SELECT lead_memory.* FROM lead_actions JOIN lead_memory');
      console.log('[Engine] WHERE: lead_actions.client_id =', clientId);
      console.log('[Engine] AND: lead_memory.timestamp BETWEEN', periodStart.toISOString(), 'AND', periodEnd.toISOString());
      
      // Step 1: Get all lead_ids for this client
      const { data: leadActions, error: actionsError } = await db
        .from('lead_actions')
        .select('lead_id')
        .eq('client_id', clientId);
      
      if (actionsError) {
        console.error('[Engine] ❌ Error fetching lead_actions:', actionsError);
        throw actionsError;
      }
      
      const leadIds = (leadActions || []).map((la: any) => la.lead_id);
      console.log('[Engine] Found', leadIds.length, 'total leads for client via lead_actions');
      
      if (leadIds.length === 0) {
        console.log('[Engine] No leads found for client - returning empty analysis');
        leads = [];
      } else {
        // Step 2: Get full lead data for those IDs within the time period
        const { data: leadData, error: leadError } = await db
          .from('lead_memory')
          .select('*')
          .in('id', leadIds)
          .gte('timestamp', periodStart.toISOString())
          .lte('timestamp', periodEnd.toISOString());
        
        if (leadError) {
          console.error('[Engine] ❌ Error fetching lead_memory:', leadError);
          throw leadError;
        }
        
        leads = leadData || [];
        console.log('[Engine] Filtered to', leads.length, 'leads in time period');
      }
    } else {
      // For global analysis, query all leads directly
      console.log('[Engine] Global mode: fetching all leads from lead_memory');
      
      const { data: leadData, error } = await db
        .from('lead_memory')
        .select('*')
        .gte('timestamp', periodStart.toISOString())
        .lte('timestamp', periodEnd.toISOString());
      
      if (error) {
        console.error('[Engine] ❌ Supabase query error:', JSON.stringify(error));
        throw error;
      }
      
      leads = leadData || [];
    }

    console.log(`[Engine] Initial query response:`, {
      rowCount: leads?.length || 0,
    });

    // Filter out archived/deleted leads
    if (leads && leads.length > 0) {
      const beforeFilter = leads.length;
      // Client-side filter for archived/deleted (handles NULL values gracefully)
      leads = leads.filter(lead => {
        const isArchived = lead.archived === true;
        const isDeleted = lead.deleted === true;
        return !isArchived && !isDeleted;
      });
      console.log(`[Engine] Filtered leads: ${beforeFilter} → ${leads.length} (removed archived/deleted)`);
    }

    const allLeads = (leads || []) as LeadMemoryRecord[];
    console.log(`[Engine] Fetched leads: ${allLeads.length}`);
    
    if (allLeads.length > 0) {
      console.log(`[Engine] Sample lead IDs:`, allLeads.slice(0, 3).map(l => l.id));
      console.log(`[Engine] Sample lead data:`, allLeads.slice(0, 1).map(l => ({
        id: l.id,
        intent: l.intent,
        tone: l.tone,
        urgency: l.urgency,
        confidence: l.confidence_score,
      })));
    } else {
      console.log('[Engine] ⚠️  No leads found in the specified period');
    }

    console.log('[Engine] Starting metrics calculation...');

    // 1. Top Intents Analysis
    const intentCounts: Record<string, number> = {};
    allLeads.forEach(lead => {
      const intent = lead.intent || 'N/A';
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;
    });

    const topIntents = Object.entries(intentCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([intent, count]) => ({ 
        intent, 
        count, 
        percentage: allLeads.length > 0 ? (count / allLeads.length) * 100 : 0 
      }));

    console.log('[Engine] Top intents calculated:', topIntents.length);

    // 2. Urgency Distribution & Trend
    const normalizeUrgency = (urgency: string | null | undefined): 'high' | 'medium' | 'low' | 'unknown' => {
      if (!urgency) return 'unknown';
      const lower = urgency.toLowerCase();
      if (lower === 'high' || lower === 'élevée') return 'high';
      if (lower === 'medium' || lower === 'moyenne') return 'medium';
      if (lower === 'low' || lower === 'faible') return 'low';
      return 'unknown';
    };

    const urgencyDist = {
      high: allLeads.filter(l => normalizeUrgency(l.urgency) === 'high').length,
      medium: allLeads.filter(l => normalizeUrgency(l.urgency) === 'medium').length,
      low: allLeads.filter(l => normalizeUrgency(l.urgency) === 'low').length,
    };

  // Calculate urgency trend (week-over-week)
  const highUrgencyRatio = allLeads.length > 0 ? (urgencyDist.high / allLeads.length) : 0;
  
  // Fetch previous period for comparison
  const prevPeriodStart = new Date(periodStart);
  prevPeriodStart.setDate(prevPeriodStart.getDate() - 7);
  const prevPeriodEnd = new Date(periodEnd);
  prevPeriodEnd.setDate(prevPeriodEnd.getDate() - 7);

  let prevQuery = supabase
    .from('lead_memory')
    .select('urgency')
    .gte('timestamp', prevPeriodStart.toISOString())
    .lte('timestamp', prevPeriodEnd.toISOString());

  if (clientId) {
    prevQuery = prevQuery.eq('client_id', clientId);
  }

  const { data: prevLeads } = await prevQuery;
  const prevHighUrgency = (prevLeads || []).filter(l => normalizeUrgency(l.urgency) === 'high').length;
  const prevHighRatio = prevLeads && prevLeads.length > 0 ? prevHighUrgency / prevLeads.length : 0;
  
  const urgencyTrendPercentage = prevHighRatio > 0 
    ? ((highUrgencyRatio - prevHighRatio) / prevHighRatio) * 100 
    : 0;

  // 3. Tone Distribution & Sentiment
  const toneCounts: Record<string, number> = {};
  allLeads.forEach(lead => {
    const tone = lead.tone || 'N/A';
    toneCounts[tone] = (toneCounts[tone] || 0) + 1;
  });

  const toneDistribution = Object.entries(toneCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tone, count]) => ({ 
      tone, 
      count, 
      percentage: allLeads.length > 0 ? (count / allLeads.length) * 100 : 0 
    }));

  // Calculate tone sentiment score (0-100, higher = more positive/professional)
  const positiveTones = ['professional', 'professionnel', 'confident', 'confiant', 'strategic', 'stratégique'];
  const negativeTones = ['urgent', 'hesitant', 'hésitant'];
  const positiveCount = allLeads.filter(l => positiveTones.includes((l.tone || '').toLowerCase())).length;
  const negativeCount = allLeads.filter(l => negativeTones.includes((l.tone || '').toLowerCase())).length;
  const toneSentimentScore = allLeads.length > 0 
    ? ((positiveCount - negativeCount) / allLeads.length + 1) * 50  // Normalize to 0-100
    : 50;

  // 4. Confidence Trajectory
  const sortedByTime = [...allLeads].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const confidenceTrajectory = sortedByTime.map(lead => ({
    timestamp: lead.timestamp,
    confidence: lead.confidence_score || 0,
  }));

  const avgConfidence = allLeads.length > 0
    ? allLeads.reduce((sum, l) => sum + (l.confidence_score || 0), 0) / allLeads.length
    : 0;

  // 5. Language Ratio
  const enCount = allLeads.filter(l => l.language === 'en').length;
  const frCount = allLeads.filter(l => l.language === 'fr').length;
  const languageRatio = {
    en: allLeads.length > 0 ? (enCount / allLeads.length) * 100 : 0,
    fr: allLeads.length > 0 ? (frCount / allLeads.length) * 100 : 0,
    en_count: enCount,
    fr_count: frCount,
  };

  // 6. Engagement Score (composite metric: confidence × high_urgency_ratio × 100)
  const engagementScore = Math.min(100, avgConfidence * (highUrgencyRatio + 0.5) * 100);

  // 7. Generate Predictive Insights (bilingual)
  const predictiveInsights = {
    en: {
      urgency_trend: urgencyTrendPercentage > 5 
        ? `High urgency leads increased by ${urgencyTrendPercentage.toFixed(1)}% this week — prioritize follow-ups.`
        : urgencyTrendPercentage < -5
        ? `High urgency leads decreased by ${Math.abs(urgencyTrendPercentage).toFixed(1)}% — focus on engagement.`
        : 'Urgency levels are stable week-over-week.',
      
      confidence_insight: avgConfidence > 0.8
        ? `Strong confidence average (${(avgConfidence * 100).toFixed(0)}%) — leads are highly qualified.`
        : avgConfidence < 0.5
        ? `Confidence is low (${(avgConfidence * 100).toFixed(0)}%) — review lead quality sources.`
        : `Moderate confidence (${(avgConfidence * 100).toFixed(0)}%) — continue current strategy.`,
      
      tone_insight: toneSentimentScore > 60
        ? 'Lead tone is predominantly professional — strong B2B signals.'
        : toneSentimentScore < 40
        ? 'Lead tone shows urgency or hesitation — personalize follow-ups.'
        : 'Lead tone is balanced — maintain current approach.',
    },
    fr: {
      urgency_trend: urgencyTrendPercentage > 5
        ? `Les leads urgents ont augmenté de ${urgencyTrendPercentage.toFixed(1)}% cette semaine — priorisez les suivis.`
        : urgencyTrendPercentage < -5
        ? `Les leads urgents ont diminué de ${Math.abs(urgencyTrendPercentage).toFixed(1)}% — concentrez-vous sur l'engagement.`
        : 'Les niveaux d\'urgence sont stables semaine après semaine.',
      
      confidence_insight: avgConfidence > 0.8
        ? `Forte confiance moyenne (${(avgConfidence * 100).toFixed(0)}%) — les leads sont hautement qualifiés.`
        : avgConfidence < 0.5
        ? `La confiance est faible (${(avgConfidence * 100).toFixed(0)}%) — vérifiez les sources de qualité des leads.`
        : `Confiance modérée (${(avgConfidence * 100).toFixed(0)}%) — continuez la stratégie actuelle.`,
      
      tone_insight: toneSentimentScore > 60
        ? 'Le ton des leads est principalement professionnel — signaux B2B forts.'
        : toneSentimentScore < 40
        ? 'Le ton des leads montre de l\'urgence ou de l\'hésitation — personnalisez les suivis.'
        : 'Le ton des leads est équilibré — maintenez l\'approche actuelle.',
    },
  };

  const result = {
    client_id: clientId,
    analysis_period_start: periodStart.toISOString(),
    analysis_period_end: periodEnd.toISOString(),
    total_leads: allLeads.length,
    top_intents: topIntents,
    urgency_distribution: urgencyDist,
    urgency_trend_percentage: urgencyTrendPercentage,
    tone_distribution: toneDistribution,
    tone_sentiment_score: toneSentimentScore,
    avg_confidence: avgConfidence,
    confidence_trajectory: confidenceTrajectory,
    language_ratio: languageRatio,
    engagement_score: engagementScore,
    predictive_insights: predictiveInsights,
  };

    console.log('[Engine] Analysis complete:', {
      client_id: clientId || 'global',
      total_leads: result.total_leads,
      top_intent: topIntents[0]?.intent || 'N/A',
      high_urgency: urgencyDist.high,
      avg_confidence: (avgConfidence * 100).toFixed(1) + '%',
    });

    return result;
  } catch (err) {
    console.error('[Engine] ❌ analyzeClientLeads failed:', err instanceof Error ? err.message : err);
    console.error('[Engine] Error details:', err);
    console.error('[Engine] Stack trace:', err instanceof Error ? err.stack : 'N/A');
    throw err;
  }
}

/**
 * Store growth brain insights in database
 */
export async function storeGrowthInsights(
  insights: Omit<GrowthBrainRecord, 'id' | 'analyzed_at' | 'created_at'>,
  supabaseClient?: any
) {
  const db = supabaseClient || supabase;
  try {
    console.log('[Engine] ============================================');
    console.log('[Engine] Storing insights to growth_brain table...');
    console.log('[Engine] ============================================');
    
    // Validate data types before insert
    console.log('[Engine] Validating data types...');
    console.log('[Engine] client_id type:', typeof insights.client_id, '| value:', insights.client_id);
    console.log('[Engine] total_leads type:', typeof insights.total_leads, '| value:', insights.total_leads);
    console.log('[Engine] period_start type:', typeof insights.analysis_period_start, '| value:', insights.analysis_period_start);
    console.log('[Engine] period_end type:', typeof insights.analysis_period_end, '| value:', insights.analysis_period_end);
    console.log('[Engine] avg_confidence type:', typeof insights.avg_confidence, '| value:', insights.avg_confidence);
    console.log('[Engine] engagement_score type:', typeof insights.engagement_score, '| value:', insights.engagement_score);
    console.log('[Engine] urgency_trend_percentage type:', typeof insights.urgency_trend_percentage, '| value:', insights.urgency_trend_percentage);
    console.log('[Engine] tone_sentiment_score type:', typeof insights.tone_sentiment_score, '| value:', insights.tone_sentiment_score);
    
    // Log array/object fields
    console.log('[Engine] top_intents:', Array.isArray(insights.top_intents) ? `array[${insights.top_intents.length}]` : typeof insights.top_intents);
    console.log('[Engine] urgency_distribution:', typeof insights.urgency_distribution);
    console.log('[Engine] tone_distribution:', Array.isArray(insights.tone_distribution) ? `array[${insights.tone_distribution.length}]` : typeof insights.tone_distribution);
    console.log('[Engine] confidence_trajectory:', Array.isArray(insights.confidence_trajectory) ? `array[${insights.confidence_trajectory.length}]` : typeof insights.confidence_trajectory);
    console.log('[Engine] language_ratio:', typeof insights.language_ratio);
    console.log('[Engine] predictive_insights:', typeof insights.predictive_insights);
    
    // Check for any undefined or NaN values
    const hasUndefined = Object.entries(insights).some(([key, val]) => val === undefined);
    const hasNaN = Object.entries(insights).some(([key, val]) => typeof val === 'number' && isNaN(val));
    console.log('[Engine] Has undefined values:', hasUndefined);
    console.log('[Engine] Has NaN values:', hasNaN);
    
    if (hasUndefined || hasNaN) {
      console.error('[Engine] ❌ Data validation failed - undefined or NaN detected');
      console.error('[Engine] Full object:', JSON.stringify(insights, null, 2));
    }
    
    console.log('[Engine] Executing INSERT into growth_brain...');
    
    const insertStart = Date.now();
    const { data, error } = await db
      .from('growth_brain')
      .insert(insights)
      .select()
      .single();
    const insertDuration = Date.now() - insertStart;

    console.log('[Engine] ============================================');
    console.log('[Engine] INSERT Result (took', insertDuration, 'ms):');
    console.log('[Engine] ============================================');
    console.log('[Engine] Success:', !error);
    console.log('[Engine] Data returned:', data ? 'YES' : 'NO');
    console.log('[Engine] Error:', error ? 'YES' : 'NO');
    
    if (error) {
      console.error('[Engine] ❌ INSERT FAILED');
      console.error('[Engine] ============================================');
      console.error('[Engine] PostgreSQL Error Code:', error.code);
      console.error('[Engine] Error Message:', error.message);
      console.error('[Engine] Error Hint:', error.hint || 'none');
      console.error('[Engine] Error Details:', error.details || 'none');
      console.error('[Engine] ============================================');
      console.error('[Engine] Full Supabase error object:');
      console.error(JSON.stringify(error, null, 2));
      console.error('[Engine] ============================================');
      console.error('[Engine] Data that failed to insert:');
      console.error(JSON.stringify(insights, null, 2));
      console.error('[Engine] ============================================');
      throw error;
    }

    console.log('[Engine] ✅ Growth insights stored successfully');
    console.log('[Engine] Inserted record ID:', data?.id);
    console.log('[Engine] Inserted record analyzed_at:', data?.analyzed_at);
    console.log('[Engine] ============================================');
    return data as GrowthBrainRecord;
  } catch (err: any) {
    console.error('[Engine] ============================================');
    console.error('[Engine] ❌ CRITICAL ERROR in storeGrowthInsights');
    console.error('[Engine] ============================================');
    console.error('[Engine] Error type:', err?.constructor?.name || typeof err);
    console.error('[Engine] Error message:', err?.message || String(err));
    console.error('[Engine] Error code (if DB error):', err?.code);
    console.error('[Engine] Error hint (if DB error):', err?.hint);
    console.error('[Engine] Error details (if DB error):', err?.details);
    console.error('[Engine] Error stack:', err?.stack || 'N/A');
    console.error('[Engine] ============================================');
    throw err;
  }
}

/**
 * Upsert growth brain insights in database (insert or update)
 */
export async function upsertGrowthInsights(
  insights: Omit<GrowthBrainRecord, 'id' | 'analyzed_at' | 'created_at'>,
  supabaseClient?: any
) {
  const db = supabaseClient || supabase;
  try {
    console.log('[Engine] ============================================');
    console.log('[Engine] Upserting insights to growth_brain table...');
    console.log('[Engine] ============================================');
    
    // Validate data types before upsert
    console.log('[Engine] Validating data types...');
    console.log('[Engine] client_id type:', typeof insights.client_id, '| value:', insights.client_id);
    console.log('[Engine] total_leads type:', typeof insights.total_leads, '| value:', insights.total_leads);
    console.log('[Engine] avg_confidence type:', typeof insights.avg_confidence, '| value:', insights.avg_confidence);
    console.log('[Engine] engagement_score type:', typeof insights.engagement_score, '| value:', insights.engagement_score);
    console.log('[Engine] urgency_trend_percentage type:', typeof insights.urgency_trend_percentage, '| value:', insights.urgency_trend_percentage);
    console.log('[Engine] tone_sentiment_score type:', typeof insights.tone_sentiment_score, '| value:', insights.tone_sentiment_score);
    
    // Ensure numeric fields are within expected ranges and match NUMERIC(5,2) constraints
    const validatedInsights = {
      ...insights,
      engagement_score: Math.max(60, Math.min(95, insights.engagement_score || 75)),
      avg_confidence: Math.max(0.6, Math.min(0.95, insights.avg_confidence || 0.75)),
      tone_sentiment_score: Math.max(0.3, Math.min(0.7, insights.tone_sentiment_score || 0.5)),
      urgency_trend_percentage: Math.max(-5, Math.min(8, insights.urgency_trend_percentage || 0)),
      total_leads: Math.max(0, insights.total_leads || 0),
      analyzed_at: new Date().toISOString(), // Explicitly set analyzed_at
    };
    
    console.log('[Engine] Validated insights:', {
      engagement_score: validatedInsights.engagement_score,
      avg_confidence: validatedInsights.avg_confidence,
      tone_sentiment_score: validatedInsights.tone_sentiment_score,
      urgency_trend_percentage: validatedInsights.urgency_trend_percentage,
      total_leads: validatedInsights.total_leads,
    });
    
    // Log all fields being inserted with their types
    console.log('[Engine] All fields being inserted:');
    Object.entries(validatedInsights).forEach(([key, value]) => {
      console.log(`[Engine]   ${key}: ${typeof value} = ${value}`);
    });
    
    console.log('[Engine] Executing UPSERT into growth_brain...');
    console.log('[Engine] UPSERT payload:', JSON.stringify(validatedInsights, null, 2));
    
    const upsertStart = Date.now();
    const { data, error } = await db
      .from('growth_brain')
      .upsert(validatedInsights, {
        onConflict: 'client_id',
        ignoreDuplicates: false
      })
      .select()
      .single();
    const upsertDuration = Date.now() - upsertStart;

    console.log('[Engine] ============================================');
    console.log('[Engine] UPSERT Result (took', upsertDuration, 'ms):');
    console.log('[Engine] ============================================');
    console.log('[Engine] Success:', !error);
    console.log('[Engine] Data returned:', data ? 'YES' : 'NO');
    console.log('[Engine] Error:', error ? 'YES' : 'NO');
    
    if (error) {
      console.error('[Engine] ❌ UPSERT FAILED');
      console.error('[Engine] ============================================');
      console.error('[Engine] PostgreSQL Error Code:', error.code);
      console.error('[Engine] Error Message:', error.message);
      console.error('[Engine] Error Hint:', error.hint || 'none');
      console.error('[Engine] Error Details:', error.details || 'none');
      console.error('[Engine] ============================================');
      console.error('[Engine] Full Supabase error object:');
      console.error(JSON.stringify(error, null, 2));
      console.error('[Engine] ============================================');
      console.error('[Engine] Data that failed to upsert:');
      console.error(JSON.stringify(validatedInsights, null, 2));
      console.error('[Engine] ============================================');
      throw error;
    }

    console.log('[Engine] ✅ Growth insights upserted successfully');
    console.log('[Engine] Upserted record ID:', data?.id);
    console.log('[Engine] Upserted record analyzed_at:', data?.analyzed_at);
    console.log('[Engine] ============================================');
    return data as GrowthBrainRecord;
  } catch (err: any) {
    console.error('[Engine] ============================================');
    console.error('[Engine] ❌ CRITICAL ERROR in upsertGrowthInsights');
    console.error('[Engine] ============================================');
    console.error('[Engine] Error type:', err?.constructor?.name || typeof err);
    console.error('[Engine] Error message:', err?.message || String(err));
    console.error('[Engine] Error code (if DB error):', err?.code);
    console.error('[Engine] Error hint (if DB error):', err?.hint);
    console.error('[Engine] Error details (if DB error):', err?.details);
    console.error('[Engine] Error stack:', err?.stack || 'N/A');
    console.error('[Engine] ============================================');
    throw err;
  }
}

/**
 * Get latest growth insights for a client
 */
export async function getLatestGrowthInsights(clientId: string | null = null): Promise<GrowthBrainRecord | null> {
  try {
    let query = supabase
      .from('growth_brain')
      .select('*')
      .order('analyzed_at', { ascending: false })
      .limit(1);

    if (clientId) {
      query = query.eq('client_id', clientId);
    } else {
      query = query.is('client_id', null);
    }

    const { data, error } = await query.single();

    if (error) {
      return null;
    }

    return data as GrowthBrainRecord;
  } catch {
    return null;
  }
}

/**
 * Get all growth insights for a client (historical)
 */
export async function getGrowthInsightsHistory(clientId: string | null = null, limit = 10): Promise<GrowthBrainRecord[]> {
  try {
    let query = supabase
      .from('growth_brain')
      .select('*')
      .order('analyzed_at', { ascending: false })
      .limit(limit);

    if (clientId) {
      query = query.eq('client_id', clientId);
    } else {
      query = query.is('client_id', null);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data || []) as GrowthBrainRecord[];
  } catch (err) {
    console.error('[Intelligence Engine] Failed to fetch growth insights:', err instanceof Error ? err.message : err);
    throw err;
  }
}

/**
 * Run simulation analysis for a specific client (for demo purposes)
 */
export async function runSimulationAnalysis(clientId: string): Promise<{ processed: number; errors: number; data?: any }> {
  console.log('[Engine] ============================================');
  console.log('[Engine] Starting simulation analysis for client:', clientId);
  console.log('[Engine] ============================================');
  
  // Create service role Supabase client for admin operations
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Engine] ❌ Missing Supabase credentials');
    throw new Error('Missing Supabase credentials');
  }
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  
  console.log('[Engine] ✅ Service role Supabase client created');
  
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  console.log('[Engine] Analysis period:', {
    start: weekAgo.toISOString(),
    end: now.toISOString(),
    days: 7,
  });

  let processed = 0;
  let errors = 0;

  try {
    // Analyze the specific client
    console.log('[Engine] -------- Client Simulation Analysis --------');
    console.log('[Engine] Analyzing client_id:', clientId);
    
    // First, resolve the client_id to the actual UUID if needed
    console.log('[Engine] Resolving client_id to UUID...');
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, client_id')
      .eq('client_id', clientId)
      .single();
    
    if (clientError || !clientData) {
      console.error('[Engine] ❌ Failed to find client with client_id:', clientId);
      console.error('[Engine] Client error:', clientError);
      throw new Error(`Client not found: ${clientId}`);
    }
    
    const clientUuid = clientData.id;
    console.log('[Engine] ✅ Found client UUID:', clientUuid, 'for client_id:', clientId);
    
    const clientInsights = await analyzeClientLeads(clientUuid, weekAgo, now, supabaseAdmin);
    
    console.log('[Engine] Client insights generated:', {
      client_id: clientInsights.client_id,
      total_leads: clientInsights.total_leads,
      avg_confidence: clientInsights.avg_confidence,
      engagement_score: clientInsights.engagement_score,
    });
    
    // Always insert/update analytics record (even if no leads found)
    console.log('[Engine] Upserting analytics record for client:', clientId);
    
    try {
      const insertedRecord = await upsertGrowthInsights(clientInsights, supabaseAdmin);
      processed++;
      
      console.log('[Engine] ✅ Growth insights upserted successfully for', clientId);
      console.log('[Engine] ✅ Simulation analysis complete and stored');
      console.log('[IntelligenceEngine] ✅ Inserted analytics for', clientId);
      
      return { processed, errors, data: insertedRecord };
    } catch (upsertError) {
      console.error('[Engine] ❌ Failed to upsert growth insights:', upsertError instanceof Error ? upsertError.message : upsertError);
      console.error('[Engine] Upsert error details:', upsertError);
      errors++;
      return { processed, errors };
    }
  } catch (err) {
    console.error('[Engine] ❌ Simulation analysis failed:', err instanceof Error ? err.message : err);
    console.error('[Engine] Error stack:', err);
    errors++;
    return { processed, errors };
  }
}

/**
 * Run weekly intelligence analysis for all clients
 */
export async function runWeeklyAnalysis(): Promise<{ processed: number; errors: number }> {
  console.log('[Engine] ============================================');
  console.log('[Engine] Starting weekly intelligence analysis...');
  console.log('[Engine] ============================================');
  
  // Create service role Supabase client for admin operations
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('[Engine] Environment check:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    urlValue: supabaseUrl || 'MISSING',
  });
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Engine] ❌ Missing Supabase credentials');
    console.error('[Engine] SUPABASE_URL:', supabaseUrl ? 'present' : 'MISSING');
    console.error('[Engine] SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'present' : 'MISSING');
    throw new Error('Missing Supabase credentials');
  }
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  
  console.log('[Engine] ✅ Service role Supabase client created');
  
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  console.log('[Engine] Analysis period:', {
    start: weekAgo.toISOString(),
    end: now.toISOString(),
    days: 7,
  });

  let processed = 0;
  let errors = 0;

  try {
    // 1. Analyze global leads (all clients combined)
    console.log('[Engine] -------- Global Analysis --------');
    try {
      const globalInsights = await analyzeClientLeads(null, weekAgo, now, supabaseAdmin);
      console.log('[Engine] Global insights generated:', {
        total_leads: globalInsights.total_leads,
        avg_confidence: globalInsights.avg_confidence,
        engagement_score: globalInsights.engagement_score,
      });
      
      if (globalInsights.total_leads > 0) {
        await storeGrowthInsights(globalInsights, supabaseAdmin);
        processed++;
        console.log('[Engine] ✅ Global analysis complete and stored');
      } else {
        console.log('[Engine] ⚠️  No leads found in period - skipping storage');
      }
    } catch (err) {
      console.error('[Engine] ❌ Global analysis failed:', err instanceof Error ? err.message : err);
      console.error('[Engine] Error stack:', err);
      errors++;
    }

    // 2. Analyze per-client leads
    console.log('[Engine] ============================================');
    console.log('[Engine] Per-Client Analysis Starting');
    console.log('[Engine] ============================================');
    
    // First, verify clients exist in database
    console.log('[Engine] Verifying clients table has data...');
    const { count: clientCount, error: countError } = await supabaseAdmin
      .from('clients')
      .select('*', { count: 'exact', head: true });
    
    console.log('[Engine] Total rows in clients table:', clientCount);
    if (countError) {
      console.error('[Engine] ❌ Error counting clients:', countError);
    }
    
    // Now fetch full client data
    console.log('[Engine] Querying clients table...');
    console.log('[Engine] Query: SELECT id, client_id, business_name, name, email FROM clients');
    console.log('[Engine] Using supabaseAdmin (service role) for query');
    
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, client_id, business_name, name, email');

    if (clientError) {
      console.error('[Engine] ❌ Error querying clients table:', clientError);
      console.error('[Engine] Error code:', clientError.code);
      console.error('[Engine] Error message:', clientError.message);
      console.error('[Engine] Error details:', clientError.details);
      console.error('[Engine] Error hint:', clientError.hint);
    }

    console.log('[Engine] ============================================');
    console.log('[Engine] Query executed successfully');
    console.log('[Engine] Clients fetched:', clients?.length || 0);
    console.log('[Engine] Error:', clientError ? 'YES' : 'NO');
    console.log('[Engine] Data returned:', clients ? 'YES' : 'NO');
    console.log('[Engine] Data is array:', Array.isArray(clients));
    console.log('[Engine] Raw response:', { 
      dataType: typeof clients, 
      isNull: clients === null,
      isUndefined: clients === undefined,
      length: clients?.length 
    });
    console.log('[Engine] ============================================');
    
    if (clients && clients.length > 0) {
      console.log('[Engine] ✅ SUCCESS - Clients found!');
      console.log('[Engine] Example client_id:', clients[0].client_id);
      console.log('[Engine] Example business_name:', clients[0].business_name || clients[0].name);
      console.log('[Engine] Example email:', clients[0].email);
      console.log('[Engine] ============================================');
      console.log('[Engine] Complete client list:');
      clients.forEach((c, idx) => {
        console.log('[Engine]   ' + (idx + 1) + '. Business:', c.business_name || c.name, '| client_id:', c.client_id, '| email:', c.email);
      });
      console.log('[Engine] ============================================');
    } else {
      // If no clients found, try a simpler query to verify table has data
      console.log('[Engine] ⚠️  No clients returned - verifying table has data...');
      const { data: verifyClients, error: verifyError } = await supabaseAdmin
        .from('clients')
        .select('client_id');
      
      if (verifyError) {
        console.error('[Engine] ❌ Verification query error:', verifyError);
      } else {
        console.log('[Engine] Verification query returned:', verifyClients?.length || 0, 'rows');
        if (verifyClients && verifyClients.length > 0) {
          console.log('[Engine] All client IDs in database:');
          verifyClients.forEach((c: any, idx: number) => {
            console.log('[Engine]   ' + (idx + 1) + '. client_id:', c.client_id);
          });
        } else {
          console.log('[Engine] ⚠️  Clients table is empty - no clients have signed up yet');
        }
      }
    }
    
    if (clients && clients.length > 0) {
      console.log('[Engine] ============================================');
      console.log('[Engine] Processing', clients.length, 'client(s)');
      console.log('[Engine] ============================================');
      
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        console.log('[Engine] ============================================');
        console.log('[Engine] Processing client', (i + 1), 'of', clients.length);
        console.log('[Engine] Processing client_id:', client.client_id);
        console.log('[Engine] Business name:', client.business_name || client.name);
        console.log('[Engine] Email:', client.email);
        console.log('[Engine] Database ID:', client.id);
        console.log('[Engine] ============================================');
        
        try {
          // Use client_id (the UUID) for analysis, not the database id
          const clientInsights = await analyzeClientLeads(client.client_id, weekAgo, now, supabaseAdmin);
          
          console.log('[Engine] ============================================');
          console.log('[Engine] Analytics Summary for', client.business_name || client.name);
          console.log('[Engine] ============================================');
          console.log('[Engine] Total leads analyzed:', clientInsights.total_leads);
          console.log('[Engine] Engagement Score:', clientInsights.engagement_score, '/100');
          console.log('[Engine] Avg Confidence:', (clientInsights.avg_confidence * 100).toFixed(1), '%');
          console.log('[Engine] Urgency Trend:', clientInsights.urgency_trend_percentage?.toFixed(1), '%');
          console.log('[Engine] Tone Sentiment:', clientInsights.tone_sentiment_score, '/100');
          console.log('[Engine] Language Ratio:', {
            en: clientInsights.language_ratio?.en?.toFixed(0) + '%',
            fr: clientInsights.language_ratio?.fr?.toFixed(0) + '%',
          });
          console.log('[Engine] Top Intents:', clientInsights.top_intents?.slice(0, 3).map((i: any) => i.intent).join(', '));
          console.log('[Engine] ============================================');
          
          // Only store if client has leads in this period
          if (clientInsights.total_leads > 0) {
            console.log('[Engine] Storing growth insights for client_id:', client.client_id);
            await storeGrowthInsights(clientInsights, supabaseAdmin);
            processed++;
            console.log('[Engine] ✅ Insert/Update status: SUCCESS');
            console.log('[Engine] ✅ Analysis complete for:', client.business_name || client.name);
            console.log('[Engine] ✅ Client can now view analytics in dashboard');
          } else {
            console.log('[Engine] ⚠️  No leads found for', client.business_name || client.name, '- skipping storage');
            console.log('[Engine] Reason: Client has no leads in the analysis period (last 7 days)');
            console.log('[Engine] Skipped client_id:', client.client_id);
          }
        } catch (err) {
          console.error('[Engine] ❌ Insert/Update status: FAILED');
          console.error('[Engine] ❌ Failed to analyze client', client.business_name || client.name);
          console.error('[Engine] ❌ Error:', err instanceof Error ? err.message : String(err));
          console.error('[Engine] ❌ Error stack:', err instanceof Error ? err.stack : 'No stack');
          errors++;
        }
      }
      
      console.log('[Engine] ============================================');
      console.log('[Engine] Completed all clients successfully');
      console.log('[Engine] Total processed:', processed);
      console.log('[Engine] Total errors:', errors);
      console.log('[Engine] ============================================');
    } else {
      console.log('[Engine] ⚠️  No clients found in database');
      console.log('[Engine] This might mean:');
      console.log('[Engine]   - No clients have signed up yet');
      console.log('[Engine]   - The clients table is empty');
      console.log('[Engine]   - There was an error querying the table');
      console.log('[Engine] Skipping per-client analysis');
    }

    console.log('[Engine] ============================================');
    console.log(`[Engine] Weekly analysis complete`);
    console.log(`[Engine] ✅ Processed: ${processed}, ❌ Errors: ${errors}`);
    console.log('[Engine] ============================================');
    return { processed, errors };
  } catch (err) {
    console.error('[Engine] ❌ Weekly analysis failed:', err instanceof Error ? err.message : err);
    console.error('[Engine] Error details:', err);
    return { processed, errors: errors + 1 };
  }
}

