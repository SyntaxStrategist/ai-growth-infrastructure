"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLocale } from 'next-intl';

type ClientData = {
  clientId: string;
  businessName: string;
  apiKey: string;
};

export default function ApiAccess() {
  const locale = useLocale();
  const router = useRouter();
  const isFrench = locale === 'fr';

  const [client, setClient] = useState<ClientData | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const t = {
    title: isFrench ? 'Accès API' : 'API Access',
    subtitle: isFrench ? 'Intégrez Avenir AI à vos systèmes' : 'Integrate Avenir AI into your systems',
    apiEndpoint: isFrench ? 'Point de terminaison API' : 'API Endpoint',
    apiKey: isFrench ? 'Clé API' : 'API Key',
    show: isFrench ? 'Afficher' : 'Show',
    hide: isFrench ? 'Masquer' : 'Hide',
    copy: isFrench ? 'Copier' : 'Copy',
    copied: isFrench ? 'Copié !' : 'Copied!',
    exampleRequest: isFrench ? 'Exemple de requête JSON' : 'Example JSON Request',
    zapierIntegration: isFrench ? 'Intégration Zapier' : 'Zapier Integration',
    backToDashboard: isFrench ? '← Retour au tableau de bord' : '← Back to Dashboard',
    notAuthenticated: isFrench ? 'Veuillez vous connecter' : 'Please log in',
  };

  useEffect(() => {
    const savedClient = localStorage.getItem('client_session');
    if (savedClient) {
      try {
        setClient(JSON.parse(savedClient));
      } catch {
        router.push(`/${locale}/client/dashboard`);
      }
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
        <p>{t.notAuthenticated}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] text-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <a
            href={`/${locale}/client/dashboard`}
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm mb-4 inline-block"
          >
            {t.backToDashboard}
          </a>
          <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
          <p className="text-white/60">{t.subtitle}</p>
        </motion.div>

        {/* API Endpoint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-white/10 p-6 bg-white/5 mb-6"
        >
          <h3 className="text-lg font-semibold mb-3">{t.apiEndpoint}</h3>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-3 rounded-md bg-black/30 border border-white/10 text-blue-400 font-mono text-sm">
              https://aveniraisolutions.ca/api/lead
            </code>
            <button
              onClick={() => copyToClipboard('https://aveniraisolutions.ca/api/lead')}
              className="px-4 py-3 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all"
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
          className="rounded-lg border border-white/10 p-6 bg-white/5 mb-6"
        >
          <h3 className="text-lg font-semibold mb-3">{t.apiKey}</h3>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-3 rounded-md bg-black/30 border border-white/10 text-purple-400 font-mono text-sm">
              {showKey ? client.apiKey : '•'.repeat(40)}
            </code>
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-4 py-3 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 transition-all"
            >
              {showKey ? t.hide : t.show}
            </button>
            <button
              onClick={() => copyToClipboard(client.apiKey)}
              className="px-4 py-3 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all"
            >
              {copied ? t.copied : t.copy}
            </button>
          </div>
        </motion.div>

        {/* Example Request */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg border border-white/10 p-6 bg-white/5 mb-6"
        >
          <h3 className="text-lg font-semibold mb-3">{t.exampleRequest}</h3>
          <pre className="px-4 py-3 rounded-md bg-black/30 border border-white/10 text-green-400 font-mono text-xs overflow-x-auto">
{curlExample}
          </pre>
        </motion.div>

        {/* Zapier Integration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-lg border border-white/10 p-6 bg-white/5"
        >
          <h3 className="text-lg font-semibold mb-4">{t.zapierIntegration}</h3>
          <div className="space-y-3 text-sm text-white/80">
            {isFrench ? (
              <>
                <p><strong>1.</strong> Créez un nouveau Zap dans Zapier</p>
                <p><strong>2.</strong> Choisissez votre déclencheur (ex: nouveau formulaire Google Forms, nouveau contact HubSpot)</p>
                <p><strong>3.</strong> Ajoutez une action: <code className="px-2 py-1 bg-black/30 rounded text-blue-400">Webhooks by Zapier → POST</code></p>
                <p><strong>4.</strong> URL: <code className="px-2 py-1 bg-black/30 rounded text-blue-400">https://aveniraisolutions.ca/api/lead</code></p>
                <p><strong>5.</strong> En-têtes: <code className="px-2 py-1 bg-black/30 rounded text-purple-400">x-api-key: {client.apiKey.substring(0, 20)}...</code></p>
                <p><strong>6.</strong> Corps de requête: Mappez les champs name, email, message</p>
                <p><strong>7.</strong> Testez et activez votre Zap !</p>
              </>
            ) : (
              <>
                <p><strong>1.</strong> Create a new Zap in Zapier</p>
                <p><strong>2.</strong> Choose your trigger (e.g., new Google Form submission, new HubSpot contact)</p>
                <p><strong>3.</strong> Add an action: <code className="px-2 py-1 bg-black/30 rounded text-blue-400">Webhooks by Zapier → POST</code></p>
                <p><strong>4.</strong> URL: <code className="px-2 py-1 bg-black/30 rounded text-blue-400">https://aveniraisolutions.ca/api/lead</code></p>
                <p><strong>5.</strong> Headers: <code className="px-2 py-1 bg-black/30 rounded text-purple-400">x-api-key: {client.apiKey.substring(0, 20)}...</code></p>
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

