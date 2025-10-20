"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

// Dynamic imports for better bundle splitting
const UniversalLanguageToggle = dynamic(() => import('../../../components/UniversalLanguageToggle'), {
  ssr: true, // Keep SSR for language toggle as it's above the fold
});

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
  current_tag?: string | null;
  language?: string;
  relationship_insight?: string;
};

export default function LocalizedDemoClientDashboard() {
  const locale = useLocale();
  const t = useTranslations();
  const isFrench = locale === 'fr';
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'deleted' | 'converted'>('active');
  const [filter, setFilter] = useState({ urgency: 'all', language: 'all', minConfidence: 0 });
  const [tagFilter, setTagFilter] = useState<string>('all');

  // Mock client data
  const mockClient = {
    businessName: isFrench ? 'Entreprise Démo Inc.' : 'Demo Business Inc.',
    industry: isFrench ? 'Technologie' : 'Technology',
    region: isFrench ? 'Canada' : 'Canada'
  };

  // Mock leads data (same as original demo)
  const mockLeads: Lead[] = [
    {
      id: '1',
      name: isFrench ? 'Construction Pro Inc.' : 'Construction Pro Inc.',
      email: 'contact@constructionpro.com',
      message: isFrench 
        ? 'Nous avons besoin d\'un devis pour des services de rénovation commerciale. Notre échéancier de projet est urgent.'
        : 'We need a quote for commercial renovation services. Our project timeline is urgent.',
      ai_summary: isFrench 
        ? 'Client professionnel recherchant des services de rénovation commerciale avec un échéancier serré.'
        : 'Professional client seeking commercial renovation services with tight timeline.',
      intent: isFrench ? 'Demande de Devis' : 'Quote Request',
      tone: isFrench ? 'Professionnel' : 'Professional',
      urgency: isFrench ? 'Élevée' : 'High',
      confidence_score: 0.92,
      timestamp: '2025-10-20T13:06:25.000Z',
      current_tag: isFrench ? 'Priorité' : 'Priority',
      language: 'EN',
      relationship_insight: isFrench 
        ? 'Client potentiel à haute valeur avec besoin urgent'
        : 'High-value potential client with urgent need'
    },
    {
      id: '2',
      name: isFrench ? 'Groupe RealtyMax' : 'RealtyMax Group',
      email: 'info@realtymax.ca',
      message: isFrench 
        ? 'Intéressé par votre automatisation de gestion immobilière. Pouvons-nous planifier une démo?'
        : 'Interested in your property management automation. Can we schedule a demo?',
      ai_summary: isFrench 
        ? 'Client immobilier intéressé par l\'automatisation de gestion immobilière.'
        : 'Real estate client interested in property management automation.',
      intent: isFrench ? 'Demande de Démo' : 'Demo Request',
      tone: isFrench ? 'Amical' : 'Friendly',
      urgency: isFrench ? 'Moyenne' : 'Medium',
      confidence_score: 0.85,
      timestamp: '2025-10-20T10:06:25.000Z',
      language: 'EN',
      relationship_insight: isFrench 
        ? 'Client engagé prêt pour une conversation de vente'
        : 'Engaged client ready for sales conversation'
    },
    {
      id: '3',
      name: isFrench ? 'Rénovations Metro' : 'Metro Renovations',
      email: 'contact@metroreno.com',
      message: isFrench 
        ? 'À la recherche d\'une qualification de leads alimentée par l\'IA pour notre entreprise de rénovation.'
        : 'Looking for AI-powered lead qualification for our renovation business.',
      ai_summary: isFrench 
        ? 'Entreprise de rénovation recherchant une qualification de leads automatisée.'
        : 'Renovation company seeking automated lead qualification.',
      intent: isFrench ? 'Demande d\'Information' : 'Information Request',
      tone: isFrench ? 'Curieux' : 'Curious',
      urgency: isFrench ? 'Moyenne' : 'Medium',
      confidence_score: 0.78,
      timestamp: '2025-10-19T15:06:25.000Z',
      current_tag: isFrench ? 'Suivi' : 'Follow-up',
      language: 'EN'
    },
    {
      id: '4',
      name: isFrench ? 'Agence Marketing Plus' : 'Agence Marketing Plus',
      email: 'bonjour@marketingplus.ca',
      message: isFrench 
        ? 'Nous cherchons une solution d\'automatisation pour nos campagnes de génération de leads.'
        : 'Nous cherchons une solution d\'automatisation pour nos campagnes de génération de leads.',
      ai_summary: isFrench 
        ? 'Agence de marketing recherchant l\'automatisation pour les campagnes de génération de leads.'
        : 'Marketing agency seeking automation for lead generation campaigns.',
      intent: isFrench ? 'Consultation' : 'Consultation',
      tone: isFrench ? 'Professionnel' : 'Professional',
      urgency: isFrench ? 'Faible' : 'Low',
      confidence_score: 0.81,
      timestamp: '2025-10-18T15:06:25.000Z',
      language: 'FR'
    }
  ];

  // Calculate stats from mock data
  const stats = {
    total: mockLeads.length,
    avgConfidence: mockLeads.reduce((sum, lead) => sum + lead.confidence_score, 0) / mockLeads.length,
    topIntent: isFrench ? 'Demande de Devis' : 'Quote Request',
    highUrgency: mockLeads.filter(lead => lead.urgency === (isFrench ? 'Élevée' : 'High')).length
  };

  // Filter leads based on current filters
  const filteredLeads = mockLeads.filter(lead => {
    if (filter.urgency !== 'all' && lead.urgency !== filter.urgency) return false;
    if (filter.language !== 'all' && lead.language !== filter.language) return false;
    if (lead.confidence_score < filter.minConfidence) return false;
    if (tagFilter !== 'all' && lead.current_tag !== tagFilter) return false;
    return true;
  });

  // Get tag badge color
  function getTagBadgeColor(tag: string) {
    switch (tag) {
      case isFrench ? 'Priorité' : 'Priority':
        return 'bg-red-500/20 border-red-500/40 text-red-400';
      case isFrench ? 'Suivi' : 'Follow-up':
        return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400';
      case isFrench ? 'Qualifié' : 'Qualified':
        return 'bg-green-500/20 border-green-500/40 text-green-400';
      default:
        return 'bg-blue-500/20 border-blue-500/40 text-blue-400';
    }
  }

  // Demo Dashboard UI (Exact Mirror of Real Dashboard - No Database Dependencies)
  return (
    <div className="min-h-screen p-8 bg-black text-white">
      {/* Universal Language Toggle */}
      <UniversalLanguageToggle />
      
      <div className="max-w-7xl mx-auto">
        {/* Demo Notice Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center"
        >
          <p className="text-yellow-300 font-semibold text-sm">
            ⚠️ {isFrench ? 'MODE DÉMO - Données d\'exemple' : 'DEMO MODE - Sample Data'}
          </p>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">{isFrench ? 'Tableau de Bord Client' : 'Client Dashboard'}</h1>
            <p className="text-white/60">{isFrench ? 'Tableau d\'intelligence en temps réel' : 'Real-time lead intelligence dashboard'}</p>
            <p className="text-white/50 text-sm mt-1">{mockClient.businessName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled
              className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400/50 cursor-not-allowed transition-all duration-300 text-sm font-medium opacity-50"
              title={isFrench ? '(Désactivé en démo)' : '(Disabled in demo)'}
            >
              📊 {isFrench ? 'Analyses' : 'Insights'}
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-lg bg-pink-500/20 border border-pink-500/40 text-pink-400/50 cursor-not-allowed transition-all duration-300 text-sm font-medium opacity-50"
              title={isFrench ? '(Désactivé en démo)' : '(Disabled in demo)'}
            >
              🧠 {isFrench ? 'Intelligence de Prospection' : 'Prospect Intelligence'}
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400/50 cursor-not-allowed transition-all duration-300 text-sm font-medium opacity-50"
              title={isFrench ? '(Désactivé en démo)' : '(Disabled in demo)'}
            >
              ⚙️ {isFrench ? 'Paramètres' : 'Settings'}
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400/50 cursor-not-allowed transition-all duration-300 text-sm font-medium opacity-50"
              title={isFrench ? '(Désactivé en démo)' : '(Disabled in demo)'}
            >
              {isFrench ? '🔑 Accès API' : '🔑 API Access'}
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
            className="card-base card-hover p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10"
          >
            <div className="text-muted mb-1">{isFrench ? 'Total des Leads' : 'Total Leads'}</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="card-base card-hover p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10"
          >
            <div className="text-muted mb-1">{isFrench ? 'Confiance Moyenne' : 'Avg Confidence'}</div>
            <div className="text-3xl font-bold">{(stats.avgConfidence * 100).toFixed(0)}%</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="card-base card-hover p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10"
          >
            <div className="text-muted mb-1">{isFrench ? 'Intention Principale' : 'Top Intent'}</div>
            <div className="text-xl font-semibold truncate">{stats.topIntent}</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="card-base card-hover p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10"
          >
            <div className="text-muted mb-1">{isFrench ? 'Urgence Élevée' : 'High Urgency'}</div>
            <div className="text-3xl font-bold text-red-400">{stats.highUrgency}</div>
          </motion.div>
        </motion.div>

        {/* View Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6 flex gap-2 border-b border-white/10"
        >
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 ${
              activeTab === 'active' 
                ? 'border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                : 'border-transparent text-white/60 hover:text-white/80'
            }`}
          >
            {isFrench ? 'Leads Actifs' : 'Active Leads'}
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 ${
              activeTab === 'archived' 
                ? 'border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                : 'border-transparent text-white/60 hover:text-white/80'
            }`}
          >
            {isFrench ? 'Leads Archivés' : 'Archived Leads'}
          </button>
          <button
            onClick={() => setActiveTab('deleted')}
            className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 ${
              activeTab === 'deleted' 
                ? 'border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                : 'border-transparent text-white/60 hover:text-white/80'
            }`}
          >
            {isFrench ? 'Leads Supprimés' : 'Deleted Leads'}
          </button>
          <button
            onClick={() => setActiveTab('converted')}
            className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 ${
              activeTab === 'converted' 
                ? 'border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                : 'border-transparent text-white/60 hover:text-white/80'
            }`}
          >
            {isFrench ? 'Leads Convertis' : 'Converted Leads'}
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <select
            value={filter.urgency}
            onChange={(e) => setFilter({ ...filter, urgency: e.target.value })}
            className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm hover:border-blue-400/40 transition-all"
          >
            <option value="all">{isFrench ? 'Toute' : 'All'} {isFrench ? 'Urgence' : 'Urgency'}</option>
            <option value={isFrench ? 'Élevée' : 'High'}>{isFrench ? 'Élevée' : 'High'}</option>
            <option value={isFrench ? 'Moyenne' : 'Medium'}>{isFrench ? 'Moyenne' : 'Medium'}</option>
            <option value={isFrench ? 'Faible' : 'Low'}>{isFrench ? 'Faible' : 'Low'}</option>
          </select>
          <select
            value={filter.language}
            onChange={(e) => setFilter({ ...filter, language: e.target.value })}
            className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm hover:border-blue-400/40 transition-all"
          >
            <option value="all">{isFrench ? 'Toute' : 'All'} {isFrench ? 'Langue' : 'Language'}</option>
            <option value="EN">EN</option>
            <option value="FR">FR</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/70">{isFrench ? 'Confiance Min' : 'Min Confidence'}:</label>
            <input
              type="range"
              min="0"
              max="100"
              value={filter.minConfidence * 100}
              onChange={(e) => setFilter({ ...filter, minConfidence: parseInt(e.target.value) / 100 })}
              className="w-32"
            />
            <span className="text-sm font-mono text-white/80 min-w-[3rem]">{Math.round(filter.minConfidence * 100)}%</span>
          </div>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm hover:border-blue-400/40 transition-all"
          >
            <option value="all">{isFrench ? 'Tous' : 'All'} {isFrench ? 'Tags' : 'Tags'}</option>
            <option value={isFrench ? 'Priorité' : 'Priority'}>{isFrench ? 'Priorité' : 'Priority'}</option>
            <option value={isFrench ? 'Suivi' : 'Follow-up'}>{isFrench ? 'Suivi' : 'Follow-up'}</option>
            <option value={isFrench ? 'Qualifié' : 'Qualified'}>{isFrench ? 'Qualifié' : 'Qualified'}</option>
          </select>
        </motion.div>

        {/* Mock AI Insights Widget (Static Placeholder) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <div className="card-base p-6 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
            <h2 className="text-heading mb-4 flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              {isFrench ? 'Copilote de Croissance' : 'Growth Copilot'}
            </h2>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-lg bg-white/5 border border-blue-500/30">
                <p className="text-blue-300 font-medium mb-1">
                  {isFrench ? '💡 Aperçu IA' : '💡 AI Insight'}
                </p>
                <p className="text-muted">
                  {isFrench 
                    ? 'Vos leads montrent une tendance vers les demandes de prix urgentes (+45% ce mois-ci). Envisagez d\'ajuster votre temps de réponse pour capturer plus d\'opportunités.'
                    : 'Your leads show a trend toward urgent quote requests (+45% this month). Consider adjusting your response time to capture more opportunities.'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-purple-500/30">
                <p className="text-purple-300 font-medium mb-1">
                  {isFrench ? '📈 Recommandation' : '📈 Recommendation'}
                </p>
                <p className="text-muted">
                  {isFrench
                    ? 'Haute confiance (87%) indique une excellente qualification des leads. Continuez votre stratégie actuelle.'
                    : 'High confidence (87%) indicates excellent lead qualification. Continue your current strategy.'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mock Activity Log (Static Placeholder) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mb-8"
        >
          <div className="card-base p-6 bg-white/5">
            <h2 className="text-heading mb-4">
              {isFrench ? '📊 Journal d\'Activité Récente' : '📊 Recent Activity Log'}
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3 p-2 rounded bg-white/5">
                <span className="text-green-400">✓</span>
                <span className="text-muted">{isFrench ? 'Lead tagué' : 'Lead tagged'}: {isFrench ? 'Construction Pro Inc.' : 'Construction Pro Inc.'}</span>
                <span className="text-muted text-xs ml-auto">2h {isFrench ? 'il y a' : 'ago'}</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded bg-white/5">
                <span className="text-blue-400">→</span>
                <span className="text-muted">{isFrench ? 'Nouveau lead reçu' : 'New lead received'}: {isFrench ? 'Groupe RealtyMax' : 'RealtyMax Group'}</span>
                <span className="text-muted text-xs ml-auto">5h {isFrench ? 'il y a' : 'ago'}</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded bg-white/5">
                <span className="text-yellow-400">📦</span>
                <span className="text-muted">{isFrench ? 'Lead archivé' : 'Lead archived'}: {isFrench ? 'Ancien Prospect LLC' : 'Old Prospect LLC'}</span>
                <span className="text-muted text-xs ml-auto">1d {isFrench ? 'il y a' : 'ago'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mock Predictive Growth Engine (Static Placeholder) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8"
        >
          <div className="card-base p-6 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
            <h2 className="text-heading mb-4">
              {isFrench ? '🔮 Moteur de Croissance Prédictif' : '🔮 Predictive Growth Engine'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-muted mb-1">{isFrench ? 'Score d\'Engagement' : 'Engagement Score'}</p>
                <p className="text-2xl font-bold text-blue-400">89/100</p>
                <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: '89%' }}></div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-muted mb-1">{isFrench ? 'Tendance d\'Urgence' : 'Urgency Trend'}</p>
                <p className="text-2xl font-bold text-red-400">↑ 25%</p>
                <p className="text-xs text-muted mt-1">{isFrench ? 'vs mois dernier' : 'vs last month'}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-muted mb-1">{isFrench ? 'Aperçu de Confiance' : 'Confidence Insight'}</p>
                <p className="text-2xl font-bold text-green-400">87%</p>
                <p className="text-xs text-muted mt-1">{isFrench ? 'Excellente qualité' : 'Excellent quality'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mock Relationship Insights (Static Placeholder) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mb-8"
        >
          <div className="card-base p-6 bg-gradient-to-br from-pink-500/5 to-purple-500/5">
            <h2 className="text-heading mb-4">
              {isFrench ? '💼 Aperçus Relationnels' : '💼 Relationship Insights'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-muted mb-2">{isFrench ? 'Clients à Forte Valeur' : 'High-Value Clients'}</p>
                <p className="text-3xl font-bold text-purple-400">6</p>
                <p className="text-xs text-muted mt-1">{isFrench ? 'Nécessite une attention immédiate' : 'Require immediate attention'}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-muted mb-2">{isFrench ? 'Taux de Réponse Moyen' : 'Avg Response Rate'}</p>
                <p className="text-3xl font-bold text-pink-400">94%</p>
                <p className="text-xs text-muted mt-1">{isFrench ? 'Dans les 2 heures' : 'Within 2 hours'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Leads Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="space-y-4"
        >
          {/* LEADS Title */}
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">
              {isFrench ? 'PROSPECTS' : 'LEADS'}
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent"></div>
          </div>
          
          {/* Leads List */}
          <div className="space-y-3">
          {activeTab === 'active' && filteredLeads.map((lead, idx) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="card-base card-hover p-5 bg-white/5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted text-xs block mb-1">{isFrench ? 'Nom' : 'Name'}</span>
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
                  <span className="text-muted text-xs block mb-1">{isFrench ? 'Email' : 'Email'}</span>
                  <p className="text-blue-400">{lead.email}</p>
                </div>
                <div>
                  <span className="text-muted text-xs block mb-1">{isFrench ? 'Langue' : 'Language'}</span>
                  <p className="uppercase text-xs font-mono">{lead.language}</p>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="text-muted text-xs block mb-1">{isFrench ? 'Message' : 'Message'}</span>
                  <p className="text-body italic">&quot;{lead.message}&quot;</p>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="text-muted text-xs block mb-1">{isFrench ? 'Résumé IA' : 'AI Summary'}</span>
                  <p className="text-body">{lead.ai_summary}</p>
                </div>
                <div>
                  <span className="text-muted text-xs block mb-1">{isFrench ? 'Intention' : 'Intent'}</span>
                  <p className="text-blue-300 font-medium">{lead.intent}</p>
                </div>
                <div>
                  <span className="text-muted text-xs block mb-1">{isFrench ? 'Ton' : 'Tone'}</span>
                  <p className="text-body">{lead.tone}</p>
                </div>
                <div>
                  <span className="text-muted text-xs block mb-1">{isFrench ? 'Urgence' : 'Urgency'}</span>
                  <p className={
                    lead.urgency === (isFrench ? 'Élevée' : 'High') ? 'text-red-400 font-semibold' :
                    lead.urgency === (isFrench ? 'Moyenne' : 'Medium') ? 'text-yellow-400' :
                    'text-green-400'
                  }>
                    {lead.urgency}
                  </p>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="text-muted text-xs block mb-1">{isFrench ? 'Confiance' : 'Confidence'}</span>
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
                    <span className="text-muted text-xs block mb-1">💡 {isFrench ? 'Aperçu Relationnel' : 'Relationship Insight'}</span>
                    <p className="text-blue-300 text-sm">{lead.relationship_insight}</p>
                  </div>
                )}
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="text-muted text-xs block mb-1">{isFrench ? 'Horodatage' : 'Timestamp'}</span>
                  <p className="text-xs font-mono text-muted">
                    {new Date(lead.timestamp).toLocaleString(isFrench ? 'fr-CA' : 'en-US')}
                  </p>
                </div>
              </div>

              {/* Action Buttons (Disabled in Demo) */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                <div className="relative group">
                  <button
                    disabled
                    className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400/50 cursor-not-allowed opacity-50 text-xs"
                  >
                    🏷️
                  </button>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-blue-600 text-white text-[0.9rem] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-150 whitespace-nowrap pointer-events-none z-10">
                    {isFrench ? 'Tagger' : 'Tag'} {isFrench ? '(Désactivé en démo)' : '(Disabled in demo)'}
                  </span>
                </div>
                <div className="relative group">
                  <button
                    disabled
                    className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-400/50 cursor-not-allowed opacity-50 text-xs"
                  >
                    📦
                  </button>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-yellow-600 text-white text-[0.9rem] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-150 whitespace-nowrap pointer-events-none z-10">
                    {isFrench ? 'Archiver' : 'Archive'} {isFrench ? '(Désactivé en démo)' : '(Disabled in demo)'}
                  </span>
                </div>
                <div className="relative group">
                  <button
                    disabled
                    className="p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400/50 cursor-not-allowed opacity-50 text-xs"
                  >
                    🗑️
                  </button>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-red-600 text-white text-[0.9rem] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-150 whitespace-nowrap pointer-events-none z-10">
                    {isFrench ? 'Supprimer' : 'Delete'} {isFrench ? '(Désactivé en démo)' : '(Disabled in demo)'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Show message when no leads match filters */}
          {filteredLeads.length === 0 && activeTab === 'active' && (
            <div className="text-center py-12 text-muted">
              <p>{isFrench ? 'Aucun lead ne correspond aux filtres sélectionnés' : 'No leads match the selected filters'}</p>
            </div>
          )}

          {/* Show placeholder for other tabs */}
          {activeTab !== 'active' && (
            <div className="text-center py-12 text-muted">
              <p>{isFrench 
                ? `Onglet "${activeTab === 'archived' ? 'Archivés' : activeTab === 'deleted' ? 'Supprimés' : 'Convertis'}" - Pas de données de démo disponibles`
                : `"${activeTab === 'archived' ? 'Archived' : activeTab === 'deleted' ? 'Deleted' : 'Converted'}" tab - No demo data available`}
              </p>
            </div>
          )}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 pt-8 border-t border-white/10 text-center"
        >
          <p className="text-muted text-sm mb-2">
            {isFrench 
              ? 'Cette page est une simulation de démo en direct du tableau de bord client Avenir AI Solutions.'
              : 'This page is a live demo simulation of the Avenir AI Solutions client dashboard.'}
          </p>
          <p className="text-muted text-xs">
            {isFrench ? '© 2025 Avenir AI Solutions. Tous droits réservés.' : '© 2025 Avenir AI Solutions. All rights reserved.'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
