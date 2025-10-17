'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMetadata, setShowMetadata] = useState(false);

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

                {/* Metadata Debug */}
                <div className="bg-white/5 rounded-lg p-6">
                  <button
                    onClick={() => setShowMetadata(!showMetadata)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-lg font-semibold text-white">Raw Metadata (Debug)</h3>
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
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

