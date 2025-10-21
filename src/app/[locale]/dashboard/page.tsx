"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import UniversalLanguageToggle from "../../../components/UniversalLanguageToggle";
import { supabase } from "../../../lib/supabase";
import type { LeadMemoryRecord } from "../../../lib/supabase";
import type { LeadAction } from "../../api/lead-actions/route";
import FallbackUI, { LoadingFallback, ErrorFallback, OfflineFallback } from "../../../components/FallbackUI";
import { LeadNotes } from "../../../components/dashboard";

// Safe locale detection fallback
function getSafeLocale(): string {
  if (typeof window === 'undefined') return 'en';
  
  try {
    // Try to get locale from URL path
    const pathname = window.location.pathname;
    const localeMatch = pathname.match(/^\/([a-z]{2})\//);
    if (localeMatch && ['en', 'fr'].includes(localeMatch[1])) {
      return localeMatch[1];
    }
    
    // Fallback to localStorage
    const storedLocale = localStorage.getItem('avenir_language');
    if (storedLocale && ['en', 'fr'].includes(storedLocale)) {
      return storedLocale;
    }
    
    // Fallback to browser language
    const browserLang = navigator.language.split('-')[0];
    if (['en', 'fr'].includes(browserLang)) {
      return browserLang;
    }
  } catch (error) {
    console.warn('[Dashboard] Error detecting locale:', error);
  }
  
  return 'en'; // Ultimate fallback
}

// Dynamic imports to prevent hydration mismatches
const PredictiveGrowthEngine = dynamic(() => import("../../../components/PredictiveGrowthEngine"), { 
  ssr: false,
  loading: () => <LoadingFallback message="Loading growth engine..." />
});
const GrowthCopilot = dynamic(() => import("../../../components/GrowthCopilot"), { 
  ssr: false,
  loading: () => <LoadingFallback message="Loading copilot..." />
});
const ActivityLog = dynamic(() => import("../../../components/ActivityLog"), { 
  ssr: false,
  loading: () => <LoadingFallback message="Loading activities..." />
});
const RelationshipInsights = dynamic(() => import("../../../components/RelationshipInsights"), { 
  ssr: false,
  loading: () => <LoadingFallback message="Loading insights..." />
});

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
  
  // Safe locale fallback for client-side operations
  const safeLocale = typeof window !== 'undefined' ? getSafeLocale() : locale;
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
  const [isTagging, setIsTagging] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'deleted' | 'converted'>('active');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [revertLead, setRevertLead] = useState<string | null>(null);
  const [reversionReason, setReversionReason] = useState<'accident' | 'other'>('accident');
  const [customReversionReason, setCustomReversionReason] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [clients, setClients] = useState<{ business_name: string; client_id: string; language: string }[]>([]);
  const [commandCenterMetrics, setCommandCenterMetrics] = useState({
    total: 0,
    active: 0,
    converted: 0,
    archived: 0,
    deleted: 0
  });
  const [isOffline, setIsOffline] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Pagination state for leads
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage] = useState(5);

  // Check localStorage for existing auth
  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_auth');
    if (savedAuth === 'true') {
      setAuthorized(true);
    }
  }, []);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial state
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!authorized) return;
    
    console.log('[DashboardSync] ============================================');
    console.log('[DashboardSync] Dashboard Type: ADMIN');
    console.log('[DashboardSync] Client ID: null (global aggregation)');
    console.log('[DashboardSync] Data Source: all leads (admin mode)');
    console.log('[DashboardSync] Components Loading:');
    console.log('[DashboardSync]   ✅ PredictiveGrowthEngine (global)');
    console.log('[DashboardSync]   ✅ RelationshipInsights (global)');
    console.log('[DashboardSync]   ✅ GrowthCopilot (global)');
    console.log('[DashboardSync]   ✅ ActivityLog (global)');
    console.log('[DashboardSync] ============================================');
    
    fetchClients();
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

  // Re-fetch leads when client filter changes
  useEffect(() => {
    if (!authorized) return;
    console.log(`[CommandCenter] Client filter changed to: ${selectedClientId}`);
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

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

  async function fetchClients() {
    try {
      console.log('[CommandCenter] ============================================');
      console.log('[CommandCenter] Fetching client list from Supabase...');
      console.log('[CommandCenter] Using: Service Role Key (bypasses RLS)');
      console.log('[CommandCenter] Table: clients');
      console.log('[CommandCenter] Fields: client_id, business_name, language');
      
      // Fetch clients from API endpoint (which uses service role key)
      const res = await fetch('/api/clients');
      const json = await res.json();
      
      if (!json.success) {
        console.error('[CommandCenter] ❌ API fetch error:', json.error);
        console.error('[CommandCenter] Full error response:', JSON.stringify(json, null, 2));
        console.log('[CommandCenter] ============================================');
        return;
      }
      
      const data = json.data || [];
      
      console.log('[CommandCenter] ✅ Loaded', data?.length || 0, 'clients:', data);
      
      if (data && data.length > 0) {
        console.log('[CommandCenter] ============================================');
        console.log('[CommandCenter] Client Details:');
        data.forEach((client: { business_name: string; client_id: string; language: string }, idx: number) => {
          console.log(`[CommandCenter]   ${idx + 1}. ${client.business_name || 'Unnamed Client'}`);
          console.log(`[CommandCenter]      client_id: ${client.client_id}`);
          console.log(`[CommandCenter]      language: ${client.language || 'en'}`);
        });
      } else {
        console.log('[CommandCenter] ⚠️ No clients found in database');
      }
      
      setClients(data || []);
      console.log('[CommandCenter] ✅ Client state updated with', data?.length || 0, 'records');
      console.log('[CommandCenter] ============================================');
    } catch (err) {
      console.error('[CommandCenter] ❌ Failed to fetch clients:', err);
      console.error('[CommandCenter] Exception details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : 'No stack trace'
      });
      console.log('[CommandCenter] ============================================');
    }
  }

  async function fetchLeads() {
    try {
      setLoading(true);
      setHasError(false);
      
      // Check if offline
      if (isOffline) {
        console.warn('[Dashboard] Offline - skipping fetch');
        return;
      }
      
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
        case 'converted':
          endpoint = `/api/leads?limit=100&locale=${locale}&converted=true`;
          break;
      }
      
      // Add client filter if selected
      if (selectedClientId !== 'all') {
        endpoint += `&clientId=${selectedClientId}`;
      }
      
      console.log(`[Dashboard] Fetching ${activeTab} leads...`);
      console.log(`[Dashboard] Endpoint: ${endpoint}`);
      
      const res = await fetch(endpoint, { 
        cache: 'no-store',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.json();
      
      if (json.success) {
        let leadsData = json.data || [];
        
        console.log(`[Dashboard] API returned ${leadsData.length} leads`);
        
        // For converted tab, filter only converted leads
        if (activeTab === 'converted') {
          leadsData = leadsData.filter((lead: TranslatedLead) => 
            lead.current_tag === 'Converted' || lead.current_tag === 'Converti'
          );
          console.log(`[Dashboard] After converted filter: ${leadsData.length} leads`);
        }
        
        setLeads(leadsData);
        calculateStats(leadsData);
        calculateCommandCenterMetrics(leadsData);
        console.log(`[Dashboard] ✅ Loaded ${leadsData.length} ${activeTab} leads`);
      } else {
        throw new Error(json.error || 'Failed to fetch leads');
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
      setHasError(true);
      
      // Show user-friendly error message
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          showToast(safeLocale === 'fr' ? 'Délai d\'attente dépassé' : 'Request timeout');
        } else if (err.message.includes('Failed to fetch')) {
          showToast(safeLocale === 'fr' ? 'Erreur de connexion' : 'Connection error');
        } else {
          showToast(safeLocale === 'fr' ? 'Erreur lors du chargement' : 'Loading error');
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function calculateCommandCenterMetrics(allLeads: TranslatedLead[]) {
    const total = allLeads.length;
    const active = allLeads.filter(l => !l.archived && !l.deleted && l.current_tag !== 'Converted' && l.current_tag !== 'Converti').length;
    const converted = allLeads.filter(l => l.current_tag === 'Converted' || l.current_tag === 'Converti').length;
    const archived = allLeads.filter(l => l.archived && !l.deleted).length;
    const deleted = allLeads.filter(l => l.deleted).length;
    
    setCommandCenterMetrics({ total, active, converted, archived, deleted });
    console.log('[CommandCenter] Metrics:', { total, active, converted, archived, deleted });
  }

  // Intent translation mapping (French → English)
  const intentTranslations: Record<string, string> = {
    'annulation d\'intérêt': 'interest withdrawn',
    'retrait d\'intérêt': 'interest withdrawn',
    'intérêt retiré': 'interest withdrawn',
    'abandon de la relation commerciale': 'business relationship withdrawal',
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
      const intentLower = intent.toLowerCase().trim();
      
      // Check for exact matches first
      if (intentTranslations[intentLower]) {
        const translated = intentTranslations[intentLower];
        const capitalized = translated.charAt(0).toUpperCase() + translated.slice(1);
        console.log(`[DashboardTranslation] locale: en | intent: "${intent}" → "${capitalized}"`);
        return capitalized;
      }
      
      // Check for partial matches
      for (const [fr, en] of Object.entries(intentTranslations)) {
        if (intentLower.includes(fr)) {
          const capitalized = en.charAt(0).toUpperCase() + en.slice(1);
          console.log(`[DashboardTranslation] locale: en | intent (partial match): "${intent}" → "${capitalized}"`);
          return capitalized;
        }
      }
      
      // No translation found - log and return as-is
      console.log(`[DashboardTranslation] locale: en | intent (no translation): "${intent}"`);
      return intent;
    }
    
    // French dashboard - capitalize first letter
    if (locale === 'fr' && intent) {
      const capitalized = intent.charAt(0).toUpperCase() + intent.slice(1);
      console.log(`[DashboardTranslation] locale: fr | intent: "${capitalized}"`);
      return capitalized;
    }
    
    // Return as-is
    console.log(`[DashboardTranslation] locale: ${locale} | intent: "${intent}"`);
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
    console.log(`[DashboardTranslation] Top Intent - locale: ${locale} | raw: "${rawTopIntent}" | translated: "${topIntent}"`);
    
    setStats({ total, avgConfidence, topIntent, highUrgency });
  }

  const filteredLeads = leads.filter(lead => {
    // For converted tab, only show converted leads
    const isConverted = lead.current_tag === 'Converted' || lead.current_tag === 'Converti';
    if (activeTab === 'converted' && !isConverted) return false;
    
    // Exclude converted leads from Active and Archived tabs
    if (activeTab === 'active' && isConverted) return false;
    if (activeTab === 'archived' && isConverted) return false;
    
    const urgency = lead.translated_ai?.urgency || lead.urgency;
    if (filter.urgency !== 'all' && urgency !== filter.urgency) return false;
    if (filter.language !== 'all' && lead.language !== filter.language) return false;
    if ((lead.confidence_score || 0) < filter.minConfidence) return false;
    if (tagFilter !== 'all' && lead.current_tag !== tagFilter) return false;
    return true;
  });

  // Pagination functions
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const startIndex = (currentPage - 1) * leadsPerPage;
  const endIndex = startIndex + leadsPerPage;
  const currentLeads = filteredLeads.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filter, tagFilter, selectedClientId]);

  const tagOptions = locale === 'fr' 
    ? ['Contacté', 'Haute Valeur', 'Non Qualifié', 'Suivi', 'Converti']
    : ['Contacted', 'High Value', 'Not Qualified', 'Follow-Up', 'Converted'];

  async function fetchRecentActions() {
    try {
      const res = await fetch(`/api/lead-actions?limit=5&locale=${locale}`);
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
      setIsTagging(true);
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
        
        // Small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setTagLead(null);
        setSelectedTag('');
        setIsTagging(false);
        showToast(locale === 'fr' ? `Lead étiqueté comme "${selectedTag}" avec succès.` : `Lead tagged as "${selectedTag}" successfully.`);
        fetchLeads(); // Refresh to show tag badge
        fetchRecentActions();
      } else {
        setIsTagging(false);
        console.error(`[LeadAction] Failed to tag lead ${tagLead}:`, json.message || json.error);
        showToast(locale === 'fr' ? `Erreur: ${json.message || 'Étiquetage échoué'}` : `Error: ${json.message || 'Tag failed'}`);
      }
    } catch (err) {
      setIsTagging(false);
      console.error(`[LeadAction] Error tagging lead ${tagLead}:`, err);
      showToast(locale === 'fr' ? 'Erreur lors de l\'étiquetage.' : 'Tag failed.');
    }
  }

  async function handleRevertToActive() {
    if (!revertLead) return;

    try {
      const reasonText = reversionReason === 'accident' 
        ? (locale === 'fr' ? 'Placé dans convertis par erreur' : 'Placed in converted by accident')
        : `${locale === 'fr' ? 'Autre' : 'Other'}: ${customReversionReason}`;

      console.log(`[LeadAction] 🔄 Reverting converted lead ${revertLead} to active...`);
      console.log(`[LeadAction] Reversion reason: ${reasonText}`);

      // First, update the tag back to active
      const tagRes = await fetch('/api/lead-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lead_id: revertLead, 
          action: 'tag', 
          tag: locale === 'fr' ? 'Actif' : 'Active',
          reversion_reason: reasonText,
          is_reversion: true
        }),
      });

      const tagJson = await tagRes.json();
      console.log(`[LeadAction] Reversion tag response:`, tagJson);

      if (tagJson.success) {
        console.log(`[LeadAction] ✅ Lead reverted to active successfully`);
        setRevertLead(null);
        setReversionReason('accident');
        setCustomReversionReason('');
        showToast(
          locale === 'fr' 
            ? 'Lead remis en actif avec succès.' 
            : 'Lead returned to active successfully.'
        );
        fetchLeads();
        fetchRecentActions();
      } else {
        console.error(`[LeadAction] Failed to revert lead:`, tagJson.message || tagJson.error);
        showToast(
          locale === 'fr' 
            ? `Erreur: ${tagJson.message || 'Échec du retour'}` 
            : `Error: ${tagJson.message || 'Reversion failed'}`
        );
      }
    } catch (err) {
      console.error(`[LeadAction] Error reverting lead:`, err);
      showToast(locale === 'fr' ? 'Erreur lors du retour.' : 'Reversion failed.');
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
    converted: locale === 'fr' ? 'Leads Convertis' : 'Converted Leads',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <UniversalLanguageToggle />
        <div className="max-w-7xl mx-auto p-8">
          <LoadingFallback 
            message={safeLocale === 'fr' ? 'Chargement du tableau de bord...' : 'Loading dashboard...'} 
            className="min-h-[60vh]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      {/* Universal Language Toggle */}
      <UniversalLanguageToggle />
      
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
                ? 'Tableau d\'intelligence en temps réel'
                : 'Real-time lead intelligence dashboard'}
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
            <a
              href={`/${locale}/dashboard/outreach`}
              className="px-4 py-2 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-400 hover:bg-orange-500/30 transition-all duration-300 text-sm font-medium"
            >
              📧 {locale === 'fr' ? 'Prospection' : 'Outreach'}
            </a>
            <a
              href={`/${locale}/admin/prospect-intelligence`}
              className="px-4 py-2 rounded-lg bg-pink-500/20 border border-pink-500/40 text-pink-400 hover:bg-pink-500/30 transition-all duration-300 text-sm font-medium"
            >
              {locale === 'fr' ? '🧠 Intelligence' : '🧠 Intelligence'}
            </a>
            <a
              href={`/${locale}/admin/settings`}
              className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 transition-all duration-300 text-sm font-medium"
            >
              ⚙️ {locale === 'fr' ? 'Paramètres' : 'Settings'}
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

        {/* Command Center: Client Filter & Metrics Summary */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6"
        >
          <div className="rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-900/10 via-blue-900/10 to-purple-900/10 p-4 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Client Filter */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎛️</span>
                  <label className="text-sm font-medium text-white/80">
                    {locale === 'fr' ? 'Filtre Client' : 'Client Filter'}:
                  </label>
                </div>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white hover:border-purple-400/50 focus:border-purple-400/70 focus:outline-none transition-all min-w-[200px]"
                >
                  <option value="all">
                    {locale === 'fr' ? '🌐 Tous les Clients' : '🌐 All Clients'}
                  </option>
                  {clients.map(client => (
                    <option key={client.client_id} value={client.client_id}>
                      {client.business_name || client.client_id.substring(0, 12)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Metrics Summary Bar */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <span className="text-lg">📊</span>
                  <div className="text-xs">
                    <div className="text-white/50">{locale === 'fr' ? 'Total' : 'Total'}</div>
                    <div className="text-lg font-bold text-blue-400">{commandCenterMetrics.total}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-lg">✅</span>
                  <div className="text-xs">
                    <div className="text-white/50">{locale === 'fr' ? 'Actifs' : 'Active'}</div>
                    <div className="text-lg font-bold text-green-400">{commandCenterMetrics.active}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-lg">🎯</span>
                  <div className="text-xs">
                    <div className="text-white/50">{locale === 'fr' ? 'Convertis' : 'Converted'}</div>
                    <div className="text-lg font-bold text-emerald-400">{commandCenterMetrics.converted}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <span className="text-lg">📦</span>
                  <div className="text-xs">
                    <div className="text-white/50">{locale === 'fr' ? 'Archivés' : 'Archived'}</div>
                    <div className="text-lg font-bold text-yellow-400">{commandCenterMetrics.archived}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="text-lg">🗑️</span>
                  <div className="text-xs">
                    <div className="text-white/50">{locale === 'fr' ? 'Supprimés' : 'Deleted'}</div>
                    <div className="text-lg font-bold text-red-400">{commandCenterMetrics.deleted}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Offline Banner */}
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔌</span>
              <div>
                <div className="font-semibold text-yellow-400">
                  {safeLocale === 'fr' ? 'Mode hors ligne' : 'Offline Mode'}
                </div>
                <div className="text-sm text-yellow-300">
                  {safeLocale === 'fr' 
                    ? 'Connexion temporairement indisponible. Les données peuvent ne pas être à jour.' 
                    : 'Connection temporarily unavailable. Data may not be up to date.'}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="card-base card-hover p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <div className="text-muted mb-1">{t('dashboard.stats.totalLeads')}</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          <div className="card-base card-hover p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <div className="text-muted mb-1">{t('dashboard.stats.avgConfidence')}</div>
            <div className="text-3xl font-bold">{(stats.avgConfidence * 100).toFixed(0)}%</div>
          </div>
          <div className="card-base card-hover p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <div className="text-muted mb-1">{t('dashboard.stats.topIntent')}</div>
            <div className="text-xl font-semibold truncate">{stats.topIntent}</div>
          </div>
          <div className="card-base card-hover p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <div className="text-muted mb-1">{t('dashboard.stats.highUrgency')}</div>
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
          {(['active', 'archived', 'deleted', 'converted'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 ${
                activeTab === tab
                  ? tab === 'converted'
                    ? 'border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                    : 'border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
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

        {/* Leads Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {locale === 'fr' ? 'LEADS' : 'LEADS'}
            </h2>
            <div className="text-sm text-white/60">
              {locale === 'fr' 
                ? `Affichage ${startIndex + 1}-${Math.min(endIndex, filteredLeads.length)} sur ${filteredLeads.length}`
                : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredLeads.length)} of ${filteredLeads.length}`}
            </div>
          </div>
        </motion.div>

        {/* Leads Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="space-y-3"
        >
          {currentLeads.map((lead, idx) => (
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
                ) : activeTab === 'converted' ? (
                  <>
                    {/* Return to Active Button */}
                    <button
                      onClick={() => setRevertLead(lead.id)}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/40 text-green-300 hover:from-green-500/30 hover:to-blue-500/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all duration-200 text-sm font-medium"
                    >
                      ↩️ {locale === 'fr' ? 'Revenir à Actif' : 'Return to Active'}
                    </button>
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

              {/* Lead Notes Section */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <LeadNotes 
                  leadId={lead.id} 
                  clientId={selectedClientId !== 'all' ? selectedClientId : undefined}
                  isFrench={locale === 'fr'} 
                  className="mt-2"
                />
              </div>
            </motion.div>
          ))}

          {filteredLeads.length === 0 && !loading && (
            <div className="text-center py-12">
              {hasError ? (
                <ErrorFallback 
                  message={safeLocale === 'fr' 
                    ? 'Impossible de charger les leads. Vérifiez votre connexion.' 
                    : 'Unable to load leads. Please check your connection.'}
                  onRetry={() => {
                    setHasError(false);
                    fetchLeads();
                  }}
                />
              ) : isOffline ? (
                <OfflineFallback />
              ) : (
                <div className="text-white/50">
                  {t('dashboard.table.noResults')}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Pagination Controls */}
        {filteredLeads.length > leadsPerPage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            className="mt-6 flex items-center justify-between"
          >
            {/* Pagination Info */}
            <div className="text-sm text-white/60">
              {locale === 'fr' 
                ? `Affichage ${startIndex + 1}-${Math.min(endIndex, filteredLeads.length)} sur ${filteredLeads.length}`
                : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredLeads.length)} of ${filteredLeads.length}`}
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
                {locale === 'fr' ? 'Précédent' : 'Previous'}
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
                      onClick={() => setCurrentPage(pageNum)}
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
                {locale === 'fr' ? 'Suivant' : 'Next'}
              </button>
            </div>
          </motion.div>
        )}

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
                disabled={!selectedTag || isTagging}
                className="flex-1 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isTagging ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>{locale === 'fr' ? 'Étiquetage…' : 'Tagging…'}</span>
                  </>
                ) : (
                  <span>{locale === 'fr' ? 'Étiqueter' : 'Tag'}</span>
                )}
              </button>
              <button
                onClick={() => {
                  setTagLead(null);
                  setSelectedTag('');
                  setIsTagging(false);
                }}
                disabled={isTagging}
                className="flex-1 py-2 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Revert to Active Modal */}
      {revertLead && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-black via-green-900/10 to-black border border-green-500/30 rounded-lg p-6 max-w-md w-full shadow-[0_0_40px_rgba(34,197,94,0.4)]"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                <span className="text-xl">↩️</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                {locale === 'fr' ? 'Revenir à Actif' : 'Return to Active'}
              </h3>
            </div>
            
            <p className="text-white/70 mb-6 text-sm">
              {locale === 'fr' 
                ? 'Veuillez confirmer pourquoi ce lead doit être remis en actif.' 
                : 'Please confirm why this lead should be moved back to active.'}
            </p>

            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-green-500/40 cursor-pointer transition-all">
                <input
                  type="radio"
                  name="reversionReason"
                  value="accident"
                  checked={reversionReason === 'accident'}
                  onChange={() => setReversionReason('accident')}
                  className="w-4 h-4"
                />
                <span className="text-white/90">
                  {locale === 'fr' ? 'Placé dans convertis par erreur ?' : 'Placed in converted by accident?'}
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-green-500/40 cursor-pointer transition-all">
                <input
                  type="radio"
                  name="reversionReason"
                  value="other"
                  checked={reversionReason === 'other'}
                  onChange={() => setReversionReason('other')}
                  className="w-4 h-4"
                />
                <span className="text-white/90">
                  {locale === 'fr' ? 'Autre' : 'Other'}
                </span>
              </label>

              {reversionReason === 'other' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <textarea
                    value={customReversionReason}
                    onChange={(e) => setCustomReversionReason(e.target.value)}
                    placeholder={locale === 'fr' ? 'Veuillez préciser la raison...' : 'Please specify the reason...'}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-green-400/50 focus:outline-none text-white placeholder:text-white/40 resize-none"
                    rows={3}
                  />
                </motion.div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRevertToActive}
                disabled={reversionReason === 'other' && !customReversionReason.trim()}
                className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all font-medium shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {locale === 'fr' ? 'Confirmer le retour' : 'Confirm Return'}
              </button>
              <button
                onClick={() => {
                  setRevertLead(null);
                  setReversionReason('accident');
                  setCustomReversionReason('');
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-8 right-8 z-50 px-6 py-3 rounded-lg bg-green-600 border border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)]"
        >
          <p className="text-white font-medium">{toast.message}</p>
        </motion.div>
      )}

      {/* Growth Copilot */}
      <GrowthCopilot locale={locale} />
    </div>
  );
}

