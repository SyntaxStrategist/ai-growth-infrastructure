-- Phase 4: Automated Outreach Engine Migration
-- Creates tables for outreach campaigns, emails, templates, and tracking

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject_template TEXT NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    category TEXT DEFAULT 'initial_outreach' CHECK (category IN ('initial_outreach', 'follow_up', 'nurture', 'conversion')),
    variables TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create outreach campaigns table
CREATE TABLE IF NOT EXISTS public.outreach_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    target_criteria JSONB DEFAULT '{}',
    email_template_id UUID REFERENCES public.email_templates(id),
    follow_up_schedule JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create outreach emails table
CREATE TABLE IF NOT EXISTS public.outreach_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
    prospect_id TEXT NOT NULL,
    prospect_email TEXT NOT NULL,
    prospect_name TEXT,
    company_name TEXT,
    template_id UUID REFERENCES public.email_templates(id),
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'delivered', 'opened', 'replied', 'bounced', 'unsubscribed', 'converted')),
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    gmail_message_id TEXT,
    thread_id TEXT,
    follow_up_sequence INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create outreach tracking table
CREATE TABLE IF NOT EXISTS public.outreach_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID REFERENCES public.outreach_emails(id) ON DELETE CASCADE,
    prospect_id TEXT NOT NULL,
    campaign_id UUID REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('email_sent', 'email_delivered', 'email_opened', 'email_replied', 'email_bounced', 'email_unsubscribed', 'follow_up_sent', 'conversion', 'meeting_scheduled')),
    timestamp TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create outreach metrics table
CREATE TABLE IF NOT EXISTS public.outreach_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_replied INTEGER DEFAULT 0,
    total_converted INTEGER DEFAULT 0,
    open_rate NUMERIC DEFAULT 0,
    reply_rate NUMERIC DEFAULT 0,
    conversion_rate NUMERIC DEFAULT 0,
    bounce_rate NUMERIC DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates (category);
CREATE INDEX IF NOT EXISTS idx_email_templates_language ON public.email_templates (language);

CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_status ON public.outreach_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_created_at ON public.outreach_campaigns (created_at);

