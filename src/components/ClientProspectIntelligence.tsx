"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSession } from './SessionProvider';

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

interface ICPConfig {
  hasIcpData: boolean;
  targetClientType?: string;
  averageDealSize?: string;
  mainBusinessGoal?: string;
  biggestChallenge?: string;
  industries: string[];
  minScore: number;
  maxProspects: number;
  clientInfo: {
    businessName: string;
    industryCategory?: string;
    primaryService?: string;
    clientId: string;
  };
}

export default function ClientProspectIntelligence() {
  const locale = useLocale();
  const router = useRouter();
  const { session } = useSession();
  const isFrench = locale === 'fr';

  const [config, setConfig] = useState<ICPConfig | null>(null);
  const [prospects, setProspects] = useState<ProspectCandidate[]>([]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Translations
  const t = {
    title: isFrench ? 'Intelligence de Prospection' : 'Prospect Intelligence',
    subtitle: isFrench ? 'Découvrez et analysez des prospects basés sur votre profil d\'entreprise' : 'Discover and analyze prospects based on your business profile',
    noIcpData: {
      title: isFrench ? 'Aucune Donnée ICP Trouvée' : 'No ICP Data Found',
      message: isFrench ? 'Veuillez mettre à jour vos préférences d\'entreprise dans les paramètres de votre compte pour activer l\'intelligence de prospection.' : 'Please update your business preferences in your account settings to enable prospect intelligence.',
      button: isFrench ? 'Mettre à Jour les Paramètres' : 'Update Settings'
    },
    scan: {
      title: isFrench ? 'Démarrer l\'Analyse de Prospects' : 'Start Prospect Scan',
      button: isFrench ? 'Analyser les Prospects' : 'Scan Prospects',
      scanning: isFrench ? 'Analyse en cours...' : 'Scanning...',
      description: isFrench ? 'Découvrez des prospects qui correspondent à votre profil de client idéal' : 'Discover prospects that match your ideal client profile'
    },
    results: {
      title: isFrench ? 'Résultats de Prospection' : 'Prospect Results',
      totalFound: isFrench ? 'Total de Prospects Trouvés' : 'Total Prospects Found',
      highPriority: isFrench ? 'Prospects Priorité Haute' : 'High Priority Prospects',
      averageScore: isFrench ? 'Score Moyen' : 'Average Score',
      lastScan: isFrench ? 'Dernière Analyse' : 'Last Scan'
    },
    prospects: {
      title: isFrench ? 'Prospects' : 'Prospects',
      businessName: isFrench ? 'Nom de l\'Entreprise' : 'Business Name',
      website: isFrench ? 'Site Web' : 'Website',
      industry: isFrench ? 'Industrie' : 'Industry',
      score: isFrench ? 'Score' : 'Score',
      status: isFrench ? 'Statut' : 'Status',
      actions: isFrench ? 'Actions' : 'Actions'
    }
  };

  // Load client configuration on mount
  useEffect(() => {
    loadClientConfig();
  }, []);

  const loadClientConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.client?.clientId) {
        setError('Client authentication required');
        return;
      }

      const response = await fetch('/api/client/prospect-intelligence/config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': session.client.apiKey
        }
      });

      const result = await response.json();

      if (result.success) {
        setConfig(result.data);
        if (result.data.hasIcpData) {
          loadProspects();
        }
      } else {
        setError(result.message || 'Failed to load configuration');
      }
    } catch (err) {
      console.error('Failed to load client config:', err);
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadProspects = async () => {
    try {
      if (!session?.client?.clientId) return;

      const response = await fetch('/api/client/prospect-intelligence/prospects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': session.client.apiKey
        }
      });

      const result = await response.json();

      if (result.data) {
        setProspects(result.data);
      }
    } catch (err) {
      console.error('Failed to load prospects:', err);
    }
  };

  const startProspectScan = async () => {
    try {
      setScanning(true);
      setError(null);

      if (!session?.client?.clientId) {
        setError('Client authentication required');
        return;
      }

      const response = await fetch('/api/client/prospect-intelligence/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': session.client.apiKey
        },
        body: JSON.stringify({
          clientId: session.client.clientId
        })
      });

      const result = await response.json();

      if (result.success) {
        setScanResult(result.data);
        // Reload prospects after scan
        await loadProspects();
      } else {
        setError(result.message || 'Scan failed');
      }
    } catch (err) {
      console.error('Failed to start prospect scan:', err);
      setError('Failed to start prospect scan');
    } finally {
      setScanning(false);
    }
  };

  const handleUpdateSettings = () => {
    const settingsPath = isFrench ? '/fr/client/settings' : '/en/client/settings';
    router.push(settingsPath);
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-white/10 rounded w-2/3 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded w-5/6"></div>
            <div className="h-4 bg-white/10 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // No ICP data state
  if (!config?.hasIcpData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-lg p-8 text-center"
      >
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-white mb-3">
            {t.noIcpData.title}
          </h3>
          <p className="text-white/70 mb-6">
            {t.noIcpData.message}
          </p>
          <button
            onClick={handleUpdateSettings}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105"
          >
            {t.noIcpData.button}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-2">{t.title}</h2>
        <p className="text-white/70 mb-4">{t.subtitle}</p>
        
        {/* ICP Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white/90 mb-2">
              {isFrench ? 'Objectif Commercial' : 'Business Goal'}
            </h4>
            <p className="text-white/70">{config.mainBusinessGoal || 'Not specified'}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white/90 mb-2">
              {isFrench ? 'Industries Ciblées' : 'Target Industries'}
            </h4>
            <p className="text-white/70">{config.industries.join(', ')}</p>
          </div>
        </div>

        {/* Scan Button */}
        <button
          onClick={startProspectScan}
          disabled={scanning}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {scanning ? t.scan.scanning : t.scan.button}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* Scan Results */}
      {scanResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4">{t.results.title}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{scanResult.totalCrawled}</div>
              <div className="text-sm text-white/70">{t.results.totalFound}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{scanResult.highPriorityProspects.length}</div>
              <div className="text-sm text-white/70">{t.results.highPriority}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {scanResult.highPriorityProspects.length > 0 
                  ? Math.round(scanResult.highPriorityProspects.reduce((sum, p) => sum + (p.automation_need_score || 0), 0) / scanResult.highPriorityProspects.length)
                  : 0
                }
              </div>
              <div className="text-sm text-white/70">{t.results.averageScore}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{scanResult.totalContacted}</div>
              <div className="text-sm text-white/70">{isFrench ? 'Contactés' : 'Contacted'}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Prospects List */}
      {prospects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4">{t.prospects.title}</h3>
          <div className="space-y-3">
            {prospects.slice(0, 10).map((prospect) => (
              <div
                key={prospect.id}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{prospect.business_name}</h4>
                    <p className="text-sm text-white/70">{prospect.website}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                        {prospect.industry || 'Unknown'}
                      </span>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        Score: {prospect.automation_need_score || 0}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white/70">
                      {new Date(prospect.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
