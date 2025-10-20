-- ============================================
-- Complete Client Branding & SMTP Fields
-- ============================================
-- Phase 2: Add industry context, SMTP credentials, and enhanced personalization

-- Add industry and service context fields
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS industry_category TEXT,
ADD COLUMN IF NOT EXISTS primary_service TEXT,
ADD COLUMN IF NOT EXISTS booking_link TEXT NULL;

-- Make custom_tagline optional (was required, now optional for smoother onboarding)
ALTER TABLE public.clients
ALTER COLUMN custom_tagline DROP NOT NULL,
ALTER COLUMN custom_tagline DROP DEFAULT;

-- Ensure email_tone and followup_speed have correct defaults
ALTER TABLE public.clients
ALTER COLUMN email_tone SET DEFAULT 'Friendly',
ALTER COLUMN followup_speed SET DEFAULT 'Instant';

-- Add SMTP credentials for custom email sending
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS outbound_email TEXT NULL,
ADD COLUMN IF NOT EXISTS smtp_host TEXT NULL,
ADD COLUMN IF NOT EXISTS smtp_port INTEGER NULL,
ADD COLUMN IF NOT EXISTS smtp_username TEXT NULL,
ADD COLUMN IF NOT EXISTS smtp_password TEXT NULL;

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_clients_industry_category 
ON public.clients(industry_category);

CREATE INDEX IF NOT EXISTS idx_clients_has_booking_link 
ON public.clients(booking_link) 
WHERE booking_link IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_has_smtp 
ON public.clients(outbound_email) 
WHERE outbound_email IS NOT NULL;

-- Add constraints
ALTER TABLE public.clients
DROP CONSTRAINT IF EXISTS valid_email_tone,
ADD CONSTRAINT valid_email_tone 
CHECK (email_tone IN ('Professional', 'Friendly', 'Formal', 'Energetic'));

ALTER TABLE public.clients
DROP CONSTRAINT IF EXISTS valid_followup_speed,
ADD CONSTRAINT valid_followup_speed 
CHECK (followup_speed IN ('Instant', 'Within 1 hour', 'Same day'));

-- Add comments
COMMENT ON COLUMN public.clients.industry_category IS 
'Client''s industry sector (e.g., Real Estate, Construction, Technology). Used to personalize email context.';

COMMENT ON COLUMN public.clients.primary_service IS 
'Main service or product offering (e.g., Home Renovations, AI Consulting). Referenced in email responses.';

COMMENT ON COLUMN public.clients.booking_link IS 
'Optional URL for booking/scheduling. Included as CTA button in emails if present.';

COMMENT ON COLUMN public.clients.outbound_email IS 
'Custom email address for sending automated responses (e.g., contact@clientdomain.com). If set, emails use this address.';

COMMENT ON COLUMN public.clients.smtp_host IS 
'SMTP server hostname for custom email sending (e.g., smtp.gmail.com)';

COMMENT ON COLUMN public.clients.smtp_port IS 
'SMTP server port (typically 587 for TLS or 465 for SSL)';

COMMENT ON COLUMN public.clients.smtp_username IS 
'SMTP authentication username';

COMMENT ON COLUMN public.clients.smtp_password IS 
'SMTP authentication password (stored encrypted)';

-- Update Avenir AI Solutions with complete branding
UPDATE public.clients
SET 
  industry_category = 'AI & Technology',
  primary_service = 'AI-Powered Growth Intelligence',
  custom_tagline = 'AI-Powered Growth Intelligence',
  email_tone = 'Professional',
  followup_speed = 'Instant',
  ai_personalized_reply = TRUE,
  outbound_email = 'contact@aveniraisolutions.ca'
WHERE client_id = '00000000-0000-0000-0000-000000000001';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Complete client branding migration complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 New Fields Added:';
  RAISE NOTICE '   - industry_category (context)';
  RAISE NOTICE '   - primary_service (context)';
  RAISE NOTICE '   - booking_link (optional CTA)';
  RAISE NOTICE '   - custom_tagline (now optional)';
  RAISE NOTICE '   - outbound_email (custom sender)';
  RAISE NOTICE '   - smtp_host, smtp_port (custom SMTP)';
  RAISE NOTICE '   - smtp_username, smtp_password (auth)';
  RAISE NOTICE '';
  RAISE NOTICE '📧 Email Personalization:';
  RAISE NOTICE '   Each client can now send from their own email address';
  RAISE NOTICE '   with fully customized branding and context';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Avenir AI Solutions defaults updated';
END $$;

