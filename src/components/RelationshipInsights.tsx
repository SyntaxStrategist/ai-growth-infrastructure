"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type HistoryEntry = {
  value: string | number;
  timestamp: string;
};

interface RelationshipInsightsProps {
  locale: string;
}

type LeadWithHistory = {
  name: string;
  email: string;
  tone_history: HistoryEntry[];
  confidence_history: HistoryEntry[];
  urgency_history: HistoryEntry[];
  relationship_insight: string | null;
  last_updated: string;
};

export default function RelationshipInsights({ locale }: RelationshipInsightsProps) {
  const [leads, setLeads] = useState<LeadWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const isFrench = locale === 'fr';

  const t = {
    title: isFrench ? 'Aperçus relationnels' : 'Relationship Insights',
    subtitle: isFrench ? 'Évolution des leads au fil du temps' : 'Lead evolution over time',
    noInsights: isFrench ? 'Aucun aperçu disponible' : 'No insights available',
    noInsightsDesc: isFrench ? 'Les aperçus apparaîtront lorsque les leads reviendront' : 'Insights will appear when leads return',
    lastUpdated: isFrench ? 'Dernière mise à jour' : 'Last Updated',
    toneHistory: isFrench ? 'Historique du ton' : 'Tone History',
    confidenceHistory: isFrench ? 'Historique de confiance' : 'Confidence History',
    urgencyHistory: isFrench ? 'Historique d\'urgence' : 'Urgency History',
    viewHistory: isFrench ? 'Voir l\'historique' : 'View History',
    hideHistory: isFrench ? 'Masquer l\'historique' : 'Hide History',
    noHistory: isFrench ? 'Aucun historique' : 'No history',
  };

  useEffect(() => {
    fetchLeadsWithInsights();
  }, []);

  async function fetchLeadsWithInsights() {
    try {
      setLoading(true);
      console.log('[RelationshipInsights] ============================================');
      console.log('[RelationshipInsights] Fetching leads with history...');
      console.log('[RelationshipInsights] ============================================');
      console.log('[RelationshipInsights] Using API endpoint approach for client component');
      console.log('[RelationshipInsights] Locale:', locale);
      
      // Use API endpoint instead of direct Supabase client (client component limitation)
      const endpoint = `/api/leads/insights?locale=${locale}`;
      console.log('[RelationshipInsights] Fetching from:', endpoint);
      
      const queryStart = Date.now();
      const response = await fetch(endpoint, { cache: 'no-store' });
      const queryDuration = Date.now() - queryStart;
      
      console.log('[RelationshipInsights] API request completed in', queryDuration, 'ms');
      console.log('[RelationshipInsights] Response status:', response.status);
      
      if (!response.ok) {
        console.error('[RelationshipInsights] ❌ API request failed with status:', response.status);
        const errorText = await response.text();
        console.error('[RelationshipInsights] Error response:', errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      
      const json = await response.json();
      console.log('[RelationshipInsights] API response:', {
        success: json.success,
        hasData: !!json.data,
        dataLength: json.data?.length || 0,
      });
      
      const data = json.data || [];
      const error = json.success ? null : json.error;

      console.log('[RelationshipInsights] Query completed in', queryDuration, 'ms');
      console.log('[RelationshipInsights] Query result:', {
        success: !error,
        rowCount: data?.length || 0,
        hasError: !!error,
      });

      if (error) {
        console.error('[RelationshipInsights] ============================================');
        console.error('[RelationshipInsights] ❌ Query FAILED');
        console.error('[RelationshipInsights] ============================================');
        console.error('[RelationshipInsights] Error code:', error.code);
        console.error('[RelationshipInsights] Error message:', error.message);
        console.error('[RelationshipInsights] Error details:', error.details);
        console.error('[RelationshipInsights] Error hint:', error.hint);
        console.error('[RelationshipInsights] Full error object:', JSON.stringify(error, null, 2));
        console.error('[RelationshipInsights] ============================================');
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('[RelationshipInsights] ============================================');
        console.log('[RelationshipInsights] ℹ️  No leads with relationship insights found');
        console.log('[RelationshipInsights] ============================================');
        console.log('[RelationshipInsights] This is expected when:');
        console.log('[RelationshipInsights]   - No leads have returned for a second contact');
        console.log('[RelationshipInsights]   - All leads are first-time contacts');
        console.log('[RelationshipInsights]   - Leads are archived or deleted');
        console.log('[RelationshipInsights] ============================================');
        setLeads([]);
        return;
      }

      console.log('[RelationshipInsights] ============================================');
      console.log('[RelationshipInsights] ✅ Found', data.length, 'leads with insights');
      console.log('[RelationshipInsights] ============================================');
      console.log('[RelationshipInsights] Sample data (first lead):');
      if (data[0]) {
        console.log('[RelationshipInsights]   Name:', data[0].name);
        console.log('[RelationshipInsights]   Email:', data[0].email);
        console.log('[RelationshipInsights]   Insight:', data[0].relationship_insight?.substring(0, 80) + '...');
        console.log('[RelationshipInsights]   Last Updated:', data[0].last_updated);
        console.log('[RelationshipInsights]   Tone History Length:', data[0].tone_history?.length || 0);
        console.log('[RelationshipInsights]   Confidence History Length:', data[0].confidence_history?.length || 0);
        console.log('[RelationshipInsights]   Urgency History Length:', data[0].urgency_history?.length || 0);
      }
      console.log('[RelationshipInsights] ============================================');
      console.log('[RelationshipInsights] All leads with insights:', data.map((l: any) => ({
        name: l.name,
        email: l.email,
        hasInsight: !!l.relationship_insight,
        historyLengths: {
          tone: l.tone_history?.length || 0,
          confidence: l.confidence_history?.length || 0,
          urgency: l.urgency_history?.length || 0,
        },
      })));
      console.log('[RelationshipInsights] ============================================');

      setLeads((data || []) as LeadWithHistory[]);
    } catch (err) {
      console.error('[RelationshipInsights] ============================================');
      console.error('[RelationshipInsights] ❌ CRITICAL ERROR');
      console.error('[RelationshipInsights] ============================================');
      console.error('[RelationshipInsights] Error type:', err instanceof Error ? err.constructor.name : typeof err);
      console.error('[RelationshipInsights] Error message:', err instanceof Error ? err.message : String(err));
      console.error('[RelationshipInsights] Error stack:', err instanceof Error ? err.stack : 'N/A');
      console.error('[RelationshipInsights] Full error object:', err);
      console.error('[RelationshipInsights] ============================================');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatHistoryValue(value: string | number): string {
    if (typeof value === 'number') {
      return (value * 100).toFixed(0) + '%';
    }
    return value;
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 p-6 bg-white/5">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-white/10 p-6 bg-white/5"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📈</span>
          <div>
            <h2 className="text-xl font-bold text-white">{t.title}</h2>
            <p className="text-sm text-white/60">{t.subtitle}</p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-white/50 mb-2">{t.noInsights}</p>
          <p className="text-sm text-white/40">{t.noInsightsDesc}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-white/10 p-6 bg-white/5"
    >
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📈</span>
        <div>
          <h2 className="text-xl font-bold text-white">{t.title}</h2>
          <p className="text-sm text-white/60">{t.subtitle}</p>
        </div>
      </div>

      <div className="space-y-4">
        {leads.map((lead, idx) => (
          <motion.div
            key={lead.email}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className="rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/5 to-purple-500/5 hover:border-blue-400/30 transition-all"
          >
            {/* Lead Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{lead.name}</h3>
                <p className="text-sm text-white/50 truncate">{lead.email}</p>
              </div>
              <div className="text-xs text-white/40 whitespace-nowrap">
                {t.lastUpdated}: {formatDate(lead.last_updated)}
              </div>
            </div>

            {/* Relationship Insight */}
            {lead.relationship_insight && (
              <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">💡</span>
                  <p className="text-sm text-blue-300 leading-relaxed">
                    {lead.relationship_insight}
                  </p>
                </div>
              </div>
            )}

            {/* Toggle History Button */}
            <button
              onClick={() => setExpandedLead(expandedLead === lead.email ? null : lead.email)}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              {expandedLead === lead.email ? '▼' : '▶'} {expandedLead === lead.email ? t.hideHistory : t.viewHistory}
            </button>

            {/* History Details (Expandable) */}
            {expandedLead === lead.email && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                {/* Tone History */}
                <div className="rounded-lg border border-white/10 p-3 bg-white/5">
                  <h4 className="text-xs font-semibold text-white/80 mb-2 flex items-center gap-2">
                    <span>🎭</span> {t.toneHistory}
                  </h4>
                  {lead.tone_history && lead.tone_history.length > 0 ? (
                    <div className="space-y-1">
                      {lead.tone_history.map((entry, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-white/70">{formatHistoryValue(entry.value)}</span>
                          <span className="text-white/40">{formatDate(entry.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40">{t.noHistory}</p>
                  )}
                </div>

                {/* Confidence History */}
                <div className="rounded-lg border border-white/10 p-3 bg-white/5">
                  <h4 className="text-xs font-semibold text-white/80 mb-2 flex items-center gap-2">
                    <span>📊</span> {t.confidenceHistory}
                  </h4>
                  {lead.confidence_history && lead.confidence_history.length > 0 ? (
                    <div className="space-y-2">
                      {lead.confidence_history.map((entry, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                              style={{ width: `${(entry.value as number) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-white/70 w-12 text-right">
                            {formatHistoryValue(entry.value)}
                          </span>
                          <span className="text-xs text-white/40 w-24 text-right">
                            {formatDate(entry.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40">{t.noHistory}</p>
                  )}
                </div>

                {/* Urgency History */}
                <div className="rounded-lg border border-white/10 p-3 bg-white/5">
                  <h4 className="text-xs font-semibold text-white/80 mb-2 flex items-center gap-2">
                    <span>⚡</span> {t.urgencyHistory}
                  </h4>
                  {lead.urgency_history && lead.urgency_history.length > 0 ? (
                    <div className="space-y-1">
                      {lead.urgency_history.map((entry, i) => {
                        const urgency = entry.value.toString().toLowerCase();
                        const color = urgency.includes('high') || urgency.includes('élevée') 
                          ? 'text-red-400' 
                          : urgency.includes('medium') || urgency.includes('moyenne')
                          ? 'text-yellow-400'
                          : 'text-green-400';
                        
                        return (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className={`${color} font-medium`}>{formatHistoryValue(entry.value)}</span>
                            <span className="text-white/40">{formatDate(entry.timestamp)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40">{t.noHistory}</p>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

