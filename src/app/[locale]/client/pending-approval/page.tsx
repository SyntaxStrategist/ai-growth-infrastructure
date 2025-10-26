"use client";

import { useLocale } from 'next-intl';
import AvenirLogo from '../../../../components/AvenirLogo';
import UniversalLanguageToggle from '../../../../components/UniversalLanguageToggle';
import { motion } from 'framer-motion';

export default function PendingApprovalPage() {
  const locale = useLocale();
  const isFrench = locale === 'fr';

  const t = {
    title: isFrench ? '⏳ En attente d\'approbation' : '⏳ Pending Approval',
    subtitle: isFrench 
      ? 'Votre compte est en attente d\'approbation par notre équipe'
      : 'Your account is pending approval by our team',
    message: isFrench
      ? 'Merci de votre intérêt pour Avenir AI Solutions. Votre demande de compte a été reçue et est actuellement en cours d\'examen. Nous vous enverrons un courriel dès que votre compte sera approuvé.'
      : 'Thank you for your interest in Avenir AI Solutions. Your account request has been received and is currently under review. We will send you an email once your account has been approved.',
    expected: isFrench
      ? 'Délai estimé:'
      : 'Expected timeframe:',
    timeframe: isFrench
      ? 'Généralement dans les 24-48 heures'
      : 'Usually within 24-48 hours',
    back: isFrench ? 'Retour à l\'accueil' : 'Back to Home',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] text-white">
      {/* Header with Logo and Language Toggle */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <a href={`/${locale}`} className="inline-block">
            <AvenirLogo locale={locale} showText={true} />
          </a>
          
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
            
            <div className="relative text-center">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="h-24 w-24 rounded-full bg-yellow-500/20 border-2 border-yellow-400/40 flex items-center justify-center mx-auto mb-6"
              >
                <svg className="h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                {t.title}
              </h1>
              
              <p className="text-lg text-white/60 mb-8">
                {t.subtitle}
              </p>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-left">
                <p className="text-white/80 leading-relaxed mb-6">
                  {t.message}
                </p>
                
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="text-white/60">{t.expected}</span>
                    <span className="text-white font-medium ml-2">{t.timeframe}</span>
                  </div>
                </div>
              </div>

              <a
                href={`/${locale}`}
                className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-[1.02]"
              >
                {t.back}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
