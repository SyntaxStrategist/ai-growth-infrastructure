-- Add conversion_outcome field to lead_actions table
-- This field tracks whether a lead action resulted in a conversion

ALTER TABLE public.lead_actions
ADD COLUMN IF NOT EXISTS conversion_outcome BOOLEAN DEFAULT NULL;

-- Add index for faster queries on converted leads
CREATE INDEX IF NOT EXISTS idx_lead_actions_conversion_outcome
ON public.lead_actions(conversion_outcome)
WHERE conversion_outcome = true;

-- Add comment for documentation
COMMENT ON COLUMN public.lead_actions.conversion_outcome IS 
'Tracks whether this action was a lead conversion (Converted/Converti tag). NULL for non-conversion actions, TRUE when lead is marked as converted.';

