"use client";

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import UniversalLanguageToggle from '../../../../components/UniversalLanguageToggle';
import ProspectProofModal from '../../../../components/ProspectProofModal';
import EmailPreviewModal from '../../../../components/EmailPreviewModal';

interface ProspectCandidate {
  id: string;
  business_name: string;
  website: string;
  contact_email?: string;
  industry?: string;
  region?: string;
  language?: string;
  response_score?: number;
  automation_need_score?: number;
  contacted?: boolean;
  is_test?: boolean; // True if from Test Mode
  created_at: string;
  last_tested?: string;
  metadata?: {
    source?: string;
    apollo_id?: string;
    pdl_id?: string;
    form_scan?: {
      has_form: boolean;
      form_count: number;
      has_mailto: boolean;
      has_captcha: boolean;
      submit_method: string | null;
      recommended_approach: string;
      scanned_at: string;
      contact_paths: string[];
    };
    [key: string]: any;
  };
}

interface ScanResult {
  totalCrawled: number;
  totalTested: number;
  totalScored: number;
  totalContacted: number;
  highPriorityProspects: ProspectCandidate[];
  errors: string[];
}

export default function ProspectIntelligencePage() {
  const locale = useLocale();
  const isFrench = locale === 'fr';

  const [scanning, setScanning] = useState(false);
  const [prospects, setProspects] = useState<ProspectCandidate[]>([]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showOnlyHighPriority, setShowOnlyHighPriority] = useState(false);
  const [showTestProspects, setShowTestProspects] = useState(false); // Toggle for test data
  const [sendingOutreach, setSendingOutreach] = useState<Record<string, boolean>>({});
  const [generatingProof, setGeneratingProof] = useState(false);
  
  // Modal states
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [emailPreviewModalOpen, setEmailPreviewModalOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<ProspectCandidate | null>(null);
  
  // Metrics state
  const [metrics, setMetrics] = useState({
    totalCrawled: 0,
    totalTested: 0,
    totalScored: 0,
    totalContacted: 0,
    highPriorityCount: 0
  });

  // Configuration state
  const [config, setConfig] = useState({
    industries: ['Construction', 'Real Estate', 'Marketing'],
    regions: ['CA'],
    minScore: 70,
    maxResults: 10,
    testMode: true,
    usePdl: false, // Will be set from server config
    scanForms: true // Enable form scanning by default
  });

  // Server-side configuration status
  const [serverConfig, setServerConfig] = useState<{
    hasPdl: boolean;
    hasApollo: boolean;
    autoSubmitEnabled: boolean;
  }>({
    hasPdl: false,
    hasApollo: false,
    autoSubmitEnabled: false
  });

  const t = {
    title: isFrench ? 'Intelligence de Prospection' : 'Prospect Intelligence',
    subtitle: isFrench ? 'Découverte et évaluation automatiques des prospects' : 'Automated prospect discovery and scoring',
    scanButton: isFrench ? '🧠 Lancer un scan de prospects' : '🧠 Run Prospect Scan',
    scanning: isFrench ? 'Scan en cours...' : 'Scanning...',
    configuration: isFrench ? 'Configuration' : 'Configuration',
    industries: isFrench ? 'Secteurs d\'activité' : 'Industries',
    regions: isFrench ? 'Régions' : 'Regions',
    minScore: isFrench ? 'Score minimum' : 'Min Score',
    maxResults: isFrench ? 'Résultats max' : 'Max Results',
    testMode: isFrench ? 'Mode test' : 'Test Mode',
    latestResults: isFrench ? 'Derniers Résultats du Scan' : 'Latest Scan Results',
    totalCrawled: isFrench ? 'Total Découverts' : 'Total Crawled',
    totalTested: isFrench ? 'Total Testés' : 'Total Tested',
    totalScored: isFrench ? 'Total Notés' : 'Total Scored',
    totalContacted: isFrench ? 'Total Contactés' : 'Total Contacted',
    prospectCandidates: isFrench ? 'Candidats Prospects' : 'Prospect Candidates',
    businessName: isFrench ? 'Nom de l\'entreprise' : 'Business Name',
    industry: isFrench ? 'Secteur' : 'Industry',
    region: isFrench ? 'Région' : 'Region',
    score: isFrench ? 'Score' : 'Score',
    status: isFrench ? 'Statut' : 'Status',
    website: isFrench ? 'Site Web' : 'Website',
    lastTested: isFrench ? 'Dernier Test' : 'Last Tested',
    contacted: isFrench ? 'Contacté' : 'Contacted',
    notContacted: isFrench ? 'Non contacté' : 'Not Contacted',
    noProspects: isFrench ? 'Aucun prospect trouvé. Lancez un scan pour commencer.' : 'No prospects found. Run a scan to get started.',
    backToDashboard: isFrench ? '← Retour au tableau de bord' : '← Back to Dashboard',
    highPriority: isFrench ? 'Priorité Élevée' : 'High Priority',
    errors: isFrench ? 'Erreurs' : 'Errors',
    noErrors: isFrench ? 'Aucune erreur' : 'No errors',
    loading: isFrench ? 'Chargement...' : 'Loading...',
    refreshButton: isFrench ? '📊 Actualiser les statistiques' : '📊 Refresh Metrics',
    refreshing: isFrench ? 'Actualisation...' : 'Refreshing...',
    refreshSuccess: isFrench ? '✅ Statistiques actualisées avec succès' : '✅ Metrics refreshed successfully',
    showOnlyHighPriority: isFrench ? 'Afficher uniquement les prospects prioritaires' : 'Show Only High-Priority',
    allProspects: isFrench ? 'Tous les Prospects' : 'All Prospects',
    highPriorityBadge: isFrench ? '🔥 Priorité élevée' : '🔥 High-Priority',
    urgent: isFrench ? 'Urgent' : 'Urgent',
    high: isFrench ? 'Élevé' : 'High',
    medium: isFrench ? 'Moyen' : 'Medium',
    low: isFrench ? 'Faible' : 'Low',
    noHighPriorityFound: isFrench ? 'Aucun prospect hautement prioritaire trouvé' : 'No high-priority prospects found',
    sendOutreach: isFrench ? '📧 Envoyer' : '📧 Send Outreach',
    sending: isFrench ? 'Envoi...' : 'Sending...',
    outreachSent: isFrench ? '✅ Envoyé' : '✅ Sent',
    viewProof: isFrench ? '📊 Voir preuve' : '📊 View Proof',
    generating: isFrench ? 'Génération...' : 'Generating...',
    simulateFeedback: isFrench ? '🎲 Simuler feedback' : '🎲 Simulate Feedback',
    actions: isFrench ? 'Actions' : 'Actions',
    showTestProspects: isFrench ? 'Afficher les prospects de test' : 'Show Test Prospects',
    testDataLabel: isFrench ? '🧪 Données de test' : '🧪 Test Data',
  };

  // Industry translations (EN → FR)
  const industryTranslations: Record<string, string> = {
    'Construction': 'Construction',
    'Real Estate': 'Immobilier',
    'Marketing': 'Marketing',
    'Technology': 'Technologie',
    'Finance': 'Finance',
    'Legal': 'Juridique',
    'Healthcare': 'Santé',
    'Education': 'Éducation',
    'Retail': 'Commerce de détail',
    'Hospitality': 'Hôtellerie',
    'Manufacturing': 'Fabrication',
    'Consulting': 'Conseil',
    'Insurance': 'Assurance',
    'Automotive': 'Automobile',
    'Home Services': 'Services à domicile',
    'Events': 'Événements',
  };

  const translateIndustry = (industry: string | undefined): string => {
    if (!industry) return 'N/A';
    if (isFrench && industryTranslations[industry]) {
      return industryTranslations[industry];
    }
    return industry;
  };

  // Load server configuration on mount
  useEffect(() => {
    console.log('[ProspectDashboard] 🔄 useEffect triggered - loading server configuration');
    fetchServerConfig()
      .then((config) => {
        console.log('[ProspectDashboard] ✅ fetchServerConfig completed successfully:', config);
      })
      .catch((err) => {
        console.error('[ProspectDashboard] ❌ fetchServerConfig threw error:', err);
      });
  }, []);

  // Load existing prospects on mount
  useEffect(() => {
    loadProspects();
  }, []);

  const fetchServerConfig = async () => {
    console.log('[ProspectDashboard] ============================================');
    console.log('[ProspectDashboard] Fetching config from /api/prospect-intelligence/config');
    console.log('[ProspectDashboard] useEffect triggered - component mounted');
    
    try {
      // Build absolute URL for fetch
      const base = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const endpoint = '/api/prospect-intelligence/config';
      const fullUrl = `${base}${endpoint}`;
      
      console.log('[ProspectDashboard] 📡 Base URL:', base);
      console.log('[ProspectDashboard] 📡 Endpoint:', endpoint);
      console.log('[ProspectDashboard] 📡 Full URL:', fullUrl);
      console.log('[ProspectDashboard] 🚀 Starting fetch...');
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log('[ProspectDashboard] ✅ Fetch completed');
      console.log('[ProspectDashboard] Response status:', response.status);
      console.log('[ProspectDashboard] Response ok:', response.ok);
      console.log('[ProspectDashboard] Response headers:', {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });

      // Check for non-JSON responses (error pages, HTML, etc.)
      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType?.includes('application/json')) {
        console.error('[ProspectDashboard] ❌ Non-JSON response from config API');
        console.error('[ProspectDashboard] Status:', response.status);
        console.error('[ProspectDashboard] Content-Type:', contentType);
        
        // Try to read as text for debugging
        const text = await response.text();
        console.error('[ProspectDashboard] Response body (first 500 chars):', text.substring(0, 500));
        
        // Fallback to safe defaults
        const fallbackConfig = {
          hasPdl: false,
          hasApollo: false,
          autoSubmitEnabled: false
        };
        
        console.error('[ProspectDashboard] ⚠️  Using fallback config:', fallbackConfig);
        setServerConfig(fallbackConfig);
        console.log('[ProspectDashboard] ============================================');
        return fallbackConfig;
      }
      
      // Parse JSON response
      console.log('[ProspectDashboard] 📖 Parsing JSON response...');
      const data = await response.json();
      console.log('[ProspectDashboard] 🧠 Server config received:', JSON.stringify(data, null, 2));

      if (data.success && data.data) {
        console.log('[ProspectDashboard] ✅ Server config loaded successfully');
        console.log('[ProspectDashboard] ├─ hasPdl:', data.data.hasPdl);
        console.log('[ProspectDashboard] ├─ hasApollo:', data.data.hasApollo);
        console.log('[ProspectDashboard] └─ autoSubmitEnabled:', data.data.autoSubmitEnabled);
        
        // Force update server config state
        const newServerConfig = {
          hasPdl: data.data.hasPdl || false,
          hasApollo: data.data.hasApollo || false,
          autoSubmitEnabled: data.data.autoSubmitEnabled || false
        };
        
        console.log('[ProspectDashboard] 📝 Setting serverConfig state to:', newServerConfig);
        setServerConfig(newServerConfig);

        // Auto-enable PDL if API key is present
        if (data.data.hasPdl) {
          console.log('[ProspectDashboard] ✅ PDL API key detected - auto-enabling PDL toggle');
          console.log('[ProspectDashboard] 🎯 PDL toggle should now be visible');
          setConfig(prev => ({ ...prev, usePdl: true }));
        } else {
          console.log('[ProspectDashboard] ℹ️  PDL API key not configured');
          console.log('[ProspectDashboard] ⚠️  PDL toggle will remain hidden');
        }
        
        console.log('[ProspectDashboard] ============================================');
        return newServerConfig;
      } else {
        console.warn('[ProspectDashboard] ⚠️  Config response missing success or data field');
        console.warn('[ProspectDashboard] Response data:', data);
        
        const fallbackConfig = {
          hasPdl: false,
          hasApollo: false,
          autoSubmitEnabled: false
        };
        
        setServerConfig(fallbackConfig);
        console.log('[ProspectDashboard] ============================================');
        return fallbackConfig;
      }
    } catch (err) {
      console.error('[ProspectDashboard] ❌ EXCEPTION during fetch server config');
      console.error('[ProspectDashboard] ❌ Error object:', err);
      console.error('[ProspectDashboard] ❌ Error type:', err instanceof Error ? err.constructor.name : typeof err);
      console.error('[ProspectDashboard] ❌ Error message:', err instanceof Error ? err.message : String(err));
      
      if (err instanceof Error) {
        console.error('[ProspectDashboard] ❌ Error stack:', err.stack);
        
        // Network error details
        if ('cause' in err) {
          console.error('[ProspectDashboard] ❌ Error cause:', err.cause);
        }
      }
      
      // Fallback to safe defaults on error
      const fallbackConfig = {
        hasPdl: false,
        hasApollo: false,
        autoSubmitEnabled: false
      };
      
      console.error('[ProspectDashboard] ⚠️  Using fallback config due to exception:', fallbackConfig);
      setServerConfig(fallbackConfig);
      console.log('[ProspectDashboard] ============================================');
      return fallbackConfig;
    }
  };

  const loadProspects = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[ProspectDashboard] Loading prospects from Supabase...');
      
      const response = await fetch('/api/prospect-intelligence/prospects');
      const json = await response.json();

      // Handle error response
      if (!response.ok || json.error) {
        throw new Error(json.error || 'Failed to load prospects');
      }

      // Parse response: { data: [...], count: number }
      const prospects = json.data || json || [];
      
      // Defensive check: ensure prospects is an array
      if (!Array.isArray(prospects)) {
        console.warn('[ProspectDashboard] ⚠️ Received non-array data, defaulting to empty array');
        setProspects([]);
        setLoading(false);
        return;
      }

      console.log('[ProspectDashboard]', prospects.length, 'prospects loaded');

      setProspects(prospects);
      
      // Calculate metrics from prospects
      const highPriorityCount = prospects.filter(p => (p.automation_need_score || 0) >= 70).length;
      setMetrics({
        totalCrawled: prospects.length,
        totalTested: prospects.length,
        totalScored: prospects.length,
        totalContacted: prospects.filter(p => p.contacted).length,
        highPriorityCount
      });

      setLoading(false);
    } catch (err) {
      console.error('[ProspectDashboard] ❌ Error loading prospects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load prospects');
      setProspects([]); // Safe fallback to empty array
      setLoading(false);
    }
  };

  // Refresh metrics manually
  const handleRefresh = async () => {
    setRefreshing(true);
    console.log('[ProspectDashboard] Manual refresh triggered');

    try {
      await loadProspects();
      setToastMessage(t.refreshSuccess);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      console.log('[ProspectDashboard] ✅ Manual refresh complete');
    } catch (err) {
      console.error('[ProspectDashboard] ❌ Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleScan = async () => {
    console.log('[ProspectDashboard] ============================================');
    console.log('[ProspectDashboard] Starting prospect scan');
    console.log('[ProspectDashboard] Config:', config);

    setScanning(true);
    setError(null);

    try {
      const response = await fetch('/api/prospect-intelligence/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Scan failed');
      }

      console.log('[ProspectDashboard] ✅ Scan complete');
      console.log('[ProspectDashboard] Results:', data.data);

      setScanResult(data.data);
      
      // Reload all prospects from database to get updated data
      await loadProspects();

    } catch (err) {
      console.error('[ProspectDashboard] ❌ Scan error:', err);
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleOpenEmailPreview = (prospect: ProspectCandidate) => {
    console.log('[ProspectDashboard] Opening email preview for:', prospect.business_name);
    setSelectedProspect(prospect);
    setEmailPreviewModalOpen(true);
  };

  const handleEmailSendSuccess = () => {
    console.log('[ProspectDashboard] ✅ Email sent successfully');
    if (selectedProspect) {
      setToastMessage(isFrench ? `✅ E-mail envoyé à ${selectedProspect.business_name}` : `✅ Outreach email sent to ${selectedProspect.business_name}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      // Reload to update 'contacted' status
      loadProspects();
    }
  };

  const handleEmailSendError = (error: string) => {
    console.error('[ProspectDashboard] ❌ Email send error:', error);
    setToastMessage(isFrench ? `❌ ${error}` : `❌ ${error}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const handleOpenProofModal = (prospect: ProspectCandidate) => {
    console.log('[ProspectDashboard] Opening proof modal for:', prospect.business_name);
    setSelectedProspect(prospect);
    setProofModalOpen(true);
  };

  const handleSimulateFeedback = async () => {
    console.log('[ProspectDashboard] Simulating feedback...');
    setGeneratingProof(true);

    try {
      const response = await fetch('/api/prospect-intelligence/feedback', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: 10 }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to simulate feedback');
      }

      console.log('[ProspectDashboard] ✅ Feedback simulated');
      setToastMessage(isFrench ? `✅ Feedback simulé pour ${data.data.updated} e-mails` : `✅ Feedback simulated for ${data.data.updated} emails`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      await loadProspects();
    } catch (err) {
      console.error('[ProspectDashboard] ❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to simulate feedback');
    } finally {
      setGeneratingProof(false);
    }
  };

  const handleViewProofVisuals = async (prospectId: string) => {
    console.log('[ProspectDashboard] Generating proof visuals...');
    setGeneratingProof(true);

    try {
      const response = await fetch('/api/prospect-intelligence/proof-visuals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prospectId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate proof visuals');
      }

      console.log('[ProspectDashboard] ✅ Proof visuals generated');
      console.log('Proof data:', data.data);
      
      // Show comparison data in toast
      const improvement = data.data.comparison.improvements.response_time_improvement;
      setToastMessage(isFrench 
        ? `✅ Amélioration de ${improvement} du temps de réponse` 
        : `✅ ${improvement} response time improvement`
      );
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      
      // In production, this could open a modal with the full visuals
    } catch (err) {
      console.error('[ProspectDashboard] ❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate proof visuals');
    } finally {
      setGeneratingProof(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-gray-400';
    if (score >= 85) return 'text-red-400';
    if (score >= 70) return 'text-orange-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getScoreLabel = (score: number | undefined) => {
    if (!score) return 'N/A';
    if (score >= 85) return t.urgent;
    if (score >= 70) return t.high;
    if (score >= 50) return t.medium;
    return t.low;
  };

  const isHighPriority = (score: number | undefined) => {
    return (score || 0) >= 70;
  };

  // Filter prospects based on toggle
  // Filter by test status first, then by priority
  let filteredProspects = showTestProspects 
    ? prospects // Show all (including test)
    : prospects.filter(p => !p.is_test); // Hide test prospects by default

  // Then apply high-priority filter
  if (showOnlyHighPriority) {
    filteredProspects = filteredProspects.filter(p => isHighPriority(p.automation_need_score));
  }

  // Debug: Log render state
  console.log('[ProspectDashboard] 🎨 Rendering component...');
  console.log('[ProspectDashboard] Rendering PDL toggle:', serverConfig.hasPdl);
  console.log('[ProspectDashboard] Current serverConfig:', serverConfig);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-4 sm:p-8">
      {/* Universal Language Toggle */}
      <UniversalLanguageToggle />
      
      <div className="max-w-7xl mx-auto">
        {/* PDL Integration Status Banner */}
        {!serverConfig.hasPdl && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="text-yellow-300 font-medium">
                  {isFrench 
                    ? 'Intégration People Data Labs non active'
                    : 'People Data Labs integration not active'}
                </p>
                <p className="text-yellow-300/70 text-sm mt-1">
                  {isFrench
                    ? 'Vérifiez votre variable d\'environnement PEOPLE_DATA_LABS_API_KEY ou la réponse de l\'API.'
                    : 'Check your PEOPLE_DATA_LABS_API_KEY environment variable or API response.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <a
            href={`/${locale}/dashboard`}
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors mb-4"
          >
            {t.backToDashboard}
          </a>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-white/60">{t.subtitle}</p>
        </motion.div>

        {/* Configuration Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10"
        >
          <h2 className="text-xl font-semibold mb-4 text-purple-400">{t.configuration}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">{t.industries}</label>
              <input
                type="text"
                value={config.industries.join(', ')}
                onChange={(e) => setConfig({ ...config, industries: e.target.value.split(',').map(s => s.trim()) })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">{t.regions}</label>
              <input
                type="text"
                value={config.regions.join(', ')}
                onChange={(e) => setConfig({ ...config, regions: e.target.value.split(',').map(s => s.trim()) })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">{t.minScore}</label>
              <input
                type="number"
                value={config.minScore}
                onChange={(e) => setConfig({ ...config, minScore: parseInt(e.target.value) || 70 })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">{t.maxResults}</label>
              <input
                type="number"
                value={config.maxResults}
                onChange={(e) => setConfig({ ...config, maxResults: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.testMode}
                  onChange={(e) => setConfig({ ...config, testMode: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-white/70">{t.testMode}</span>
              </label>
            </div>

            {/* PDL Toggle - Only show if API key is configured server-side */}
            {(() => {
              console.log('[ProspectDashboard] 🔍 Evaluating PDL toggle render condition...');
              console.log('[ProspectDashboard] serverConfig.hasPdl =', serverConfig.hasPdl);
              
              if (serverConfig.hasPdl) {
                console.log('[ProspectDashboard] ✅ Rendering PDL toggle');
                return (
                  <div className="flex items-end" key="pdl-toggle">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.usePdl}
                        onChange={(e) => setConfig({ ...config, usePdl: e.target.checked })}
                        className="mr-2"
                        disabled={config.testMode}
                      />
                      <span className="text-sm text-white/70">
                        {isFrench ? 'Utiliser People Data Labs (PDL)' : 'Use People Data Labs (PDL)'}
                      </span>
                    </label>
                  </div>
                );
              } else {
                console.log('[ProspectDashboard] ⚠️  PDL toggle NOT rendered (serverConfig.hasPdl is false)');
                return null;
              }
            })()}

            <div className="flex items-end">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.scanForms}
                  onChange={(e) => setConfig({ ...config, scanForms: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-white/70">
                  {isFrench ? 'Scanner les formulaires' : 'Scan Forms'}
                </span>
              </label>
            </div>
          </div>

          {/* Data Source Info */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg text-xs text-white/70">
            <p className="font-semibold text-blue-400 mb-1">
              {isFrench ? '📊 Sources de données :' : '📊 Data Sources:'}
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Apollo:</strong> {isFrench ? '50 req/heure (gratuit)' : '50 req/hour (free)'}
              </li>
              <li>
                <strong>People Data Labs:</strong> {isFrench ? '1,000 req/mois (gratuit)' : '1,000 req/month (free)'}
              </li>
              <li>
                <strong>{isFrench ? 'Secours' : 'Fallback'}:</strong> Google Scraper {isFrench ? '(gratuit)' : '(free)'}
              </li>
            </ul>
          </div>

          <button
            onClick={handleScan}
            disabled={scanning}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-[1.02] ${
              scanning
                ? 'bg-gray-500/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 shadow-lg'
            }`}
          >
            {scanning ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {t.scanning}
              </span>
            ) : (
              t.scanButton
            )}
          </button>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 mb-6"
          >
            <p className="text-red-400">❌ {error}</p>
          </motion.div>
        )}

        {/* Success Toast */}
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 z-50 bg-green-500/20 border border-green-400/50 text-green-400 px-6 py-3 rounded-lg shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}

        {/* Metrics Summary (Always Visible) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-400">{t.latestResults}</h2>
            <div className="flex gap-2">
              <button
                onClick={handleSimulateFeedback}
                disabled={generatingProof}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  generatingProof
                    ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-500/20 border border-purple-400/50 text-purple-400 hover:bg-purple-500/30'
                }`}
              >
                {t.simulateFeedback}
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  refreshing
                    ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500/20 border border-blue-400/50 text-blue-400 hover:bg-blue-500/30'
                }`}
              >
                {refreshing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t.refreshing}
                  </span>
                ) : (
                  t.refreshButton
                )}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="text-3xl font-bold text-blue-400">{metrics.totalCrawled}</div>
              <div className="text-sm text-white/60">{t.totalCrawled}</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="text-3xl font-bold text-purple-400">{metrics.totalTested}</div>
              <div className="text-sm text-white/60">{t.totalTested}</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="text-3xl font-bold text-pink-400">{metrics.totalScored}</div>
              <div className="text-sm text-white/60">{t.totalScored}</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="text-3xl font-bold text-green-400">{metrics.totalContacted}</div>
              <div className="text-sm text-white/60">{t.totalContacted}</div>
            </div>
          </div>

          {scanResult && scanResult.errors && scanResult.errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
              <h3 className="text-red-400 font-semibold mb-2">{t.errors}:</h3>
              <ul className="list-disc list-inside text-red-300 text-sm">
                {scanResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>

        {/* Prospects Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
        >
          <div className="p-6 border-b border-white/10">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-purple-400">
                {t.prospectCandidates} ({filteredProspects.length})
              </h2>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyHighPriority}
                    onChange={(e) => setShowOnlyHighPriority(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 checked:bg-orange-500 focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-sm text-white/70">{t.showOnlyHighPriority}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTestProspects}
                    onChange={(e) => setShowTestProspects(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 checked:bg-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-white/70">{t.showTestProspects}</span>
                </label>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-white/60">
              <div className="inline-block w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
              <p>{t.loading}</p>
            </div>
          ) : filteredProspects.length === 0 ? (
            <div className="p-8 text-center text-white/60">
              <p>{prospects.length === 0 ? t.noProspects : t.noHighPriorityFound}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      {t.businessName}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      {t.industry}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      {t.region}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      {t.score}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      {t.status}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      {t.website}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      {t.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredProspects.map((prospect) => (
                    <tr key={prospect.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-white">{prospect.business_name}</div>
                          {prospect.is_test && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-white/50 border border-white/20">
                              {t.testDataLabel}
                            </span>
                          )}
                          {isHighPriority(prospect.automation_need_score) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/40">
                              {t.highPriorityBadge}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white/70">{translateIndustry(prospect.industry)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white/70">{prospect.region || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${getScoreColor(prospect.automation_need_score)}`}>
                          {prospect.automation_need_score || 'N/A'}/100
                        </div>
                        <div className="text-xs text-white/50">
                          {getScoreLabel(prospect.automation_need_score)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            prospect.contacted
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {prospect.contacted ? t.contacted : t.notContacted}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <a
                            href={prospect.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            {prospect.website.replace(/^https?:\/\//, '')}
                          </a>
                          {/* Form Scan Indicators */}
                          {prospect.metadata?.form_scan && (
                            <div className="flex gap-1 text-xs">
                              {prospect.metadata.form_scan.has_form && (
                                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400" title="Has contact form">
                                  📝 Form
                                </span>
                              )}
                              {prospect.contact_email && (
                                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400" title={`Email: ${prospect.contact_email}`}>
                                  ✉️ Email
                                </span>
                              )}
                              {!prospect.contact_email && prospect.metadata.form_scan.has_mailto && (
                                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400" title="Mailto link found but no valid email extracted">
                                  ⚠️ No Email
                                </span>
                              )}
                              {prospect.metadata.form_scan.has_captcha && (
                                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400" title="Has CAPTCHA">
                                  🛡️ CAPTCHA
                                </span>
                              )}
                              {prospect.metadata.form_scan.recommended_approach && (
                                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400" title={`Recommended: ${prospect.metadata.form_scan.recommended_approach}`}>
                                  {prospect.metadata.form_scan.recommended_approach === 'form-response-bot' ? '🤖' : 
                                   prospect.metadata.form_scan.recommended_approach === 'email' ? '📧' : '👤'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEmailPreview(prospect)}
                            disabled={prospect.contacted}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                              prospect.contacted
                                ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                                : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-400/50'
                            }`}
                            title={prospect.contacted ? t.outreachSent : t.sendOutreach}
                          >
                            {prospect.contacted ? t.outreachSent : t.sendOutreach}
                          </button>
                          <button
                            onClick={() => handleOpenProofModal(prospect)}
                            className="px-3 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-400/50 transition-all"
                            title={t.viewProof}
                          >
                            {t.viewProof}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      {selectedProspect && (
        <>
          <ProspectProofModal
            isOpen={proofModalOpen}
            onClose={() => {
              setProofModalOpen(false);
              setSelectedProspect(null);
            }}
            prospectId={selectedProspect.id}
          />
          
          <EmailPreviewModal
            isOpen={emailPreviewModalOpen}
            onClose={() => {
              setEmailPreviewModalOpen(false);
              setSelectedProspect(null);
            }}
            prospect={{
              id: selectedProspect.id,
              business_name: selectedProspect.business_name,
              website: selectedProspect.website,
              contact_email: selectedProspect.contact_email,
              industry: selectedProspect.industry || 'Unknown',
            }}
            testMode={config.testMode}
            onSendSuccess={handleEmailSendSuccess}
            onSendError={handleEmailSendError}
          />
        </>
      )}
    </div>
  );
}
