"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  // Load language preference on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('avenir_language') as Language;
    if (savedLang === 'en' || savedLang === 'fr') {
      setLanguageState(savedLang);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    console.log('[LanguageContext] Setting language to:', lang);
    setLanguageState(lang);
    localStorage.setItem('avenir_language', lang);
    
    // Update Supabase if user is logged in
    updateUserLanguagePreference(lang);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'fr' : 'en';
    setLanguage(newLang);
  };

  // Simple translation function (can be enhanced with full i18n later)
  const t = (key: string): string => {
    // This is a placeholder - actual translations should come from translation files
    return key;
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

/**
 * Update user's language preference in Supabase
 */
async function updateUserLanguagePreference(language: Language): Promise<void> {
  try {
    // Check if user is logged in (client or admin)
    const clientSession = localStorage.getItem('client_session');
    const clientId = localStorage.getItem('clientId');

    if (clientSession && clientId) {
      console.log('[LanguageContext] Updating client language preference:', language);
      
      const response = await fetch('/api/client/update-language', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, language }),
      });

      if (response.ok) {
        console.log('[LanguageContext] ✅ Language preference saved to Supabase');
      }
    }
  } catch (error) {
    console.error('[LanguageContext] Failed to update language preference:', error);
  }
}

