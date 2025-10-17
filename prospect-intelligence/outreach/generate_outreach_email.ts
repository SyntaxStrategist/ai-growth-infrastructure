// ============================================
// Outreach Email Generator
// ============================================

import { ProspectCandidate, OutreachTemplate, FormTestResult } from '../types';

/**
 * Generate personalized outreach email for a prospect
 */
export function generateOutreachEmail(
  prospect: ProspectCandidate,
  formTest: FormTestResult,
  automationScore: number
): OutreachTemplate {
  const isFrench = prospect.language === 'fr';
  const tone = 'Friendly'; // Avenir's default tone
  
  console.log('[OutreachGenerator] ============================================');
  console.log('[OutreachGenerator] Generating email for:', prospect.business_name);
  console.log('[OutreachGenerator] Automation Score:', automationScore);
  console.log('[OutreachGenerator] Language:', prospect.language);

  // Select template based on automation score
  if (automationScore >= 85) {
    return generateUrgentTemplate(prospect, formTest, isFrench);
  } else if (automationScore >= 70) {
    return generateHighPriorityTemplate(prospect, formTest, isFrench);
  } else {
    return generateStandardTemplate(prospect, formTest, isFrench);
  }
}

/**
 * Urgent template (score 85+)
 * Focus: Critical gap, immediate value
 */
function generateUrgentTemplate(
  prospect: ProspectCandidate,
  formTest: FormTestResult,
  isFrench: boolean
): OutreachTemplate {
  const contactName = extractContactName(prospect);
  const responseTime = formatResponseTime(formTest.response_time_minutes || 0, isFrench);

  if (isFrench) {
    return {
      subject: `⚡ Note rapide concernant ${prospect.business_name}`,
      body: `Bonjour${contactName ? ` ${contactName}` : ''},

J'ai essayé votre formulaire de contact plus tôt aujourd'hui et j'ai remarqué qu'il ${formTest.has_autoresponder ? 'prend environ ' + responseTime + ' pour répondre' : 'n\'envoie pas de réponse instantanée'}.

Pour une entreprise comme ${prospect.business_name}, **chaque lead compte**. Les visiteurs qui remplissent votre formulaire s'attendent à une confirmation immédiate — et vos concurrents le font probablement déjà.

**Avenir AI** transforme les soumissions de formulaire en conversations réelles, instantanément — en français et en anglais.

Seriez-vous intéressé(e) à voir comment cela fonctionnerait sur votre site ?

Cordialement,
Michael Oni
Fondateur, Avenir AI Solutions
https://www.aveniraisolutions.ca`,
      tone: 'Friendly',
      language: 'fr'
    };
  }

  return {
    subject: `⚡ Quick note about ${prospect.business_name}`,
    body: `Hi${contactName ? ` ${contactName}` : ''},

I tried your contact form earlier today and noticed there's ${formTest.has_autoresponder ? 'about a ' + responseTime + ' response delay' : 'no instant reply'}.

For a business like ${prospect.business_name}, **every lead matters**. Visitors filling out your form expect immediate confirmation — and your competitors are probably already doing it.

**Avenir AI** turns form submissions into real conversations instantly — in English or French.

Would you like to see how it would work on your site?

Best regards,
Michael Oni
Founder, Avenir AI Solutions
https://www.aveniraisolutions.ca`,
    tone: 'Friendly',
    language: 'en'
  };
}

/**
 * High priority template (score 70-84)
 * Focus: Opportunity, competitive advantage
 */
function generateHighPriorityTemplate(
  prospect: ProspectCandidate,
  formTest: FormTestResult,
  isFrench: boolean
): OutreachTemplate {
  const contactName = extractContactName(prospect);
  const industry = prospect.industry || 'votre industrie';

  if (isFrench) {
    return {
      subject: `Idée pour améliorer ${prospect.business_name}`,
      body: `Bonjour${contactName ? ` ${contactName}` : ''},

J'ai remarqué que ${prospect.business_name} utilise un formulaire de contact standard sans réponse automatique instantanée.

Dans le secteur de **${industry}**, les premiers à répondre gagnent souvent le contrat. C'est pourquoi les meilleures entreprises utilisent désormais l'IA pour répondre en quelques secondes — pas en heures.

**Avenir AI** vous aide à :
✅ Confirmer chaque lead immédiatement
✅ Maintenir l'engagement pendant que vous travaillez
✅ Fonctionner en français et en anglais automatiquement

Ça vous intéresse de voir une démo rapide ?

Cordialement,
Michael Oni
Avenir AI Solutions
https://www.aveniraisolutions.ca`,
      tone: 'Friendly',
      language: 'fr'
    };
  }

  return {
    subject: `Idea to improve ${prospect.business_name}`,
    body: `Hi${contactName ? ` ${contactName}` : ''},

I noticed that ${prospect.business_name} uses a standard contact form without instant auto-reply.

In the **${industry}** space, the first to respond often wins the deal. That's why top companies are now using AI to respond in seconds — not hours.

**Avenir AI** helps you:
✅ Acknowledge every lead immediately
✅ Keep prospects engaged while you're busy
✅ Work in English and French automatically

Interested in seeing a quick demo?

Best regards,
Michael Oni
Avenir AI Solutions
https://www.aveniraisolutions.ca`,
    tone: 'Friendly',
    language: 'en'
  };
}

