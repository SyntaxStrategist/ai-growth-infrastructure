"use client";

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import UniversalLanguageToggle from '../../../../components/UniversalLanguageToggle';
import { getConnectionInfo } from '../../../../utils/connection-status';
import { saveSession } from '../../../../utils/session';
import { buildPersonalizedHtmlEmail } from '../../../../lib/personalized-email';
import type { ClientRecord } from '../../../../lib/supabase';

export default function ClientSettings() {
  const locale = useLocale();
  const isFrench = locale === 'fr';
  const router = useRouter();

  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
    customUrgencyRules: '',
    targetCustomerProfile: '',
    avgResponseTimeGoal: '',
    competitiveBehavior: '',
    seasonalPatterns: '',
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

  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const t = {
    title: isFrench ? '⚙️ Paramètres' : '⚙️ Settings',
    subtitle: isFrench ? 'Personnalisez vos courriels automatiques' : 'Customize your automated emails',
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
    aiReplyDescription: isFrench 
      ? 'Lorsqu\'activé, l\'IA enverra automatiquement des réponses personnalisées à vos leads en fonction de leur message, urgence et intention. Les leads seront toujours capturés même si cette option est désactivée.'
      : 'When enabled, AI will automatically send personalized responses to your leads based on their message, urgency, and intent. Leads will still be captured even if this is disabled.',
    saveButton: isFrench ? '💾 Enregistrer les modifications' : '💾 Save Changes',
    previewButton: isFrench ? '👁️ Aperçu du courriel' : '👁️ Preview Email',
    previewTitle: isFrench ? 'Aperçu du courriel automatique' : 'Automated Email Preview',
    closePreview: isFrench ? 'Fermer' : 'Close',
    saving: isFrench ? 'Enregistrement...' : 'Saving...',
    successToast: isFrench ? '✅ Préférences enregistrées avec succès' : '✅ Preferences saved successfully',
    backToDashboard: isFrench ? '← Retour au tableau de bord' : '← Back to Dashboard',
    loading: isFrench ? 'Chargement...' : 'Loading...',
    noClientId: isFrench ? 'Aucun ID client trouvé. Veuillez vous reconnecter.' : 'No client ID found. Please log in again.',
    // Integration Status translations
    integrationStatus: isFrench ? 'Statut de l\'intégration' : 'Integration Status',
    formIntegration: isFrench ? '🔗 Intégration du Formulaire' : '🔗 Form Integration',
    status: isFrench ? 'Statut' : 'Status',
    lastLead: isFrench ? 'Dernier lead reçu' : 'Last lead received',
    totalLeads: isFrench ? 'Total de leads reçus' : 'Total leads received',
    apiKeyLabel: isFrench ? 'Clé API' : 'API Key',
    copyApiKey: isFrench ? 'Copier' : 'Copy',
    copied: isFrench ? 'Copié !' : 'Copied!',
    showApiKey: isFrench ? 'Afficher' : 'Show',
    hideApiKey: isFrench ? 'Masquer' : 'Hide',
    integrationInstructions: isFrench ? '⚙️ Pour connecter votre formulaire' : '⚙️ To connect your form',
    integrationStep1: isFrench ? 'Faites une requête POST vers:' : 'Make a POST request to:',
    integrationStep2: isFrench ? 'Incluez l\'en-tête:' : 'Include the header:',
    integrationStep3: isFrench ? 'Envoyez les données JSON:' : 'Send JSON data:',
    testConnection: isFrench ? '🧪 Tester la Connexion' : '🧪 Test Connection',
    testConnectionDesc: isFrench ? 'Envoyez un lead de test pour vérifier que tout fonctionne' : 'Send a test lead to verify everything works',
    viewDocs: isFrench ? '📖 Voir la Documentation' : '📖 View Documentation',
    // Client Guide translations
    clientGuide: isFrench ? 'Guide Client' : 'Client Guide',
    clientGuideDescription: isFrench ? 'Téléchargez votre guide complet pour maximiser l\'intelligence des prospects et la découverte de clients potentiels avec Avenir AI.' : 'Download your complete guide to maximize lead intelligence and prospect discovery with Avenir AI.',
    downloadGuide: isFrench ? '📥 Télécharger le Guide' : '📥 Download Guide',
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

  // Business goal is now a free text field to support any industry
  // Previously had dropdown options but changed to text input for flexibility

  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Get client ID from session/localStorage
        const storedClientId = localStorage.getItem('clientId');
        if (!storedClientId) {
          console.error('[ClientSettings] No client ID found');
          return;
        }

        setClientId(storedClientId);

        const res = await fetch(`/api/client/settings?clientId=${storedClientId}`);
        const data = await res.json();

        if (data.success && data.data) {
          setSettings({
            industryCategory: data.data.industry_category || '',
            primaryService: data.data.primary_service || '',
            bookingLink: data.data.booking_link || '',
            alertEmail: data.data.alert_email || '',
            customTagline: data.data.custom_tagline || '',
            emailTone: data.data.email_tone || 'Friendly',
            followupSpeed: data.data.followup_speed || 'Instant',
            language: data.data.language || 'en',
            aiPersonalizedReply: data.data.ai_personalized_reply ?? true,
            businessName: data.data.business_name || '',
            // AI Precision Enhancement fields
            typicalDealSize: data.data.typical_deal_size || '',
            geographicArea: data.data.geographic_area || '',
            mainPainPoints: data.data.main_pain_points || '',
            customUrgencyRules: data.data.custom_urgency_rules || '',
            targetCustomerProfile: data.data.target_customer_profile || '',
            avgResponseTimeGoal: data.data.avg_response_time_goal || '',
            competitiveBehavior: data.data.competitive_behavior || '',
            seasonalPatterns: data.data.seasonal_patterns || '',
          });

          // Set connection data
          setConnectionData({
            lastConnection: data.data.last_connection || null,
            createdAt: data.data.created_at || null,
            apiKey: data.data.api_key || '',
          });
          
          console.log('[ClientSettings] ✅ Settings loaded:', data.data);
        }
      } catch (error) {
        console.error('[ClientSettings] ❌ Load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Track field changes (don't auto-save anymore)
  const handleFieldChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Copy API key to clipboard
  const handleCopyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(connectionData.apiKey);
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    } catch (error) {
      console.error('[ClientSettings] Failed to copy API key:', error);
    }
  };

  // Test connection by sending a test lead
  const handleTestConnection = async () => {
    if (!connectionData.apiKey || !clientId) {
      console.error('[ClientSettings] No API key or client ID available');
      return;
    }

    setTestingConnection(true);

    try {
      console.log('[ClientSettings] ============================================');
      console.log('[ClientSettings] Sending test lead...');
      
      const res = await fetch('/api/client/test-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          apiKey: connectionData.apiKey,
          language: settings.language 
        }),
      });

      const data = await res.json();

      if (data.success) {
        console.log('[ClientSettings] ✅ Test lead sent successfully');
        console.log('[ClientSettings] Lead ID:', data.leadId);
        
        // Step 1: Refetch settings to get updated last_connection from database
        console.log('[ClientSettings] Refetching settings for updated connection status...');
        const settingsRes = await fetch(`/api/client/settings?clientId=${clientId}`);
        const settingsData = await settingsRes.json();
        
        if (settingsData.success && settingsData.data) {
          console.log('[ClientSettings] ✅ Fresh settings loaded');
          console.log('[ClientSettings] Updated last_connection:', settingsData.data.last_connection);
          
          // Step 2: Update connection data state for immediate UI update
          setConnectionData({
            lastConnection: settingsData.data.last_connection,
            createdAt: settingsData.data.created_at,
            apiKey: settingsData.data.api_key,
          });
          
          // Step 3: Update session in localStorage with fresh data
          const sessionData = localStorage.getItem('client_session');
          if (sessionData) {
            const parsedSession = JSON.parse(sessionData);
            const updatedSession = {
              ...parsedSession,
              lastConnection: settingsData.data.last_connection,
            };
            saveSession(updatedSession);
            console.log('[ClientSettings] ✅ Session updated in localStorage');
            
            // Dispatch storage event to trigger SessionProvider refresh
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'client_session',
              newValue: JSON.stringify(updatedSession),
              url: window.location.href,
              storageArea: localStorage,
            }));
            console.log('[ClientSettings] ✅ Storage event dispatched');
          }
        }
        
        // Step 4: Show success message
        setToastMessage(isFrench 
          ? '✅ Lead de test envoyé ! Redirection vers le tableau de bord...'
          : '✅ Test lead sent! Redirecting to dashboard...');
        setShowToast(true);
        
        // Step 5: Navigate to dashboard after short delay (allow session update to propagate)
        setTimeout(() => {
          console.log('[ClientSettings] ============================================');
          console.log('[ClientSettings] Navigating to dashboard...');
          console.log('[ClientSettings] Updated session should now be available');
          console.log('[ClientSettings] ============================================');
          router.push(`/${locale}/client/dashboard`);
        }, 1500);
        
      } else {
        console.error('[ClientSettings] ❌ Test failed:', data.error);
        setToastMessage(isFrench 
          ? `❌ Échec du test: ${data.error}`
          : `❌ Test failed: ${data.error}`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      }
    } catch (error) {
      console.error('[ClientSettings] Test connection error:', error);
      setToastMessage(isFrench 
        ? '❌ Erreur lors du test de connexion'
        : '❌ Connection test error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setTestingConnection(false);
    }
  };

  // Manual save function
  const handleSaveChanges = async () => {
    if (!clientId) {
      console.error('[ClientSettings] No client ID available');
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        clientId,
        industryCategory: settings.industryCategory,
        primaryService: settings.primaryService,
        bookingLink: settings.bookingLink || null,
        alertEmail: settings.alertEmail || null,
        customTagline: settings.customTagline || null,
        emailTone: settings.emailTone,
        followupSpeed: settings.followupSpeed,
        language: settings.language,
        aiPersonalizedReply: settings.aiPersonalizedReply,
        // AI Precision Enhancement fields
        typicalDealSize: settings.typicalDealSize || null,
        geographicArea: settings.geographicArea || null,
        mainPainPoints: settings.mainPainPoints || null,
        customUrgencyRules: settings.customUrgencyRules || null,
        targetCustomerProfile: settings.targetCustomerProfile || null,
        avgResponseTimeGoal: settings.avgResponseTimeGoal || null,
        competitiveBehavior: settings.competitiveBehavior || null,
        seasonalPatterns: settings.seasonalPatterns || null,
      };

      console.log('[ClientSettings] ============================================');
      console.log('[ClientSettings] Saving all preferences for client:', clientId);
      console.log('[ClientSettings] ============================================');
      console.log('[ClientSettings] Updated values:', {
        industry: updateData.industryCategory,
        service: updateData.primaryService,
        tone: updateData.emailTone,
        speed: updateData.followupSpeed,
        language: updateData.language,
      });

      const res = await fetch('/api/client/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (data.success) {
        console.log('[ClientSettings] ✅ Preferences saved successfully');
        console.log('[ClientSettings] Client ID:', clientId);
        setToastMessage(t.successToast);
        setShowToast(true);
        setHasUnsavedChanges(false);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        console.error('[ClientSettings] ❌ Save failed:', data.error);
        setToastMessage(isFrench ? '❌ Échec de l\'enregistrement' : '❌ Save failed');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('[ClientSettings] ❌ Save error:', error);
      setToastMessage(isFrench ? '❌ Erreur lors de l\'enregistrement' : '❌ Error saving');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Generate email preview using the actual tone-based template
  const generatePreview = () => {
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
      email_tone: settings.emailTone,
      followup_speed: settings.followupSpeed,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        {/* Universal Language Toggle */}
        <UniversalLanguageToggle />
        <div className="text-white text-xl">{t.loading}</div>
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
            href={`/${locale}/client/dashboard`}
            className="text-white/60 hover:text-white transition-colors mb-4 inline-block"
          >
            {t.backToDashboard}
          </a>
          <h1 className="text-4xl font-bold mb-2">{t.title}</h1>
          <p className="text-white/60">{t.subtitle}</p>
        </div>

        {/* Success/Error Toast */}
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-8 right-8 px-6 py-3 rounded-lg shadow-lg z-50 ${
              toastMessage.includes('✅') 
                ? 'bg-green-500/20 border border-green-400/50 text-green-400'
                : 'bg-red-500/20 border border-red-400/50 text-red-400'
            }`}
          >
            {toastMessage}
          </motion.div>
        )}

        {/* Integration Status Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">{t.formIntegration}</h2>
          
          {/* Connection Status */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div>
                <p className="text-sm text-white/60 mb-1">{t.status}</p>
                {(() => {
                  const connInfo = getConnectionInfo(connectionData.lastConnection);
                  return (
                    <div className="flex items-center gap-2">
                      <span className={`text-xl ${connInfo.icon}`}>{connInfo.icon}</span>
                      <span className={`font-semibold ${connInfo.color}`}>
                        {isFrench ? connInfo.statusTextFr : connInfo.statusText}
                      </span>
                    </div>
                  );
                })()}
              </div>
              <div className="text-right">
                <p className="text-sm text-white/60 mb-1">{t.lastLead}</p>
                <p className="text-sm text-white/90">
                  {connectionData.lastConnection 
                    ? getConnectionInfo(connectionData.lastConnection)[isFrench ? 'timeAgoFr' : 'timeAgo']
                    : (isFrench ? 'Jamais' : 'Never')}
                </p>
              </div>
            </div>

            {/* API Key Display */}
            <div>
              <label className="block text-sm font-medium mb-2">{t.apiKeyLabel}</label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={connectionData.apiKey}
                  readOnly
                  className="flex-1 px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-4 py-3 rounded-md bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all text-sm font-medium"
                >
                  {showApiKey ? t.hideApiKey : t.showApiKey}
                </button>
                <button
                  onClick={handleCopyApiKey}
                  className="px-4 py-3 rounded-md bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 transition-all text-sm font-medium"
                >
                  {copiedApiKey ? t.copied : t.copyApiKey}
                </button>
              </div>
            </div>
          </div>

          {/* Integration Instructions */}
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg mb-4">
            <p className="text-sm font-medium text-cyan-300 mb-3">{t.integrationInstructions}</p>
            
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-white/60 mb-1">{t.integrationStep1}</p>
                <code className="block bg-black/30 p-2 rounded text-cyan-400 text-xs overflow-x-auto">
                  POST https://www.aveniraisolutions.ca/api/lead
                </code>
              </div>
              
              <div>
                <p className="text-white/60 mb-1">{t.integrationStep2}</p>
                <code className="block bg-black/30 p-2 rounded text-cyan-400 text-xs overflow-x-auto">
                  x-api-key: {connectionData.apiKey.substring(0, 8)}...
                </code>
              </div>
              
              <div>
                <p className="text-white/60 mb-1">{t.integrationStep3}</p>
                <code className="block bg-black/30 p-2 rounded text-cyan-400 text-xs overflow-x-auto whitespace-pre">
{`{
  "name": "Lead Name",
  "email": "lead@example.com",
  "message": "Lead message..."
}`}
                </code>
              </div>
            </div>
          </div>

          {/* Test Connection Button */}
          <button
            onClick={handleTestConnection}
            disabled={testingConnection || !connectionData.apiKey}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {testingConnection ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {isFrench ? 'Test en cours...' : 'Testing...'}
              </span>
            ) : (
              t.testConnection
            )}
          </button>
          
          <p className="text-xs text-white/40 text-center mt-2">
            {t.testConnectionDesc}
          </p>
        </div>

        {/* Company Information Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">{t.companyInfo}</h2>
          
          <div className="space-y-4">
            {/* Industry Category */}
            <div>
              <label className="block text-sm font-medium mb-2">{t.industryCategory} *</label>
              <input
                type="text"
                value={settings.industryCategory}
                onChange={(e) => handleFieldChange('industryCategory', e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                placeholder={isFrench ? 'Ex: Immobilier, Construction' : 'e.g., Real Estate, Construction'}
              />
            </div>

            {/* Primary Service */}
            <div>
              <label className="block text-sm font-medium mb-2">{t.primaryService} *</label>
              <input
                type="text"
                value={settings.primaryService}
                onChange={(e) => handleFieldChange('primaryService', e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
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
                className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                placeholder="https://calendly.com/yourname"
              />
            </div>

            {/* Alert Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                🔔 {isFrench ? 'Courriel d\'alerte' : 'Alert Email'}
              </label>
              <input
                type="email"
                value={settings.alertEmail}
                onChange={(e) => handleFieldChange('alertEmail', e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                placeholder={isFrench ? 'votre@email.com' : 'your@email.com'}
              />
              <p className="mt-1 text-xs text-white/50">
                {isFrench ? 'Recevez des alertes par courriel pour les prospects urgents' : 'Get email alerts for urgent leads'}
              </p>
              {settings.alertEmail && (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/test-email-alert', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          clientId,
                          testEmail: settings.alertEmail,
                        }),
                      });
                      const data = await response.json();
                      if (data.success) {
                        setToastMessage(isFrench ? '✅ Courriel de test envoyé!' : '✅ Test email sent!');
                      } else {
                        setToastMessage(isFrench ? '❌ Échec de l\'envoi' : '❌ Failed to send');
                      }
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3000);
                    } catch (error) {
                      setToastMessage(isFrench ? '❌ Erreur' : '❌ Error');
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3000);
                    }
                  }}
                  className="mt-2 px-4 py-2 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-all"
                >
                  🧪 {isFrench ? 'Envoyer un courriel de test' : 'Send Test Email'}
                </button>
              )}
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

        {/* AI Precision Enhancement Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-2 text-yellow-400">
            🎯 {isFrench ? 'Amélioration de la Précision de l\'IA' : 'AI Precision Enhancement'}
          </h2>
          <p className="text-sm text-white/60 mb-4">
            {isFrench 
              ? 'Aidez l\'IA à mieux comprendre votre entreprise pour des analyses de leads plus précises.'
              : 'Help the AI better understand your business for more accurate lead analysis.'}
          </p>
          
          <div className="space-y-4">
            {/* Typical Deal Size */}
            <div>
              <label className="block text-sm font-medium mb-2">
                💰 {isFrench ? 'Taille de transaction typique' : 'Typical Deal Size'}
              </label>
              <input
                type="text"
                value={settings.typicalDealSize}
                onChange={(e) => handleFieldChange('typicalDealSize', e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                placeholder={isFrench ? 'Ex: $50,000-$100,000 CAD' : 'e.g., $50,000-$100,000 CAD'}
              />
            </div>

            {/* Geographic Area */}
            <div>
              <label className="block text-sm font-medium mb-2">
                📍 {isFrench ? 'Zone géographique' : 'Geographic Area'}
              </label>
              <input
                type="text"
                value={settings.geographicArea}
                onChange={(e) => handleFieldChange('geographicArea', e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                placeholder={isFrench ? 'Ex: Montréal, Québec, Canada' : 'e.g., Montreal, Quebec, Canada'}
              />
            </div>

            {/* Main Pain Points */}
            <div>
              <label className="block text-sm font-medium mb-2">
                ⚠️ {isFrench ? 'Principaux défis' : 'Main Pain Points'}
              </label>
              <textarea
                value={settings.mainPainPoints}
                onChange={(e) => handleFieldChange('mainPainPoints', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all resize-none"
                placeholder={isFrench ? 'Ex: Perdre des leads à cause de réponses lentes, manquer de prioritisation' : 'e.g., Losing leads due to slow responses, lack of prioritization'}
              />
            </div>

            {/* Target Customer Profile */}
            <div>
              <label className="block text-sm font-medium mb-2">
                👥 {isFrench ? 'Profil du client cible' : 'Target Customer Profile'}
              </label>
              <textarea
                value={settings.targetCustomerProfile}
                onChange={(e) => handleFieldChange('targetCustomerProfile', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all resize-none"
                placeholder={isFrench ? 'Ex: Propriétaires immobiliers, 30-55 ans, revenu élevé' : 'e.g., Real estate owners, 30-55 years old, high income'}
              />
            </div>
          </div>
        </div>

        {/* AI Automation Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4 text-green-400">{t.automation}</h2>
          
          <div className="space-y-3">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.aiPersonalizedReply}
                onChange={(e) => handleFieldChange('aiPersonalizedReply', e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-white/5 checked:bg-blue-500 focus:ring-2 focus:ring-blue-400/50 mt-0.5"
              />
              <div>
                <span className="text-white/90 font-medium">{t.enableReplies}</span>
                <p className="text-sm text-white/50 mt-1">{t.aiReplyDescription}</p>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleSaveChanges}
            disabled={saving || !hasUnsavedChanges}
            className={`py-4 rounded-lg font-semibold transition-all transform hover:scale-[1.02] shadow-lg ${
              saving || !hasUnsavedChanges
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
              t.saveButton
            )}
          </button>
          
          <button
            onClick={() => setShowPreview(true)}
            className="py-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold transition-all transform hover:scale-[1.02] shadow-lg"
          >
            {t.previewButton}
          </button>
        </div>

        {/* Unsaved Changes Indicator */}
        {hasUnsavedChanges && !saving && (
          <div className="mt-4 text-center text-yellow-400 text-sm">
            {isFrench ? '⚠️ Modifications non enregistrées' : '⚠️ Unsaved changes'}
          </div>
        )}

        {/* Client Guide Section */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">{t.clientGuide}</h2>
          <p className="text-white/70 mb-6">{t.clientGuideDescription}</p>
          
          <div className="flex justify-center">
            <a
              href={`/client-guides/AVENIR_CLIENT_GUIDE_${locale.toUpperCase()}.pdf`}
              download={`Avenir_AI_Client_Guide_${locale.toUpperCase()}.pdf`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg"
            >
              {t.downloadGuide}
            </a>
          </div>
        </div>

        {/* Email Preview Modal */}
        {showPreview && (
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

