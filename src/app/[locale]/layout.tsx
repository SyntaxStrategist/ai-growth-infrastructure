import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import { SessionProvider } from '../../components/SessionProvider';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return {
    title: locale === 'fr' ? 'Avenir AI Solutions' : 'Avenir AI Solutions',
    description: locale === 'fr' 
      ? 'Construisez plus intelligemment et rapidement avec l\'IA. Essayez notre assistant.'
      : 'Build smarter, faster with AI. Try our assistant.',
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Safety check: ensure locale is defined
  if (!locale) {
    console.error('[LocaleLayout] ❌ No locale parameter received! This should not happen.');
    notFound();
  }
  
  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale as any)) {
    console.error('[LocaleLayout] ❌ Invalid locale:', locale);
    notFound();
  }

  // Confirm locale is defined before loading messages
  console.log('[LocaleLayout] ✅ Locale confirmed before loading messages:', locale);

  // Explicitly get messages for the specific locale
  const messages = await getMessages({ locale });
  
  // Log for debugging
  console.log('[LocaleLayout] ============================================');
  console.log('[LocaleLayout] Locale detected:', locale);
  console.log('[LocaleLayout] Messages loaded from:', `messages/${locale}.json`);
  console.log('[LocaleLayout] Sample message (hero.title):', (messages as any)?.hero?.title?.substring(0, 50) + '...');
  console.log('[LocaleLayout] Total message keys:', Object.keys(messages).length);
  console.log('[LocaleLayout] ============================================');
  
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <SessionProvider>
        {children}
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
