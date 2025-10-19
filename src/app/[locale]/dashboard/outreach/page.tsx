"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import UniversalLanguageToggle from "../../../../components/UniversalLanguageToggle";

// Dynamic import to prevent hydration mismatches
const OutreachCenter = dynamic(() => import("../../../../components/dashboard/OutreachCenter"), { 
  ssr: false,
  loading: () => <div className="h-32 animate-pulse bg-white/5 rounded-xl border border-white/10"></div>
});

export default function OutreachPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState(false);

  // Check localStorage for existing auth
  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_auth');
    if (savedAuth === 'true') {
      setAuthorized(true);
    }
  }, []);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    
    try {
      const res = await fetch('/api/auth-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      const data = await res.json();
      
      if (data.authorized) {
        setAuthSuccess(true);
        localStorage.setItem('admin_auth', 'true');
        setTimeout(() => {
          setAuthorized(true);
        }, 800);
      } else {
        setAuthError(t('dashboard.auth.error'));
        setPassword("");
      }
    } catch {
      setAuthError(t('dashboard.auth.error'));
    }
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="rounded-lg border border-white/10 p-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5 relative overflow-hidden">
            {/* Glowing background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-xl"></div>
            
            <div className="relative">
              {/* Lock Icon */}
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-blue-500/10 border border-blue-400/30 flex items-center justify-center">
                  <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center mb-6">{t('dashboard.auth.title')}</h2>

              {authSuccess ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <div className="h-16 w-16 rounded-full bg-green-500/20 border border-green-400/40 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-400 font-medium">{t('dashboard.auth.success')}</p>
                </motion.div>
              ) : (
                <form onSubmit={handleAuth} className="space-y-4">
                  <div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('dashboard.auth.placeholder')}
                      className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                      autoFocus
                    />
                  </div>

                  {authError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-400 text-center"
                    >
                      {authError}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    className="w-full px-4 py-3 rounded-md bg-blue-500 text-white font-medium hover:bg-blue-600 transition-all cta-glow"
                  >
                    {t('dashboard.auth.button')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      {/* Universal Language Toggle */}
      <UniversalLanguageToggle />
      
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {t('outreach.title')}
            </h1>
            <p className="text-white/60">
              {t('outreach.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/${locale}/dashboard`}
              className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all duration-300 text-sm font-medium"
            >
              {locale === 'fr' ? '📊 Tableau de bord' : '📊 Dashboard'}
            </a>
            <a
              href={`/${locale}/dashboard/insights`}
              className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 transition-all duration-300 text-sm font-medium"
            >
              {locale === 'fr' ? '📊 Aperçus' : '📊 Insights'}
            </a>
            <a
              href={`/${locale}/admin/prospect-intelligence`}
              className="px-4 py-2 rounded-lg bg-pink-500/20 border border-pink-500/40 text-pink-400 hover:bg-pink-500/30 transition-all duration-300 text-sm font-medium"
            >
              {locale === 'fr' ? '🧠 Intelligence' : '🧠 Intelligence'}
            </a>
            <button
              onClick={() => {
                localStorage.removeItem('admin_auth');
                setAuthorized(false);
                setPassword("");
                setAuthError("");
              }}
              className="px-4 py-2 rounded-md bg-red-500/20 border border-red-400/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium"
            >
              {t('dashboard.auth.logout')}
            </button>
          </div>
        </motion.div>

        {/* Outreach Center Component */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <OutreachCenter locale={locale} />
        </motion.div>
      </div>
    </div>
  );
}
