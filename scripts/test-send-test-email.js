#!/usr/bin/env node

/**
 * Test script for the new send_test_email API endpoint
 * Tests the /api/outreach POST endpoint with send_test_email action
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
  to: 'onimichael89@gmail.com',
  first_name: 'Michael',
  company_name: 'Test Greatness',
  template_name: 'default_intro_test' // Use the template we created earlier
};

/**
 * Test the send_test_email API endpoint
 */
async function testSendTestEmail() {
  try {
    console.log('🚀 Testing send_test_email API endpoint...\n');

    // First, check if the template exists
    console.log('📋 Checking if template exists...');
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', testData.template_name)
      .single();

    if (templateError || !template) {
      console.log('❌ Template not found, creating one...');
      
      // Create the template if it doesn't exist
      const { data: newTemplate, error: createError } = await supabase
        .from('email_templates')
        .insert([{
          name: testData.template_name,
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

      if (createError) {
        throw new Error(`Failed to create template: ${createError.message}`);
      }
      
      console.log('✅ Template created:', newTemplate.id);
    } else {
      console.log('✅ Template found:', template.id);
    }

    // Test the API endpoint
    console.log('\n📧 Testing send_test_email API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/outreach', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send_test_email',
        ...testData
      })
    });

    const result = await response.json();
    
    console.log('\n📋 API Response:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n🎉 Test completed successfully!');
      console.log('📧 Email sent with message ID:', result.data.message_id);
      console.log('📧 Thread ID:', result.data.thread_id);
      console.log('📧 Subject:', result.data.subject);
      console.log('📧 Recipient:', result.data.recipient);
      
      // Check if records were created in database
      console.log('\n🔍 Verifying database records...');
      
      // Check outreach_emails
      const { data: emails, error: emailError } = await supabase
        .from('outreach_emails')
        .select('*')
        .eq('gmail_message_id', result.data.message_id);
      
      if (emailError) {
        console.log('❌ Error checking outreach_emails:', emailError.message);
      } else if (emails && emails.length > 0) {
        console.log('✅ Email record found in outreach_emails:', emails[0].id);
      } else {
        console.log('⚠️ No email record found in outreach_emails');
      }
      
      // Check outreach_tracking
      const { data: tracking, error: trackingError } = await supabase
        .from('outreach_tracking')
        .select('*')
        .eq('metadata->>gmail_message_id', result.data.message_id);
      
      if (trackingError) {
        console.log('❌ Error checking outreach_tracking:', trackingError.message);
      } else if (tracking && tracking.length > 0) {
        console.log('✅ Tracking event found in outreach_tracking:', tracking[0].id);
      } else {
        console.log('⚠️ No tracking event found in outreach_tracking');
      }
      
    } else {
      console.log('\n❌ Test failed:', result.error);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Test with invalid data to verify error handling
 */
async function testErrorHandling() {
  try {
    console.log('\n🧪 Testing error handling...');
    
    // Test with missing required fields
    const response = await fetch('http://localhost:3000/api/outreach', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send_test_email',
        to: 'test@example.com'
        // Missing first_name, company_name, template_name
      })
    });

    const result = await response.json();
    
    console.log('Error handling test - Status:', response.status);
    console.log('Error handling test - Response:', JSON.stringify(result, null, 2));
    
    if (!result.success && response.status === 400) {
      console.log('✅ Error handling working correctly');
    } else {
      console.log('❌ Error handling not working as expected');
    }
    
  } catch (error) {
    console.error('Error handling test failed:', error.message);
  }
}

// Run the tests
if (require.main === module) {
  (async () => {
    await testSendTestEmail();
    await testErrorHandling();
  })();
}

module.exports = { testSendTestEmail, testErrorHandling };