CREATE INDEX IF NOT EXISTS idx_outreach_emails_campaign_id ON public.outreach_emails (campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_emails_prospect_id ON public.outreach_emails (prospect_id);
CREATE INDEX IF NOT EXISTS idx_outreach_emails_status ON public.outreach_emails (status);
CREATE INDEX IF NOT EXISTS idx_outreach_emails_sent_at ON public.outreach_emails (sent_at);
CREATE INDEX IF NOT EXISTS idx_outreach_emails_gmail_message_id ON public.outreach_emails (gmail_message_id);
CREATE INDEX IF NOT EXISTS idx_outreach_emails_follow_up_sequence ON public.outreach_emails (follow_up_sequence);

CREATE INDEX IF NOT EXISTS idx_outreach_tracking_campaign_id ON public.outreach_tracking (campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_tracking_email_id ON public.outreach_tracking (email_id);
CREATE INDEX IF NOT EXISTS idx_outreach_tracking_prospect_id ON public.outreach_tracking (prospect_id);
CREATE INDEX IF NOT EXISTS idx_outreach_tracking_action ON public.outreach_tracking (action);
CREATE INDEX IF NOT EXISTS idx_outreach_tracking_timestamp ON public.outreach_tracking (timestamp);

CREATE INDEX IF NOT EXISTS idx_outreach_metrics_campaign_id ON public.outreach_metrics (campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_metrics_last_updated ON public.outreach_metrics (last_updated);

-- Create function to update outreach metrics
CREATE OR REPLACE FUNCTION update_outreach_metrics(campaign_uuid UUID)
RETURNS VOID AS $$
DECLARE
    email_stats RECORD;
BEGIN
    -- Calculate metrics from outreach_emails table
    SELECT 
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'replied', 'converted')) as total_delivered,
        COUNT(*) FILTER (WHERE status IN ('opened', 'replied', 'converted')) as total_opened,
        COUNT(*) FILTER (WHERE status IN ('replied', 'converted')) as total_replied,
        COUNT(*) FILTER (WHERE status = 'converted') as total_converted,
        COUNT(*) FILTER (WHERE status = 'bounced') as bounce_count,
        COUNT(*) FILTER (WHERE status = 'unsubscribed') as unsubscribed_count
    INTO email_stats
    FROM public.outreach_emails
    WHERE campaign_id = campaign_uuid;

    -- Insert or update metrics
    INSERT INTO public.outreach_metrics (
        campaign_id,
        total_sent,
        total_delivered,
        total_opened,
        total_replied,
        total_converted,
        open_rate,
        reply_rate,
        conversion_rate,
        bounce_rate,
        unsubscribed_count,
        last_updated
    ) VALUES (
        campaign_uuid,
        email_stats.total_sent,
        email_stats.total_delivered,
        email_stats.total_opened,
        email_stats.total_replied,
        email_stats.total_converted,
        CASE WHEN email_stats.total_sent > 0 THEN email_stats.total_opened::NUMERIC / email_stats.total_sent ELSE 0 END,
        CASE WHEN email_stats.total_sent > 0 THEN email_stats.total_replied::NUMERIC / email_stats.total_sent ELSE 0 END,
        CASE WHEN email_stats.total_sent > 0 THEN email_stats.total_converted::NUMERIC / email_stats.total_sent ELSE 0 END,
        CASE WHEN email_stats.total_sent > 0 THEN email_stats.bounce_count::NUMERIC / email_stats.total_sent ELSE 0 END,
        email_stats.unsubscribed_count,
        now()
    )
    ON CONFLICT (campaign_id) DO UPDATE SET
        total_sent = EXCLUDED.total_sent,
        total_delivered = EXCLUDED.total_delivered,
        total_opened = EXCLUDED.total_opened,
        total_replied = EXCLUDED.total_replied,
        total_converted = EXCLUDED.total_converted,
        open_rate = EXCLUDED.open_rate,
        reply_rate = EXCLUDED.reply_rate,
        conversion_rate = EXCLUDED.conversion_rate,
        bounce_rate = EXCLUDED.bounce_rate,
        unsubscribed_count = EXCLUDED.unsubscribed_count,
        last_updated = EXCLUDED.last_updated;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update metrics when emails are updated
CREATE OR REPLACE FUNCTION trigger_update_outreach_metrics()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_outreach_metrics(NEW.campaign_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_outreach_metrics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.outreach_emails
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_outreach_metrics();

-- Create function to process follow-up emails
CREATE OR REPLACE FUNCTION process_follow_up_emails()
RETURNS VOID AS $$
DECLARE
    campaign_record RECORD;
    follow_up_record RECORD;
    email_record RECORD;
    cutoff_date TIMESTAMPTZ;
BEGIN
    -- Loop through all active campaigns
    FOR campaign_record IN 
        SELECT id, follow_up_schedule 
        FROM public.outreach_campaigns 
        WHERE status = 'active' AND follow_up_schedule IS NOT NULL
    LOOP
        -- Loop through follow-up schedule
        FOR follow_up_record IN 
            SELECT * FROM jsonb_to_recordset(campaign_record.follow_up_schedule) AS x(
                sequence_number INTEGER,
                delay_days INTEGER,
                template_id TEXT,
                conditions JSONB
            )
        LOOP
            -- Calculate cutoff date
            cutoff_date := now() - (follow_up_record.delay_days || INTERVAL '1 day');
            
            -- Find emails that need follow-up
            FOR email_record IN
                SELECT * FROM public.outreach_emails
                WHERE campaign_id = campaign_record.id
                AND follow_up_sequence = follow_up_record.sequence_number - 1
                AND sent_at < cutoff_date
                AND status IN ('sent', 'delivered', 'opened')
                AND NOT EXISTS (
                    SELECT 1 FROM public.outreach_emails
                    WHERE campaign_id = campaign_record.id
                    AND prospect_id = public.outreach_emails.prospect_id
                    AND follow_up_sequence = follow_up_record.sequence_number
                )
            LOOP
                -- Check if follow-up conditions are met
                IF (follow_up_record.conditions->>'if_no_reply' = 'true' AND email_record.replied_at IS NULL)
                OR (follow_up_record.conditions->>'if_no_open' = 'true' AND email_record.opened_at IS NULL)
                THEN
                    -- Mark for follow-up (actual sending would be handled by the application)
                    INSERT INTO public.outreach_tracking (
                        email_id,
                        prospect_id,
                        campaign_id,
                        action,
                        metadata
                    ) VALUES (
                        email_record.id,
                        email_record.prospect_id,
                        email_record.campaign_id,
                        'follow_up_sent',
                        jsonb_build_object(
                            'sequence_number', follow_up_record.sequence_number,
                            'template_id', follow_up_record.template_id,
                            'scheduled_at', now()
                        )
                    );
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to get campaign analytics
CREATE OR REPLACE FUNCTION get_campaign_analytics(campaign_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'campaign_id', campaign_uuid,
        'total_emails_sent', COUNT(*),
        'total_emails_delivered', COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'replied', 'converted')),
        'total_emails_opened', COUNT(*) FILTER (WHERE status IN ('opened', 'replied', 'converted')),
        'total_emails_replied', COUNT(*) FILTER (WHERE status IN ('replied', 'converted')),
        'total_conversions', COUNT(*) FILTER (WHERE status = 'converted'),
        'open_rate', CASE WHEN COUNT(*) > 0 THEN COUNT(*) FILTER (WHERE status IN ('opened', 'replied', 'converted'))::NUMERIC / COUNT(*) ELSE 0 END,
        'reply_rate', CASE WHEN COUNT(*) > 0 THEN COUNT(*) FILTER (WHERE status IN ('replied', 'converted'))::NUMERIC / COUNT(*) ELSE 0 END,
        'conversion_rate', CASE WHEN COUNT(*) > 0 THEN COUNT(*) FILTER (WHERE status = 'converted')::NUMERIC / COUNT(*) ELSE 0 END,
        'last_updated', now()
    )
    INTO result
    FROM public.outreach_emails
    WHERE campaign_id = campaign_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insert default email templates
