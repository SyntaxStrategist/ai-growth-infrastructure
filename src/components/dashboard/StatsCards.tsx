"use client";

import { motion } from 'framer-motion';
import type { DashboardStats } from '@/hooks/useDashboardStats';
import { StatsGridSkeleton } from '@/components/SkeletonLoader';

interface StatsCardsProps {
  stats: DashboardStats;
  isIntentTruncated: boolean;
  isFrench: boolean;
  onToggleIntent: () => void;
  loading?: boolean;
}

export default function StatsCards({ 
  stats, 
  isIntentTruncated, 
  isFrench, 
  onToggleIntent,
  loading = false
}: StatsCardsProps) {
  const translations = {
    totalLeads: isFrench ? 'Total de Leads' : 'Total Leads',
    avgConfidence: isFrench ? 'Confiance Moyenne' : 'Avg Confidence',
    topIntent: isFrench ? 'Intention Principale' : 'Top Intent',
    highUrgency: isFrench ? 'Urgence Élevée' : 'High Urgency',
  };

  if (loading) {
    return <StatsGridSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
    >
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
        <div className="text-3xl font-bold text-blue-400">{stats.total}</div>
        <div className="text-sm text-white/60">{translations.totalLeads}</div>
      </div>
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
        <div className="text-3xl font-bold text-purple-400">{stats.avgConfidence}%</div>
        <div className="text-sm text-white/60">{translations.avgConfidence}</div>
      </div>
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
        <div className="text-3xl font-bold text-pink-400">
          {stats.topIntent ? (stats.topIntent.length > 10 ? stats.topIntent.substring(0, 10) + '...' : stats.topIntent) : (isFrench ? 'Aucun' : 'None')}
        </div>
        <div className="text-sm text-white/60">{translations.topIntent}</div>
      </div>
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
        <div className="text-3xl font-bold text-green-400">{stats.highUrgency}</div>
        <div className="text-sm text-white/60">{translations.highUrgency}</div>
      </div>
    </motion.div>
  );
}
