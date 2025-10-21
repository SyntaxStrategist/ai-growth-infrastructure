"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "../../../../i18n/routing";
import { useLocale } from 'next-intl';
import { routing } from '../../../../i18n/routing';
import AvenirLogo from '../../../../components/AvenirLogo';
import { restoreSession, type ClientData } from '../../../../utils/session';

export default function ApiAccess() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const isFrench = locale === 'fr';

  const [client, setClient] = useState<ClientData | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const t = {
    title: isFrench ? 'Accès API' : 'API Access',
    subtitle: isFrench ? 'Intégrez Avenir AI à vos systèmes' : 'Integrate Avenir AI into your systems',
    apiEndpoint: isFrench ? 'Point de terminaison API' : 'API Endpoint',
    apiKey: isFrench ? 'Clé API' : 'API Key',
    securityWarning: isFrench 
      ? '⚠️ Ne partagez jamais cette clé API publiquement. Elle donne un accès complet à votre point de soumission de leads Avenir AI.'
      : '⚠️ Never share this API key publicly. It provides full access to your Avenir AI lead submission endpoint.',
    show: isFrench ? 'Afficher' : 'Show',
    hide: isFrench ? 'Masquer' : 'Hide',
    copy: isFrench ? 'Copier' : 'Copy',
    copied: isFrench ? 'Copié !' : 'Copied!',
    exampleRequest: isFrench ? 'Exemple de requête JSON' : 'Example JSON Request',
    zapierIntegration: isFrench ? 'Intégration Zapier' : 'Zapier Integration',
    backToDashboard: isFrench ? 'Retour au tableau de bord' : 'Back to Dashboard',
    notAuthenticated: isFrench ? 'Veuillez vous connecter' : 'Please log in',
    apiKeyMissing: isFrench ? 'Clé API non disponible' : 'API Key not available',
  };

  useEffect(() => {
    const session = restoreSession();
    if (session.isAuthenticated && session.client) {
      setClient(session.client);
    } else {
      router.push(`/${locale}/client/dashboard`);
    }
  }, [locale, router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exampleRequest = `{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I'm interested in your AI solutions",
  "timestamp": "${new Date().toISOString()}"
}`;

  const curlExample = `curl -X POST https://aveniraisolutions.ca/api/lead \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${client?.apiKey || 'YOUR_API_KEY'}" \\
  -d '${exampleRequest.replace(/\n/g, ' ')}'`;

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] text-white">
        {/* Language Toggle */}
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-3 bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 shadow-lg transition-all border border-white/20">
            <button
              onClick={() => {
                const segments = pathname.split('/');
                const currentSegment = segments[1];
                if (currentSegment && routing.locales.includes(currentSegment as typeof routing.locales[number])) {
                  segments[1] = 'en';
                } else {
                  segments.splice(1, 0, 'en');
                }
                const newPath = segments.join('/');
                router.push(newPath);
              }}
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
              onClick={() => {
                const segments = pathname.split('/');
                const currentSegment = segments[1];
                if (currentSegment && routing.locales.includes(currentSegment as typeof routing.locales[number])) {
                  segments[1] = 'fr';
                } else {
                  segments.splice(1, 0, 'fr');
                }
                const newPath = segments.join('/');
                router.push(newPath);
              }}
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
        </div>
        <p>{t.notAuthenticated}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] text-white">
      {/* Header with Logo and Language Toggle */}
      <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="w-full px-6 py-4 flex items-center justify-between min-h-[80px]">
          {/* Logo - Left Side (24px from edge) */}
          <a href={`/${locale}`} className="inline-block">
            <AvenirLogo locale={locale} showText={true} />
          </a>
          
          {/* Right Side - Back Button and Language Toggle */}
          <div className="flex items-center gap-4">
            {/* Back to Dashboard Button */}
            <a
              href={`/${locale}/client/dashboard`}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-all text-sm font-medium whitespace-nowrap -ml-[320px] w-[250px] text-center"
            >
              ← {t.backToDashboard}
            </a>
            
            {/* Language Toggle - Right Side (24px from edge) */}
            <div className="relative z-50">
              <div className="flex items-center gap-3 bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 shadow-lg transition-all border border-white/20">
                <button
                  onClick={() => {
                    const segments = pathname.split('/');
                    const currentSegment = segments[1];
                    if (currentSegment && routing.locales.includes(currentSegment as typeof routing.locales[number])) {
                      segments[1] = 'en';
                    } else {
                      segments.splice(1, 0, 'en');
                    }
                    const newPath = segments.join('/');
                    router.push(newPath);
                  }}
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
                  onClick={() => {
                    const segments = pathname.split('/');
                    const currentSegment = segments[1];
                    if (currentSegment && routing.locales.includes(currentSegment as typeof routing.locales[number])) {
                      segments[1] = 'fr';
                    } else {
                      segments.splice(1, 0, 'fr');
                    }
                    const newPath = segments.join('/');
                    router.push(newPath);
                  }}
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
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">{t.title}</h1>
          <p className="text-white/70 text-lg">{t.subtitle}</p>
        </motion.div>

        {/* API Endpoint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-white/10 p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5 mb-6 shadow-lg hover:border-blue-400/30 transition-all"
        >
          <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{t.apiEndpoint}</h3>
          <div className="flex items-center gap-3 flex-wrap">
            <code className="flex-1 px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-blue-400 font-mono text-sm min-w-[200px]">
              https://aveniraisolutions.ca/api/lead
            </code>
            <button
              onClick={() => copyToClipboard('https://aveniraisolutions.ca/api/lead')}
              className="px-4 py-3 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all font-medium shadow-lg hover:shadow-blue-500/30"
            >
              {copied ? t.copied : t.copy}
            </button>
          </div>
        </motion.div>

        {/* API Key */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-white/10 p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5 mb-6 shadow-lg hover:border-purple-400/30 transition-all"
        >
          <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t.apiKey}</h3>
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <code className="flex-1 px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-purple-400 font-mono text-sm min-w-[200px]">
              {showKey ? (client.apiKey || t.apiKeyMissing) : '•'.repeat(40)}
            </code>
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-4 py-3 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 transition-all font-medium shadow-lg hover:shadow-purple-500/30"
            >
              {showKey ? t.hide : t.show}
            </button>
            <button
              onClick={() => copyToClipboard(client.apiKey || t.apiKeyMissing)}
              className="px-4 py-3 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all font-medium shadow-lg hover:shadow-blue-500/30"
              disabled={!client.apiKey}
            >
              {copied ? t.copied : t.copy}
            </button>
          </div>
          
          {/* Security Warning */}
          <div className="pt-3 border-t border-white/10">
            <p className="text-xs italic text-amber-400/80 leading-relaxed">
              {t.securityWarning}
            </p>
          </div>
        </motion.div>

        {/* Example Request */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-white/10 p-6 bg-gradient-to-br from-green-500/5 to-emerald-500/5 mb-6 shadow-lg hover:border-green-400/30 transition-all"
        >
          <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{t.exampleRequest}</h3>
          <pre className="px-4 py-4 rounded-lg bg-black/40 border border-white/10 text-green-400 font-mono text-xs overflow-x-auto leading-relaxed">
{curlExample}
          </pre>
        </motion.div>

        {/* Zapier Integration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-white/10 p-6 bg-gradient-to-br from-orange-500/5 to-yellow-500/5 shadow-lg hover:border-orange-400/30 transition-all"
        >
          <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">{t.zapierIntegration}</h3>
          <div className="space-y-3 text-sm text-white/80">
            {isFrench ? (
              <>
                <p><strong>1.</strong> Créez un nouveau Zap dans Zapier</p>
                <p><strong>2.</strong> Choisissez votre déclencheur (ex: nouveau formulaire Google Forms, nouveau contact HubSpot)</p>
                <p><strong>3.</strong> Ajoutez une action: <code className="px-2 py-1 bg-black/30 rounded text-blue-400">Webhooks by Zapier → POST</code></p>
                <p><strong>4.</strong> URL: <code className="px-2 py-1 bg-black/30 rounded text-blue-400">https://aveniraisolutions.ca/api/lead</code></p>
                <p><strong>5.</strong> En-têtes: <code className="px-2 py-1 bg-black/30 rounded text-purple-400">x-api-key: {client.apiKey ? client.apiKey.substring(0, 20) + '...' : 'YOUR_API_KEY'}</code></p>
                <p><strong>6.</strong> Corps de requête: Mappez les champs name, email, message</p>
                <p><strong>7.</strong> Testez et activez votre Zap !</p>
              </>
            ) : (
              <>
                <p><strong>1.</strong> Create a new Zap in Zapier</p>
                <p><strong>2.</strong> Choose your trigger (e.g., new Google Form submission, new HubSpot contact)</p>
                <p><strong>3.</strong> Add an action: <code className="px-2 py-1 bg-black/30 rounded text-blue-400">Webhooks by Zapier → POST</code></p>
                <p><strong>4.</strong> URL: <code className="px-2 py-1 bg-black/30 rounded text-blue-400">https://aveniraisolutions.ca/api/lead</code></p>
                <p><strong>5.</strong> Headers: <code className="px-2 py-1 bg-black/30 rounded text-purple-400">x-api-key: {client.apiKey ? client.apiKey.substring(0, 20) + '...' : 'YOUR_API_KEY'}</code></p>
                <p><strong>6.</strong> Request Body: Map the fields name, email, message</p>
                <p><strong>7.</strong> Test and turn on your Zap!</p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

