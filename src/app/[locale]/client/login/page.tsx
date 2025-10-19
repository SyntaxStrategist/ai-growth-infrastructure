"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import AvenirLogo from '../../../../components/AvenirLogo';
import UniversalLanguageToggle from '../../../../components/UniversalLanguageToggle';
import { isLegacyClientId, DEMO_CLIENT_EMAIL } from '../../../../lib/uuid-utils';
import { saveSession } from '../../../../utils/session';
import { useSession } from '../../../../components/SessionProvider';

export default function ClientLoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const isFrench = locale === 'fr';
  const { refreshSession } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = {
    title: isFrench ? 'Connexion Client' : 'Client Login',
    subtitle: isFrench ? 'Accédez à votre tableau de bord Avenir AI' : 'Access your Avenir AI dashboard',
    email: isFrench ? 'Adresse courriel' : 'Email Address',
    password: isFrench ? 'Mot de passe' : 'Password',
    loginButton: isFrench ? 'Se connecter' : 'Log In',
    loggingIn: isFrench ? 'Connexion en cours...' : 'Logging in...',
    forgotPassword: isFrench ? 'Mot de passe oublié ?' : 'Forgot password?',
    backToHome: isFrench ? '← Retour à l\'accueil' : '← Back to Home',
    noAccount: isFrench ? 'Pas encore de compte ?' : 'Don\'t have an account?',
    signUp: isFrench ? 'Créer un compte' : 'Sign Up',
    invalidCredentials: isFrench ? 'Email ou mot de passe invalide' : 'Invalid email or password',
    requiredFields: isFrench ? 'Tous les champs sont requis' : 'All fields are required',
    emailPlaceholder: isFrench ? 'votre@courriel.com' : 'your@email.com',
    passwordPlaceholder: isFrench ? 'Entrez votre mot de passe' : 'Enter your password',
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    console.log('[AuthFix] ============================================');
    console.log('[AuthFix] Login button clicked');

    // Validation
    if (!email || !password) {
      setError(t.requiredFields);
      return;
    }

    setLoading(true);

    try {
      console.log('[AuthFix] POST /api/client/auth started');
      console.log('[AuthFix] Email:', email);
      console.log('[AuthFix] Locale:', locale);

      const response = await fetch('/api/client/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t.invalidCredentials);
      }

      console.log('[AuthFix] Login success');
      console.log('[AuthFix] Client data:', data.data);
      
      // Validate client_id format
      if (data.data.clientId && isLegacyClientId(data.data.clientId)) {
        console.log('[AuthFix] Invalid client_id detected in login response — this should not happen with new UUID system');
        console.log('[AuthFix] Legacy client_id:', data.data.clientId);
      }
      
      // Store client session using session utility
      saveSession(data.data);
      console.log('[AuthFix] Session saved to localStorage');

      // Refresh session context to pick up the new session
      refreshSession();
      console.log('[AuthFix] Session context refreshed');

      // Redirect to client dashboard
      const dashboardPath = `/${locale}/client/dashboard`;
      console.log('[AuthFix] Redirecting to:', dashboardPath);
      router.push(dashboardPath);

    } catch (err) {
      console.log('[AuthFix] Login failed');
      console.error('[AuthFix] ❌ Login error:', err);
      setError(err instanceof Error ? err.message : t.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      {/* Header with Logo and Language Toggle */}
      <header className="w-full px-6 py-4 border-b border-white/10">
        <div className="w-full flex items-center justify-between">
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

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
        {/* Back to Home Link */}
        <a
          href={`/${locale}`}
          className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors mb-6"
        >
          {t.backToHome}
        </a>

        {/* Card Container */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <AvenirLogo locale={locale} showText={false} />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t.title}
            </h1>
            <p className="text-white/60 text-sm">{t.subtitle}</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-400/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm"
            >
              ❌ {error}
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-white/80">
                {t.email} *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all"
                required
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-white/80">
                {t.password} *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all"
                required
                autoComplete="current-password"
              />
            </div>

            {/* Forgot Password Link (Inactive) */}
            <div className="text-right">
              <button
                type="button"
                disabled
                className="text-sm text-white/40 cursor-not-allowed"
                title={isFrench ? 'Bientôt disponible' : 'Coming soon'}
              >
                {t.forgotPassword}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-[1.02] shadow-lg ${
                loading
                  ? 'bg-gray-500/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t.loggingIn}
                </span>
              ) : (
                t.loginButton
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-white/60">
              {t.noAccount}{' '}
              <a
                href={`/${locale}/client/signup`}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {t.signUp}
              </a>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-white/50">
          {isFrench ? (
            <>
              Besoin d'aide ? Contactez{' '}
              <a href="mailto:support@aveniraisolutions.ca" className="text-blue-400 hover:text-blue-300">
                support@aveniraisolutions.ca
              </a>
            </>
          ) : (
            <>
              Need help? Contact{' '}
              <a href="mailto:support@aveniraisolutions.ca" className="text-blue-400 hover:text-blue-300">
                support@aveniraisolutions.ca
              </a>
            </>
          )}
        </div>
        </motion.div>
      </div>
    </div>
  );
}

