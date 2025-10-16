"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocale } from 'next-intl';
import type { ClientRecord } from "../../../../lib/supabase";

export default function ClientsPage() {
  const locale = useLocale();
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState(false);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [rotatingKey, setRotatingKey] = useState<string | null>(null);

  const t = {
    title: locale === 'fr' ? 'Gestion des Clients' : 'Client Management',
    description: locale === 'fr' 
      ? 'Chaque client peut soumettre des leads à l\'aide de sa clé API unique. Les données sont traitées, enrichies et affichées en temps réel ici.'
      : 'Each client can submit leads using their unique API key. Data is processed, enriched, and displayed in real-time here.',
    addClient: locale === 'fr' ? 'Ajouter un Client' : 'Add Client',
    companyName: locale === 'fr' ? 'Nom de l\'entreprise' : 'Company Name',
    contactEmail: locale === 'fr' ? 'Email de contact' : 'Contact Email',
    apiKey: locale === 'fr' ? 'Clé API' : 'API Key',
    createdAt: locale === 'fr' ? 'Créé le' : 'Created',
    lastRotated: locale === 'fr' ? 'Dernière rotation' : 'Last Rotated',
    actions: locale === 'fr' ? 'Actions' : 'Actions',
    copy: locale === 'fr' ? 'Copier' : 'Copy',
    copied: locale === 'fr' ? 'Copié!' : 'Copied!',
    rotate: locale === 'fr' ? 'Régénérer' : 'Regenerate',
    rotating: locale === 'fr' ? '...' : '...',
    delete: locale === 'fr' ? 'Supprimer' : 'Delete',
    cancel: locale === 'fr' ? 'Annuler' : 'Cancel',
    create: locale === 'fr' ? 'Créer' : 'Create',
    backToDashboard: locale === 'fr' ? '← Retour au tableau de bord' : '← Back to Dashboard',
    noClients: locale === 'fr' ? 'Aucun client trouvé. Ajoutez-en un pour commencer.' : 'No clients found. Add one to get started.',
    authTitle: locale === 'fr' ? 'Accès Admin' : 'Admin Access',
    authPlaceholder: locale === 'fr' ? 'Entrez le mot de passe admin' : 'Enter admin password',
    authButton: locale === 'fr' ? 'Accéder' : 'Access',
    authError: locale === 'fr' ? 'Mot de passe incorrect' : 'Incorrect password',
    authSuccess: locale === 'fr' ? 'Authentifié ✓' : 'Authenticated ✓',
    logout: locale === 'fr' ? 'Déconnexion' : 'Logout',
    rotateConfirm: locale === 'fr' 
      ? 'Êtes-vous sûr de vouloir régénérer cette clé API? L\'ancienne clé sera immédiatement invalidée.'
      : 'Are you sure you want to regenerate this API key? The old key will be immediately invalidated.',
  };

  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_auth');
    if (adminAuth === 'true') {
      setAuthorized(true);
      fetchClients();
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchClients() {
    try {
      const res = await fetch('/api/clients');
      const json = await res.json();
      if (json.success) {
        setClients(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthSuccess(true);
        setAuthError("");
        setTimeout(() => {
          setAuthorized(true);
          localStorage.setItem('admin_auth', 'true');
          fetchClients();
        }, 800);
      } else {
        setAuthError(t.authError);
        setPassword("");
      }
    } catch {
      setAuthError(t.authError);
    }
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName || !contactEmail) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName, contact_email: contactEmail }),
      });
      const json = await res.json();
      if (json.success) {
        setClients([json.data, ...clients]);
        setShowAddForm(false);
        setCompanyName("");
        setContactEmail("");
      }
    } catch (err) {
      console.error('Failed to add client:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteClient(clientId: string) {
    if (!confirm(locale === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce client ?' : 'Are you sure you want to delete this client?')) {
      return;
    }

    try {
      const res = await fetch(`/api/clients?id=${clientId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setClients(clients.filter(c => c.id !== clientId));
      }
    } catch (err) {
      console.error('Failed to delete client:', err);
    }
  }

  function handleCopyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  async function handleRotateKey(clientId: string) {
    if (!confirm(t.rotateConfirm)) {
      return;
    }

    setRotatingKey(clientId);
    try {
      const res = await fetch('/api/rotate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      });
      const json = await res.json();
      if (json.success) {
        // Update the client in the list
        setClients(clients.map(c => c.id === clientId ? json.data : c));
        // Copy new key to clipboard
        handleCopyKey(json.data.api_key);
      }
    } catch (err) {
      console.error('Failed to rotate API key:', err);
    } finally {
      setRotatingKey(null);
    }
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="rounded-lg border border-white/10 p-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-xl"></div>
            
            <div className="relative">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-blue-500/10 border border-blue-400/30 flex items-center justify-center">
                  <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center mb-6">{t.authTitle}</h2>

              {authSuccess ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <div className="h-16 w-16 rounded-full bg-green-500/20 border border-green-400/40 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-400 font-medium">{t.authSuccess}</p>
                </motion.div>
              ) : (
                <form onSubmit={handleAuth} className="space-y-4">
                  <div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.authPlaceholder}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      autoFocus
                    />
                  </div>
                  {authError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm text-center"
                    >
                      {authError}
                    </motion.p>
                  )}
                  <button
                    type="submit"
                    className="w-full py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-500/20"
                  >
                    {t.authButton}
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
              <p className="text-white/60 max-w-2xl">{t.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`/${locale}/dashboard`}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm"
              >
                {t.backToDashboard}
              </a>
              <button
                onClick={() => {
                  localStorage.removeItem('admin_auth');
                  setAuthorized(false);
                  setPassword("");
                  setAuthError("");
                }}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all text-sm"
              >
                {t.logout}
              </button>
            </div>
          </div>

          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-500/20"
            >
              + {t.addClient}
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-white/10 p-6 bg-white/5 mb-6"
            >
              <form onSubmit={handleAddClient} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">{t.companyName}</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">{t.contactEmail}</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-all font-medium disabled:opacity-50"
                  >
                    {submitting ? '...' : t.create}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setCompanyName("");
                      setContactEmail("");
                    }}
                    className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    {t.cancel}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </motion.div>

        {clients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-white/40"
          >
            <p>{t.noClients}</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-3"
          >
            {clients.map((client, idx) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="rounded-lg border border-white/10 p-5 bg-white/5 hover:bg-white/10 hover:border-blue-400/30 transition-all"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
                  <div>
                    <span className="text-white/50 text-xs block mb-1">{t.companyName}</span>
                    <p className="font-semibold">{client.business_name}</p>
                  </div>
                  <div>
                    <span className="text-white/50 text-xs block mb-1">{t.contactEmail}</span>
                    <p className="text-blue-400 text-sm">{client.email}</p>
                  </div>
                  <div>
                    <span className="text-white/50 text-xs block mb-1">{t.apiKey}</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs font-mono bg-white/10 px-2 py-1 rounded">
                        {client.api_key.slice(0, 16)}...
                      </code>
                      <button
                        onClick={() => handleCopyKey(client.api_key)}
                        className="px-2 py-1 text-xs rounded bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all"
                      >
                        {copiedKey === client.api_key ? t.copied : t.copy}
                      </button>
                      <button
                        onClick={() => handleRotateKey(client.id)}
                        disabled={rotatingKey === client.id}
                        className="px-2 py-1 text-xs rounded bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 transition-all disabled:opacity-50"
                      >
                        {rotatingKey === client.id ? t.rotating : t.rotate}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-white/50 text-xs block mb-1">{t.lastRotated}</span>
                    <p className="text-xs">
                      {client.last_connection ? new Date(client.last_connection).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-US') : 'N/A'}
                    </p>
                    <p className="text-xs text-white/40">
                      {client.last_connection ? new Date(client.last_connection).toLocaleTimeString(locale === 'fr' ? 'fr-CA' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="px-3 py-1 text-sm rounded bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all"
                    >
                      {t.delete}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

