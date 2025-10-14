"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocale } from 'next-intl';

type InsightsData = {
  total: number;
  avgConfidence: number;
  intentCounts: Record<string, number>;
  urgencyCounts: { high: number; medium: number; low: number };
  toneCounts: Record<string, number>;
  dailyCounts: Record<string, number>;
  languageCounts: { en: number; fr: number };
};

export default function InsightsPage() {
  const locale = useLocale();
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState(false);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  const t = {
    title: locale === 'fr' ? 'Vue d\'ensemble de l\'intelligence de croissance' : 'Growth Intelligence Overview',
    backToDashboard: locale === 'fr' ? '← Retour au tableau de bord' : '← Back to Dashboard',
    logout: locale === 'fr' ? 'Déconnexion' : 'Logout',
    totalLeads: locale === 'fr' ? 'Total des Leads' : 'Total Leads',
    avgConfidence: locale === 'fr' ? 'Confiance Moyenne' : 'Average Confidence',
    intentDistribution: locale === 'fr' ? 'Distribution des Intentions' : 'Intent Distribution',
    urgencyBreakdown: locale === 'fr' ? 'Répartition de l\'Urgence' : 'Urgency Breakdown',
    toneAnalysis: locale === 'fr' ? 'Analyse du Ton' : 'Tone Analysis',
    languageDistribution: locale === 'fr' ? 'Distribution des Langues' : 'Language Distribution',
    high: locale === 'fr' ? 'Élevée' : 'High',
    medium: locale === 'fr' ? 'Moyenne' : 'Medium',
    low: locale === 'fr' ? 'Faible' : 'Low',
    english: locale === 'fr' ? 'Anglais' : 'English',
    french: locale === 'fr' ? 'Français' : 'French',
    authTitle: locale === 'fr' ? 'Accès Admin' : 'Admin Access',
    authPlaceholder: locale === 'fr' ? 'Entrez le mot de passe admin' : 'Enter admin password',
    authButton: locale === 'fr' ? 'Accéder' : 'Access',
    authError: locale === 'fr' ? 'Mot de passe incorrect' : 'Incorrect password',
    authSuccess: locale === 'fr' ? 'Authentifié ✓' : 'Authenticated ✓',
  };

  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_auth');
    if (adminAuth === 'true') {
      setAuthorized(true);
      fetchInsights();
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchInsights() {
    try {
      const res = await fetch('/api/insights');
      const json = await res.json();
      if (json.success) {
        setInsights(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthSuccess(true);
        setAuthError("");
        setTimeout(() => {
          setAuthorized(true);
          localStorage.setItem('admin_auth', 'true');
          fetchInsights();
        }, 800);
      } else {
        setAuthError(t.authError);
        setPassword("");
      }
    } catch {
      setAuthError(t.authError);
    }
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="rounded-lg border border-white/10 p-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-xl"></div>
            
            <div className="relative">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-blue-500/10 border border-blue-400/30 flex items-center justify-center">
                  <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center mb-6">{t.authTitle}</h2>

              {authSuccess ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <div className="h-16 w-16 rounded-full bg-green-500/20 border border-green-400/40 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-400 font-medium">{t.authSuccess}</p>
                </motion.div>
              ) : (
                <form onSubmit={handleAuth} className="space-y-4">
                  <div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.authPlaceholder}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      autoFocus
                    />
                  </div>
                  {authError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm text-center"
                    >
                      {authError}
                    </motion.p>
                  )}
                  <button
                    type="submit"
                    className="w-full py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-500/20"
                  >
                    {t.authButton}
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading || !insights) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading insights...</p>
        </div>
      </div>
    );
  }

  const topIntents = Object.entries(insights.intentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topTones = Object.entries(insights.toneCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const urgencyData = [
    { label: t.high, count: insights.urgencyCounts.high, color: 'from-red-500 to-orange-500' },
    { label: t.medium, count: insights.urgencyCounts.medium, color: 'from-yellow-500 to-amber-500' },
    { label: t.low, count: insights.urgencyCounts.low, color: 'from-green-500 to-emerald-500' },
  ];

  const maxUrgency = Math.max(insights.urgencyCounts.high, insights.urgencyCounts.medium, insights.urgencyCounts.low) || 1;
  const maxIntent = Math.max(...topIntents.map(([, count]) => count)) || 1;
  const maxTone = Math.max(...topTones.map(([, count]) => count)) || 1;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-black text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {t.title}
              </h1>
              <p className="text-white/60 text-sm">
                {locale === 'fr' 
                  ? 'Visualisations en temps réel de l\'intelligence des leads'
                  : 'Real-time lead intelligence visualizations'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`/${locale}/dashboard`}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm"
              >
                {t.backToDashboard}
              </a>
              <button
                onClick={() => {
                  localStorage.removeItem('admin_auth');
                  setAuthorized(false);
                  setPassword("");
                  setAuthError("");
                }}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all text-sm"
              >
                {t.logout}
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-lg border border-white/10 p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-xl"></div>
              <div className="relative">
                <p className="text-white/60 text-sm mb-2">{t.totalLeads}</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {insights.total}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-lg border border-white/10 p-6 bg-gradient-to-br from-green-500/5 to-blue-500/5 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 blur-xl"></div>
              <div className="relative">
                <p className="text-white/60 text-sm mb-2">{t.avgConfidence}</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  {(insights.avgConfidence * 100).toFixed(0)}%
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Intent Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-lg border border-white/10 p-6 bg-white/5"
          >
            <h3 className="text-lg font-semibold mb-6 text-white/90">{t.intentDistribution}</h3>
            <div className="space-y-4">
              {topIntents.map(([intent, count], idx) => (
                <div key={intent}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70">{intent}</span>
                    <span className="text-sm font-mono text-white/50">{count}</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxIntent) * 100}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full relative"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Urgency Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="rounded-lg border border-white/10 p-6 bg-white/5"
          >
            <h3 className="text-lg font-semibold mb-6 text-white/90">{t.urgencyBreakdown}</h3>
            <div className="space-y-4">
              {urgencyData.map((item, idx) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70">{item.label}</span>
                    <span className="text-sm font-mono text-white/50">{item.count}</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / maxUrgency) * 100}%` }}
                      transition={{ duration: 1, delay: idx * 0.15 }}
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full relative`}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: idx * 0.3 }}
                      />
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tone Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="rounded-lg border border-white/10 p-6 bg-white/5"
          >
            <h3 className="text-lg font-semibold mb-6 text-white/90">{t.toneAnalysis}</h3>
            <div className="space-y-4">
              {topTones.map(([tone, count], idx) => (
                <div key={tone}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70">{tone}</span>
                    <span className="text-sm font-mono text-white/50">{count}</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxTone) * 100}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Language Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="rounded-lg border border-white/10 p-6 bg-white/5"
          >
            <h3 className="text-lg font-semibold mb-6 text-white/90">{t.languageDistribution}</h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">{t.english}</span>
                  <span className="text-sm font-mono text-white/50">{insights.languageCounts.en}</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(insights.languageCounts.en / insights.total) * 100}%` }}
                    transition={{ duration: 1, delay: 0.1 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full relative"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">{t.french}</span>
                  <span className="text-sm font-mono text-white/50">{insights.languageCounts.fr}</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(insights.languageCounts.fr / insights.total) * 100}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

