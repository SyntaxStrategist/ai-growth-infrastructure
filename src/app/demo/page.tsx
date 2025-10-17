'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ClientDemoPage() {
  const [locale, setLocale] = useState('en');
  const isFrench = locale === 'fr';

  // Translations
  const t = {
    heroTitle: isFrench ? 'Votre Tableau de Bord IA de Croissance' : 'Your AI-Powered Growth Dashboard',
    heroSubtitle: isFrench 
      ? 'Découvrez comment Avenir AI Solutions automatise l\'engagement client, le suivi des prospects et l\'analyse de performance.'
      : 'See how Avenir AI Solutions automates client engagement, lead tracking, and performance analytics.',
    bookDemo: isFrench ? '🔗 Réserver une Démo' : '🔗 Book a Demo',
    leadOverview: isFrench ? 'Aperçu des Prospects' : 'Lead Overview',
    leadsCaptured: isFrench ? 'Prospects Capturés' : 'Leads Captured',
    avgResponseTime: isFrench ? 'Temps de Réponse Moyen' : 'Avg Response Time',
    conversionRate: isFrench ? 'Taux de Conversion' : 'Conversion Rate',
    automationInsights: isFrench ? 'Insights d\'Automatisation' : 'Automation Insights',
    aiResponses: isFrench ? 'Réponses IA' : 'AI Responses',
    manualInterventions: isFrench ? 'Interventions Manuelles' : 'Manual Interventions',
    successRate: isFrench ? 'Taux de Succès' : 'Success Rate',
    recentConversations: isFrench ? 'Conversations Récentes' : 'Recent Conversations',
    performanceOverTime: isFrench ? 'Performance dans le Temps' : 'Performance Over Time',
    demoData: isFrench ? 'Données de Démo' : 'Demo Data',
    footer: isFrench 
      ? 'Cette page est une simulation en direct du tableau de bord client Avenir AI Solutions.'
      : 'This page is a live demo simulation of the Avenir AI Solutions client dashboard.',
    month: isFrench ? 'Mois' : 'Month',
    leads: isFrench ? 'Prospects' : 'Leads',
  };

  // Mock data
  const leadMetrics = {
    captured: 247,
    avgResponseTime: '< 2 min',
    conversionRate: '34%'
  };

  const automationData = {
    aiResponses: 892,
    manualInterventions: 124,
    successRate: 87
  };

  const recentConversations = [
    { id: 1, name: 'Construction Pro Inc.', message: 'Interested in automating our quote process...', time: '2h ago', status: 'active' },
    { id: 2, name: 'RealtyMax Group', message: 'Can we integrate with our CRM?...', time: '5h ago', status: 'responded' },
    { id: 3, name: 'Metro Renovations', message: 'Looking for lead qualification automation...', time: '1d ago', status: 'converted' },
    { id: 4, name: 'Elite Marketing Co.', message: 'Tell me more about your AI outreach...', time: '2d ago', status: 'active' },
  ];

  const performanceData = [
    { month: isFrench ? 'Jan' : 'Jan', leads: 45 },
    { month: isFrench ? 'Fév' : 'Feb', leads: 78 },
    { month: isFrench ? 'Mar' : 'Mar', leads: 112 },
    { month: isFrench ? 'Avr' : 'Apr', leads: 156 },
    { month: isFrench ? 'Mai' : 'May', leads: 189 },
    { month: isFrench ? 'Jun' : 'Jun', leads: 247 },
  ];

  const maxLeads = Math.max(...performanceData.map(d => d.leads));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      {/* Top Navbar */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="https://www.aveniraisolutions.ca" className="flex items-center">
              <img 
                src="/assets/logos/logo.svg" 
                alt="Avenir AI Solutions" 
                className="h-8 w-auto"
              />
            </Link>

            {/* Language Toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocale('en')}
                className={`px-3 py-1 rounded ${locale === 'en' ? 'bg-purple-500 text-white' : 'text-white/70 hover:text-white'} transition-colors`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale('fr')}
                className={`px-3 py-1 rounded ${locale === 'fr' ? 'bg-purple-500 text-white' : 'text-white/70 hover:text-white'} transition-colors`}
              >
                FR
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {t.heroTitle}
          </h1>
          <p className="text-lg text-white/70 mb-8 max-w-3xl mx-auto">
            {t.heroSubtitle}
          </p>
          <Link
            href="https://www.aveniraisolutions.ca/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            {t.bookDemo}
          </Link>
        </motion.div>

        {/* Lead Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{t.leadOverview}</h2>
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">
              {t.demoData}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <p className="text-white/70 text-sm mb-2">{t.leadsCaptured}</p>
              <p className="text-4xl font-bold text-white">{leadMetrics.captured}</p>
              <p className="text-green-400 text-sm mt-2">↑ 45% vs last month</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <p className="text-white/70 text-sm mb-2">{t.avgResponseTime}</p>
              <p className="text-4xl font-bold text-white">{leadMetrics.avgResponseTime}</p>
              <p className="text-green-400 text-sm mt-2">↓ 85% improvement</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <p className="text-white/70 text-sm mb-2">{t.conversionRate}</p>
              <p className="text-4xl font-bold text-white">{leadMetrics.conversionRate}</p>
              <p className="text-green-400 text-sm mt-2">↑ 12% improvement</p>
            </div>
          </div>
        </motion.div>

        {/* Automation Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{t.automationInsights}</h2>
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">
              {t.demoData}
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70">{t.aiResponses}</span>
                  <span className="text-white font-semibold">{automationData.aiResponses}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                    style={{ width: '87%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70">{t.manualInterventions}</span>
                  <span className="text-white font-semibold">{automationData.manualInterventions}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full"
                    style={{ width: '13%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70">{t.successRate}</span>
                  <span className="text-white font-semibold">{automationData.successRate}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full"
                    style={{ width: `${automationData.successRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Conversations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{t.recentConversations}</h2>
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">
              {t.demoData}
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg divide-y divide-white/10">
            {recentConversations.map((conv, idx) => (
              <div key={conv.id} className="p-6 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{conv.name}</h3>
                    <p className="text-white/70 text-sm">{conv.message}</p>
                  </div>
                  <span className={`ml-4 px-3 py-1 rounded-full text-xs ${
                    conv.status === 'converted' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : conv.status === 'responded' 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}>
                    {conv.status === 'converted' ? (isFrench ? 'Converti' : 'Converted') : 
                     conv.status === 'responded' ? (isFrench ? 'Répondu' : 'Responded') : 
                     (isFrench ? 'Actif' : 'Active')}
                  </span>
                </div>
                <p className="text-white/50 text-xs">{conv.time}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Performance Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{t.performanceOverTime}</h2>
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">
              {t.demoData}
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <div className="flex items-end justify-between gap-4 h-64">
              {performanceData.map((data, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.leads / maxLeads) * 100}%` }}
                    transition={{ duration: 0.6, delay: 1 + idx * 0.1 }}
                    className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg relative group"
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-sm font-semibold">{data.leads}</span>
                    </div>
                  </motion.div>
                  <p className="text-white/70 text-xs mt-2">{data.month}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-center py-8 border-t border-white/10"
        >
          <p className="text-white/50 text-sm">
            {t.footer}
          </p>
          <p className="text-white/30 text-xs mt-2">
            © 2025 Avenir AI Solutions. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

