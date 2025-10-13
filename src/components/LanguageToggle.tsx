"use client";

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { routing } from '../i18n/routing';

export function LanguageToggle() {
  const t = useTranslations('language');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLocale: string) => {
    // Remove current locale from pathname and add new one
    const segments = pathname.split('/');
    if (routing.locales.includes(segments[1] as any)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    const newPath = segments.join('/');
    router.push(newPath);
  };

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
