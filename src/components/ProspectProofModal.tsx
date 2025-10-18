'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface ProofData {
  success: boolean;
  simulated: boolean;
  prospect: {
    id: string;
    business_name: string;
    website: string;
    industry: string;
    region: string;
    automation_need_score: number;
    contacted: boolean;
    created_at: string;
  };
  proof: {
    has_form: boolean;
    form_count: number;
    has_mailto: boolean;
    has_captcha: boolean;
    submit_method: string | null;
    recommended_approach: string;
    response_time: string;
    screenshot_url: string | null;
    contact_paths: string[];
    scanned_at: string | null;
  };
  raw_metadata: Record<string, any>;
}

interface ProspectProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospectId: string;
}

export default function ProspectProofModal({ isOpen, onClose, prospectId }: ProspectProofModalProps) {
  const pathname = usePathname?.() || '';
  const locale = pathname.startsWith('/fr') ? 'fr' : 'en';
  const isFrench = locale === 'fr';
  
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(true);

  useEffect(() => {
    if (isOpen && prospectId) {
      console.log('[ProofModal] Opening for prospect:', prospectId);
      fetchProof();
    }

    return () => {
      if (!isOpen) {
        console.log('[ProofModal] Closed');
      }
    };
  }, [isOpen, prospectId]);

  const fetchProof = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[ProofModal] Fetching proof from API...');
      const response = await fetch(`/api/prospect-intelligence/proof?id=${prospectId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch proof data');
      }

      console.log('[ProofModal] ✅ Proof data loaded:', data.prospect.business_name);
      setProofData(data);
    } catch (err) {
      console.error('[ProofModal] ❌ Error fetching proof:', err);
      setError(err instanceof Error ? err.message : 'Failed to load proof data');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-white/10 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              📊 Prospect Proof
            </h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300">
                <p className="font-medium">❌ Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {proofData && (
              <div className="space-y-6">
                {/* Simulation Banner */}
                {proofData.simulated && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-300 font-medium">⚠️ Simulation Mode – No live data</p>
                  </div>
                )}

                {/* Business Info */}
                <div className="bg-white/5 rounded-lg p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Business Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-white/50">Business Name</p>
                      <p className="text-white font-medium">{proofData.prospect.business_name}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-white/50">Industry</p>
                      <p className="text-white font-medium">{proofData.prospect.industry}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-white/50">Website</p>
                      <a
                        href={proofData.prospect.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {proofData.prospect.website}
                      </a>
                    </div>
                    
                    <div>
                      <p className="text-sm text-white/50">Region</p>
                      <p className="text-white font-medium">{proofData.prospect.region}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-white/50">Automation Score</p>
                      <p className="text-white font-medium">{proofData.prospect.automation_need_score}/100</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-white/50">Response Time</p>
                      <p className="text-white font-medium">{proofData.proof.response_time}</p>
                    </div>
                  </div>
                </div>

                {/* Form Detection */}
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Form Detection</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {proofData.proof.has_form && (
                      <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm flex items-center gap-1">
                        📝 Has Form ({proofData.proof.form_count})
                      </span>
                    )}
                    
                    {proofData.proof.has_mailto && (
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm flex items-center gap-1">
                        ✉️ Has Mailto
                      </span>
                    )}
                    
                    {proofData.proof.has_captcha && (
                      <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm flex items-center gap-1">
                        🛡️ Has CAPTCHA
                      </span>
                    )}
                    
                    {proofData.proof.recommended_approach && (
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm flex items-center gap-1">
                        🤖 {proofData.proof.recommended_approach}
                      </span>
                    )}
                  </div>
                  
                  {proofData.proof.submit_method && (
                    <p className="text-sm text-white/70">
                      Submit Method: <span className="text-white font-medium">{proofData.proof.submit_method}</span>
                    </p>
                  )}
                  
                  {proofData.proof.scanned_at && (
                    <p className="text-sm text-white/50 mt-2">
                      Scanned: {new Date(proofData.proof.scanned_at).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Screenshot */}
                {proofData.proof.screenshot_url ? (
                  <div className="bg-white/5 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Screenshot</h3>
                    <img
                      src={proofData.proof.screenshot_url}
                      alt="Website screenshot"
                      className="w-full rounded-lg border border-white/10"
                    />
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Screenshot</h3>
                    <div className="bg-white/5 rounded-lg p-12 text-center">
                      <p className="text-white/50">📷 No screenshot available</p>
                    </div>
                  </div>
                )}

                {/* Contact Paths */}
                {proofData.proof.contact_paths.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Contact Paths Found</h3>
                    <ul className="space-y-2">
                      {proofData.proof.contact_paths.map((path, idx) => (
                        <li key={idx}>
                          <a
                            href={path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                          >
                            {path}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Scoring Breakdown */}
                <div className="bg-white/5 rounded-lg p-6">
                  <button
                    onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                    className="flex items-center justify-between w-full text-left mb-4"
                  >
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      📊 {isFrench ? 'Détail du Score' : 'Scoring Breakdown'}
                    </h3>
                    <span className="text-white/50">{showScoreBreakdown ? '▼' : '▶'}</span>
                  </button>
                  
                  {showScoreBreakdown && (() => {
                    console.log('🧠 Proof breakdown rendered for:', proofData.prospect.business_name);
                    
                    const metadata = proofData.raw_metadata || {};
                    const scoringFactors = [];
                    
                    // Extract scoring factors from metadata
                    if (proofData.prospect.region) {
                      const isCA = proofData.prospect.region.includes('CA') || proofData.prospect.region.includes('QC');
                      scoringFactors.push({
                        factor: isFrench ? 'Correspondance Région' : 'Region Match',
                        value: proofData.prospect.region,
                        influence: isCA ? (isFrench ? '✅ Canada' : '✅ +10') : (isFrench ? '➖ International' : '➖ 0'),
                        points: isCA ? '+10' : '0'
                      });
                    }
                    
                    if (metadata.employee_count !== undefined) {
                      const empCount = metadata.employee_count;
                      const isSmall = empCount < 50;
                      scoringFactors.push({
                        factor: isFrench ? 'Nombre d\'Employés' : 'Employee Count',
                        value: empCount.toString(),
                        influence: isSmall 
                          ? (isFrench ? 'Petite entreprise = Besoin élevé d\'automatisation' : 'Small = High automation need')
                          : (isFrench ? 'Grande entreprise' : 'Large company'),
                        points: isSmall ? '+15' : '+5'
                      });
                    }
                    
                    if (metadata.founded_year) {
                      const year = metadata.founded_year;
                      const isNew = year >= 2015;
                      scoringFactors.push({
                        factor: isFrench ? 'Année de Fondation' : 'Founded Year',
                        value: year.toString(),
                        influence: isNew ? (isFrench ? 'Entreprise récente' : 'New company') : (isFrench ? 'Entreprise établie' : 'Established'),
                        points: isNew ? '+10' : '+5'
                      });
                    }
                    
                    if (proofData.proof.has_form !== undefined) {
                      scoringFactors.push({
                        factor: isFrench ? 'Formulaire Web' : 'Website Form',
                        value: proofData.proof.has_form ? (isFrench ? 'Détecté' : 'Detected') : (isFrench ? 'Aucun' : 'None'),
                        influence: proofData.proof.has_form 
                          ? (isFrench ? 'Contact automatisable' : 'Automatable contact') 
                          : (isFrench ? 'Plus difficile à contacter' : 'Harder to contact'),
                        points: proofData.proof.has_form ? '+10' : '-10'
                      });
                    }
                    
                    if (proofData.proof.has_captcha !== undefined) {
                      scoringFactors.push({
                        factor: 'CAPTCHA',
                        value: proofData.proof.has_captcha ? (isFrench ? 'Détecté' : 'Detected') : (isFrench ? 'Aucun' : 'None'),
                        influence: proofData.proof.has_captcha 
                          ? (isFrench ? 'Partiellement automatisable' : 'Semi-automatable')
                          : (isFrench ? 'Entièrement automatisable' : 'Fully automatable'),
                        points: proofData.proof.has_captcha ? '+5' : '+10'
                      });
                    }
                    
                    if (metadata.linkedin_url) {
                      scoringFactors.push({
                        factor: 'LinkedIn',
                        value: isFrench ? 'Vérifié' : 'Verified',
                        influence: isFrench ? 'Présence active' : 'Active presence',
                        points: '+5'
                      });
                    }
                    
                    if (metadata.source) {
                      const source = metadata.source;
                      scoringFactors.push({
                        factor: isFrench ? 'Source de Données' : 'Data Source',
                        value: source.toUpperCase(),
                        influence: source === 'pdl' || source === 'apollo' 
                          ? (isFrench ? 'Enrichissement fiable' : 'Trusted enrichment')
                          : (isFrench ? 'Source manuelle' : 'Manual source'),
                        points: (source === 'pdl' || source === 'apollo') ? '+10' : '+5'
                      });
                    }
                    
                    return (
                      <div className="mt-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="text-left py-2 px-3 text-white/70 font-medium">
                                  {isFrench ? 'Facteur' : 'Factor'}
                                </th>
                                <th className="text-left py-2 px-3 text-white/70 font-medium">
                                  {isFrench ? 'Valeur' : 'Value'}
                                </th>
                                <th className="text-left py-2 px-3 text-white/70 font-medium">
                                  {isFrench ? 'Influence' : 'Influence'}
                                </th>
                                <th className="text-right py-2 px-3 text-white/70 font-medium">
                                  {isFrench ? 'Points' : 'Points'}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {scoringFactors.map((factor, idx) => (
                                <tr key={idx} className="border-b border-white/5">
                                  <td className="py-3 px-3 text-white/90">{factor.factor}</td>
                                  <td className="py-3 px-3 text-blue-400 font-mono text-xs">{factor.value}</td>
                                  <td className="py-3 px-3 text-white/70 text-xs">{factor.influence}</td>
                                  <td className="py-3 px-3 text-right font-mono text-sm">
                                    <span className={factor.points.startsWith('+') ? 'text-green-400' : factor.points.startsWith('-') ? 'text-red-400' : 'text-white/50'}>
                                      {factor.points}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              
                              {/* Summary Rows */}
                              <tr className="border-t-2 border-white/20">
                                <td className="py-3 px-3 text-white font-semibold">
                                  {isFrench ? 'Score d\'Automatisation' : 'Automation Need Score'}
                                </td>
                                <td className="py-3 px-3"></td>
                                <td className="py-3 px-3 text-white/50 text-xs">
                                  {isFrench ? 'Calculé par l\'IA' : 'AI Calculated'}
                                </td>
                                <td className="py-3 px-3 text-right font-mono text-lg font-bold text-purple-400">
                                  {proofData.prospect.automation_need_score}/100
                                </td>
                              </tr>
                              
                              {metadata.response_score !== undefined && (
                                <tr className="border-b border-white/5">
                                  <td className="py-3 px-3 text-white font-semibold">
                                    {isFrench ? 'Score de Réponse' : 'Response Score'}
                                  </td>
                                  <td className="py-3 px-3"></td>
                                  <td className="py-3 px-3 text-white/50 text-xs">
                                    {isFrench ? 'Vitesse estimée' : 'Est. response speed'}
                                  </td>
                                  <td className="py-3 px-3 text-right font-mono text-lg font-bold text-blue-400">
                                    {metadata.response_score}/100
                                  </td>
                                </tr>
                              )}
                              
                              {metadata.response_score !== undefined && (
                                <tr className="border-t-2 border-purple-500/30 bg-purple-500/10">
                                  <td className="py-4 px-3 text-white font-bold">
                                    {isFrench ? 'Score Total Pondéré' : 'Final Weighted Score'}
                                  </td>
                                  <td className="py-4 px-3"></td>
                                  <td className="py-4 px-3 text-white/50 text-xs">
                                    (0.7 × {proofData.prospect.automation_need_score} + 0.3 × {metadata.response_score})
                                  </td>
                                  <td className="py-4 px-3 text-right font-mono text-2xl font-bold text-purple-300">
                                    {Math.round(0.7 * proofData.prospect.automation_need_score + 0.3 * metadata.response_score)}/100
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        
                        <p className="text-xs text-white/40 mt-4 italic">
                          {isFrench 
                            ? '💡 Les scores sont calculés automatiquement par l\'IA en fonction de multiples facteurs.'
                            : '💡 Scores are automatically calculated by AI based on multiple factors.'}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Metadata Debug */}
                <div className="bg-white/5 rounded-lg p-6">
                  <button
                    onClick={() => setShowMetadata(!showMetadata)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-lg font-semibold text-white">
                      {isFrench ? 'Métadonnées Brutes (Débogage)' : 'Raw Metadata (Debug)'}
                    </h3>
                    <span className="text-white/50">{showMetadata ? '▼' : '▶'}</span>
                  </button>
                  
                  {showMetadata && (
                    <pre className="mt-4 bg-black/30 rounded p-4 text-xs text-white/70 overflow-x-auto">
                      {JSON.stringify(proofData.raw_metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-white/10 p-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              {isFrench ? 'Fermer' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

