// ============================================
// Outreach Email Sender
// ============================================

import { ProspectCandidate, OutreachTemplate, OutreachLog } from '../types';

/**
 * Send outreach email to a prospect
 * In development mode, logs the email instead of sending
 */
export async function sendOutreachEmail(
  prospect: ProspectCandidate,
  template: OutreachTemplate
): Promise<OutreachLog> {
  console.log('[OutreachSender] ============================================');
  console.log('[OutreachSender] Preparing to send email to:', prospect.business_name);
  console.log('[OutreachSender] Recipient:', prospect.contact_email || 'Not specified');
  console.log('[OutreachSender] Language:', template.language);
  console.log('[OutreachSender] Mode:', process.env.NODE_ENV === 'development' ? 'Simulated' : 'Live');

  const sentAt = new Date();

  // Development mode: Log email preview instead of sending
  if (process.env.NODE_ENV === 'development') {
    console.log('[OutreachSender] 🧪 DEVELOPMENT MODE - Email Preview:');
    console.log('[OutreachSender] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[OutreachSender] To:', prospect.contact_email || 'unknown@example.com');
    console.log('[OutreachSender] From: michael@aveniraisolutions.ca');
    console.log('[OutreachSender] Subject:', template.subject);
    console.log('[OutreachSender] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[OutreachSender]');
    console.log(template.body);
    console.log('[OutreachSender]');
    console.log('[OutreachSender] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[OutreachSender] ✅ Email preview logged (not sent)');

    return {
      prospect_id: prospect.id!,
      subject: template.subject,
      email_body: template.body,
      sent_at: sentAt,
      status: 'sent',
      metadata: {
        simulated: true,
        development_mode: true,
        recipient: prospect.contact_email || 'unknown'
      }
    };
  }

  // Production mode: Actually send email
  try {
    // Check if Gmail API credentials are available
    const hasGmailCredentials = process.env.GOOGLE_CREDENTIALS_JSON;

    if (!hasGmailCredentials) {
      console.log('[OutreachSender] ⚠️  Gmail credentials not configured');
      console.log('[OutreachSender] Falling back to preview mode');
      return simulateSend(prospect, template, sentAt);
    }

    // TODO: Integrate with Gmail API or SMTP service
    // For now, log a warning and simulate
    console.log('[OutreachSender] ⚠️  Live sending not yet implemented');
    console.log('[OutreachSender] Falling back to preview mode');
    
    return simulateSend(prospect, template, sentAt);

  } catch (error) {
    console.error('[OutreachSender] ❌ Send failed:', error);
    return {
      prospect_id: prospect.id!,
      subject: template.subject,
      email_body: template.body,
      sent_at: sentAt,
      status: 'bounced',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Simulate sending for testing
 */
function simulateSend(
  prospect: ProspectCandidate,
  template: OutreachTemplate,
  sentAt: Date
): OutreachLog {
  console.log('[OutreachSender] 📧 Simulating email send...');
  console.log('[OutreachSender] To:', prospect.contact_email);
  console.log('[OutreachSender] Subject:', template.subject);
  console.log('[OutreachSender] ✅ Simulated send complete');

  return {
    prospect_id: prospect.id!,
    subject: template.subject,
    email_body: template.body,
    sent_at: sentAt,
    status: 'sent',
    metadata: {
      simulated: true,
      recipient: prospect.contact_email || 'unknown',
      language: template.language
    }
  };
}

/**
 * Batch send emails to multiple prospects
 */
export async function batchSendEmails(
  prospects: ProspectCandidate[],
  templates: Map<string, OutreachTemplate>
): Promise<Map<string, OutreachLog>> {
  console.log('[OutreachSender] ============================================');
  console.log('[OutreachSender] Batch sending emails to', prospects.length, 'prospects');

  const logs = new Map<string, OutreachLog>();

  for (const prospect of prospects) {
    if (!prospect.id || !prospect.contact_email) {
      console.log('[OutreachSender] ⚠️  Skipping', prospect.business_name, '- no email');
      continue;
    }

    const template = templates.get(prospect.id);
    if (!template) {
      console.log('[OutreachSender] ⚠️  Skipping', prospect.business_name, '- no template');
      continue;
    }

    try {
      const log = await sendOutreachEmail(prospect, template);
      logs.set(prospect.id, log);

      // Small delay between sends to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('[OutreachSender] ❌ Failed to send to:', prospect.business_name, error);
    }
  }

  console.log('[OutreachSender] ✅ Batch send complete:', logs.size, 'emails processed');
  return logs;
}

/**
 * Schedule follow-up email for prospects who haven't responded
 */
export async function scheduleFollowUp(
  prospect: ProspectCandidate,
  originalOutreach: OutreachLog,
  daysAfter: number
): Promise<void> {
  console.log('[OutreachSender] 📅 Scheduling follow-up for:', prospect.business_name);
  console.log('[OutreachSender] Days after original:', daysAfter);

  // TODO: Implement follow-up scheduling system
  // This could use a job queue or cron-based system

  console.log('[OutreachSender] ⚠️  Follow-up scheduling not yet implemented');
}

/**
 * Mark outreach as opened (webhook from email tracking)
 */
export async function markEmailOpened(
  outreachId: string,
  openedAt: Date
): Promise<void> {
  console.log('[OutreachSender] 👁️  Email opened:', outreachId);
  console.log('[OutreachSender] Opened at:', openedAt.toISOString());

  // TODO: Update outreach log in database
  // This would be called by a webhook when email tracking pixels fire
}

/**
 * Record email reply
 */
export async function recordEmailReply(
  outreachId: string,
  replyContent: string,
  repliedAt: Date
): Promise<void> {
  console.log('[OutreachSender] 💬 Email reply received:', outreachId);
  console.log('[OutreachSender] Replied at:', repliedAt.toISOString());
  console.log('[OutreachSender] Reply preview:', replyContent.substring(0, 100) + '...');

  // TODO: Update outreach log and trigger learning loop
  // This would be called when monitoring the inbox for replies
}

