"use client";

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSession } from '../../../../components/SessionProvider';
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
  is_test?: boolean;
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

export default function ClientProspectIntelligencePage() {
  const locale = useLocale();
  const router = useRouter();
  const isFrench = locale === 'fr';
  const { session, clearSession: clearSessionContext } = useSession();

  const [scanning, setScanning] = useState(false);
  const [prospects, setProspects] = useState<ProspectCandidate[]>([]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showOnlyHighPriority, setShowOnlyHighPriority] = useState(false);
  const [hideTestProspects, setHideTestProspects] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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

  // Configuration state (derived from client's ICP data)
  const [config, setConfig] = useState({
    industries: [] as string[],
    regions: [] as string[],
    minScore: 70 as number,
    maxResults: 20 as number,
    testMode: false, // Client version should use live data
    usePdl: false,
    scanForms: true
  });

  // Client ICP configuration
  const [clientConfig, setClientConfig] = useState<any>(null);

  const t = {
    title: isFrench ? 'Intelligence de Prospection' : 'Prospect Intelligence',
    subtitle: isFrench ? 'Découvrez et analysez vos prospects idéaux basés sur votre profil client' : 'Discover and analyze your ideal prospects based on your client profile',
    backToDashboard: isFrench ? '← Retour au tableau de bord' : '← Back to Dashboard',
    logout: isFrench ? 'Déconnexion' : 'Logout',
    loading: isFrench ? 'Chargement...' : 'Loading...',
    error: isFrench ? 'Erreur lors du chargement des données' : 'Error loading data',
    noData: isFrench ? 'Aucune donnée disponible' : 'No data available',
    noIcpData: isFrench ? 'Veuillez configurer votre profil client idéal dans les paramètres pour activer cette fonctionnalité.' : 'Please configure your ideal client profile in settings to enable this feature.',
    configuration: isFrench ? 'Configuration' : 'Configuration',
    industries: isFrench ? 'Industries' : 'Industries',
    regions: isFrench ? 'Régions' : 'Regions',
    minScore: isFrench ? 'Score Minimum' : 'Min Score',
    maxResults: isFrench ? 'Résultats Maximum' : 'Max Results',
    testMode: isFrench ? 'Mode Test' : 'Test Mode',
    scanForms: isFrench ? 'Scanner les formulaires' : 'Scan Forms',
    scanButton: isFrench ? '🧠 Lancer un scan de prospects' : '🧠 Run Prospect Scan',
    scanning: isFrench ? 'Scan en cours...' : 'Scanning...',
    latestResults: isFrench ? 'Derniers Résultats' : 'Latest Results',
    simulateFeedback: isFrench ? 'Simuler Feedback' : 'Simulate Feedback',
    refreshButton: isFrench ? '📊 Actualiser les statistiques' : '📊 Refresh Metrics',
    refreshing: isFrench ? 'Actualisation...' : 'Refreshing...',
    totalCrawled: isFrench ? 'Total Crawlé' : 'Total Crawled',
    totalTested: isFrench ? 'Total Testé' : 'Total Tested',
    totalScored: isFrench ? 'Total Scoré' : 'Total Scored',
    totalContacted: isFrench ? 'Total Contacté' : 'Total Contacted',
    errors: isFrench ? 'Erreurs' : 'Errors',
    prospectCandidates: isFrench ? 'Candidats Prospects' : 'Prospect Candidates',
    showOnlyHighPriority: isFrench ? 'Afficher seulement haute priorité' : 'Show Only High Priority',
    hideTestProspects: isFrench ? 'Masquer les données de test' : 'Hide Test Data',
    businessName: isFrench ? 'Nom de l\'Entreprise' : 'Business Name',
    industry: isFrench ? 'Industrie' : 'Industry',
    region: isFrench ? 'Région' : 'Region',
    score: isFrench ? 'Score' : 'Score',
    status: isFrench ? 'Statut' : 'Status',
    website: isFrench ? 'Site Web' : 'Website',
    actions: isFrench ? 'Actions' : 'Actions',
    testDataLabel: isFrench ? 'Test' : 'Test',
    highPriorityBadge: isFrench ? 'Haute Priorité' : 'High Priority',
    contacted: isFrench ? 'Contacté' : 'Contacted',
    notContacted: isFrench ? 'Non Contacté' : 'Not Contacted',
    viewProof: isFrench ? '📊 Voir preuve' : '📊 View Proof',
    sendOutreach: isFrench ? 'Envoyer Outreach' : 'Send Outreach',
    noProspects: isFrench ? 'Aucun prospect trouvé' : 'No prospects found',
    noHighPriorityFound: isFrench ? 'Aucun prospect haute priorité trouvé' : 'No high priority prospects found',
    urgent: isFrench ? 'Urgent' : 'Urgent',
    high: isFrench ? 'Élevé' : 'High',
    medium: isFrench ? 'Moyen' : 'Medium',
    low: isFrench ? 'Faible' : 'Low',
    previous: isFrench ? 'Précédent' : 'Previous',
    next: isFrench ? 'Suivant' : 'Next',
    page: isFrench ? 'Page' : 'Page',
    of: isFrench ? 'de' : 'of'
  };

  // Check authentication and fetch data
  useEffect(() => {
    if (!session.isAuthenticated || !session.client) {
      console.log('[ClientProspectIntelligence] Not authenticated, redirecting to login');
      router.push(`/${locale}/client/login`);
      return;
    }

    fetchConfig();
    loadProspects();
  }, [session, locale, router]);

  const fetchConfig = async () => {
    if (!session.client) return;
    
    try {
      console.log('[ClientProspectIntelligence] Fetching config for client:', session.client?.clientId);
      
      const response = await fetch(`/api/client/prospect-intelligence/config?clientId=${session.client?.clientId}`);
      const json = await response.json();

      if (json.success) {
        setClientConfig(json.data);
        
        // Update config based on client's ICP data
        setConfig({
          industries: json.data.industries || [],
          regions: ['CA'], // Default region for client
          minScore: json.data.minScore || 70,
          maxResults: json.data.maxProspects || 20,
          testMode: false, // Client version uses live data
          usePdl: false, // Client version doesn't use PDL
          scanForms: true
        });
        
        console.log('[ClientProspectIntelligence] ✅ Config loaded successfully');
      } else {
        console.error('[ClientProspectIntelligence] ❌ Config error:', json.error);
        setError(json.error || t.error);
      }
    } catch (err) {
      console.error('[ClientProspectIntelligence] ❌ Config fetch error:', err);
      setError(t.error);
    }
  };

  const loadProspects = async () => {
    if (!session.client) return;
    
    try {
      setLoading(true);
      setError(null);

      console.log('[ClientProspectIntelligence] Loading prospects for client:', session.client?.clientId);
      
      const response = await fetch(`/api/client/prospect-intelligence/prospects?clientId=${session.client?.clientId}`);
      const json = await response.json();

      if (json.success) {
        setProspects(json.data || []);
        
        // Calculate metrics from prospects
        const highPriorityCount = (json.data || []).filter((p: ProspectCandidate) => (p.automation_need_score || 0) >= 70).length;
        setMetrics({
          totalCrawled: (json.data || []).length,
          totalTested: (json.data || []).filter((p: ProspectCandidate) => p.last_tested).length,
          totalScored: (json.data || []).filter((p: ProspectCandidate) => p.automation_need_score).length,
          totalContacted: (json.data || []).filter((p: ProspectCandidate) => p.contacted).length,
          highPriorityCount
        });
        
        console.log('[ClientProspectIntelligence] ✅ Prospects loaded successfully');
      } else {
        setError(json.error || t.error);
        console.error('[ClientProspectIntelligence] ❌ Prospects error:', json.error);
      }
    } catch (err) {
      console.error('[ClientProspectIntelligence] ❌ Prospects fetch error:', err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (!session.client || !clientConfig) return;
    
    try {
      setScanning(true);
      setError(null);

      console.log('[ClientProspectIntelligence] Starting prospect scan for client:', session.client?.clientId);
      
      const scanConfig = {
        maxResults: config.maxResults,
        industries: config.industries,
        regions: config.regions,
        minScore: config.minScore,
        testMode: config.testMode,
        usePdl: config.usePdl,
        scanForms: config.scanForms,
        clientId: session.client?.clientId // Scope to client
      };

      const response = await fetch('/api/client/prospect-intelligence/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scanConfig),
      });

      const data = await response.json();

      if (data.success) {
        setScanResult(data.data);
        setToastMessage(data.message || 'Scan completed successfully!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        
        // Refresh prospects after scan
        await loadProspects();
        
        console.log('[ClientProspectIntelligence] ✅ Scan completed successfully');
      } else {
        setError(data.error || 'Scan failed');
        console.error('[ClientProspectIntelligence] ❌ Scan error:', data.error);
      }
    } catch (err) {
      console.error('[ClientProspectIntelligence] ❌ Scan error:', err);
      setError('Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProspects();
    setRefreshing(false);
  };

  const handleSimulateFeedback = async () => {
    setGeneratingProof(true);
    // Simulate proof generation
    setTimeout(() => {
      setGeneratingProof(false);
      setToastMessage('Proof generated successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 2000);
  };

  const handleLogout = () => {
    console.log('[ClientProspectIntelligence] Logging out user...');
    clearSessionContext();
    router.push(`/${locale}/client/login`);
  };

  const translateIndustry = (industry: string | undefined) => {
    if (!industry) return 'N/A';
    const industryTranslations: Record<string, string> = {
      'technology': isFrench ? 'Technologie' : 'Technology',
      'construction': isFrench ? 'Construction' : 'Construction',
      'real_estate': isFrench ? 'Immobilier' : 'Real Estate',
      'marketing': isFrench ? 'Marketing' : 'Marketing',
      'consulting': isFrench ? 'Conseil' : 'Consulting',
      'healthcare': isFrench ? 'Santé' : 'Healthcare',
      'finance': isFrench ? 'Finance' : 'Finance',
      'education': isFrench ? 'Éducation' : 'Education',
      'retail': isFrench ? 'Commerce de détail' : 'Retail',
      'manufacturing': isFrench ? 'Fabrication' : 'Manufacturing'
    };
    
    if (isFrench && industryTranslations[industry]) {
      return industryTranslations[industry];
    }
    return industry;
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
  let filteredProspects = hideTestProspects 
    ? (prospects || []).filter(p => !p.is_test)
    : (prospects || []);

  if (showOnlyHighPriority) {
    filteredProspects = filteredProspects.filter(p => isHighPriority(p.automation_need_score));
  }

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredProspects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProspects = filteredProspects.slice(startIndex, startIndex + itemsPerPage);

  // Check if client has ICP data
  const hasIcpData = clientConfig && clientConfig.hasIcpData === true;

  if (loading && !clientConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!hasIcpData) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
              <p className="text-white/60">{session.client?.businessName ?? ''}</p>
            </div>
            <div className="flex items-center gap-3">
              <UniversalLanguageToggle />
              <a
                href={`/${locale}/client/dashboard`}
                className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all text-sm"
              >
                {t.backToDashboard}
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all text-sm"
              >
                {t.logout}
              </button>
            </div>
          </div>
          
          <div className="text-center py-20">
            <div className="text-blue-400 text-6xl mb-6">🧠</div>
            <h2 className="text-2xl font-bold mb-4">{t.title}</h2>
            <p className="text-white/60 mb-6 max-w-md mx-auto">{t.noIcpData}</p>
            <a
              href={`/${locale}/client/settings`}
              className="inline-block px-6 py-3 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all"
            >
              {isFrench ? 'Configurer le Profil Client' : 'Configure Client Profile'}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-4 sm:p-8">
      {/* Universal Language Toggle */}
      <UniversalLanguageToggle />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <a
            href={`/${locale}/client/dashboard`}
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors mb-4"
          >
            {t.backToDashboard}
          </a>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-white/60">{t.subtitle}</p>
          <p className="text-white/50 text-sm mt-1">{session.client?.businessName ?? ''}</p>
          
          {/* Data Source Indicator */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-white/50">Data Source:</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              prospects && prospects.length > 0 && prospects[0]?.metadata?.source === 'pdl' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
            }`}>
              {prospects && prospects.length > 0 && prospects[0]?.metadata?.source === 'pdl' ? 'PDL (Live)' : 'Simulated'}
            </span>
          </div>
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
                readOnly
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white/70 cursor-not-allowed"
              />
              <p className="text-xs text-white/50 mt-1">
                {isFrench ? 'Basé sur votre profil client' : 'Based on your client profile'}
              </p>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">{t.regions}</label>
              <input
                type="text"
                value={config.regions.join(', ')}
                readOnly
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white/70 cursor-not-allowed"
              />
              <p className="text-xs text-white/50 mt-1">
                {isFrench ? 'Région par défaut' : 'Default region'}
              </p>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">{t.minScore}</label>
              <input
                type="number"
                value={config.minScore}
                readOnly
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white/70 cursor-not-allowed"
              />
              <p className="text-xs text-white/50 mt-1">
                {isFrench ? 'Calculé automatiquement' : 'Auto-calculated'}
              </p>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">{t.maxResults}</label>
              <input
                type="number"
                value={config.maxResults}
                readOnly
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white/70 cursor-not-allowed"
              />
              <p className="text-xs text-white/50 mt-1">
                {isFrench ? 'Limite recommandée' : 'Recommended limit'}
              </p>
            </div>

            <div className="flex items-end">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.scanForms}
                  readOnly
                  className="mr-2"
                />
                <span className="text-sm text-white/70">{t.scanForms}</span>
              </label>
            </div>
          </div>

          {/* Client ICP Info */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg text-xs text-white/70">
            <p className="font-semibold text-blue-400 mb-1">
              {isFrench ? '📊 Profil Client Configuré :' : '📊 Client Profile Configured:'}
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>{isFrench ? 'Type de client cible :' : 'Target client type:'}</strong> {clientConfig?.targetClientType || 'N/A'}
              </li>
              <li>
                <strong>{isFrench ? 'Taille de transaction moyenne :' : 'Average deal size:'}</strong> {clientConfig?.averageDealSize || 'N/A'}
              </li>
              <li>
                <strong>{isFrench ? 'Objectif principal :' : 'Main business goal:'}</strong> {clientConfig?.mainBusinessGoal || 'N/A'}
              </li>
              <li>
                <strong>{isFrench ? 'Défi principal :' : 'Biggest challenge:'}</strong> {clientConfig?.biggestChallenge || 'N/A'}
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

        {/* Metrics Summary */}
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
                    checked={hideTestProspects}
                    onChange={(e) => setHideTestProspects(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 checked:bg-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-white/70">{t.hideTestProspects}</span>
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
              <p>{(prospects || []).length === 0 ? t.noProspects : t.noHighPriorityFound}</p>
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
                  {paginatedProspects.map((prospect) => (
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
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedProspect(prospect);
                              setProofModalOpen(true);
                            }}
                            className="px-3 py-1 text-xs bg-purple-500/20 border border-purple-400/50 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
                          >
                            {t.viewProof}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProspect(prospect);
                              setEmailPreviewModalOpen(true);
                            }}
                            disabled={sendingOutreach[prospect.id]}
                            className={`px-3 py-1 text-xs border rounded transition-colors ${
                              sendingOutreach[prospect.id]
                                ? 'bg-gray-500/20 border-gray-400/50 text-gray-400 cursor-not-allowed'
                                : 'bg-green-500/20 border-green-400/50 text-green-400 hover:bg-green-500/30'
                            }`}
                          >
                            {sendingOutreach[prospect.id] ? 'Sending...' : t.sendOutreach}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/60">
                  {t.page} {currentPage} {t.of} {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm bg-white/10 border border-white/20 text-white rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.previous}
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm bg-white/10 border border-white/20 text-white rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.next}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      {proofModalOpen && selectedProspect && (
        <ProspectProofModal
          prospectId={selectedProspect.id}
          isOpen={proofModalOpen}
          onClose={() => setProofModalOpen(false)}
        />
      )}

      {emailPreviewModalOpen && selectedProspect && (
        <EmailPreviewModal
          prospect={{
            id: selectedProspect.id,
            business_name: selectedProspect.business_name,
            website: selectedProspect.website,
            contact_email: selectedProspect.contact_email,
            industry: selectedProspect.industry || 'Unknown'
          }}
          isOpen={emailPreviewModalOpen}
          onClose={() => setEmailPreviewModalOpen(false)}
          testMode={false}
          onSendSuccess={() => {
            setToastMessage('Email sent successfully!');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
          }}
          onSendError={(error) => {
            setError(error);
          }}
        />
      )}
    </div>
  );
}