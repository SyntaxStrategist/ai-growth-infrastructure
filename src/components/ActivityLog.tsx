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
    
    // Fallback translation (shouldn't be needed with proper API translations)
    const actionType = action.action?.toLowerCase();
    
    if (actionType === 'delete') return isFrench ? 'Supprimé' : 'Deleted';
    if (actionType === 'archive') return isFrench ? 'Archivé' : 'Archived';
    if (actionType === 'tag') return isFrench ? 'Priorité ajoutée' : 'Priority Added';
    if (actionType === 'reactivate') return isFrench ? 'Réactivé' : 'Reactivated';
    if (actionType === 'note_added') return isFrench ? 'Note ajoutée' : 'Note Added';
    if (actionType === 'note_deleted') return isFrench ? 'Note supprimée' : 'Note Deleted';
    if (actionType === 'insert') return isFrench ? 'Nouveau lead' : 'New Lead';
    if (actionType === 'outcome_update') {
      // Handle outcome updates with user-friendly text
      const outcome = action.tag?.toLowerCase();
      if (outcome === 'contacted') return isFrench ? 'Lead contacté' : 'Lead Contacted';
      if (outcome === 'meeting_booked') return isFrench ? 'Réunion réservée' : 'Meeting Booked';
      if (outcome === 'client_closed') return isFrench ? 'Client fermé' : 'Client Closed';
      if (outcome === 'no_sale') return isFrench ? 'Pas de vente' : 'No Sale';
      return isFrench ? 'Statut mis à jour' : 'Status Updated';
    }
    
    return action.action || 'Unknown';
  };

  const getActionIcon = (action: string, tag?: string) => {
    const actionLower = action?.toLowerCase();
    
    if (actionLower === 'delete') return '🗑️';
    if (actionLower === 'archive') return '📦';
    if (actionLower === 'tag') {
      // Different icons for different priority tags
      const tagLower = tag?.toLowerCase();
      if (tagLower?.includes('high') || tagLower?.includes('haute') || tagLower?.includes('priority') || tagLower?.includes('priorité')) return '🔴';
      if (tagLower?.includes('referral') || tagLower?.includes('référence')) return '🤝';
      if (tagLower?.includes('follow') || tagLower?.includes('suivi')) return '📞';
      return '🏷️';
    }
    if (actionLower === 'reactivate') return '♻️';
    if (actionLower === 'note_added') return '📝';
    if (actionLower === 'note_deleted') return '🗑️';
    if (actionLower === 'insert') return '➕';
    if (actionLower === 'outcome_update') {
      // Different icons for different outcomes
      const outcome = tag?.toLowerCase();
      if (outcome === 'contacted') return '📞';
      if (outcome === 'meeting_booked') return '📅';
      if (outcome === 'client_closed') return '💰';
      if (outcome === 'no_sale') return '❌';
      return '🔄';
    }
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
          const actionIcon = getActionIcon(action.action, action.tag || undefined);
          const actionLabel = getActionLabel(action);
          const timestamp = action.formatted_timestamp || new Date(action.timestamp).toLocaleTimeString(isFrench ? 'fr-CA' : 'en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: !isFrench
          });
          
          // For outcome updates, don't show the tag since it's already in the label
          // For priority tags, show the tag name
          const displayText = (action.action?.toLowerCase() === 'outcome_update') 
            ? actionLabel 
            : (action.action?.toLowerCase() === 'tag' && action.tag) 
              ? `${actionLabel}: ${action.tag}`
              : (action.action?.toLowerCase() === 'insert' && action.tag) 
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