/**
 * Standard template (score 50-69)
 * Focus: Education, value proposition
 */
function generateStandardTemplate(
  prospect: ProspectCandidate,
  formTest: FormTestResult,
  isFrench: boolean
): OutreachTemplate {
  const contactName = extractContactName(prospect);

  if (isFrench) {
    return {
      subject: `Intelligence IA pour vos leads — ${prospect.business_name}`,
      body: `Bonjour${contactName ? ` ${contactName}` : ''},

La plupart des entreprises perdent des leads parce qu'elles ne répondent pas assez vite aux formulaires de contact.

**Avenir AI** résout ce problème en envoyant une réponse personnalisée instantanément — dès qu'un visiteur remplit votre formulaire.

Chaque lead reçoit :
• Une confirmation immédiate (en français ou en anglais)
• Un résumé de ce qu'il demande, analysé par l'IA
• Une option de réservation si vous le souhaitez

C'est comme avoir un assistant disponible 24h/24, sans l'embauche.

Vous aimeriez en savoir plus ?

Cordialement,
Michael Oni
Avenir AI Solutions`,
      tone: 'Friendly',
      language: 'fr'
    };
  }

  return {
    subject: `AI intelligence for your leads — ${prospect.business_name}`,
    body: `Hi${contactName ? ` ${contactName}` : ''},

Most businesses lose leads because they don't respond fast enough to contact forms.

**Avenir AI** solves this by sending a personalized reply instantly — the moment a visitor fills out your form.

Every lead gets:
• Immediate confirmation (in English or French)
• An AI-analyzed summary of what they're asking for
• A booking option if you want

It's like having a 24/7 assistant, without the hiring.

Want to learn more?

Best regards,
Michael Oni
Avenir AI Solutions`,
    tone: 'Friendly',
    language: 'en'
  };
}

/**
 * Extract contact name from prospect data
 */
function extractContactName(prospect: ProspectCandidate): string | null {
  if (prospect.contact_email) {
    // Try to extract name from email (e.g., john.doe@company.com → John)
    const localPart = prospect.contact_email.split('@')[0];
    const namePart = localPart.split(/[._-]/)[0];
    if (namePart && namePart.length > 2 && !/info|contact|hello|support|admin/i.test(namePart)) {
      return namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
    }
  }
  return null;
}

/**
 * Format response time for human readability
 */
function formatResponseTime(minutes: number, isFrench: boolean): string {
  if (minutes < 60) {
    return isFrench ? `${minutes} minutes` : `${minutes} minutes`;
  }
  if (minutes < 1440) {
    const hours = Math.round(minutes / 60);
    return isFrench ? `${hours} heure${hours > 1 ? 's' : ''}` : `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  const days = Math.round(minutes / 1440);
  return isFrench ? `${days} jour${days > 1 ? 's' : ''}` : `${days} day${days > 1 ? 's' : ''}`;
}

/**
 * Generate batch outreach emails for multiple prospects
 */
export function batchGenerateOutreach(
  prospects: ProspectCandidate[],
  formTests: FormTestResult[],
  automationScores: Map<string, number>
): Map<string, OutreachTemplate> {
  console.log('[OutreachGenerator] ============================================');
  console.log('[OutreachGenerator] Batch generating emails for', prospects.length, 'prospects');

  const templates = new Map<string, OutreachTemplate>();

  for (const prospect of prospects) {
    if (!prospect.id) continue;

    const formTest = formTests.find(t => t.prospect_id === prospect.id);
    const score = automationScores.get(prospect.id);

    if (formTest && score !== undefined) {
      const template = generateOutreachEmail(prospect, formTest, score);
      templates.set(prospect.id, template);
    }
  }

  console.log('[OutreachGenerator] ✅ Generated', templates.size, 'email templates');
  return templates;
}

