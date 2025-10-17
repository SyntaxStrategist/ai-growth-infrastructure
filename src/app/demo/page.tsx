'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function DemoPage() {
  const [locale, setLocale] = useState<'en' | 'fr'>('en');

  const t = {
    en: {
      title: 'Your AI-Powered Growth Dashboard',
      subtitle: 'See how Avenir AI Solutions automates client engagement, lead tracking, and performance analytics.',
      bookDemo: '🔗 Book a Demo',
      leadOverview: 'Lead Overview',
      leadsCaptured: 'Leads Captured',
      avgResponseTime: 'Avg Response Time',
      conversionRate: 'Conversion Rate',
      automationInsights: 'Automation Insights',
      aiResponses: 'AI Responses',
      manualInterventions: 'Manual Interventions',
      successRate: 'Success Rate',
      recentConversations: 'Recent Conversations',
      performanceOverTime: 'Performance Over Time',
      demoData: 'Demo Data',
      footer: 'This page is a live demo simulation of the Avenir AI Solutions client dashboard.',
      month: 'Month',
      value: 'Value',
    },
    fr: {
      title: 'Votre Tableau de Bord de Croissance IA',
      subtitle: 'Découvrez comment Avenir AI Solutions automatise l\'engagement client, le suivi des prospects et l\'analyse de performance.',
      bookDemo: '🔗 Réserver une Démo',
      leadOverview: 'Aperçu des Prospects',
      leadsCaptured: 'Prospects Capturés',
      avgResponseTime: 'Temps de Réponse Moyen',
      conversionRate: 'Taux de Conversion',
      automationInsights: 'Aperçus d\'Automatisation',
      aiResponses: 'Réponses IA',
      manualInterventions: 'Interventions Manuelles',
      successRate: 'Taux de Succès',
      recentConversations: 'Conversations Récentes',
      performanceOverTime: 'Performance Dans le Temps',
      demoData: 'Données de Démo',
      footer: 'Cette page est une simulation en direct du tableau de bord client Avenir AI Solutions.',
      month: 'Mois',
      value: 'Valeur',
    },
  };

  const text = t[locale];

  // Mock data
  const metrics = {
    leadsCaptured: 247,
    avgResponseTime: '< 2 min',
    conversionRate: '34%',
  };

  const automationData = [
    { label: text.aiResponses, value: 89, color: 'bg-blue-500' },
    { label: text.manualInterventions, value: 11, color: 'bg-purple-500' },
    { label: text.successRate, value: 95, color: 'bg-green-500' },
  ];

  const conversations = [
    {
      name: 'Construction ABC Inc.',
      message: 'Interested in automation for our quote requests...',
      time: '12 min ago',
    },
    {
      name: 'Immobilier Québec',
      message: 'Can you handle bilingual lead forms?',
      time: '1 hour ago',
    },
    {
      name: 'Marketing Pro Ltd.',
      message: 'Looking for CRM integration options...',
      time: '3 hours ago',
    },
  ];

  const performanceData = [
    { month: 'Jan', value: 45 },
    { month: 'Feb', value: 52 },
    { month: 'Mar', value: 68 },
    { month: 'Apr', value: 73 },
    { month: 'May', value: 89 },
    { month: 'Jun', value: 95 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="https://www.aveniraisolutions.ca" target="_blank" className="flex items-center gap-3">
            <img src="/assets/logos/logo.svg" alt="Avenir AI Solutions" className="h-8" />
            <span className="text-xl font-bold">Avenir AI Solutions</span>
          </Link>
          
          {/* Language Toggle */}
          <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setLocale('en')}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                locale === 'en' ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLocale('fr')}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                locale === 'fr' ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'
              }`}
            >
              FR
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {text.title}
          </h1>
          <p className="text-xl text-white/70 mb-8 max-w-3xl mx-auto">
            {text.subtitle}
          </p>
          <Link
            href="https://www.aveniraisolutions.ca/contact"
            target="_blank"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            {text.bookDemo}
          </Link>
        </motion.div>

        {/* Demo Badge */}
        <div className="flex justify-center mb-8">
          <span className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-sm font-medium">
            ✨ {text.demoData}
          </span>
        </div>

        {/* Lead Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
            <h3 className="text-white/70 text-sm mb-2">{text.leadsCaptured}</h3>
            <p className="text-4xl font-bold text-white">{metrics.leadsCaptured}</p>
            <p className="text-green-400 text-sm mt-2">↑ 23% vs last month</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
            <h3 className="text-white/70 text-sm mb-2">{text.avgResponseTime}</h3>
            <p className="text-4xl font-bold text-white">{metrics.avgResponseTime}</p>
            <p className="text-green-400 text-sm mt-2">↓ 85% improvement</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
            <h3 className="text-white/70 text-sm mb-2">{text.conversionRate}</h3>
            <p className="text-4xl font-bold text-white">{metrics.conversionRate}</p>
            <p className="text-green-400 text-sm mt-2">↑ 12% vs last month</p>
          </div>
        </motion.div>

        {/* Automation Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">{text.automationInsights}</h2>
          <div className="space-y-4">
            {automationData.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-2">
                  <span className="text-white/70">{item.label}</span>
                  <span className="text-white font-semibold">{item.value}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ delay: 0.3 + idx * 0.1, duration: 0.8 }}
                    className={`h-full ${item.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Recent Conversations */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
          >
            <h2 className="text-2xl font-bold mb-6">{text.recentConversations}</h2>
            <div className="space-y-4">
              {conversations.map((conv, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="bg-white/5 rounded-lg p-4 border border-white/5 hover:border-blue-400/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-white">{conv.name}</h3>
                    <span className="text-xs text-white/50">{conv.time}</span>
                  </div>
                  <p className="text-white/70 text-sm">{conv.message}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Performance Over Time */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
          >
            <h2 className="text-2xl font-bold mb-6">{text.performanceOverTime}</h2>
            <div className="h-64 flex items-end justify-between gap-4">
              {performanceData.map((data, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${data.value}%` }}
                    transition={{ delay: 0.5 + idx * 0.1, duration: 0.6 }}
                    className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg relative group"
                    style={{ minHeight: '20px' }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-gray-900 px-2 py-1 rounded text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      {data.value}%
                    </div>
                  </motion.div>
                  <span className="text-xs text-white/50">{data.month}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold mb-4">
            {locale === 'en' ? 'Ready to automate your growth?' : 'Prêt à automatiser votre croissance ?'}
          </h2>
          <p className="text-white/70 mb-6">
            {locale === 'en' 
              ? 'Schedule a personalized demo to see how Avenir AI Solutions can transform your business.'
              : 'Planifiez une démo personnalisée pour voir comment Avenir AI Solutions peut transformer votre entreprise.'}
          </p>
          <Link
            href="https://www.aveniraisolutions.ca/contact"
            target="_blank"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            {text.bookDemo}
          </Link>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-white/10">
          <p className="text-white/50 text-sm">
            {text.footer}
          </p>
          <p className="text-white/30 text-xs mt-2">
            © {new Date().getFullYear()} Avenir AI Solutions. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

