import { createClient } from '@supabase/supabase-js';
import { GmailAPI } from './gmail_integration';
import { EmailTemplateEngine } from './email_templates';
import { OutreachTracker } from './outreach_tracking';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface OutreachCampaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  target_criteria: any;
  email_template_id: string;
  follow_up_schedule: FollowUpSchedule[];
  created_at: string;
  updated_at: string;
}

export interface FollowUpSchedule {
  id: string;
  campaign_id: string;
  sequence_number: number;
  delay_days: number;
  template_id: string;
  conditions: FollowUpConditions;
}

export interface FollowUpConditions {
  if_no_reply: boolean;
  if_no_open: boolean;
  if_negative_reply: boolean;
  if_positive_reply: boolean;
}

export interface OutreachEmail {
  id: string;
  campaign_id: string;
  prospect_id: string;
  prospect_email: string;
  prospect_name: string;
  company_name: string;
  template_id: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced' | 'unsubscribed';
  sent_at?: string;
  opened_at?: string;
  replied_at?: string;
  gmail_message_id?: string;
  thread_id?: string;
  follow_up_sequence: number;
  created_at: string;
  updated_at: string;
}

export interface OutreachMetrics {
  campaign_id: string;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_replied: number;
  total_converted: number;
  open_rate: number;
  reply_rate: number;
  conversion_rate: number;
  bounce_rate: number;
  unsubscribed_count: number;
  last_updated: string;
}

export class OutreachEngine {
  private gmailAPI: GmailAPI;
  private templateEngine: EmailTemplateEngine;
  private tracker: OutreachTracker;

  constructor() {
    this.gmailAPI = new GmailAPI();
    this.templateEngine = new EmailTemplateEngine();
    this.tracker = new OutreachTracker();
  }

