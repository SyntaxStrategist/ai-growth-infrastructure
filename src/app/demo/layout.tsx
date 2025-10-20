import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Load messages for both English and French
  // Default to English if no locale is specified
  const defaultLocale = 'en';
  
  try {
    const messages = await getMessages({ locale: defaultLocale });
    
    console.log('[DemoLayout] ============================================');
    console.log('[DemoLayout] Demo page layout initialized');
    console.log('[DemoLayout] Default locale:', defaultLocale);
    console.log('[DemoLayout] Messages loaded from:', `messages/${defaultLocale}.json`);
    console.log('[DemoLayout] Total message keys:', Object.keys(messages).length);
    console.log('[DemoLayout] ============================================');
    
    return (
      <NextIntlClientProvider messages={messages} locale={defaultLocale}>
        {children}
      </NextIntlClientProvider>
    );
  } catch (error) {
    console.error('[DemoLayout] ❌ Failed to load messages:', error);
    
    // Fallback: provide empty messages object
    return (
      <NextIntlClientProvider messages={{}} locale={defaultLocale}>
        {children}
      </NextIntlClientProvider>
    );
  }
}
