"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLocale } from 'next-intl';

type ClientData = {
  id: string;
  clientId: string;
  businessName: string;
  contactName: string;
  email: string;
  language: string;
  apiKey: string;
};

type Lead = {
  id: string;
  name: string;
  email: string;
  message: string;
  ai_summary: string;
  intent: string;
  tone: string;
  urgency: string;
  confidence_score: number;
  timestamp: string;
  relationship_insight?: string;
};

export default function ClientDashboard() {
  const locale = useLocale();
  const router = useRouter();
  const isFrench = locale === 'fr';

  const [authenticated, setAuthenticated] = useState(false);
  const [client, setClient] = useState<ClientData | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    avgConfidence: 0,
    topIntent: '',
    highUrgency: 0,
  });

  const t = {
    loginTitle: isFrench ? 'Connexion Client' : 'Client Login',
    loginSubtitle: isFrench ? 'Accédez à votre tableau de bord' : 'Access your dashboard',
    email: isFrench ? 'Courriel' : 'Email',
    password: isFrench ? 'Mot de passe' : 'Password',
    login: isFrench ? 'Se connecter' : 'Log In',
    loggingIn: isFrench ? 'Connexion...' : 'Logging in...',
    noAccount: isFrench ? 'Pas de compte ?' : 'No account?',
    signup: isFrench ? 'S\'inscrire' : 'Sign up',
    welcome: isFrench ? 'Bienvenue' : 'Welcome back',
    dashboardTitle: isFrench ? 'Tableau de bord Client' : 'Client Dashboard',
    totalLeads: isFrench ? 'Total de Leads' : 'Total Leads',
    avgConfidence: isFrench ? 'Confiance Moyenne' : 'Avg Confidence',
    topIntent: isFrench ? 'Intention Principale' : 'Top Intent',
    highUrgency: isFrench ? 'Urgence Élevée' : 'High Urgency',
    recentLeads: isFrench ? 'Leads Récents' : 'Recent Leads',
    apiAccess: isFrench ? '🔑 Accès API' : '🔑 API Access',
    logout: isFrench ? 'Déconnexion' : 'Logout',
    name: isFrench ? 'Nom' : 'Name',
    message: isFrench ? 'Message' : 'Message',
    summary: isFrench ? 'Résumé IA' : 'AI Summary',
    intent: isFrench ? 'Intention' : 'Intent',
    tone: isFrench ? 'Ton' : 'Tone',
    urgency: isFrench ? 'Urgence' : 'Urgency',
    confidence: isFrench ? 'Confiance' : 'Confidence',
    timestamp: isFrench ? 'Horodatage' : 'Timestamp',
    noLeads: isFrench ? 'Aucun lead pour le moment' : 'No leads yet',
    loading: isFrench ? 'Chargement...' : 'Loading...',
  };

  // Check for saved session
  useEffect(() => {
    const savedClient = localStorage.getItem('client_session');
    if (savedClient) {
      try {
        const clientData = JSON.parse(savedClient);
        setClient(clientData);
        setAuthenticated(true);
      } catch {
        localStorage.removeItem('client_session');
      }
    }
  }, []);

  // Fetch client leads
  useEffect(() => {
    if (authenticated && client) {
      fetchLeads();
    }
  }, [authenticated, client]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const res = await fetch('/api/client/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }

      console.log('[ClientDashboard] ✅ Login successful:', data.data);
      
      // Save session
      localStorage.setItem('client_session', JSON.stringify(data.data));
      setClient(data.data);
      setAuthenticated(true);

    } catch (err) {
      console.error('[ClientDashboard] ❌ Login error:', err);
      setLoginError(isFrench ? 'Identifiants invalides' : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  async function fetchLeads() {
    if (!client) return;

    try {
      console.log('[ClientDashboard] Fetching leads for client:', client.clientId);
      
      const res = await fetch(`/api/client/leads?clientId=${client.clientId}&locale=${locale}`);
      const data = await res.json();

      if (data.success) {
        setLeads(data.data || []);
        calculateStats(data.data || []);
        console.log('[ClientDashboard] ✅ Loaded', data.data?.length || 0, 'leads');
      }
    } catch (err) {
      console.error('[ClientDashboard] ❌ Failed to fetch leads:', err);
    }
  }

  function calculateStats(leadsData: Lead[]) {
    const total = leadsData.length;
    const avgConfidence = total > 0
      ? leadsData.reduce((sum, l) => sum + (l.confidence_score || 0), 0) / total
      : 0;
    
    const highUrgency = leadsData.filter(l => 
      l.urgency === 'High' || l.urgency === 'Élevée'
    ).length;

    const intentCounts: Record<string, number> = {};
    leadsData.forEach(l => {
      if (l.intent) {
        intentCounts[l.intent] = (intentCounts[l.intent] || 0) + 1;
      }
    });
    
    const topIntent = Object.keys(intentCounts).sort((a, b) => 
      intentCounts[b] - intentCounts[a]
    )[0] || (isFrench ? 'Aucun' : 'None');

    setStats({ total, avgConfidence, topIntent, highUrgency });
  }

  function handleLogout() {
    localStorage.removeItem('client_session');
    setAuthenticated(false);
    setClient(null);
    setLeads([]);
  }

  // Login Screen
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] text-white p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              AVENIR AI SOLUTIONS
            </h1>
            <p className="text-white/60 text-sm">
              {isFrench ? 'Infrastructure de Croissance IA' : 'AI Growth Infrastructure'}
            </p>
          </div>

          <div className="rounded-lg border border-white/10 p-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
            <h2 className="text-2xl font-bold mb-2">{t.loginTitle}</h2>
            <p className="text-white/60 mb-6 text-sm">{t.loginSubtitle}</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t.password}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:outline-none transition-all"
                  required
                />
              </div>

              {loginError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                >
                  {loginError}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
              >
                {loading ? t.loggingIn : t.login}
              </button>

              <div className="text-center text-sm text-white/60">
                {t.noAccount}{' '}
                <a href={`/${locale}/client/signup`} className="text-blue-400 hover:text-blue-300 transition-colors">
                  {t.signup}
                </a>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // Dashboard Screen
  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {t.welcome}, {client?.contactName}
            </h1>
            <p className="text-white/60">{client?.businessName}</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/${locale}/client/api-access`}
              className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 transition-all text-sm font-medium"
            >
              {t.apiAccess}
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md bg-red-500/20 border border-red-400/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium"
            >
              {t.logout}
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <div className="text-sm text-white/60 mb-1">{t.totalLeads}</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <div className="text-sm text-white/60 mb-1">{t.avgConfidence}</div>
            <div className="text-3xl font-bold">{(stats.avgConfidence * 100).toFixed(0)}%</div>
          </div>
          <div className="rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <div className="text-sm text-white/60 mb-1">{t.topIntent}</div>
            <div className="text-xl font-semibold truncate">{stats.topIntent}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <div className="text-sm text-white/60 mb-1">{t.highUrgency}</div>
            <div className="text-3xl font-bold text-red-400">{stats.highUrgency}</div>
          </div>
        </motion.div>

        {/* Recent Leads */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-bold mb-4">{t.recentLeads}</h2>
          
          <div className="space-y-3">
            {leads.length === 0 ? (
              <div className="text-center py-12 text-white/50 rounded-lg border border-white/10 bg-white/5">
                {t.noLeads}
              </div>
            ) : (
              leads.map((lead, idx) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-lg border border-white/10 p-5 bg-white/5 hover:bg-white/10 transition-all"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-white/50 text-xs block mb-1">{t.name}</span>
                      <p className="font-semibold">{lead.name}</p>
                    </div>
                    <div>
                      <span className="text-white/50 text-xs block mb-1">{t.email}</span>
                      <p className="text-blue-400">{lead.email}</p>
                    </div>
                    <div>
                      <span className="text-white/50 text-xs block mb-1">{t.urgency}</span>
                      <p className={
                        lead.urgency === 'High' || lead.urgency === 'Élevée' ? 'text-red-400 font-semibold' :
                        lead.urgency === 'Medium' || lead.urgency === 'Moyenne' ? 'text-yellow-400' :
                        'text-green-400'
                      }>
                        {lead.urgency}
                      </p>
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                      <span className="text-white/50 text-xs block mb-1">{t.message}</span>
                      <p className="text-white/80 italic">&quot;{lead.message}&quot;</p>
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                      <span className="text-white/50 text-xs block mb-1">{t.summary}</span>
                      <p className="text-white/90">{lead.ai_summary}</p>
                    </div>
                    <div>
                      <span className="text-white/50 text-xs block mb-1">{t.intent}</span>
                      <p className="text-blue-300 font-medium">{lead.intent}</p>
                    </div>
                    <div>
                      <span className="text-white/50 text-xs block mb-1">{t.tone}</span>
                      <p>{lead.tone}</p>
                    </div>
                    <div>
                      <span className="text-white/50 text-xs block mb-1">{t.confidence}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${(lead.confidence_score || 0) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono">{((lead.confidence_score || 0) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    {lead.relationship_insight && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <span className="text-white/50 text-xs block mb-1">💡 {isFrench ? 'Aperçu Relationnel' : 'Relationship Insight'}</span>
                        <p className="text-blue-300 text-sm">{lead.relationship_insight}</p>
                      </div>
                    )}
                    <div className="md:col-span-2 lg:col-span-3">
                      <span className="text-white/50 text-xs block mb-1">{t.timestamp}</span>
                      <p className="text-xs font-mono text-white/60">
                        {new Date(lead.timestamp).toLocaleString(isFrench ? 'fr-CA' : 'en-US')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

