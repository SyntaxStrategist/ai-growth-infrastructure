-- Migration: Add AI enrichment fields to existing lead_memory table
-- Run this if you already have the lead_memory table without enrichment fields

-- Add new columns for AI Intelligence Layer
ALTER TABLE public.lead_memory 
  ADD COLUMN IF NOT EXISTS intent TEXT,
  ADD COLUMN IF NOT EXISTS tone TEXT,
  ADD COLUMN IF NOT EXISTS urgency TEXT,
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5,2);

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS lead_memory_urgency_idx ON public.lead_memory(urgency);
CREATE INDEX IF NOT EXISTS lead_memory_confidence_idx ON public.lead_memory(confidence_score);

-- Optional: Add a comment to document the enrichment fields
COMMENT ON COLUMN public.lead_memory.intent IS 'AI-classified intent (e.g., B2B partnership, AI scaling)';
COMMENT ON COLUMN public.lead_memory.tone IS 'Communication style (formal, casual, urgent, confident, etc.)';
COMMENT ON COLUMN public.lead_memory.urgency IS 'Buying urgency (Low, Medium, High)';
COMMENT ON COLUMN public.lead_memory.confidence_score IS 'AI confidence in classification (0.0 to 1.0)';

