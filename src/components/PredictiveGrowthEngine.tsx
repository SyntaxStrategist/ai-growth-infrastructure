"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { GrowthBrainRecord } from "../lib/intelligence-engine";

interface PredictiveGrowthEngineProps {
  locale: string;
  clientId?: string | null;
}

export default function PredictiveGrowthEngine({ locale, clientId = null }: PredictiveGrowthEngineProps) {
  const [insights, setInsights] = useState<GrowthBrainRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const isFrench = locale === 'fr';

  // Function to interpret tone sentiment score and return descriptive label
  const getToneLabel = (score: number): string => {
    if (score >= 80) {
      return isFrench ? 'Enthousiaste' : 'Enthusiastic';
    } else if (score >= 70) {
      return isFrench ? 'Amical' : 'Friendly';
    } else if (score >= 60) {
      return isFrench ? 'Positif' : 'Positive';
    } else if (score >= 50) {
      return isFrench ? 'Neutre' : 'Neutral';
    } else if (score >= 40) {
      return isFrench ? 'Professionnel' : 'Professional';
    } else if (score >= 30) {
      return isFrench ? 'Formel' : 'Formal';
    } else if (score >= 20) {
      return isFrench ? 'Réservé' : 'Reserved';
    } else {
      return isFrench ? 'Décontracté' : 'Casual';
    }
  };

  const t = {
    title: isFrench ? 'Moteur de Croissance Prédictif' : 'Predictive Growth Engine',
    subtitle: isFrench 
      ? 'Tendances et prédictions basées sur l\'IA'
      : 'AI-powered trends and predictions',
    urgencyTrend: isFrench ? 'Tendance d\'Urgence' : 'Urgency Trend',
    confidenceInsight: isFrench ? 'Aperçu de Confiance' : 'Confidence Insight',
    toneInsight: isFrench ? 'Aperçu du Ton' : 'Tone Insight',
    engagementScore: isFrench ? 'Score d\'Engagement' : 'Engagement Score',
    avgConfidence: isFrench ? 'Confiance Moyenne' : 'Average Confidence',
    analyzing: isFrench ? 'Analyse en cours...' : 'Analyzing...',
    noData: isFrench 
      ? 'Aucune donnée d\'analyse disponible. Les insights seront générés après la première analyse hebdomadaire.'
      : 'No analysis data available. Insights will be generated after the first weekly analysis.',
    lastAnalyzed: isFrench ? 'Dernière analyse' : 'Last Analyzed',
    // Helper explanations for each metric
    urgencyTrendHelp: isFrench 
      ? 'Évolution du niveau d\'urgence des leads sur la période analysée'
      : 'How lead urgency levels are changing over the analyzed period',
    confidenceInsightHelp: isFrench 
      ? 'Analyse de la fiabilité et de la qualité des leads détectés'
      : 'Analysis of lead reliability and quality based on AI confidence scores',
    toneInsightHelp: isFrench 
      ? 'Sentiment et tonalité générale des messages des prospects'
      : 'Overall sentiment and tone analysis of prospect messages',
    languageRatioHelp: isFrench 
      ? 'Répartition des leads par langue pour optimiser les communications'
      : 'Lead distribution by language to optimize communication strategies',
  };

  useEffect(() => {
    fetchInsights();
  }, [clientId]);

  async function fetchInsights() {
    try {
      console.log('[PredictiveGrowthEngine] ============================================');
      console.log('[PredictiveGrowthEngine] Fetching analytics data');
      console.log('[PredictiveGrowthEngine] Client ID:', clientId || 'all (admin mode)');
      console.log('[PredictiveGrowthEngine] Locale:', locale);
      
      const params = new URLSearchParams();
      if (clientId) {
        params.set('client_id', clientId);
      }
      
      const endpoint = `/api/growth-insights?${params.toString()}`;
      console.log('[PredictiveGrowthEngine] Endpoint:', endpoint);
      
      const res = await fetch(endpoint);
      const json = await res.json();
      
      console.log('[PredictiveGrowthEngine] API Response:', {
        success: json.success,
        hasData: !!json.data,
        status: res.status,
      });

      if (json.success && json.data) {
        console.log('[PredictiveGrowthEngine] Data fetch complete:', {
          engagementScore: json.data.engagement_score,
          avgConfidence: (json.data.avg_confidence * 100).toFixed(1) + '%',
          urgencyTrendPct: json.data.urgency_trend_percentage?.toFixed(1) + '%',
          toneSentiment: json.data.tone_sentiment_score?.toFixed(0) + '/100',
          languageRatio: {
            en: json.data.language_ratio?.en?.toFixed(0) + '%',
            fr: json.data.language_ratio?.fr?.toFixed(0) + '%',
          },
          totalLeads: json.data.total_leads,
          analyzedAt: json.data.analyzed_at,
        });
        setInsights(json.data);
        console.log('[PredictiveGrowthEngine] ✅ Analytics render success');
        console.log('[PredictiveGrowthEngine] ============================================');
      } else {
        console.warn('[PredictiveGrowthEngine] ⚠️  No data available');
        console.log('[PredictiveGrowthEngine] Response:', json);
        console.log('[PredictiveGrowthEngine] ============================================');
      }
    } catch (err) {
      console.error('[PredictiveGrowthEngine] ❌ Analytics fetch failed');
      console.error('[PredictiveGrowthEngine] ❌ Error:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : 'No stack trace',
      });
      console.log('[PredictiveGrowthEngine] ============================================');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 p-8 bg-white/5">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/60 text-sm">{t.analyzing}</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="rounded-lg border border-white/10 p-8 bg-white/5">
        <p className="text-white/60 text-center text-sm">{t.noData}</p>
      </div>
    );
  }

  const insightData = isFrench ? insights.predictive_insights?.fr : insights.predictive_insights?.en;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {t.title}
          </h2>
          <p className="text-white/60 text-sm mt-1">{t.subtitle}</p>
        </div>
        {insights.analyzed_at && (
          <div className="text-right">
            <p className="text-xs text-white/40">{t.lastAnalyzed}</p>
            <p className="text-xs text-white/60">
              {new Date(insights.analyzed_at).toLocaleDateString(isFrench ? 'fr-CA' : 'en-US')}
            </p>
          </div>
        )}
      </div>

      {/* Engagement Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-lg border border-white/10 p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white/90">{t.engagementScore}</h3>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {insights.engagement_score?.toFixed(0) || 0}/100
            </div>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${insights.engagement_score || 0}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>
          <p className="text-xs text-white/50 mt-2">
            {isFrench 
              ? 'Basé sur la confiance, l\'urgence et le volume des leads'
              : 'Based on confidence, urgency, and lead volume'}
          </p>
        </div>
      </motion.div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Urgency Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-lg border border-white/10 p-5 bg-white/5 hover:border-purple-400/30 transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📈</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white/90 mb-1">{t.urgencyTrend}</h4>
              <p className="text-xs text-white/50 mb-2">{t.urgencyTrendHelp}</p>
              <p className="text-sm text-white/70 leading-relaxed">
                {insightData?.urgency_trend || 'N/A'}
              </p>
              {insights.urgency_trend_percentage !== null && (
                <div className="mt-3">
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-mono ${
                    insights.urgency_trend_percentage > 5 ? 'bg-red-500/20 text-red-400 border border-red-400/30' :
                    insights.urgency_trend_percentage < -5 ? 'bg-green-500/20 text-green-400 border border-green-400/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30'
                  }`}>
                    {insights.urgency_trend_percentage > 0 ? '+' : ''}{insights.urgency_trend_percentage.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Confidence Insight */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-lg border border-white/10 p-5 bg-white/5 hover:border-blue-400/30 transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🎯</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white/90 mb-1">{t.confidenceInsight}</h4>
              <p className="text-xs text-white/50 mb-2">{t.confidenceInsightHelp}</p>
              <p className="text-sm text-white/70 leading-relaxed">
                {insightData?.confidence_insight || 'N/A'}
              </p>
              {insights.avg_confidence !== null && (
                <div className="mt-3">
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-mono bg-blue-500/20 text-blue-400 border border-blue-400/30">
                    {(insights.avg_confidence * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tone Insight */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="rounded-lg border border-white/10 p-5 bg-white/5 hover:border-purple-400/30 transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">💬</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white/90 mb-1">{t.toneInsight}</h4>
              <p className="text-xs text-white/50 mb-2">{t.toneInsightHelp}</p>
              <p className="text-sm text-white/70 leading-relaxed">
                {insightData?.tone_insight || 'N/A'}
              </p>
              {insights.tone_sentiment_score !== null && (
                <div className="mt-3">
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    insights.tone_sentiment_score > 60 ? 'bg-green-500/20 text-green-400 border border-green-400/30' :
                    insights.tone_sentiment_score < 40 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30' :
                    'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                  }`}>
                    {getToneLabel(insights.tone_sentiment_score)} ({insights.tone_sentiment_score.toFixed(0)}/100)
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Language Ratio */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="rounded-lg border border-white/10 p-5 bg-white/5 hover:border-cyan-400/30 transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🌐</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white/90 mb-1">
                {isFrench ? 'Répartition Linguistique' : 'Language Ratio'}
              </h4>
              <p className="text-xs text-white/50 mb-2">{t.languageRatioHelp}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">EN</span>
                  <span className="font-mono text-white/80">
                    {insights.language_ratio?.en?.toFixed(0) || 0}%
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${insights.language_ratio?.en || 0}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-xs mt-3">
                  <span className="text-white/60">FR</span>
                  <span className="font-mono text-white/80">
                    {insights.language_ratio?.fr?.toFixed(0) || 0}%
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${insights.language_ratio?.fr || 0}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

