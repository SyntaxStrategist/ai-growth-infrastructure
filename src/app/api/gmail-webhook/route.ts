import { NextRequest, NextResponse } from 'next/server';
import { OutreachEngine } from '@/lib/phase4/outreach_engine';
import { GmailAPI } from '@/lib/phase4/gmail_integration';

import { handleApiError } from '@/lib/error-handler';
const outreachEngine = new OutreachEngine();
const gmailAPI = new GmailAPI();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify the webhook is from Gmail
    if (!verifyGmailWebhook(request, body)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid webhook signature' 
      }, { status: 401 });
    }

    // Process the webhook notification
    const notifications = await gmailAPI.processWebhookNotification(body);
    
    // Update email statuses based on notifications
    for (const notification of notifications) {
      await outreachEngine.updateEmailStatus(
        notification.messageId,
        notification.status,
        notification.metadata
      );
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${notifications.length} notifications`,
      data: notifications
    });

  } catch (error) {
    return handleApiError(error, 'API');
  }
}

export async function GET(request: NextRequest) {
  try {
    // Gmail webhook verification
    const { searchParams } = new URL(request.url);
    const challenge = searchParams.get('challenge');
    
    if (challenge) {
      return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      message: 'Gmail webhook endpoint is active'
    });

  } catch (error) {
    return handleApiError(error, 'API');
  }
}

/**
 * Verify Gmail webhook signature
 */
function verifyGmailWebhook(request: NextRequest, body: any): boolean {
  // In a real implementation, you would verify the webhook signature
  // using Gmail's webhook verification mechanism
  // For now, we'll do basic validation
  
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.GMAIL_WEBHOOK_TOKEN;
  
  if (!expectedToken) {
    console.warn('GMAIL_WEBHOOK_TOKEN not configured');
    return true; // Allow in development
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  return token === expectedToken;
}

/**
 * Process Gmail push notification
 */
async function processGmailNotification(notification: any): Promise<void> {
  try {
    // Extract history ID from notification
    const historyId = notification.historyId;
    
    if (!historyId) {
      console.warn('No history ID in Gmail notification');
      return;
    }

    // Get the Gmail history to see what changed
    const gmail = gmailAPI.getGmailAPI();
    const history = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: historyId
    });

    if (!history.data.history) {
      console.log('No history changes found');
      return;
    }

    // Process each change
    for (const change of history.data.history) {
      await processHistoryChange(change);
    }

  } catch (error) {
    console.error('Error processing Gmail notification:', error);
  }
}

/**
 * Process a single history change
 */
async function processHistoryChange(change: any): Promise<void> {
  try {
    // Handle new messages
    if (change.messagesAdded) {
      for (const messageAdded of change.messagesAdded) {
        await processNewMessage(messageAdded.message);
      }
    }

    // Handle label changes (for tracking opens, etc.)
    if (change.labelsAdded) {
      for (const labelAdded of change.labelsAdded) {
        await processLabelAdded(labelAdded);
      }
    }

    // Handle label removals
    if (change.labelsRemoved) {
      for (const labelRemoved of change.labelsRemoved) {
        await processLabelRemoved(labelRemoved);
      }
    }

  } catch (error) {
    console.error('Error processing history change:', error);
  }
}

/**
 * Process a new message
 */
async function processNewMessage(message: any): Promise<void> {
  try {
    const messageId = message.id;
    const threadId = message.threadId;
    
    // Get full message details
    const fullMessage = await gmailAPI.getEmailMessage(messageId);
    const headers = gmailAPI.getEmailHeaders(fullMessage);
    
    // Check if this is a reply to one of our outreach emails
    const inReplyTo = headers['in-reply-to'];
    if (inReplyTo) {
      // This is a reply - update the original email status
      await outreachEngine.updateEmailStatus(inReplyTo, 'replied', {
        reply_message_id: messageId,
        reply_thread_id: threadId,
        reply_timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error processing new message:', error);
  }
}

/**
 * Process label added (e.g., email opened)
 */
async function processLabelAdded(labelAdded: any): Promise<void> {
  try {
    const messageId = labelAdded.message.id;
    const labels = labelAdded.labelIds;
    
    // Check if email was marked as read (opened)
    if (labels.includes('UNREAD') === false) {
      await outreachEngine.updateEmailStatus(messageId, 'opened', {
        opened_timestamp: new Date().toISOString(),
        labels: labels
      });
    }

  } catch (error) {
    console.error('Error processing label added:', error);
  }
}

/**
 * Process label removed
 */
async function processLabelRemoved(labelRemoved: any): Promise<void> {
  try {
    const messageId = labelRemoved.message.id;
    const labels = labelRemoved.labelIds;
    
    // Handle any specific label removals if needed
    console.log(`Labels removed from message ${messageId}:`, labels);

  } catch (error) {
    console.error('Error processing label removed:', error);
  }
}
