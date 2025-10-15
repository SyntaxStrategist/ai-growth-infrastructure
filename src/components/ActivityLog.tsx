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
    noActivity: isFrench ? 'Aucune activité récente' : 'No recent activity',
  };

  const getActionLabel = (action: string) => {
    if (action === 'delete') return t.delete;
    if (action === 'archive') return t.archive;
    if (action === 'tag') return t.tag;
    if (action === 'reactivate') return t.reactivate;
    return action;
  };

  const getActionIcon = (action: string) => {
    if (action === 'delete') return '🟥';
    if (action === 'archive') return '🟧';
    if (action === 'tag') return '🟨';
    if (action === 'reactivate') return '🟩';
    return '⚪';
  };

  const getActionColor = (action: string) => {
    if (action === 'delete') return 'text-red-400 border-red-400/30 bg-red-500/10';
    if (action === 'archive') return 'text-orange-400 border-orange-400/30 bg-orange-500/10';
    if (action === 'tag') return 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10';
    if (action === 'reactivate') return 'text-green-400 border-green-400/30 bg-green-500/10';
    return 'text-white/60 border-white/10 bg-white/5';
  };

  if (actions.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 p-6 bg-white/5 text-center">
        <p className="text-white/40 text-sm">{t.noActivity}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 p-6 bg-white/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white/90">{t.title}</h3>
        <span className="text-xs text-white/40">{t.subtitle}</span>
      </div>

      <div className="space-y-2">
        {actions.map((action, idx) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{getActionIcon(action.action)}</span>
              <div className={`px-2 py-1 rounded text-xs font-medium border ${getActionColor(action.action)}`}>
                {getActionLabel(action.action)}
              </div>
              {action.tag && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 border border-purple-500/40 text-purple-300">
                  {action.tag}
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40">
                {new Date(action.timestamp).toLocaleTimeString(isFrench ? 'fr-CA' : 'en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

