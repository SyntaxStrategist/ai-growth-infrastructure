'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface OutreachMetrics {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  metrics: {
    totalSent: number;
    totalOpened: number;
    totalReplied: number;
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    openRate: number;
    replyRate: number;
  };
  actionCounts: Record<string, number>;
  dailyLimit: {
    limit: number;
    used: number;
  };
}

interface OutreachPerformancePanelProps {
  locale: string;
}

export default function OutreachPerformancePanel({ locale }: OutreachPerformancePanelProps) {
  const [metrics, setMetrics] = useState<OutreachMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  const isFrench = locale === 'fr';

  useEffect(() => {
    loadMetrics();
  }, [selectedPeriod]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/outreach/metrics?period=${selectedPeriod}`);
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  const getPeriodLabel = (period: string) => {
    const labels = {
      today: isFrench ? 'Aujourd\'hui' : 'Today',
      week: isFrench ? 'Cette semaine' : 'This Week',
      month: isFrench ? 'Ce mois' : 'This Month'
    };
    return labels[period as keyof typeof labels] || period;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <div className="text-white/50">
          {isFrench ? 'Aucune donnée disponible' : 'No data available'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isFrench ? 'Performance de prospection' : 'Outreach Performance'}
          </h2>
          <p className="text-white/60">
            {isFrench ? 'Métriques et analyses en temps réel' : 'Real-time metrics and analytics'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['today', 'week', 'month'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedPeriod === period
                  ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {getPeriodLabel(period)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0 }}
          className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-white/10 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/60 text-sm">
                {isFrench ? 'Emails envoyés' : 'Emails Sent'}
              </div>
              <div className="text-3xl font-bold text-white mt-1">
                {formatNumber(metrics.metrics.totalSent)}
              </div>
            </div>
            <div className="text-3xl opacity-60">📧</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-white/10 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/60 text-sm">
                {isFrench ? 'Taux d\'ouverture' : 'Open Rate'}
              </div>
              <div className="text-3xl font-bold text-green-400 mt-1">
                {formatPercentage(metrics.metrics.openRate)}
              </div>
            </div>
            <div className="text-3xl opacity-60">👁️</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-white/10 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/60 text-sm">
                {isFrench ? 'Taux de réponse' : 'Reply Rate'}
              </div>
              <div className="text-3xl font-bold text-purple-400 mt-1">
                {formatPercentage(metrics.metrics.replyRate)}
              </div>
            </div>
            <div className="text-3xl opacity-60">💬</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl border border-white/10 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/60 text-sm">
                {isFrench ? 'En attente' : 'Pending'}
              </div>
              <div className="text-3xl font-bold text-yellow-400 mt-1">
                {formatNumber(metrics.metrics.totalPending)}
              </div>
            </div>
            <div className="text-3xl opacity-60">⏳</div>
          </div>
        </motion.div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approval Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-white/5 rounded-xl border border-white/10 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            {isFrench ? 'Statistiques d\'approbation' : 'Approval Statistics'}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">
                {isFrench ? 'Approuvés aujourd\'hui' : 'Approved Today'}
              </span>
              <span className="text-green-400 font-semibold">
                {formatNumber(metrics.metrics.totalApproved)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">
                {isFrench ? 'Rejetés aujourd\'hui' : 'Rejected Today'}
              </span>
              <span className="text-red-400 font-semibold">
                {formatNumber(metrics.metrics.totalRejected)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">
                {isFrench ? 'Limite quotidienne' : 'Daily Limit'}
              </span>
              <span className="text-blue-400 font-semibold">
                {metrics.dailyLimit.used} / {metrics.dailyLimit.limit}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mt-4">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(metrics.dailyLimit.used / metrics.dailyLimit.limit) * 100}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Engagement Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-white/5 rounded-xl border border-white/10 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            {isFrench ? 'Engagement' : 'Engagement'}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">
                {isFrench ? 'Emails ouverts' : 'Emails Opened'}
              </span>
              <span className="text-green-400 font-semibold">
                {formatNumber(metrics.metrics.totalOpened)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">
                {isFrench ? 'Réponses reçues' : 'Replies Received'}
              </span>
              <span className="text-purple-400 font-semibold">
                {formatNumber(metrics.metrics.totalReplied)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">
                {isFrench ? 'Taux de conversion' : 'Conversion Rate'}
              </span>
              <span className="text-orange-400 font-semibold">
                {formatPercentage((metrics.metrics.totalReplied / Math.max(metrics.metrics.totalSent, 1)) * 100)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Timeline */}
      {Object.keys(metrics.actionCounts).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="bg-white/5 rounded-xl border border-white/10 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            {isFrench ? 'Activité récente' : 'Recent Activity'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(metrics.actionCounts).map(([action, count]) => (
              <div key={action} className="text-center">
                <div className="text-2xl font-bold text-white">
                  {formatNumber(count)}
                </div>
                <div className="text-sm text-white/60 capitalize">
                  {isFrench ? 
                    (action === 'approve' ? 'Approuvés' : 
                     action === 'reject' ? 'Rejetés' : 
                     action === 'sent' ? 'Envoyés' : 
                     action === 'opened' ? 'Ouverts' : 
                     action === 'replied' ? 'Réponses' : action) :
                    action
                  }
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Performance Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
        className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-white/10 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          {isFrench ? 'Indicateurs de performance' : 'Performance Indicators'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {metrics.metrics.openRate >= 25 ? '🟢' : metrics.metrics.openRate >= 15 ? '🟡' : '🔴'}
            </div>
            <div className="text-sm text-white/60">
              {isFrench ? 'Taux d\'ouverture' : 'Open Rate'}
            </div>
            <div className="text-lg font-semibold text-white">
              {formatPercentage(metrics.metrics.openRate)}
            </div>
            <div className="text-xs text-white/50">
              {isFrench ? 'Objectif: 25%+' : 'Target: 25%+'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {metrics.metrics.replyRate >= 3 ? '🟢' : metrics.metrics.replyRate >= 2 ? '🟡' : '🔴'}
            </div>
            <div className="text-sm text-white/60">
              {isFrench ? 'Taux de réponse' : 'Reply Rate'}
            </div>
            <div className="text-lg font-semibold text-white">
              {formatPercentage(metrics.metrics.replyRate)}
            </div>
            <div className="text-xs text-white/50">
              {isFrench ? 'Objectif: 3%+' : 'Target: 3%+'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {metrics.dailyLimit.used < metrics.dailyLimit.limit * 0.8 ? '🟢' : '🟡'}
            </div>
            <div className="text-sm text-white/60">
              {isFrench ? 'Utilisation quotidienne' : 'Daily Usage'}
            </div>
            <div className="text-lg font-semibold text-white">
              {Math.round((metrics.dailyLimit.used / metrics.dailyLimit.limit) * 100)}%
            </div>
            <div className="text-xs text-white/50">
              {isFrench ? 'Objectif: <80%' : 'Target: <80%'}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
