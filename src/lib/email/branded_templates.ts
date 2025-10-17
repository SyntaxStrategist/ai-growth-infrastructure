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
 * Generate branded HTML email template
 */
function generateHTMLTemplate(fields: EmailMergeFields): string {
  const { business_name, industry, website } = fields;
  
  const logoUrl = process.env.NEXT_PUBLIC_SITE_URL 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/assets/logos/logo.svg`
    : 'https://www.aveniraisolutions.ca/assets/logos/logo.svg';

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
      max-width: 180px;
      height: auto;
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
      <p class="greeting">Hello,</p>
      
      <p class="main-text">
        I noticed <span class="highlight">${business_name}</span> is in the <span class="highlight">${industry}</span> industry, and wanted to reach out about an opportunity to streamline your operations with AI-powered automation.
      </p>

      <p class="main-text">
        We specialize in helping businesses like yours:
      </p>

      <ul class="benefits-list">
        <li>Automate lead intake and qualification</li>
        <li>Reduce manual data entry by up to 80%</li>
        <li>Improve response times to customer inquiries</li>
        <li>Free up your team to focus on high-value tasks</li>
      </ul>

      <div class="cta-section">
        <p class="cta-text">
          <strong>I'd love to schedule a brief 15-minute call</strong> to discuss how we can help ${business_name} achieve similar results.
        </p>
      </div>

      <p class="main-text">
        Would you be available for a quick chat this week?
      </p>

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
 * Generate plain text email template
 */
function generateTextTemplate(fields: EmailMergeFields): string {
  const { business_name, industry, website } = fields;

  return `Hello,

I noticed ${business_name} is in the ${industry} industry, and wanted to reach out about an opportunity to streamline your operations with AI-powered automation.

We specialize in helping businesses like yours:
  ✓ Automate lead intake and qualification
  ✓ Reduce manual data entry by up to 80%
  ✓ Improve response times to customer inquiries
  ✓ Free up your team to focus on high-value tasks

I'd love to schedule a brief 15-minute call to discuss how we can help ${business_name} achieve similar results.

Would you be available for a quick chat this week?

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
 * Generate complete email template with both HTML and plain text versions
 */
export function generateBrandedEmailTemplate(fields: EmailMergeFields): EmailTemplate {
  return {
    html: generateHTMLTemplate(fields),
    text: generateTextTemplate(fields)
  };
}

/**
 * Get email subject line
 */
export function getEmailSubject(businessName: string): string {
  return `Streamline Operations at ${businessName}`;
}

