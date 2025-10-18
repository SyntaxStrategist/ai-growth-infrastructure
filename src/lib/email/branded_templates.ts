// ============================================
// Branded Email Templates for Avenir AI Solutions
// ============================================
// Generates both HTML and plain text email templates
// with company branding, styling, and dynamic merge fields

export interface EmailTemplate {
  html: string;
  text: string;
}

export interface EmailMergeFields {
  business_name: string;
  industry: string;
  website: string;
  recipient_name?: string;
}

/**
 * Generate branded HTML email template (English)
 */
function generateHTMLTemplate(fields: EmailMergeFields): string {
  const { business_name, industry, website } = fields;
  
  const logoUrl = process.env.NEXT_PUBLIC_SITE_URL 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/assets/logos/logo.svg`
    : 'https://www.aveniraisolutions.ca/assets/logos/logo.svg';
  
  // Always use absolute production URL for demo (never relative)
  const demoUrl = 'https://www.aveniraisolutions.ca/demo';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Streamline Operations at ${business_name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f7f9fb;
      color: #1f2937;
      line-height: 1.6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .email-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo {
      max-width: 80px;
      height: auto;
    }
    .demo-button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2D6CDF;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      transition: background-color 0.3s;
    }
    .demo-button:hover {
      background-color: #1e4db7;
    }
    .email-card {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 32px 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      margin-bottom: 24px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      color: #374151;
    }
    .main-text {
      font-size: 15px;
      color: #4b5563;
      margin-bottom: 16px;
    }
    .highlight {
      color: #1f2937;
      font-weight: 500;
    }
    .benefits-list {
      margin: 20px 0;
      padding-left: 0;
      list-style: none;
    }
    .benefits-list li {
      padding: 8px 0;
      padding-left: 28px;
      position: relative;
      color: #4b5563;
      font-size: 15px;
    }
    .benefits-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #3b82f6;
      font-weight: 600;
      font-size: 18px;
    }
    .cta-section {
      margin: 24px 0;
      padding: 20px;
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
    }
    .cta-text {
      font-size: 15px;
      color: #1e40af;
      margin: 0;
    }
    .signature {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 2px solid #e5e7eb;
    }
    .signature-line {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .signature-name {
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
      margin: 8px 0;
    }
    .signature-link {
      color: #3b82f6;
      text-decoration: none;
      font-size: 14px;
    }
    .signature-link:hover {
      text-decoration: underline;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #9ca3af;
    }
    .footer-text {
      margin: 0;
      line-height: 1.5;
    }
    @media only screen and (max-width: 600px) {
      .email-card {
        padding: 24px 16px;
      }
      .benefits-list li {
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Logo Header -->
    <div class="email-header">
      <img src="${logoUrl}" alt="Avenir AI Solutions" class="logo" />
    </div>

    <!-- Main Email Card -->
    <div class="email-card">
      <p class="greeting">Hello ${business_name} team,</p>
      
      <p class="main-text">
        I came across your work in the <span class="highlight">${industry}</span> space and wanted to reach out personally.
      </p>

      <p class="main-text">
        We help businesses like yours automate lead management, form responses, and client follow-ups — using smart AI workflows that save teams 10+ hours per week.
      </p>

      <p class="main-text">
        Here's what that looks like in action:
      </p>

      <ul class="benefits-list">
        <li>A custom dashboard that captures and routes leads instantly</li>
        <li>Automated replies that feel human (in any language)</li>
        <li>Full visibility into every client interaction in one place</li>
      </ul>

      <p class="main-text" style="text-align: center; margin: 24px 0;">
        You can explore a live demo of the client dashboard here:
      </p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${demoUrl}" class="demo-button" target="_blank" rel="noopener noreferrer">
          🔗 View Live Demo Dashboard
        </a>
      </div>

      <div class="cta-section">
        <p class="cta-text">
          <strong>If you'd like, I can walk you through how it adapts to your exact process</strong> — it only takes 15 minutes.
        </p>
      </div>

      <!-- Signature -->
      <div class="signature">
        <p class="signature-line">——</p>
        <p class="signature-line">Best regards,</p>
        <p class="signature-name">Avenir AI Solutions Team</p>
        <p class="signature-line">
          <a href="https://www.aveniraisolutions.ca" class="signature-link">www.aveniraisolutions.ca</a>
        </p>
        <p class="signature-line">——</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">
        This message was generated by the Avenir AI Solutions outreach system.
      </p>
      <p class="footer-text">
        <span class="highlight">Website:</span> ${website} | <span class="highlight">Industry:</span> ${industry}
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate branded HTML email template (French)
 */
function generateHTMLTemplateFR(fields: EmailMergeFields): string {
  const { business_name, industry, website } = fields;
  
  const logoUrl = process.env.NEXT_PUBLIC_SITE_URL 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/assets/logos/logo.svg`
    : 'https://www.aveniraisolutions.ca/assets/logos/logo.svg';
  
  // Always use absolute production URL for demo (never relative)
  const demoUrl = 'https://www.aveniraisolutions.ca/demo';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Économisez 80 % de temps chez ${business_name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f7f9fb;
      color: #1f2937;
      line-height: 1.6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-header {
      text-align: center;
      padding: 32px 0 24px;
      background-color: #ffffff;
    }
    .logo {
      max-width: 80px;
      height: auto;
      display: block;
      margin: 0 auto;
    }
    .email-card {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 32px 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    .greeting {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .main-text {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .highlight {
      font-weight: 600;
      color: #2D6CDF;
    }
    .benefits-list {
      list-style: none;
      padding: 0;
      margin: 20px 0;
    }
    .benefits-list li {
      margin-bottom: 10px;
      font-size: 15px;
      line-height: 1.5;
      color: #555555;
      position: relative;
      padding-left: 25px;
    }
    .benefits-list li:before {
      content: '✓';
      color: #2D6CDF;
      font-weight: bold;
      position: absolute;
      left: 0;
    }
    .cta-section {
      background-color: #e0f2fe;
      border-left: 4px solid #2D6CDF;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .cta-text {
      font-size: 16px;
      line-height: 1.6;
      color: #2D6CDF;
    }
    .demo-button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2D6CDF;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      transition: background-color 0.3s;
    }
    .demo-button:hover {
      background-color: #1e4db7;
    }
    .signature {
      margin-top: 32px;
      font-size: 15px;
      line-height: 1.6;
    }
    .signature-line {
      margin: 0;
    }
    .footer {
      text-align: center;
      padding: 24px;
      font-size: 12px;
      color: #aaaaaa;
      line-height: 1.5;
    }
    a {
      color: #2D6CDF;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100%;
        border-radius: 0;
      }
      .email-card {
        padding: 20px;
      }
      .email-header {
        padding: 20px 0 16px;
      }
      .logo {
        max-width: 70px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Logo Header -->
    <div class="email-header">
      <img src="${logoUrl}" alt="Avenir AI Solutions" class="logo" />
    </div>

    <!-- Main Email Card -->
    <div class="email-card">
      <p class="greeting">Bonjour ${business_name},</p>
      
      <p class="main-text">
        J'ai découvert votre travail dans le domaine de <span class="highlight">${industry}</span> et je voulais vous contacter personnellement.
      </p>

      <p class="main-text">
        Nous aidons des entreprises comme la vôtre à automatiser la gestion des prospects, les réponses aux formulaires et le suivi des clients — grâce à des flux de travail intelligents alimentés par l'IA qui font gagner plus de 10 heures par semaine à vos équipes.
      </p>

      <p class="main-text">
        Voici un aperçu de ce que cela permet :
      </p>

      <ul class="benefits-list">
        <li>Un tableau de bord personnalisé qui capture et distribue les prospects instantanément</li>
        <li>Des réponses automatisées, mais humaines (dans n'importe quelle langue)</li>
        <li>Une visibilité complète sur chaque interaction client au même endroit</li>
      </ul>

      <p class="main-text" style="text-align: center; margin: 24px 0;">
        Vous pouvez explorer une démonstration en direct du tableau de bord client ici :
      </p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${demoUrl}" class="demo-button" target="_blank" rel="noopener noreferrer">
          🔗 Voir la démo en direct du tableau de bord
        </a>
      </div>

      <div class="cta-section">
        <p class="cta-text">
          <strong>Si vous le souhaitez, je peux vous montrer comment il s'adapte à votre processus exact</strong> — cela ne prend que 15 minutes.
        </p>
      </div>

      <!-- Signature -->
      <div class="signature">
        <p class="signature-line">——</p>
        <p class="signature-line">Cordialement,</p>
        <p class="signature-name">L'équipe Avenir AI Solutions</p>
        <p class="signature-line">
          <a href="https://www.aveniraisolutions.ca" class="signature-link">www.aveniraisolutions.ca</a>
        </p>
        <p class="signature-line">——</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">
        Ce message a été généré par le système d'envoi automatisé d'Avenir AI Solutions.
      </p>
      <p class="footer-text">
        <span class="highlight">Site web :</span> ${website} | <span class="highlight">Secteur :</span> ${industry}
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate plain text email template (English)
 */
function generateTextTemplate(fields: EmailMergeFields): string {
  const { business_name, industry, website } = fields;
  
  // Always use absolute production URL for demo (never relative)
  const demoUrl = 'https://www.aveniraisolutions.ca/demo';

  return `Hello ${business_name} team,

I came across your work in the ${industry} space and wanted to reach out personally.

We help businesses like yours automate lead management, form responses, and client follow-ups — using smart AI workflows that save teams 10+ hours per week.

Here's what that looks like in action:
  → A custom dashboard that captures and routes leads instantly
  → Automated replies that feel human (in any language)
  → Full visibility into every client interaction in one place

You can explore a live demo of the client dashboard here:
🔗 ${demoUrl}

If you'd like, I can walk you through how it adapts to your exact process — it only takes 15 minutes.

——
Best regards,
Avenir AI Solutions Team
www.aveniraisolutions.ca
——

---
This message was generated by the Avenir AI Solutions outreach system.
Website: ${website} | Industry: ${industry}`;
}

/**
 * Generate plain text email template (French)
 */
function generateTextTemplateFR(fields: EmailMergeFields): string {
  const { business_name, industry, website } = fields;
  
  // Always use absolute production URL for demo (never relative)
  const demoUrl = 'https://www.aveniraisolutions.ca/demo';

  return `Bonjour ${business_name},

J'ai découvert votre travail dans le domaine de ${industry} et je voulais vous contacter personnellement.

Nous aidons des entreprises comme la vôtre à automatiser la gestion des prospects, les réponses aux formulaires et le suivi des clients — grâce à des flux de travail intelligents alimentés par l'IA qui font gagner plus de 10 heures par semaine à vos équipes.

Voici un aperçu de ce que cela permet :
  → Un tableau de bord personnalisé qui capture et distribue les prospects instantanément
  → Des réponses automatisées, mais humaines (dans n'importe quelle langue)
  → Une visibilité complète sur chaque interaction client au même endroit

Vous pouvez explorer une démonstration en direct du tableau de bord client ici :
🔗 ${demoUrl}

Si vous le souhaitez, je peux vous montrer comment il s'adapte à votre processus exact — cela ne prend que 15 minutes.

——
Cordialement,
L'équipe Avenir AI Solutions
www.aveniraisolutions.ca
——

---
Ce message a été généré par le système d'envoi automatisé d'Avenir AI Solutions.
Site web : ${website} | Secteur : ${industry}`;
}

/**
 * Generate complete email template with both HTML and plain text versions
 */
export function generateBrandedEmailTemplate(fields: EmailMergeFields, locale: string = 'en'): EmailTemplate {
  const isFrench = locale === 'fr';
  
  console.log('[BrandedTemplates] Generating email template for locale:', locale);
  
  return {
    html: isFrench ? generateHTMLTemplateFR(fields) : generateHTMLTemplate(fields),
    text: isFrench ? generateTextTemplateFR(fields) : generateTextTemplate(fields)
  };
}

/**
 * Get email subject line
 */
export function getEmailSubject(businessName: string, locale: string = 'en'): string {
  const isFrench = locale === 'fr';
  
  return isFrench 
    ? `Économisez 80 % de temps chez ${businessName}`
    : `Unlock 80% Time Savings at ${businessName}`;
}