  /**
   * Create a new outreach campaign
   */
  async createCampaign(campaignData: Partial<OutreachCampaign>): Promise<OutreachCampaign> {
    const { data, error } = await supabase
      .from('outreach_campaigns')
      .insert([{
        name: campaignData.name,
        status: 'draft',
        target_criteria: campaignData.target_criteria || {},
        email_template_id: campaignData.email_template_id,
        follow_up_schedule: campaignData.follow_up_schedule || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get prospects for a campaign based on target criteria
   */
  async getCampaignProspects(campaignId: string, limit: number = 100): Promise<any[]> {
    const { data: campaign } = await supabase
      .from('outreach_campaigns')
      .select('target_criteria')
      .eq('id', campaignId)
      .single();

    if (!campaign) throw new Error('Campaign not found');

    // Use Phase 3 optimization to get ranked prospects
    const { data: prospects } = await supabase
      .from('prospect_dynamic_scores')
      .select(`
        prospect_id,
        company_name,
        contact_email,
        contact_name,
        industry,
        company_size,
        technology_stack,
        pain_points,
        score,
        conversion_probability
      `)
      .gte('score', 0.7) // Only high-scoring prospects
      .order('score', { ascending: false })
      .limit(limit);

    return prospects || [];
  }

  /**
   * Send personalized emails for a campaign
   */
  async sendCampaignEmails(campaignId: string, prospectIds: string[]): Promise<OutreachEmail[]> {
    const { data: campaign } = await supabase
      .from('outreach_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (!campaign) throw new Error('Campaign not found');

    const prospects = await this.getCampaignProspects(campaignId, prospectIds.length);
    const emails: OutreachEmail[] = [];

    for (const prospect of prospects) {
      if (!prospectIds.includes(prospect.prospect_id)) continue;

      try {
        // Generate personalized email content
        const emailContent = await this.templateEngine.generatePersonalizedEmail(
          campaign.email_template_id,
          prospect
        );

        // Send via Gmail API
        const gmailResult = await this.gmailAPI.sendEmail({
          to: prospect.contact_email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text
        });

        // Create outreach email record
        const { data: email, error } = await supabase
          .from('outreach_emails')
          .insert([{
            campaign_id: campaignId,
            prospect_id: prospect.prospect_id,
            prospect_email: prospect.contact_email,
            prospect_name: prospect.contact_name,
            company_name: prospect.company_name,
            template_id: campaign.email_template_id,
            subject: emailContent.subject,
            content: emailContent.html,
            status: 'sent',
            sent_at: new Date().toISOString(),
            gmail_message_id: gmailResult.messageId,
            thread_id: gmailResult.threadId,
            follow_up_sequence: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;
        emails.push(email);

        // Track the outreach
        await this.tracker.trackOutreach({
          email_id: email.id,
          prospect_id: prospect.prospect_id,
          campaign_id: campaignId,
          action: 'email_sent',
          timestamp: new Date().toISOString(),
          metadata: {
            gmail_message_id: gmailResult.messageId,
            template_id: campaign.email_template_id
          }
        });

      } catch (error) {
        console.error(`Failed to send email to ${prospect.contact_email}:`, error);
        
        // Create failed email record
        const { data: failedEmail } = await supabase
          .from('outreach_emails')
          .insert([{
            campaign_id: campaignId,
            prospect_id: prospect.prospect_id,
            prospect_email: prospect.contact_email,
            prospect_name: prospect.contact_name,
            company_name: prospect.company_name,
            template_id: campaign.email_template_id,
            subject: 'Failed to send',
            content: '',
            status: 'bounced',
            follow_up_sequence: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (failedEmail) emails.push(failedEmail);
      }
    }

    return emails;
  }

  /**
   * Process follow-up emails based on campaign schedule
   */
  async processFollowUps(campaignId: string): Promise<void> {
    const { data: campaign } = await supabase
      .from('outreach_campaigns')
      .select('follow_up_schedule')
      .eq('id', campaignId)
      .single();

    if (!campaign?.follow_up_schedule) return;

    for (const followUp of campaign.follow_up_schedule) {
      await this.processFollowUpSequence(campaignId, followUp);
    }
  }

  /**
   * Process a specific follow-up sequence
   */
  private async processFollowUpSequence(campaignId: string, followUp: FollowUpSchedule): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - followUp.delay_days);

    // Find emails that need follow-up
    const { data: emails } = await supabase
      .from('outreach_emails')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('follow_up_sequence', followUp.sequence_number - 1)
      .lt('sent_at', cutoffDate.toISOString())
      .in('status', ['sent', 'delivered', 'opened']);

    if (!emails) return;

    for (const email of emails) {
      // Check if follow-up conditions are met
      if (await this.shouldSendFollowUp(email, followUp.conditions)) {
        await this.sendFollowUpEmail(email, followUp);
      }
    }
  }

  /**
   * Check if follow-up conditions are met
   */
  private async shouldSendFollowUp(email: OutreachEmail, conditions: FollowUpConditions): Promise<boolean> {
    if (conditions.if_no_reply && !email.replied_at) return true;
    if (conditions.if_no_open && !email.opened_at) return true;
    if (conditions.if_negative_reply && email.status === 'replied') {
      // Check if reply was negative (would need sentiment analysis)
      return true;
    }
    if (conditions.if_positive_reply && email.status === 'replied') {
      // Check if reply was positive
      return true;
    }
    return false;
  }

  /**
   * Send a follow-up email
   */
  private async sendFollowUpEmail(originalEmail: OutreachEmail, followUp: FollowUpSchedule): Promise<void> {
    try {
      // Get prospect data
      const { data: prospect } = await supabase
        .from('prospect_dynamic_scores')
        .select('*')
        .eq('prospect_id', originalEmail.prospect_id)
        .single();

      if (!prospect) return;

      // Generate follow-up email content
      const emailContent = await this.templateEngine.generatePersonalizedEmail(
        followUp.template_id,
        prospect,
        { isFollowUp: true, originalEmail }
      );

      // Send via Gmail API
      const gmailResult = await this.gmailAPI.sendEmail({
        to: originalEmail.prospect_email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        inReplyTo: originalEmail.gmail_message_id
      });

      // Create follow-up email record
      const { data: followUpEmail, error } = await supabase
        .from('outreach_emails')
        .insert([{
          campaign_id: originalEmail.campaign_id,
          prospect_id: originalEmail.prospect_id,
          prospect_email: originalEmail.prospect_email,
          prospect_name: originalEmail.prospect_name,
          company_name: originalEmail.company_name,
          template_id: followUp.template_id,
          subject: emailContent.subject,
          content: emailContent.html,
          status: 'sent',
          sent_at: new Date().toISOString(),
          gmail_message_id: gmailResult.messageId,
          thread_id: gmailResult.threadId,
          follow_up_sequence: followUp.sequence_number,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Track the follow-up
      await this.tracker.trackOutreach({
        email_id: followUpEmail.id,
        prospect_id: originalEmail.prospect_id,
        campaign_id: originalEmail.campaign_id,
        action: 'follow_up_sent',
        timestamp: new Date().toISOString(),
        metadata: {
          gmail_message_id: gmailResult.messageId,
          template_id: followUp.template_id,
          sequence_number: followUp.sequence_number
        }
      });

    } catch (error) {
      console.error(`Failed to send follow-up email:`, error);
    }
  }

  /**
   * Get campaign metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<OutreachMetrics> {
    const { data: emails } = await supabase
      .from('outreach_emails')
      .select('status')
      .eq('campaign_id', campaignId);

    if (!emails) {
      return {
        campaign_id: campaignId,
        total_sent: 0,
        total_delivered: 0,
        total_opened: 0,
        total_replied: 0,
        total_converted: 0,
        open_rate: 0,
        reply_rate: 0,
        conversion_rate: 0,
        bounce_rate: 0,
        unsubscribed_count: 0,
        last_updated: new Date().toISOString()
      };
    }

    const metrics = emails.reduce((acc, email) => {
      acc.total_sent++;
      if (['delivered', 'opened', 'replied'].includes(email.status)) acc.total_delivered++;
      if (['opened', 'replied'].includes(email.status)) acc.total_opened++;
      if (email.status === 'replied') acc.total_replied++;
      if (email.status === 'converted') acc.total_converted++;
      if (email.status === 'bounced') acc.bounce_rate++;
      if (email.status === 'unsubscribed') acc.unsubscribed_count++;
      return acc;
    }, {
      total_sent: 0,
      total_delivered: 0,
      total_opened: 0,
      total_replied: 0,
      total_converted: 0,
      bounce_rate: 0,
      unsubscribed_count: 0
    });

    return {
      campaign_id: campaignId,
      ...metrics,
      open_rate: metrics.total_sent > 0 ? metrics.total_opened / metrics.total_sent : 0,
      reply_rate: metrics.total_sent > 0 ? metrics.total_replied / metrics.total_sent : 0,
      conversion_rate: metrics.total_sent > 0 ? metrics.total_converted / metrics.total_sent : 0,
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Update email status based on Gmail webhook
   */
  async updateEmailStatus(gmailMessageId: string, status: string, metadata?: any): Promise<void> {
    const { data: email } = await supabase
      .from('outreach_emails')
      .select('*')
      .eq('gmail_message_id', gmailMessageId)
      .single();

    if (!email) return;

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'opened' && !email.opened_at) {
      updateData.opened_at = new Date().toISOString();
    }
    if (status === 'replied' && !email.replied_at) {
      updateData.replied_at = new Date().toISOString();
    }

    await supabase
      .from('outreach_emails')
      .update(updateData)
      .eq('id', email.id);

    // Track the status update
    const actionMap: Record<string, any> = {
      'delivered': 'email_delivered',
      'opened': 'email_opened',
      'replied': 'email_replied',
      'bounced': 'email_bounced',
      'unsubscribed': 'email_unsubscribed'
    };
    
    await this.tracker.trackOutreach({
      email_id: email.id,
      prospect_id: email.prospect_id,
      campaign_id: email.campaign_id,
      action: actionMap[status] || 'email_delivered',
      timestamp: new Date().toISOString(),
      metadata: { gmail_message_id: gmailMessageId, ...metadata }
    });
  }
}
