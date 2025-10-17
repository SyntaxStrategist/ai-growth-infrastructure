"use client";

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';

export default function AdminSettings() {
  const locale = useLocale();
  const isFrench = locale === 'fr';

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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
        setTimeout(() => setShowToast(false), 3000);
      } else {
        console.error('[AdminSettings] ❌ Update failed:', data.error);
      }
    } catch (error) {
      console.error('[AdminSettings] ❌ Update error:', error);
    } finally {
      setSaving(false);
    }
  };

  // Generate email preview
  const generatePreview = () => {
    if (!selectedClientId) return t.noClientSelected;

    const leadName = isFrench ? 'Marie Exemple' : 'John Example';
    const greeting = settings.emailTone === 'Friendly' 
      ? (isFrench ? `Bonjour ${leadName} !` : `Hi ${leadName}!`)
      : (isFrench ? `Bonjour ${leadName},` : `Hello ${leadName},`);

    const acknowledgment = isFrench
      ? `Merci d'avoir contacté ${settings.businessName}. Nous avons bien reçu votre message.`
      : `Thanks for reaching out to ${settings.businessName}! We've received your message.`;

    const context = settings.industryCategory && settings.primaryService
      ? (isFrench 
          ? ` En tant que spécialistes en ${settings.industryCategory} avec une expertise en ${settings.primaryService}, nous sommes ravis de vous aider.`
          : ` As specialists in ${settings.industryCategory} with expertise in ${settings.primaryService}, we're excited to help you.`)
      : '';

    const aiMention = isFrench
      ? `Notre intelligence artificielle a analysé votre demande afin de mieux répondre à vos besoins.`
      : `Our AI has analyzed your inquiry to better address your needs.`;

    const timing = settings.followupSpeed === 'Instant'
      ? (isFrench ? `Un membre de notre équipe vous contactera dans les plus brefs délais.` : `A member of our team will contact you shortly.`)
      : (isFrench ? `Nous vous recontacterons ${settings.followupSpeed === 'Within 1 hour' ? 'dans l\'heure' : 'le jour même'}.` : `We will get back to you ${settings.followupSpeed.toLowerCase()}.`);

    const booking = settings.bookingLink
      ? (isFrench ? `\n\nVous pouvez également réserver un créneau directement: ${settings.bookingLink}` : `\n\nYou can also book a time directly: ${settings.bookingLink}`)
      : '';

    const closing = settings.emailTone === 'Formal'
      ? (isFrench ? 'Cordialement,' : 'Sincerely,')
      : (isFrench ? 'À très bientôt!' : 'Talk soon!');

    const tagline = settings.customTagline ? `\n${settings.customTagline}` : '';

    return `${greeting}

${acknowledgment}${context}

${aiMention}

${timing}${booking}

${closing}
${settings.businessName}${tagline}`;
  };

  if (loading && clients.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-8 right-8 bg-green-500/20 border border-green-400/50 text-green-400 px-6 py-3 rounded-lg shadow-lg z-50"
          >
            {t.successToast}
          </motion.div>
        )}

        {/* Client Selector */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
          <label className="block text-sm font-medium mb-2">{t.selectClient}</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white focus:border-blue-400/50 focus:outline-none transition-all"
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
                    className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
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

            {/* Preview Button */}
            <button
              onClick={() => setShowPreview(true)}
              className="w-full py-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold transition-all transform hover:scale-[1.02] shadow-lg"
            >
              {t.previewButton}
            </button>

            {/* Saving Indicator */}
            {saving && (
              <div className="mt-4 text-center text-white/60 text-sm">
                {t.saving}
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
              
              <div className="bg-white/5 rounded-lg p-6 mb-6 border border-white/10 max-h-[60vh] overflow-y-auto">
                <pre className="text-white/90 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {generatePreview()}
                </pre>
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

