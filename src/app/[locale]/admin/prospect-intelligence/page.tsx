"use client";

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import UniversalLanguageToggle from '../../../../components/UniversalLanguageToggle';

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
  created_at: string;
  last_tested?: string;
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
  const [sendingOutreach, setSendingOutreach] = useState<Record<string, boolean>>({});
  const [generatingProof, setGeneratingProof] = useState(false);
  
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
    testMode: true
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

  // Load existing prospects on mount
  useEffect(() => {
    loadProspects();
  }, []);

  const loadProspects = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[ProspectDashboard] Loading prospects from Supabase...');
      
      const response = await fetch('/api/prospect-intelligence/prospects');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load prospects');
      }

      console.log('[ProspectDashboard] ✅ Prospects loaded');
      console.log('[ProspectDashboard] Total:', data.data.prospects.length);

      setProspects(data.data.prospects || []);
      setMetrics(data.data.metrics || {
        totalCrawled: 0,
        totalTested: 0,
        totalScored: 0,
        totalContacted: 0,
        highPriorityCount: 0
      });

      setLoading(false);
    } catch (err) {
      console.error('[ProspectDashboard] ❌ Error loading prospects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load prospects');
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

  const handleSendOutreach = async (prospectId: string, businessName: string) => {
    console.log('[ProspectDashboard] Sending outreach to:', businessName);
    
    setSendingOutreach(prev => ({ ...prev, [prospectId]: true }));

    try {
      const response = await fetch('/api/prospect-intelligence/outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospectId,
          testMode: true
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send outreach');
      }

      console.log('[ProspectDashboard] ✅ Outreach sent');
      setToastMessage(isFrench ? `✅ E-mail envoyé à ${businessName}` : `✅ Outreach sent to ${businessName}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // Reload prospects to update contacted status
      await loadProspects();
    } catch (err) {
      console.error('[ProspectDashboard] ❌ Error sending outreach:', err);
      setError(err instanceof Error ? err.message : 'Failed to send outreach');
    } finally {
      setSendingOutreach(prev => ({ ...prev, [prospectId]: false }));
    }
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
  const filteredProspects = showOnlyHighPriority
    ? prospects.filter(p => isHighPriority(p.automation_need_score))
    : prospects;

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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-8 right-8 z-50 bg-green-500/20 border border-green-400/50 text-green-400 px-6 py-3 rounded-lg shadow-lg"
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
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyHighPriority}
                  onChange={(e) => setShowOnlyHighPriority(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 checked:bg-orange-500 focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-sm text-white/70">{t.showOnlyHighPriority}</span>
              </label>
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
                        <a
                          href={prospect.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {prospect.website.replace(/^https?:\/\//, '')}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSendOutreach(prospect.id, prospect.business_name)}
                            disabled={sendingOutreach[prospect.id] || prospect.contacted}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                              prospect.contacted
                                ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                                : sendingOutreach[prospect.id]
                                ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                                : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-400/50'
                            }`}
                            title={prospect.contacted ? t.outreachSent : t.sendOutreach}
                          >
                            {sendingOutreach[prospect.id] ? (
                              <span className="flex items-center gap-1">
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                {t.sending}
                              </span>
                            ) : prospect.contacted ? (
                              t.outreachSent
                            ) : (
                              t.sendOutreach
                            )}
                          </button>
                          <button
                            onClick={() => handleViewProofVisuals(prospect.id)}
                            disabled={generatingProof}
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
    </div>
  );
}

