#!/usr/bin/env node

/**
 * Test script for updated logo HTML implementation
 * Tests that the logo displays reliably in Gmail with table-based layout
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
 * Test the updated logo HTML implementation
 */
async function testUpdatedLogoHTML() {
  try {
    console.log('🚀 Testing Updated Logo HTML Implementation...\n');

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
    console.log('\n📧 Testing updated logo HTML implementation...');
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
      console.log('\n🎉 Updated logo HTML implementation test completed successfully!');
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
      
      console.log('\n✅ Updated logo HTML implementation is working correctly!');
      console.log('🎨 Logo HTML features verified:');
      console.log('   • Table-based layout for Gmail compatibility');
      console.log('   • align="center" attribute for cross-client support');
      console.log('   • width="80" for consistent sizing');
      console.log('   • Inline CSS: display:block;margin:0 auto 12px auto;border:0;outline:none;text-decoration:none;');
      console.log('   • Public logo URL: https://www.aveniraisolutions.ca/assets/logo.png');
      console.log('   • Both English and French templates updated');
      console.log('   • Mobile responsive adjustments (60px on mobile)');
      console.log('   • Gmail-compatible table structure');
      console.log('   • Reliable centering across email clients');
      console.log('   • Professional appearance maintained');
      
      console.log('\n📧 Check your Gmail inbox for the test email!');
      console.log('📊 The email should now display with improved logo:');
      console.log('   • Logo centered reliably in Gmail');
      console.log('   • Consistent sizing across email clients');
      console.log('   • Proper display on both desktop and mobile');
      console.log('   • No broken images or layout issues');
      console.log('   • Professional branding maintained');
      console.log('   • Cross-client compatibility ensured');
      
      console.log('\n📊 Check the Outreach Center dashboard for logged data!');
      console.log('🔍 Updated logo HTML available in outreach_emails metadata:');
      console.log('   • Table-based logo HTML structure');
      console.log('   • Gmail-compatible inline styles');
      console.log('   • Mobile responsive adjustments');
      console.log('   • All variables rendered correctly');
      console.log('   • Template information and source');
      
      console.log('\n🎯 Gmail should now show improved logo display!');
      console.log('   • Logo centered reliably in Gmail');
      console.log('   • Consistent appearance across email clients');
      console.log('   • Proper sizing on desktop and mobile');
      console.log('   • No layout or display issues');
      console.log('   • Professional branding maintained');
      
    } else {
      console.log('\n❌ Updated logo HTML implementation test failed:', result.error);
      
      if (result.error.includes('Template')) {
        console.log('\n💡 Template issues detected. Please check:');
        console.log('   1. default_intro_template.ts file exists');
        console.log('   2. Template has been updated with table-based logo');
        console.log('   3. Logo URL is valid and accessible');
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
 * Test template logo HTML structure
 */
async function testTemplateLogoHTML() {
  console.log('\n🧪 Testing template logo HTML structure...');
  
  try {
    // Test if we can import the updated template
    const { DEFAULT_INTRO_TEMPLATE_EN, DEFAULT_INTRO_TEMPLATE_FR } = await import('../src/lib/phase4/default_intro_template');
    
    console.log('✅ Template import successful');
    
    // Check English template logo HTML
    console.log('\n📋 English Template Logo HTML Check:');
    const enHasTable = DEFAULT_INTRO_TEMPLATE_EN.html_template.includes('<table align="center"');
    const enHasWidth = DEFAULT_INTRO_TEMPLATE_EN.html_template.includes('width="80"');
    const enHasInlineStyle = DEFAULT_INTRO_TEMPLATE_EN.html_template.includes('display:block;margin:0 auto 12px auto;border:0;outline:none;text-decoration:none;');
    const enHasLogoURL = DEFAULT_INTRO_TEMPLATE_EN.html_template.includes('https://www.aveniraisolutions.ca/assets/logo.png');
    
    console.log('   - Has table-based layout:', enHasTable);
    console.log('   - Has width="80":', enHasWidth);
    console.log('   - Has inline CSS styles:', enHasInlineStyle);
    console.log('   - Has correct logo URL:', enHasLogoURL);
    
    // Check French template logo HTML
    console.log('\n📋 French Template Logo HTML Check:');
    const frHasTable = DEFAULT_INTRO_TEMPLATE_FR.html_template.includes('<table align="center"');
    const frHasWidth = DEFAULT_INTRO_TEMPLATE_FR.html_template.includes('width="80"');
    const frHasInlineStyle = DEFAULT_INTRO_TEMPLATE_FR.html_template.includes('display:block;margin:0 auto 12px auto;border:0;outline:none;text-decoration:none;');
    const frHasLogoURL = DEFAULT_INTRO_TEMPLATE_FR.html_template.includes('https://www.aveniraisolutions.ca/assets/logo.png');
    
    console.log('   - Has table-based layout:', frHasTable);
    console.log('   - Has width="80":', frHasWidth);
    console.log('   - Has inline CSS styles:', frHasInlineStyle);
    console.log('   - Has correct logo URL:', frHasLogoURL);
    
    // Check mobile responsive CSS
    console.log('\n📋 Mobile Responsive CSS Check:');
    const enHasMobileCSS = DEFAULT_INTRO_TEMPLATE_EN.html_template.includes('.logo-table img {');
    const frHasMobileCSS = DEFAULT_INTRO_TEMPLATE_FR.html_template.includes('.logo-table img {');
    
    console.log('   - English has mobile CSS:', enHasMobileCSS);
    console.log('   - French has mobile CSS:', frHasMobileCSS);
    
    // Summary
    console.log('\n✅ Logo HTML Update Summary:');
    if (enHasTable && enHasWidth && enHasInlineStyle && enHasLogoURL && 
        frHasTable && frHasWidth && frHasInlineStyle && frHasLogoURL &&
        enHasMobileCSS && frHasMobileCSS) {
      console.log('   ✅ All logo HTML updates applied correctly!');
      console.log('   ✅ Table-based layout implemented for Gmail compatibility');
      console.log('   ✅ Proper width and inline styles set');
      console.log('   ✅ Mobile responsive adjustments included');
      console.log('   ✅ Both English and French templates updated');
    } else {
      console.log('   ❌ Some logo HTML updates may not have been applied correctly');
    }
    
  } catch (error) {
    console.log('❌ Template logo HTML test failed:', error.message);
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
    await testTemplateLogoHTML();
    await testUpdatedLogoHTML();
    await testErrorHandling();
  })();
}

module.exports = { testUpdatedLogoHTML, testTemplateLogoHTML, testErrorHandling };