INSERT INTO public.email_templates (name, subject_template, html_template, text_template, category, variables) VALUES
(
    'Initial Outreach - AI Automation',
    '{{company_name}} - AI Automation Opportunity',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2>Hi {{contact_name}},</h2><p>I noticed {{company_name}} is in the {{industry}} space and likely dealing with {{pain_points}}.</p><p>We''ve helped similar companies in your industry achieve:</p><ul><li>3x higher lead conversion rates</li><li>Automated prospect discovery and scoring</li><li>Intelligent outreach that actually gets responses</li></ul><p>Would you be interested in a 15-minute call to discuss how AI automation could help {{company_name}} generate more qualified leads?</p><p>Best regards,<br>The Avenir AI Team</p></div>',
    'Hi {{contact_name}},\n\nI noticed {{company_name}} is in the {{industry}} space and likely dealing with {{pain_points}}.\n\nWe''ve helped similar companies in your industry achieve:\n- 3x higher lead conversion rates\n- Automated prospect discovery and scoring\n- Intelligent outreach that actually gets responses\n\nWould you be interested in a 15-minute call to discuss how AI automation could help {{company_name}} generate more qualified leads?\n\nBest regards,\nThe Avenir AI Team',
    'initial_outreach',
    ARRAY['company_name', 'contact_name', 'industry', 'pain_points']
),
(
    'Follow-up - Value Proposition',
    'Following up on AI automation for {{company_name}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2>Hi {{contact_name}},</h2><p>I wanted to follow up on my previous email about AI automation for {{company_name}}.</p><p>Since I last reached out {{days_since_original}} days ago, I''ve been thinking about how our AI-powered lead generation system could specifically help {{company_name}} with {{pain_points}}.</p><p>Here''s what I think would be most valuable for your team:</p><ul><li>Automated prospect discovery using your ideal customer profile</li><li>Intelligent lead scoring that prioritizes the best opportunities</li><li>Personalized outreach that gets 3x higher response rates</li></ul><p>Would you be open to a brief 15-minute call this week to discuss how this could work for {{company_name}}?</p><p>Best regards,<br>The Avenir AI Team</p></div>',
    'Hi {{contact_name}},\n\nI wanted to follow up on my previous email about AI automation for {{company_name}}.\n\nSince I last reached out {{days_since_original}} days ago, I''ve been thinking about how our AI-powered lead generation system could specifically help {{company_name}} with {{pain_points}}.\n\nHere''s what I think would be most valuable for your team:\n- Automated prospect discovery using your ideal customer profile\n- Intelligent lead scoring that prioritizes the best opportunities\n- Personalized outreach that gets 3x higher response rates\n\nWould you be open to a brief 15-minute call this week to discuss how this could work for {{company_name}}?\n\nBest regards,\nThe Avenir AI Team',
    'follow_up',
    ARRAY['company_name', 'contact_name', 'pain_points', 'days_since_original']
);

-- Add unique constraint to outreach_metrics
ALTER TABLE public.outreach_metrics ADD CONSTRAINT unique_campaign_metrics UNIQUE (campaign_id);

-- Add RLS policies (disabled for now as requested)
-- ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.outreach_emails ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.outreach_tracking ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.outreach_metrics ENABLE ROW LEVEL SECURITY;

-- Create comment
COMMENT ON TABLE public.email_templates IS 'Email templates for outreach campaigns';
COMMENT ON TABLE public.outreach_campaigns IS 'Outreach campaigns with targeting criteria and follow-up schedules';
COMMENT ON TABLE public.outreach_emails IS 'Individual emails sent as part of outreach campaigns';
COMMENT ON TABLE public.outreach_tracking IS 'Tracking events for outreach emails (opens, replies, etc.)';
COMMENT ON TABLE public.outreach_metrics IS 'Aggregated metrics for outreach campaigns';
