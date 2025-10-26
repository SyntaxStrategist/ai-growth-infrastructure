/**
 * Email Alert System for High-Urgency Leads
 * Sends email notifications to clients when urgent leads are detected
 */

import { supabase } from './supabase';
import { getAuthorizedGmail, buildHtmlEmail } from './gmail';

interface AlertLead {
  id: string;
  name: string;
  email: string;
  message: string;
  aiSummary?: string;
  intent?: string;
  urgency?: string;
  confidence_score?: number;
  clientId: string;
  timestamp: string;
}

interface ClientAlertSettings {
  alert_email: string | null;
  business_name: string;
}

/**
 * Send email alert for high-urgency lead
 */
export async function sendUrgentLeadAlert(lead: AlertLead): Promise<void> {
  try {
    console.log('[EmailAlert] Checking if alert should be sent for lead:', lead.id);
    
    // Check if lead is high urgency
    const isHighUrgency = lead.urgency === 'High' || lead.urgency === 'Élevée';
    const isHighConfidence = (lead.confidence_score || 0) >= 0.70;
    
    // Only send for high urgency and high confidence leads
    if (!isHighUrgency || !isHighConfidence) {
      console.log('[EmailAlert] Lead does not meet urgency/confidence threshold, skipping alert');
      return;
    }
    
    // Get client alert settings
    const client = await getClientAlertSettings(lead.clientId);
    
    if (!client || !client.alert_email) {
      console.log('[EmailAlert] No alert email configured for client:', lead.clientId);
      return;
    }
    
    console.log('[EmailAlert] Sending urgent lead alert to:', client.alert_email);
    
    // Send email alert
    await sendEmailAlert({
      to: client.alert_email,
      lead,
      businessName: client.business_name,
    });
    
    console.log('[EmailAlert] ✅ Alert sent successfully');
  } catch (error) {
    console.error('[EmailAlert] ❌ Failed to send alert:', error);
    // Don't throw - alert failures shouldn't break lead processing
  }
}

/**
 * Get client alert settings from database
 */
async function getClientAlertSettings(clientId: string): Promise<ClientAlertSettings | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('alert_email, business_name')
      .eq('client_id', clientId)
      .single();
    
    if (error || !data) {
      console.error('[EmailAlert] Failed to fetch client settings:', error);
      return null;
    }
    
    return {
      alert_email: data.alert_email,
      business_name: data.business_name,
    };
  } catch (error) {
    console.error('[EmailAlert] Error fetching client settings:', error);
    return null;
  }
}

/**
 * Send email alert using SendGrid
 */
async function sendEmailAlert(params: {
  to: string;
  lead: AlertLead;
  businessName: string;
}): Promise<void> {
  const { to, lead, businessName } = params;
  
  const subject = `🔥 URGENT LEAD: ${lead.name} - ${lead.intent || 'New Lead'}`;
  
  const urgencyEmoji = getUrgencyEmoji(lead.urgency);
  const confidencePercentage = Math.round((lead.confidence_score || 0) * 100);
  
  const body = `
Hi ${businessName},

🚨 URGENT LEAD ALERT

You have a high-priority lead that needs immediate attention.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Lead Information:
   Name: ${lead.name}
   Email: ${lead.email}
   
📝 Intent: ${lead.intent || 'Unknown'}
${urgencyEmoji} Urgency: ${lead.urgency || 'Unknown'}
⭐ Confidence: ${confidencePercentage}%

💬 Message:
"${lead.message}"

🤖 AI Summary:
${lead.aiSummary || 'No summary available'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 View Full Details:
https://www.aveniraisolutions.ca/client/dashboard

Best regards,
Avenir AI Solutions

---
This is an automated alert from your Avenir AI lead management system.
  `.trim();
  
  // Send email using your Gmail account
  try {
    const gmail = await getAuthorizedGmail();
    
    const message = {
      to,
      from: 'alerts@aveniraisolutions.ca',
      subject,
      text: body,
      html: `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${body.replace(/\n/g, '<br>')}</pre>`,
    };
    
    const raw = buildHtmlEmail({
      to,
      from: 'alerts@aveniraisolutions.ca',
      subject,
      name: businessName,
      aiSummary: `Urgent lead alert: ${lead.name}`,
      locale: 'en',
    });
    
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    
    console.log('[EmailAlert] ✅ Email sent successfully via Gmail');
  } catch (error) {
    console.error('[EmailAlert] ❌ Failed to send email:', error);
    throw error;
  }
}

/**
 * Get emoji for urgency level
 */
function getUrgencyEmoji(urgency?: string): string {
  if (urgency === 'High' || urgency === 'Élevée') return '🔴';
  if (urgency === 'Medium' || urgency === 'Moyenne') return '🟡';
  return '🟢';
}

