"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLocale } from 'next-intl';
import AvenirLogo from '../../../../components/AvenirLogo';
import UniversalLanguageToggle from '../../../../components/UniversalLanguageToggle';

export default function ClientSignup() {
  const locale = useLocale();
  const router = useRouter();
  const isFrench = locale === 'fr';

  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    password: '',
    confirmPassword: '',
    language: locale,
    leadSourceDescription: '',
    estimatedLeadsPerWeek: '',
    industryCategory: '',
    primaryService: '',
    bookingLink: '',
    customTagline: '',
    emailTone: 'Friendly',
    followupSpeed: 'Instant',
    // New ICP fields
    targetClientType: '',
    averageDealSize: '',
    mainBusinessGoal: '',
    biggestChallenge: '',
  });

  const [icpExpanded, setIcpExpanded] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const t = {
    title: isFrench ? 'Créer votre compte' : 'Create Your Account',
    subtitle: isFrench ? 'Commencez à analyser vos leads avec l\'IA' : 'Start analyzing your leads with AI',
    businessName: isFrench ? 'Nom de l\'entreprise' : 'Business Name',
    contactName: isFrench ? 'Nom du contact' : 'Contact Name',
    email: isFrench ? 'Courriel' : 'Email',
    password: isFrench ? 'Mot de passe' : 'Password',
    confirmPassword: isFrench ? 'Confirmer le mot de passe' : 'Confirm Password',
    language: isFrench ? 'Langue préférée' : 'Preferred Language',
    leadSource: isFrench ? 'Description de la source de leads' : 'Lead Source Description',
    estimatedLeads: isFrench ? 'Leads estimés par semaine' : 'Estimated Leads per Week',
    industryCategory: isFrench ? 'Catégorie d\'industrie' : 'Industry Category',
    industrPlaceholder: isFrench ? 'Ex: Immobilier, Construction, Technologie' : 'e.g., Real Estate, Construction, Technology',
    primaryService: isFrench ? 'Service principal' : 'Primary Service',
    servicePlaceholder: isFrench ? 'Ex: Rénovations résidentielles, Consultation IA' : 'e.g., Home Renovations, AI Consulting',
    bookingLink: isFrench ? 'Lien de réservation' : 'Booking Link',
    bookingPlaceholder: isFrench ? 'Ex: https://calendly.com/votre-nom' : 'e.g., https://calendly.com/yourname',
    customTagline: isFrench ? 'Slogan de l\'entreprise' : 'Company Tagline',
    taglinePlaceholder: isFrench ? 'Ex: L\'IA qui aide les entreprises à agir plus rapidement' : 'e.g., AI that helps businesses act faster',
    emailTone: isFrench ? 'Ton des courriels' : 'Email Tone',
    followupSpeed: isFrench ? 'Vitesse de suivi' : 'Follow-up Speed',
    brandingSection: isFrench ? '✨ Personnalisation des courriels' : '✨ Email Personalization',
    brandingSubtitle: isFrench 
      ? 'Plus vous fournissez d\'informations, plus vos courriels générés par l\'IA seront alignés avec votre entreprise. Vous pourrez modifier ces paramètres à tout moment dans votre tableau de bord.'
      : 'The more information you provide, the more aligned your AI-generated emails will be. You can adjust these anytime in your dashboard.',
    submit: isFrench ? 'Créer mon compte' : 'Create Account',
    loading: isFrench ? 'Création en cours...' : 'Creating account...',
    haveAccount: isFrench ? 'Vous avez déjà un compte ?' : 'Already have an account?',
    login: isFrench ? 'Se connecter' : 'Log in',
    successTitle: isFrench ? 'Compte créé avec succès !' : 'Account Created Successfully!',
    successMessage: isFrench ? 'Vérifiez votre courriel pour vos informations de connexion.' : 'Check your email for your login credentials.',
    redirecting: isFrench ? 'Redirection...' : 'Redirecting...',
    // ICP section translations
    icpSectionTitle: isFrench ? '🎯 Aidez Avenir AI à comprendre votre entreprise (optionnel mais puissant)' : '🎯 Help Avenir AI understand your business (optional but powerful)',
    targetClientType: isFrench ? 'Type de Client Cible' : 'Target Client Type',
    targetClientTypePlaceholder: isFrench ? 'ex: Petites boutiques en ligne, agents immobiliers' : 'e.g., Small e-commerce stores, real estate agents',
    targetClientTypeHelper: isFrench ? 'Décrivez vos clients idéaux' : 'Describe your ideal customers',
    averageDealSize: isFrench ? 'Taille Moyenne des Contrats (optionnel)' : 'Average Deal Size (optional)',
    averageDealSizePlaceholder: isFrench ? 'ex: 2 000 $ – 5 000 $' : 'e.g., $2,000–$5,000',
    averageDealSizeHelper: isFrench ? 'Valeur typique des projets ou services' : 'Typical project or service value',
    mainBusinessGoal: isFrench ? 'Objectif Commercial Principal' : 'Main Business Goal',
    biggestChallenge: isFrench ? 'Plus Grand Défi Actuel' : 'Biggest Challenge Right Now',
    biggestChallengePlaceholder: isFrench ? 'ex: Convertir les visiteurs du site en leads' : 'e.g., Converting website visitors into leads',
    biggestChallengeHelper: isFrench ? 'Quel est votre principal point de douleur ?' : 'What\'s your main pain point?',
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

  const businessGoalOptions = [
    { value: 'Generate more qualified leads', label: isFrench ? 'Générer plus de leads qualifiés' : 'Generate more qualified leads' },
    { value: 'Improve follow-ups and conversions', label: isFrench ? 'Améliorer les suivis et conversions' : 'Improve follow-ups and conversions' },
    { value: 'Nurture existing clients', label: isFrench ? 'Fidéliser les clients existants' : 'Nurture existing clients' },
    { value: 'Save time with automation', label: isFrench ? 'Gagner du temps avec l\'automatisation' : 'Save time with automation' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.businessName || !formData.contactName || !formData.email || !formData.password) {
      setError(isFrench ? 'Veuillez remplir tous les champs requis' : 'Please fill in all required fields');
      return;
    }
    
    if (!formData.industryCategory || !formData.primaryService) {
      setError(isFrench ? 'Veuillez remplir la catégorie d\'industrie et le service principal' : 'Please fill in industry category and primary service');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(isFrench ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError(isFrench ? 'Le mot de passe doit contenir au moins 8 caractères' : 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/client/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          contactName: formData.contactName,
          email: formData.email,
          password: formData.password,
          language: formData.language,
          leadSourceDescription: formData.leadSourceDescription || null,
          estimatedLeadsPerWeek: formData.estimatedLeadsPerWeek ? parseInt(formData.estimatedLeadsPerWeek) : null,
          industryCategory: formData.industryCategory,
          primaryService: formData.primaryService,
          bookingLink: formData.bookingLink || null,
          customTagline: formData.customTagline || null,
          emailTone: formData.emailTone,
          followupSpeed: formData.followupSpeed,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      console.log('[ClientSignup] ✅ Account created:', data.data);
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/client/dashboard`);
      }, 2000);

    } catch (err) {
      console.error('[ClientSignup] ❌ Error:', err);
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] text-white p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="h-20 w-20 rounded-full bg-green-500/20 border-2 border-green-400/40 flex items-center justify-center mx-auto mb-6">
            <svg className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">{t.successTitle}</h2>
          <p className="text-white/70 mb-6">{t.successMessage}</p>
          <p className="text-sm text-white/50">{t.redirecting}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] text-white">
      {/* Header with Logo and Language Toggle */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          {/* Logo - Left Side (24px from edge) */}
          <a href={`/${locale}`} className="inline-block">
            <AvenirLogo locale={locale} showText={true} />
          </a>
          
          {/* Language Toggle - Right Side (50px up via transform, 24px from edge) */}
          <div className="relative z-50 -translate-y-[50px]">
            <UniversalLanguageToggle />
          </div>
        </div>
      </header>

      <div className="min-h-screen flex items-center justify-center p-4 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl"
        >
          <div className="rounded-2xl border border-white/10 p-8 md:p-10 bg-gradient-to-br from-blue-500/5 to-purple-500/5 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 blur-xl"></div>
            
            <div className="relative">
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {t.title}
                </h1>
                <p className="text-white/60 text-base">{t.subtitle}</p>
              </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Business Name */}
              <div>
                <label htmlFor="business_name" className="block text-sm font-medium mb-2">{t.businessName} *</label>
                <input
                  id="business_name"
                  name="business_name"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Contact Name */}
              <div>
                <label htmlFor="contact_name" className="block text-sm font-medium mb-2">{t.contactName} *</label>
                <input
                  id="contact_name"
                  name="contact_name"
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">{t.email} *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">{t.password} *</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                    minLength={8}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium mb-2">{t.confirmPassword} *</label>
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                    minLength={8}
                    required
                  />
                </div>
              </div>

              {/* Language */}
              <div>
                <label htmlFor="language" className="block text-sm font-medium mb-2">{t.language} *</label>
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white focus:border-blue-400/50 focus:outline-none transition-all"
                  required
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              {/* Email Personalization Section */}
              <div className="pt-6 pb-2 border-t border-white/10">
                <h3 className="text-lg font-semibold mb-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {t.brandingSection}
                </h3>
                <p className="text-sm text-white/60 mb-4">{t.brandingSubtitle}</p>
              </div>

              {/* Industry Category */}
              <div>
                <label htmlFor="industry_category" className="block text-sm font-medium mb-2">{t.industryCategory} *</label>
                <input
                  id="industry_category"
                  name="industry_category"
                  type="text"
                  value={formData.industryCategory}
                  onChange={(e) => setFormData({ ...formData, industryCategory: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                  placeholder={t.industrPlaceholder}
                  required
                />
              </div>

              {/* Primary Service */}
              <div>
                <label htmlFor="primary_service" className="block text-sm font-medium mb-2">{t.primaryService} *</label>
                <input
                  id="primary_service"
                  name="primary_service"
                  type="text"
                  value={formData.primaryService}
                  onChange={(e) => setFormData({ ...formData, primaryService: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                  placeholder={t.servicePlaceholder}
                  required
                />
              </div>

              {/* Booking Link */}
              <div>
                <label htmlFor="booking_link" className="block text-sm font-medium mb-2">{t.bookingLink}</label>
                <input
                  id="booking_link"
                  name="booking_link"
                  type="url"
                  value={formData.bookingLink}
                  onChange={(e) => setFormData({ ...formData, bookingLink: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                  placeholder={t.bookingPlaceholder}
                />
              </div>

              {/* Company Tagline */}
              <div>
                <label htmlFor="custom_tagline" className="block text-sm font-medium mb-2">{t.customTagline}</label>
                <input
                  id="custom_tagline"
                  name="custom_tagline"
                  type="text"
                  value={formData.customTagline}
                  onChange={(e) => setFormData({ ...formData, customTagline: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                  placeholder={t.taglinePlaceholder}
                />
              </div>

              {/* Email Tone */}
              <div>
                <label htmlFor="email_tone" className="block text-sm font-medium mb-2">{t.emailTone} *</label>
                <select
                  id="email_tone"
                  name="email_tone"
                  value={formData.emailTone}
                  onChange={(e) => setFormData({ ...formData, emailTone: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white focus:border-blue-400/50 focus:outline-none transition-all"
                  required
                >
                  {toneOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Follow-up Speed */}
              <div>
                <label htmlFor="followup_speed" className="block text-sm font-medium mb-2">{t.followupSpeed} *</label>
                <select
                  id="followup_speed"
                  name="followup_speed"
                  value={formData.followupSpeed}
                  onChange={(e) => setFormData({ ...formData, followupSpeed: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white focus:border-blue-400/50 focus:outline-none transition-all"
                  required
                >
                  {speedOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Lead Source Description */}
              <div>
                <label htmlFor="lead_source" className="block text-sm font-medium mb-2">{t.leadSource}</label>
                <textarea
                  id="lead_source"
                  name="lead_source"
                  value={formData.leadSourceDescription}
                  onChange={(e) => setFormData({ ...formData, leadSourceDescription: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all resize-none"
                  rows={3}
                  placeholder={isFrench ? 'Ex: Formulaire du site web, événements, références...' : 'e.g., Website form, events, referrals...'}
                />
              </div>

              <div>
                <label htmlFor="estimated_leads" className="block text-sm font-medium mb-2">{t.estimatedLeads}</label>
                <input
                  id="estimated_leads"
                  name="estimated_leads"
                  type="number"
                  value={formData.estimatedLeadsPerWeek}
                  onChange={(e) => setFormData({ ...formData, estimatedLeadsPerWeek: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                  min="0"
                  placeholder="50"
                />
              </div>

              {/* ICP Section */}
              <div className="mt-6 border border-white/10 rounded-lg p-4 bg-white/5">
                <button 
                  type="button"
                  onClick={() => setIcpExpanded(!icpExpanded)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="text-sm font-medium text-white/90">
                    {t.icpSectionTitle}
                  </span>
                  <span className="text-white/40">
                    {icpExpanded ? '▼' : '▶'}
                  </span>
                </button>
                
                {icpExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 space-y-4"
                  >
                    {/* Target Client Type */}
                    <div>
                      <label htmlFor="target_client_type" className="block text-sm font-medium mb-2 text-white/90">
                        {t.targetClientType}
                      </label>
                      <input
                        id="target_client_type"
                        name="target_client_type"
                        type="text"
                        value={formData.targetClientType}
                        onChange={(e) => setFormData({ ...formData, targetClientType: e.target.value })}
                        placeholder={t.targetClientTypePlaceholder}
                        className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                      />
                      <p className="text-xs text-white/50 mt-1">{t.targetClientTypeHelper}</p>
                    </div>

                    {/* Average Deal Size */}
                    <div>
                      <label htmlFor="average_deal_size" className="block text-sm font-medium mb-2 text-white/90">
                        {t.averageDealSize}
                      </label>
                      <input
                        id="average_deal_size"
                        name="average_deal_size"
                        type="text"
                        value={formData.averageDealSize}
                        onChange={(e) => setFormData({ ...formData, averageDealSize: e.target.value })}
                        placeholder={t.averageDealSizePlaceholder}
                        className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                      />
                      <p className="text-xs text-white/50 mt-1">{t.averageDealSizeHelper}</p>
                    </div>

                    {/* Main Business Goal */}
                    <div>
                      <label htmlFor="main_business_goal" className="block text-sm font-medium mb-2 text-white/90">
                        {t.mainBusinessGoal}
                      </label>
                      <select
                        id="main_business_goal"
                        name="main_business_goal"
                        value={formData.mainBusinessGoal}
                        onChange={(e) => setFormData({ ...formData, mainBusinessGoal: e.target.value })}
                        className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white focus:border-blue-400/50 focus:outline-none transition-all"
                      >
                        <option value="">{isFrench ? 'Sélectionnez un objectif...' : 'Select a goal...'}</option>
                        {businessGoalOptions.map((option) => (
                          <option key={option.value} value={option.value} className="bg-gray-800">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Biggest Challenge */}
                    <div>
                      <label htmlFor="biggest_challenge" className="block text-sm font-medium mb-2 text-white/90">
                        {t.biggestChallenge}
                      </label>
                      <input
                        id="biggest_challenge"
                        name="biggest_challenge"
                        type="text"
                        value={formData.biggestChallenge}
                        onChange={(e) => setFormData({ ...formData, biggestChallenge: e.target.value })}
                        placeholder={t.biggestChallengePlaceholder}
                        className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                      />
                      <p className="text-xs text-white/50 mt-1">{t.biggestChallengeHelper}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-[1.02]"
              >
                {loading ? t.loading : t.submit}
              </button>

              {/* Login Link */}
              <div className="text-center text-sm text-white/60 pt-2">
                {t.haveAccount}{' '}
                <a href={`/${locale}/client/dashboard`} className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                  {t.login}
                </a>
              </div>
            </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

