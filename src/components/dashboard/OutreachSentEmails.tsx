'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SentEmail {
  id: string;
  prospect_email: string;
  prospect_name?: string;
  company_name?: string;
  subject?: string;
  content: string;
  status: string;
  follow_up_sequence: number;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  opened_at?: string;
  replied_at?: string;
  prospect_id?: string;
  campaign_id?: string;
  gmail_message_id?: string;
  thread_id?: string;
}

interface Pagination {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

interface OutreachSentEmailsProps {
  locale: string;
}

export default function OutreachSentEmails({ locale }: OutreachSentEmailsProps) {
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ limit: 50, offset: 0, total: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; show: boolean }>({ 
    message: '', 
    type: 'success', 
    show: false 
  });
  const [previewEmail, setPreviewEmail] = useState<SentEmail | null>(null);
  const [statusFilter, setStatusFilter] = useState('sent,approved');

  const isFrench = locale === 'fr';

  useEffect(() => {
    loadSentEmails();
  }, [statusFilter]);

  const loadSentEmails = async (offset: number = 0, append: boolean = false) => {
    try {
      setLoading(true);
      
      // Check if admin is authenticated
      const isAdminAuth = localStorage.getItem('admin_auth') === 'true';
      if (!isAdminAuth) {
        showToast(isFrench ? 'Authentification admin requise' : 'Admin authentication required', 'error');
        return;
      }

      // Prepare headers with admin authentication
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add admin session indicator (client-side session validation)
      headers['x-admin-session'] = 'authenticated';

      const response = await fetch(`/api/outreach/sent?limit=${pagination.limit}&offset=${offset}&status=${statusFilter}`, { headers });
      const data = await response.json();
      
      if (data.success) {
        if (append) {
          setSentEmails(prev => [...prev, ...(data.emails || [])]);
        } else {
          setSentEmails(data.emails || []);
        }
        setPagination(data.pagination);
      } else {
        showToast(data.error || 'Failed to load sent emails', 'error');
      }
    } catch (error) {
      console.error('Error loading sent emails:', error);
      showToast(isFrench ? 'Erreur lors du chargement' : 'Error loading sent emails', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      loadSentEmails(pagination.offset + pagination.limit, true);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast({ message: '', type: 'success', show: false }), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
      case 'approved': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'delivered': return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40';
      case 'opened': return 'text-purple-400 bg-purple-500/20 border-purple-500/40';
      case 'replied': return 'text-orange-400 bg-orange-500/20 border-orange-500/40';
      case 'bounced': return 'text-red-400 bg-red-500/20 border-red-500/40';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return '📤';
      case 'approved': return '✅';
      case 'delivered': return '📬';
      case 'opened': return '👁️';
      case 'replied': return '💬';
      case 'bounced': return '❌';
      default: return '📧';
    }
  };

  const getStatusText = (status: string) => {
    if (isFrench) {
      switch (status) {
        case 'sent': return 'Envoyé';
        case 'approved': return 'Approuvé';
        case 'delivered': return 'Livré';
        case 'opened': return 'Ouvert';
        case 'replied': return 'Répondu';
        case 'bounced': return 'Rejeté';
        default: return status;
      }
    } else {
      switch (status) {
        case 'sent': return 'Sent';
        case 'approved': return 'Approved';
        case 'delivered': return 'Delivered';
        case 'opened': return 'Opened';
        case 'replied': return 'Replied';
        case 'bounced': return 'Bounced';
        default: return status;
      }
    }
  };

  if (loading && sentEmails.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isFrench ? 'Courriels envoyés' : 'Sent Emails'}
          </h2>
          <p className="text-white/60">
            {isFrench ? 'Historique des emails approuvés et envoyés' : 'History of approved and sent emails'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-blue-400/50 focus:outline-none"
          >
            <option value="sent,approved">{isFrench ? 'Tous les statuts' : 'All Statuses'}</option>
            <option value="sent">{isFrench ? 'Envoyés seulement' : 'Sent Only'}</option>
            <option value="approved">{isFrench ? 'Approuvés seulement' : 'Approved Only'}</option>
            <option value="delivered">{isFrench ? 'Livrés seulement' : 'Delivered Only'}</option>
            <option value="opened">{isFrench ? 'Ouverts seulement' : 'Opened Only'}</option>
            <option value="replied">{isFrench ? 'Répondus seulement' : 'Replied Only'}</option>
          </select>
          <button
            onClick={() => loadSentEmails(0, false)}
            className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all text-sm font-medium"
          >
            🔄 {isFrench ? 'Actualiser' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Sent Emails Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  {isFrench ? 'Prospect' : 'Prospect'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  {isFrench ? 'Entreprise' : 'Company'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  {isFrench ? 'Statut' : 'Status'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  {isFrench ? 'Envoyé' : 'Sent'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  {isFrench ? 'Ouvert' : 'Opened'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  {isFrench ? 'Répondu' : 'Replied'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  {isFrench ? 'Aperçu' : 'Preview'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  {isFrench ? 'Actions' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sentEmails.map((email, index) => (
                <motion.tr
                  key={email.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {email.prospect_name || email.prospect_email}
                      </div>
                      <div className="text-sm text-white/60">
                        {email.prospect_email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {email.company_name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(email.status)}`}>
                      <span className="mr-1">{getStatusIcon(email.status)}</span>
                      {getStatusText(email.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                    {email.sent_at ? formatDate(email.sent_at) : (email.created_at ? formatDate(email.created_at) : 'N/A')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                    {email.opened_at ? formatDate(email.opened_at) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                    {email.replied_at ? formatDate(email.replied_at) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setPreviewEmail(email)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      {isFrench ? 'Aperçu' : 'Preview'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {email.gmail_message_id && (
                        <a
                          href={`https://mail.google.com/mail/u/0/#inbox/${email.thread_id || email.gmail_message_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-500/20 border border-gray-500/40 text-gray-400 hover:bg-gray-500/30 transition-all"
                        >
                          📧 Gmail
                        </a>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {sentEmails.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/50 text-lg">
              {isFrench ? 'Aucun email envoyé trouvé' : 'No sent emails found'}
            </div>
            <div className="text-white/30 text-sm mt-2">
              {isFrench ? 'Les emails approuvés apparaîtront ici' : 'Approved emails will appear here'}
            </div>
          </div>
        )}

        {/* Load More Button */}
        {pagination.hasMore && (
          <div className="p-6 border-t border-white/10">
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  {isFrench ? 'Chargement...' : 'Loading...'}
                </div>
              ) : (
                `${isFrench ? 'Charger plus' : 'Load More'} (${pagination.total - sentEmails.length} ${isFrench ? 'restants' : 'remaining'})`
              )}
            </button>
          </div>
        )}
      </div>

      {/* Email Preview Modal */}
      {previewEmail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-black border border-white/10 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-[0_0_30px_rgba(59,130,246,0.3)]"
          >
            {/* Header - Fixed */}
            <div className="p-6 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {isFrench ? 'Aperçu de l\'email envoyé' : 'Sent Email Preview'}
                </h3>
                <button
                  onClick={() => setPreviewEmail(null)}
                  className="text-white/60 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/60">{isFrench ? 'À:' : 'To:'}</span>
                    <span className="text-white ml-2">{previewEmail.prospect_email}</span>
                  </div>
                  <div>
                    <span className="text-white/60">{isFrench ? 'Sujet:' : 'Subject:'}</span>
                    <span className="text-white ml-2">{previewEmail.subject || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-white/60">{isFrench ? 'Statut:' : 'Status:'}</span>
                    <span className="text-white ml-2">{getStatusText(previewEmail.status)}</span>
                  </div>
                  <div>
                    <span className="text-white/60">{isFrench ? 'Envoyé:' : 'Sent:'}</span>
                    <span className="text-white ml-2">
                      {previewEmail.sent_at ? formatDate(previewEmail.sent_at) : (previewEmail.created_at ? formatDate(previewEmail.created_at) : 'N/A')}
                    </span>
                  </div>
                  {previewEmail.opened_at && (
                    <div>
                      <span className="text-white/60">{isFrench ? 'Ouvert:' : 'Opened:'}</span>
                      <span className="text-white ml-2">{formatDate(previewEmail.opened_at)}</span>
                    </div>
                  )}
                  {previewEmail.replied_at && (
                    <div>
                      <span className="text-white/60">{isFrench ? 'Répondu:' : 'Replied:'}</span>
                      <span className="text-white ml-2">{formatDate(previewEmail.replied_at)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                <div 
                  className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-a:text-blue-400 prose-ul:text-white/90 prose-li:text-white/90"
                  dangerouslySetInnerHTML={{ __html: previewEmail.content }}
                />
              </div>
            </div>
            
            {/* Footer - Fixed with action buttons */}
            <div className="p-6 border-t border-white/10 flex-shrink-0 bg-black/50 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {previewEmail.gmail_message_id && (
                    <a
                      href={`https://mail.google.com/mail/u/0/#inbox/${previewEmail.thread_id || previewEmail.gmail_message_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-all text-white font-medium"
                    >
                      📧 {isFrench ? 'Ouvrir dans Gmail' : 'Open in Gmail'}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPreviewEmail(null)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white"
                  >
                    {isFrench ? 'Fermer' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-8 right-8 z-50 px-6 py-3 rounded-lg border shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-600 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)]' 
              : 'bg-red-600 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
          }`}
        >
          <p className="text-white font-medium">{toast.message}</p>
        </motion.div>
      )}
    </div>
  );
}
