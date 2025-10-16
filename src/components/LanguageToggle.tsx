"use client";

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { routing } from '../i18n/routing';

export function LanguageToggle() {
  const t = useTranslations('language');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const switchLanguage = (newLocale: string) => {
    // Remove current locale from pathname and add new one
    const segments = pathname.split('/');
    const currentSegment = segments[1];
    if (currentSegment && routing.locales.includes(currentSegment as typeof routing.locales[number])) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    const newPath = segments.join('/');
    router.push(newPath);
  };

  // Return placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm opacity-70">{t('toggle')}:</span>
        <div className="flex gap-1">
          <div className="px-2 py-1 text-xs rounded w-8 h-6 bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
          <div className="px-2 py-1 text-xs rounded w-8 h-6 bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm opacity-70">{t('toggle')}:</span>
      <div className="flex gap-1">
        <button
          onClick={() => switchLanguage('en')}
          className={`px-2 py-1 text-xs rounded ${
            locale === 'en'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {t('en')}
        </button>
        <button
          onClick={() => switchLanguage('fr')}
          className={`px-2 py-1 text-xs rounded ${
            locale === 'fr'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {t('fr')}
        </button>
      </div>
    </div>
  );
}
