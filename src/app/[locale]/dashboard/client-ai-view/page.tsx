"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';

const AITrainingProgress = dynamic(() => import('../../../../components/AITrainingProgress'), { 
  ssr: false,
});

const UniversalLanguageToggle = dynamic(() => import('../../../../components/UniversalLanguageToggle'), {
  ssr: true,
});

type Client = {
  id: string;
  business_name: string;
};

export default function AdminClientAIViewPage() {
  const locale = useLocale();
  const router = useRouter();
  const isFrench = locale === 'fr';

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  useEffect(() => {
    // Check if admin is authorized
    const adminAuth = localStorage.getItem('admin_auth');
    if (adminAuth === 'true') {
      setAuthorized(true);
      fetchClients();
    } else {
      router.push(`/${locale}/dashboard`);
    }
  }, [router, locale]);

  async function fetchClients() {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setClients(data.data);
          if (data.data.length > 0) {
            setSelectedClientId(data.data[0].id);
          }
        }
      }
    } catch (error) {
      console.error('[AdminClientAIView] Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }

  const t = {
    title: isFrench ? 'Vue Client - Intelligence IA' : 'Client View - AI Intelligence',
    subtitle: isFrench 
      ? 'Voir l\'intelligence IA d\'un client spécifique'
      : 'View specific client AI intelligence',
    selectClient: isFrench ? 'Sélectionner un client :' : 'Select Client:',
    backToDashboard: isFrench ? '← Retour au tableau de bord' : '← Back to Dashboard',
    dashboard: isFrench ? 'Tableau de bord' : 'Dashboard',
    systemAI: isFrench ? 'IA Système' : 'System AI',
    clientView: isFrench ? 'Vue Client' : 'Client View',
    logout: isFrench ? 'Déconnexion' : 'Logout',
    noClients: isFrench ? 'Aucun client disponible' : 'No clients available',
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    router.push(`/${locale}/dashboard`);
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] text-white">
      {/* Universal Language Toggle */}
      <UniversalLanguageToggle />
      
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-2 transition-colors"
          >
            {t.backToDashboard}
          </button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
              <p className="text-white/60">{t.subtitle}</p>
            </div>
            
            {/* Navigation Menu */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/${locale}/dashboard`)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm"
              >
                📊 {t.dashboard}
              </button>
              <button
                onClick={() => router.push(`/${locale}/dashboard/ai-intelligence`)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm"
              >
                🧠 {t.systemAI}
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-sm font-semibold"
              >
                👤 {t.clientView}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-all text-sm"
              >
                {t.logout}
              </button>
            </div>
          </div>
        </div>

        {/* Client Selector */}
        <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4">
          <label className="block text-sm font-semibold mb-2">{t.selectClient}</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full md:w-96 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500 transition-colors"
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id} className="bg-gray-900">
                {client.business_name}
              </option>
            ))}
          </select>
        </div>

        {/* AI Training Progress Component */}
        {selectedClientId ? (
          <AITrainingProgress clientId={selectedClientId} locale={locale} />
        ) : (
          <div className="text-white/60 text-center py-12">
            {t.noClients}
          </div>
        )}
      </div>
    </div>
  );
}

