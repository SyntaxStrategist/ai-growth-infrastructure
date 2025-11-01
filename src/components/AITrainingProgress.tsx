"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type AITrainingStats = {
  totalLeadsProcessed: number;
  daysActive: number;
  learningProgress: number;
  confidenceImprovement: number;
  newPatternsLearned: number;
  industryTermsLearned: number;
  topDiscoveries: string[];
  timeSavedHours: number;
  valueGenerated: number;
};

type AITrainingProgressProps = {
  clientId: string;
  locale: string;
};

export default function AITrainingProgress({ clientId, locale }: AITrainingProgressProps) {
  const [stats, setStats] = useState<AITrainingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai-training-collapsed');
      return saved === 'true';
    }
    return false;
  });

  const isFrench = locale === 'fr';

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/ai-training-stats?client_id=${clientId}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('[AITrainingProgress] Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    if (clientId) {
      fetchStats();
    }
  }, [clientId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai-training-collapsed', String(isCollapsed));
    }
  }, [isCollapsed]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-purple-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-purple-100 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const t = {
    title: isFrench ? "🧠 Votre Intelligence IA" : "🧠 Your AI Intelligence",
    learningProgress: isFrench ? "Progression de l'apprentissage" : "Learning Progress",
    leadsAnalyzed: isFrench ? "prospects analysés" : "leads analyzed",
    daysActive: isFrench ? "jours actifs" : "days active",
    topDiscoveries: isFrench ? "Découvertes principales ce mois-ci :" : "Top Discoveries This Month:",
    whatLearned: isFrench ? "Ce que votre IA a appris :" : "What Your AI Learned:",
    industryTerms: isFrench ? "termes spécifiques à l'industrie" : "industry-specific terms",
    confidenceImprovement: isFrench ? "amélioration de la confiance" : "confidence improvement",
    newPatterns: isFrench ? "nouveaux modèles d'intention reconnus" : "new intent patterns recognized",
    timeSaved: isFrench ? "Temps économisé ce mois-ci :" : "Time Saved This Month:",
    hours: isFrench ? "heures" : "hours",
    valueGenerated: isFrench ? "Valeur générée :" : "Value Generated:",
    noDiscoveries: isFrench ? "Collecte de données en cours..." : "Gathering insights...",
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 mb-6 overflow-hidden">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-purple-100/50 transition-colors focus-visible:outline-2 focus-visible:outline-purple-500 focus-visible:outline-offset-2"
        aria-expanded={!isCollapsed}
      >
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          {t.title}
        </h2>
        <motion.svg
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.3 }}
          className="w-5 h-5 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 pb-6 space-y-6">
              {/* Learning Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">{t.learningProgress}</span>
                  <span className="text-sm font-bold text-purple-600">{stats.learningProgress}%</span>
                </div>
                <div className="h-3 bg-purple-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.learningProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-semibold">{stats.totalLeadsProcessed.toLocaleString()}</span> {t.leadsAnalyzed} · <span className="font-semibold">{stats.daysActive}</span> {t.daysActive}
                </p>
              </div>

              {/* Top Discoveries */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  🎯 {t.topDiscoveries}
                </h3>
                {stats.topDiscoveries.length > 0 ? (
                  <ul className="space-y-2">
                    {stats.topDiscoveries.map((discovery, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <span className="text-purple-500 mt-0.5">•</span>
                        <span>{discovery}</span>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">{t.noDiscoveries}</p>
                )}
              </div>

              {/* What AI Learned */}
              <div className="bg-white/60 rounded-lg p-4">
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  💡 {t.whatLearned}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">+{stats.industryTermsLearned}</div>
                    <div className="text-xs text-gray-600 mt-1">{t.industryTerms}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">+{stats.confidenceImprovement}%</div>
                    <div className="text-xs text-gray-600 mt-1">{t.confidenceImprovement}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600">+{stats.newPatternsLearned}</div>
                    <div className="text-xs text-gray-600 mt-1">{t.newPatterns}</div>
                  </div>
                </div>
              </div>

              {/* Value Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">⏱️</span>
                    <span className="text-sm font-semibold text-gray-700">{t.timeSaved}</span>
                  </div>
                  <div className="text-3xl font-bold text-green-600">{stats.timeSavedHours} {t.hours}</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">💰</span>
                    <span className="text-sm font-semibold text-gray-700">{t.valueGenerated}</span>
                  </div>
                  <div className="text-3xl font-bold text-amber-600">${stats.valueGenerated.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

