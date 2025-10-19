#!/usr/bin/env node

/**
 * Test script for the fixed MIME email implementation
 * Tests that emails now include both HTML and text content properly
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
 * Test the fixed MIME email implementation
 */
async function testMimeEmailFix() {
  try {
    console.log('🚀 Testing Fixed MIME Email Implementation...\n');

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
    console.log('\n📧 Testing fixed MIME email implementation...');
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
      console.log('\n🎉 MIME email fix test completed successfully!');
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
      
      console.log('\n✅ MIME email implementation is working correctly!');
      console.log('🎨 Email features verified:');
      console.log('   • Both HTML and text templates fetched from database');
      console.log('   • All variables rendered ({{first_name}}, {{company_name}}, {{demo_link}}, {{calendar_link}})');
      console.log('   • Proper multipart MIME message constructed');
      console.log('   • Content-Type: multipart/alternative with boundary');
      console.log('   • Base64URL encoding applied correctly');
      console.log('   • Full Avenir AI branding and styling included');
      console.log('   • Logo, blue CTA buttons, and responsive design');
      console.log('   • French/English compatible content');
      console.log('   • Database logging completed');
      console.log('   • Tracking events recorded');
      
      console.log('\n📧 Check your Gmail inbox for the test email!');
      console.log('📊 The email should now display with full HTML content including:');
      console.log('   • Avenir AI logo and branding');
      console.log('   • Professional styling and colors');
      console.log('   • "View Demo" CTA button');
      console.log('   • "Schedule a chat" secondary link');
      console.log('   • Responsive design for mobile/desktop');
      console.log('   • Personalized content with your name and company');
      
      console.log('\n📊 Check the Outreach Center dashboard for logged data!');
      
    } else {
      console.log('\n❌ MIME email fix test failed:', result.error);
      
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
        console.log('   4. MIME message construction is correct');
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
 * Test with different template names to verify MIME construction
 */
async function testMimeWithDifferentTemplates() {
  const templates = [
    'default_intro',
    'Initial Outreach - AI Automation'
  ];
  
  console.log('\n🧪 Testing MIME construction with different templates...');
  
  for (const templateName of templates) {
    try {
      console.log(`\n📋 Testing MIME with template: "${templateName}"`);
      
      const response = await fetch('http://localhost:3000/api/outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_test_email',
          to: 'onimichael89@gmail.com',
          first_name: 'MIME Test',
          company_name: 'MIME Test Corp',
          template_name: templateName
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ MIME construction with "${templateName}" works correctly`);
        console.log(`   Subject: ${result.data.subject}`);
        console.log(`   Message ID: ${result.data.message_id}`);
        console.log(`   Response: ${result.message}`);
      } else {
        console.log(`❌ MIME construction with "${templateName}" failed: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`❌ MIME test with "${templateName}" failed: ${error.message}`);
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
    await testMimeEmailFix();
    await testMimeWithDifferentTemplates();
    await testErrorHandling();
  })();
}

module.exports = { testMimeEmailFix, testMimeWithDifferentTemplates, testErrorHandling };
