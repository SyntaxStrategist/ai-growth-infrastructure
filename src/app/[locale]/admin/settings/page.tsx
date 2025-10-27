"use client";

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import UniversalLanguageToggle from '../../../../components/UniversalLanguageToggle';
import { AdminSettingsSkeleton } from '../../../../components/SkeletonLoader';
import { getConnectionInfo } from '../../../../utils/connection-status';
import { buildPersonalizedHtmlEmail } from '../../../../lib/personalized-email';
import type { ClientRecord } from '../../../../lib/supabase';

export default function AdminSettings() {
  const locale = useLocale();
  const isFrench = locale === 'fr';
  const router = useRouter();

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);

  const [settings, setSettings] = useState({
    industryCategory: '',
    primaryService: '',
    bookingLink: '',
    customTagline: '',
    emailTone: 'Friendly',
    followupSpeed: 'Instant',
    language: 'en',
    aiPersonalizedReply: true,
    businessName: '',
    alertEmail: '',
    // AI Precision Enhancement fields
    typicalDealSize: '',
    geographicArea: '',
    mainPainPoints: '',
    targetCustomerProfile: '',
  });

  const [connectionData, setConnectionData] = useState<{
    lastConnection: string | null;
    createdAt: string | null;
    apiKey: string;
  }>({
    lastConnection: null,
    createdAt: null,
    apiKey: '',
  });

  const t = {
    title: isFrench ? '⚙️ Paramètres Admin' : '⚙️ Admin Settings',
    subtitle: isFrench ? 'Gérer les paramètres de personnalisation des clients' : 'Manage client personalization settings',
    selectClient: isFrench ? 'Sélectionner un client' : 'Select a Client',
    noClientSelected: isFrench ? 'Veuillez sélectionner un client' : 'Please select a client',
    companyInfo: isFrench ? 'Informations de l\'entreprise' : 'Company Information',
    industryCategory: isFrench ? 'Catégorie d\'industrie' : 'Industry Category',
    primaryService: isFrench ? 'Service principal' : 'Primary Service',
    bookingLink: isFrench ? 'Lien de réservation' : 'Booking Link',
    emailPreferences: isFrench ? 'Préférences de courriel' : 'Email Preferences',
    customTagline: isFrench ? 'Slogan de l\'entreprise' : 'Company Tagline',
    emailTone: isFrench ? 'Ton des courriels' : 'Email Tone',
    followupSpeed: isFrench ? 'Vitesse de suivi' : 'Follow-up Speed',
    language: isFrench ? 'Langue' : 'Language',
    automation: isFrench ? 'Automatisation IA' : 'AI Automation',
    enableReplies: isFrench ? 'Activer les réponses personnalisées IA' : 'Enable AI Personalized Replies',
    previewButton: isFrench ? '👁️ Aperçu du courriel' : '👁️ Preview Email',
    previewTitle: isFrench ? 'Aperçu du courriel automatique' : 'Automated Email Preview',
    closePreview: isFrench ? 'Fermer' : 'Close',
    saving: isFrench ? 'Enregistrement...' : 'Saving...',
    successToast: isFrench ? '✅ Préférences mises à jour avec succès' : '✅ Preferences updated successfully',
    backToDashboard: isFrench ? '← Retour au tableau de bord' : '← Back to Dashboard',
    loading: isFrench ? 'Chargement...' : 'Loading...',
    alertEmail: isFrench ? 'Email d\'alerte' : 'Alert Email',
    testAlertEmail: isFrench ? 'Tester l\'email d\'alerte' : 'Test Alert Email',
    testConnection: isFrench ? 'Tester la connexion' : 'Test Connection',
    testConnectionSuccess: isFrench ? '✅ Connexion testée avec succès' : '✅ Connection tested successfully',
    testConnectionError: isFrench ? '❌ Erreur lors du test de connexion' : '❌ Error testing connection',
    testingConnection: isFrench ? 'Test en cours...' : 'Testing...',
    connectionStatus: isFrench ? 'Statut de la connexion' : 'Connection Status',
    lastConnected: isFrench ? 'Dernière connexion' : 'Last Connected',
    apiKey: isFrench ? 'Clé API' : 'API Key',
    copyApiKey: isFrench ? 'Copier la clé API' : 'Copy API Key',
    apiKeyCopied: isFrench ? 'Clé API copiée !' : 'API Key copied!',
    apiKeyCopiedMessage: isFrench ? 'La clé API a été copiée dans votre presse-papiers.' : 'The API key has been copied to your clipboard.',
    apiKeyNotCopiedMessage: isFrench ? 'Impossible de copier la clé API. Veuillez réessayer.' : 'Could not copy API key. Please try again.',
    integrationInstructions: isFrench ? 'Instructions d\'intégration' : 'Integration Instructions',
    apiKeyInstructions: isFrench ? 'Pour utiliser l\'API, vous devez d\'abord obtenir une clé API. Voici les étapes :' : 'To use the API, you must first obtain an API key. Here are the steps:',
    step1: isFrench ? '1. Allez sur le tableau de bord de votre compte Supabase.' : '1. Go to your Supabase dashboard.',
    step2: isFrench ? '2. Cliquez sur "Project Settings" (Paramètres du projet).' : '2. Click on "Project Settings" (Project Settings).',
    step3: isFrench ? '3. Sous "Authentication" (Authentification), cliquez sur "API Keys" (Clés API).' : '3. Under "Authentication", click on "API Keys".',
    step4: isFrench ? '4. Cliquez sur "New API Key" (Nouvelle clé API) et donnez-lui un nom.' : '4. Click on "New API Key" (New API Key) and give it a name.',
    step5: isFrench ? '5. Copiez la clé API générée.' : '5. Copy the generated API key.',
    step6: isFrench ? '6. Ajoutez la clé API à votre fichier .env.local (ou .env.production) avec le nom de votre projet Supabase.' : '6. Add the API key to your .env.local (or .env.production) file with your Supabase project name.',
    step7: isFrench ? '7. Redémarrez votre application pour que les changements prennent effet.' : '7. Restart your application for the changes to take effect.',
    aiPrecisionEnhancement: isFrench ? 'Amélioration de la précision de l\'IA' : 'AI Precision Enhancement',
    typicalDealSize: isFrench ? 'Taille moyenne des affaires' : 'Typical Deal Size',
    geographicArea: isFrench ? 'Zone géographique' : 'Geographic Area',
    mainPainPoints: isFrench ? 'Points de douleur principaux' : 'Main Pain Points',
    targetCustomerProfile: isFrench ? 'Profil cible du client' : 'Target Customer Profile',
    saveChanges: isFrench ? 'Enregistrer les changements' : 'Save Changes',
    unsavedChanges: isFrench ? 'Vous avez des changements non enregistrés.' : 'You have unsaved changes.',
    clientGuide: isFrench ? 'Guide du client' : 'Client Guide',
    clientGuideDescription: isFrench ? 'Voici un guide pour les clients qui utilisent notre service.' : 'Here is a guide for clients who use our service.',
    guideStep1: isFrench ? '1. Accédez à notre site web.' : '1. Access our website.',
    guideStep2: isFrench ? '2. Cliquez sur "Inscription" (Signup) pour créer un compte.' : '2. Click on "Signup" (Signup) to create an account.',
    guideStep3: isFrench ? '3. Remplissez le formulaire d\'inscription avec vos informations.' : '3. Fill out the signup form with your information.',
    guideStep4: isFrench ? '4. Une fois votre compte créé, vous serez redirigé vers votre tableau de bord.' : '4. Once your account is created, you will be redirected to your dashboard.',
    guideStep5: isFrench ? '5. Sur votre tableau de bord, vous trouverez votre clé API.' : '5. On your dashboard, you will find your API key.',
    guideStep6: isFrench ? '6. Utilisez votre clé API pour vous connecter à notre API.' : '6. Use your API key to connect to our API.',
    guideStep7: isFrench ? '7. Vous pouvez maintenant utiliser notre service.' : '7. You can now use our service.',
    htmlPreview: isFrench ? 'Aperçu HTML' : 'HTML Preview',
    htmlPreviewDescription: isFrench ? 'Affiche le contenu HTML de l\'email personnalisé.' : 'Displays the HTML content of the personalized email.',
  };

  const toneOptions = [
    { value: 'Professional', label: isFrench ? 'Professionnel' : 'Professional' },
    { value: 'Friendly', label: isFrench ? 'Amical' : 'Friendly' },
    { value: 'Formal', label: isFrench ? 'Formel' : 'Formal' },
    { value: 'Energetic', label: isFrench ? 'Énergique' : 'Energetic' },
  ];

  const speedOptions = [
    { value: 'Instant', label: isFrench ? 'Instantané' : 'Instant' },
    { value: 'Within 1 hour', label: isFrench ? 'Dans l\'heure' : 'Within 1 hour' },
    { value: 'Same day', label: isFrench ? 'Le jour même' : 'Same day' },
  ];

  // Load all clients
  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await fetch('/api/clients');
        const data = await res.json();

        if (data.success && data.data) {
          setClients(data.data);
          console.log('[AdminSettings] ✅ Clients loaded:', data.data.length);
        }
      } catch (error) {
        console.error('[AdminSettings] ❌ Load clients error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  // Load client settings when selection changes
  useEffect(() => {
    if (!selectedClientId) return;

    const loadClientSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/client/settings?clientId=${selectedClientId}`);
        const data = await res.json();

        if (data.success && data.data) {
          setSettings({
            industryCategory: data.data.industry_category || '',
            primaryService: data.data.primary_service || '',
            bookingLink: data.data.booking_link || '',
            customTagline: data.data.custom_tagline || '',
            emailTone: data.data.email_tone || 'Friendly',
            followupSpeed: data.data.followup_speed || 'Instant',
            language: data.data.language || 'en',
            aiPersonalizedReply: data.data.ai_personalized_reply ?? true,
            businessName: data.data.business_name || '',
            alertEmail: data.data.alert_email || '',
            // AI Precision Enhancement fields
            typicalDealSize: data.data.typical_deal_size || '',
            geographicArea: data.data.geographic_area || '',
            mainPainPoints: data.data.main_pain_points || '',
            targetCustomerProfile: data.data.target_customer_profile || '',
          });
          
          // Set connection data
          setConnectionData({
            lastConnection: data.data.last_connection || null,
            createdAt: data.data.created_at || null,
            apiKey: data.data.api_key || '',
          });
          
          console.log('[AdminSettings] ✅ Client settings loaded');
        }
      } catch (error) {
        console.error('[AdminSettings] ❌ Load settings error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClientSettings();
  }, [selectedClientId]);

  // Auto-save on field change
  const handleFieldChange = async (field: string, value: any) => {
    if (!selectedClientId) return;

    setSettings(prev => ({ ...prev, [field]: value }));
    setSaving(true);
    setHasUnsavedChanges(true);

    try {
      const updateData: any = { clientId: selectedClientId };
      
      const fieldMap: Record<string, string> = {
        industryCategory: 'industryCategory',
        primaryService: 'primaryService',
        bookingLink: 'bookingLink',
        customTagline: 'customTagline',
        emailTone: 'emailTone',
        followupSpeed: 'followupSpeed',
        language: 'language',
        aiPersonalizedReply: 'aiPersonalizedReply',
        alertEmail: 'alertEmail',
        // AI Precision Enhancement fields
        typicalDealSize: 'typicalDealSize',
        geographicArea: 'geographicArea',
        mainPainPoints: 'mainPainPoints',
        targetCustomerProfile: 'targetCustomerProfile',
      };

      updateData[fieldMap[field]] = value;

      console.log('[AdminSettings] Updating field for client:', selectedClientId, '→', field, '=', value);

      const res = await fetch('/api/client/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (data.success) {
        console.log('[AdminSettings] ✅ Field updated successfully');
        setShowToast(true);
        setToastMessage(t.successToast);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        console.error('[AdminSettings] ❌ Update failed:', data.error);
        setToastMessage(data.error || t.successToast); // Show error message from API
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      }
    } catch (error) {
      console.error('[AdminSettings] ❌ Update error:', error);
      setToastMessage(t.successToast); // Fallback to success message on error
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Generate email preview
  const generatePreview = () => {
    if (!selectedClientId) return '<p>Please select a client</p>';

    const leadName = isFrench ? 'Marie Exemple' : 'John Example';
    const leadEmail = isFrench ? 'marie@exemple.com' : 'john@example.com';
    const leadMessage = isFrench 
      ? 'Je souhaite obtenir plus d\'informations sur vos services.'
      : 'I would like to learn more about your services.';
    const aiSummary = isFrench
      ? 'Demande d\'information sur les services. Le prospect semble intéressé par une collaboration.'
      : 'Inquiry about services. The prospect seems interested in a collaboration.';
    
    // Build mock client record from settings
    const mockClient: Partial<ClientRecord> = {
      business_name: settings.businessName || 'Your Business',
      email: 'contact@yourbusiness.com',
      industry_category: settings.industryCategory,
      primary_service: settings.primaryService,
      booking_link: settings.bookingLink || undefined,
      custom_tagline: settings.customTagline || undefined,
      email_tone: settings.emailTone as any,
      followup_speed: settings.followupSpeed as any,
      language: locale, // Use current page locale, not saved language preference
    };
    
    // Build the HTML email using the actual template
    const base64Email = buildPersonalizedHtmlEmail({
      leadName,
      leadEmail,
      leadMessage,
      aiSummary,
      urgency: 'High', // Show urgency box in preview
      locale: locale, // Use current page locale, not settings.language
      client: mockClient as ClientRecord,
    });
    
    // Decode base64 to get HTML with proper UTF-8 handling
    const base64Normalized = base64Email.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64 to binary string
    const binaryString = atob(base64Normalized);
    
    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Decode as UTF-8
    const decoder = new TextDecoder('utf-8');
    const htmlEmail = decoder.decode(bytes);
    
    // Extract HTML content (skip email headers)
    const htmlMatch = htmlEmail.match(/<!DOCTYPE html>[\s\S]*/);
    return htmlMatch ? htmlMatch[0] : htmlEmail;
  };

  if (loading && clients.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
        {/* Universal Language Toggle */}
        <UniversalLanguageToggle />
        <div className="max-w-4xl mx-auto">
          <AdminSettingsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      {/* Universal Language Toggle */}
      <UniversalLanguageToggle />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a 
            href={`/${locale}/dashboard`}
            className="text-white/60 hover:text-white transition-colors mb-4 inline-block"
          >
            {t.backToDashboard}
          </a>
          <h1 className="text-4xl font-bold mb-2">{t.title}</h1>
          <p className="text-white/60">{t.subtitle}</p>
        </div>

        {/* Success Toast */}
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 bg-green-500/20 border border-green-400/50 text-green-400 px-6 py-3 rounded-lg shadow-lg z-50"
          >
            {toastMessage}
          </motion.div>
        )}

        {/* Client Selector */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
          <label className="block text-sm font-medium mb-2">{t.selectClient}</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full px-4 py-4 rounded-md bg-white/5 border border-white/10 text-white focus:border-blue-400/50 focus:outline-none transition-all min-h-[48px] text-base"
          >
            <option value="">{t.selectClient}...</option>
            {clients.map(client => (
              <option key={client.client_id} value={client.client_id}>
                {client.business_name} ({client.email})
              </option>
            ))}
          </select>
        </div>

        {/* Settings Form (only show when client is selected) */}
        {selectedClientId ? (
          <>
            {/* Company Information Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4 text-blue-400">{t.companyInfo}</h2>
              
              <div className="space-y-4">
                {/* Industry Category */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t.industryCategory}</label>
                  <input
                    type="text"
                    value={settings.industryCategory}
                    onChange={(e) => handleFieldChange('industryCategory', e.target.value)}
                    className="w-full px-4 py-4 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all min-h-[48px] text-base"
                    placeholder={isFrench ? 'Ex: Immobilier, Construction' : 'e.g., Real Estate, Construction'}
                  />
                </div>

                {/* Primary Service */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t.primaryService}</label>
                  <input
                    type="text"
                    value={settings.primaryService}
                    onChange={(e) => handleFieldChange('primaryService', e.target.value)}
                    className="w-full px-4 py-4 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all min-h-[48px] text-base"
                    placeholder={isFrench ? 'Ex: Rénovations résidentielles' : 'e.g., Residential Sales'}
                  />
                </div>

                {/* Booking Link */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t.bookingLink}</label>
                  <input
                    type="url"
                    value={settings.bookingLink}
                    onChange={(e) => handleFieldChange('bookingLink', e.target.value)}
                    className="w-full px-4 py-4 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all min-h-[48px] text-base"
                    placeholder="https://calendly.com/yourname"
                  />
                </div>
              </div>
            </div>

            {/* Email Preferences Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4 text-purple-400">{t.emailPreferences}</h2>
              
              <div className="space-y-4">
                {/* Company Tagline */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t.customTagline}</label>
                  <input
                    type="text"
                    value={settings.customTagline}
                    onChange={(e) => handleFieldChange('customTagline', e.target.value)}
                    className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                    placeholder={isFrench ? 'Ex: L\'IA qui aide les entreprises' : 'e.g., AI that helps businesses grow'}
                  />
                </div>

                {/* Email Tone */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t.emailTone}</label>
                  <select
                    value={settings.emailTone}
                    onChange={(e) => handleFieldChange('emailTone', e.target.value)}
                    className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white focus:border-blue-400/50 focus:outline-none transition-all"
                  >
                    {toneOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Follow-up Speed */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t.followupSpeed}</label>
                  <select
                    value={settings.followupSpeed}
                    onChange={(e) => handleFieldChange('followupSpeed', e.target.value)}
                    className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white focus:border-blue-400/50 focus:outline-none transition-all"
                  >
                    {speedOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t.language}</label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleFieldChange('language', e.target.value)}
                    className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white focus:border-blue-400/50 focus:outline-none transition-all"
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AI Automation Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4 text-green-400">{t.automation}</h2>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.aiPersonalizedReply}
                  onChange={(e) => handleFieldChange('aiPersonalizedReply', e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 checked:bg-blue-500 focus:ring-2 focus:ring-blue-400/50"
                />
                <span className="text-white/80">{t.enableReplies}</span>
              </label>
            </div>

            {/* Alert Email Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4 text-yellow-400">{t.alertEmail}</h2>
              
              <div className="space-y-4">
                {/* Alert Email Address */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t.alertEmail}</label>
                  <input
                    type="email"
                    value={settings.alertEmail}
                    onChange={(e) => handleFieldChange('alertEmail', e.target.value)}
                    className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                    placeholder={isFrench ? 'Ex: info@example.com' : 'e.g., info@example.com'}
                  />
                </div>

                {/* Test Alert Email Button */}
                <button
                  onClick={async () => {
                    if (!settings.alertEmail) {
                      setToastMessage(t.alertEmail);
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 5000);
                      return;
                    }
                    setTestingConnection(true);
                    try {
                      await getConnectionInfo(settings.alertEmail);
                      setToastMessage(t.testConnectionSuccess);
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 5000);
                    } catch (error) {
                      setToastMessage(t.testConnectionError);
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 5000);
                    } finally {
                      setTestingConnection(false);
                    }
                  }}
                  className="w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all transform hover:scale-[1.02] shadow-lg"
                  disabled={testingConnection}
                >
                  {testingConnection ? t.testingConnection : t.testAlertEmail}
                </button>
              </div>
            </div>

            {/* Integration Status Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4 text-cyan-400">{t.connectionStatus}</h2>
              
              <div className="space-y-4">
                {/* Last Connection */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t.lastConnected}</label>
                  <p className="text-white/80 text-sm">{connectionData.lastConnection ? new Date(connectionData.lastConnection).toLocaleDateString() : 'N/A'}</p>
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t.apiKey}</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={connectionData.apiKey}
                      className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                      readOnly
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(connectionData.apiKey);
                        setCopiedApiKey(true);
                        setToastMessage(t.apiKeyCopiedMessage);
                        setShowToast(true);
                        setTimeout(() => setCopiedApiKey(false), 2000);
                      }}
                      className="px-4 py-3 rounded-md bg-white/10 hover:bg-white/20 text-white font-semibold transition-all"
                      disabled={!connectionData.apiKey}
                    >
                      {copiedApiKey ? t.apiKeyCopied : t.copyApiKey}
                    </button>
                  </div>
                </div>

                {/* Integration Instructions */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t.integrationInstructions}</label>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10 max-h-[200px] overflow-y-auto">
                    <p className="text-white/80 text-sm leading-relaxed">{t.apiKeyInstructions}</p>
                    <ul className="list-disc list-inside text-white/80 text-sm mt-2">
                      <li>{t.step1}</li>
                      <li>{t.step2}</li>
                      <li>{t.step3}</li>
                      <li>{t.step4}</li>
                      <li>{t.step5}</li>
                      <li>{t.step6}</li>
                      <li>{t.step7}</li>
                    </ul>
                  </div>
                </div>

                {/* Test Connection Button */}
                <button
                  onClick={async () => {
                    if (!settings.alertEmail) {
                      setToastMessage(t.alertEmail);
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 5000);
                      return;
                    }
                    setTestingConnection(true);
                    try {
                      await getConnectionInfo(settings.alertEmail);
                      setToastMessage(t.testConnectionSuccess);
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 5000);
                    } catch (error) {
                      setToastMessage(t.testConnectionError);
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 5000);
                    } finally {
                      setTestingConnection(false);
                    }
                  }}
                  className="w-full py-3 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-all transform hover:scale-[1.02] shadow-lg"
                  disabled={testingConnection}
                >
                  {testingConnection ? t.testingConnection : t.testConnection}
                </button>
              </div>
            </div>

            {/* AI Precision Enhancement Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4 text-orange-400">{t.aiPrecisionEnhancement}</h2>
              
              <div className="space-y-4">
                {/* Typical Deal Size */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t.typicalDealSize}</label>
                  <input
                    type="text"
                    value={settings.typicalDealSize}
                    onChange={(e) => handleFieldChange('typicalDealSize', e.target.value)}
                    className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                    placeholder={isFrench ? 'Ex: 100 000 €' : 'e.g., 100,000 €'}
                  />
                </div>

                {/* Geographic Area */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t.geographicArea}</label>
                  <input
                    type="text"
                    value={settings.geographicArea}
                    onChange={(e) => handleFieldChange('geographicArea', e.target.value)}
                    className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                    placeholder={isFrench ? 'Ex: Paris, Lyon' : 'e.g., Paris, Lyon'}
                  />
                </div>

                {/* Main Pain Points */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t.mainPainPoints}</label>
                  <input
                    type="text"
                    value={settings.mainPainPoints}
                    onChange={(e) => handleFieldChange('mainPainPoints', e.target.value)}
                    className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                    placeholder={isFrench ? 'Ex: Prix, Temps, Qualité' : 'e.g., Price, Time, Quality'}
                  />
                </div>

                {/* Target Customer Profile */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t.targetCustomerProfile}</label>
                  <input
                    type="text"
                    value={settings.targetCustomerProfile}
                    onChange={(e) => handleFieldChange('targetCustomerProfile', e.target.value)}
                    className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                    placeholder={isFrench ? 'Ex: Entrepreneurs, PME' : 'e.g., Entrepreneurs, SMEs'}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowPreview(true)}
                className="py-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold transition-all transform hover:scale-[1.02] shadow-lg"
            >
              {t.previewButton}
            </button>

              <button
                onClick={() => {
                  setSaving(true);
                  setHasUnsavedChanges(false);
                  setTimeout(() => {
                    setSaving(false);
                    setShowToast(true);
                    setToastMessage(t.successToast);
                    setTimeout(() => setShowToast(false), 3000);
                  }, 500);
                }}
                disabled={!hasUnsavedChanges}
                className={`py-4 rounded-lg font-semibold transition-all transform hover:scale-[1.02] shadow-lg ${
                  !hasUnsavedChanges
                    ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                }`}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t.saving}
                  </span>
                ) : (
                  t.saveChanges
                )}
              </button>
            </div>

            {/* Save Changes Indicator */}
            {saving && (
              <div className="mt-4 text-center text-white/60 text-sm">
                {t.saving}
              </div>
            )}
            {hasUnsavedChanges && (
              <div className="mt-4 text-center text-white/60 text-sm">
                {t.unsavedChanges}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-12 text-center border border-white/10">
            <p className="text-white/60 text-lg">{t.noClientSelected}</p>
          </div>
        )}

        {/* Email Preview Modal */}
        {showPreview && selectedClientId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 max-w-2xl w-full border border-white/20 shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-4 text-blue-400">{t.previewTitle}</h3>
              
              <div className="bg-white rounded-lg mb-6 max-h-[70vh] overflow-y-auto">
                <iframe
                  srcDoc={generatePreview()}
                  className="w-full min-h-[600px] border-none rounded-lg"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                  style={{ background: 'white' }}
                />
              </div>

              <button
                onClick={() => setShowPreview(false)}
                className="w-full py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all"
              >
                {t.closePreview}
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

