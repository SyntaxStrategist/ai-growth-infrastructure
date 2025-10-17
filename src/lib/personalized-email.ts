/**
 * Personalized Email Template Builder
 * 
 * Generates automated follow-up emails using client branding preferences
 */

import type { ClientRecord } from './supabase';

export type EmailPersonalization = {
  leadName: string;
  leadEmail: string;
  leadMessage: string;
  aiSummary: string;
  intent?: string;
  tone?: string;
  urgency?: string;
  confidence?: number;
  locale: string;
  client: ClientRecord;
};

/**
 * Get greeting based on email tone
 */
function getGreeting(tone: string, name: string, locale: string): string {
  const isFrench = locale === 'fr';
  
  switch (tone) {
    case 'Friendly':
      return isFrench 
        ? `Bonjour ${name} !` 
        : `Hi ${name}!`;
    
    case 'Formal':
      return isFrench 
        ? `Cher/Chère ${name},` 
        : `Dear ${name},`;
    
    case 'Energetic':
      return isFrench 
        ? `Salut ${name} ! 🚀` 
        : `Hey ${name}! 🚀`;
    
    case 'Professional':
    default:
      return isFrench 
        ? `Bonjour ${name},` 
        : `Hello ${name},`;
  }
}

/**
 * Get acknowledgment based on tone with industry context
 */
function getAcknowledgment(
  tone: string, 
  businessName: string, 
  industry: string | undefined, 
  service: string | undefined, 
  locale: string
): string {
  const isFrench = locale === 'fr';
  const hasContext = industry && service;
  
  let baseMessage = '';
  
  switch (tone) {
    case 'Friendly':
      baseMessage = isFrench 
        ? `Merci d'avoir contacté ${businessName}! Nous avons bien reçu votre message.`
        : `Thanks for reaching out to ${businessName}! We've received your message.`;
      break;
    
    case 'Formal':
      baseMessage = isFrench 
        ? `Nous vous remercions d'avoir pris contact avec ${businessName}. Votre message a été reçu avec attention.`
        : `Thank you for contacting ${businessName}. Your message has been received and noted.`;
      break;
    
    case 'Energetic':
      baseMessage = isFrench 
        ? `Super! Nous avons reçu votre message pour ${businessName} et notre équipe est déjà au travail! 💪`
        : `Great! We've got your message for ${businessName} and our team is already on it! 💪`;
      break;
    
    case 'Professional':
    default:
      baseMessage = isFrench 
        ? `Merci de nous avoir contactés chez ${businessName}. Nous avons bien reçu votre message.`
        : `Thank you for contacting ${businessName}. We have received your message.`;
      break;
  }
  
  // Add industry/service context if available
  if (hasContext) {
    const contextLine = isFrench
      ? ` En tant que spécialistes en ${industry} avec une expertise en ${service}, nous sommes ravis de vous aider.`
      : ` As specialists in ${industry} with expertise in ${service}, we're excited to help you.`;
    baseMessage += contextLine;
  }
  
  return baseMessage;
}

/**
 * Get AI analysis mention
 */
function getAIAnalysis(tone: string, locale: string): string {
  const isFrench = locale === 'fr';
  
  switch (tone) {
    case 'Friendly':
      return isFrench 
        ? `Notre IA a analysé votre demande pour mieux comprendre vos besoins.`
        : `Our AI has analyzed your request to better understand your needs.`;
    
    case 'Formal':
      return isFrench 
        ? `Notre système d'intelligence artificielle a procédé à une analyse approfondie de votre demande.`
        : `Our artificial intelligence system has conducted a thorough analysis of your inquiry.`;
    
    case 'Energetic':
      return isFrench 
        ? `Notre IA puissante a déjà décortiqué votre demande et identifié ce qui compte vraiment! 🎯`
        : `Our powerful AI has already dissected your request and identified what really matters! 🎯`;
    
    case 'Professional':
    default:
      return isFrench 
        ? `Notre intelligence artificielle a analysé votre demande afin de mieux répondre à vos besoins.`
        : `Our AI has analyzed your inquiry to better address your needs.`;
  }
}

/**
 * Get urgency-based reassurance (if high urgency detected)
 */
