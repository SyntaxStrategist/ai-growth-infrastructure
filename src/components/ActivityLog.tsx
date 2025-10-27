"use client";

import type { LeadAction } from "../app/api/lead-actions/route";

interface ActivityLogProps {
  actions: LeadAction[];
  locale: string;
}

export default function ActivityLog({ actions, locale }: ActivityLogProps) {
  const isFrench = locale === 'fr';

  const getActionLabel = (action: LeadAction) => {
    // Use the translated action_label from API if available
    if (action.action_label) {
      return action.action_label;
    }
    
    // Fallback translation
    const actionType = action.action?.toLowerCase();
    
    if (actionType === 'delete') return isFrench ? 'Supprimé' : 'Deleted';
    if (actionType === 'archive') return isFrench ? 'Archivé' : 'Archived';
    if (actionType === 'tag') return isFrench ? 'Tag ajouté' : 'Tag Added';
    if (actionType === 'reactivate') return isFrench ? 'Réactivé' : 'Reactivated';
    if (actionType === 'note_added') return isFrench ? 'Note ajoutée' : 'Note Added';
    if (actionType === 'note_deleted') return isFrench ? 'Note supprimée' : 'Note Deleted';
    if (actionType === 'insert') return isFrench ? 'Nouveau lead' : 'New Lead';
    
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
    if (actionLower === 'insert') return '➕';
    return '⚪';
  };

  if (actions.length === 0) {
    return (
      <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
        <p className="text-white/40 text-sm">{isFrench ? 'Aucune activité récente' : 'No recent activity'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <h3 className="text-sm font-semibold text-white mb-3">{isFrench ? 'Journal d\'Activité' : 'Activity Log'}</h3>
      <div className="space-y-2">
        {actions.map((action) => {
          const actionIcon = getActionIcon(action.action);
          const actionLabel = getActionLabel(action);
          const timestamp = action.formatted_timestamp || new Date(action.timestamp).toLocaleTimeString(isFrench ? 'fr-CA' : 'en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: !isFrench
          });
          
          // For insert actions, just show the tag (it's more descriptive than "insert - New Lead")
          const displayText = (action.action?.toLowerCase() === 'insert' && action.tag) 
            ? action.tag 
            : (action.tag ? `${actionLabel} - ${action.tag}` : actionLabel);
          
          return (
            <div key={action.id} className="flex items-center gap-3 px-3 py-2 rounded bg-white/5 hover:bg-white/10 transition-colors">
              {/* Small icon */}
              <span className="text-base">{actionIcon}</span>
              
              {/* Action text */}
              <span className="flex-1 text-sm text-white/90">
                {displayText}
              </span>
              
              {/* Compact timestamp */}
              <span className="text-xs text-white/50">{timestamp}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

