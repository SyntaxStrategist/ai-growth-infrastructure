'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PendingEmail {
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
  metadata?: any;
  prospect?: {
    id: string;
    business_name: string;
    industry?: string;
    language: string;
    automation_need_score: number;
  };
  campaign?: {
    id: string;
    name: string;
    client_id?: string;
  };
}

interface DailyLimits {
  limit: number;
  approvedToday: number;
  remaining: number;
}

interface OutreachApprovalQueueProps {
  locale: string;
}

export default function OutreachApprovalQueue({ locale }: OutreachApprovalQueueProps) {
  const [pendingEmails, setPendingEmails] = useState<PendingEmail[]>([]);
  const [dailyLimits, setDailyLimits] = useState<DailyLimits>({ limit: 50, approvedToday: 0, remaining: 50 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; show: boolean }>({ 
    message: '', 
    type: 'success', 
    show: false 
  });
  const [previewEmail, setPreviewEmail] = useState<PendingEmail | null>(null);

  const isFrench = locale === 'fr';

  useEffect(() => {
    loadPendingEmails();
  }, []);

  const loadPendingEmails = async () => {
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

      const response = await fetch('/api/outreach/pending', { headers });
      const data = await response.json();
      
      if (data.success) {
        setPendingEmails(data.data.emails || []);
        setDailyLimits(data.data.dailyLimits);
      } else {
        showToast(data.error || 'Failed to load pending emails', 'error');
      }
    } catch (error) {
      console.error('Error loading pending emails:', error);
      showToast(isFrench ? 'Erreur lors du chargement' : 'Error loading pending emails', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (emailId: string, action: 'approve' | 'reject') => {
    try {
      setProcessing(emailId);
      
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
      
      const response = await fetch('/api/outreach/approve', {
        method: 'POST',
        headers,
        body: JSON.stringify({ emailId, action })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const actionText = action === 'approve' ? (isFrench ? 'approuvé' : 'approved') : (isFrench ? 'rejeté' : 'rejected');
        showToast(
          isFrench ? `Email ${actionText} avec succès` : `Email ${actionText} successfully`,
          'success'
        );
        
        // Update local state
        setPendingEmails(prev => prev.filter(email => email.id !== emailId));
        setDailyLimits(data.data);
      } else {
        showToast(data.error || `Failed to ${action} email`, 'error');
      }
    } catch (error) {
      console.error(`Error ${action}ing email:`, error);
      showToast(
        isFrench ? `Erreur lors de l'${action === 'approve' ? 'approbation' : 'rejet'}` : `Error ${action}ing email`,
        'error'
      );
    } finally {
      setProcessing(null);
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

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-red-400 bg-red-500/20 border-red-500/40';
    if (score >= 70) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
    return 'text-green-400 bg-green-500/20 border-green-500/40';
  };

  const getLanguageFlag = (language: string) => {
    return language === 'fr' ? '🇫🇷' : '🇺🇸';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Daily Limits */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isFrench ? 'File d\'attente d\'approbation' : 'Approval Queue'}
          </h2>
          <p className="text-white/60">
            {isFrench ? 'Phase 1: Révision manuelle des emails de prospection' : 'Phase 1: Manual review of outreach emails'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-white/60">
              {isFrench ? 'Limite quotidienne' : 'Daily Limit'}
            </div>
            <div className="text-lg font-bold text-white">
              {dailyLimits.approvedToday} / {dailyLimits.limit}
            </div>
            <div className="text-xs text-white/50">
              {isFrench ? `${dailyLimits.remaining} restants` : `${dailyLimits.remaining} remaining`}
            </div>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center">
            <div 
              className="w-12 h-12 rounded-full border-4 border-blue-500 flex items-center justify-center"
              style={{
                background: `conic-gradient(#3b82f6 0deg ${(dailyLimits.approvedToday / dailyLimits.limit) * 360}deg, transparent ${(dailyLimits.approvedToday / dailyLimits.limit) * 360}deg)`
              }}
            >
              <span className="text-xs font-bold text-white">
                {Math.round((dailyLimits.approvedToday / dailyLimits.limit) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Emails Table */}
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
                  {isFrench ? 'Langue' : 'Language'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  {isFrench ? 'Score' : 'Score'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  {isFrench ? 'Aperçu' : 'Preview'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  {isFrench ? 'Créé' : 'Created'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  {isFrench ? 'Actions' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pendingEmails.map((email, index) => (
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
                      {email.company_name || email.prospect?.business_name || 'N/A'}
                    </div>
                    {email.prospect?.industry && (
                      <div className="text-xs text-white/50">
                        {email.prospect.industry}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getLanguageFlag(email.prospect?.language || 'en')}</span>
                      <span className="text-sm text-white/80 uppercase">
                        {email.prospect?.language || 'en'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(email.prospect?.automation_need_score || 0)}`}>
                      {email.prospect?.automation_need_score || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setPreviewEmail(email)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      {isFrench ? 'Aperçu' : 'Preview'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                    {formatDate(email.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveReject(email.id, 'approve')}
                        disabled={processing === email.id || dailyLimits.remaining <= 0}
                        className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {processing === email.id ? (
                          <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin"></div>
                        ) : (
                          '✅'
                        )}
                        <span className="ml-1">
                          {isFrench ? 'Approuver' : 'Approve'}
                        </span>
                      </button>
                      <button
                        onClick={() => handleApproveReject(email.id, 'reject')}
                        disabled={processing === email.id}
                        className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {processing === email.id ? (
                          <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                        ) : (
                          '🗑️'
                        )}
                        <span className="ml-1">
                          {isFrench ? 'Rejeter' : 'Reject'}
                        </span>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {pendingEmails.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/50 text-lg">
              {isFrench ? 'Aucun email en attente d\'approbation' : 'No emails pending approval'}
            </div>
            <div className="text-white/30 text-sm mt-2">
              {isFrench ? 'Tous les emails ont été traités' : 'All emails have been processed'}
            </div>
          </div>
        )}
      </div>

      {/* Email Preview Modal */}
      {previewEmail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-black border border-white/10 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.3)]"
          >
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {isFrench ? 'Aperçu de l\'email' : 'Email Preview'}
                </h3>
                <button
                  onClick={() => setPreviewEmail(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/60">{isFrench ? 'À:' : 'To:'}</span>
                    <span className="text-white ml-2">{previewEmail.prospect_email}</span>
                  </div>
                  <div>
                    <span className="text-white/60">{isFrench ? 'Sujet:' : 'Subject:'}</span>
                    <span className="text-white ml-2">{previewEmail.subject || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewEmail.content }}
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/10">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setPreviewEmail(null)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  {isFrench ? 'Fermer' : 'Close'}
                </button>
                <button
                  onClick={() => {
                    handleApproveReject(previewEmail.id, 'approve');
                    setPreviewEmail(null);
                  }}
                  disabled={processing === previewEmail.id || dailyLimits.remaining <= 0}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isFrench ? 'Approuver' : 'Approve'}
                </button>
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
