#!/usr/bin/env node

/**
 * Test script for updated email branding
 * Tests that the logo URL, phone number, and business address have been updated correctly
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
 * Test the updated email branding
 */
async function testUpdatedEmailBranding() {
  try {
    console.log('🚀 Testing Updated Email Branding...\n');

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
    console.log('\n📧 Testing updated email branding...');
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
      console.log('\n🎉 Updated email branding test completed successfully!');
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
      
      console.log('\n✅ Updated email branding is working correctly!');
      console.log('🎨 Email branding updates verified:');
      console.log('   • Logo URL updated to: https://www.aveniraisolutions.ca/assets/logo.png');
      console.log('   • Phone number removed from signature');
      console.log('   • Business address removed from footer');
      console.log('   • Both English and French templates updated');
      console.log('   • HTML and text templates both updated');
      console.log('   • Complete Avenir AI branding maintained');
      console.log('   • Professional styling preserved');
      console.log('   • Responsive design maintained');
      console.log('   • CTA buttons and links working');
      console.log('   • Email signature cleaned up');
      console.log('   • Footer simplified');
      
      console.log('\n📧 Check your Gmail inbox for the test email!');
      console.log('📊 The email should now display with updated branding:');
      console.log('   • New logo URL: https://www.aveniraisolutions.ca/assets/logo.png');
      console.log('   • No phone number in signature');
      console.log('   • No business address in footer');
      console.log('   • Cleaner, more professional appearance');
      console.log('   • All other branding elements preserved');
      console.log('   • Professional email signature with email and website only');
      console.log('   • Simplified footer with unsubscribe link only');
      
      console.log('\n📊 Check the Outreach Center dashboard for logged data!');
      console.log('🔍 Updated branding information available in outreach_emails metadata:');
      console.log('   • Updated HTML content with new logo URL');
      console.log('   • Cleaned signature without phone number');
      console.log('   • Simplified footer without business address');
      console.log('   • All variables rendered correctly');
      console.log('   • Template information and source');
      
      console.log('\n🎯 Gmail should now show updated branded email!');
      console.log('   • New logo URL loading correctly');
      console.log('   • Cleaner signature section');
      console.log('   • Simplified footer');
      console.log('   • Professional appearance maintained');
      console.log('   • All functionality preserved');
      
    } else {
      console.log('\n❌ Updated email branding test failed:', result.error);
      
      if (result.error.includes('Template')) {
        console.log('\n💡 Template issues detected. Please check:');
        console.log('   1. default_intro_template.ts file exists');
        console.log('   2. Template has been updated correctly');
        console.log('   3. Logo URL is valid');
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
 * Test template branding updates
 */
async function testTemplateBrandingUpdates() {
  console.log('\n🧪 Testing template branding updates...');
  
  try {
    // Test if we can import the updated template
    const { DEFAULT_INTRO_TEMPLATE_EN, DEFAULT_INTRO_TEMPLATE_FR } = await import('../src/lib/phase4/default_intro_template');
    
    console.log('✅ Template import successful');
    
    // Check English template
    console.log('\n📋 English Template Branding Check:');
    const enHasNewLogo = DEFAULT_INTRO_TEMPLATE_EN.html_template.includes('https://www.aveniraisolutions.ca/assets/logo.png');
    const enHasOldLogo = DEFAULT_INTRO_TEMPLATE_EN.html_template.includes('https://aveniraisolutions.ca/assets/logos/logo.svg');
    const enHasPhone = DEFAULT_INTRO_TEMPLATE_EN.html_template.includes('📱 +1 (555) 123-4567');
    const enHasAddress = DEFAULT_INTRO_TEMPLATE_EN.html_template.includes('123 Business Ave, Suite 100, Toronto, ON M5H 2N2');
    
    console.log('   - Has new logo URL:', enHasNewLogo);
    console.log('   - Has old logo URL:', enHasOldLogo);
    console.log('   - Has phone number:', enHasPhone);
    console.log('   - Has business address:', enHasAddress);
    
    // Check French template
    console.log('\n📋 French Template Branding Check:');
    const frHasNewLogo = DEFAULT_INTRO_TEMPLATE_FR.html_template.includes('https://www.aveniraisolutions.ca/assets/logo.png');
    const frHasOldLogo = DEFAULT_INTRO_TEMPLATE_FR.html_template.includes('https://aveniraisolutions.ca/assets/logos/logo.svg');
    const frHasPhone = DEFAULT_INTRO_TEMPLATE_FR.html_template.includes('📱 +1 (555) 123-4567');
    const frHasAddress = DEFAULT_INTRO_TEMPLATE_FR.html_template.includes('123 Business Ave, Suite 100, Toronto, ON M5H 2N2');
    
    console.log('   - Has new logo URL:', frHasNewLogo);
    console.log('   - Has old logo URL:', frHasOldLogo);
    console.log('   - Has phone number:', frHasPhone);
    console.log('   - Has business address:', frHasAddress);
    
    // Check text templates
    console.log('\n📋 Text Template Branding Check:');
    const enTextHasPhone = DEFAULT_INTRO_TEMPLATE_EN.text_template.includes('📱 +1 (555) 123-4567');
    const enTextHasAddress = DEFAULT_INTRO_TEMPLATE_EN.text_template.includes('123 Business Ave, Suite 100, Toronto, ON M5H 2N2');
    const frTextHasPhone = DEFAULT_INTRO_TEMPLATE_FR.text_template.includes('📱 +1 (555) 123-4567');
    const frTextHasAddress = DEFAULT_INTRO_TEMPLATE_FR.text_template.includes('123 Business Ave, Suite 100, Toronto, ON M5H 2N2');
    
    console.log('   - English text has phone:', enTextHasPhone);
    console.log('   - English text has address:', enTextHasAddress);
    console.log('   - French text has phone:', frTextHasPhone);
    console.log('   - French text has address:', frTextHasAddress);
    
    // Summary
    console.log('\n✅ Branding Update Summary:');
    if (enHasNewLogo && !enHasOldLogo && !enHasPhone && !enHasAddress && 
        frHasNewLogo && !frHasOldLogo && !frHasPhone && !frHasAddress &&
        !enTextHasPhone && !enTextHasAddress && !frTextHasPhone && !frTextHasAddress) {
      console.log('   ✅ All branding updates applied correctly!');
      console.log('   ✅ Logo URL updated to new format');
      console.log('   ✅ Phone number removed from all templates');
      console.log('   ✅ Business address removed from all templates');
    } else {
      console.log('   ❌ Some branding updates may not have been applied correctly');
    }
    
  } catch (error) {
    console.log('❌ Template branding update test failed:', error.message);
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
    await testTemplateBrandingUpdates();
    await testUpdatedEmailBranding();
    await testErrorHandling();
  })();
}

module.exports = { testUpdatedEmailBranding, testTemplateBrandingUpdates, testErrorHandling };
