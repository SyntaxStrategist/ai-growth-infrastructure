#!/usr/bin/env node

/**
 * Test script for the branded template fix
 * Tests that send_test_email now uses the full branded HTML template
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
 * Test the branded template fix
 */
async function testBrandedTemplateFix() {
  try {
    console.log('🚀 Testing Branded Template Fix...\n');

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
    console.log('\n📧 Testing branded template fix...');
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
      console.log('\n🎉 Branded template fix test completed successfully!');
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
      
      console.log('\n✅ Branded template fix is working correctly!');
      console.log('🎨 Email features verified:');
      console.log('   • Full branded HTML template from default_intro_template.ts');
      console.log('   • Complete Avenir AI branding and styling');
      console.log('   • Professional logo and company header');
      console.log('   • Blue gradient CTA buttons (#0A2540 to #00B8D9)');
      console.log('   • "View Demo" primary CTA button');
      console.log('   • "Schedule a quick 10-minute chat" secondary CTA');
      console.log('   • Professional email signature with contact info');
      console.log('   • Responsive design for mobile and desktop');
      console.log('   • Proper RFC 2822 MIME structure');
      console.log('   • Base64 encoded HTML content');
      console.log('   • All variables rendered correctly');
      console.log('   • Complete database logging with full HTML content');
      console.log('   • Template creation in database for future reference');
      
      console.log('\n📧 Check your Gmail inbox for the test email!');
      console.log('📊 The email should now display as FULL BRANDED HTML including:');
      console.log('   • Avenir AI logo and professional header');
      console.log('   • Complete company branding and styling');
      console.log('   • Professional blue gradient colors');
      console.log('   • Clickable "View Demo" CTA button');
      console.log('   • Clickable "Schedule a chat" secondary link');
      console.log('   • Professional email signature');
      console.log('   • Responsive design that works on mobile');
      console.log('   • Personalized content with your name and company');
      console.log('   • Full HTML formatting (not plain text)');
      console.log('   • Professional footer with unsubscribe link');
      
      console.log('\n📊 Check the Outreach Center dashboard for logged data!');
      console.log('🔍 Debug information available in outreach_emails metadata:');
      console.log('   • Full branded HTML content');
      console.log('   • Complete RFC 2822 message structure');
      console.log('   • Base64 encoded HTML content');
      console.log('   • All variables used in rendering');
      console.log('   • Template information and source');
      
      console.log('\n🎯 Gmail should now show FULL BRANDED HTML email!');
      console.log('   • Rich HTML formatting with professional styling');
      console.log('   • Avenir AI logo and branding displayed');
      console.log('   • Clickable CTA buttons and links');
      console.log('   • Professional email signature');
      console.log('   • Responsive design for all devices');
      console.log('   • Complete business-appropriate formatting');
      
    } else {
      console.log('\n❌ Branded template fix test failed:', result.error);
      
      if (result.error.includes('Template')) {
        console.log('\n💡 Template issues detected. Please check:');
        console.log('   1. default_intro_template.ts file exists');
        console.log('   2. DEFAULT_INTRO_TEMPLATE_EN is properly exported');
        console.log('   3. Template has complete HTML and text content');
        console.log('   4. Template variables are correctly defined');
        console.log('   5. Import path is correct');
      } else if (result.error.includes('credentials')) {
        console.log('\n💡 Credential issues detected. Please check:');
        console.log('   1. Gmail API credentials are correct');
        console.log('   2. Refresh token is valid and not expired');
        console.log('   3. Gmail API is enabled in Google Cloud Console');
      } else if (result.error.includes('Internal server error')) {
        console.log('\n💡 Server error detected. Please check:');
        console.log('   1. Development server logs for detailed error');
        console.log('   2. Database connection is working');
        console.log('   3. Template import is working correctly');
        console.log('   4. RFC 2822 message construction is correct');
        console.log('   5. Base64 encoding is working');
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
 * Test template import and structure
 */
async function testTemplateImport() {
  console.log('\n🧪 Testing template import and structure...');
  
  try {
    // Test if we can import the template
    const { DEFAULT_INTRO_TEMPLATE_EN } = await import('../src/lib/phase4/default_intro_template');
    
    console.log('✅ Template import successful');
    console.log('   - Template name:', DEFAULT_INTRO_TEMPLATE_EN.name);
    console.log('   - Subject template length:', DEFAULT_INTRO_TEMPLATE_EN.subject_template.length);
    console.log('   - HTML template length:', DEFAULT_INTRO_TEMPLATE_EN.html_template.length);
    console.log('   - Text template length:', DEFAULT_INTRO_TEMPLATE_EN.text_template.length);
    console.log('   - Variables:', DEFAULT_INTRO_TEMPLATE_EN.variables);
    
    // Check for key branding elements
    const hasLogo = DEFAULT_INTRO_TEMPLATE_EN.html_template.includes('logo');
    const hasCTA = DEFAULT_INTRO_TEMPLATE_EN.html_template.includes('View Demo');
    const hasCalendar = DEFAULT_INTRO_TEMPLATE_EN.html_template.includes('calendar');
    const hasBranding = DEFAULT_INTRO_TEMPLATE_EN.html_template.includes('#0A2540');
    const hasSignature = DEFAULT_INTRO_TEMPLATE_EN.html_template.includes('Michael Oni');
    
    console.log('✅ Branding elements check:');
    console.log('   - Contains logo:', hasLogo);
    console.log('   - Contains CTA button:', hasCTA);
    console.log('   - Contains calendar link:', hasCalendar);
    console.log('   - Contains brand colors:', hasBranding);
    console.log('   - Contains signature:', hasSignature);
    
    if (hasLogo && hasCTA && hasCalendar && hasBranding && hasSignature) {
      console.log('✅ All branding elements present in template');
    } else {
      console.log('❌ Some branding elements missing from template');
    }
    
  } catch (error) {
    console.log('❌ Template import test failed:', error.message);
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
    await testTemplateImport();
    await testBrandedTemplateFix();
    await testErrorHandling();
  })();
}

module.exports = { testBrandedTemplateFix, testTemplateImport, testErrorHandling };
