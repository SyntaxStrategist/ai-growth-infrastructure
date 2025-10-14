"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocale } from 'next-intl';
import { translateLeadFields } from "../../../../lib/translate-fields";
import type { LeadMemoryRecord } from "../../../../lib/supabase";

type TranslatedLead = LeadMemoryRecord & {
  translated?: {
    ai_summary: string;
    intent: string;
    tone: string;
    urgency: string;
    locale: string;
  };
};

export default function ClientDashboard() {
  const locale = useLocale();
  const [authenticated, setAuthenticated] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [authError, setAuthError] = useState("");
  const [authenticating, setAuthenticating] = useState(false);
  const [clientInfo, setClientInfo] = useState<{ client_id: string; company_name: string; contact_email: string } | null>(null);
  const [leads, setLeads] = useState<TranslatedLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ urgency: 'all', minConfidence: 0, startDate: '', endDate: '' });
  const [stats, setStats] = useState({ total: 0, avgConfidence: 0, highUrgency: 0 });

  const t = {
    loginTitle: locale === 'fr' ? 'Portail d\'Intelligence Avenir AI' : 'Avenir AI Intelligence Portal',
    loginWelcome: locale === 'fr' 
      ? 'Bienvenue sur votre tableau d\'intelligence artificielle — propulsé par Avenir AI Solutions.'
      : 'Welcome to your AI Intelligence Dashboard — powered by Avenir AI Solutions.',
    apiKeyPlaceholder: locale === 'fr' ? 'Entrez votre clé API' : 'Enter your API key',
    loginButton: locale === 'fr' ? 'Se connecter' : 'Login',
    invalidKey: locale === 'fr' ? 'Clé API invalide' : 'Invalid API key',
    logout: locale === 'fr' ? 'Déconnexion' : 'Logout',
    leads: locale === 'fr' ? 'Leads' : 'Leads',
    totalLeads: locale === 'fr' ? 'Total des Leads' : 'Total Leads',
    avgConfidence: locale === 'fr' ? 'Confiance Moyenne' : 'Average Confidence',
    highUrgency: locale === 'fr' ? 'Urgence Élevée' : 'High Urgency',
    filters: locale === 'fr' ? 'Filtres' : 'Filters',
    urgency: locale === 'fr' ? 'Urgence' : 'Urgency',
    all: locale === 'fr' ? 'Tous' : 'All',
    high: locale === 'fr' ? 'Élevée' : 'High',
    medium: locale === 'fr' ? 'Moyenne' : 'Medium',
    low: locale === 'fr' ? 'Faible' : 'Low',
    minConfidence: locale === 'fr' ? 'Confiance Minimale' : 'Min Confidence',
    dateRange: locale === 'fr' ? 'Plage de Dates' : 'Date Range',
    from: locale === 'fr' ? 'De' : 'From',
    to: locale === 'fr' ? 'À' : 'To',
    name: locale === 'fr' ? 'Nom' : 'Name',
    email: locale === 'fr' ? 'Email' : 'Email',
    message: locale === 'fr' ? 'Message' : 'Message',
    summary: locale === 'fr' ? 'Résumé IA' : 'AI Summary',
    intent: locale === 'fr' ? 'Intention' : 'Intent',
    tone: locale === 'fr' ? 'Ton' : 'Tone',
    confidence: locale === 'fr' ? 'Confiance' : 'Confidence',
    timestamp: locale === 'fr' ? 'Horodatage' : 'Timestamp',
    noLeads: locale === 'fr' ? 'Aucun lead trouvé pour vos filtres.' : 'No leads found for your filters.',
  };

  useEffect(() => {
    const stored = localStorage.getItem('client_auth');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setClientInfo(data);
        setAuthenticated(true);
        fetchLeads(data.client_id);
      } catch {
        localStorage.removeItem('client_auth');
      }
    }
  }, []);

  // Re-translate when locale changes
  useEffect(() => {
    if (!authenticated || !clientInfo || leads.length === 0) return;
    
    console.log(`[Client Portal] Locale changed to: ${locale} - re-translating all leads`);
    
    async function retranslate() {
      const translatedLeads = await Promise.all(
        leads.map(async (lead: TranslatedLead) => {
          const translated = await translateLeadFields({
            id: lead.id,
            ai_summary: lead.ai_summary,
            intent: lead.intent,
            tone: lead.tone,
            urgency: lead.urgency,
          }, locale);
          
          return {
            ...lead,
            translated,
          } as TranslatedLead;
        })
      );
      setLeads(translatedLeads);
      calculateStats(translatedLeads);
    }
    
    retranslate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthenticating(true);
    setAuthError("");

    try {
      const res = await fetch('/api/client-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setClientInfo(data.data);
        setAuthenticated(true);
        localStorage.setItem('client_auth', JSON.stringify(data.data));
        fetchLeads(data.data.client_id);
      } else {
        setAuthError(t.invalidKey);
        setApiKey("");
      }
    } catch {
      setAuthError(t.invalidKey);
    } finally {
      setAuthenticating(false);
    }
  }

  async function fetchLeads(clientId: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/client-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, limit: 100 }),
      });

      const json = await res.json();

      if (json.success) {
        const leadsData = json.data || [];

        // Translate fields to match current locale
        const translatedLeads = await Promise.all(
          leadsData.map(async (lead: LeadMemoryRecord) => {
            const translated = await translateLeadFields({
              id: lead.id,
              ai_summary: lead.ai_summary,
              intent: lead.intent,
              tone: lead.tone,
              urgency: lead.urgency,
            }, locale);

            return {
              ...lead,
              translated,
            } as TranslatedLead;
          })
        );

        setLeads(translatedLeads);
        calculateStats(translatedLeads);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(leadsData: TranslatedLead[]) {
    const total = leadsData.length;
    const avgConfidence = leadsData.reduce((sum, l) => sum + (l.confidence_score || 0), 0) / total || 0;
    const highUrgency = leadsData.filter(l => 
      (l.translated?.urgency || l.urgency) === 'High' || 
      (l.translated?.urgency || l.urgency) === 'Élevée'
    ).length;

    setStats({ total, avgConfidence, highUrgency });
  }

  function handleLogout() {
    localStorage.removeItem('client_auth');
    setAuthenticated(false);
    setClientInfo(null);
    setLeads([]);
    setApiKey("");
  }

  const filteredLeads = leads.filter(lead => {
    const urgencyMatch = filter.urgency === 'all' || 
      (lead.translated?.urgency || lead.urgency)?.toLowerCase() === filter.urgency.toLowerCase() ||
      ((lead.translated?.urgency || lead.urgency) === 'Élevée' && filter.urgency === 'high') ||
      ((lead.translated?.urgency || lead.urgency) === 'Moyenne' && filter.urgency === 'medium') ||
      ((lead.translated?.urgency || lead.urgency) === 'Faible' && filter.urgency === 'low');

    const confidenceMatch = (lead.confidence_score || 0) >= filter.minConfidence;

    let dateMatch = true;
    if (filter.startDate) {
      dateMatch = dateMatch && new Date(lead.timestamp) >= new Date(filter.startDate);
    }
    if (filter.endDate) {
      dateMatch = dateMatch && new Date(lead.timestamp) <= new Date(filter.endDate);
    }

    return urgencyMatch && confidenceMatch && dateMatch;
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="rounded-lg border border-white/10 p-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-xl"></div>
            
            <div className="relative">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {t.loginTitle}
                </h1>
                <p className="text-white/60 text-sm">
                  {t.loginWelcome}
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={t.apiKeyPlaceholder}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-sm"
                    autoFocus
                    disabled={authenticating}
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
                  disabled={authenticating || !apiKey.trim()}
                  className="w-full py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authenticating ? '...' : t.loginButton}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl md:text-3xl font-bold mb-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {t.loginTitle}
              </h1>
              <p className="text-white/60 text-sm">
                {clientInfo?.company_name}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all text-sm"
            >
              {t.logout}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-lg border border-white/10 p-4 bg-white/5 hover:bg-white/10 transition-all"
            >
              <p className="text-white/60 text-sm mb-1">{t.totalLeads}</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-lg border border-white/10 p-4 bg-white/5 hover:bg-white/10 transition-all"
            >
              <p className="text-white/60 text-sm mb-1">{t.avgConfidence}</p>
              <p className="text-2xl font-bold">{(stats.avgConfidence * 100).toFixed(0)}%</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="rounded-lg border border-white/10 p-4 bg-white/5 hover:bg-white/10 transition-all"
            >
              <p className="text-white/60 text-sm mb-1">{t.highUrgency}</p>
              <p className="text-2xl font-bold text-red-400">{stats.highUrgency}</p>
            </motion.div>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="rounded-lg border border-white/10 p-4 bg-white/5 space-y-4"
          >
            <h3 className="text-lg font-semibold mb-3">{t.filters}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">{t.urgency}</label>
                <select
                  value={filter.urgency}
                  onChange={(e) => setFilter({ ...filter, urgency: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                >
                  <option value="all">{t.all}</option>
                  <option value="high">{t.high}</option>
                  <option value="medium">{t.medium}</option>
                  <option value="low">{t.low}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">{t.minConfidence}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filter.minConfidence}
                  onChange={(e) => setFilter({ ...filter, minConfidence: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <span className="text-xs text-white/60">{(filter.minConfidence * 100).toFixed(0)}%</span>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">{t.from}</label>
                <input
                  type="date"
                  value={filter.startDate}
                  onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">{t.to}</label>
                <input
                  type="date"
                  value={filter.endDate}
                  onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Leads List */}
        {filteredLeads.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-white/40"
          >
            <p>{t.noLeads}</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-3"
          >
            {filteredLeads.map((lead, idx) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="rounded-lg border border-white/10 p-4 md:p-5 bg-white/5 hover:bg-white/10 hover:border-blue-400/30 transition-all"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-white/50 text-xs block mb-1">{t.name}</span>
                    <p className="font-semibold">{lead.name}</p>
                  </div>
                  <div>
                    <span className="text-white/50 text-xs block mb-1">{t.email}</span>
                    <p className="text-blue-400">{lead.email}</p>
                  </div>
                  <div>
                    <span className="text-white/50 text-xs block mb-1">{t.timestamp}</span>
                    <p className="text-xs">
                      {new Date(lead.timestamp).toLocaleString(locale === 'fr' ? 'fr-CA' : 'en-US')}
                    </p>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <span className="text-white/50 text-xs block mb-1">{t.message}</span>
                    <p className="text-white/80 italic">&quot;{lead.message}&quot;</p>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <span className="text-white/50 text-xs block mb-1">{t.summary}</span>
                    <p className="text-white/90">
                      {lead.translated?.ai_summary || lead.ai_summary || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/50 text-xs block mb-1">{t.intent}</span>
                    <p className="text-blue-300 font-medium">
                      {lead.translated?.intent || lead.intent || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/50 text-xs block mb-1">{t.tone}</span>
                    <p>{lead.translated?.tone || lead.tone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-white/50 text-xs block mb-1">{t.urgency}</span>
                    <p className={
                      ((lead.translated?.urgency || lead.urgency) === 'High' || (lead.translated?.urgency || lead.urgency) === 'Élevée') ? 'text-red-400 font-semibold' :
                      ((lead.translated?.urgency || lead.urgency) === 'Medium' || (lead.translated?.urgency || lead.urgency) === 'Moyenne') ? 'text-yellow-400' :
                      'text-green-400'
                    }>
                      {lead.translated?.urgency || lead.urgency || 'N/A'}
                    </p>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <span className="text-white/50 text-xs block mb-1">{t.confidence}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(lead.confidence_score || 0) * 100}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.05 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        ></motion.div>
                      </div>
                      <span className="text-xs font-mono">{((lead.confidence_score || 0) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

