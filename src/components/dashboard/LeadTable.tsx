"use client";

import { motion } from 'framer-motion';
import type { Lead } from '@/hooks/useLeadManagement';
import { ProspectTableSkeleton } from '@/components/SkeletonLoader';

interface LeadTableProps {
  leads: Lead[];
  isFrench: boolean;
  onTagLead: (leadId: string) => void;
  onArchiveLead: (leadId: string) => void;
  onDeleteLead: (leadId: string) => void;
  onReactivateLead: (leadId: string) => void;
  onPermanentDeleteLead: (leadId: string) => void;
  onRevertLead: (leadId: string) => void;
  loading?: boolean;
}

export default function LeadTable({
  leads,
  isFrench,
  onTagLead,
  onArchiveLead,
  onDeleteLead,
  onReactivateLead,
  onPermanentDeleteLead,
  onRevertLead,
  loading = false,
}: LeadTableProps) {
  const translations = {
    name: isFrench ? 'Nom' : 'Name',
    message: isFrench ? 'Message' : 'Message',
    summary: isFrench ? 'Résumé IA' : 'AI Summary',
    intent: isFrench ? 'Intention' : 'Intent',
    tone: isFrench ? 'Ton' : 'Tone',
    urgency: isFrench ? 'Urgence' : 'Urgency',
    confidence: isFrench ? 'Confiance' : 'Confidence',
    timestamp: isFrench ? 'Horodatage' : 'Timestamp',
    language: isFrench ? 'Langue' : 'Language',
    noLeads: isFrench ? 'Aucun lead pour le moment' : 'No leads yet',
    actions: {
      tag: isFrench ? 'Étiqueter' : 'Tag',
      archive: isFrench ? 'Archiver' : 'Archive',
      delete: isFrench ? 'Supprimer' : 'Delete',
      reactivate: isFrench ? 'Réactiver' : 'Reactivate',
      permanentDelete: isFrench ? 'Supprimer définitivement' : 'Delete Permanently',
      revert: isFrench ? 'Restaurer' : 'Revert',
    },
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High': return 'text-red-400 bg-red-500/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'Low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return <ProspectTableSkeleton rows={5} />;
  }

  if (leads.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="text-6xl mb-4">📊</div>
        <p className="text-white/70 text-lg">{translations.noLeads}</p>
      </motion.div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/10">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-white/70">
                {translations.name}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-white/70">
                {translations.message}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-white/70">
                {translations.intent}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-white/70">
                {translations.urgency}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-white/70">
                {translations.confidence}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-white/70">
                {translations.timestamp}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-white/70">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {leads.map((lead, index) => (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="text-white font-medium">{lead.name}</p>
                    <p className="text-white/60 text-sm">{lead.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-white/80 text-sm max-w-xs truncate" title={lead.message}>
                    {lead.message}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-white/80 text-sm">{lead.intent}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(lead.urgency)}`}>
                    {lead.urgency}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-medium ${getConfidenceColor(lead.confidence_score)}`}>
                    {lead.confidence_score}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-white/60 text-sm">
                    {new Date(lead.timestamp).toLocaleDateString()}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onTagLead(lead.id)}
                      className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-xs hover:bg-blue-500/30 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      {translations.actions.tag}
                    </motion.button>
                    
                    {!lead.archived && !lead.deleted && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onArchiveLead(lead.id)}
                        className="px-3 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg text-xs hover:bg-yellow-500/30 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      >
                        {translations.actions.archive}
                      </motion.button>
                    )}
                    
                    {!lead.deleted && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onDeleteLead(lead.id)}
                        className="px-3 py-2 bg-red-500/20 text-red-300 rounded-lg text-xs hover:bg-red-500/30 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      >
                        {translations.actions.delete}
                      </motion.button>
                    )}
                    
                    {lead.archived && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onReactivateLead(lead.id)}
                        className="px-3 py-2 bg-green-500/20 text-green-300 rounded-lg text-xs hover:bg-green-500/30 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      >
                        {translations.actions.reactivate}
                      </motion.button>
                    )}
                    
                    {lead.deleted && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onRevertLead(lead.id)}
                          className="px-3 py-2 bg-green-500/20 text-green-300 rounded-lg text-xs hover:bg-green-500/30 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                        >
                          {translations.actions.revert}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onPermanentDeleteLead(lead.id)}
                          className="px-3 py-2 bg-red-500/20 text-red-300 rounded-lg text-xs hover:bg-red-500/30 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                        >
                          {translations.actions.permanentDelete}
                        </motion.button>
                      </>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        <div className="p-4 space-y-4">
          {leads.map((lead, index) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3"
            >
              {/* Header with name and email */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-medium text-base">{lead.name}</h3>
                  <p className="text-white/60 text-sm">{lead.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(lead.urgency)}`}>
                  {lead.urgency}
                </span>
              </div>

              {/* Message */}
              <div>
                <p className="text-white/80 text-sm line-clamp-2" title={lead.message}>
                  {lead.message}
                </p>
              </div>

              {/* Intent and Confidence */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">{translations.intent}</p>
                  <p className="text-white/80 text-sm">{lead.intent}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-xs">{translations.confidence}</p>
                  <span className={`font-medium text-sm ${getConfidenceColor(lead.confidence_score)}`}>
                    {lead.confidence_score}%
                  </span>
                </div>
              </div>

              {/* Timestamp */}
              <div>
                <p className="text-white/60 text-xs">
                  {new Date(lead.timestamp).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTagLead(lead.id)}
                  className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-xs hover:bg-blue-500/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  {translations.actions.tag}
                </motion.button>
                
                {!lead.archived && !lead.deleted && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onArchiveLead(lead.id)}
                    className="px-3 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg text-xs hover:bg-yellow-500/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    {translations.actions.archive}
                  </motion.button>
                )}
                
                {!lead.deleted && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDeleteLead(lead.id)}
                    className="px-3 py-2 bg-red-500/20 text-red-300 rounded-lg text-xs hover:bg-red-500/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    {translations.actions.delete}
                  </motion.button>
                )}
                
                {lead.archived && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onReactivateLead(lead.id)}
                    className="px-3 py-2 bg-green-500/20 text-green-300 rounded-lg text-xs hover:bg-green-500/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    {translations.actions.reactivate}
                  </motion.button>
                )}
                
                {lead.deleted && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onRevertLead(lead.id)}
                      className="px-3 py-2 bg-green-500/20 text-green-300 rounded-lg text-xs hover:bg-green-500/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      {translations.actions.revert}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onPermanentDeleteLead(lead.id)}
                      className="px-3 py-2 bg-red-500/20 text-red-300 rounded-lg text-xs hover:bg-red-500/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      {translations.actions.permanentDelete}
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
