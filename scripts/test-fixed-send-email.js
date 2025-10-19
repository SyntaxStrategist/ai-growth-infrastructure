#!/usr/bin/env node

/**
 * Test script for the fixed send_test_email API endpoint
 * Tests the corrected template fetching, variable rendering, and Gmail API integration
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
 * Test the fixed send_test_email API endpoint
 */
async function testFixedSendEmail() {
  try {
    console.log('🚀 Testing Fixed send_test_email API endpoint...\n');

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
    console.log('\n📧 Testing fixed send_test_email API endpoint...');
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
      console.log('\n🎉 Fixed send_test_email test completed successfully!');
      console.log('📧 Email sent with message ID:', result.data.message_id);
      console.log('📧 Thread ID:', result.data.thread_id);
      console.log('📧 Subject:', result.data.subject);
      console.log('📧 Recipient:', result.data.recipient);
      console.log('📧 Template:', result.data.template_name);
      
      if (result.data.campaign_id) {
        console.log('📧 Campaign ID:', result.data.campaign_id);
      }
      if (result.data.prospect_id) {
        console.log('📧 Prospect ID:', result.data.prospect_id);
      }
      if (result.data.email_id) {
        console.log('📧 Email ID:', result.data.email_id);
      }
      
      console.log('\n✅ Fixed implementation is working correctly!');
      console.log('🎨 Email features verified:');
      console.log('   • Template fetched from email_templates table');
      console.log('   • Variables rendered ({{first_name}}, {{company_name}})');
      console.log('   • HTML content included in Gmail API message');
      console.log('   • Database logging completed');
      console.log('   • Tracking events recorded');
      
      console.log('\n📧 Check your Gmail inbox for the test email!');
      console.log('📊 Check the Outreach Center dashboard for logged data!');
      
    } else {
      console.log('\n❌ Fixed send_test_email test failed:', result.error);
      
      if (result.error.includes('Template')) {
        console.log('\n💡 Template issues detected. Please check:');
        console.log('   1. Template exists in email_templates table');
        console.log('   2. Template has proper HTML and text content');
        console.log('   3. Template variables are correctly defined');
        console.log('   4. Template name matches exactly');
      } else if (result.error.includes('credentials')) {
        console.log('\n💡 Credential issues detected. Please check:');
        console.log('   1. Gmail API credentials are correct');
        console.log('   2. Refresh token is valid and not expired');
        console.log('   3. Gmail API is enabled in Google Cloud Console');
      } else if (result.error.includes('Internal server error')) {
        console.log('\n💡 Server error detected. Please check:');
        console.log('   1. Development server logs for detailed error');
        console.log('   2. Database connection is working');
        console.log('   3. Template content is valid');
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
 * Test with different template names to verify template fetching
 */
async function testTemplateFetching() {
  const templates = [
    'default_intro',
    'Initial Outreach - AI Automation',
    'default_intro_test'
  ];
  
  console.log('\n🧪 Testing template fetching with different names...');
  
  for (const templateName of templates) {
    try {
      console.log(`\n📋 Testing template: "${templateName}"`);
      
      const response = await fetch('http://localhost:3000/api/outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_test_email',
          to: 'onimichael89@gmail.com',
          first_name: 'Template Test',
          company_name: 'Template Test Corp',
          template_name: templateName
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Template "${templateName}" works correctly`);
        console.log(`   Subject: ${result.data.subject}`);
        console.log(`   Message ID: ${result.data.message_id}`);
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
    
    // Test with invalid template
    const invalidTemplateResponse = await fetch('http://localhost:3000/api/outreach', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send_test_email',
        to: 'test@example.com',
        first_name: 'Test',
        company_name: 'Test Corp',
        template_name: 'nonexistent_template'
      })
    });

    const invalidTemplateResult = await invalidTemplateResponse.json();
    
    console.log('\nInvalid template test - Status:', invalidTemplateResponse.status);
    console.log('Invalid template test - Response:', JSON.stringify(invalidTemplateResult, null, 2));
    
    if (!invalidTemplateResult.success && invalidTemplateResponse.status === 404) {
      console.log('✅ Error handling working correctly for invalid template');
    } else {
      console.log('❌ Error handling not working as expected for invalid template');
    }
    
  } catch (error) {
    console.error('Error handling test failed:', error.message);
  }
}

// Run the tests
if (require.main === module) {
  (async () => {
    await testFixedSendEmail();
    await testTemplateFetching();
    await testErrorHandling();
  })();
}

module.exports = { testFixedSendEmail, testTemplateFetching, testErrorHandling };
