-- ============================================
-- Add Client Branding & Email Personalization Fields
-- ============================================
-- Allows each client to customize their automated email responses
-- with their own brand voice, tone, and follow-up preferences

-- Add new columns to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS custom_tagline TEXT NOT NULL DEFAULT 'AI that helps businesses act faster',
ADD COLUMN IF NOT EXISTS email_tone TEXT NOT NULL DEFAULT 'Professional',
ADD COLUMN IF NOT EXISTS followup_speed TEXT NOT NULL DEFAULT 'Instant',
ADD COLUMN IF NOT EXISTS ai_personalized_reply BOOLEAN DEFAULT TRUE;

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_clients_email_tone 
ON public.clients(email_tone);

CREATE INDEX IF NOT EXISTS idx_clients_followup_speed 
ON public.clients(followup_speed);

CREATE INDEX IF NOT EXISTS idx_clients_ai_personalized_reply 
ON public.clients(ai_personalized_reply);

-- Add constraints to ensure valid values (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_email_tone' 
        AND conrelid = 'public.clients'::regclass
    ) THEN
        ALTER TABLE public.clients
        ADD CONSTRAINT valid_email_tone 
        CHECK (email_tone IN ('Professional', 'Friendly', 'Formal', 'Energetic'));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_followup_speed' 
        AND conrelid = 'public.clients'::regclass
    ) THEN
        ALTER TABLE public.clients
        ADD CONSTRAINT valid_followup_speed 
        CHECK (followup_speed IN ('Instant', 'Within 1 hour', 'Same day'));
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.clients.custom_tagline IS 
'Client''s custom tagline used in automated email responses. Example: "AI that helps businesses act faster"';

COMMENT ON COLUMN public.clients.email_tone IS 
'Preferred tone for automated email responses. Options: Professional, Friendly, Formal, Energetic';

COMMENT ON COLUMN public.clients.followup_speed IS 
'Expected follow-up response time shown in auto-replies. Options: Instant, Within 1 hour, Same day';

COMMENT ON COLUMN public.clients.ai_personalized_reply IS 
'Enable/disable AI-personalized auto-reply emails. If false, only basic confirmation emails are sent.';

-- Set default values for Avenir AI Solutions (internal client)
UPDATE public.clients
SET 
  custom_tagline = 'AI-Powered Growth Intelligence',
  email_tone = 'Professional',
  followup_speed = 'Instant',
  ai_personalized_reply = TRUE
WHERE client_id = '00000000-0000-0000-0000-000000000001';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Client branding fields migration complete!';
  RAISE NOTICE '   - Added: custom_tagline (TEXT, required)';
  RAISE NOTICE '   - Added: email_tone (TEXT, required)';
  RAISE NOTICE '   - Added: followup_speed (TEXT, required)';
  RAISE NOTICE '   - Added: ai_personalized_reply (BOOLEAN, default TRUE)';
  RAISE NOTICE '   - Created indexes for performance';
  RAISE NOTICE '   - Added validation constraints';
  RAISE NOTICE '';
  RAISE NOTICE '📧 Email Personalization:';
  RAISE NOTICE '   Each client can now customize their auto-reply emails';
  RAISE NOTICE '   with their own brand voice and follow-up preferences';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Avenir AI Solutions default values set';
END $$;

