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
 * Get header gradient based on tone
 */
function getHeaderGradient(tone: string): string {
  switch (tone) {
    case 'Professional':
      return 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)';
    case 'Friendly':
      return 'linear-gradient(135deg, #059669 0%, #047857 100%)';
    case 'Formal':
      return '#1f2937';
    case 'Energetic':
      return 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)';
    default:
      return 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)';
  }
}

/**
 * Get primary color based on tone
 */
function getPrimaryColor(tone: string): string {
  switch (tone) {
    case 'Professional':
      return '#1e3a8a';
    case 'Friendly':
      return '#059669';
    case 'Formal':
      return '#1f2937';
    case 'Energetic':
      return '#ea580c';
    default:
      return '#1e3a8a';
  }
}

/**
 * Get expertise box gradient based on tone
 */
function getExpertiseGradient(tone: string): string {
  switch (tone) {
    case 'Professional':
      return 'linear-gradient(135deg, #eff6ff, #dbeafe)';
    case 'Friendly':
      return 'linear-gradient(135deg, #d1fae5, #a7f3d0)';
    case 'Formal':
      return '#f9fafb';
    case 'Energetic':
      return 'linear-gradient(135deg, #fed7aa, #fdba74)';
    default:
      return 'linear-gradient(135deg, #eff6ff, #dbeafe)';
  }
}

/**
 * Get expertise text color based on tone
 */
function getExpertiseColor(tone: string): string {
  switch (tone) {
    case 'Professional':
      return '#1e40af';
    case 'Friendly':
      return '#065f46';
    case 'Formal':
      return '#4b5563';
    case 'Energetic':
      return '#7c2d12';
    default:
      return '#1e40af';
  }
}

/**
 * Build HTML email for personalized response with premium design
 */
