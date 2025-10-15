"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import OpenAI from "openai";

interface GrowthCopilotProps {
  locale: string;
}

type CopilotSummary = {
  trendSummary: string;
  recommendedActions: string[];
  prediction: string;
};

export default function GrowthCopilot({ locale }: GrowthCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<CopilotSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isFrench = locale === 'fr';

  const t = {
    title: isFrench ? 'Copilote de Croissance' : 'Growth Copilot',
    trendSummary: isFrench ? 'Résumé des tendances' : 'Trend Summary',
    recommendedActions: isFrench ? 'Actions recommandées' : 'Recommended Actions',
    prediction: isFrench ? 'Prédiction' : 'Prediction',
    generateSummary: isFrench ? 'Générer un nouveau résumé' : 'Generate Fresh Summary',
    loading: isFrench ? 'Analyse en cours...' : 'Analyzing...',
    refreshing: isFrench ? 'Actualisation des données...' : 'Refreshing data...',
    poweredBy: isFrench ? 'Propulsé par GPT-4o-mini' : 'Powered by GPT-4o-mini',
    refreshError: isFrench ? 'Impossible d\'actualiser le résumé. Réessayez plus tard.' : 'Unable to refresh summary. Try again later.',
  };

  async function manualRefresh() {
    setRefreshing(true);
    try {
      console.log('[GrowthCopilot] ============================================');
      console.log('[GrowthCopilot] Manual refresh triggered by user');
      console.log('[GrowthCopilot] ============================================');
      
      // Call Intelligence Engine to regenerate insights
      console.log('[GrowthCopilot] Calling /api/intelligence-engine...');
      const engineRes = await fetch('/api/intelligence-engine', {
        method: 'POST',
      });
      
      const engineJson = await engineRes.json();
      console.log('[GrowthCopilot] Intelligence Engine response:', engineJson);
      
      if (!engineJson.success) {
        console.error('[GrowthCopilot] ❌ Intelligence Engine failed:', engineJson.error);
        setSummary({
          trendSummary: t.refreshError,
          recommendedActions: [],
          prediction: '',
        });
        setRefreshing(false);
        return;
      }
      
      console.log('[GrowthCopilot] ✅ Intelligence Engine completed:', {
        processed: engineJson.data?.processed,
        errors: engineJson.data?.errors,
        trigger: engineJson.trigger,
      });
      
      // Wait a moment for data to be available
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Now fetch the fresh insights
      console.log('[GrowthCopilot] Fetching fresh growth insights...');
      await generateSummary();
      
    } catch (err) {
      console.error('[GrowthCopilot] ❌ Manual refresh failed:', err);
      setSummary({
        trendSummary: t.refreshError,
        recommendedActions: [],
        prediction: '',
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function generateSummary() {
    setLoading(true);
    try {
      console.log('[GrowthCopilot] Fetching growth insights...');
      
      // Fetch latest growth insights
      const res = await fetch('/api/growth-insights');
      const json = await res.json();

      console.log('[GrowthCopilot] Full API response:', json);
      console.log('[GrowthCopilot] API response summary:', {
        success: json.success,
        hasData: !!json.data,
        message: json.message,
        dataKeys: json.data ? Object.keys(json.data) : [],
      });

      if (!json.success) {
        console.error('[GrowthCopilot] API returned success=false');
        setSummary({
          trendSummary: isFrench 
            ? 'Erreur lors du chargement des données.'
            : 'Error loading data.',
          recommendedActions: [],
          prediction: '',
        });
        setLoading(false);
        return;
      }

      if (!json.data) {
        console.log('[GrowthCopilot] No data available - growth_brain table is empty or query returned nothing');
        setSummary({
          trendSummary: isFrench 
            ? 'Aucune donnée disponible. Exécutez d\'abord le moteur d\'intelligence en visitant /api/intelligence-engine'
            : 'No data available. Run the intelligence engine first by visiting /api/intelligence-engine',
          recommendedActions: [],
          prediction: '',
        });
        setLoading(false);
        return;
      }

      const insights = json.data;
      console.log('[GrowthCopilot] ============================================');
      console.log('[GrowthCopilot] Insights received from growth_brain:');
      console.log('[GrowthCopilot] ============================================');
      console.log('[GrowthCopilot] Record ID:', insights.id);
      console.log('[GrowthCopilot] Total leads:', insights.total_leads);
      console.log('[GrowthCopilot] Engagement score:', insights.engagement_score);
      console.log('[GrowthCopilot] Avg confidence:', insights.avg_confidence);
      console.log('[GrowthCopilot] Created at:', insights.created_at);
      console.log('[GrowthCopilot] Has predictive_insights:', !!insights.predictive_insights);
      console.log('[GrowthCopilot] Predictive insights type:', typeof insights.predictive_insights);

      if (insights.predictive_insights) {
        console.log('[GrowthCopilot] Predictive insights structure:', {
          has_en: !!insights.predictive_insights.en,
          has_fr: !!insights.predictive_insights.fr,
          en_keys: insights.predictive_insights.en ? Object.keys(insights.predictive_insights.en) : [],
          fr_keys: insights.predictive_insights.fr ? Object.keys(insights.predictive_insights.fr) : [],
        });
        
        // Log the actual content
        if (insights.predictive_insights.en) {
          console.log('[GrowthCopilot] EN predictions:', {
            urgency_trend: insights.predictive_insights.en.urgency_trend?.substring(0, 60) + '...',
            confidence_insight: insights.predictive_insights.en.confidence_insight?.substring(0, 60) + '...',
            tone_insight: insights.predictive_insights.en.tone_insight?.substring(0, 60) + '...',
          });
        }
        
        if (insights.predictive_insights.fr) {
          console.log('[GrowthCopilot] FR predictions:', {
            urgency_trend: insights.predictive_insights.fr.urgency_trend?.substring(0, 60) + '...',
            confidence_insight: insights.predictive_insights.fr.confidence_insight?.substring(0, 60) + '...',
            tone_insight: insights.predictive_insights.fr.tone_insight?.substring(0, 60) + '...',
          });
        }
      } else {
        console.warn('[GrowthCopilot] ⚠️  predictive_insights is missing or null');
      }

      // Use the predictive insights from growth_brain
      const predictions = isFrench ? insights.predictive_insights?.fr : insights.predictive_insights?.en;
      
      console.log('[GrowthCopilot] ============================================');
      console.log('[GrowthCopilot] Selected language:', isFrench ? 'FR' : 'EN');
      console.log('[GrowthCopilot] Selected predictions:', predictions);
      console.log('[GrowthCopilot] ============================================');

      if (!predictions) {
        console.error('[GrowthCopilot] ❌ No predictions for selected language');
        setSummary({
          trendSummary: isFrench ? 'Données de prédiction manquantes' : 'Prediction data missing',
          recommendedActions: [],
          prediction: '',
        });
        setLoading(false);
        return;
      }

      // Build summary from predictions
      const trendSummary = predictions.urgency_trend || (isFrench ? 'Aucune tendance détectée' : 'No trends detected');
      const recommendedActions = [
        predictions.confidence_insight || '',
        predictions.tone_insight || '',
      ].filter(Boolean);
      
      const avgConfidencePercent = insights.avg_confidence ? (insights.avg_confidence * 100).toFixed(0) : '0';
      const engagementScoreValue = insights.engagement_score?.toFixed(0) || '0';
      
      const prediction = isFrench
        ? `Basé sur ${insights.total_leads} leads analysés avec une confiance moyenne de ${avgConfidencePercent}%, votre score d'engagement est de ${engagementScoreValue}/100.`
        : `Based on ${insights.total_leads} analyzed leads with ${avgConfidencePercent}% average confidence, your engagement score is ${engagementScoreValue}/100.`;

      const newSummary = {
        trendSummary,
        recommendedActions,
        prediction,
      };
      
      console.log('[GrowthCopilot] ============================================');
      console.log('[GrowthCopilot] Summary built successfully:');
      console.log('[GrowthCopilot] ============================================');
      console.log('[GrowthCopilot] Trend Summary:', trendSummary);
      console.log('[GrowthCopilot] Recommended Actions count:', recommendedActions.length);
      console.log('[GrowthCopilot] Recommended Actions:');
      recommendedActions.forEach((action, idx) => {
        console.log(`[GrowthCopilot]   ${idx + 1}. ${action.substring(0, 80)}...`);
      });
      console.log('[GrowthCopilot] Prediction:', prediction);
      console.log('[GrowthCopilot] Metrics used:', {
        total_leads: insights.total_leads,
        avg_confidence: avgConfidencePercent + '%',
        engagement_score: engagementScoreValue + '/100',
      });
      console.log('[GrowthCopilot] ============================================');

      setSummary(newSummary);
    } catch (err) {
      console.error('[GrowthCopilot] Failed to generate summary:', err);
      setSummary({
        trendSummary: isFrench ? 'Erreur lors du chargement des données.' : 'Error loading data.',
        recommendedActions: [],
        prediction: '',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen && !summary) {
      generateSummary();
    }
  }, [isOpen]);

  return (
    <>
      {/* Toggle Button - Hide when panel is open */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed right-8 top-32 z-50 px-3 py-2 rounded-lg font-medium text-sm shadow-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:border-purple-500/60 transition-all duration-100 max-w-[200px] text-center leading-tight"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🧠 {t.title}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Copilot Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-96 lg:w-[420px] bg-black/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  🧠 {t.title}
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/40 hover:text-white/80 transition-colors"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-white/40">{t.poweredBy}</p>

              {/* Generate Button */}
              <button
                onClick={manualRefresh}
                disabled={loading || refreshing}
                className="w-full py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {refreshing && (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                )}
                {refreshing ? t.refreshing : loading ? t.loading : t.generateSummary}
              </button>

              {(loading || refreshing) && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                </div>
              )}

              {summary && !loading && (
                <div className="space-y-4">
                  {/* Trend Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-white/10 p-4 bg-white/5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">📈</span>
                      <h3 className="text-sm font-semibold text-white/90">{t.trendSummary}</h3>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {summary.trendSummary}
                    </p>
                  </motion.div>

                  {/* Recommended Actions */}
                  {summary.recommendedActions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="rounded-lg border border-white/10 p-4 bg-white/5"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🎯</span>
                        <h3 className="text-sm font-semibold text-white/90">{t.recommendedActions}</h3>
                      </div>
                      <ul className="space-y-2">
                        {summary.recommendedActions.map((action, idx) => (
                          <li key={idx} className="text-sm text-white/70 leading-relaxed flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Prediction */}
                  {summary.prediction && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="rounded-lg border border-purple-500/30 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🧠</span>
                        <h3 className="text-sm font-semibold text-purple-300">{t.prediction}</h3>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed">
                        {summary.prediction}
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}

