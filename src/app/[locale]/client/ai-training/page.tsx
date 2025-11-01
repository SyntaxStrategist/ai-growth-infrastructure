"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import { useSession } from '../../../../components/SessionProvider';

const AITrainingProgress = dynamic(() => import('../../../../components/AITrainingProgress'), { 
  ssr: false,
});

const UniversalLanguageToggle = dynamic(() => import('../../../../components/UniversalLanguageToggle'), {
  ssr: true,
});

export default function AITrainingPage() {
  const locale = useLocale();
  const router = useRouter();
  const { session } = useSession();
  const isFrench = locale === 'fr';

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session.isAuthenticated) {
      router.push(`/${locale}/client/login`);
    } else {
      setLoading(false);
    }
  }, [session.isAuthenticated, router, locale]);

  const t = {
    title: isFrench ? 'Intelligence IA' : 'AI Intelligence',
    subtitle: isFrench 
      ? 'Suivez comment votre IA apprend de vos données'
      : 'Track how your AI learns from your data',
    backToDashboard: isFrench ? '← Retour au tableau de bord' : '← Back to Dashboard',
    insights: isFrench ? 'Aperçus' : 'Insights',
    aiTraining: isFrench ? 'Intelligence IA' : 'AI Training',
    settings: isFrench ? 'Paramètres' : 'Settings',
    apiAccess: isFrench ? 'Accès API' : 'API Access',
    logout: isFrench ? 'Déconnexion' : 'Logout',
  };

  const handleLogout = () => {
    router.push(`/${locale}/client/login`);
  };

  if (loading || !session.isAuthenticated) {
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
            onClick={() => router.push(`/${locale}/client/dashboard`)}
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
                onClick={() => router.push(`/${locale}/client/dashboard`)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm"
              >
                📊 {t.insights}
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-sm font-semibold"
              >
                🧠 {t.aiTraining}
              </button>
              <button
                onClick={() => router.push(`/${locale}/client/settings`)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm"
              >
                ⚙️ {t.settings}
              </button>
              <button
                onClick={() => router.push(`/${locale}/client/api-access`)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm"
              >
                🔑 {t.apiAccess}
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

        {/* AI Training Progress Component */}
        {session.client?.id && (
          <div className="mb-8">
            <AITrainingProgress clientId={session.client.id} locale={locale} />
          </div>
        )}

        {/* Additional AI Intelligence Sections Can Go Here */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Placeholder for future AI insights */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              📈 {isFrench ? 'Tendances d\'Apprentissage' : 'Learning Trends'}
            </h3>
            <p className="text-white/60 text-sm">
              {isFrench 
                ? 'Visualisations graphiques de la progression de votre IA au fil du temps.'
                : 'Visual charts of your AI\'s progress over time.'}
            </p>
            <div className="mt-4 text-white/40 text-xs">
              {isFrench ? 'Bientôt disponible' : 'Coming soon'}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              🎯 {isFrench ? 'Recommandations IA' : 'AI Recommendations'}
            </h3>
            <p className="text-white/60 text-sm">
              {isFrench 
                ? 'Suggestions personnalisées pour améliorer vos performances.'
                : 'Personalized suggestions to improve your performance.'}
            </p>
            <div className="mt-4 text-white/40 text-xs">
              {isFrench ? 'Bientôt disponible' : 'Coming soon'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

