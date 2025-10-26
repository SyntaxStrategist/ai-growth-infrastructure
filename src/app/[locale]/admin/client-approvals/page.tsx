"use client";

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import UniversalLanguageToggle from '../../../../components/UniversalLanguageToggle';

interface PendingClient {
  id: string;
  client_id: string;
  business_name: string;
  contact_name: string;
  email: string;
  industry_category: string;
  primary_service: string;
  created_at: string;
  status: string;
}

export default function ClientApprovalsPage() {
  const locale = useLocale();
  const router = useRouter();
  const isFrench = locale === 'fr';

  const [pendingClients, setPendingClients] = useState<PendingClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const t = {
    title: isFrench ? 'Approbations de Comptes' : 'Account Approvals',
    subtitle: isFrench ? 'Approuver ou rejeter les demandes de compte' : 'Approve or reject account requests',
    noPending: isFrench ? 'Aucune demande en attente' : 'No pending requests',
    loading: isFrench ? 'Chargement...' : 'Loading...',
    businessName: isFrench ? 'Entreprise' : 'Business',
    contact: isFrench ? 'Contact' : 'Contact',
    email: isFrench ? 'Courriel' : 'Email',
    industry: isFrench ? 'Industrie' : 'Industry',
    service: isFrench ? 'Service' : 'Service',
    submitted: isFrench ? 'Soumis le' : 'Submitted',
    actions: isFrench ? 'Actions' : 'Actions',
    approve: isFrench ? 'Approuver' : 'Approve',
    reject: isFrench ? 'Rejeter' : 'Reject',
    approving: isFrench ? 'Approbation...' : 'Approving...',
    rejecting: isFrench ? 'Rejet...' : 'Rejecting...',
  };

  const fetchPendingClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/client-approvals');
      const data = await res.json();
      
      if (data.success) {
        setPendingClients(data.data || []);
      }
    } catch (error) {
      console.error('[ClientApprovals] Error fetching pending clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingClients();
  }, []);

  const handleApprove = async (clientId: string) => {
    try {
      setProcessing(clientId);
      const res = await fetch('/api/admin/approve-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Refresh the list
        await fetchPendingClients();
      } else {
        alert(data.error || 'Failed to approve client');
      }
    } catch (error) {
      console.error('[ClientApprovals] Error approving client:', error);
      alert('Error approving client');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (clientId: string) => {
    if (!confirm(isFrench ? 'Êtes-vous sûr de vouloir rejeter ce compte ?' : 'Are you sure you want to reject this account?')) {
      return;
    }
    
    try {
      setProcessing(clientId);
      const res = await fetch('/api/admin/reject-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Refresh the list
        await fetchPendingClients();
      } else {
        alert(data.error || 'Failed to reject client');
      }
    } catch (error) {
      console.error('[ClientApprovals] Error rejecting client:', error);
      alert('Error rejecting client');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <UniversalLanguageToggle />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="text-white/60 hover:text-white transition-colors mb-4 inline-block"
          >
            ← {isFrench ? 'Retour au tableau de bord' : 'Back to Dashboard'}
          </button>
          <h1 className="text-4xl font-bold mb-2">{t.title}</h1>
          <p className="text-white/60">{t.subtitle}</p>
        </div>

        {/* Pending Clients List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <p className="mt-4 text-white/60">{t.loading}</p>
          </div>
        ) : pendingClients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">{t.noPending}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingClients.map((client, idx) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-white/50 mb-1">{t.businessName}</p>
                    <p className="font-semibold">{client.business_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/50 mb-1">{t.contact}</p>
                    <p>{client.contact_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/50 mb-1">{t.email}</p>
                    <p className="text-blue-400">{client.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/50 mb-1">{t.industry}</p>
                    <p>{client.industry_category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/50 mb-1">{t.service}</p>
                    <p>{client.primary_service}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/50 mb-1">{t.submitted}</p>
                    <p>{new Date(client.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleApprove(client.client_id)}
                    disabled={processing === client.client_id}
                    className="flex-1 py-2 px-4 rounded-lg bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === client.client_id ? t.approving : t.approve}
                  </button>
                  <button
                    onClick={() => handleReject(client.client_id)}
                    disabled={processing === client.client_id}
                    className="flex-1 py-2 px-4 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === client.client_id ? t.rejecting : t.reject}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
