"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type HistoryEntry = {
  value: string | number;
  timestamp: string;
};

interface RelationshipInsightsProps {
  locale: string;
  clientId?: string | null;
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

export default function RelationshipInsights({ locale, clientId = null }: RelationshipInsightsProps) {
  const [leads, setLeads] = useState<LeadWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage] = useState(4);
  const [totalLeads, setTotalLeads] = useState(0);

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
    // Pagination labels
    previous: isFrench ? 'Précédent' : 'Previous',
    next: isFrench ? 'Suivant' : 'Next',
    showing: isFrench ? 'Affichage' : 'Showing',
    of: isFrench ? 'sur' : 'of',
  };

  // Translation mappings for dynamic values
  const toneTranslations = {
    // English to French
    'Professional and direct': 'Professionnel et direct',
    'Frustrated but motivated': 'Frustré mais motivé',
    'Satisfied and technical': 'Satisfait et technique',
    'Enthusiastic and engaged': 'Enthousiaste et engagé',
    'Excited and committed': 'Excité et engagé',
    'Strategic and analytical': 'Stratégique et analytique',
    'Curious and exploratory': 'Curieux et exploratoire',
    'Formal': 'Formel',
    'Casual': 'Décontracté',
    'Urgent': 'Urgent',
    'Neutral': 'Neutre',
    'Friendly': 'Amical',
    'Professional': 'Professionnel',
    'Analytical': 'Analytique',
    // French to English
    'Exploratoire et ouvert': 'Exploratory and open',
    'Intéressé et spécifique': 'Interested and specific',
    'Professionnel et direct': 'Professional and direct',
    'Frustré mais motivé': 'Frustrated but motivated',
    'Satisfait et technique': 'Satisfied and technical',
    'Enthousiaste et engagé': 'Enthusiastic and engaged',
    'Excité et engagé': 'Excited and committed',
    'Stratégique et analytique': 'Strategic and analytical',
    'Curieux et exploratoire': 'Curious and exploratory',
    'Formel': 'Formal',
    'Décontracté': 'Casual',
    'Urgent': 'Urgent',
    'Neutre': 'Neutral',
    'Amical': 'Friendly',
    'Professionnel': 'Professional',
    'Analytique': 'Analytical',
  };

  const urgencyTranslations = {
    // English to French
    'High': 'Élevée',
    'Medium': 'Moyenne',
    'Low': 'Faible',
    // French to English
    'Élevée': 'High',
    'Moyenne': 'Medium',
    'Faible': 'Low',
  };

  const insightTranslations = {
    // English to French
    'Demo successful. Moving to technical phase. High conversion probability.': 'Démonstration réussie. Passage à la phase technique. Probabilité de conversion élevée.',
    'CONVERTED! Excellent relationship progression. Ready for onboarding process.': 'CONVERTI! Excellente progression relationnelle. Prêt pour le processus d\'intégration.',
    'Strong initial interest, follow up soon.': 'Fort intérêt initial, suivi bientôt.',
    'Technical discussion phase, high potential.': 'Phase de discussion technique, potentiel élevé.',
    'Marketing pilot phase, monitor closely.': 'Phase pilote marketing, surveiller de près.',
    // French to English
    'Recommandations efficaces. Prêt pour démonstration personnalisée.': 'Effective recommendations. Ready for personalized demonstration.',
    'Démonstration réussie. Passage à la phase technique. Probabilité de conversion élevée.': 'Demo successful. Moving to technical phase. High conversion probability.',
    'CONVERTI! Excellente progression relationnelle. Prêt pour le processus d\'intégration.': 'CONVERTED! Excellent relationship progression. Ready for onboarding process.',
    'Fort intérêt initial, suivi bientôt.': 'Strong initial interest, follow up soon.',
    'Phase de discussion technique, potentiel élevé.': 'Technical discussion phase, high potential.',
    'Phase pilote marketing, surveiller de près.': 'Marketing pilot phase, monitor closely.',
  };

  useEffect(() => {
    fetchLeadsWithInsights();
  }, []);

  // Pagination functions
  const totalPages = Math.ceil(totalLeads / leadsPerPage);
  const startIndex = (currentPage - 1) * leadsPerPage;
  const endIndex = startIndex + leadsPerPage;
  const currentLeads = leads.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setExpandedLead(null); // Close any expanded leads when changing pages
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setExpandedLead(null); // Close any expanded leads when changing pages
    }
  };

  async function fetchLeadsWithInsights() {
    try {
      setLoading(true);
      console.log('[RelationshipInsights] ============================================');
      console.log('[RelationshipInsights] Fetching leads with history...');
      console.log('[RelationshipInsights] ============================================');
      console.log('[RelationshipInsights] Using API endpoint approach for client component');
      console.log('[RelationshipInsights] Locale:', locale);
      console.log('[RelationshipInsights] Client ID:', clientId || 'admin (all clients)');
      
      // Use API endpoint instead of direct Supabase client (client component limitation)
      const endpoint = clientId 
        ? `/api/leads/insights?locale=${locale}&clientId=${clientId}`
        : `/api/leads/insights?locale=${locale}`;
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
      setTotalLeads((data || []).length);
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

  // Translation functions
  const translateTone = (value: string): string => {
    if (isFrench) {
      // If we're on French dashboard, translate English tones to French
      return toneTranslations[value as keyof typeof toneTranslations] || value;
    } else {
      // If we're on English dashboard, translate French tones to English
      return toneTranslations[value as keyof typeof toneTranslations] || value;
    }
  };

  const translateUrgency = (value: string): string => {
    if (isFrench) {
      // If we're on French dashboard, translate English urgency to French
      return urgencyTranslations[value as keyof typeof urgencyTranslations] || value;
    } else {
      // If we're on English dashboard, translate French urgency to English
      return urgencyTranslations[value as keyof typeof urgencyTranslations] || value;
    }
  };

  const translateInsight = (value: string): string => {
    if (isFrench) {
      // If we're on French dashboard, translate English insights to French
      return insightTranslations[value as keyof typeof insightTranslations] || value;
    } else {
      // If we're on English dashboard, translate French insights to English
      return insightTranslations[value as keyof typeof insightTranslations] || value;
    }
  };

  function formatHistoryValue(value: string | number, type: 'tone' | 'urgency' | 'confidence' = 'confidence'): string {
    if (typeof value === 'number') {
      return (value * 100).toFixed(0) + '%';
    }
    
    const stringValue = value.toString();
    
    if (type === 'tone') {
      return translateTone(stringValue);
    } else if (type === 'urgency') {
      return translateUrgency(stringValue);
    }
    
    return stringValue;
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

      <motion.div 
        key={currentPage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {currentLeads.map((lead, idx) => (
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
                    {translateInsight(lead.relationship_insight)}
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
                          <span className="text-white/70">{formatHistoryValue(entry.value, 'tone')}</span>
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
                            <span className={`${color} font-medium`}>{formatHistoryValue(entry.value, 'urgency')}</span>
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
      </motion.div>

      {/* Pagination Controls */}
      {totalLeads > leadsPerPage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-6 flex items-center justify-between"
        >
          {/* Pagination Info */}
          <div className="text-sm text-white/60">
            {t.showing} {startIndex + 1}-{Math.min(endIndex, totalLeads)} {t.of} {totalLeads}
          </div>

          {/* Pagination Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === 1
                  ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:border-white/30 hover:text-white'
              }`}
            >
              {t.previous}
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      setCurrentPage(pageNum);
                      setExpandedLead(null);
                    }}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                      currentPage === pageNum
                        ? 'bg-blue-500 border border-blue-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                        : 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === totalPages
                  ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:border-white/30 hover:text-white'
              }`}
            >
              {t.next}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

