"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import AvenirLogo from '../../../../components/AvenirLogo';
import UniversalLanguageToggle from '../../../../components/UniversalLanguageToggle';
import type { LeadAction } from '../../../api/lead-actions/route';
import { isLegacyClientId, DEMO_CLIENT_EMAIL } from '../../../../lib/uuid-utils';
import { restoreSession, saveSession, clearSession, type ClientData } from '../../../../utils/session';

// Dynamic imports to prevent hydration mismatches
const PredictiveGrowthEngine = dynamic(() => import('../../../../components/PredictiveGrowthEngine'), { 
  ssr: false,
  loading: () => <div className="h-32 animate-pulse bg-white/5 rounded-xl border border-white/10"></div>
});
const GrowthCopilot = dynamic(() => import('../../../../components/GrowthCopilot'), { 
  ssr: false 
});
const ActivityLog = dynamic(() => import('../../../../components/ActivityLog'), { 
  ssr: false,
  loading: () => <div className="h-24 animate-pulse bg-white/5 rounded-xl border border-white/10"></div>
});
const RelationshipInsights = dynamic(() => import('../../../../components/RelationshipInsights'), { 
  ssr: false,
  loading: () => <div className="h-48 animate-pulse bg-white/5 rounded-xl border border-white/10"></div>
});

// ClientData type is now imported from session utility

type Lead = {
  id: string;
  name: string;
  email: string;
  message: string;
  ai_summary: string;
  intent: string;
  tone: string;
  urgency: string;
  confidence_score: number;
  timestamp: string;
  last_updated: string | null;
  relationship_insight?: string;
  current_tag?: string | null;
  language?: string;
  archived?: boolean;
  deleted?: boolean;
};

