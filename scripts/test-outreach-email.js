#!/usr/bin/env node

/**
 * Test script to send a live Gmail email using the Outreach Engine
 * Uses the default_intro template with custom variables
 */

const { createClient } = require('@supabase/supabase-js');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test data
const testData = {
  recipient: 'onimichael89@gmail.com',
  subject: 'Test – Avenir AI Outreach',
  variables: {
    first_name: 'Michael',
    company_name: 'Test Greatness',
    contact_name: 'Michael',
    contact_email: 'onimichael89@gmail.com',
    industry: 'technology',
    pain_points: 'lead generation challenges, manual prospect research, low conversion rates'
  }
};

/**
 * Initialize Gmail API
 */
async function initializeGmailAPI() {
  try {
    // Load credentials from environment or file
    const credentials = {
      type: "service_account",
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`
    };

    if (!credentials.private_key || !credentials.client_email) {
      throw new Error('Gmail API credentials not found in environment variables');
    }

    // Create JWT client
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/gmail.send']
    );

    // Authorize
    await auth.authorize();

    // Create Gmail API instance
    const gmail = google.gmail({ version: 'v1', auth });
    
    console.log('✅ Gmail API initialized successfully');
    return gmail;
  } catch (error) {
    console.error('❌ Failed to initialize Gmail API:', error.message);
    throw error;
  }
}

/**
 * Generate email content using the default_intro template
 */
function generateEmailContent(variables) {
  const template = {
    subject: `${variables.company_name} - AI Automation Opportunity`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${variables.company_name} - AI Automation Opportunity</title>
    <style>
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
            
            .logo-image {
                max-width: 90px !important;
            }
            
            .secondary-cta-text,
            .secondary-cta-link {
                font-size: 13px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div style="font-weight: 600; color: #0A2540; font-size: 14px;">Avenir AI Solutions &lt;contact@aveniraisolutions.ca&gt;</div>
            <div style="color: #666666; margin-top: 4px; font-size: 13px;">to: ${variables.contact_email}</div>
            <div style="font-weight: 600; color: #333333; margin-top: 8px; font-size: 14px;">${variables.company_name} - AI Automation Opportunity</div>
        </div>
        
        <div class="email-body">
            <div class="logo-section">
                <img src="https://aveniraisolutions.ca/assets/logos/logo.svg" alt="Avenir AI Solutions" class="logo-image">
                <div class="logo-text">Avenir AI</div>
                <div class="logo-tagline">Intelligent Growth Infrastructure</div>
            </div>
            
            <div class="content">
                <h2>Hi ${variables.contact_name},</h2>
                
                <p>I noticed <strong>${variables.company_name}</strong> is in the <strong>${variables.industry}</strong> space and likely dealing with <strong>${variables.pain_points}</strong>.</p>
                
                <p>We've helped similar companies in your industry achieve:</p>
                <ul>
                    <li><strong>3x higher lead conversion rates</strong> through AI-powered prospect scoring</li>
                    <li><strong>Automated prospect discovery</strong> that finds your ideal customers 24/7</li>
                    <li><strong>Intelligent outreach</strong> that gets 3x higher response rates</li>
                    <li><strong>Real-time lead analysis</strong> with intent, urgency, and confidence scoring</li>
                </ul>
                
                <p>Our AI systems analyze every interaction in real-time, turning conversations into conversions and data into growth.</p>
                
                <p>Would you be interested in a 15-minute call to discuss how AI automation could help <strong>${variables.company_name}</strong> generate more qualified leads and scale your growth?</p>
                
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
                        📱 +1 (555) 123-4567
                    </div>
                </div>
            </div>
        </div>
        
        <div class="email-footer">
            <p>This email was sent by Avenir AI Solutions. If you no longer wish to receive these emails, you can <a href="https://aveniraisolutions.ca/unsubscribe">unsubscribe here</a>.</p>
            <p style="margin-top: 8px; font-size: 11px; color: #999999;">
                Avenir AI Solutions | 123 Business Ave, Suite 100, Toronto, ON M5H 2N2
            </p>
        </div>
    </div>
</body>
</html>
    `,
    text: `
Hi ${variables.contact_name},

I noticed ${variables.company_name} is in the ${variables.industry} space and likely dealing with ${variables.pain_points}.

We've helped similar companies in your industry achieve:
- 3x higher lead conversion rates through AI-powered prospect scoring
- Automated prospect discovery that finds your ideal customers 24/7
- Intelligent outreach that gets 3x higher response rates
- Real-time lead analysis with intent, urgency, and confidence scoring

Our AI systems analyze every interaction in real-time, turning conversations into conversions and data into growth.

Would you be interested in a 15-minute call to discuss how AI automation could help ${variables.company_name} generate more qualified leads and scale your growth?

View Demo: https://www.aveniraisolutions.ca/demo

Or schedule a quick 10-minute chat with me: https://calendar.app.google/g4vdGJ6VdaZPj8nc7

I'd love to show you how we've helped companies like yours transform their lead generation process.

Best regards,

Michael Oni
Founder & CEO
Avenir AI Solutions
📧 contact@aveniraisolutions.ca
🌐 aveniraisolutions.ca
📱 +1 (555) 123-4567

---
This email was sent by Avenir AI Solutions. If you no longer wish to receive these emails, you can unsubscribe here: https://aveniraisolutions.ca/unsubscribe

Avenir AI Solutions | 123 Business Ave, Suite 100, Toronto, ON M5H 2N2
    `
  };

  return template;
}

/**
 * Create a test campaign in the database
 */
async function createTestCampaign() {
  try {
    const { data: campaign, error } = await supabase
      .from('outreach_campaigns')
      .insert([{
        campaign_name: 'Test Outreach Campaign',
        client_id: null, // Test campaign
        status: 'active',
        start_date: new Date().toISOString(),
        target_prospect_score_min: 0.7,
        settings: {
          test_mode: true,
          template: 'default_intro'
        }
      }])
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Test campaign created:', campaign.id);
    return campaign;
  } catch (error) {
    console.error('❌ Failed to create test campaign:', error.message);
    throw error;
  }
}

/**
 * Send email via Gmail API
 */
async function sendEmail(gmail, emailContent, recipient) {
  try {
    // Create email message
    const message = [
      `From: Avenir AI Solutions <contact@aveniraisolutions.ca>`,
      `To: ${recipient}`,
      `Subject: ${emailContent.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      emailContent.html
    ].join('\n');

    // Encode message
    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    // Send email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log('✅ Email sent successfully:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    throw error;
  }
}

/**
 * Log email in outreach_emails table
 */
async function logOutreachEmail(campaignId, recipient, emailContent, gmailMessageId) {
  try {
    const { data: email, error } = await supabase
      .from('outreach_emails')
      .insert([{
        campaign_id: campaignId,
        prospect_id: null, // Test email
        template_id: null, // Using default template
        sender_email: 'contact@aveniraisolutions.ca',
        recipient_email: recipient,
        subject: emailContent.subject,
        body: emailContent.html,
        status: 'sent',
        sent_at: new Date().toISOString(),
        thread_id: gmailMessageId,
        message_id: gmailMessageId,
        metadata: {
          test_mode: true,
          template: 'default_intro',
          variables: testData.variables
        }
      }])
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Email logged in outreach_emails:', email.id);
    return email;
  } catch (error) {
    console.error('❌ Failed to log email:', error.message);
    throw error;
  }
}

/**
 * Log tracking event in outreach_tracking table
 */
async function logTrackingEvent(emailId, eventType, metadata = {}) {
  try {
    const { data: tracking, error } = await supabase
      .from('outreach_tracking')
      .insert([{
        outreach_email_id: emailId,
        event_type: eventType,
        event_timestamp: new Date().toISOString(),
        metadata: {
          test_mode: true,
          ...metadata
        }
      }])
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Tracking event logged:', tracking.id);
    return tracking;
  } catch (error) {
    console.error('❌ Failed to log tracking event:', error.message);
    throw error;
  }
}

/**
 * Main test function
 */
async function runOutreachTest() {
  try {
    console.log('🚀 Starting Outreach Engine Test...\n');

    // Step 1: Initialize Gmail API
    console.log('📧 Initializing Gmail API...');
    const gmail = await initializeGmailAPI();

    // Step 2: Create test campaign
    console.log('\n📋 Creating test campaign...');
    const campaign = await createTestCampaign();

    // Step 3: Generate email content
    console.log('\n📝 Generating email content...');
    const emailContent = generateEmailContent(testData.variables);
    console.log('✅ Email content generated with variables:', testData.variables);

    // Step 4: Send email via Gmail API
    console.log('\n📤 Sending email via Gmail API...');
    const gmailResponse = await sendEmail(gmail, emailContent, testData.recipient);

    // Step 5: Log email in database
    console.log('\n💾 Logging email in database...');
    const emailRecord = await logOutreachEmail(
      campaign.id,
      testData.recipient,
      emailContent,
      gmailResponse.id
    );

    // Step 6: Log tracking events
    console.log('\n📊 Logging tracking events...');
    await logTrackingEvent(emailRecord.id, 'email_sent', {
      gmail_message_id: gmailResponse.id,
      template: 'default_intro'
    });

    // Step 7: Summary
    console.log('\n🎉 Outreach Engine Test Completed Successfully!');
    console.log('\n📋 Test Summary:');
    console.log(`   • Campaign ID: ${campaign.id}`);
    console.log(`   • Email ID: ${emailRecord.id}`);
    console.log(`   • Gmail Message ID: ${gmailResponse.id}`);
    console.log(`   • Recipient: ${testData.recipient}`);
    console.log(`   • Subject: ${testData.subject}`);
    console.log(`   • Template: default_intro`);
    console.log(`   • Variables: ${JSON.stringify(testData.variables, null, 2)}`);

    console.log('\n✅ All activities logged in outreach_emails and outreach_tracking tables');
    console.log('📧 Check your Gmail inbox for the test email!');

  } catch (error) {
    console.error('\n❌ Outreach Engine Test Failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  runOutreachTest();
}

module.exports = { runOutreachTest };
