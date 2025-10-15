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

  const isFrench = locale === 'fr';

  const t = {
    title: isFrench ? 'Copilote de Croissance' : 'Growth Copilot',
    trendSummary: isFrench ? 'Résumé des tendances' : 'Trend Summary',
    recommendedActions: isFrench ? 'Actions recommandées' : 'Recommended Actions',
    prediction: isFrench ? 'Prédiction' : 'Prediction',
    generateSummary: isFrench ? 'Générer un nouveau résumé' : 'Generate Fresh Summary',
    loading: isFrench ? 'Analyse en cours...' : 'Analyzing...',
    poweredBy: isFrench ? 'Propulsé par GPT-4o-mini' : 'Powered by GPT-4o-mini',
  };

  async function generateSummary() {
    setLoading(true);
    try {
      // Fetch latest growth insights
      const res = await fetch('/api/growth-insights');
      const json = await res.json();

      if (!json.success || !json.data) {
        setSummary({
          trendSummary: isFrench 
            ? 'Aucune donnée disponible. Exécutez d\'abord le moteur d\'intelligence.'
            : 'No data available. Run the intelligence engine first.',
          recommendedActions: [],
          prediction: '',
        });
        setLoading(false);
        return;
      }

      const insights = json.data;

      // Call GPT to generate executive summary
      if (process.env.NEXT_PUBLIC_OPENAI_API_KEY || typeof window === 'undefined') {
        // Server-side call would go here
        // For now, use the predictive insights from growth_brain
        const predictions = isFrench ? insights.predictive_insights?.fr : insights.predictive_insights?.en;

        setSummary({
          trendSummary: predictions?.urgency_trend || (isFrench ? 'Aucune tendance détectée' : 'No trends detected'),
          recommendedActions: [
            predictions?.confidence_insight || '',
            predictions?.tone_insight || '',
          ].filter(Boolean),
          prediction: isFrench
            ? `Basé sur les ${insights.total_leads} leads analysés, votre score d'engagement est de ${insights.engagement_score?.toFixed(0) || 0}/100.`
            : `Based on ${insights.total_leads} analyzed leads, your engagement score is ${insights.engagement_score?.toFixed(0) || 0}/100.`,
        });
      }
    } catch (err) {
      console.error('Failed to generate copilot summary:', err);
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
            className="fixed right-8 top-32 z-50 px-4 py-3 rounded-lg font-medium text-sm shadow-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:border-purple-500/60 transition-all duration-100"
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
                onClick={generateSummary}
                disabled={loading}
                className="w-full py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 transition-all text-sm font-medium disabled:opacity-50"
              >
                {loading ? t.loading : t.generateSummary}
              </button>

              {loading && (
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