export default function ClientDashboard() {
  const locale = useLocale();
  const router = useRouter();
  const isFrench = locale === 'fr';

  const [authenticated, setAuthenticated] = useState(false);
  const [client, setClient] = useState<ClientData | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [recentActions, setRecentActions] = useState<LeadAction[]>([]);
  const [filter, setFilter] = useState({ urgency: 'all', language: 'all', minConfidence: 0 });
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'deleted' | 'converted'>('active');
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);
  const [tagLead, setTagLead] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isTagging, setIsTagging] = useState(false);
  const [revertLead, setRevertLead] = useState<string | null>(null);
  const [reversionReason, setReversionReason] = useState<'accident' | 'other'>('accident');
  const [customReversionReason, setCustomReversionReason] = useState<string>('');
  const [stats, setStats] = useState({
    total: 0,
    avgConfidence: 0,
    topIntent: '',
    highUrgency: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage] = useState(5);
  const [pagination, setPagination] = useState({
    totalLeads: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const t = {
    loginTitle: isFrench ? 'Connexion Client' : 'Client Login',
    loginSubtitle: isFrench ? 'Accédez à votre tableau de bord' : 'Access your dashboard',
    email: isFrench ? 'Courriel' : 'Email',
    password: isFrench ? 'Mot de passe' : 'Password',
    login: isFrench ? 'Se connecter' : 'Log In',
    loggingIn: isFrench ? 'Connexion...' : 'Logging in...',
    noAccount: isFrench ? 'Pas de compte ?' : 'No account?',
    signup: isFrench ? 'S\'inscrire' : 'Sign up',
    welcome: isFrench ? 'Bienvenue' : 'Welcome back',
    dashboardTitle: isFrench ? 'Tableau de bord Client' : 'Client Dashboard',
    subtitle: isFrench ? 'Tableau d\'intelligence en temps réel' : 'Real-time lead intelligence dashboard',
    totalLeads: isFrench ? 'Total de Leads' : 'Total Leads',
    avgConfidence: isFrench ? 'Confiance Moyenne' : 'Avg Confidence',
    topIntent: isFrench ? 'Intention Principale' : 'Top Intent',
    highUrgency: isFrench ? 'Urgence Élevée' : 'High Urgency',
    apiAccess: isFrench ? '🔑 Accès API' : '🔑 API Access',
    logout: isFrench ? 'Déconnexion' : 'Logout',
    name: isFrench ? 'Nom' : 'Name',
    message: isFrench ? 'Message' : 'Message',
    summary: isFrench ? 'Résumé IA' : 'AI Summary',
    intent: isFrench ? 'Intention' : 'Intent',
    tone: isFrench ? 'Ton' : 'Tone',
    urgency: isFrench ? 'Urgence' : 'Urgency',
    confidence: isFrench ? 'Confiance' : 'Confidence',
    timestamp: isFrench ? 'Horodatage' : 'Timestamp',
    language: isFrench ? 'Langue' : 'Language',
    noLeads: isFrench ? 'Aucun lead pour le moment' : 'No leads yet',
    loading: isFrench ? 'Chargement...' : 'Loading...',
    filters: {
      all: isFrench ? 'Tous' : 'All',
      urgency: isFrench ? 'Urgence' : 'Urgency',
      high: isFrench ? 'Élevée' : 'High',
      medium: isFrench ? 'Moyenne' : 'Medium',
      low: isFrench ? 'Faible' : 'Low',
      language: isFrench ? 'Langue' : 'Language',
      minConfidence: isFrench ? 'Confiance Min' : 'Min Confidence',
    },
    tabs: {
      active: isFrench ? 'Leads Actifs' : 'Active Leads',
      archived: isFrench ? 'Leads Archivés' : 'Archived Leads',
      deleted: isFrench ? 'Leads Supprimés' : 'Deleted Leads',
      converted: isFrench ? 'Leads Convertis' : 'Converted Leads',
    },
    actions: {
      tag: isFrench ? 'Étiqueter le lead' : 'Tag Lead',
      archive: isFrench ? 'Archiver le lead' : 'Archive Lead',
      delete: isFrench ? 'Supprimer le lead' : 'Delete Lead',
      reactivate: isFrench ? 'Réactiver le lead' : 'Reactivate Lead',
      permanentDelete: isFrench ? 'Supprimer définitivement' : 'Delete Permanently',
      cancel: isFrench ? 'Annuler' : 'Cancel',
      confirm: isFrench ? 'Confirmer' : 'Confirm',
      selectTag: isFrench ? 'Sélectionner une étiquette' : 'Select a tag',
    },
    pagination: {
      previous: isFrench ? 'Précédent' : 'Previous',
      next: isFrench ? 'Suivant' : 'Next',
      page: isFrench ? 'Page' : 'Page',
      of: isFrench ? 'sur' : 'of',
      showing: isFrench ? 'Affichage' : 'Showing',
      to: isFrench ? 'à' : 'to',
      results: isFrench ? 'résultats' : 'results',
    },
  };

  // Restore session using the session utility
  useEffect(() => {
    console.log('[AuthFix] ============================================');
    console.log('[AuthFix] Client Dashboard: Restoring session...');
    
    const sessionState = restoreSession();
    
    if (sessionState.isAuthenticated && sessionState.client) {
      const clientData = sessionState.client;
      
      // Check if client_id is in legacy string format
      if (clientData.clientId && isLegacyClientId(clientData.clientId)) {
        console.log('[AuthFix] Invalid client_id detected — refreshing session');
        console.log('[AuthFix] Legacy client_id:', clientData.clientId);
        
        // Clear session using utility
        clearSession();
        
        // If it's the demo client, automatically re-login
        if (clientData.email === DEMO_CLIENT_EMAIL) {
          console.log('[AuthFix] Auto-refreshing demo client session...');
          handleAutoRefreshDemoClient(clientData.email, clientData.language);
          return;
        }
        
        // For other clients, just clear and let them re-login manually
        console.log('[AuthFix] Session cleared — please log in again');
        return;
      }
      
      // Session is valid, restore it
      setClient(clientData);
      setAuthenticated(true);
      console.log('[AuthFix] Session restored successfully in dashboard');
    } else {
      console.log('[AuthFix] No valid session found');
    }
    
    console.log('[AuthFix] ============================================');
  }, []);

  // Fetch client leads when authenticated or tab changes
  useEffect(() => {
    if (authenticated && client) {
      console.log('[DashboardSync] ============================================');
      console.log('[DashboardSync] Dashboard Type: CLIENT');
      console.log('[DashboardSync] Client ID:', client.clientId);
      console.log('[DashboardSync] Business:', client.businessName);
      console.log('[DashboardSync] Data Source: client_id filtered');
      console.log('[DashboardSync] Components Loading:');
      console.log('[DashboardSync]   ✅ PredictiveGrowthEngine (with clientId)');
      console.log('[DashboardSync]   ✅ RelationshipInsights (with clientId)');
      console.log('[DashboardSync]   ✅ GrowthCopilot (with clientId)');
      console.log('[DashboardSync]   ✅ ActivityLog (with clientId)');
      console.log('[DashboardSync] ============================================');
      
      fetchRecentActions();
    }
  }, [authenticated, client, activeTab]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, tagFilter, activeTab]);

  // Fetch leads when page changes (server-side pagination)
  useEffect(() => {
    if (authenticated && client) {
      // Clear leads before fetching new ones to prevent appending
      setLeads([]);
      fetchLeads();
    }
  }, [currentPage, authenticated, client, activeTab]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const res = await fetch('/api/client/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }

      console.log('[ClientDashboard] ✅ Login successful:', data.data);
      
      // Store full session and client_id separately for settings page
      localStorage.setItem('client_session', JSON.stringify(data.data));
      localStorage.setItem('clientId', data.data.clientId);
      console.log('[ClientDashboard] ✅ Client ID stored in localStorage:', data.data.clientId);
      
      setClient(data.data);
      setAuthenticated(true);

    } catch (err) {
      console.error('[ClientDashboard] ❌ Login error:', err);
      setLoginError(isFrench ? 'Identifiants invalides' : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoRefreshDemoClient(email: string, language?: string) {
    try {
      console.log('[Fix] Attempting auto-refresh for demo client...');
      
      const res = await fetch('/api/client/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password: 'DemoAvenir2025!' // Demo client password
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Auto-refresh failed');
      }

      console.log('[Fix] ✅ Demo client auto-refresh successful:', data.data);
      
      // Store updated session with new UUID-based client_id
      localStorage.setItem('client_session', JSON.stringify(data.data));
      localStorage.setItem('clientId', data.data.clientId);
      console.log('[Fix] ✅ Updated client_id stored:', data.data.clientId);
      
      // Preserve language preference
      if (language) {
        localStorage.setItem('avenir_language', language);
        document.cookie = `avenir_language=${language}; path=/; max-age=31536000; SameSite=Lax`;
        console.log('[Fix] ✅ Language preference preserved:', language);
      }
      
      setClient(data.data);
      setAuthenticated(true);

    } catch (err) {
      console.error('[Fix] ❌ Auto-refresh failed:', err);
      // If auto-refresh fails, just clear the session
      localStorage.removeItem('client_session');
      localStorage.removeItem('clientId');
    }
  }

  async function fetchLeads() {
    if (!client) return;

    try {
      setLoading(true);
      // Clear leads array before fetching to ensure replacement, not appending
      setLeads([]);
      console.log('[ClientDashboard] ============================================');
      console.log('[ClientDashboard] Fetching leads');
      console.log('[ClientDashboard] Client ID:', client.clientId);
      console.log('[ClientDashboard] Business:', client.businessName);
      console.log('[ClientDashboard] Tab:', activeTab);
      console.log('[ClientDashboard] Locale:', locale);
      console.log('[ClientDashboard] Page:', currentPage);
      console.log('[ClientDashboard] Limit:', leadsPerPage);
      
      const endpoint = `/api/client/leads?clientId=${client.clientId}&locale=${locale}&status=${activeTab}&page=${currentPage}&limit=${leadsPerPage}`;
      console.log('[ClientDashboard] Endpoint:', endpoint);
      
      const res = await fetch(endpoint);
      const data = await res.json();

      console.log('[ClientDashboard] API Response:', {
        success: data.success,
        leadCount: data.data?.length || 0,
        pagination: data.pagination,
        status: res.status,
      });

      if (data.success) {
        const leadsData = data.data || [];
        
        // Replace leads completely (server-side pagination)
        setLeads([...leadsData]); // Create new array to ensure replacement
        
        // Update pagination state
        if (data.pagination) {
          setPagination(data.pagination);
        }
        
        // For stats calculation, we need all leads, so fetch them separately
        await fetchAllLeadsForStats();
        
        console.log('[ClientDashboard] ✅ Loaded', leadsData.length, activeTab, 'leads for page', currentPage);
        console.log('[ClientDashboard] ============================================');
      } else {
        console.error('[ClientDashboard] ❌ API returned error:', data.error);
        console.log('[ClientDashboard] ============================================');
      }
    } catch (err) {
      console.error('[ClientDashboard] ❌ Failed to fetch leads:', err);
      console.error('[ClientDashboard] ❌ Error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : 'No stack trace',
      });
      console.log('[ClientDashboard] ============================================');
    } finally {
      setLoading(false);
    }
  }

  // Separate function to fetch all leads for stats calculation
  async function fetchAllLeadsForStats() {
    if (!client) return;

    try {
      const endpoint = `/api/client/leads?clientId=${client.clientId}&locale=${locale}&status=${activeTab}&page=1&limit=1000`;
      const res = await fetch(endpoint);
      const data = await res.json();

      if (data.success) {
        let allLeads = data.data || [];
        
        // For converted tab, filter only converted leads
        if (activeTab === 'converted') {
          allLeads = allLeads.filter((lead: Lead) => 
            lead.current_tag === 'Converted' || lead.current_tag === 'Converti'
          );
        }
        
        calculateStats(allLeads);
        console.log('[ClientDashboard] ✅ Calculated stats from', allLeads.length, 'total leads');
      }
    } catch (err) {
      console.error('[ClientDashboard] ❌ Failed to fetch all leads for stats:', err);
    }
  }

  async function fetchRecentActions() {
    if (!client) return;

    try {
      const res = await fetch(`/api/lead-actions?limit=5&clientId=${client.clientId}`);
      const json = await res.json();
      if (json.success) {
        setRecentActions(json.data || []);
      }
    } catch (err) {
      console.error('[ClientDashboard] Failed to fetch actions:', err);
    }
  }

  function calculateStats(leadsData: Lead[]) {
    console.log('[ClientDashboard] ============================================');
    console.log('[ClientDashboard] Calculating statistics');
    console.log('[ClientDashboard] Total leads:', leadsData.length);
    
    const total = leadsData.length;
    const avgConfidence = total > 0
      ? leadsData.reduce((sum, l) => sum + (l.confidence_score || 0), 0) / total
      : 0;
    
    const highUrgency = leadsData.filter(l => 
      l.urgency === 'High' || l.urgency === 'Élevée'
    ).length;

    const intentCounts: Record<string, number> = {};
    leadsData.forEach(l => {
      if (l.intent) {
        intentCounts[l.intent] = (intentCounts[l.intent] || 0) + 1;
      }
    });
    
    const topIntent = Object.keys(intentCounts).sort((a, b) => 
      intentCounts[b] - intentCounts[a]
    )[0] || (isFrench ? 'Aucun' : 'None');

    const calculatedStats = { total, avgConfidence, topIntent, highUrgency };
    
    console.log('[ClientDashboard] Stats calculated:', {
      total: calculatedStats.total,
      avgConfidence: (calculatedStats.avgConfidence * 100).toFixed(1) + '%',
      topIntent: calculatedStats.topIntent,
      highUrgency: calculatedStats.highUrgency,
    });
    console.log('[ClientDashboard] ============================================');
    
    setStats(calculatedStats);
  }

  function showToast(message: string) {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  }

  async function handleTagLead() {
    if (!tagLead || !selectedTag) return;

    try {
      setIsTagging(true);
      console.log(`[ClientDashboard] Tagging lead ${tagLead} as ${selectedTag}...`);

      const res = await fetch('/api/lead-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: tagLead, action: 'tag', tag: selectedTag }),
      });

      const json = await res.json();

      if (json.success) {
        // Small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setTagLead(null);
        setSelectedTag('');
        setIsTagging(false);
        showToast(isFrench ? `Lead étiqueté comme "${selectedTag}"` : `Lead tagged as "${selectedTag}"`);
        fetchLeads();
        fetchRecentActions();
      } else {
        setIsTagging(false);
        showToast(isFrench ? 'Erreur lors de l\'étiquetage' : 'Tag failed');
      }
    } catch (err) {
      setIsTagging(false);
      console.error('[ClientDashboard] Tag error:', err);
      showToast(isFrench ? 'Erreur lors de l\'étiquetage' : 'Tag failed');
    }
  }

  async function handleRevertToActive() {
    if (!revertLead) return;

    try {
      const reasonText = reversionReason === 'accident' 
        ? (isFrench ? 'Placé dans convertis par erreur' : 'Placed in converted by accident')
        : `${isFrench ? 'Autre' : 'Other'}: ${customReversionReason}`;

      console.log(`[ClientDashboard] 🔄 Reverting converted lead ${revertLead} to active...`);
      console.log(`[ClientDashboard] Reversion reason: ${reasonText}`);

      const tagRes = await fetch('/api/lead-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lead_id: revertLead, 
          action: 'tag', 
          tag: isFrench ? 'Actif' : 'Active',
          reversion_reason: reasonText,
          is_reversion: true
        }),
      });

      const tagJson = await tagRes.json();

      if (tagJson.success) {
        console.log(`[ClientDashboard] ✅ Lead reverted to active successfully`);
        setRevertLead(null);
        setReversionReason('accident');
        setCustomReversionReason('');
        showToast(isFrench ? 'Lead remis en actif avec succès.' : 'Lead returned to active successfully.');
        fetchLeads();
        fetchRecentActions();
      } else {
        showToast(isFrench ? 'Erreur lors du retour' : 'Reversion failed');
      }
    } catch (err) {
      console.error(`[ClientDashboard] Error reverting lead:`, err);
      showToast(isFrench ? 'Erreur lors du retour.' : 'Reversion failed.');
    }
  }

  async function handleArchiveLead(leadId: string) {
    try {
      const originalLeads = [...leads];
      setLeads(leads.filter(l => l.id !== leadId));

      const res = await fetch('/api/lead-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, action: 'archive' }),
      });

      const json = await res.json();

      if (json.success) {
        showToast(isFrench ? 'Lead archivé' : 'Lead archived');
        fetchRecentActions();
      } else {
        setLeads(originalLeads);
        showToast(isFrench ? 'Erreur lors de l\'archivage' : 'Archive failed');
      }
    } catch (err) {
      console.error('[ClientDashboard] Archive error:', err);
      showToast(isFrench ? 'Erreur lors de l\'archivage' : 'Archive failed');
    }
  }

  async function handleDeleteLead(leadId: string) {
    try {
      const originalLeads = [...leads];
      setLeads(leads.filter(l => l.id !== leadId));
      setConfirmDelete(null);

      const res = await fetch('/api/lead-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, action: 'delete' }),
      });

      const json = await res.json();

      if (json.success) {
        showToast(isFrench ? 'Lead supprimé' : 'Lead deleted');
        fetchRecentActions();
      } else {
        setLeads(originalLeads);
        showToast(isFrench ? 'Erreur lors de la suppression' : 'Delete failed');
      }
    } catch (err) {
      console.error('[ClientDashboard] Delete error:', err);
      showToast(isFrench ? 'Erreur lors de la suppression' : 'Delete failed');
    }
  }

  async function handleReactivate(leadId: string) {
    try {
      const res = await fetch('/api/lead-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, action: 'reactivate' }),
      });

      const json = await res.json();

      if (json.success) {
        setLeads(leads.filter(l => l.id !== leadId));
        showToast(isFrench ? 'Lead réactivé' : 'Lead reactivated');
        fetchRecentActions();
      } else {
        showToast(isFrench ? 'Erreur lors de la réactivation' : 'Reactivate failed');
      }
    } catch (err) {
      console.error('[ClientDashboard] Reactivate error:', err);
      showToast(isFrench ? 'Erreur lors de la réactivation' : 'Reactivate failed');
    }
  }

  async function handlePermanentDelete(leadId: string) {
    try {
      const originalLeads = [...leads];
      setLeads(leads.filter(l => l.id !== leadId));
      setConfirmPermanentDelete(null);

      const res = await fetch('/api/lead-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, action: 'permanent_delete' }),
      });

      const json = await res.json();

      if (json.success) {
        showToast(isFrench ? 'Lead supprimé définitivement' : 'Lead permanently deleted');
      } else {
        setLeads(originalLeads);
        showToast(isFrench ? 'Erreur lors de la suppression définitive' : 'Permanent delete failed');
      }
    } catch (err) {
      console.error('[ClientDashboard] Permanent delete error:', err);
      showToast(isFrench ? 'Erreur lors de la suppression définitive' : 'Permanent delete failed');
    }
  }

  function handleLogout() {
    console.log('[AuthFix] ============================================');
    console.log('[AuthFix] Logging out user...');
    
    // Clear all session data using utility
    clearSession();
    
    // Reset component state
    setAuthenticated(false);
    setClient(null);
    setLeads([]);
    
    console.log('[AuthFix] Logout completed, redirecting to login...');
    console.log('[AuthFix] ============================================');
    
    // Redirect to login page
    router.push(`/${locale}/client/login`);
  }

  // Server-side pagination - leads are already paginated from API
  const currentLeads = leads;

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, pagination.totalPages)));
  };

  const goToPreviousPage = () => {
    if (pagination.hasPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (pagination.hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };


  const tagOptions = isFrench 
    ? ['Contacté', 'Haute Valeur', 'Non Qualifié', 'Suivi', 'Converti']
    : ['Contacted', 'High Value', 'Not Qualified', 'Follow-Up', 'Converted'];

  const getTagBadgeColor = (tag: string | null | undefined) => {
    if (!tag) return '';
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('contact')) return 'bg-blue-500/20 border-blue-500/40 text-blue-300';
    if (tagLower.includes('high') || tagLower.includes('haute')) return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300';
    if (tagLower.includes('not') || tagLower.includes('non')) return 'bg-gray-500/20 border-gray-500/40 text-gray-300';
    if (tagLower.includes('follow') || tagLower.includes('suivi')) return 'bg-purple-500/20 border-purple-500/40 text-purple-300';
    if (tagLower.includes('convert') || tagLower.includes('converti')) return 'bg-green-500/20 border-green-500/40 text-green-300 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
    return 'bg-white/10 border-white/20 text-white/60';
  };

  // Login Screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] text-white">
        {/* Header with Logo and Language Toggle */}
        <header className="w-full px-6 py-4 border-b border-white/10">
          <div className="w-full flex items-center justify-between">
            {/* Logo - Left Side (24px from edge) */}
            <a href={`/${locale}`} className="inline-block">
              <AvenirLogo locale={locale} showText={true} />
            </a>
            
            {/* Language Toggle - Right Side (50px up via transform, 24px from edge) */}
            <div className="relative z-50 -translate-y-[50px]">
              <UniversalLanguageToggle />
            </div>
          </div>
        </header>

        <div className="min-h-screen flex items-center justify-center p-4 pt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <div className="rounded-2xl border border-white/10 p-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5 shadow-2xl">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {t.loginTitle}
                </h1>
                <p className="text-white/60 text-base">{t.loginSubtitle}</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t.email}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t.password}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                    required
                  />
                </div>

                {loginError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                  >
                    {loginError}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-[1.02]"
                >
                  {loading ? t.loggingIn : t.login}
                </button>

                <div className="text-center text-sm text-white/60 pt-2">
                  {t.noAccount}{' '}
                  <a href={`/${locale}/client/signup`} className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                    {t.signup}
                  </a>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !leads.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  // Dashboard Screen (Complete Mirror of Admin Dashboard)
  return (
    <div className="min-h-screen p-8 bg-black text-white">
      {/* Universal Language Toggle */}
      <UniversalLanguageToggle />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">{t.dashboardTitle}</h1>
            <p className="text-white/60">{t.subtitle}</p>
            <p className="text-white/50 text-sm mt-1">{client?.businessName}</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/${locale}/client/settings`}
              className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 transition-all duration-300 text-sm font-medium"
            >
              ⚙️ {isFrench ? 'Paramètres' : 'Settings'}
            </a>
            <a
              href={`/${locale}/client/api-access`}
              className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 transition-all duration-300 text-sm font-medium"
            >
              {t.apiAccess}
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md bg-red-500/20 border border-red-400/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium"
            >
              {t.logout}
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="group rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:border-blue-400/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300"
          >
            <div className="text-sm text-white/60 mb-1">{t.totalLeads}</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="group rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:border-blue-400/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300"
          >
            <div className="text-sm text-white/60 mb-1">{t.avgConfidence}</div>
            <div className="text-3xl font-bold">{(stats.avgConfidence * 100).toFixed(0)}%</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="group rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:border-blue-400/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300"
          >
            <div className="text-sm text-white/60 mb-1">{t.topIntent}</div>
            <div className="text-xl font-semibold truncate">{stats.topIntent}</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="group rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:border-blue-400/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300"
          >
            <div className="text-sm text-white/60 mb-1">{t.highUrgency}</div>
            <div className="text-3xl font-bold text-red-400">{stats.highUrgency}</div>
          </motion.div>
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
              {t.tabs[tab]}
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
            <option value="all">{t.filters.all} {t.filters.urgency}</option>
            <option value="High">{t.filters.high}</option>
            <option value="Medium">{t.filters.medium}</option>
            <option value="Low">{t.filters.low}</option>
          </select>

          <select
            value={filter.language}
            onChange={(e) => setFilter({ ...filter, language: e.target.value })}
            className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm hover:border-blue-400/40 transition-all"
          >
            <option value="all">{t.filters.all} {t.filters.language}</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>

          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm hover:border-blue-400/40 transition-all"
          >
            <option value="all">{isFrench ? 'Tous les tags' : 'All Tags'}</option>
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
              {t.filters.minConfidence}: {(filter.minConfidence * 100).toFixed(0)}%
            </span>
          </div>
        </motion.div>

        {/* Predictive Growth Engine */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8"
          onAnimationComplete={() => {
            console.log('[DashboardSync] ============================================');
            console.log('[DashboardSync] ✅ Predictive Growth Engine Rendered');
            console.log('[DashboardSync] Component: PredictiveGrowthEngine');
            console.log('[DashboardSync] Props: {locale: "' + locale + '", clientId: "' + (client?.clientId || 'null') + '"}');
            console.log('[DashboardSync] Expected sections:');
            console.log('[DashboardSync]   1. Title: "Predictive Growth Engine" / "Moteur de Croissance Prédictif"');
            console.log('[DashboardSync]   2. Subtitle: "AI-powered trends and predictions"');
            console.log('[DashboardSync]   3. Engagement Score card (0-100 with gradient bar)');
            console.log('[DashboardSync]   4. Urgency Trend card (with percentage)');
            console.log('[DashboardSync]   5. Confidence Insight card (with percentage)');
            console.log('[DashboardSync]   6. Tone Insight card (sentiment score)');
            console.log('[DashboardSync]   7. Language Ratio card (EN/FR bars)');
            console.log('[DashboardSync] Data endpoint: /api/growth-insights?client_id=' + (client?.clientId || '(none)'));
            console.log('[DashboardSync] ============================================');
          }}
        >
          <PredictiveGrowthEngine locale={locale} clientId={client?.clientId || null} />
        </motion.div>

        {/* Relationship Insights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mb-8"
        >
          <RelationshipInsights locale={locale} clientId={client?.clientId || null} />
        </motion.div>

        {/* Leads Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
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
                  <span className="text-white/50 text-xs block mb-1">{t.name}</span>
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
                  <span className="text-white/50 text-xs block mb-1">{t.email}</span>
                  <p className="text-blue-400">{lead.email}</p>
                </div>
                <div>
                  <span className="text-white/50 text-xs block mb-1">{t.language}</span>
                  <p className="uppercase text-xs font-mono">{lead.language}</p>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="text-white/50 text-xs block mb-1">{t.message}</span>
                  <p className="text-white/80 italic">&quot;{lead.message}&quot;</p>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="text-white/50 text-xs block mb-1">{t.summary}</span>
                  <p className="text-white/90">{lead.ai_summary}</p>
                </div>
                <div>
                  <span className="text-white/50 text-xs block mb-1">{t.intent}</span>
                  <p className="text-blue-300 font-medium">{lead.intent}</p>
                </div>
                <div>
                  <span className="text-white/50 text-xs block mb-1">{t.tone}</span>
                  <p>{lead.tone}</p>
                </div>
                <div>
                  <span className="text-white/50 text-xs block mb-1">{t.urgency}</span>
                  <p className={
                    lead.urgency === 'High' || lead.urgency === 'Élevée' ? 'text-red-400 font-semibold' :
                    lead.urgency === 'Medium' || lead.urgency === 'Moyenne' ? 'text-yellow-400' :
                    'text-green-400'
                  }>
                    {lead.urgency}
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
                {lead.relationship_insight && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <span className="text-white/50 text-xs block mb-1">💡 {isFrench ? 'Aperçu Relationnel' : 'Relationship Insight'}</span>
                    <p className="text-blue-300 text-sm">{lead.relationship_insight}</p>
                  </div>
                )}
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="text-white/50 text-xs block mb-1">{t.timestamp}</span>
                  <p className="text-xs font-mono text-white/60">
                    {new Date(lead.timestamp).toLocaleString(isFrench ? 'fr-CA' : 'en-US')}
                  </p>
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
                        {t.actions.tag}
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
                        {t.actions.archive}
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
                        {t.actions.delete}
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
                      ↩️ {isFrench ? 'Revenir à Actif' : 'Return to Active'}
                    </button>
                  </>
                ) : activeTab === 'archived' || activeTab === 'deleted' ? (
                  <>
                    {/* Reactivate Button */}
                    <div className="relative group">
                      <button
                        onClick={() => handleReactivate(lead.id)}
                        className="p-2 rounded-lg bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:border-green-500/60 transition-all duration-100 text-xs"
                      >
                        ♻️
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-green-600 text-white text-[0.9rem] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-150 whitespace-nowrap pointer-events-none z-10">
                        {t.actions.reactivate}
                      </span>
                    </div>
                    {activeTab === 'deleted' && (
                      <div className="relative group">
                        <button
                          onClick={() => setConfirmPermanentDelete(lead.id)}
                          className="p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:border-red-500/60 transition-all duration-100 text-xs"
                        >
                          ⚠️
                        </button>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-red-600 text-white text-[0.9rem] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-150 whitespace-nowrap pointer-events-none z-10">
                          {t.actions.permanentDelete}
                        </span>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </motion.div>
          ))}

                    {currentLeads.length === 0 && (
                      <div className="text-center py-12 text-white/50">
                        {t.noLeads}
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {currentLeads.length > 0 && pagination.totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/10"
            >
                        {/* Results Info */}
                        <div className="text-sm text-white/60">
                          {t.pagination.showing} {((currentPage - 1) * leadsPerPage) + 1} {t.pagination.to} {Math.min(currentPage * leadsPerPage, pagination.totalLeads)} {t.pagination.of} {pagination.totalLeads} {t.pagination.results}
                        </div>

              {/* Pagination Buttons */}
              <div className="flex items-center gap-2">
                          {/* Previous Button */}
                          <button
                            onClick={goToPreviousPage}
                            disabled={!pagination.hasPrevPage}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              !pagination.hasPrevPage
                                ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                                : 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:border-white/30 hover:text-white'
                            }`}
                          >
                            {t.pagination.previous}
                          </button>

                          {/* Page Numbers */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                              let pageNum;
                              if (pagination.totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= pagination.totalPages - 2) {
                                pageNum = pagination.totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }

                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => goToPage(pageNum)}
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

                          {/* Next Button */}
                          <button
                            onClick={goToNextPage}
                            disabled={!pagination.hasNextPage}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              !pagination.hasNextPage
                                ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                                : 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:border-white/30 hover:text-white'
                            }`}
                          >
                            {t.pagination.next}
                          </button>
              </div>
            </motion.div>
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

      {/* Growth Copilot */}
      <GrowthCopilot locale={locale} clientId={client?.clientId || null} />

      {/* Toast Notification */}
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-xl z-50"
        >
          {toast.message}
        </motion.div>
      )}

      {/* Tag Modal */}
      {tagLead && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a2e] rounded-xl p-6 max-w-md w-full border border-white/10"
          >
            <h3 className="text-xl font-bold mb-4">{t.actions.selectTag}</h3>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-white/5 border border-white/10 mb-4"
            >
              <option value="">--</option>
              {tagOptions.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTagLead(null);
                  setSelectedTag('');
                  setIsTagging(false);
                }}
                disabled={isTagging}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-500/20 border border-gray-500/40 text-gray-400 hover:bg-gray-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.actions.cancel}
              </button>
              <button
                onClick={handleTagLead}
                disabled={!selectedTag || isTagging}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isTagging ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></span>
                    <span>{isFrench ? 'Étiquetage…' : 'Tagging…'}</span>
                  </>
                ) : (
                  <span>{t.actions.confirm}</span>
                )}
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
                {isFrench ? 'Revenir à Actif' : 'Return to Active'}
              </h3>
            </div>
            
            <p className="text-white/70 mb-6 text-sm">
              {isFrench 
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
                  {isFrench ? 'Placé dans convertis par erreur ?' : 'Placed in converted by accident?'}
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
                  {isFrench ? 'Autre' : 'Other'}
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
                    placeholder={isFrench ? 'Veuillez préciser la raison...' : 'Please specify the reason...'}
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
                {isFrench ? 'Confirmer le retour' : 'Confirm Return'}
              </button>
              <button
                onClick={() => {
                  setRevertLead(null);
                  setReversionReason('accident');
                  setCustomReversionReason('');
                }}
                className="flex-1 py-2 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                {isFrench ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a2e] rounded-xl p-6 max-w-md w-full border border-red-500/30"
          >
            <h3 className="text-xl font-bold mb-4 text-red-400">
              {isFrench ? 'Confirmer la suppression' : 'Confirm Delete'}
            </h3>
            <p className="text-white/70 mb-6">
              {isFrench 
                ? 'Êtes-vous sûr de vouloir supprimer ce lead ? Vous pourrez le restaurer depuis les leads supprimés.'
                : 'Are you sure you want to delete this lead? You can restore it from the deleted leads tab.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-500/20 border border-gray-500/40 text-gray-400 hover:bg-gray-500/30 transition-all"
              >
                {t.actions.cancel}
              </button>
              <button
                onClick={() => handleDeleteLead(confirmDelete)}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all"
              >
                {t.actions.confirm}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {confirmPermanentDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a2e] rounded-xl p-6 max-w-md w-full border border-red-500/50"
          >
            <h3 className="text-xl font-bold mb-4 text-red-400">
              {isFrench ? '⚠️ Suppression Définitive' : '⚠️ Permanent Delete'}
            </h3>
            <p className="text-white/70 mb-6">
              {isFrench 
                ? 'ATTENTION : Cette action est irréversible ! Le lead sera définitivement supprimé de la base de données.'
                : 'WARNING: This action cannot be undone! The lead will be permanently deleted from the database.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmPermanentDelete(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-500/20 border border-gray-500/40 text-gray-400 hover:bg-gray-500/30 transition-all"
              >
                {t.actions.cancel}
              </button>
              <button
                onClick={() => handlePermanentDelete(confirmPermanentDelete)}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500/30 border border-red-500/50 text-red-300 hover:bg-red-500/40 transition-all font-bold"
              >
                {t.actions.permanentDelete}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
