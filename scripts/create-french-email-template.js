#!/usr/bin/env node

/**
 * Script to create French email template in the database
 * Inserts the default_intro_fr template with proper French content
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Create the French email template
 */
async function createFrenchTemplate() {
  try {
    console.log('🚀 Creating French email template in database...\n');

    // Check if required environment variables are set
    console.log('🔍 Checking environment variables...');
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.log(`   - ${varName}`));
      return;
    }

    console.log('✅ All required environment variables are set');

    // French HTML template with logo and proper formatting
    const frenchHTMLTemplate = `<!DOCTYPE html>
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
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="center">
                            <img 
                                src="https://www.aveniraisolutions.ca/assets/logo.png" 
                                alt="Avenir AI Solutions" 
                                width="80" 
                                height="80" 
                                style="display:block;margin:0 auto 12px auto;border:0;outline:none;text-decoration:none;" 
                            />
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
                        🌐 <a href="https://aveniraisolutions.ca">aveniraisolutions.ca</a>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="email-footer">
            <p>Cet e-mail a été envoyé par Avenir AI Solutions. Si vous ne souhaitez plus recevoir ces e-mails, vous pouvez <a href="https://aveniraisolutions.ca/unsubscribe">vous désabonner ici</a>.</p>
        </div>
    </div>
</body>
</html>`;

    // French plain text template
    const frenchTextTemplate = `Avenir AI Solutions <contact@aveniraisolutions.ca>
à: {{contact_email}}
{{company_name}} - Opportunité d'automatisation IA

Avenir AI
Infrastructure de croissance intelligente

Bonjour {{contact_name}},

J'ai remarqué que {{company_name}} évolue dans le secteur {{industry}} et fait probablement face à {{pain_points}}.

Nous avons aidé des entreprises similaires dans votre secteur à atteindre :

• 3x plus de taux de conversion de leads grâce au scoring de prospects alimenté par l'IA
• Découverte automatisée de prospects qui trouve vos clients idéaux 24h/24
• Approche intelligente qui obtient 3x plus de taux de réponse
• Analyse de leads en temps réel avec scoring d'intention, d'urgence et de confiance

Nos systèmes IA analysent chaque interaction en temps réel, transformant les conversations en conversions et les données en croissance.

Seriez-vous intéressé par un appel de 15 minutes pour discuter de comment l'automatisation IA pourrait aider {{company_name}} à générer plus de leads qualifiés et à faire évoluer votre croissance ?

Voir la démo: https://www.aveniraisolutions.ca/demo

Ou planifiez un échange rapide de 10 minutes avec moi: https://calendar.app.google/g4vdGJ6VdaZPj8nc7

J'aimerais vous montrer comment nous avons aidé des entreprises comme la vôtre à transformer leur processus de génération de leads.

Cordialement,

Michael Oni
Fondateur et PDG
Avenir AI Solutions
📧 contact@aveniraisolutions.ca
🌐 aveniraisolutions.ca

---
Cet e-mail a été envoyé par Avenir AI Solutions. Si vous ne souhaitez plus recevoir ces e-mails, vous pouvez vous désabonner ici: https://aveniraisolutions.ca/unsubscribe`;

    // Template data
    const templateData = {
      name: 'default_intro_fr',
      language: 'fr',
      category: 'initial_outreach',
      subject_template: '{{company_name}} - Opportunité d\'automatisation IA',
      html_template: frenchHTMLTemplate,
      text_template: frenchTextTemplate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📧 Creating French template with data:');
    console.log('   - Name:', templateData.name);
    console.log('   - Language:', templateData.language);
    console.log('   - Category:', templateData.category);
    console.log('   - Subject:', templateData.subject_template);
    console.log('   - HTML length:', templateData.html_template.length, 'characters');
    console.log('   - Text length:', templateData.text_template.length, 'characters');

    // Insert the template into the database
    console.log('\n💾 Inserting French template into database...');
    const { data: insertedTemplate, error: insertError } = await supabase
      .from('email_templates')
      .insert([templateData])
      .select()
      .single();

    if (insertError) {
      console.log('❌ Error inserting French template:', insertError.message);
      return;
    }

    console.log('✅ French template created successfully!');
    console.log('📋 Template Details:');
    console.log('   - ID:', insertedTemplate.id);
    console.log('   - Name:', insertedTemplate.name);
    console.log('   - Language:', insertedTemplate.language);
    console.log('   - Category:', insertedTemplate.category);
    console.log('   - Subject:', insertedTemplate.subject_template);
    console.log('   - HTML length:', insertedTemplate.html_template?.length || 0, 'characters');
    console.log('   - Text length:', insertedTemplate.text_template?.length || 0, 'characters');
    console.log('   - Created:', insertedTemplate.created_at);
    console.log('   - Updated:', insertedTemplate.updated_at);

    // Verify the template was saved correctly
    console.log('\n🧪 Verifying template was saved correctly...');
    const { data: verifyTemplate, error: verifyError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'default_intro_fr')
      .single();

    if (verifyError) {
      console.log('❌ Error verifying template:', verifyError.message);
      return;
    }

    if (verifyTemplate) {
      console.log('✅ Template verification successful!');
      console.log('📋 Verification Details:');
      console.log('   - ID:', verifyTemplate.id);
      console.log('   - Name:', verifyTemplate.name);
      console.log('   - Language:', verifyTemplate.language);
      console.log('   - Category:', verifyTemplate.category);
      console.log('   - Subject:', verifyTemplate.subject_template);
      console.log('   - HTML length:', verifyTemplate.html_template?.length || 0, 'characters');
      console.log('   - Text length:', verifyTemplate.text_template?.length || 0, 'characters');
      console.log('   - Created:', verifyTemplate.created_at);
      console.log('   - Updated:', verifyTemplate.updated_at);

      // Check for key French content
      const hasFrenchGreeting = verifyTemplate.html_template.includes('Bonjour {{contact_name}}');
      const hasFrenchCTA = verifyTemplate.html_template.includes('Voir la démo');
      const hasFrenchSignature = verifyTemplate.html_template.includes('Fondateur et PDG');
      const hasLogo = verifyTemplate.html_template.includes('https://www.aveniraisolutions.ca/assets/logo.png');

      console.log('\n📋 French Content Verification:');
      console.log('   - Has French greeting:', hasFrenchGreeting);
      console.log('   - Has French CTA:', hasFrenchCTA);
      console.log('   - Has French signature:', hasFrenchSignature);
      console.log('   - Has logo:', hasLogo);

      if (hasFrenchGreeting && hasFrenchCTA && hasFrenchSignature && hasLogo) {
        console.log('\n🎉 French template created successfully with all required content!');
        console.log('✅ Template is ready for use');
        console.log('📧 French outreach emails can now be sent');
        console.log('🎨 Features included:');
        console.log('   • Complete French translation');
        console.log('   • Avenir AI logo with proper styling');
        console.log('   • French CTA buttons and links');
        console.log('   • Professional French signature');
        console.log('   • Mobile responsive design');
        console.log('   • Gmail-compatible table layout');
        console.log('   • Both HTML and plain text versions');
      } else {
        console.log('\n❌ Some French content may be missing');
      }
    }

    return insertedTemplate;

  } catch (error) {
    console.error('\n❌ Creation failed with error:', error.message);
    return null;
  }
}

// Run the creation
if (require.main === module) {
  createFrenchTemplate();
}

module.exports = { createFrenchTemplate };
