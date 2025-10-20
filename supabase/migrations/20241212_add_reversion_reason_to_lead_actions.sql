-- Add reversion_reason field to lead_actions table
-- This field tracks the reason why a converted lead was reverted back to active

ALTER TABLE public.lead_actions
ADD COLUMN IF NOT EXISTS reversion_reason TEXT DEFAULT NULL;

-- Add index for faster queries on reversion events
CREATE INDEX IF NOT EXISTS idx_lead_actions_reversion_reason
ON public.lead_actions(reversion_reason)
WHERE reversion_reason IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.lead_actions.reversion_reason IS 
'Tracks the reason why a converted lead was reverted back to active. Options include: "Placed in converted by accident", "Other: [custom reason]", or NULL for non-reversion actions.';

