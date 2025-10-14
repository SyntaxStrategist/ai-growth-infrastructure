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
  // Fetch leads for the period
  let query = supabase
    .from('lead_memory')
    .select('*')
    .gte('timestamp', periodStart.toISOString())
    .lte('timestamp', periodEnd.toISOString());

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: leads, error } = await query;

  if (error) {
    throw error;
  }

  const allLeads = (leads || []) as LeadMemoryRecord[];

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

  return {
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
}

/**
 * Store growth brain insights in database
 */
export async function storeGrowthInsights(insights: Omit<GrowthBrainRecord, 'id' | 'analyzed_at' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('growth_brain')
      .insert(insights)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('[Intelligence Engine] Growth insights stored successfully');
    return data as GrowthBrainRecord;
  } catch (err) {
    console.error('[Intelligence Engine] Failed to store insights:', err instanceof Error ? err.message : err);
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
  console.log('[Intelligence Engine] Starting weekly analysis...');
  
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  let processed = 0;
  let errors = 0;

  try {
    // 1. Analyze global leads (all clients combined)
    try {
      const globalInsights = await analyzeClientLeads(null, weekAgo, now);
      await storeGrowthInsights(globalInsights);
      processed++;
      console.log('[Intelligence Engine] Global analysis complete');
    } catch (err) {
      console.error('[Intelligence Engine] Global analysis failed:', err);
      errors++;
    }

    // 2. Analyze per-client leads
    const { data: clients } = await supabase
      .from('clients')
      .select('id, company_name');

    if (clients && clients.length > 0) {
      for (const client of clients) {
        try {
          const clientInsights = await analyzeClientLeads(client.id, weekAgo, now);
          
          // Only store if client has leads in this period
          if (clientInsights.total_leads > 0) {
            await storeGrowthInsights(clientInsights);
            processed++;
            console.log(`[Intelligence Engine] Analysis complete for client: ${client.company_name}`);
          }
        } catch (err) {
          console.error(`[Intelligence Engine] Failed to analyze client ${client.company_name}:`, err);
          errors++;
        }
      }
    }

    console.log(`[Intelligence Engine] Weekly analysis complete. Processed: ${processed}, Errors: ${errors}`);
    return { processed, errors };
  } catch (err) {
    console.error('[Intelligence Engine] Weekly analysis failed:', err);
    return { processed, errors: errors + 1 };
  }
}