function getUrgencyReassurance(urgency: string | undefined, tone: string, locale: string): string {
  if (urgency?.toLowerCase() !== 'high' && urgency?.toLowerCase() !== 'élevée') {
    return '';
  }
  
  const isFrench = locale === 'fr';
  
  switch (tone) {
    case 'Friendly':
      return isFrench 
        ? `\n\nNous comprenons que c'est important pour vous, alors nous y accordons la priorité! ⚡`
        : `\n\nWe understand this is important to you, so we're prioritizing it! ⚡`;
    
    case 'Formal':
      return isFrench 
        ? `\n\nNous avons identifié le caractère urgent de votre demande et y accordons une attention prioritaire.`
        : `\n\nWe have identified the urgent nature of your request and are giving it priority attention.`;
    
    case 'Energetic':
      return isFrench 
        ? `\n\nOn a capté l'urgence — notre équipe passe à l'action immédiatement! 🔥`
        : `\n\nWe caught the urgency — our team is jumping on this right away! 🔥`;
    
    case 'Professional':
    default:
      return isFrench 
        ? `\n\nNous avons noté le caractère urgent de votre demande et y accordons une attention immédiate.`
        : `\n\nWe have noted the urgent nature of your request and are giving it immediate attention.`;
  }
}

/**
 * Get follow-up timing text
 */
function getFollowupTiming(speed: string, locale: string): string {
  const isFrench = locale === 'fr';
  
  switch (speed) {
    case 'Instant':
      return isFrench 
        ? `Un membre de notre équipe vous contactera dans les plus brefs délais.`
        : `A member of our team will contact you shortly.`;
    
    case 'Within 1 hour':
      return isFrench 
        ? `Nous vous recontacterons dans l'heure qui suit.`
        : `We will get back to you within the hour.`;
    
    case 'Same day':
      return isFrench 
        ? `Nous vous recontacterons d'ici la fin de la journée.`
        : `We will get back to you by the end of the day.`;
    
    default:
      return isFrench 
        ? `Nous vous recontacterons très prochainement.`
        : `We will get back to you very soon.`;
  }
}

/**
 * Get closing based on tone
 */
function getClosing(tone: string, businessName: string, tagline: string, locale: string): string {
  const isFrench = locale === 'fr';
  
  let closing = '';
  
  switch (tone) {
    case 'Friendly':
      closing = isFrench ? `À très bientôt!` : `Talk soon!`;
      break;
    
    case 'Formal':
      closing = isFrench ? `Cordialement,` : `Sincerely,`;
      break;
    
    case 'Energetic':
      closing = isFrench ? `Hâte de collaborer avec vous! 🚀` : `Can't wait to work with you! 🚀`;
      break;
    
    case 'Professional':
    default:
      closing = isFrench ? `Cordialement,` : `Best regards,`;
      break;
  }
  
  return `\n\n${closing}\n${businessName}\n${tagline}`;
}

/**
 * Build personalized email content
 */
export function buildPersonalizedEmail(params: EmailPersonalization): string {
  const {
    leadName,
    aiSummary,
    urgency,
    locale,
    client,
  } = params;
  
  const tone = client.email_tone || 'Friendly';
  const speed = client.followup_speed || 'Instant';
  const businessName = client.business_name;
  const tagline = client.custom_tagline || '';
  const industry = client.industry_category;
  const service = client.primary_service;
  const bookingLink = client.booking_link;
  
  const isFrench = locale === 'fr';
  
  // Build email body
  const greeting = getGreeting(tone, leadName, locale);
  const acknowledgment = getAcknowledgment(tone, businessName, industry, service, locale);
  const aiAnalysis = getAIAnalysis(tone, locale);
  const urgencyNote = getUrgencyReassurance(urgency, tone, locale);
  const followupTiming = getFollowupTiming(speed, locale);
  
  // Add booking CTA if link is available
  let bookingCTA = '';
  if (bookingLink) {
    bookingCTA = isFrench
      ? `\n\nVous pouvez également réserver un créneau directement: ${bookingLink}`
      : `\n\nYou can also book a time directly: ${bookingLink}`;
  }
  
  const closing = getClosing(tone, businessName, tagline, locale);
  
  return `${greeting}

${acknowledgment}

${aiAnalysis}${urgencyNote}

${followupTiming}${bookingCTA}

${closing}`;
}

/**
 * Build HTML email for personalized response
 */
export function buildPersonalizedHtmlEmail(params: EmailPersonalization): string {
  const {
    leadEmail,
    client,
    locale,
  } = params;
  
  const emailBody = buildPersonalizedEmail(params);
  const isFrench = locale === 'fr';
  const subject = isFrench 
    ? `Merci d'avoir contacté ${client.business_name}`
    : `Thanks for contacting ${client.business_name}`;
  
  // Build HTML with client branding
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .tagline { font-style: italic; color: #666; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">${client.business_name}</h1>
    </div>
    <div class="content">
      <p style="white-space: pre-line; margin: 0;">${emailBody.replace(/\n/g, '<br>')}</p>
      <div class="tagline">
        <em>${client.custom_tagline}</em>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated response powered by AI</p>
      <p>${client.email}</p>
    </div>
  </div>
</body>
</html>`;
  
  // Build email message for Gmail API
  const message = [
    `From: ${client.email}`,
    `To: ${leadEmail}`,
    `Subject: ${subject}`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    html,
  ].join('\r\n');
  
  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

