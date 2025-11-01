"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';

const SystemAIIntelligence = dynamic(() => import('../../../../components/SystemAIIntelligence'), { 
  ssr: false,
});

const UniversalLanguageToggle = dynamic(() => import('../../../../components/UniversalLanguageToggle'), {
  ssr: true,
});

export default function AdminAIIntelligencePage() {
  const locale = useLocale();
  const router = useRouter();
  const isFrench = locale === 'fr';

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is authorized (stored in localStorage after login)
    const adminAuth = localStorage.getItem('admin_auth');
    if (adminAuth === 'true') {
      setAuthorized(true);
      setLoading(false);
    } else {
      router.push(`/${locale}/dashboard`);
    }
  }, [router, locale]);

  const t = {
    title: isFrench ? 'Intelligence IA du Système' : 'System AI Intelligence',
    subtitle: isFrench 
      ? 'Vue d\'ensemble globale de toutes les IA clients'
      : 'Global overview of all client AIs',
    backToDashboard: isFrench ? '← Retour au tableau de bord' : '← Back to Dashboard',
    dashboard: isFrench ? 'Tableau de bord' : 'Dashboard',
    aiIntelligence: isFrench ? 'Intelligence IA' : 'AI Intelligence',
    clientView: isFrench ? 'Vue Client' : 'Client View',
    logout: isFrench ? 'Déconnexion' : 'Logout',
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
      
      <div className="container mx-auto px-6 py-8 max-w-7xl">
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
                className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-sm font-semibold"
              >
                🧠 {t.aiIntelligence}
              </button>
              <button
                onClick={() => router.push(`/${locale}/dashboard/client-ai-view`)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm"
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

        {/* System AI Intelligence Component */}
        <SystemAIIntelligence locale={locale} />
      </div>
    </div>
  );
}

