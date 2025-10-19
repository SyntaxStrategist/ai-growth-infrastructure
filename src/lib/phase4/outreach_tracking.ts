import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface OutreachTrackingEvent {
  id: string;
  email_id: string;
  prospect_id: string;
  campaign_id: string;
  action: 'email_sent' | 'email_delivered' | 'email_opened' | 'email_replied' | 'email_bounced' | 'email_unsubscribed' | 'follow_up_sent' | 'conversion' | 'meeting_scheduled';
  timestamp: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface OutreachAnalytics {
  campaign_id: string;
  total_emails_sent: number;
  total_emails_delivered: number;
  total_emails_opened: number;
  total_emails_replied: number;
  total_conversions: number;
  open_rate: number;
  reply_rate: number;
  conversion_rate: number;
  average_time_to_open: number;
  average_time_to_reply: number;
  best_performing_templates: Array<{
    template_id: string;
    template_name: string;
    open_rate: number;
    reply_rate: number;
    conversion_rate: number;
  }>;
  best_performing_times: Array<{
    day_of_week: string;
    hour: number;
    open_rate: number;
    reply_rate: number;
  }>;
  last_updated: string;
}

export class OutreachTracker {
  /**
   * Track an outreach event
   */
  async trackOutreach(event: Omit<OutreachTrackingEvent, 'id' | 'created_at'>): Promise<OutreachTrackingEvent> {
    const { data, error } = await supabase
      .from('outreach_tracking')
      .insert([{
        email_id: event.email_id,
        prospect_id: event.prospect_id,
        campaign_id: event.campaign_id,
        action: event.action,
        timestamp: event.timestamp || new Date().toISOString(),
        metadata: event.metadata || {},
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get tracking events for a campaign
   */
  async getCampaignEvents(campaignId: string, limit: number = 100): Promise<OutreachTrackingEvent[]> {
    const { data, error } = await supabase
      .from('outreach_tracking')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get tracking events for a specific email
   */
  async getEmailEvents(emailId: string): Promise<OutreachTrackingEvent[]> {
    const { data, error } = await supabase
      .from('outreach_tracking')
      .select('*')
      .eq('email_id', emailId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get comprehensive analytics for a campaign
   */
  async getCampaignAnalytics(campaignId: string): Promise<OutreachAnalytics> {
    // Get all events for the campaign
    const events = await this.getCampaignEvents(campaignId, 1000);

    // Calculate basic metrics
    const totalEmailsSent = events.filter(e => e.action === 'email_sent').length;
    const totalEmailsDelivered = events.filter(e => e.action === 'email_delivered').length;
    const totalEmailsOpened = events.filter(e => e.action === 'email_opened').length;
    const totalEmailsReplied = events.filter(e => e.action === 'email_replied').length;
    const totalConversions = events.filter(e => e.action === 'conversion').length;

    // Calculate rates
    const openRate = totalEmailsSent > 0 ? totalEmailsOpened / totalEmailsSent : 0;
    const replyRate = totalEmailsSent > 0 ? totalEmailsReplied / totalEmailsSent : 0;
    const conversionRate = totalEmailsSent > 0 ? totalConversions / totalEmailsSent : 0;

    // Calculate timing metrics
    const openTimes = this.calculateAverageTimeToEvent(events, 'email_sent', 'email_opened');
    const replyTimes = this.calculateAverageTimeToEvent(events, 'email_sent', 'email_replied');

    // Get template performance
    const templatePerformance = await this.getTemplatePerformance(campaignId);

    // Get time performance
    const timePerformance = await this.getTimePerformance(campaignId);

    return {
      campaign_id: campaignId,
      total_emails_sent: totalEmailsSent,
      total_emails_delivered: totalEmailsDelivered,
      total_emails_opened: totalEmailsOpened,
      total_emails_replied: totalEmailsReplied,
      total_conversions: totalConversions,
      open_rate: openRate,
      reply_rate: replyRate,
      conversion_rate: conversionRate,
      average_time_to_open: openTimes,
      average_time_to_reply: replyTimes,
      best_performing_templates: templatePerformance,
      best_performing_times: timePerformance,
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Calculate average time between two events
   */
  private calculateAverageTimeToEvent(
    events: OutreachTrackingEvent[],
    startAction: string,
    endAction: string
  ): number {
    const emailEvents = new Map<string, { sent?: Date; target?: Date }>();

    // Group events by email_id
    events.forEach(event => {
      if (!emailEvents.has(event.email_id)) {
        emailEvents.set(event.email_id, {});
      }

      const emailEvent = emailEvents.get(event.email_id)!;
      const timestamp = new Date(event.timestamp);

      if (event.action === startAction) {
        emailEvent.sent = timestamp;
      } else if (event.action === endAction) {
        emailEvent.target = timestamp;
      }
    });

    // Calculate time differences
    const timeDifferences: number[] = [];
    emailEvents.forEach(({ sent, target }) => {
      if (sent && target) {
        const diffMs = target.getTime() - sent.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        timeDifferences.push(diffHours);
      }
    });

    // Return average time in hours
    return timeDifferences.length > 0 
      ? timeDifferences.reduce((sum, time) => sum + time, 0) / timeDifferences.length
      : 0;
  }

  /**
   * Get template performance metrics
   */
  private async getTemplatePerformance(campaignId: string): Promise<Array<{
    template_id: string;
    template_name: string;
    open_rate: number;
    reply_rate: number;
    conversion_rate: number;
  }>> {
    const { data, error } = await supabase
      .from('outreach_emails')
      .select(`
        template_id,
        status,
        email_templates!inner(name)
      `)
      .eq('campaign_id', campaignId);

    if (error || !data) return [];

    // Group by template
    const templateStats = new Map<string, {
      template_name: string;
      total: number;
      opened: number;
      replied: number;
      converted: number;
    }>();

    data.forEach(email => {
      const templateId = email.template_id;
      const templateName = (email.email_templates as any)?.name || 'Unknown';

      if (!templateStats.has(templateId)) {
        templateStats.set(templateId, {
          template_name: templateName,
          total: 0,
          opened: 0,
          replied: 0,
          converted: 0
        });
      }

      const stats = templateStats.get(templateId)!;
      stats.total++;

      if (['opened', 'replied'].includes(email.status)) stats.opened++;
      if (email.status === 'replied') stats.replied++;
      if (email.status === 'converted') stats.converted++;
    });

    // Calculate rates and return
    return Array.from(templateStats.entries()).map(([templateId, stats]) => ({
      template_id: templateId,
      template_name: stats.template_name,
      open_rate: stats.total > 0 ? stats.opened / stats.total : 0,
      reply_rate: stats.total > 0 ? stats.replied / stats.total : 0,
      conversion_rate: stats.total > 0 ? stats.converted / stats.total : 0
    }));
  }

  /**
   * Get time-based performance metrics
   */
  private async getTimePerformance(campaignId: string): Promise<Array<{
    day_of_week: string;
    hour: number;
    open_rate: number;
    reply_rate: number;
  }>> {
    const { data, error } = await supabase
      .from('outreach_emails')
      .select('sent_at, status')
      .eq('campaign_id', campaignId)
      .not('sent_at', 'is', null);

    if (error || !data) return [];

    // Group by day of week and hour
    const timeStats = new Map<string, {
      total: number;
      opened: number;
      replied: number;
    }>();

    data.forEach(email => {
      const sentAt = new Date(email.sent_at);
      const dayOfWeek = sentAt.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = sentAt.getHours();
      const key = `${dayOfWeek}_${hour}`;

      if (!timeStats.has(key)) {
        timeStats.set(key, { total: 0, opened: 0, replied: 0 });
      }

      const stats = timeStats.get(key)!;
      stats.total++;

      if (['opened', 'replied'].includes(email.status)) stats.opened++;
      if (email.status === 'replied') stats.replied++;
    });

    // Calculate rates and return
    return Array.from(timeStats.entries()).map(([key, stats]) => {
      const [dayOfWeek, hour] = key.split('_');
      return {
        day_of_week: dayOfWeek,
        hour: parseInt(hour),
        open_rate: stats.total > 0 ? stats.opened / stats.total : 0,
        reply_rate: stats.total > 0 ? stats.replied / stats.total : 0
      };
    });
  }

  /**
   * Get prospect engagement timeline
   */
  async getProspectEngagementTimeline(prospectId: string): Promise<OutreachTrackingEvent[]> {
    const { data, error } = await supabase
      .from('outreach_tracking')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get conversion funnel analysis
   */
  async getConversionFunnel(campaignId: string): Promise<{
    sent: number;
    delivered: number;
    opened: number;
    replied: number;
    converted: number;
    funnel_rates: {
      delivery_rate: number;
      open_rate: number;
      reply_rate: number;
      conversion_rate: number;
    };
  }> {
    const events = await this.getCampaignEvents(campaignId, 1000);

    const sent = events.filter(e => e.action === 'email_sent').length;
    const delivered = events.filter(e => e.action === 'email_delivered').length;
    const opened = events.filter(e => e.action === 'email_opened').length;
    const replied = events.filter(e => e.action === 'email_replied').length;
    const converted = events.filter(e => e.action === 'conversion').length;

    return {
      sent,
      delivered,
      opened,
      replied,
      converted,
      funnel_rates: {
        delivery_rate: sent > 0 ? delivered / sent : 0,
        open_rate: delivered > 0 ? opened / delivered : 0,
        reply_rate: opened > 0 ? replied / opened : 0,
        conversion_rate: replied > 0 ? converted / replied : 0
      }
    };
  }

  /**
   * Track conversion event
   */
  async trackConversion(emailId: string, prospectId: string, campaignId: string, metadata?: any): Promise<void> {
    await this.trackOutreach({
      email_id: emailId,
      prospect_id: prospectId,
      campaign_id: campaignId,
      action: 'conversion',
      timestamp: new Date().toISOString(),
      metadata: metadata || {}
    });

    // Update email status to converted
    await supabase
      .from('outreach_emails')
      .update({ 
        status: 'converted',
        updated_at: new Date().toISOString()
      })
      .eq('id', emailId);
  }

  /**
   * Get real-time campaign status
   */
  async getCampaignStatus(campaignId: string): Promise<{
    active: boolean;
    total_emails: number;
    pending_follow_ups: number;
    recent_activity: OutreachTrackingEvent[];
  }> {
    const [events, emails] = await Promise.all([
      this.getCampaignEvents(campaignId, 50),
      supabase
        .from('outreach_emails')
        .select('id, status, follow_up_sequence')
        .eq('campaign_id', campaignId)
    ]);

    const totalEmails = emails.data?.length || 0;
    const pendingFollowUps = emails.data?.filter(e => 
      e.status === 'sent' && e.follow_up_sequence === 1
    ).length || 0;

    return {
      active: totalEmails > 0,
      total_emails: totalEmails,
      pending_follow_ups: pendingFollowUps,
      recent_activity: events.slice(0, 10)
    };
  }
}
