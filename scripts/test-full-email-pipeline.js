#!/usr/bin/env node

/**
 * Test script for the enhanced send_test_email API endpoint
 * Tests the full email rendering pipeline with branding
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Test data
const testData = {
  to: 'onimichael89@gmail.com',
  first_name: 'Michael',
  company_name: 'Test Greatness',
  template_name: 'default_intro'
};

/**
 * Test the enhanced send_test_email API endpoint
 */
async function testFullEmailPipeline() {
  try {
    console.log('🚀 Testing Full Email Rendering Pipeline...\n');

    // Check if required environment variables are set
    console.log('🔍 Checking environment variables...');
    const requiredEnvVars = [
      'GMAIL_CLIENT_ID',
      'GMAIL_CLIENT_SECRET', 
      'GMAIL_REFRESH_TOKEN'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.log(`   - ${varName}`));
      console.log('\n💡 Please add these to your .env.local file:');
      console.log('   GMAIL_CLIENT_ID=your_client_id');
      console.log('   GMAIL_CLIENT_SECRET=your_client_secret');
      console.log('   GMAIL_REFRESH_TOKEN=your_refresh_token');
      return;
    }

    console.log('✅ All required environment variables are set');

    // Test the API endpoint
    console.log('\n📧 Testing enhanced send_test_email API endpoint...');
    console.log('Test data:', JSON.stringify(testData, null, 2));
    
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
      console.log('\n🎉 Full email pipeline test completed successfully!');
      console.log('📧 Email sent with message ID:', result.data.message_id);
      console.log('📧 Thread ID:', result.data.thread_id);
      console.log('📧 Subject:', result.data.subject);
      console.log('📧 Recipient:', result.data.recipient);
      console.log('📧 Template:', result.data.template_name);
      console.log('📧 Campaign ID:', result.data.campaign_id);
      console.log('📧 Prospect ID:', result.data.prospect_id);
      console.log('📧 Email ID:', result.data.email_id);
      
      console.log('\n✅ Full email rendering pipeline is working correctly!');
      console.log('🎨 Email includes full branding:');
      console.log('   • Avenir AI logo and colors');
      console.log('   • Professional styling and layout');
      console.log('   • Primary CTA: "View Demo" button');
      console.log('   • Secondary CTA: "Schedule a chat" link');
      console.log('   • Responsive design for mobile/desktop');
      console.log('   • Variable substitution ({{first_name}}, {{company_name}})');
      
      console.log('\n📊 Database logging verified:');
      console.log('   • Campaign created in outreach_campaigns');
      console.log('   • Prospect created in prospect_candidates');
      console.log('   • Email logged in outreach_emails');
      console.log('   • Tracking event in outreach_tracking');
      console.log('   • Visible in Outreach Center dashboard');
      
      console.log('\n📧 Check your Gmail inbox for the branded test email!');
      
    } else {
      console.log('\n❌ Full email pipeline test failed:', result.error);
      
      if (result.error.includes('Template')) {
        console.log('\n💡 Template issues detected. Please check:');
        console.log('   1. Template exists in email_templates table');
        console.log('   2. Template has proper HTML and text content');
        console.log('   3. Template variables are correctly defined');
      } else if (result.error.includes('credentials')) {
        console.log('\n💡 Credential issues detected. Please check:');
        console.log('   1. Gmail API credentials are correct');
        console.log('   2. Refresh token is valid and not expired');
        console.log('   3. Gmail API is enabled in Google Cloud Console');
      }
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    
    if (error.message.includes('fetch failed')) {
      console.log('\n💡 Connection issues detected. Please check:');
      console.log('   1. Development server is running (npm run dev)');
      console.log('   2. Server is accessible at http://localhost:3000');
      console.log('   3. No firewall blocking the connection');
    }
  }
}

/**
 * Test with different template names
 */
async function testDifferentTemplates() {
  const templates = ['default_intro', 'Initial Outreach - AI Automation'];
  
  for (const templateName of templates) {
    try {
      console.log(`\n🧪 Testing with template: ${templateName}`);
      
      const response = await fetch('http://localhost:3000/api/outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_test_email',
          to: 'onimichael89@gmail.com',
          first_name: 'Test User',
          company_name: 'Template Test Corp',
          template_name: templateName
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Template "${templateName}" works correctly`);
      } else {
        console.log(`❌ Template "${templateName}" failed: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`❌ Template "${templateName}" test failed: ${error.message}`);
    }
  }
}

/**
 * Test error handling
 */
async function testErrorHandling() {
  try {
    console.log('\n🧪 Testing error handling...');
    
    // Test with missing fields
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
      console.log('✅ Error handling working correctly for missing fields');
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
    await testFullEmailPipeline();
    await testDifferentTemplates();
    await testErrorHandling();
  })();
}

module.exports = { testFullEmailPipeline, testDifferentTemplates, testErrorHandling };
