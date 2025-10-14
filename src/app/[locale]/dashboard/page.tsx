"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from "../../../lib/supabase";
import { translateLeadFields, clearTranslationCache } from "../../../lib/translate-fields";
import type { LeadMemoryRecord } from "../../../lib/supabase";

type TranslatedLead = LeadMemoryRecord & {
  translated?: {
    ai_summary: string;
    intent: string;
    tone: string;
    urgency: string;
    locale: string;
  };
};

export default function Dashboard() {
  const t = useTranslations();
  const locale = useLocale();
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState(false);
  const [leads, setLeads] = useState<TranslatedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ urgency: 'all', language: 'all', minConfidence: 0 });
  const [stats, setStats] = useState({ total: 0, avgConfidence: 0, topIntent: '', highUrgency: 0 });
  const [isLive, setIsLive] = useState(false);
  const [translating, setTranslating] = useState(false);

  // Check localStorage for existing auth
  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_auth');
    if (savedAuth === 'true') {
      setAuthorized(true);
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;
    
    fetchLeads();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('lead_memory_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'lead_memory' },
        (payload) => {
          console.log('[Dashboard] New lead received:', payload.new);
          setIsLive(true);
          setTimeout(() => setIsLive(false), 2000);
          fetchLeads();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  async function fetchLeads() {
    try {
      const res = await fetch('/api/leads?limit=100');
      const json = await res.json();
      if (json.success) {
        const leadsData = json.data || [];
        
        // Translate fields to match current locale
        setTranslating(true);
        const translatedLeads = await Promise.all(
          leadsData.map(async (lead: LeadMemoryRecord) => {
            // Always translate to match current locale (uses cache internally)
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
        setTranslating(false);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(leadsData: LeadMemoryRecord[]) {
    const total = leadsData.length;
    const avgConfidence = leadsData.reduce((sum, l) => sum + (l.confidence_score || 0), 0) / total || 0;
    const highUrgency = leadsData.filter(l => l.urgency === 'High' || l.urgency === 'Élevée').length;
    const intentCounts: Record<string, number> = {};
    leadsData.forEach(l => {
      if (l.intent) {
        intentCounts[l.intent] = (intentCounts[l.intent] || 0) + 1;
      }
    });
    const topIntent = Object.keys(intentCounts).sort((a, b) => intentCounts[b] - intentCounts[a])[0] || 'N/A';
    setStats({ total, avgConfidence, topIntent, highUrgency });
  }

  const filteredLeads = leads.filter(lead => {
    if (filter.urgency !== 'all' && lead.urgency !== filter.urgency) return false;
    if (filter.language !== 'all' && lead.language !== filter.language) return false;
    if ((lead.confidence_score || 0) < filter.minConfidence) return false;
    return true;
  });

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    
    try {
      const res = await fetch('/api/auth-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      const data = await res.json();
      
      if (data.authorized) {
        setAuthSuccess(true);
        localStorage.setItem('admin_auth', 'true');
        setTimeout(() => {
          setAuthorized(true);
        }, 800);
      } else {
        setAuthError(t('dashboard.auth.error'));
        setPassword("");
      }
    } catch {
      setAuthError(t('dashboard.auth.error'));
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
            {/* Glowing background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-xl"></div>
            
            <div className="relative">
              {/* Lock Icon */}
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-blue-500/10 border border-blue-400/30 flex items-center justify-center">
                  <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center mb-6">{t('dashboard.auth.title')}</h2>

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
                  <p className="text-green-400 font-medium">{t('dashboard.auth.success')}</p>
                </motion.div>
              ) : (
                <form onSubmit={handleAuth} className="space-y-4">
                  <div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('dashboard.auth.placeholder')}
                      className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                      autoFocus
                    />
                  </div>

                  {authError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-400 text-center"
                    >
                      {authError}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    className="w-full px-4 py-3 rounded-md bg-blue-500 text-white font-medium hover:bg-blue-600 transition-all cta-glow"
                  >
                    {t('dashboard.auth.button')}
                  </button>
                </form>
              )}
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
    <div className="min-h-screen p-8 bg-black text-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h1>
            <p className="text-white/60">
              {locale === 'fr' 
                ? 'Intelligence de leads en temps réel depuis Supabase'
                : 'Real-time lead intelligence from Supabase'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isLive && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-500/20 border border-green-500/40"
              >
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">{t('dashboard.liveUpdates')}</span>
              </motion.div>
            )}
            <a
              href={`/${locale}/dashboard/insights`}
              className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 transition-all duration-300 text-sm font-medium"
            >
              {locale === 'fr' ? '📊 Aperçus' : '📊 Insights'}
            </a>
            <button
              onClick={() => {
                clearTranslationCache();
                fetchLeads();
              }}
              className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 transition-all duration-300 text-sm font-medium"
            >
              {locale === 'fr' ? '🔄 Actualiser traductions' : '🔄 Refresh Translations'}
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('admin_auth');
                setAuthorized(false);
                setPassword("");
                setAuthError("");
              }}
              className="px-4 py-2 rounded-md bg-red-500/20 border border-red-400/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium"
            >
              {t('dashboard.auth.logout')}
            </button>
          </div>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:border-blue-400/30 transition-all">
            <div className="text-sm text-white/60 mb-1">{t('dashboard.stats.totalLeads')}</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:border-blue-400/30 transition-all">
            <div className="text-sm text-white/60 mb-1">{t('dashboard.stats.avgConfidence')}</div>
            <div className="text-3xl font-bold">{(stats.avgConfidence * 100).toFixed(0)}%</div>
          </div>
          <div className="rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:border-blue-400/30 transition-all">
            <div className="text-sm text-white/60 mb-1">{t('dashboard.stats.topIntent')}</div>
            <div className="text-xl font-semibold truncate">{stats.topIntent}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:border-blue-400/30 transition-all">
            <div className="text-sm text-white/60 mb-1">{t('dashboard.stats.highUrgency')}</div>
            <div className="text-3xl font-bold text-red-400">{stats.highUrgency}</div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <select
            value={filter.urgency}
            onChange={(e) => setFilter({ ...filter, urgency: e.target.value })}
            className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm hover:border-blue-400/40 transition-all"
          >
            <option value="all">{t('dashboard.filters.all')} {t('dashboard.filters.urgency')}</option>
            <option value="High">{t('dashboard.filters.high')}</option>
            <option value="Medium">{t('dashboard.filters.medium')}</option>
            <option value="Low">{t('dashboard.filters.low')}</option>
          </select>

          <select
            value={filter.language}
            onChange={(e) => setFilter({ ...filter, language: e.target.value })}
            className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm hover:border-blue-400/40 transition-all"
          >
            <option value="all">{t('dashboard.filters.all')} {t('dashboard.filters.language')}</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>

          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={filter.minConfidence}
              onChange={(e) => setFilter({ ...filter, minConfidence: parseFloat(e.target.value) })}
              className="flex-1"
            />
            <span className="text-sm text-white/60 whitespace-nowrap">
              {t('dashboard.filters.minConfidence')}: {(filter.minConfidence * 100).toFixed(0)}%
            </span>
          </div>
        </motion.div>

        {/* Leads Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-3"
        >
          {filteredLeads.map((lead, idx) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="rounded-lg border border-white/10 p-5 bg-white/5 hover:bg-white/10 hover:border-blue-400/30 transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-white/50 text-xs block mb-1">{t('dashboard.table.name')}</span>
                  <p className="font-semibold">{lead.name}</p>
                </div>
                <div>
                  <span className="text-white/50 text-xs block mb-1">{t('dashboard.table.email')}</span>
                  <p className="text-blue-400">{lead.email}</p>
                </div>
                <div>
                  <span className="text-white/50 text-xs block mb-1">{t('dashboard.table.language')}</span>
                  <p className="uppercase text-xs font-mono">{lead.language}</p>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="text-white/50 text-xs block mb-1">{t('dashboard.table.message')}</span>
                  <p className="text-white/80 italic">&quot;{lead.message}&quot;</p>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="text-white/50 text-xs block mb-1">{t('dashboard.table.summary')}</span>
                  <p className="text-white/90">
                    {lead.translated?.ai_summary || lead.ai_summary || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-white/50 text-xs block mb-1">{t('dashboard.table.intent')}</span>
                  <p className="text-blue-300 font-medium">
                    {lead.translated?.intent || lead.intent || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-white/50 text-xs block mb-1">{t('dashboard.table.tone')}</span>
                  <p>{lead.translated?.tone || lead.tone || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-white/50 text-xs block mb-1">{t('dashboard.table.urgency')}</span>
                  <p className={
                    ((lead.translated?.urgency || lead.urgency) === 'High' || (lead.translated?.urgency || lead.urgency) === 'Élevée') ? 'text-red-400 font-semibold' :
                    ((lead.translated?.urgency || lead.urgency) === 'Medium' || (lead.translated?.urgency || lead.urgency) === 'Moyenne') ? 'text-yellow-400' :
                    'text-green-400'
                  }>
                    {lead.translated?.urgency || lead.urgency || 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="text-white/50 text-xs block mb-1">{t('dashboard.table.confidence')}</span>
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
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="text-white/50 text-xs block mb-1">{t('dashboard.table.timestamp')}</span>
                  <p className="text-xs font-mono text-white/60">{new Date(lead.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredLeads.length === 0 && (
            <div className="text-center py-12 text-white/50">
              {t('dashboard.table.noResults')}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

