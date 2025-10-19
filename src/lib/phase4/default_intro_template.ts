/**
 * Default Intro Email Template for Avenir AI Outreach
 * This template is used for initial outreach to prospects
 */

export const DEFAULT_INTRO_TEMPLATE_EN = {
  name: 'default_intro',
  subject_template: '{{company_name}} - AI Automation Opportunity',
  html_template: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>{{company_name}} - AI Automation Opportunity</title>
    <style>
        /* Reset styles for email clients */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        
        /* Main styles */
        body {
            margin: 0;
            padding: 0;
            width: 100% !important;
            min-width: 100%;
            height: 100%;
            background-color: #f5f5f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        
        .email-header {
            background-color: #f8f9fa;
            padding: 16px 20px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .email-body {
            padding: 24px 20px;
        }
        
        .logo-section {
            text-align: center;
            margin-bottom: 24px;
        }
        
        .logo-image {
            max-width: 120px;
            height: auto;
            margin-bottom: 12px;
        }
        
        /* Gmail-compatible logo table */
        .logo-table {
            margin: 0 auto;
        }
        
        .logo-text {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, #0A2540 0%, #00B8D9 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
            display: inline-block;
        }
        
        .logo-tagline {
            font-size: 14px;
            color: #666666;
            font-style: italic;
        }
        
        .content h2 {
            color: #0A2540;
            font-size: 20px;
            margin-bottom: 16px;
            font-weight: 600;
        }
        
        .content p {
            margin-bottom: 16px;
            color: #333333;
            font-size: 15px;
        }
        
        .content ul {
            margin: 16px 0;
            padding-left: 20px;
        }
        
        .content li {
            margin-bottom: 8px;
            color: #333333;
            font-size: 15px;
        }
        
        .cta-section {
            text-align: center;
            margin: 24px 0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #0A2540 0%, #00B8D9 100%);
            color: #ffffff !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
            transition: all 0.2s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(10, 37, 64, 0.3);
        }
        
        .secondary-cta {
            text-align: center;
            margin-top: 16px;
        }
        
        .secondary-cta-text {
            font-size: 14px;
            color: #666666;
            margin-bottom: 8px;
        }
        
        .secondary-cta-link {
            color: #00B8D9;
            text-decoration: none;
            font-weight: 500;
            font-size: 14px;
        }
        
        .secondary-cta-link:hover {
            text-decoration: underline;
        }
        
        .signature {
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }
        
        .signature-name {
            font-weight: 600;
            color: #0A2540;
            font-size: 16px;
        }
        
        .signature-title {
            color: #00B8D9;
            font-size: 14px;
            margin: 4px 0;
        }
        
        .signature-company {
            color: #666666;
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .signature-contact {
            font-size: 14px;
            color: #666666;
        }
        
        .signature-contact a {
            color: #00B8D9;
            text-decoration: none;
        }
        
        .email-footer {
            background-color: #f8f9fa;
            padding: 16px 20px;
            text-align: center;
            font-size: 12px;
            color: #666666;
            border-top: 1px solid #e0e0e0;
        }
        
        .email-footer a {
            color: #00B8D9;
            text-decoration: none;
        }
        
        /* Mobile responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }
            
            .email-body {
                padding: 20px 15px !important;
            }
            
            .logo-text {
                font-size: 24px !important;
            }
            
            .logo-image {
                max-width: 90px !important;
            }
            
            /* Mobile logo table adjustments */
            .logo-table img {
                width: 60px !important;
                max-width: 60px !important;
            }
            
            .secondary-cta-text,
            .secondary-cta-link {
                font-size: 13px !important;
            }
            
            .content h2 {
                font-size: 18px !important;
            }
            
            .content p,
            .content li {
                font-size: 14px !important;
            }
            
            .cta-button {
                padding: 10px 20px !important;
                font-size: 14px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div style="font-weight: 600; color: #0A2540; font-size: 14px;">Avenir AI Solutions &lt;contact@aveniraisolutions.ca&gt;</div>
            <div style="color: #666666; margin-top: 4px; font-size: 13px;">to: {{contact_email}}</div>
            <div style="font-weight: 600; color: #333333; margin-top: 8px; font-size: 14px;">{{company_name}} - AI Automation Opportunity</div>
        </div>
        
        <div class="email-body">
            <div class="logo-section">
                <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                        <td align="center">
                            <img src="https://www.aveniraisolutions.ca/assets/logo.png" alt="Avenir AI Solutions" width="80" style="display:block;margin:0 auto 12px auto;border:0;outline:none;text-decoration:none;">
                        </td>
                    </tr>
                </table>
                <div class="logo-text">Avenir AI</div>
                <div class="logo-tagline">Intelligent Growth Infrastructure</div>
            </div>
            
            <div class="content">
                <h2>Hi {{contact_name}},</h2>
                
                <p>I noticed <strong>{{company_name}}</strong> is in the <strong>{{industry}}</strong> space and likely dealing with <strong>{{pain_points}}</strong>.</p>
                
                <p>We've helped similar companies in your industry achieve:</p>
                <ul>
                    <li><strong>3x higher lead conversion rates</strong> through AI-powered prospect scoring</li>
                    <li><strong>Automated prospect discovery</strong> that finds your ideal customers 24/7</li>
                    <li><strong>Intelligent outreach</strong> that gets 3x higher response rates</li>
                    <li><strong>Real-time lead analysis</strong> with intent, urgency, and confidence scoring</li>
                </ul>
                
                <p>Our AI systems analyze every interaction in real-time, turning conversations into conversions and data into growth.</p>
                
                <p>Would you be interested in a 15-minute call to discuss how AI automation could help <strong>{{company_name}}</strong> generate more qualified leads and scale your growth?</p>
                
                <div class="cta-section">
                    <a href="https://www.aveniraisolutions.ca/demo" class="cta-button">View Demo</a>
                    <div class="secondary-cta">
                        <div class="secondary-cta-text">Or</div>
                        <a href="https://calendar.app.google/g4vdGJ6VdaZPj8nc7" class="secondary-cta-link">schedule a quick 10-minute chat with me</a>
                    </div>
                </div>
                
                <p>I'd love to show you how we've helped companies like yours transform their lead generation process.</p>
                
                <div class="signature">
                    <div class="signature-name">Michael Oni</div>
                    <div class="signature-title">Founder & CEO</div>
                    <div class="signature-company">Avenir AI Solutions</div>
                    <div class="signature-contact">
                        📧 <a href="mailto:contact@aveniraisolutions.ca">contact@aveniraisolutions.ca</a><br>
                        🌐 <a href="https://aveniraisolutions.ca">aveniraisolutions.ca</a><br>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="email-footer">
            <p>This email was sent by Avenir AI Solutions. If you no longer wish to receive these emails, you can <a href="https://aveniraisolutions.ca/unsubscribe">unsubscribe here</a>.</p>
            <p style="margin-top: 8px; font-size: 11px; color: #999999;">
            </p>
        </div>
    </div>
</body>
</html>
  `,
  text_template: `
Hi {{contact_name}},

I noticed {{company_name}} is in the {{industry}} space and likely dealing with {{pain_points}}.

We've helped similar companies in your industry achieve:
- 3x higher lead conversion rates through AI-powered prospect scoring
- Automated prospect discovery that finds your ideal customers 24/7
- Intelligent outreach that gets 3x higher response rates
- Real-time lead analysis with intent, urgency, and confidence scoring

Our AI systems analyze every interaction in real-time, turning conversations into conversions and data into growth.

Would you be interested in a 15-minute call to discuss how AI automation could help {{company_name}} generate more qualified leads and scale your growth?

View Demo: https://www.aveniraisolutions.ca/demo

Or schedule a quick 10-minute chat with me: https://calendar.app.google/g4vdGJ6VdaZPj8nc7

I'd love to show you how we've helped companies like yours transform their lead generation process.

Best regards,

Michael Oni
Founder & CEO
Avenir AI Solutions
📧 contact@aveniraisolutions.ca
🌐 aveniraisolutions.ca

---
This email was sent by Avenir AI Solutions. If you no longer wish to receive these emails, you can unsubscribe here: https://aveniraisolutions.ca/unsubscribe

  `,
  language: 'en',
  category: 'initial_outreach' as const,
  variables: [
    'company_name',
    'contact_name', 
    'contact_email',
    'industry',
    'pain_points'
  ]
};

export const DEFAULT_INTRO_TEMPLATE_FR = {
  name: 'default_intro_fr',
  subject_template: '{{company_name}} - Opportunité d\'automatisation IA',
  html_template: `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>{{company_name}} - Opportunité d'automatisation IA</title>
    <style>
        /* Reset styles for email clients */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        
        /* Main styles */
        body {
            margin: 0;
            padding: 0;
            width: 100% !important;
            min-width: 100%;
            height: 100%;
            background-color: #f5f5f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        
        .email-header {
            background-color: #f8f9fa;
            padding: 16px 20px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .email-body {
            padding: 24px 20px;
        }
        
        .logo-section {
            text-align: center;
            margin-bottom: 24px;
        }
        
        .logo-image {
            max-width: 120px;
            height: auto;
            margin-bottom: 12px;
        }
        
        /* Gmail-compatible logo table */
        .logo-table {
            margin: 0 auto;
        }
        
        .logo-text {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, #0A2540 0%, #00B8D9 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
            display: inline-block;
        }
        
        .logo-tagline {
            font-size: 14px;
            color: #666666;
            font-style: italic;
        }
        
        .content h2 {
            color: #0A2540;
            font-size: 20px;
            margin-bottom: 16px;
            font-weight: 600;
        }
        
        .content p {
            margin-bottom: 16px;
            color: #333333;
            font-size: 15px;
        }
        
        .content ul {
            margin: 16px 0;
            padding-left: 20px;
        }
        
        .content li {
            margin-bottom: 8px;
            color: #333333;
            font-size: 15px;
        }
        
        .cta-section {
            text-align: center;
            margin: 24px 0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #0A2540 0%, #00B8D9 100%);
            color: #ffffff !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
            transition: all 0.2s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(10, 37, 64, 0.3);
        }
        
        .secondary-cta {
            text-align: center;
            margin-top: 16px;
        }
        
        .secondary-cta-text {
            font-size: 14px;
            color: #666666;
            margin-bottom: 8px;
        }
        
        .secondary-cta-link {
            color: #00B8D9;
            text-decoration: none;
            font-weight: 500;
            font-size: 14px;
        }
        
        .secondary-cta-link:hover {
            text-decoration: underline;
        }
        
        .signature {
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }
        
        .signature-name {
            font-weight: 600;
            color: #0A2540;
            font-size: 16px;
        }
        
        .signature-title {
            color: #00B8D9;
            font-size: 14px;
            margin: 4px 0;
        }
        
        .signature-company {
            color: #666666;
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .signature-contact {
            font-size: 14px;
            color: #666666;
        }
        
        .signature-contact a {
            color: #00B8D9;
            text-decoration: none;
        }
        
        .email-footer {
            background-color: #f8f9fa;
            padding: 16px 20px;
            text-align: center;
            font-size: 12px;
            color: #666666;
            border-top: 1px solid #e0e0e0;
        }
        
        .email-footer a {
            color: #00B8D9;
            text-decoration: none;
        }
        
        /* Mobile responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }
            
            .email-body {
                padding: 20px 15px !important;
            }
            
            .logo-text {
                font-size: 24px !important;
            }
            
            .logo-image {
                max-width: 90px !important;
            }
            
            /* Mobile logo table adjustments */
            .logo-table img {
                width: 60px !important;
                max-width: 60px !important;
            }
            
            .secondary-cta-text,
            .secondary-cta-link {
                font-size: 13px !important;
            }
            
            .content h2 {
                font-size: 18px !important;
            }
            
            .content p,
            .content li {
                font-size: 14px !important;
            }
            
            .cta-button {
                padding: 10px 20px !important;
                font-size: 14px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div style="font-weight: 600; color: #0A2540; font-size: 14px;">Avenir AI Solutions &lt;contact@aveniraisolutions.ca&gt;</div>
            <div style="color: #666666; margin-top: 4px; font-size: 13px;">à: {{contact_email}}</div>
            <div style="font-weight: 600; color: #333333; margin-top: 8px; font-size: 14px;">{{company_name}} - Opportunité d'automatisation IA</div>
        </div>
        
        <div class="email-body">
            <div class="logo-section">
                <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                        <td align="center">
                            <img src="https://www.aveniraisolutions.ca/assets/logo.png" alt="Avenir AI Solutions" width="80" style="display:block;margin:0 auto 12px auto;border:0;outline:none;text-decoration:none;">
                        </td>
                    </tr>
                </table>
                <div class="logo-text">Avenir AI</div>
                <div class="logo-tagline">Infrastructure de croissance intelligente</div>
            </div>
            
            <div class="content">
                <h2>Bonjour {{contact_name}},</h2>
                
                <p>J'ai remarqué que <strong>{{company_name}}</strong> évolue dans le secteur <strong>{{industry}}</strong> et fait probablement face à <strong>{{pain_points}}</strong>.</p>
                
                <p>Nous avons aidé des entreprises similaires dans votre secteur à atteindre :</p>
                <ul>
                    <li><strong>3x plus de taux de conversion de leads</strong> grâce au scoring de prospects alimenté par l'IA</li>
                    <li><strong>Découverte automatisée de prospects</strong> qui trouve vos clients idéaux 24h/24</li>
                    <li><strong>Approche intelligente</strong> qui obtient 3x plus de taux de réponse</li>
                    <li><strong>Analyse de leads en temps réel</strong> avec scoring d'intention, d'urgence et de confiance</li>
                </ul>
                
                <p>Nos systèmes IA analysent chaque interaction en temps réel, transformant les conversations en conversions et les données en croissance.</p>
                
                <p>Seriez-vous intéressé par un appel de 15 minutes pour discuter de comment l'automatisation IA pourrait aider <strong>{{company_name}}</strong> à générer plus de leads qualifiés et à faire évoluer votre croissance ?</p>
                
                <div class="cta-section">
                    <a href="https://www.aveniraisolutions.ca/demo" class="cta-button">Voir la démo</a>
                    <div class="secondary-cta">
                        <div class="secondary-cta-text">Ou</div>
                        <a href="https://calendar.app.google/g4vdGJ6VdaZPj8nc7" class="secondary-cta-link">planifiez un échange rapide de 10 minutes avec moi</a>
                    </div>
                </div>
                
                <p>J'aimerais vous montrer comment nous avons aidé des entreprises comme la vôtre à transformer leur processus de génération de leads.</p>
                
                <div class="signature">
                    <div class="signature-name">Michael Oni</div>
                    <div class="signature-title">Fondateur et PDG</div>
                    <div class="signature-company">Avenir AI Solutions</div>
                    <div class="signature-contact">
                        📧 <a href="mailto:contact@aveniraisolutions.ca">contact@aveniraisolutions.ca</a><br>
                        🌐 <a href="https://aveniraisolutions.ca">aveniraisolutions.ca</a><br>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="email-footer">
            <p>Cet e-mail a été envoyé par Avenir AI Solutions. Si vous ne souhaitez plus recevoir ces e-mails, vous pouvez <a href="https://aveniraisolutions.ca/unsubscribe">vous désabonner ici</a>.</p>
            <p style="margin-top: 8px; font-size: 11px; color: #999999;">
            </p>
        </div>
    </div>
</body>
</html>
  `,
  text_template: `
Bonjour {{contact_name}},

J'ai remarqué que {{company_name}} évolue dans le secteur {{industry}} et fait probablement face à {{pain_points}}.

Nous avons aidé des entreprises similaires dans votre secteur à atteindre :
- 3x plus de taux de conversion de leads grâce au scoring de prospects alimenté par l'IA
- Découverte automatisée de prospects qui trouve vos clients idéaux 24h/24
- Approche intelligente qui obtient 3x plus de taux de réponse
- Analyse de leads en temps réel avec scoring d'intention, d'urgence et de confiance

Nos systèmes IA analysent chaque interaction en temps réel, transformant les conversations en conversions et les données en croissance.

Seriez-vous intéressé par un appel de 15 minutes pour discuter de comment l'automatisation IA pourrait aider {{company_name}} à générer plus de leads qualifiés et à faire évoluer votre croissance ?

Voir la démo : https://www.aveniraisolutions.ca/demo

Ou planifiez un échange rapide de 10 minutes avec moi : https://calendar.app.google/g4vdGJ6VdaZPj8nc7

J'aimerais vous montrer comment nous avons aidé des entreprises comme la vôtre à transformer leur processus de génération de leads.

Cordialement,

Michael Oni
Fondateur et PDG
Avenir AI Solutions
📧 contact@aveniraisolutions.ca
🌐 aveniraisolutions.ca

---
Cet e-mail a été envoyé par Avenir AI Solutions. Si vous ne souhaitez plus recevoir ces e-mails, vous pouvez vous désabonner ici : https://aveniraisolutions.ca/unsubscribe

  `,
  language: 'fr',
  category: 'initial_outreach' as const,
  variables: [
    'company_name',
    'contact_name', 
    'contact_email',
    'industry',
    'pain_points'
  ]
};

/**
 * Sample prospect data for testing the template
 */
export const SAMPLE_PROSPECT_DATA = {
  prospect_id: 'prospect_001',
  company_name: 'TechCorp',
  contact_email: 'john.smith@techcorp.com',
  contact_name: 'John Smith',
  industry: 'technology',
  company_size: '50-200 employees',
  technology_stack: ['Salesforce', 'HubSpot', 'Slack'],
  pain_points: ['lead generation challenges', 'manual prospect research', 'low conversion rates'],
  score: 0.85,
  conversion_probability: 0.72,
  website: 'https://techcorp.com',
  location: 'Toronto, ON',
  revenue: '$5M-10M',
  employees: 150
};

/**
 * Generate personalized email content using the default intro template
 */
export function generateDefaultIntroEmail(prospect: typeof SAMPLE_PROSPECT_DATA, language: 'en' | 'fr' = 'en') {
  const template = language === 'fr' ? DEFAULT_INTRO_TEMPLATE_FR : DEFAULT_INTRO_TEMPLATE_EN;
  
  const variables = {
    company_name: prospect.company_name,
    contact_name: prospect.contact_name,
    contact_email: prospect.contact_email,
    industry: prospect.industry,
    pain_points: prospect.pain_points.join(', ')
  };

  let html = template.html_template;
  let text = template.text_template;
  let subject = template.subject_template;

  // Replace variables in templates
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, value);
    text = text.replace(regex, value);
    subject = subject.replace(regex, value);
  });

  return {
    subject,
    html,
    text,
    variables_used: variables,
    language
  };
}
