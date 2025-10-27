"use client";

import { motion } from "framer-motion";
import type { LeadAction } from "../app/api/lead-actions/route";

interface ActivityLogProps {
  actions: LeadAction[];
  locale: string;
}

export default function ActivityLog({ actions, locale }: ActivityLogProps) {
  const isFrench = locale === 'fr';

  const t = {
    title: isFrench ? 'Journal d\'Activité' : 'Activity Log',
    subtitle: isFrench ? '5 actions récentes' : 'Last 5 actions',
    delete: isFrench ? 'Supprimé' : 'Deleted',
    archive: isFrench ? 'Archivé' : 'Archived',
    tag: isFrench ? 'Étiqueté' : 'Tagged',
    reactivate: isFrench ? 'Réactivé' : 'Reactivated',
    noteAdded: isFrench ? 'Note ajoutée' : 'Note Added',
    noteDeleted: isFrench ? 'Note supprimée' : 'Note Deleted',
    newLead: isFrench ? 'Nouveau lead' : 'New Lead',
    leadCreated: isFrench ? 'Lead créé' : 'Lead Created',
    insert: isFrench ? 'Inséré' : 'Inserted',
    created: isFrench ? 'Créé' : 'Created',
    noActivity: isFrench ? 'Aucune activité récente' : 'No recent activity',
    new: isFrench ? 'NOUVEAU' : 'NEW',
  };

  // Check if an action is very recent (less than 1 minute ago)
  const isVeryRecent = (timestamp: string | Date) => {
    const actionTime = new Date(timestamp).getTime();
    const now = Date.now();
    const diffInMinutes = (now - actionTime) / (1000 * 60);
    return diffInMinutes < 1;
  };

  const getActionLabel = (action: LeadAction) => {
    // Use the translated action_label from API if available, otherwise fallback to client-side translation
    if (action.action_label) {
      return action.action_label;
    }
    
    // Fallback to client-side translation for backward compatibility
    const actionType = action.action?.toLowerCase();
    
    if (actionType === 'delete') return t.delete;
    if (actionType === 'archive') return t.archive;
    if (actionType === 'tag') return t.tag;
    if (actionType === 'reactivate') return t.reactivate;
    if (actionType === 'note_added') return t.noteAdded;
    if (actionType === 'note_deleted') return t.noteDeleted;
    if (actionType === 'new_lead' || actionType === 'lead_created') return t.leadCreated;
    if (actionType === 'insert' || actionType === 'inserted') return t.insert;
    if (actionType === 'created') return t.created;
    
    // If no translation found, return the raw action (shouldn't happen but fallback)
    return action.action || 'Unknown';
  };

  const getActionIcon = (action: string) => {
    const actionLower = action?.toLowerCase();
    
    if (actionLower === 'delete') return '🗑️';
    if (actionLower === 'archive') return '📦';
    if (actionLower === 'tag') return '🏷️';
    if (actionLower === 'reactivate') return '♻️';
    if (actionLower === 'note_added') return '📝';
    if (actionLower === 'note_deleted') return '🗑️';
    if (actionLower === 'new_lead' || actionLower === 'lead_created') return '✨';
    if (actionLower === 'insert' || actionLower === 'inserted') return '➕';
    if (actionLower === 'created') return '✨';
    return '⚪';
  };

  const getActionColor = (action: string) => {
    const actionLower = action?.toLowerCase();
    
    if (actionLower === 'delete') return 'from-red-500/20 via-red-600/15 to-red-700/10 border-red-400/40 text-red-300';
    if (actionLower === 'archive') return 'from-orange-500/20 via-orange-600/15 to-orange-700/10 border-orange-400/40 text-orange-300';
    if (actionLower === 'tag') return 'from-yellow-500/20 via-yellow-600/15 to-yellow-700/10 border-yellow-400/40 text-yellow-300';
    if (actionLower === 'reactivate') return 'from-green-500/20 via-green-600/15 to-green-700/10 border-green-400/40 text-green-300';
    if (actionLower === 'note_added') return 'from-blue-500/20 via-blue-600/15 to-blue-700/10 border-blue-400/40 text-blue-300';
    if (actionLower === 'note_deleted') return 'from-gray-500/20 via-gray-600/15 to-gray-700/10 border-gray-400/40 text-gray-300';
    if (actionLower === 'new_lead' || actionLower === 'lead_created' || actionLower === 'created') return 'from-cyan-500/20 via-cyan-600/15 to-cyan-700/10 border-cyan-400/40 text-cyan-300';
    if (actionLower === 'insert' || actionLower === 'inserted') return 'from-emerald-500/20 via-emerald-600/15 to-emerald-700/10 border-emerald-400/40 text-emerald-300';
    return 'from-white/10 to-white/5 border-white/10 text-white/60';
  };

  if (actions.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
        <p className="text-white/40 text-sm">{t.noActivity}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="bg-gradient-to-br from-white/5 via-white/5 to-white/[0.02] backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-lg"
    >
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{t.title}</h3>
          <p className="text-xs text-white/50">{t.subtitle}</p>
        </div>
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-400/30 flex items-center justify-center shadow-lg">
            <span className="text-xl">📊</span>
          </div>
          {/* Animated activity count badge */}
          {actions.length > 0 && (
            <motion.div
              key={actions.length}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 border-2 border-white/20 flex items-center justify-center shadow-lg"
            >
              <span className="text-xs font-bold text-white">{actions.length}</span>
            </motion.div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {actions.map((action, idx) => {
          const recent = isVeryRecent(action.timestamp);
          return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, x: -20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="group relative overflow-hidden"
          >
            {/* Pulse effect for very recent items */}
            {recent && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15), transparent 70%)`,
                }}
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
            <div className={`relative flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-white/5 via-white/[0.03] to-transparent hover:from-white/10 hover:via-white/5 hover:to-white/10 transition-all duration-300 cursor-pointer ${
              recent ? 'border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-white/10 hover:border-white/20'
            }`}
                 style={{
                   background: recent 
                     ? `linear-gradient(to right, rgba(59,130,246,0.1), rgba(255,255,255,0.05), rgba(255,255,255,0.01), transparent)`
                     : `linear-gradient(to right, rgba(255,255,255,0.05), rgba(255,255,255,0.01), transparent)`
                 }}>
              <div className="flex items-center gap-4 flex-1">
                {/* Icon with gradient background */}
                <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${getActionColor(action.action)} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-xl">{getActionIcon(action.action)}</span>
                </div>
                
                {/* Action Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* For insert/created actions, if tag exists, just show tag (it's more descriptive) */}
                    {((action.action?.toLowerCase() === 'insert' || action.action?.toLowerCase() === 'created') && action.tag) ? (
                      <span className="px-3 py-1.5 rounded-lg text-sm font-bold bg-gradient-to-r from-purple-500/30 to-purple-600/20 border border-purple-400/50 text-purple-200 shadow-sm backdrop-blur-sm">
                        {action.tag}
                      </span>
                    ) : (
                      <>
                        <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm bg-gradient-to-r ${getActionColor(action.action)} border shadow-sm`}>
                          {getActionLabel(action)}
                        </div>
                        {action.tag && action.tag !== getActionLabel(action) && (
                          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-500/30 to-purple-600/20 border border-purple-400/50 text-purple-200 shadow-sm backdrop-blur-sm">
                            {action.tag}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Timestamp */}
              <div className="flex items-center gap-2 ml-4">
                <div className="text-right">
                  <p className="text-xs font-medium text-white/70">
                    {action.formatted_timestamp || new Date(action.timestamp).toLocaleTimeString(isFrench ? 'fr-CA' : 'en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: !isFrench // 12-hour format for EN, 24-hour format for FR
                    })}
                  </p>
                </div>
              </div>
            </div>
            {/* "NEW" badge for very recent items */}
            {recent && (
              <div className="absolute top-2 right-2">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="px-2 py-0.5 text-[10px] font-bold uppercase bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full shadow-lg"
                >
                  {t.new}
                </motion.span>
              </div>
            )}
          </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

