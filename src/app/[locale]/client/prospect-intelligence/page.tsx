"use client";

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSession } from '../../../../components/SessionProvider';
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
  
  const [prospects, setProspects] = useState<ProspectCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [config, setConfig] = useState<any>(null);

  const t = {
    title: isFrench ? 'Intelligence de Prospection' : 'Prospect Intelligence',
    subtitle: isFrench ? 'Découvrez et analysez vos prospects idéaux' : 'Discover and analyze your ideal prospects',
    backToDashboard: isFrench ? '← Retour au tableau de bord' : '← Back to Dashboard',
    logout: isFrench ? 'Déconnexion' : 'Logout',
    loading: isFrench ? 'Chargement...' : 'Loading...',
    error: isFrench ? 'Erreur lors du chargement des données' : 'Error loading data',
    noData: isFrench ? 'Aucune donnée disponible' : 'No data available',
    noIcpData: isFrench ? 'Veuillez configurer votre profil client idéal dans les paramètres pour activer cette fonctionnalité.' : 'Please configure your ideal client profile in settings to enable this feature.',
    scanProspects: isFrench ? 'Scanner les Prospects' : 'Scan Prospects',
    scanning: isFrench ? 'Scan en cours...' : 'Scanning...',
    prospectsFound: isFrench ? 'Prospects Trouvés' : 'Prospects Found',
    highPriority: isFrench ? 'Priorité Élevée' : 'High Priority',
    businessName: isFrench ? 'Nom de l\'Entreprise' : 'Business Name',
    website: isFrench ? 'Site Web' : 'Website',
    industry: isFrench ? 'Industrie' : 'Industry',
    region: isFrench ? 'Région' : 'Region',
    responseScore: isFrench ? 'Score de Réponse' : 'Response Score',
    automationScore: isFrench ? 'Score d\'Automatisation' : 'Automation Score',
    lastTested: isFrench ? 'Dernier Test' : 'Last Tested',
    contactEmail: isFrench ? 'Email de Contact' : 'Contact Email',
    noContactEmail: isFrench ? 'Aucun email trouvé' : 'No email found',
    testMode: isFrench ? 'Mode Test' : 'Test Mode',
    liveData: isFrench ? 'Données en Direct' : 'Live Data',
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
      console.log('[ClientProspectIntelligence] Fetching config for client:', session.client.clientId);
      
      const response = await fetch(`/api/client/prospect-intelligence/config?clientId=${session.client.clientId}`);
      const json = await response.json();

      if (json.success) {
        setConfig(json.data);
        console.log('[ClientProspectIntelligence] ✅ Config loaded successfully');
      } else {
        console.error('[ClientProspectIntelligence] ❌ Config error:', json.error);
      }
    } catch (err) {
      console.error('[ClientProspectIntelligence] ❌ Config fetch error:', err);
    }
  };

  const loadProspects = async () => {
    if (!session.client) return;
    
    try {
      setLoading(true);
      setError(null);

      console.log('[ClientProspectIntelligence] Loading prospects for client:', session.client.clientId);
      
      const response = await fetch(`/api/client/prospect-intelligence/prospects?clientId=${session.client.clientId}`);
      const json = await response.json();

      if (json.success) {
        setProspects(json.data || []);
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

  const handleScanProspects = async () => {
    if (!session.client || !config) return;
    
    try {
      setScanning(true);
      setError(null);

      console.log('[ClientProspectIntelligence] Starting prospect scan for client:', session.client.clientId);
      
      const scanConfig = {
        maxResults: parseInt(String(config.maxResults || '10'), 10) || 10,
        useClientIcp: true, // Use client's own ICP data
      };

      const response = await fetch('/api/client/prospect-intelligence/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scanConfig,
          clientId: session.client.clientId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setScanResult(data.data);
        console.log('[ClientProspectIntelligence] ✅ Scan completed successfully');
        // Reload prospects after scan
        await loadProspects();
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

  function handleLogout() {
    console.log('[ClientProspectIntelligence] Logging out user...');
    clearSessionContext();
    router.push(`/${locale}/client/login`);
  }

  // Redirect if not authenticated
  if (!session.isAuthenticated || !session.client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  // Check if client has ICP data (will be determined by config fetch)
  const hasIcpData = config && config.hasIcpData === true;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
              <p className="text-white/60">{session.client.businessName}</p>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/60">{t.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
              <p className="text-white/60">{session.client.businessName}</p>
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
            <div className="text-red-400 text-xl mb-4">⚠️</div>
            <p className="text-white/60 mb-4">{error}</p>
            <button
              onClick={loadProspects}
              className="px-6 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all"
            >
              {isFrench ? 'Réessayer' : 'Retry'}
            </button>
          </div>
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
              <p className="text-white/60">{session.client.businessName}</p>
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
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
            <p className="text-white/60">{session.client.businessName}</p>
            <p className="text-white/40 text-sm">{t.subtitle}</p>
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
        </motion.div>

        {/* Scan Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t.scanProspects}</h3>
              <p className="text-white/60 text-sm">
                {isFrench 
                  ? 'Utilise votre profil client idéal pour trouver des prospects parfaitement adaptés'
                  : 'Use your ideal client profile to find perfectly matched prospects'
                }
              </p>
            </div>
            <button
              onClick={handleScanProspects}
              disabled={scanning}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                scanning
                  ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
              }`}
            >
              {scanning ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t.scanning}
                </span>
              ) : (
                t.scanProspects
              )}
            </button>
          </div>
        </motion.div>

        {/* Scan Results */}
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8"
          >
            <h3 className="text-lg font-semibold mb-4 text-green-400">Scan Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{scanResult.totalCrawled}</div>
                <div className="text-white/60 text-sm">Crawled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{scanResult.totalTested}</div>
                <div className="text-white/60 text-sm">Tested</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{scanResult.totalScored}</div>
                <div className="text-white/60 text-sm">Scored</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{scanResult.highPriorityProspects.length}</div>
                <div className="text-white/60 text-sm">{t.highPriority}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Prospects List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">{t.prospectsFound} ({prospects.length})</h3>
            <button
              onClick={loadProspects}
              className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all text-sm"
            >
              {isFrench ? 'Actualiser' : 'Refresh'}
            </button>
          </div>

          {prospects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-white/40 text-4xl mb-4">🔍</div>
              <p className="text-white/60">{t.noData}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prospects.map((prospect) => (
                <div
                  key={prospect.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-white">{prospect.business_name}</h4>
                        {prospect.is_test && (
                          <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                            {t.testMode}
                          </span>
                        )}
                        {!prospect.is_test && (
                          <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/40">
                            {t.liveData}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-white/60">{t.website}:</span>
                          <div className="text-white">
                            <a 
                              href={prospect.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              {prospect.website}
                            </a>
                          </div>
                        </div>
                        
                        {prospect.industry && (
                          <div>
                            <span className="text-white/60">{t.industry}:</span>
                            <div className="text-white">{prospect.industry}</div>
                          </div>
                        )}
                        
                        {prospect.region && (
                          <div>
                            <span className="text-white/60">{t.region}:</span>
                            <div className="text-white">{prospect.region}</div>
                          </div>
                        )}
                        
                        <div>
                          <span className="text-white/60">{t.contactEmail}:</span>
                          <div className="text-white">
                            {prospect.contact_email ? (
                              <a 
                                href={`mailto:${prospect.contact_email}`}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                {prospect.contact_email}
                              </a>
                            ) : (
                              <span className="text-white/40">{t.noContactEmail}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {(prospect.response_score || prospect.automation_need_score) && (
                        <div className="flex gap-4 mt-3">
                          {prospect.response_score && (
                            <div className="flex items-center gap-2">
                              <span className="text-white/60 text-sm">{t.responseScore}:</span>
                              <div className="w-16 bg-white/10 rounded-full h-2">
                                <div 
                                  className="bg-green-400 h-2 rounded-full" 
                                  style={{ width: `${prospect.response_score * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-white text-sm font-medium">
                                {Math.round(prospect.response_score * 100)}%
                              </span>
                            </div>
                          )}
                          
                          {prospect.automation_need_score && (
                            <div className="flex items-center gap-2">
                              <span className="text-white/60 text-sm">{t.automationScore}:</span>
                              <div className="w-16 bg-white/10 rounded-full h-2">
                                <div 
                                  className="bg-purple-400 h-2 rounded-full" 
                                  style={{ width: `${prospect.automation_need_score * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-white text-sm font-medium">
                                {Math.round(prospect.automation_need_score * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
