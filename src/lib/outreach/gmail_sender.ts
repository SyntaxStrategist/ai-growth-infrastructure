// ============================================
// Gmail Outreach Sender
// ============================================
// Sends outreach emails via Gmail API

import { getAuthorizedGmail, toBase64Url } from '../gmail';

export interface OutreachEmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  fromName?: string;
  replyTo?: string;
}

/**
 * Send outreach email via Gmail API
 * Sends both HTML and plain text versions
 */
export async function sendOutreachEmail(options: OutreachEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log('[GmailSender] ============================================');
    console.log('[GmailSender] Preparing outreach email');
    console.log('[GmailSender] To:', options.to);
    console.log('[GmailSender] Subject:', options.subject);
    console.log('[GmailSender] ============================================');

    // Get authorized Gmail client
    const gmail = await getAuthorizedGmail();
    
    // Get sender email from environment
    const senderEmail = process.env.GMAIL_FROM_ADDRESS || 'contact@aveniraisolutions.ca';
    const fromName = options.fromName || 'Avenir AI Solutions';
    const replyTo = options.replyTo || process.env.GMAIL_FROM_ADDRESS || 'contact@aveniraisolutions.ca';

    console.log('[GmailSender] From:', `${fromName} <${senderEmail}>`);
    console.log('[GmailSender] Reply-To:', replyTo);

    // Build multipart email (HTML + plain text)
    const boundary = '----=_Part_' + Date.now();
    
    // Encode subject for UTF-8
    const encodedSubject = `=?UTF-8?B?${Buffer.from(options.subject, 'utf8').toString('base64')}?=`;
    
    const headers = [
      `From: ${fromName} <${senderEmail}>`,
      `To: ${options.to}`,
      `Reply-To: ${replyTo}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      'X-Gmail-Source: avenir-prospect-intelligence',
    ].join('\r\n');

    // Plain text part
    const textPart = [
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      options.textBody,
      '',
    ].join('\r\n');

    // HTML part
    const htmlPart = [
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      options.htmlBody,
      '',
      `--${boundary}--`,
    ].join('\r\n');

    const raw = `${headers}\r\n\r\n${textPart}${htmlPart}`;
    const encodedMessage = toBase64Url(raw);

    console.log('[GmailSender] 📧 Sending email via Gmail API...');

    // Send via Gmail API
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('[GmailSender] ✅ Email sent successfully');
    console.log('[GmailSender] Message ID:', response.data.id);
    console.log('[GmailSender] ============================================');

    return {
      success: true,
      messageId: response.data.id || undefined,
    };

  } catch (error) {
    console.error('[GmailSender] ❌ Failed to send email:', error);
    console.error('[GmailSender] Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.log('[GmailSender] ============================================');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Test if Gmail is configured and authorized
 */
export async function isGmailConfigured(): Promise<boolean> {
  try {
    await getAuthorizedGmail();
    return true;
  } catch {
    return false;
  }
}

