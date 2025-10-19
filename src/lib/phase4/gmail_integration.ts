import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface GmailEmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
  inReplyTo?: string;
  threadId?: string;
}

export interface GmailSendResult {
  messageId: string;
  threadId: string;
  success: boolean;
  error?: string;
}

export interface GmailWebhookData {
  messageId: string;
  threadId: string;
  status: 'delivered' | 'opened' | 'replied' | 'bounced';
  timestamp: string;
  metadata?: any;
}

export class GmailAPI {
  private oauth2Client: OAuth2Client;
  private gmail: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set credentials from environment
    this.oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      access_token: process.env.GOOGLE_ACCESS_TOKEN
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Send an email via Gmail API
   */
  async sendEmail(emailData: GmailEmailData): Promise<GmailSendResult> {
    try {
      // Create email message
      const message = this.createEmailMessage(emailData);
      
      // Send the email
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message
        }
      });

      return {
        messageId: response.data.id,
        threadId: response.data.threadId,
        success: true
      };

    } catch (error) {
      console.error('Gmail API error:', error);
      return {
        messageId: '',
        threadId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create email message in Gmail format
   */
  private createEmailMessage(emailData: GmailEmailData): string {
    const boundary = 'boundary_' + Math.random().toString(36).substr(2, 9);
    
    let message = '';
    message += `To: ${emailData.to}\r\n`;
    message += `Subject: ${emailData.subject}\r\n`;
    
    if (emailData.inReplyTo) {
      message += `In-Reply-To: ${emailData.inReplyTo}\r\n`;
    }
    
    message += `MIME-Version: 1.0\r\n`;
    message += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;

    // Add text version
    message += `--${boundary}\r\n`;
    message += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    message += `${emailData.text}\r\n\r\n`;

    // Add HTML version
    message += `--${boundary}\r\n`;
    message += `Content-Type: text/html; charset="UTF-8"\r\n\r\n`;
    message += `${emailData.html}\r\n\r\n`;

    message += `--${boundary}--\r\n`;

    // Encode in base64url format
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Get email thread by ID
   */
  async getEmailThread(threadId: string): Promise<any> {
    try {
      const response = await this.gmail.users.threads.get({
        userId: 'me',
        id: threadId
      });

      return response.data;
    } catch (error) {
      console.error('Error getting email thread:', error);
      throw error;
    }
  }

  /**
   * Get email message by ID
   */
  async getEmailMessage(messageId: string): Promise<any> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId
      });

      return response.data;
    } catch (error) {
      console.error('Error getting email message:', error);
      throw error;
    }
  }

  /**
   * Search for emails
   */
  async searchEmails(query: string, maxResults: number = 10): Promise<any[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults
      });

      if (!response.data.messages) return [];

      // Get full message details
      const messages = await Promise.all(
        response.data.messages.map(async (message: any) => {
          return await this.getEmailMessage(message.id);
        })
      );

      return messages;
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }

  /**
   * Get email headers
   */
  getEmailHeaders(message: any): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (message.payload?.headers) {
      message.payload.headers.forEach((header: any) => {
        headers[header.name.toLowerCase()] = header.value;
      });
    }

    return headers;
  }

  /**
   * Get email body (text or HTML)
   */
  getEmailBody(message: any, preferHtml: boolean = true): string {
    if (!message.payload) return '';

    // Try to get HTML body first if preferred
    if (preferHtml) {
      const htmlBody = this.extractBodyPart(message.payload, 'text/html');
      if (htmlBody) return htmlBody;
    }

    // Fall back to text body
    const textBody = this.extractBodyPart(message.payload, 'text/plain');
    if (textBody) return textBody;

    // If no body found, return empty string
    return '';
  }

  /**
   * Extract body part from email payload
   */
  private extractBodyPart(payload: any, mimeType: string): string | null {
    if (payload.mimeType === mimeType && payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString();
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        const body = this.extractBodyPart(part, mimeType);
        if (body) return body;
      }
    }

    return null;
  }

  /**
   * Check if email was opened (using tracking pixel)
   */
  async checkEmailOpened(messageId: string): Promise<boolean> {
    try {
      // This would typically involve checking a tracking pixel or webhook
      // For now, we'll simulate this based on email headers or other indicators
      const message = await this.getEmailMessage(messageId);
      const headers = this.getEmailHeaders(message);
      
      // Check for read receipts or other indicators
      return headers['x-read-receipt'] === 'true' || 
             headers['x-email-opened'] === 'true';
    } catch (error) {
      console.error('Error checking email opened status:', error);
      return false;
    }
  }

  /**
   * Check if email was replied to
   */
  async checkEmailReplied(threadId: string, originalMessageId: string): Promise<boolean> {
    try {
      const thread = await this.getEmailThread(threadId);
      
      if (!thread.messages || thread.messages.length <= 1) {
        return false;
      }

      // Check if there are messages after the original
      const originalIndex = thread.messages.findIndex((msg: any) => msg.id === originalMessageId);
      return originalIndex >= 0 && thread.messages.length > originalIndex + 1;
    } catch (error) {
      console.error('Error checking email reply status:', error);
      return false;
    }
  }

  /**
   * Set up Gmail push notifications (webhooks)
   */
  async setupPushNotifications(topicName: string): Promise<void> {
    try {
      await this.gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName: topicName,
          labelIds: ['INBOX', 'SENT']
        }
      });
    } catch (error) {
      console.error('Error setting up push notifications:', error);
      throw error;
    }
  }

  /**
   * Process Gmail webhook notification
   */
  async processWebhookNotification(notification: any): Promise<GmailWebhookData[]> {
    const results: GmailWebhookData[] = [];

    try {
      // Parse the notification
      const historyId = notification.historyId;
      
      // Get history to see what changed
      const history = await this.gmail.users.history.list({
        userId: 'me',
        startHistoryId: historyId
      });

      if (!history.data.history) return results;

      // Process each change
      for (const change of history.data.history) {
        if (change.messagesAdded) {
          for (const messageAdded of change.messagesAdded) {
            const message = await this.getEmailMessage(messageAdded.message.id);
            const headers = this.getEmailHeaders(message);

            results.push({
              messageId: message.id,
              threadId: message.threadId,
              status: 'delivered',
              timestamp: new Date().toISOString(),
              metadata: {
                headers,
                labels: message.labelIds
              }
            });
          }
        }
      }

    } catch (error) {
      console.error('Error processing webhook notification:', error);
    }

    return results;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<void> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      
      // Update environment variable if needed
      if (credentials.access_token) {
        process.env.GOOGLE_ACCESS_TOKEN = credentials.access_token;
      }
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  /**
   * Test Gmail API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.gmail.users.getProfile({ userId: 'me' });
      return true;
    } catch (error) {
      console.error('Gmail API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get Gmail API instance (for webhook processing)
   */
  getGmailAPI(): any {
    return this.gmail;
  }
}
