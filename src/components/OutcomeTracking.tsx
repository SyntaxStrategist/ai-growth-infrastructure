"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';

interface OutcomeTrackingProps {
  leadId: string;
  clientId?: string;
  currentOutcome?: string | null;
  isFrench: boolean;
  onOutcomeUpdate?: (outcome: string) => void;
}

interface OutcomeButton {
  id: string;
  label: string;
  labelFr: string;
  icon: string;
  color: string;
  borderColor: string;
  hoverColor: string;
  shadowColor: string;
}

const outcomeButtons: OutcomeButton[] = [
  {
    id: 'contacted',
    label: 'Mark as Contacted',
    labelFr: 'Marquer comme Contacté',
    icon: '📞',
    color: 'bg-blue-500/20',
    borderColor: 'border-blue-500/40',
    hoverColor: 'hover:bg-blue-500/30',
    shadowColor: 'hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]'
  },
  {
    id: 'meeting_booked',
    label: 'Meeting Booked',
    labelFr: 'Réunion Planifiée',
    icon: '📅',
    color: 'bg-green-500/20',
    borderColor: 'border-green-500/40',
    hoverColor: 'hover:bg-green-500/30',
    shadowColor: 'hover:shadow-[0_0_15px_rgba(34,197,94,0.5)]'
  },
  {
    id: 'client_closed',
    label: 'Client Closed',
    labelFr: 'Client Fermé',
    icon: '💰',
    color: 'bg-purple-500/20',
    borderColor: 'border-purple-500/40',
    hoverColor: 'hover:bg-purple-500/30',
    shadowColor: 'hover:shadow-[0_0_15px_rgba(147,51,234,0.5)]'
  },
  {
    id: 'no_sale',
    label: 'No Sale',
    labelFr: 'Pas de Vente',
    icon: '❌',
    color: 'bg-red-500/20',
    borderColor: 'border-red-500/40',
    hoverColor: 'hover:bg-red-500/30',
    shadowColor: 'hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]'
  }
];

export default function OutcomeTracking({ 
  leadId, 
  clientId, 
  currentOutcome, 
  isFrench, 
  onOutcomeUpdate 
}: OutcomeTrackingProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleOutcomeUpdate = async (outcome: string) => {
    if (!clientId) {
      setUpdateError(isFrench ? 'ID client requis' : 'Client ID required');
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      console.log(`[OutcomeTracking] Updating lead ${leadId} outcome to ${outcome}`);

      const response = await fetch(`/api/lead/${leadId}/outcome?clientId=${clientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: leadId,
          outcome_status: outcome
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update outcome');
      }

      console.log(`[OutcomeTracking] ✅ Successfully updated outcome to ${outcome}`);
      
      // Call the callback if provided
      if (onOutcomeUpdate) {
        onOutcomeUpdate(outcome);
      }

    } catch (error) {
      console.error('[OutcomeTracking] Update failed:', error);
      setUpdateError(
        error instanceof Error 
          ? error.message 
          : (isFrench ? 'Erreur lors de la mise à jour' : 'Update failed')
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const getOutcomeStatus = (outcome: string | null | undefined) => {
    if (!outcome) return null;
    return outcomeButtons.find(btn => btn.id === outcome);
  };

  const currentOutcomeButton = getOutcomeStatus(currentOutcome);

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-white/50 text-xs font-medium">
          {isFrench ? 'Suivi des Résultats' : 'Outcome Tracking'}
        </span>
        {currentOutcomeButton && (
          <span className={`px-2 py-1 text-xs rounded border ${currentOutcomeButton.color} ${currentOutcomeButton.borderColor} text-white/80`}>
            {currentOutcomeButton.icon} {isFrench ? currentOutcomeButton.labelFr : currentOutcomeButton.label}
          </span>
        )}
      </div>

      {updateError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs"
        >
          {updateError}
        </motion.div>
      )}

      <div className="flex flex-wrap gap-2">
        {outcomeButtons.map((button) => {
          const isCurrentOutcome = currentOutcome === button.id;
          const isDisabled = isUpdating || isCurrentOutcome;

          return (
            <motion.button
              key={button.id}
              onClick={() => handleOutcomeUpdate(button.id)}
              disabled={isDisabled}
              className={`
                px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border
                ${button.color} ${button.borderColor} ${button.hoverColor} ${button.shadowColor}
                ${isDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:border-opacity-60 cursor-pointer'
                }
                ${isCurrentOutcome ? 'ring-2 ring-white/20' : ''}
              `}
              whileHover={!isDisabled ? { scale: 1.02 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{button.icon}</span>
                <span className="text-white/90">
                  {isFrench ? button.labelFr : button.label}
                </span>
                {isCurrentOutcome && (
                  <span className="text-xs text-white/60">✓</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {isUpdating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex items-center gap-2 text-xs text-white/60"
        >
          <span className="inline-block w-3 h-3 border border-white/30 border-t-white/60 rounded-full animate-spin"></span>
          <span>{isFrench ? 'Mise à jour...' : 'Updating...'}</span>
        </motion.div>
      )}

      {/* Help text */}
      <div className="mt-2 text-xs text-white/40">
        {isFrench 
          ? 'Cliquez sur les boutons pour suivre l\'avancement de ce lead dans votre processus de vente.'
          : 'Click the buttons to track this lead\'s progress through your sales process.'
        }
      </div>
    </div>
  );
}
