"use client";

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function UniversalLanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div 
        className="fixed top-4 right-4 z-[20]"
        style={{ marginTop: '0.5rem', marginRight: '0.5rem' }}
      >
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/10 shadow-lg backdrop-blur-sm border border-white/20">
          <div className="w-12 h-7 bg-white/20 rounded animate-pulse"></div>
          <div className="w-12 h-7 bg-white/20 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  const switchLanguage = async (newLocale: 'en' | 'fr') => {
    if (newLocale === locale) return;

    console.log('[UniversalLanguageToggle] ============================================');
    console.log('[UniversalLanguageToggle] Switching language from', locale, 'to', newLocale);

    // Save to localStorage
    localStorage.setItem('avenir_language', newLocale);
    console.log('[UniversalLanguageToggle] ✅ Saved to localStorage');

    // Set cookie for middleware detection
    document.cookie = `avenir_language=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    console.log('[UniversalLanguageToggle] ✅ Cookie set for middleware');

    // Update Supabase if user is logged in
    const clientId = localStorage.getItem('clientId');
    if (clientId) {
      try {
        console.log('[UniversalLanguageToggle] Updating Supabase for client:', clientId);
        
        const response = await fetch('/api/client/update-language', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, language: newLocale }),
        });

        if (response.ok) {
          console.log('[UniversalLanguageToggle] ✅ Language preference saved to Supabase');
        }
      } catch (error) {
        console.error('[UniversalLanguageToggle] Failed to save preference:', error);
      }
    }

    // Show toast notification
    setToastMessage(newLocale === 'en' ? '✅ Switched to English' : '✅ Passé au français');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // Navigate to new locale path
    const segments = pathname.split('/').filter(Boolean);
    
    // Check if first segment is a locale
    if (segments[0] === 'en' || segments[0] === 'fr') {
      segments[0] = newLocale;
    } else {
      // No locale in path, add it
      segments.unshift(newLocale);
    }
    
    const newPath = '/' + segments.join('/');
    console.log('[UniversalLanguageToggle] Navigating to:', newPath);
    router.push(newPath);
  };

  const tooltipText = locale === 'fr' ? 'Mode Français' : 'English Mode';

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 z-50 bg-green-500/20 border border-green-400/50 text-green-400 px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Toggle */}
      <div 
        className="fixed top-4 right-4 z-[20]"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{ marginTop: '0.5rem', marginRight: '0.5rem' }}
      >
        <div className="flex items-center gap-3 bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 shadow-lg transition-all border border-white/20">
          <button
            onClick={() => switchLanguage('en')}
            className={`font-semibold uppercase tracking-wider transition-all ${
              locale === 'en'
                ? 'text-purple-400 drop-shadow-[0_0_14px_rgba(192,132,252,0.8)]'
                : 'text-gray-400 opacity-50 hover:opacity-80'
            }`}
            style={{ fontSize: '18px' }}
            title="English"
            aria-label="Switch to English"
          >
            EN
          </button>
          
          <div className="w-px h-6 bg-white/30"></div>
          
          <button
            onClick={() => switchLanguage('fr')}
            className={`font-semibold uppercase tracking-wider transition-all ${
              locale === 'fr'
                ? 'text-purple-400 drop-shadow-[0_0_14px_rgba(192,132,252,0.8)]'
                : 'text-gray-400 opacity-50 hover:opacity-80'
            }`}
            style={{ fontSize: '18px' }}
            title="Français"
            aria-label="Passer au français"
          >
            FR
          </button>
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 0.9, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute -bottom-9 right-0 bg-black text-white text-xs rounded-md px-3 py-1.5 whitespace-nowrap shadow-lg"
            >
              {tooltipText}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

