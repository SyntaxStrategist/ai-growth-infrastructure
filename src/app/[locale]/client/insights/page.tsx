"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSession } from '../../../../components/SessionProvider';
import UniversalLanguageToggle from '../../../../components/UniversalLanguageToggle';

type InsightsData = {
  total: number;
  avgConfidence: number;
  intentCounts: Record<string, number>;
  urgencyCounts: { high: number; medium: number; low: number };
  toneCounts: Record<string, number>;
  dailyCounts: Record<string, number>;
  languageCounts: { en: number; fr: number };
};

export default function ClientInsightsPage() {
  const locale = useLocale();
  const router = useRouter();
  const isFrench = locale === 'fr';
  const { session, clearSession: clearSessionContext } = useSession();
  
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = {
    title: isFrench ? 'Vue d\'ensemble de l\'intelligence de croissance' : 'Growth Intelligence Overview',
    backToDashboard: isFrench ? '← Retour au tableau de bord' : '← Back to Dashboard',
    logout: isFrench ? 'Déconnexion' : 'Logout',
    totalLeads: isFrench ? 'Total des Leads' : 'Total Leads',
    avgConfidence: isFrench ? 'Confiance Moyenne' : 'Average Confidence',
    intentDistribution: isFrench ? 'Distribution des Intentions' : 'Intent Distribution',
    urgencyBreakdown: isFrench ? 'Répartition de l\'Urgence' : 'Urgency Breakdown',
    toneAnalysis: isFrench ? 'Analyse du Ton' : 'Tone Analysis',
    languageDistribution: isFrench ? 'Distribution des Langues' : 'Language Distribution',
    high: isFrench ? 'Élevée' : 'High',
    medium: isFrench ? 'Moyenne' : 'Medium',
    low: isFrench ? 'Faible' : 'Low',
    english: isFrench ? 'Anglais' : 'English',
    french: isFrench ? 'Français' : 'French',
    loading: isFrench ? 'Chargement...' : 'Loading...',
    error: isFrench ? 'Erreur lors du chargement des données' : 'Error loading data',
    noData: isFrench ? 'Aucune donnée disponible' : 'No data available',
  };

  // Check authentication and fetch insights
  useEffect(() => {
    if (!session.isAuthenticated || !session.client) {
      console.log('[ClientInsights] Not authenticated, redirecting to login');
      router.push(`/${locale}/client/login`);
      return;
    }

    fetchInsights();
  }, [session, locale, router]);

  async function fetchInsights() {
    if (!session.client) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('[ClientInsights] Fetching insights for client:', session.client.clientId);
      
      const res = await fetch(`/api/client/insights?clientId=${session.client.clientId}`);
      const json = await res.json();
      
      if (json.success) {
        setInsights(json.data);
        console.log('[ClientInsights] ✅ Insights loaded successfully');
      } else {
        setError(json.error || t.error);
        console.error('[ClientInsights] ❌ API error:', json.error);
      }
    } catch (err) {
      console.error('[ClientInsights] ❌ Fetch error:', err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    console.log('[ClientInsights] Logging out user...');
    clearSessionContext();
    router.push(`/${locale}/client/login`);
  }

  // Redirect if not authenticated
  if (!session.isAuthenticated || !session.client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
              <p className="text-white/60">{session.client.businessName}</p>
            </div>
            <div className="flex items-center gap-3">
              <UniversalLanguageToggle />
              <a
                href={`/${locale}/client/dashboard`}
                className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all text-sm"
              >
                {t.backToDashboard}
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all text-sm"
              >
                {t.logout}
              </button>
            </div>
          </div>
          
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/60">{t.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
              <p className="text-white/60">{session.client.businessName}</p>
            </div>
            <div className="flex items-center gap-3">
              <UniversalLanguageToggle />
              <a
                href={`/${locale}/client/dashboard`}
                className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all text-sm"
              >
                {t.backToDashboard}
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all text-sm"
              >
                {t.logout}
              </button>
            </div>
          </div>
          
          <div className="text-center py-20">
            <div className="text-red-400 text-xl mb-4">⚠️</div>
            <p className="text-white/60 mb-4">{error}</p>
            <button
              onClick={fetchInsights}
              className="px-6 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all"
            >
              {isFrench ? 'Réessayer' : 'Retry'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
              <p className="text-white/60">{session.client.businessName}</p>
            </div>
            <div className="flex items-center gap-3">
              <UniversalLanguageToggle />
              <a
                href={`/${locale}/client/dashboard`}
                className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all text-sm"
              >
                {t.backToDashboard}
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all text-sm"
              >
                {t.logout}
              </button>
            </div>
          </div>
          
          <div className="text-center py-20">
            <div className="text-white/40 text-xl mb-4">📊</div>
            <p className="text-white/60">{t.noData}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
            <p className="text-white/60">{session.client.businessName}</p>
          </div>
          <div className="flex items-center gap-3">
            <UniversalLanguageToggle />
            <a
              href={`/${locale}/client/dashboard`}
              className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all text-sm"
            >
              {t.backToDashboard}
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all text-sm"
            >
              {t.logout}
            </button>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">{t.totalLeads}</h3>
            <div className="text-3xl font-bold text-white">{insights.total}</div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 text-green-400">{t.avgConfidence}</h3>
            <div className="text-3xl font-bold text-white">{insights.avgConfidence}%</div>
          </div>
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Intent Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-semibold mb-4 text-purple-400">{t.intentDistribution}</h3>
            <div className="space-y-3">
              {Object.entries(insights.intentCounts).map(([intent, count]) => (
                <div key={intent} className="flex items-center justify-between">
                  <span className="text-white/80 capitalize">{intent}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-purple-400 h-2 rounded-full" 
                        style={{ width: `${(count / insights.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Urgency Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-semibold mb-4 text-orange-400">{t.urgencyBreakdown}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80">{t.high}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-red-400 h-2 rounded-full" 
                      style={{ width: `${(insights.urgencyCounts.high / insights.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-medium w-8 text-right">{insights.urgencyCounts.high}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">{t.medium}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full" 
                      style={{ width: `${(insights.urgencyCounts.medium / insights.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-medium w-8 text-right">{insights.urgencyCounts.medium}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">{t.low}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full" 
                      style={{ width: `${(insights.urgencyCounts.low / insights.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-medium w-8 text-right">{insights.urgencyCounts.low}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tone Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-semibold mb-4 text-cyan-400">{t.toneAnalysis}</h3>
            <div className="space-y-3">
              {Object.entries(insights.toneCounts).map(([tone, count]) => (
                <div key={tone} className="flex items-center justify-between">
                  <span className="text-white/80 capitalize">{tone}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-cyan-400 h-2 rounded-full" 
                        style={{ width: `${(count / insights.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Language Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-semibold mb-4 text-pink-400">{t.languageDistribution}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80">{t.english}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-blue-400 h-2 rounded-full" 
                      style={{ width: `${(insights.languageCounts.en / insights.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-medium w-8 text-right">{insights.languageCounts.en}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">{t.french}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-pink-400 h-2 rounded-full" 
                      style={{ width: `${(insights.languageCounts.fr / insights.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-medium w-8 text-right">{insights.languageCounts.fr}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
