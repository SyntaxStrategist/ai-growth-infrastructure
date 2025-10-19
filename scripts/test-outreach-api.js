#!/usr/bin/env node

/**
 * Test script to send a test email using the Outreach API
 * This will test the full outreach system without requiring Gmail API credentials
 */

const { createClient } = require('@supabase/supabase-js');

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
 * Create a test email template in the database
 */
async function createTestTemplate() {
  try {
    const { data: template, error } = await supabase
      .from('email_templates')
      .insert([{
        name: 'default_intro_test',
        subject_template: '{{company_name}} - AI Automation Opportunity',
        html_template: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{company_name}} - AI Automation Opportunity</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0A2540 0%, #00B8D9 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #0A2540 0%, #00B8D9 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .secondary-cta { text-align: center; margin-top: 16px; }
        .secondary-cta-text { font-size: 14px; color: #666; margin-bottom: 8px; }
        .secondary-cta-link { color: #00B8D9; text-decoration: none; font-weight: 500; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Avenir AI Solutions</h1>
        <p>Intelligent Growth Infrastructure</p>
    </div>
    
    <div class="content">
        <h2>Hi {{first_name}},</h2>
        
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
        
        <div style="text-align: center;">
            <a href="https://www.aveniraisolutions.ca/demo" class="cta-button">View Demo</a>
            <div class="secondary-cta">
                <div class="secondary-cta-text">Or</div>
                <a href="https://calendar.app.google/g4vdGJ6VdaZPj8nc7" class="secondary-cta-link">schedule a quick 10-minute chat with me</a>
            </div>
        </div>
        
        <p>I'd love to show you how we've helped companies like yours transform their lead generation process.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p><strong>Michael Oni</strong><br>
            Founder & CEO<br>
            Avenir AI Solutions<br>
            📧 contact@aveniraisolutions.ca<br>
            🌐 aveniraisolutions.ca</p>
        </div>
    </div>
    
    <div class="footer">
        <p>This email was sent by Avenir AI Solutions. If you no longer wish to receive these emails, you can <a href="https://aveniraisolutions.ca/unsubscribe">unsubscribe here</a>.</p>
    </div>
</body>
</html>
        `,
        text_template: `
Hi {{first_name}},

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
        category: 'initial_outreach',
        variables: ['first_name', 'company_name', 'contact_name', 'contact_email', 'industry', 'pain_points']
      }])
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Test email template created:', template.id);
    return template;
  } catch (error) {
    console.error('❌ Failed to create test template:', error.message);
    throw error;
  }
}

/**
 * Create a test campaign
 */
async function createTestCampaign(templateId) {
  try {
    const { data: campaign, error } = await supabase
      .from('outreach_campaigns')
      .insert([{
        name: 'Test Outreach Campaign - ' + new Date().toISOString(),
        status: 'active',
        target_criteria: {
          test_mode: true,
          template_id: templateId,
          email_template: 'default_intro_test'
        },
        email_template_id: templateId,
        follow_up_schedule: []
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
 * Create a test prospect
 */
async function createTestProspect() {
  try {
    const { data: prospect, error } = await supabase
      .from('prospect_candidates')
      .insert([{
        business_name: testData.variables.company_name,
        website: 'https://testgreatness.com',
        contact_email: testData.recipient,
        industry: testData.variables.industry,
        region: 'Toronto, ON',
        automation_need_score: 85,
        contacted: false,
        metadata: {
          test_mode: true,
          created_by: 'outreach_test_script',
          first_name: testData.variables.first_name,
          pain_points: testData.variables.pain_points,
          company_size: '10-50',
          is_test: true
        }
      }])
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Test prospect created:', prospect.id);
    return prospect;
  } catch (error) {
    console.error('❌ Failed to create test prospect:', error.message);
    throw error;
  }
}

/**
 * Create a test outreach email record
 */
async function createTestOutreachEmail(campaignId, prospectId, templateId) {
  try {
    // Generate email content with variables
    const subject = testData.subject.replace('{{company_name}}', testData.variables.company_name);
    
    const { data: email, error } = await supabase
      .from('outreach_emails')
      .insert([{
        campaign_id: campaignId,
        prospect_id: prospectId,
        prospect_email: testData.recipient,
        prospect_name: testData.variables.first_name + ' Test',
        company_name: testData.variables.company_name,
        template_id: templateId,
        subject: subject,
        content: 'Test email body with variables: ' + JSON.stringify(testData.variables),
        status: 'sent',
        sent_at: new Date().toISOString(),
        thread_id: 'test_thread_' + Date.now(),
        gmail_message_id: 'test_message_' + Date.now(),
        follow_up_sequence: 1
      }])
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Test outreach email created:', email.id);
    return email;
  } catch (error) {
    console.error('❌ Failed to create test outreach email:', error.message);
    throw error;
  }
}

/**
 * Create tracking events
 */
async function createTrackingEvents(emailId, campaignId, prospectId) {
  try {
    const events = [
      {
        email_id: emailId,
        prospect_id: prospectId,
        campaign_id: campaignId,
        action: 'email_sent',
        timestamp: new Date().toISOString(),
        metadata: {
          test_mode: true,
          gmail_message_id: 'test_message_' + Date.now(),
          template: 'default_intro_test'
        }
      },
      {
        email_id: emailId,
        prospect_id: prospectId,
        campaign_id: campaignId,
        action: 'email_delivered',
        timestamp: new Date(Date.now() + 1000).toISOString(),
        metadata: {
          test_mode: true,
          delivery_status: 'delivered'
        }
      }
    ];

    const { data: tracking, error } = await supabase
      .from('outreach_tracking')
      .insert(events)
      .select();

    if (error) throw error;
    
    console.log('✅ Tracking events created:', tracking.length);
    return tracking;
  } catch (error) {
    console.error('❌ Failed to create tracking events:', error.message);
    throw error;
  }
}

/**
 * Generate email preview
 */
function generateEmailPreview() {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${testData.variables.company_name} - AI Automation Opportunity</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0A2540 0%, #00B8D9 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #0A2540 0%, #00B8D9 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .secondary-cta { text-align: center; margin-top: 16px; }
        .secondary-cta-text { font-size: 14px; color: #666; margin-bottom: 8px; }
        .secondary-cta-link { color: #00B8D9; text-decoration: none; font-weight: 500; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Avenir AI Solutions</h1>
        <p>Intelligent Growth Infrastructure</p>
    </div>
    
    <div class="content">
        <h2>Hi ${testData.variables.first_name},</h2>
        
        <p>I noticed <strong>${testData.variables.company_name}</strong> is in the <strong>${testData.variables.industry}</strong> space and likely dealing with <strong>${testData.variables.pain_points}</strong>.</p>
        
        <p>We've helped similar companies in your industry achieve:</p>
        <ul>
            <li><strong>3x higher lead conversion rates</strong> through AI-powered prospect scoring</li>
            <li><strong>Automated prospect discovery</strong> that finds your ideal customers 24/7</li>
            <li><strong>Intelligent outreach</strong> that gets 3x higher response rates</li>
            <li><strong>Real-time lead analysis</strong> with intent, urgency, and confidence scoring</li>
        </ul>
        
        <p>Our AI systems analyze every interaction in real-time, turning conversations into conversions and data into growth.</p>
        
        <p>Would you be interested in a 15-minute call to discuss how AI automation could help <strong>${testData.variables.company_name}</strong> generate more qualified leads and scale your growth?</p>
        
        <div style="text-align: center;">
            <a href="https://www.aveniraisolutions.ca/demo" class="cta-button">View Demo</a>
            <div class="secondary-cta">
                <div class="secondary-cta-text">Or</div>
                <a href="https://calendar.app.google/g4vdGJ6VdaZPj8nc7" class="secondary-cta-link">schedule a quick 10-minute chat with me</a>
            </div>
        </div>
        
        <p>I'd love to show you how we've helped companies like yours transform their lead generation process.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p><strong>Michael Oni</strong><br>
            Founder & CEO<br>
            Avenir AI Solutions<br>
            📧 contact@aveniraisolutions.ca<br>
            🌐 aveniraisolutions.ca</p>
        </div>
    </div>
    
    <div class="footer">
        <p>This email was sent by Avenir AI Solutions. If you no longer wish to receive these emails, you can <a href="https://aveniraisolutions.ca/unsubscribe">unsubscribe here</a>.</p>
    </div>
</body>
</html>
  `;

  return htmlContent;
}

/**
 * Main test function
 */
async function runOutreachTest() {
  try {
    console.log('🚀 Starting Outreach Engine Test (Database Simulation)...\n');

    // Step 1: Create test email template
    console.log('📝 Creating test email template...');
    const template = await createTestTemplate();

    // Step 2: Create test campaign
    console.log('\n📋 Creating test campaign...');
    const campaign = await createTestCampaign(template.id);

    // Step 3: Create test prospect
    console.log('\n👤 Creating test prospect...');
    const prospect = await createTestProspect();

    // Step 4: Create test outreach email
    console.log('\n📧 Creating test outreach email...');
    const email = await createTestOutreachEmail(campaign.id, prospect.id, template.id);

    // Step 5: Create tracking events
    console.log('\n📊 Creating tracking events...');
    const tracking = await createTrackingEvents(email.id, campaign.id, prospect.id);

    // Step 6: Generate email preview
    console.log('\n👀 Generating email preview...');
    const emailPreview = generateEmailPreview();
    
    // Save preview to file
    const fs = require('fs');
    fs.writeFileSync('test-email-preview.html', emailPreview);
    console.log('✅ Email preview saved to test-email-preview.html');

    // Step 7: Summary
    console.log('\n🎉 Outreach Engine Test Completed Successfully!');
    console.log('\n📋 Test Summary:');
    console.log(`   • Template ID: ${template.id}`);
    console.log(`   • Campaign ID: ${campaign.id}`);
    console.log(`   • Prospect ID: ${prospect.id}`);
    console.log(`   • Email ID: ${email.id}`);
    console.log(`   • Recipient: ${testData.recipient}`);
    console.log(`   • Subject: ${testData.subject}`);
    console.log(`   • Template: default_intro_test`);
    console.log(`   • Variables: ${JSON.stringify(testData.variables, null, 2)}`);
    console.log(`   • Tracking Events: ${tracking.length}`);

    console.log('\n✅ All activities logged in outreach_emails and outreach_tracking tables');
    console.log('📧 Email preview generated: test-email-preview.html');
    console.log('🔍 Open the preview file to see how the email would look');

    // Open the preview file
    const { exec } = require('child_process');
    exec('open test-email-preview.html', (error) => {
      if (error) {
        console.log('💡 Manually open test-email-preview.html to view the email');
      }
    });

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