export function buildPersonalizedHtmlEmail(params: EmailPersonalization): string {
  const {
    leadName,
    leadEmail,
    urgency,
    client,
    locale,
  } = params;
  
  const tone = client.email_tone || 'Professional';
  const speed = client.followup_speed || 'Instant';
  const businessName = client.business_name;
  const tagline = client.custom_tagline || '';
  const industry = client.industry_category;
  const service = client.primary_service;
  const bookingLink = client.booking_link;
  const isFrench = locale === 'fr';
  
  // Get tone-specific styling
  const headerGradient = getHeaderGradient(tone);
  const primaryColor = getPrimaryColor(tone);
  const expertiseGradient = getExpertiseGradient(tone);
  const expertiseColor = getExpertiseColor(tone);
  
  // Content blocks
  const greeting = getGreeting(tone, leadName, locale);
  const acknowledgment = getAcknowledgment(tone, businessName, industry, service, locale);
  const aiAnalysis = getAIAnalysis(tone, locale);
  const urgencyNote = getUrgencyReassurance(urgency, tone, locale);
  const followupTiming = getFollowupTiming(speed, locale);
  const closing = getClosing(tone, businessName, tagline, locale);
  
  // Subject line
  const subject = isFrench 
    ? `Merci d'avoir contacté ${businessName}`
    : `Thanks for contacting ${businessName}`;
  
  // Expertise box content
  const expertiseLabel = isFrench ? 'Notre expertise :' : 'Our Expertise:';
  const expertiseText = industry && service
    ? (isFrench 
      ? `Spécialistes en ${industry} avec expertise en ${service}.`
      : `${industry} specialists with expertise in ${service}.`)
    : (isFrench ? 'Experts en construction et rénovation.' : 'Construction and renovation experts.');
  
  // Urgency indicator (only if high urgency)
  const isHighUrgency = urgency?.toLowerCase() === 'high' || urgency?.toLowerCase() === 'élevée';
  const urgencyBox = isHighUrgency ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 16px 0;">
      <tr>
        <td style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px;">
          <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 500;">
            ⚡ <strong>${isFrench ? 'Priorité :' : 'Priority:'}</strong> ${isFrench 
              ? 'Nous avons noté le caractère urgent de votre demande.'
              : "We've noted the urgent nature of your request."}
          </p>
        </td>
      </tr>
    </table>` : '';
  
  // Booking CTA (only if booking link exists)
  const bookingCTA = bookingLink ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px 0;">
      <tr>
        <td align="center" style="padding: 18px; background: #f9fafb; border-radius: 8px;">
          <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280;">
            ${isFrench ? 'Ou réservez un créneau :' : 'Or schedule a time:'}
          </p>
          <a href="${bookingLink}" style="display: inline-block; padding: 11px 24px; background: ${headerGradient}; color: white; text-decoration: none; border-radius: 7px; font-weight: 600; font-size: 13px; box-shadow: 0 4px 10px rgba(30, 58, 138, 0.3);">
            📅 ${isFrench ? 'Réserver un appel' : 'Book a Call'}
          </a>
        </td>
      </tr>
    </table>` : '';
  
  // Build premium HTML template
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff;">
    <tr>
      <td style="padding: 0;">
        <!-- Header with gradient -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: ${headerGradient}; padding: 36px 28px; text-align: center; ${tone === 'Formal' ? 'border-bottom: 3px solid #d4af37;' : ''}">
              <h1 style="margin: 0; font-size: 24px; font-weight: ${tone === 'Formal' ? '300' : '700'}; color: #ffffff; letter-spacing: ${tone === 'Formal' ? '2px' : '-0.5px'}; ${tone === 'Formal' ? 'text-transform: uppercase;' : ''}">
                ${businessName}${tone === 'Energetic' ? ' 🚀' : ''}
              </h1>
              <p style="margin: 8px 0 0 0; color: ${tone === 'Formal' ? '#d4af37' : 'rgba(255,255,255,0.85)'}; font-size: ${tone === 'Formal' ? '11px' : '12px'}; font-weight: ${tone === 'Formal' ? '500' : '400'}; ${tone === 'Formal' ? 'letter-spacing: 1.5px; text-transform: uppercase;' : ''}">
                ${tagline || (isFrench ? 'Votre partenaire de confiance' : 'Your trusted partner')}
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Content -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 32px 24px;">
              <!-- Greeting -->
              <p style="margin: 0 0 20px 0; font-size: ${tone === 'Energetic' ? '17px' : '16px'}; color: #1f2937; font-weight: ${tone === 'Energetic' ? '700' : '500'};">
                ${greeting}
              </p>
              
              <!-- Main acknowledgment -->
              <p style="margin: 0 0 16px 0; font-size: ${tone === 'Energetic' ? '15px' : '14px'}; line-height: 1.7; color: #374151; ${tone === 'Energetic' ? 'font-weight: 500;' : ''}">
                ${acknowledgment}
              </p>
              
              <!-- Expertise box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 16px 0;">
                <tr>
                  <td style="background: ${expertiseGradient}; border-left: 4px solid ${primaryColor}; ${tone === 'Formal' ? 'border: 1px solid #e5e7eb;' : ''} padding: 16px; border-radius: 6px;">
                    <p style="margin: 0; font-size: 13px; color: ${expertiseColor}; line-height: 1.6;">
                      <strong>${tone === 'Energetic' ? '🔧' : '🏗️'} ${expertiseLabel}</strong> ${expertiseText}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- AI analysis mention -->
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.7; color: #374151;">
                ${aiAnalysis}
              </p>
              
              <!-- Urgency indicator (conditional) -->
              ${urgencyBox}
              
              <!-- Follow-up timing -->
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.7; color: #374151;">
                ${followupTiming}
              </p>
              
              <!-- Booking CTA (conditional) -->
              ${bookingCTA}
              
              <!-- Closing -->
              <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #374151;">
                ${closing.replace(/\n/g, '<br>')}
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer with Avenir AI branding -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: #f9fafb; padding: 18px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                ${isFrench ? 'Propulsé par Avenir AI 🧠' : 'Powered by Avenir AI 🧠'}
              </p>
              <p style="margin: 6px 0 0 0; font-size: 12px;">
                <a href="mailto:${client.email}" style="color: #6b7280; text-decoration: none;">${client.email}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  
  // Build email message for Gmail API
  const message = [
    `From: ${client.business_name} <${client.email}>`,
    `To: ${leadEmail}`,
    `Subject: ${subject}`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    html,
  ].join('\r\n');
  
  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

