"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from "../../../lib/supabase";
import type { LeadMemoryRecord } from "../../../lib/supabase";
import PredictiveGrowthEngine from "../../../components/PredictiveGrowthEngine";
import GrowthCopilot from "../../../components/GrowthCopilot";
import ActivityLog from "../../../components/ActivityLog";
import RelationshipInsights from "../../../components/RelationshipInsights";
import type { LeadAction } from "../../api/lead-actions/route";

type TranslatedLead = LeadMemoryRecord & {
  translated_ai?: {
    ai_summary: string;
    intent: string;
    tone: string;
    urgency: string;
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
  const [recentActions, setRecentActions] = useState<LeadAction[]>([]);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);
  const [tagLead, setTagLead] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'deleted'>('active');
  const [tagFilter, setTagFilter] = useState<string>('all');

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
    fetchRecentActions();
    
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

  // Re-fetch leads when locale changes (server-side translation)
  useEffect(() => {
    if (!authorized) return;
    console.log(`[Dashboard] Locale changed to: ${locale} - re-fetching with server translation`);
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  // Re-fetch leads when tab changes
  useEffect(() => {
    if (!authorized) return;
    console.log(`[Dashboard] Tab changed to: ${activeTab} - re-fetching leads`);
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function fetchLeads() {
    try {
      setLoading(true);
      let endpoint = '';
      switch (activeTab) {
        case 'active':
          endpoint = `/api/leads?limit=100&locale=${locale}`;
          break;
        case 'archived':
          endpoint = `/api/leads/archived?limit=100&locale=${locale}`;
          break;
        case 'deleted':
          endpoint = `/api/leads/deleted?limit=100&locale=${locale}`;
          break;
      }
      
      console.log(`[Dashboard] Fetching ${activeTab} leads...`);
      const res = await fetch(endpoint, { cache: 'no-store' });
      const json = await res.json();
      
      if (json.success) {
        const leadsData = json.data || [];
        setLeads(leadsData);
        calculateStats(leadsData);
        console.log(`[Dashboard] Loaded ${leadsData.length} ${activeTab} leads`);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }

  // Intent translation mapping (French → English)
  const intentTranslations: Record<string, string> = {
    'annulation d\'intérêt': 'interest withdrawn',
    'retrait d\'intérêt': 'interest withdrawn',
    'intérêt retiré': 'interest withdrawn',
    'annulation': 'cancellation',
    'consultation': 'consultation',
    'partenariat': 'partnership',
    'demande d\'information': 'information request',
    'demande': 'request',
    'support technique': 'technical support',
    'ventes': 'sales',
    'entreprise': 'enterprise',
    'intégration': 'integration',
    'automatisation': 'automation',
    'collaboration': 'collaboration',
    'exploration': 'exploration',
    'optimisation': 'optimization',
    'mise à l\'échelle': 'scaling',
    'développement': 'development',
  };

  function translateIntent(intent: string): string {
    // If English dashboard and intent looks French, translate it
    if (locale === 'en') {
      const intentLower = intent.toLowerCase();
      
      // Check for exact matches first
      if (intentTranslations[intentLower]) {
        const translated = intentTranslations[intentLower];
        const capitalized = translated.charAt(0).toUpperCase() + translated.slice(1);
        console.log(`[Dashboard] Intent translation: "${intent}" → "${capitalized}"`);
        return capitalized;
      }
      
      // Check for partial matches
      for (const [fr, en] of Object.entries(intentTranslations)) {
        if (intentLower.includes(fr)) {
          const capitalized = en.charAt(0).toUpperCase() + en.slice(1);
          console.log(`[Dashboard] Intent translation (partial): "${intent}" → "${capitalized}"`);
          return capitalized;
        }
      }
    }
    
    // Return as-is if French dashboard or no translation found
    return intent;
  }

  function calculateStats(leadsData: TranslatedLead[]) {
    const total = leadsData.length;
    const avgConfidence = leadsData.reduce((sum, l) => sum + (l.confidence_score || 0), 0) / total || 0;
    const highUrgency = leadsData.filter(l => 
      (l.translated_ai?.urgency || l.urgency) === 'High' || 
      (l.translated_ai?.urgency || l.urgency) === 'Élevée'
    ).length;
    const intentCounts: Record<string, number> = {};
    leadsData.forEach(l => {
      if (l.intent) {
        intentCounts[l.intent] = (intentCounts[l.intent] || 0) + 1;
      }
    });
    const rawTopIntent = Object.keys(intentCounts).sort((a, b) => intentCounts[b] - intentCounts[a])[0] || 'N/A';
    const topIntent = translateIntent(rawTopIntent);
    
    console.log('[Dashboard] Stats calculated:', {
      total,
      avgConfidence: (avgConfidence * 100).toFixed(0) + '%',
      rawTopIntent,
      translatedTopIntent: topIntent,
      highUrgency,
      locale,
    });
    
    setStats({ total, avgConfidence, topIntent, highUrgency });
  }

  const filteredLeads = leads.filter(lead => {
    const urgency = lead.translated_ai?.urgency || lead.urgency;
    if (filter.urgency !== 'all' && urgency !== filter.urgency) return false;
    if (filter.language !== 'all' && lead.language !== filter.language) return false;
    if ((lead.confidence_score || 0) < filter.minConfidence) return false;
    if (tagFilter !== 'all' && lead.current_tag !== tagFilter) return false;
    return true;
  });

  const tagOptions = locale === 'fr' 
    ? ['Contacté', 'Haute Valeur', 'Non Qualifié', 'Suivi']
    : ['Contacted', 'High Value', 'Not Qualified', 'Follow-Up'];

  async function fetchRecentActions() {
    try {
      const res = await fetch('/api/lead-actions?limit=5');
      const json = await res.json();
      if (json.success) {
        setRecentActions(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch actions:', err);
    }
  }

  function showToast(message: string) {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  }

  async function handleDeleteLead(leadId: string) {
    try {
      console.log(`[LeadAction] Deleting lead ${leadId}...`);
      
      // Optimistic update - remove from UI immediately
      const originalLeads = [...leads];
      setLeads(leads.filter(l => l.id !== leadId));
      setConfirmDelete(null);

      const res = await fetch('/api/lead-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, action: 'delete' }),
      });

      const json = await res.json();
      console.log(`[LeadAction] Delete response:`, json);

      if (json.success) {
        console.log(`[LeadAction] Deleted lead ${leadId}`);
        showToast(locale === 'fr' ? 'Lead supprimé avec succès.' : 'Lead deleted successfully.');
        fetchRecentActions();
      } else {
        // Revert on failure
        console.error(`[LeadAction] Failed to delete lead ${leadId}:`, json.message || json.error);
        setLeads(originalLeads);
        showToast(locale === 'fr' ? `Erreur: ${json.message || 'Suppression échouée'}` : `Error: ${json.message || 'Delete failed'}`);
      }
    } catch (err) {
      console.error(`[LeadAction] Error deleting lead ${leadId}:`, err);
      showToast(locale === 'fr' ? 'Erreur lors de la suppression.' : 'Delete failed.');
    }
  }

  async function handleArchiveLead(leadId: string) {
    try {
      console.log(`[LeadAction] Archiving lead ${leadId}...`);
      
      // Optimistic update - remove from UI immediately
      const originalLeads = [...leads];
      setLeads(leads.filter(l => l.id !== leadId));

      const res = await fetch('/api/lead-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, action: 'archive' }),
      });

      const json = await res.json();
      console.log(`[LeadAction] Archive response:`, json);

      if (json.success) {
        console.log(`[LeadAction] Archived lead ${leadId}`);
        showToast(locale === 'fr' ? 'Lead archivé avec succès.' : 'Lead archived successfully.');
        fetchRecentActions();
      } else {
        // Revert on failure
        console.error(`[LeadAction] Failed to archive lead ${leadId}:`, json.message || json.error);
        setLeads(originalLeads);
        showToast(locale === 'fr' ? `Erreur: ${json.message || 'Archivage échoué'}` : `Error: ${json.message || 'Archive failed'}`);
      }
    } catch (err) {
      console.error(`[LeadAction] Error archiving lead ${leadId}:`, err);
      showToast(locale === 'fr' ? 'Erreur lors de l\'archivage.' : 'Archive failed.');
    }
  }

  async function handleTagLead() {
    if (!tagLead || !selectedTag) return;

    try {
      console.log(`[LeadAction] Tagging lead ${tagLead} as ${selectedTag}...`);

      const res = await fetch('/api/lead-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: tagLead, action: 'tag', tag: selectedTag }),
      });

      const json = await res.json();
      console.log(`[LeadAction] Tag response:`, json);

      if (json.success) {
        console.log(`[LeadAction] Tagged lead ${tagLead} as ${selectedTag}`);
        setTagLead(null);
        setSelectedTag('');
        showToast(locale === 'fr' ? `Lead étiqueté comme "${selectedTag}" avec succès.` : `Lead tagged as "${selectedTag}" successfully.`);
        fetchLeads(); // Refresh to show tag badge
        fetchRecentActions();
      } else {
        console.error(`[LeadAction] Failed to tag lead ${tagLead}:`, json.message || json.error);
        showToast(locale === 'fr' ? `Erreur: ${json.message || 'Étiquetage échoué'}` : `Error: ${json.message || 'Tag failed'}`);
      }
    } catch (err) {
      console.error(`[LeadAction] Error tagging lead ${tagLead}:`, err);
      showToast(locale === 'fr' ? 'Erreur lors de l\'étiquetage.' : 'Tag failed.');
    }
  }

  async function handleReactivate(leadId: string) {
    try {
      console.log(`[LeadAction] Reactivating lead ${leadId}...`);

      const res = await fetch('/api/lead-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, action: 'reactivate' }),
      });

      const json = await res.json();
      console.log(`[LeadAction] Reactivate response:`, json);

      if (json.success) {
        console.log(`[LeadAction] Reactivated lead ${leadId}`);
        setLeads(leads.filter(l => l.id !== leadId)); // Remove from current view
        showToast(locale === 'fr' ? 'Lead réactivé avec succès.' : 'Lead reactivated successfully.');
        fetchRecentActions();
      } else {
        console.error(`[LeadAction] Failed to reactivate lead ${leadId}:`, json.message || json.error);
        showToast(locale === 'fr' ? `Erreur: ${json.message || 'Réactivation échouée'}` : `Error: ${json.message || 'Reactivate failed'}`);
      }
    } catch (err) {
      console.error(`[LeadAction] Error reactivating lead ${leadId}:`, err);
      showToast(locale === 'fr' ? 'Erreur lors de la réactivation.' : 'Reactivate failed.');
    }
  }

  async function handlePermanentDelete(leadId: string) {
    try {
      console.log(`[LeadAction] PERMANENTLY deleting lead ${leadId}...`);
      
      // Optimistic update - remove from UI immediately
      const originalLeads = [...leads];
      setLeads(leads.filter(l => l.id !== leadId));
      setConfirmPermanentDelete(null);

      const res = await fetch('/api/lead-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, action: 'permanent_delete' }),
      });

      const json = await res.json();
      console.log(`[LeadAction] Permanent delete response:`, json);

      if (json.success) {
        console.log(`[LeadAction] Permanently deleted lead ${leadId}`);
        showToast(locale === 'fr' ? 'Lead supprimé définitivement.' : 'Lead permanently deleted.');
        // Don't fetch recent actions since the record is gone
      } else {
        // Revert on failure
        console.error(`[LeadAction] Failed to permanently delete lead ${leadId}:`, json.message || json.error);
        setLeads(originalLeads);
        showToast(locale === 'fr' ? `Erreur: ${json.message || 'Suppression définitive échouée'}` : `Error: ${json.message || 'Permanent delete failed'}`);
      }
    } catch (err) {
      console.error(`[LeadAction] Error permanently deleting lead ${leadId}:`, err);
      showToast(locale === 'fr' ? 'Erreur lors de la suppression définitive.' : 'Permanent delete failed.');
    }
  }

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

  const getTagBadgeColor = (tag: string | null | undefined) => {
    if (!tag) return '';
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('contact')) return 'bg-blue-500/20 border-blue-500/40 text-blue-300';
    if (tagLower.includes('high') || tagLower.includes('haute')) return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300';
    if (tagLower.includes('not') || tagLower.includes('non')) return 'bg-gray-500/20 border-gray-500/40 text-gray-300';
    if (tagLower.includes('follow') || tagLower.includes('suivi')) return 'bg-purple-500/20 border-purple-500/40 text-purple-300';
    return 'bg-white/10 border-white/20 text-white/60';
  };

  const toneTranslations: Record<string, string> = {
    'formal': 'formel',
    'inquisitive': 'curieux',
    'neutral': 'neutre',
    'friendly': 'amical',
    'impatient': 'impatient',
    'professional': 'professionnel',
    'casual': 'décontracté',
    'urgent': 'urgent',
    'confident': 'confiant',
    'hesitant': 'hésitant',
    'strategic': 'stratégique',
    'curious': 'curieux',
    'polite': 'poli',
    'direct': 'direct',
  };

  const translateTone = (tone: string | null | undefined): string => {
    if (!tone) return 'N/A';
    
    // If French dashboard, translate English tones
    if (locale === 'fr') {
      const toneLower = tone.toLowerCase();
      const translated = toneTranslations[toneLower];
      
      if (translated) {
        console.log(`[LeadCard] French tone translation applied: ${tone} → ${translated}`);
        return translated.charAt(0).toUpperCase() + translated.slice(1); // Capitalize first letter
      }
      
      // If already in French or no mapping, return as-is
      return tone;
    }
    
    // English dashboard - return as-is
    return tone;
  };

  const tabLabels = {
    active: locale === 'fr' ? 'Leads Actifs' : 'Active Leads',
    archived: locale === 'fr' ? 'Leads Archivés' : 'Archived Leads',
    deleted: locale === 'fr' ? 'Leads Supprimés' : 'Deleted Leads',
  };

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

        {/* View Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-6 flex gap-2 border-b border-white/10"
        >
          {(['active', 'archived', 'deleted'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                  : 'border-transparent text-white/60 hover:text-white/80'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
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

          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm hover:border-blue-400/40 transition-all"
          >
            <option value="all">{locale === 'fr' ? 'Tous les tags' : 'All Tags'}</option>
            {tagOptions.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
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

        {/* Predictive Growth Engine */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8"
        >
          <PredictiveGrowthEngine locale={locale} clientId={null} />
        </motion.div>

        {/* Relationship Insights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mb-8"
        >
          <RelationshipInsights locale={locale} />
        </motion.div>

        {/* Leads Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
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
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{lead.name}</p>
                    {lead.current_tag && (
                      <span className={`px-2 py-1 text-xs rounded border ${getTagBadgeColor(lead.current_tag)}`}>
                        {lead.current_tag}
                      </span>
                    )}
                  </div>
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
                    {lead.translated_ai?.ai_summary || lead.ai_summary || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-white/50 text-xs block mb-1">{t('dashboard.table.intent')}</span>
                  <p className="text-blue-300 font-medium">
                    {lead.translated_ai?.intent || lead.intent || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-white/50 text-xs block mb-1">{t('dashboard.table.tone')}</span>
                  <p>{translateTone(lead.translated_ai?.tone || lead.tone)}</p>
                </div>
                <div>
                  <span className="text-white/50 text-xs block mb-1">{t('dashboard.table.urgency')}</span>
                  <p className={
                    ((lead.translated_ai?.urgency || lead.urgency) === 'High' || (lead.translated_ai?.urgency || lead.urgency) === 'Élevée') ? 'text-red-400 font-semibold' :
                    ((lead.translated_ai?.urgency || lead.urgency) === 'Medium' || (lead.translated_ai?.urgency || lead.urgency) === 'Moyenne') ? 'text-yellow-400' :
                    'text-green-400'
                  }>
                    {lead.translated_ai?.urgency || lead.urgency || 'N/A'}
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

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                {activeTab === 'active' ? (
                  <>
                    {/* Tag Button */}
                    <div className="relative group">
                      <button
                        onClick={() => setTagLead(lead.id)}
                        className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:border-blue-500/60 transition-all duration-100 text-xs"
                      >
                        🏷️
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-blue-600 text-white text-[0.9rem] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-150 whitespace-nowrap pointer-events-none z-10">
                        {locale === 'fr' ? 'Étiqueter le lead' : 'Tag Lead'}
                      </span>
                    </div>
                    {/* Archive Button */}
                    <div className="relative group">
                      <button
                        onClick={() => handleArchiveLead(lead.id)}
                        className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/30 hover:shadow-[0_0_15px_rgba(234,179,8,0.5)] hover:border-yellow-500/60 transition-all duration-100 text-xs"
                      >
                        📦
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-yellow-600 text-white text-[0.9rem] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-150 whitespace-nowrap pointer-events-none z-10">
                        {locale === 'fr' ? 'Archiver' : 'Archive'}
                      </span>
                    </div>
                    {/* Delete Button */}
                    <div className="relative group">
                      <button
                        onClick={() => setConfirmDelete(lead.id)}
                        className="p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:border-red-500/60 transition-all duration-100 text-xs"
                      >
                        🗑️
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-red-600 text-white text-[0.9rem] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-150 whitespace-nowrap pointer-events-none z-10">
                        {locale === 'fr' ? 'Supprimer' : 'Delete'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Reactivate Button */}
                    <div className="relative group">
                      <button
                        onClick={() => handleReactivate(lead.id)}
                        className="p-2 rounded-lg bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:border-green-500/60 transition-all duration-100 text-xs"
                      >
                        🔄
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-green-600 text-white text-[0.9rem] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-150 whitespace-nowrap pointer-events-none z-10">
                        {locale === 'fr' ? 'Réactiver' : 'Reactivate'}
                      </span>
                    </div>
                    {/* Permanent Delete Button (only in deleted tab) */}
                    {activeTab === 'deleted' && (
                      <div className="relative group">
                        <button
                          onClick={() => setConfirmPermanentDelete(lead.id)}
                          className="p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:border-red-500/60 transition-all duration-100 text-xs"
                        >
                          ❌
                        </button>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-red-600 text-white text-[0.9rem] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-150 whitespace-nowrap pointer-events-none z-10">
                          {locale === 'fr' ? 'Supprimer définitivement' : 'Delete Permanently'}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ))}

          {filteredLeads.length === 0 && (
            <div className="text-center py-12 text-white/50">
              {t('dashboard.table.noResults')}
            </div>
          )}
        </motion.div>

        {/* Activity Log */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8"
        >
          <ActivityLog actions={recentActions} locale={locale} />
        </motion.div>
      </div>

      {/* Delete Confirmation Modal (Soft Delete) */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-black border border-white/10 rounded-lg p-6 max-w-md w-full shadow-[0_0_30px_rgba(239,68,68,0.3)]"
          >
            <h3 className="text-lg font-bold text-white mb-4">
              {locale === 'fr' ? 'Confirmer la suppression' : 'Confirm Delete'}
            </h3>
            <p className="text-white/70 mb-6">
              {locale === 'fr' 
                ? 'Êtes-vous sûr de vouloir supprimer ce lead ? Vous pourrez le récupérer plus tard depuis l\'onglet Leads supprimés.'
                : 'Are you sure you want to delete this lead? You can recover it later from the Deleted Leads tab.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteLead(confirmDelete)}
                className="flex-1 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 transition-all font-medium"
              >
                {locale === 'fr' ? 'Supprimer' : 'Delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {confirmPermanentDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-black border border-red-500/30 rounded-lg p-6 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.5)]"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-400">
                {locale === 'fr' ? 'Suppression définitive' : 'Permanent Delete'}
              </h3>
            </div>
            <p className="text-white/70 mb-6">
              {locale === 'fr' 
                ? 'Êtes-vous sûr de vouloir supprimer définitivement ce lead ? Cette action est irréversible.'
                : 'Are you sure you want to permanently delete this lead? This action cannot be undone.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handlePermanentDelete(confirmPermanentDelete)}
                className="flex-1 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 transition-all font-medium shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                {locale === 'fr' ? 'Supprimer définitivement' : 'Delete Permanently'}
              </button>
              <button
                onClick={() => setConfirmPermanentDelete(null)}
                className="flex-1 py-2 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tag Modal */}
      {tagLead && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-black border border-white/10 rounded-lg p-6 max-w-md w-full shadow-[0_0_30px_rgba(59,130,246,0.3)]"
          >
            <h3 className="text-lg font-bold text-white mb-4">
              {locale === 'fr' ? 'Étiqueter le lead' : 'Tag Lead'}
            </h3>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-400/50 focus:outline-none mb-6 text-white"
            >
              <option value="">{locale === 'fr' ? 'Sélectionner une étiquette' : 'Select a tag'}</option>
              {tagOptions.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={handleTagLead}
                disabled={!selectedTag}
                className="flex-1 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {locale === 'fr' ? 'Étiqueter' : 'Tag'}
              </button>
              <button
                onClick={() => {
                  setTagLead(null);
                  setSelectedTag('');
                }}
                className="flex-1 py-2 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-8 right-8 z-50 px-6 py-3 rounded-lg bg-green-600 border border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)]"
        >
          <p className="text-white font-medium">{toast.message}</p>
        </motion.div>
      )}

      {/* Growth Copilot */}
      <GrowthCopilot locale={locale} />
    </div>
  );
}

