"use client";

import { useState } from "react";
import { motion } from "framer-motion";

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

export default function DemoClientDashboard() {
  const [locale, setLocale] = useState('en');
  const isFrench = locale === 'fr';
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'deleted' | 'converted'>('active');
  const [filter, setFilter] = useState({ urgency: 'all', language: 'all', minConfidence: 0 });
  const [tagFilter, setTagFilter] = useState<string>('all');

  // Mock client data
  const mockClient = {
    businessName: isFrench ? 'Entreprise Démo Inc.' : 'Demo Business Inc.',
    contactName: isFrench ? 'Jean Dupont' : 'John Smith',
    email: 'michael@test.com',
  };

  // Mock stats
  const stats = {
    total: 24,
    avgConfidence: 0.87,
    topIntent: isFrench ? 'Demande de Prix' : 'Quote Request',
    highUrgency: 6,
  };

  // Mock leads data
  const mockLeads: Lead[] = [
    {
      id: '1',
      name: 'Construction Pro Inc.',
      email: 'contact@constructionpro.com',
      message: 'We need a quote for commercial renovation services. Our project timeline is urgent.',
      ai_summary: isFrench 
        ? 'Client professionnel recherchant des services de rénovation commerciale avec échéancier serré.'
        : 'Professional client seeking commercial renovation services with tight timeline.',
      intent: isFrench ? 'Demande de Prix' : 'Quote Request',
      tone: isFrench ? 'Professionnel' : 'Professional',
      urgency: isFrench ? 'Élevée' : 'High',
      confidence_score: 0.92,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      current_tag: isFrench ? 'Prioritaire' : 'Priority',
      language: 'EN',
      relationship_insight: isFrench 
        ? 'Client potentiel à forte valeur avec besoin urgent'
        : 'High-value potential client with urgent need'
    },
    {
      id: '2',
      name: 'RealtyMax Group',
      email: 'info@realtymax.ca',
      message: 'Interested in your property management automation. Can we schedule a demo?',
      ai_summary: isFrench
        ? 'Client immobilier intéressé par l\'automatisation de la gestion immobilière.'
        : 'Real estate client interested in property management automation.',
      intent: isFrench ? 'Demande de Démo' : 'Demo Request',
      tone: isFrench ? 'Amical' : 'Friendly',
      urgency: isFrench ? 'Moyenne' : 'Medium',
      confidence_score: 0.85,
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      current_tag: null,
      language: 'EN',
      relationship_insight: isFrench
        ? 'Client engagé prêt pour une conversation de vente'
        : 'Engaged client ready for sales conversation'
    },
    {
      id: '3',
      name: 'Metro Renovations',
      email: 'contact@metroreno.com',
      message: 'Looking for AI-powered lead qualification for our renovation business.',
      ai_summary: isFrench
        ? 'Entreprise de rénovation recherchant une qualification automatisée des leads.'
        : 'Renovation company seeking automated lead qualification.',
      intent: isFrench ? 'Demande d\'Information' : 'Information Request',
      tone: isFrench ? 'Curieux' : 'Curious',
      urgency: isFrench ? 'Moyenne' : 'Medium',
      confidence_score: 0.78,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      current_tag: isFrench ? 'Suivi' : 'Follow-up',
      language: 'EN',
    },
    {
      id: '4',
      name: 'Agence Marketing Plus',
      email: 'bonjour@marketingplus.ca',
      message: 'Nous cherchons une solution d\'automatisation pour nos campagnes de génération de leads.',
      ai_summary: isFrench
        ? 'Agence marketing cherchant une automatisation pour la génération de leads.'
        : 'Marketing agency seeking automation for lead generation campaigns.',
      intent: isFrench ? 'Consultation' : 'Consultation',
      tone: isFrench ? 'Professionnel' : 'Professional',
      urgency: isFrench ? 'Faible' : 'Low',
      confidence_score: 0.81,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      current_tag: null,
      language: 'FR',
    },
  ];

  const t = {
    dashboardTitle: isFrench ? 'Tableau de bord Client' : 'Client Dashboard',
    subtitle: isFrench ? 'Tableau d\'intelligence en temps réel' : 'Real-time lead intelligence dashboard',
    demoNotice: isFrench ? 'MODE DÉMO - Données d\'exemple' : 'DEMO MODE - Sample Data',
    totalLeads: isFrench ? 'Total de Leads' : 'Total Leads',
    avgConfidence: isFrench ? 'Confiance Moyenne' : 'Avg Confidence',
    topIntent: isFrench ? 'Intention Principale' : 'Top Intent',
    highUrgency: isFrench ? 'Urgence Élevée' : 'High Urgency',
    apiAccess: isFrench ? '🔑 Accès API' : '🔑 API Access',
    settings: isFrench ? '⚙️ Paramètres' : '⚙️ Settings',
    name: isFrench ? 'Nom' : 'Name',
    email: isFrench ? 'Courriel' : 'Email',
    message: isFrench ? 'Message' : 'Message',
    summary: isFrench ? 'Résumé IA' : 'AI Summary',
    intent: isFrench ? 'Intention' : 'Intent',
    tone: isFrench ? 'Ton' : 'Tone',
    urgency: isFrench ? 'Urgence' : 'Urgency',
    confidence: isFrench ? 'Confiance' : 'Confidence',
    timestamp: isFrench ? 'Horodatage' : 'Timestamp',
    language: isFrench ? 'Langue' : 'Language',
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
      tag: isFrench ? 'Étiqueter' : 'Tag',
      archive: isFrench ? 'Archiver' : 'Archive',
      delete: isFrench ? 'Supprimer' : 'Delete',
      disabled: isFrench ? '(Désactivé en démo)' : '(Disabled in demo)',
    },
    footer: {
      demo: isFrench 
        ? 'Cette page est une démonstration en direct du tableau de bord client d\'Avenir AI Solutions.'
        : 'This page is a live demo simulation of the Avenir AI Solutions client dashboard.',
      copyright: isFrench
        ? '© 2025 Avenir AI Solutions. Tous droits réservés.'
        : '© 2025 Avenir AI Solutions. All rights reserved.',
    },
  };

  // Filter leads based on active filters
  const filteredLeads = mockLeads.filter(lead => {
    if (filter.urgency !== 'all' && lead.urgency !== filter.urgency && 
        !(filter.urgency === 'High' && lead.urgency === 'Élevée') &&
        !(filter.urgency === 'Medium' && lead.urgency === 'Moyenne') &&
        !(filter.urgency === 'Low' && lead.urgency === 'Faible')) {
      return false;
    }
    if (filter.language !== 'all' && lead.language !== filter.language) {
      return false;
    }
    if (lead.confidence_score < filter.minConfidence / 100) {
      return false;
    }
    if (tagFilter !== 'all' && lead.current_tag !== tagFilter) {
      return false;
    }
    return true;
  });

  // Get tag badge color
  function getTagBadgeColor(tag: string | null | undefined) {
    if (!tag) return '';
    switch (tag.toLowerCase()) {
      case 'priority':
      case 'prioritaire':
        return 'bg-red-500/20 border-red-500/40 text-red-400';
      case 'follow-up':
      case 'suivi':
        return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400';
      case 'qualified':
      case 'qualifié':
        return 'bg-green-500/20 border-green-500/40 text-green-400';
      default:
        return 'bg-blue-500/20 border-blue-500/40 text-blue-400';
    }
  }

  // Demo Dashboard UI (Exact Mirror of Real Dashboard - No Database Dependencies)
  return (
    <div className="min-h-screen p-8 bg-black text-white">
      {/* Language Toggle (Custom for demo - fixed top-right) */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center gap-2 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10">
          <button
            onClick={() => setLocale('en')}
            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
              locale === 'en' 
                ? 'bg-purple-500 text-white shadow-lg' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLocale('fr')}
            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
              locale === 'fr' 
                ? 'bg-purple-500 text-white shadow-lg' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            FR
          </button>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        {/* Demo Notice Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center"
        >
          <p className="text-yellow-300 font-semibold text-sm">
            ⚠️ {t.demoNotice}
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
            <h1 className="text-3xl font-bold mb-2">{t.dashboardTitle}</h1>
            <p className="text-white/60">{t.subtitle}</p>
            <p className="text-white/50 text-sm mt-1">{mockClient.businessName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled
              className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400/50 cursor-not-allowed transition-all duration-300 text-sm font-medium opacity-50"
              title={t.actions.disabled}
            >
              {t.settings}
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400/50 cursor-not-allowed transition-all duration-300 text-sm font-medium opacity-50"
              title={t.actions.disabled}
            >
              {t.apiAccess}
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
          <div className="rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:border-blue-400/30 transition-all">
            <div className="text-sm text-white/60 mb-1">{t.totalLeads}</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:border-blue-400/30 transition-all">
            <div className="text-sm text-white/60 mb-1">{t.avgConfidence}</div>
            <div className="text-3xl font-bold">{(stats.avgConfidence * 100).toFixed(0)}%</div>
          </div>
          <div className="rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:border-blue-400/30 transition-all">
            <div className="text-sm text-white/60 mb-1">{t.topIntent}</div>
            <div className="text-xl font-semibold truncate">{stats.topIntent}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:border-blue-400/30 transition-all">
            <div className="text-sm text-white/60 mb-1">{t.highUrgency}</div>
            <div className="text-3xl font-bold text-red-400">{stats.highUrgency}</div>
          </div>
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
            <option value="EN">EN</option>
            <option value="FR">FR</option>
          </select>

          <div className="flex items-center gap-2">
            <label className="text-sm text-white/70">{t.filters.minConfidence}:</label>
            <input
              type="range"
              min="0"
              max="100"
              value={filter.minConfidence}
              onChange={(e) => setFilter({ ...filter, minConfidence: parseInt(e.target.value) })}
              className="w-32"
            />
            <span className="text-sm font-mono text-white/80 min-w-[3rem]">{filter.minConfidence}%</span>
          </div>

          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm hover:border-blue-400/40 transition-all"
          >
            <option value="all">{t.filters.all} Tags</option>
            <option value="Priority">{isFrench ? 'Prioritaire' : 'Priority'}</option>
            <option value="Follow-up">{isFrench ? 'Suivi' : 'Follow-up'}</option>
            <option value="Qualified">{isFrench ? 'Qualifié' : 'Qualified'}</option>
          </select>
        </motion.div>

        {/* Mock AI Insights Widget (Static Placeholder) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <div className="rounded-xl border border-white/10 p-6 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              {isFrench ? 'Copilote de Croissance' : 'Growth Copilot'}
            </h2>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-lg bg-white/5 border border-blue-500/30">
                <p className="text-blue-300 font-medium mb-1">
                  {isFrench ? '💡 Aperçu IA' : '💡 AI Insight'}
                </p>
                <p className="text-white/70">
                  {isFrench 
                    ? 'Vos leads montrent une tendance vers les demandes de prix urgentes (+45% ce mois-ci). Envisagez d\'ajuster votre temps de réponse pour capturer plus d\'opportunités.'
                    : 'Your leads show a trend toward urgent quote requests (+45% this month). Consider adjusting your response time to capture more opportunities.'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-purple-500/30">
                <p className="text-purple-300 font-medium mb-1">
                  {isFrench ? '📈 Recommandation' : '📈 Recommendation'}
                </p>
                <p className="text-white/70">
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
          <div className="rounded-xl border border-white/10 p-6 bg-white/5">
            <h2 className="text-xl font-bold mb-4">
              {isFrench ? '📊 Journal d\'Activité Récente' : '📊 Recent Activity Log'}
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3 p-2 rounded bg-white/5">
                <span className="text-green-400">✓</span>
                <span className="text-white/70">{isFrench ? 'Lead tagué' : 'Lead tagged'}: Construction Pro Inc.</span>
                <span className="text-white/50 text-xs ml-auto">2h {isFrench ? 'il y a' : 'ago'}</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded bg-white/5">
                <span className="text-blue-400">→</span>
                <span className="text-white/70">{isFrench ? 'Nouveau lead reçu' : 'New lead received'}: RealtyMax Group</span>
                <span className="text-white/50 text-xs ml-auto">5h {isFrench ? 'il y a' : 'ago'}</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded bg-white/5">
                <span className="text-yellow-400">📦</span>
                <span className="text-white/70">{isFrench ? 'Lead archivé' : 'Lead archived'}: Old Prospect LLC</span>
                <span className="text-white/50 text-xs ml-auto">1d {isFrench ? 'il y a' : 'ago'}</span>
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
          <div className="rounded-xl border border-white/10 p-6 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
            <h2 className="text-xl font-bold mb-4">
              {isFrench ? '🔮 Moteur de Croissance Prédictif' : '🔮 Predictive Growth Engine'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-white/50 mb-1">{isFrench ? 'Score d\'Engagement' : 'Engagement Score'}</p>
                <p className="text-2xl font-bold text-blue-400">89/100</p>
                <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: '89%' }}></div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-white/50 mb-1">{isFrench ? 'Tendance d\'Urgence' : 'Urgency Trend'}</p>
                <p className="text-2xl font-bold text-red-400">↑ 25%</p>
                <p className="text-xs text-white/50 mt-1">{isFrench ? 'vs mois dernier' : 'vs last month'}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-white/50 mb-1">{isFrench ? 'Aperçu de Confiance' : 'Confidence Insight'}</p>
                <p className="text-2xl font-bold text-green-400">87%</p>
                <p className="text-xs text-white/50 mt-1">{isFrench ? 'Excellente qualité' : 'Excellent quality'}</p>
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
          <div className="rounded-xl border border-white/10 p-6 bg-gradient-to-br from-pink-500/5 to-purple-500/5">
            <h2 className="text-xl font-bold mb-4">
              {isFrench ? '💼 Aperçus Relationnels' : '💼 Relationship Insights'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-white/50 mb-2">{isFrench ? 'Clients à Forte Valeur' : 'High-Value Clients'}</p>
                <p className="text-3xl font-bold text-purple-400">6</p>
                <p className="text-xs text-white/50 mt-1">{isFrench ? 'Nécessite une attention immédiate' : 'Require immediate attention'}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-white/50 mb-2">{isFrench ? 'Taux de Réponse Moyen' : 'Avg Response Rate'}</p>
                <p className="text-3xl font-bold text-pink-400">94%</p>
                <p className="text-xs text-white/50 mt-1">{isFrench ? 'Dans les 2 heures' : 'Within 2 hours'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Leads Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="space-y-3"
        >
          {activeTab === 'active' && filteredLeads.map((lead, idx) => (
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

              {/* Action Buttons (Disabled in Demo) */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                <div className="relative group">
                  <button
                    disabled
                    className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400/50 cursor-not-allowed opacity-50 text-xs"
                  >
                    🏷️
                  </button>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white/70 text-[0.7rem] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-150 whitespace-nowrap pointer-events-none z-10">
                    {t.actions.tag} {t.actions.disabled}
                  </span>
                </div>
                <div className="relative group">
                  <button
                    disabled
                    className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400/50 cursor-not-allowed opacity-50 text-xs"
                  >
                    📦
                  </button>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white/70 text-[0.7rem] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-150 whitespace-nowrap pointer-events-none z-10">
                    {t.actions.archive} {t.actions.disabled}
                  </span>
                </div>
                <div className="relative group">
                  <button
                    disabled
                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400/50 cursor-not-allowed opacity-50 text-xs"
                  >
                    🗑️
                  </button>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white/70 text-[0.7rem] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-150 whitespace-nowrap pointer-events-none z-10">
                    {t.actions.delete} {t.actions.disabled}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Show message when no leads match filters */}
          {filteredLeads.length === 0 && activeTab === 'active' && (
            <div className="text-center py-12 text-white/50">
              <p>{isFrench ? 'Aucun lead ne correspond aux filtres sélectionnés' : 'No leads match the selected filters'}</p>
            </div>
          )}

          {/* Show placeholder for other tabs */}
          {activeTab !== 'active' && (
            <div className="text-center py-12 text-white/50">
              <p>{isFrench 
                ? `Onglet "${t.tabs[activeTab]}" - Pas de données de démo disponibles`
                : `"${t.tabs[activeTab]}" tab - No demo data available`}
              </p>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 pt-8 border-t border-white/10 text-center"
        >
          <p className="text-white/50 text-sm mb-2">
            {t.footer.demo}
          </p>
          <p className="text-white/30 text-xs">
            {t.footer.copyright}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
