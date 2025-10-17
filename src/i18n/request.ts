import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Safe fallback: if locale is undefined, use default immediately
  if (!locale) {
    locale = routing.defaultLocale;
    console.log('[i18n/request] ⚠️  No locale provided, using default:', locale);
  }

  console.log('[i18n/request] ========================================');
  console.log('[i18n/request] Requested locale:', locale);

  // Ensure that a valid locale is used
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    console.log('[i18n/request] ⚠️  Invalid locale "' + locale + '", falling back to default:', routing.defaultLocale);
    locale = routing.defaultLocale;
  }

  const messages = (await import(`../../messages/${locale}.json`)).default;
  
  console.log('[i18n/request] ✅ Loading messages from:', `messages/${locale}.json`);
  console.log('[i18n/request] First message key:', Object.keys(messages)[0]);
  console.log('[i18n/request] Sample (hero.title):', messages.hero?.title?.substring(0, 50) + '...');
  console.log('[i18n/request] ========================================');

  return {
    locale,
    messages
  };
});
