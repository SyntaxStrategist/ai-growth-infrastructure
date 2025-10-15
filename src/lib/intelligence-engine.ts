/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './supabase';
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
  periodEnd: Date
): Promise<Omit<GrowthBrainRecord, 'id' | 'analyzed_at' | 'created_at'>> {
  console.log(`[Engine] Analyzing leads for client: ${clientId || 'global'}`);
  console.log(`[Engine] Period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);
  
  // Fetch leads for the period (only active leads: not archived, not deleted)
  let query = supabase
    .from('lead_memory')
    .select('*')
    .gte('timestamp', periodStart.toISOString())
    .lte('timestamp', periodEnd.toISOString())
    .eq('archived', false)
    .eq('deleted', false);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  console.log('[Engine] Executing Supabase query...');
  const { data: leads, error, count } = await query;

  console.log(`[Engine] Supabase response:`, {
    rowCount: leads?.length || 0,
    totalCount: count,
    error: error ? JSON.stringify(error) : 'none',
  });

  if (error) {
    console.error('[Engine] Supabase query error:', JSON.stringify(error));
    throw error;
  }

  const allLeads = (leads || []) as LeadMemoryRecord[];
  console.log(`[Engine] Fetched leads: ${allLeads.length}`);
  
  if (allLeads.length > 0) {
    console.log(`[Engine] Sample lead IDs:`, allLeads.slice(0, 3).map(l => l.id));
  }

  // 1. Top Intents Analysis
  const intentCounts: Record<string, number> = {};
  allLeads.forEach(lead => {
    const intent = lead.intent || 'N/A';
    intentCounts[intent] = (intentCounts[intent] || 0) + 1;
  });

  const topIntents = Object.entries(intentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([intent, count]) => ({ intent, count, percentage: (count / allLeads.length) * 100 }));

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
    .map(([tone, count]) => ({ tone, count, percentage: (count / allLeads.length) * 100 }));

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
}

/**
 * Store growth brain insights in database
 */
export async function storeGrowthInsights(insights: Omit<GrowthBrainRecord, 'id' | 'analyzed_at' | 'created_at'>) {
  try {
    console.log('[Engine] Storing insights to growth_brain table...');
    console.log('[Engine] Insights data:', {
      client_id: insights.client_id,
      total_leads: insights.total_leads,
      period: `${insights.analysis_period_start} to ${insights.analysis_period_end}`,
    });

    const { data, error } = await supabase
      .from('growth_brain')
      .insert(insights)
      .select()
      .single();

    console.log('[Engine] Supabase insert response:', {
      success: !error,
      data: data ? 'inserted' : 'null',
      error: error ? JSON.stringify(error) : 'none',
    });

    if (error) {
      console.error('[Engine] Insert error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('[Engine] Growth insights stored successfully, ID:', data.id);
    return data as GrowthBrainRecord;
  } catch (err) {
    console.error('[Engine] Failed to store insights:', err instanceof Error ? err.message : err);
    console.error('[Engine] Error details:', err);
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
 * Run weekly intelligence analysis for all clients
 */
export async function runWeeklyAnalysis(): Promise<{ processed: number; errors: number }> {
  console.log('[Engine] ============================================');
  console.log('[Engine] Starting weekly intelligence analysis...');
  console.log('[Engine] ============================================');
  
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
      const globalInsights = await analyzeClientLeads(null, weekAgo, now);
      console.log('[Engine] Global insights generated:', {
        total_leads: globalInsights.total_leads,
        avg_confidence: globalInsights.avg_confidence,
        engagement_score: globalInsights.engagement_score,
      });
      
      if (globalInsights.total_leads > 0) {
        await storeGrowthInsights(globalInsights);
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
    console.log('[Engine] -------- Per-Client Analysis --------');
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, company_name');

    console.log('[Engine] Clients query result:', {
      count: clients?.length || 0,
      error: clientError ? JSON.stringify(clientError) : 'none',
    });

    if (clients && clients.length > 0) {
      console.log(`[Engine] Found ${clients.length} clients to analyze`);
      
      for (const client of clients) {
        console.log(`[Engine] ---- Analyzing client: ${client.company_name} (${client.id}) ----`);
        try {
          const clientInsights = await analyzeClientLeads(client.id, weekAgo, now);
          
          // Only store if client has leads in this period
          if (clientInsights.total_leads > 0) {
            await storeGrowthInsights(clientInsights);
            processed++;
            console.log(`[Engine] ✅ Analysis complete for client: ${client.company_name}`);
          } else {
            console.log(`[Engine] ⚠️  No leads for ${client.company_name} - skipping`);
          }
        } catch (err) {
          console.error(`[Engine] ❌ Failed to analyze client ${client.company_name}:`, err instanceof Error ? err.message : err);
          console.error(`[Engine] Error details:`, err);
          errors++;
        }
      }
    } else {
      console.log('[Engine] No clients found - skipping per-client analysis');
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

