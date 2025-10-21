"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import OpenAI from "openai";

interface GrowthCopilotProps {
  locale: string;
  clientId?: string | null;
}

type CopilotSummary = {
  trendSummary: string;
  recommendedActions: string[];
  prediction: string;
  relationshipInsights?: Array<{
    name: string;
    email: string;
    insight: string;
    lastUpdated: string;
  }>;
};

export default function GrowthCopilot({ locale, clientId = null }: GrowthCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<CopilotSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isFrench = locale === 'fr';

  const t = {
    title: isFrench ? 'Copilote de Croissance' : 'Growth Copilot',
    trendSummary: isFrench ? 'Résumé des tendances' : 'Trend Summary',
    recommendedActions: isFrench ? 'Actions recommandées' : 'Recommended Actions',
    prediction: isFrench ? 'Prédiction' : 'Prediction',
    relationshipInsights: isFrench ? 'Aperçus relationnels' : 'Relationship Insights',
    generateSummary: isFrench ? 'Générer un nouveau résumé' : 'Generate Fresh Summary',
    loading: isFrench ? 'Analyse en cours...' : 'Analyzing...',
    refreshing: isFrench ? 'Actualisation des données...' : 'Refreshing data...',
    refreshError: isFrench ? 'Impossible d\'actualiser le résumé. Réessayez plus tard.' : 'Unable to refresh summary. Try again later.',
    noInsights: isFrench ? 'Aucun aperçu disponible' : 'No insights available',
  };
  
  console.log(`[DashboardTranslation] GrowthCopilot - locale: ${locale} | title: "${t.title}"`);

  async function manualRefresh() {
    setRefreshing(true);
    try {
      console.log('[Copilot] ============================================');
      console.log('[Copilot] Generate Fresh Summary triggered — client_id:', clientId || 'admin (global)');
      console.log('[Copilot] User clicked refresh button');
      console.log('[Copilot] ============================================');
      
      // Call Intelligence Engine to regenerate insights
      console.log('[Copilot] Calling intelligence engine endpoint...');
      console.log('[Copilot] Endpoint: POST /api/intelligence-engine');
      console.log('[Copilot] This will refresh:');
      if (clientId) {
        console.log('[Copilot]   - Analytics for client_id:', clientId);
      } else {
        console.log('[Copilot]   - Global analytics (all clients)');
        console.log('[Copilot]   - Per-client analytics (all clients in database)');
      }
      
      const engineRes = await fetch('/api/intelligence-engine', {
        method: 'POST',
      });
      
      const engineJson = await engineRes.json();
      console.log('[Copilot] Intelligence Engine response:', {
        success: engineJson.success,
        processed: engineJson.data?.processed,
        errors: engineJson.data?.errors,
      });
      
      if (!engineJson.success) {
        console.error('[GrowthCopilot] ❌ Intelligence Engine failed:', engineJson.error);
        setSummary({
          trendSummary: t.refreshError,
          recommendedActions: [],
          prediction: '',
        });
        setRefreshing(false);
        return;
      }
      
      console.log('[GrowthCopilot] ✅ Intelligence Engine completed:', {
        processed: engineJson.data?.processed,
        errors: engineJson.data?.errors,
        trigger: engineJson.trigger,
      });
      
      // Wait a moment for data to be available
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Now fetch the fresh insights
      console.log('[Copilot] Fetching refreshed analytics...');
      console.log('[Copilot] For client_id:', clientId || 'global (admin)');
      await generateSummary();
      
      console.log('[Copilot] ✅ Summary refreshed via intelligence engine');
      console.log('[Copilot] ============================================');
      
    } catch (err) {
      console.error('[GrowthCopilot] ❌ Manual refresh failed:', err);
      setSummary({
        trendSummary: t.refreshError,
        recommendedActions: [],
        prediction: '',
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function generateSummary() {
    setLoading(true);
    try {
      console.log('[GrowthCopilot] Fetching growth insights...');
      console.log('[GrowthCopilot] Client ID:', clientId || 'admin (all clients)');
      
      // Fetch latest growth insights (filtered by clientId if provided)
      const endpoint = clientId 
        ? `/api/growth-insights?client_id=${clientId}`
        : '/api/growth-insights';
      console.log('[GrowthCopilot] Fetching from:', endpoint);
      
      const res = await fetch(endpoint);
      const json = await res.json();

      console.log('[GrowthCopilot] Full API response:', json);
      console.log('[GrowthCopilot] API response summary:', {
        success: json.success,
        hasData: !!json.data,
        message: json.message,
        dataKeys: json.data ? Object.keys(json.data) : [],
      });

      if (!json.success) {
        console.error('[GrowthCopilot] API returned success=false');
        setSummary({
          trendSummary: isFrench 
            ? 'Erreur lors du chargement des données.'
            : 'Error loading data.',
          recommendedActions: [],
          prediction: '',
        });
        setLoading(false);
        return;
      }

      if (!json.data) {
        console.log('[GrowthCopilot] No data available - attempting to generate insights automatically...');
        
        // Try to automatically generate insights for this client
        try {
          if (clientId) {
            console.log('[GrowthCopilot] Triggering automatic insight generation for client:', clientId);
            const ensureRes = await fetch('/api/ensure-growth-insights', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ client_id: clientId }),
            });
          
          const ensureJson = await ensureRes.json();
          console.log('[GrowthCopilot] Auto-generation result:', ensureJson);
          
          if (ensureJson.success && ensureJson.data?.success) {
            console.log('[GrowthCopilot] ✅ Insights generated automatically, retrying fetch...');
            // Wait a moment for data to be available
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Retry the original request
            const retryRes = await fetch(endpoint);
            const retryJson = await retryRes.json();
            
            if (retryJson.success && retryJson.data) {
              console.log('[GrowthCopilot] ✅ Successfully fetched auto-generated insights');
              // Use the retry data and continue with normal processing
              json.data = retryJson.data;
            } else {
              throw new Error('Retry failed');
            }
          } else {
            throw new Error('Auto-generation failed');
          }
          } else {
            // Admin dashboard case - trigger global intelligence engine
            console.log('[GrowthCopilot] Admin dashboard - triggering global intelligence engine...');
            const engineRes = await fetch('/api/intelligence-engine', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            
            const engineJson = await engineRes.json();
            console.log('[GrowthCopilot] Global engine result:', engineJson);
            
            if (engineJson.success) {
              console.log('[GrowthCopilot] ✅ Global insights generated, retrying fetch...');
              // Wait a moment for data to be available
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Retry the original fetch
              const retryRes = await fetch(endpoint);
              const retryJson = await retryRes.json();
              
              if (retryJson.success && retryJson.data) {
                console.log('[GrowthCopilot] ✅ Retry successful, processing data...');
                // Use the retry data and continue with normal processing
                json.data = retryJson.data;
              } else {
                throw new Error('Retry failed');
              }
            } else {
              throw new Error('Global engine failed');
            }
          }
        } catch (autoError) {
          console.error('[GrowthCopilot] ❌ Auto-generation failed:', autoError);
          setSummary({
            trendSummary: isFrench 
              ? 'Aucune donnée disponible. Le système tente de générer des insights automatiquement...'
              : 'No data available. The system is attempting to generate insights automatically...',
            recommendedActions: [
              isFrench 
                ? 'Cliquez sur "Générer un nouveau résumé" pour forcer la génération d\'insights'
                : 'Click "Generate Fresh Summary" to force insight generation'
            ],
            prediction: '',
          });
          setLoading(false);
          return;
        }
      }

      const insights = json.data;
      console.log('[GrowthCopilot] ============================================');
      console.log('[GrowthCopilot] Insights received from growth_brain:');
      console.log('[GrowthCopilot] ============================================');
      console.log('[GrowthCopilot] Record ID:', insights.id);
      console.log('[GrowthCopilot] Total leads:', insights.total_leads);
      console.log('[GrowthCopilot] Engagement score:', insights.engagement_score);
      console.log('[GrowthCopilot] Avg confidence:', insights.avg_confidence);
      console.log('[GrowthCopilot] Created at:', insights.created_at);
      console.log('[GrowthCopilot] Has predictive_insights:', !!insights.predictive_insights);
      console.log('[GrowthCopilot] Predictive insights type:', typeof insights.predictive_insights);

      if (insights.predictive_insights) {
        console.log('[GrowthCopilot] Predictive insights structure:', {
          has_en: !!insights.predictive_insights.en,
          has_fr: !!insights.predictive_insights.fr,
          en_keys: insights.predictive_insights.en ? Object.keys(insights.predictive_insights.en) : [],
          fr_keys: insights.predictive_insights.fr ? Object.keys(insights.predictive_insights.fr) : [],
        });
        
        // Log the actual content
        if (insights.predictive_insights.en) {
          console.log('[GrowthCopilot] EN predictions:', {
            urgency_trend: insights.predictive_insights.en.urgency_trend?.substring(0, 60) + '...',
            confidence_insight: insights.predictive_insights.en.confidence_insight?.substring(0, 60) + '...',
            tone_insight: insights.predictive_insights.en.tone_insight?.substring(0, 60) + '...',
          });
        }
        
        if (insights.predictive_insights.fr) {
          console.log('[GrowthCopilot] FR predictions:', {
            urgency_trend: insights.predictive_insights.fr.urgency_trend?.substring(0, 60) + '...',
            confidence_insight: insights.predictive_insights.fr.confidence_insight?.substring(0, 60) + '...',
            tone_insight: insights.predictive_insights.fr.tone_insight?.substring(0, 60) + '...',
          });
        }
      } else {
        console.warn('[GrowthCopilot] ⚠️  predictive_insights is missing or null');
      }

      // Use the predictive insights from growth_brain
      const predictions = isFrench ? insights.predictive_insights?.fr : insights.predictive_insights?.en;
      
      console.log('[GrowthCopilot] ============================================');
      console.log('[GrowthCopilot] Selected language:', isFrench ? 'FR' : 'EN');
      console.log('[GrowthCopilot] Selected predictions:', predictions);
      console.log('[GrowthCopilot] ============================================');

      if (!predictions) {
        console.error('[GrowthCopilot] ❌ No predictions for selected language');
        setSummary({
          trendSummary: isFrench ? 'Données de prédiction manquantes' : 'Prediction data missing',
          recommendedActions: [],
          prediction: '',
        });
        setLoading(false);
        return;
      }

      // Build summary from predictions
      const trendSummary = predictions.urgency_trend || (isFrench ? 'Aucune tendance détectée' : 'No trends detected');
      const recommendedActions = [
        predictions.confidence_insight || '',
        predictions.tone_insight || '',
      ].filter(Boolean);
      
      const avgConfidencePercent = insights.avg_confidence ? (insights.avg_confidence * 100).toFixed(0) : '0';
      const engagementScoreValue = insights.engagement_score?.toFixed(0) || '0';
      
      const prediction = isFrench
        ? `Basé sur ${insights.total_leads} leads analysés avec une confiance moyenne de ${avgConfidencePercent}%, votre score d'engagement est de ${engagementScoreValue}/100.`
        : `Based on ${insights.total_leads} analyzed leads with ${avgConfidencePercent}% average confidence, your engagement score is ${engagementScoreValue}/100.`;

      // Fetch recent leads with relationship insights (filtered by clientId)
      console.log('[CopilotFilter] ============================================');
      console.log('[CopilotFilter] Fetching relationship insights');
      console.log('[CopilotFilter] Client ID:', clientId || 'admin (all leads)');
      
      let relationshipInsights: Array<{ name: string; email: string; insight: string; lastUpdated: string }> = [];
      
      try {
        let leadsEndpoint = '';
        if (clientId) {
          // Client mode: fetch only this client's leads
          leadsEndpoint = `/api/client/leads?clientId=${clientId}&locale=${locale}&status=active`;
          console.log('[CopilotFilter] Mode: CLIENT');
          console.log('[CopilotFilter] Endpoint:', leadsEndpoint);
        } else {
          // Admin mode: fetch all leads
          leadsEndpoint = `/api/leads?limit=10&locale=${locale}`;
          console.log('[CopilotFilter] Mode: ADMIN');
          console.log('[CopilotFilter] Endpoint:', leadsEndpoint);
        }
        
        const leadsRes = await fetch(leadsEndpoint);
        const leadsJson = await leadsRes.json();
        
        if (leadsJson.success && leadsJson.data) {
          const allLeads = leadsJson.data;
          console.log('[CopilotFilter] Total leads fetched:', allLeads.length);
          
          relationshipInsights = allLeads
            .filter((lead: any) => lead.relationship_insight && lead.relationship_insight.trim())
            .map((lead: any) => ({
              name: lead.name,
              email: lead.email,
              insight: lead.relationship_insight,
              lastUpdated: lead.last_updated || lead.timestamp,
            }))
            .slice(0, 5); // Show top 5
          
          console.log('[CopilotFilter] Insights with relationship data:', relationshipInsights.length);
          console.log('[CopilotFilter] ============================================');
          
          if (relationshipInsights.length > 0) {
            console.log('[CopilotFilter] Leads shown in copilot:');
            relationshipInsights.forEach((insight, idx) => {
              console.log('[CopilotFilter]   ' + (idx + 1) + '. Name:', insight.name, '| Email:', insight.email);
              console.log('[CopilotFilter]      Insight:', insight.insight.substring(0, 60) + '...');
            });
            console.log('[CopilotFilter] ============================================');
          } else {
            console.log('[CopilotFilter] ℹ️  No leads with relationship insights found');
            console.log('[CopilotFilter] ============================================');
          }
        }
      } catch (err) {
        console.error('[CopilotFilter] ❌ Failed to fetch relationship insights:', err);
        console.log('[CopilotFilter] ============================================');
      }

      const newSummary = {
        trendSummary,
        recommendedActions,
        prediction,
        relationshipInsights,
      };
      
      console.log('[GrowthCopilot] ============================================');
      console.log('[GrowthCopilot] Summary built successfully:');
      console.log('[GrowthCopilot] ============================================');
      console.log('[GrowthCopilot] Trend Summary:', trendSummary);
      console.log('[GrowthCopilot] Recommended Actions count:', recommendedActions.length);
      console.log('[GrowthCopilot] Recommended Actions:');
      recommendedActions.forEach((action, idx) => {
        console.log(`[GrowthCopilot]   ${idx + 1}. ${action.substring(0, 80)}...`);
      });
      console.log('[GrowthCopilot] Prediction:', prediction);
      console.log('[GrowthCopilot] Metrics used:', {
        total_leads: insights.total_leads,
        avg_confidence: avgConfidencePercent + '%',
        engagement_score: engagementScoreValue + '/100',
      });
      console.log('[GrowthCopilot] ============================================');

      setSummary(newSummary);
    } catch (err) {
      console.error('[GrowthCopilot] Failed to generate summary:', err);
      setSummary({
        trendSummary: isFrench ? 'Erreur lors du chargement des données.' : 'Error loading data.',
        recommendedActions: [],
        prediction: '',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen && !summary) {
      generateSummary();
    }
  }, [isOpen]);

  return (
    <>
      {/* Toggle Button - Hide when panel is open */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed right-4 top-32 z-[60] px-2.5 py-1.5 rounded-lg font-medium text-xs shadow-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:border-purple-500/60 transition-all duration-100 max-w-[180px] text-center leading-tight whitespace-nowrap overflow-hidden text-ellipsis"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🧠 {t.title}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Copilot Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-96 lg:w-[420px] bg-black/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-[60] overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  🧠 {t.title}
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/40 hover:text-white/80 transition-colors text-2xl leading-none p-2 hover:bg-white/10 rounded z-[70]"
                >
                  ✕
                </button>
              </div>

              {/* Generate Button */}
              <button
                onClick={manualRefresh}
                disabled={loading || refreshing}
                className="w-full py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {refreshing && (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                )}
                {refreshing ? t.refreshing : loading ? t.loading : t.generateSummary}
              </button>

              {(loading || refreshing) && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                </div>
              )}

              {summary && !loading && (
                <div className="space-y-4">
                  {/* Trend Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-white/10 p-4 bg-white/5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">📈</span>
                      <h3 className="text-sm font-semibold text-white/90">{t.trendSummary}</h3>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {summary.trendSummary}
                    </p>
                  </motion.div>

                  {/* Recommended Actions */}
                  {summary.recommendedActions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="rounded-lg border border-white/10 p-4 bg-white/5"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🎯</span>
                        <h3 className="text-sm font-semibold text-white/90">{t.recommendedActions}</h3>
                      </div>
                      <ul className="space-y-2">
                        {summary.recommendedActions.map((action, idx) => (
                          <li key={idx} className="text-sm text-white/70 leading-relaxed flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Prediction */}
                  {summary.prediction && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="rounded-lg border border-purple-500/30 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🧠</span>
                        <h3 className="text-sm font-semibold text-purple-300">{t.prediction}</h3>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed">
                        {summary.prediction}
                      </p>
                    </motion.div>
                  )}

                  {/* Relationship Insights */}
                  {summary.relationshipInsights && summary.relationshipInsights.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="rounded-lg border border-blue-500/30 p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">📈</span>
                        <h3 className="text-sm font-semibold text-blue-300">{t.relationshipInsights}</h3>
                      </div>
                      <div className="space-y-3">
                        {summary.relationshipInsights.map((insight, idx) => (
                          <div key={idx} className="rounded-md border border-white/10 p-3 bg-white/5">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{insight.name}</p>
                                <p className="text-xs text-white/50 truncate">{insight.email}</p>
                              </div>
                              <span className="text-xs text-white/40 whitespace-nowrap">
                                {new Date(insight.lastUpdated).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-blue-300 leading-relaxed">
                              💡 {insight.insight}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] md:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}

