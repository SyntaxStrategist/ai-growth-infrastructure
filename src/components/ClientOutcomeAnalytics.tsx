"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ClientOutcomeAnalyticsProps {
  locale: string;
}

interface ClientOutcomeData {
  client_id: string;
  business_name: string;
  total_leads: number;
  contacted_leads: number;
  meeting_booked_leads: number;
  client_closed_leads: number;
  no_sale_leads: number;
  contact_rate: number;
  meeting_rate: number;
  close_rate: number;
  overall_conversion_rate: number;
}

export default function ClientOutcomeAnalytics({ locale }: ClientOutcomeAnalyticsProps) {
  const [analytics, setAnalytics] = useState<ClientOutcomeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFrench = locale === 'fr';

  useEffect(() => {
    fetchOutcomeAnalytics();
  }, []);

  const fetchOutcomeAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/outcome-analytics', {
        headers: {
          'x-admin-session': 'authenticated'
        }
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }

      setAnalytics(data.data || []);
    } catch (err) {
      console.error('[ClientOutcomeAnalytics] Fetch failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getRateColor = (rate: number | null) => {
    const safeRate = rate || 0;
    if (safeRate >= 80) return 'text-green-400';
    if (safeRate >= 60) return 'text-yellow-400';
    if (safeRate >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRateBgColor = (rate: number | null) => {
    const safeRate = rate || 0;
    if (safeRate >= 80) return 'bg-green-500/20 border-green-500/40';
    if (safeRate >= 60) return 'bg-yellow-500/20 border-yellow-500/40';
    if (safeRate >= 40) return 'bg-orange-500/20 border-orange-500/40';
    return 'bg-red-500/20 border-red-500/40';
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card-base p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
            <span className="text-lg">📊</span>
          </div>
          <h3 className="text-xl font-bold">
            {isFrench ? 'Analyses des Résultats Clients' : 'Client Outcome Analytics'}
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-white/60">
            <span className="inline-block w-4 h-4 border border-white/30 border-t-white/60 rounded-full animate-spin"></span>
            <span>{isFrench ? 'Chargement...' : 'Loading...'}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card-base p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
            <span className="text-lg">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-red-400">
            {isFrench ? 'Erreur de Chargement' : 'Loading Error'}
          </h3>
        </div>
        <div className="text-red-400 text-sm">
          {error}
        </div>
        <button
          onClick={fetchOutcomeAnalytics}
          className="mt-4 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all text-sm"
        >
          {isFrench ? 'Réessayer' : 'Retry'}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card-base p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
            <span className="text-lg">📊</span>
          </div>
          <h3 className="text-xl font-bold">
            {isFrench ? 'Analyses des Résultats Clients' : 'Client Outcome Analytics'}
          </h3>
        </div>
        <button
          onClick={fetchOutcomeAnalytics}
          className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-all text-sm"
        >
          🔄 {isFrench ? 'Actualiser' : 'Refresh'}
        </button>
      </div>

      {analytics.length === 0 ? (
        <div className="text-center py-8 text-white/60">
          {isFrench 
            ? 'Aucune donnée d\'analyse disponible pour le moment.'
            : 'No analytics data available at the moment.'
          }
        </div>
      ) : (
        <div className="space-y-4">
          {analytics.map((client, index) => (
            <motion.div
              key={client.client_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="rounded-lg border border-white/10 p-4 bg-white/5 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">
                  {client.business_name}
                </h4>
                <div className="text-sm text-white/60">
                  {client.total_leads} {isFrench ? 'leads total' : 'total leads'}
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{client.contacted_leads}</div>
                  <div className="text-xs text-white/60">{isFrench ? 'Contactés' : 'Contacted'}</div>
                  <div className={`text-xs px-2 py-1 rounded border mt-1 ${getRateBgColor(client.contact_rate)} ${getRateColor(client.contact_rate)}`}>
                    {(client.contact_rate || 0).toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{client.meeting_booked_leads}</div>
                  <div className="text-xs text-white/60">{isFrench ? 'Réunions' : 'Meetings'}</div>
                  <div className={`text-xs px-2 py-1 rounded border mt-1 ${getRateBgColor(client.meeting_rate)} ${getRateColor(client.meeting_rate)}`}>
                    {(client.meeting_rate || 0).toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{client.client_closed_leads}</div>
                  <div className="text-xs text-white/60">{isFrench ? 'Clients' : 'Clients'}</div>
                  <div className={`text-xs px-2 py-1 rounded border mt-1 ${getRateBgColor(client.close_rate)} ${getRateColor(client.close_rate)}`}>
                    {(client.close_rate || 0).toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{client.no_sale_leads}</div>
                  <div className="text-xs text-white/60">{isFrench ? 'Pas de Vente' : 'No Sale'}</div>
                  {(() => {
                    const noSaleRate = client.total_leads > 0 ? (client.no_sale_leads / client.total_leads) * 100 : 0;
                    return (
                      <div className={`text-xs px-2 py-1 rounded border mt-1 ${getRateBgColor(noSaleRate)} ${getRateColor(noSaleRate)}`}>
                        {noSaleRate.toFixed(1)}%
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Overall Performance */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="text-sm text-white/60">
                  {isFrench ? 'Taux de Contact' : 'Contact Rate'}
                </div>
                <div className={`text-lg font-bold ${getRateColor(client.contact_rate)}`}>
                  {client.contact_rate?.toFixed(1) || '0.0'}%
                </div>
              </div>

              {/* Performance Bar */}
              <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${client.contact_rate || 0}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className={`h-full ${
                    (client.contact_rate || 0) >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                    (client.contact_rate || 0) >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                    (client.contact_rate || 0) >= 40 ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                    'bg-gradient-to-r from-red-500 to-red-400'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {analytics.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 pt-6 border-t border-white/10"
        >
          <h4 className="text-lg font-semibold mb-4">
            {isFrench ? 'Résumé Global' : 'Global Summary'}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {analytics.reduce((sum, client) => sum + client.total_leads, 0)}
              </div>
              <div className="text-sm text-white/60">{isFrench ? 'Leads Total' : 'Total Leads'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {analytics.reduce((sum, client) => sum + client.client_closed_leads, 0)}
              </div>
              <div className="text-sm text-white/60">{isFrench ? 'Clients Fermés' : 'Clients Closed'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {analytics.length > 0 
                  ? (analytics.reduce((sum, client) => sum + (client.contact_rate || 0), 0) / analytics.length).toFixed(1)
                  : '0.0'
                }%
              </div>
              <div className="text-sm text-white/60">{isFrench ? 'Taux Moyen' : 'Avg Rate'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {analytics.length}
              </div>
              <div className="text-sm text-white/60">{isFrench ? 'Clients Actifs' : 'Active Clients'}</div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
