"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

type SystemAIStats = {
  totalLeadsProcessed: number;
  totalClients: number;
  activeClients: number;
  systemConfidence: number;
  systemConfidenceChange: number;
  totalTimeSaved: number;
  totalValueGenerated: number;
  topPerformingClients: Array<{
    clientId: string;
    businessName: string;
    leadsProcessed: number;
    confidence: number;
  }>;
  industryInsights: Array<{
    industry: string;
    avgConfidence: number;
    leadCount: number;
  }>;
  crossClientPatterns: string[];
};

type SystemAIIntelligenceProps = {
  locale: string;
};

export default function SystemAIIntelligence({ locale }: SystemAIIntelligenceProps) {
  const [stats, setStats] = useState<SystemAIStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isFrench = locale === 'fr';

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/system-ai-stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('[SystemAIIntelligence] Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const t = {
    title: isFrench ? 'Intelligence IA du Système' : 'System AI Intelligence',
    subtitle: isFrench ? 'Vue d\'ensemble de toutes les IA clients' : 'Overview of all client AIs',
    totalLeads: isFrench ? 'Total des Leads Traités' : 'Total Leads Processed',
    activeClients: isFrench ? 'Clients Actifs' : 'Active Clients',
    systemConfidence: isFrench ? 'Confiance Système' : 'System Confidence',
    totalTimeSaved: isFrench ? 'Temps Total Économisé' : 'Total Time Saved',
    totalValue: isFrench ? 'Valeur Totale Générée' : 'Total Value Generated',
    topPerforming: isFrench ? 'Meilleurs Clients' : 'Top Performing Clients',
    industryInsights: isFrench ? 'Aperçus par Industrie' : 'Industry Insights',
    crossClientPatterns: isFrench ? 'Modèles Inter-Clients' : 'Cross-Client Patterns',
    leads: isFrench ? 'leads' : 'leads',
    confidence: isFrench ? 'confiance' : 'confidence',
    hours: isFrench ? 'heures' : 'hours',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-white/60 text-center py-12">
        {isFrench ? 'Aucune donnée disponible' : 'No data available'}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">{t.title}</h2>
        <p className="text-white/60">{t.subtitle}</p>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6"
        >
          <div className="text-white/70 text-sm mb-2">{t.totalLeads}</div>
          <div className="text-4xl font-bold text-blue-400">{stats.totalLeadsProcessed.toLocaleString()}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6"
        >
          <div className="text-white/70 text-sm mb-2">{t.activeClients}</div>
          <div className="text-4xl font-bold text-green-400">
            {stats.activeClients} <span className="text-xl text-white/40">/ {stats.totalClients}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6"
        >
          <div className="text-white/70 text-sm mb-2">{t.systemConfidence}</div>
          <div className="text-4xl font-bold text-purple-400">{stats.systemConfidence}%</div>
          {stats.systemConfidenceChange !== 0 && (
            <div className={`text-sm mt-1 ${stats.systemConfidenceChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.systemConfidenceChange > 0 ? '▲' : '▼'} {Math.abs(stats.systemConfidenceChange)}%
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-6"
        >
          <div className="text-white/70 text-sm mb-2">{t.totalValue}</div>
          <div className="text-4xl font-bold text-amber-400">${stats.totalValueGenerated.toLocaleString()}</div>
          <div className="text-xs text-white/50 mt-1">{stats.totalTimeSaved} {t.hours}</div>
        </motion.div>
      </div>

      {/* Top Performing Clients */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          🏆 {t.topPerforming}
        </h3>
        <div className="space-y-3">
          {stats.topPerformingClients.slice(0, 5).map((client, idx) => (
            <div key={client.clientId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-white/30">#{idx + 1}</div>
                <div>
                  <div className="font-semibold">{client.businessName}</div>
                  <div className="text-sm text-white/60">{client.leadsProcessed} {t.leads}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-400">{client.confidence}%</div>
                <div className="text-xs text-white/50">{t.confidence}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Industry Insights & Cross-Client Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Insights */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            📊 {t.industryInsights}
          </h3>
          <div className="space-y-3">
            {stats.industryInsights.map((industry, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="font-semibold">{industry.industry || 'Unknown'}</div>
                  <div className="text-sm text-white/60">{industry.leadCount} {t.leads}</div>
                </div>
                <div className="text-lg font-bold text-blue-400">{industry.avgConfidence}%</div>
              </div>
            ))}
            {stats.industryInsights.length === 0 && (
              <div className="text-white/40 text-sm text-center py-4">
                {isFrench ? 'Pas encore de données' : 'No data yet'}
              </div>
            )}
          </div>
        </div>

        {/* Cross-Client Patterns */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            🔍 {t.crossClientPatterns}
          </h3>
          <div className="space-y-3">
            {stats.crossClientPatterns.map((pattern, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 bg-white/5 rounded-lg">
                <span className="text-purple-400 mt-0.5">•</span>
                <span className="text-sm text-white/80">{pattern}</span>
              </div>
            ))}
            {stats.crossClientPatterns.length === 0 && (
              <div className="text-white/40 text-sm text-center py-4">
                {isFrench ? 'Collecte de modèles en cours...' : 'Gathering patterns...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

