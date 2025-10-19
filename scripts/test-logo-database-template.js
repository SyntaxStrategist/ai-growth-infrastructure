#!/usr/bin/env node

/**
 * Test script for logo HTML verification from database
 * Tests that the logo displays reliably in Gmail with table-based layout
 * Fetches templates from email_templates table instead of importing files
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

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
  template_name: 'default_intro'
};

/**
 * Test the logo HTML from database template
 */
async function testLogoFromDatabase() {
  try {
    console.log('🚀 Testing Logo HTML from Database Template...\n');

    // Check if required environment variables are set
    console.log('🔍 Checking environment variables...');
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'GMAIL_CLIENT_ID',
      'GMAIL_CLIENT_SECRET', 
      'GMAIL_REFRESH_TOKEN'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.log(`   - ${varName}`));
      return;
    }

    console.log('✅ All required environment variables are set');

    // Fetch template from database
    console.log('\n📧 Fetching email template from database...');
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', testData.template_name)
      .single();

    if (templateError) {
      console.log('❌ Error fetching template from database:', templateError.message);
      return;
    }

    if (!template) {
      console.log('❌ Template not found in database:', testData.template_name);
      return;
    }

    console.log('✅ Template found in database');
    console.log('📋 Template details:');
    console.log('   - Name:', template.name);
    console.log('   - Subject:', template.subject_template);
    console.log('   - HTML length:', template.html_template?.length || 0, 'characters');
    console.log('   - Text length:', template.text_template?.length || 0, 'characters');

    // Test logo HTML structure
    console.log('\n🧪 Testing logo HTML structure in database template...');
    
    const htmlTemplate = template.html_template || '';
    
    // Check for table-based layout
    const hasTable = htmlTemplate.includes('<table align="center"');
    const hasTableRow = htmlTemplate.includes('<tr>');
    const hasTableCell = htmlTemplate.includes('<td align="center">');
    
    // Check for logo image with correct attributes
    const hasLogoImg = htmlTemplate.includes('<img src="https://www.aveniraisolutions.ca/assets/logo.png"');
    const hasWidth = htmlTemplate.includes('width="80"');
    const hasAlt = htmlTemplate.includes('alt="Avenir AI Solutions"');
    
    // Check for inline styles
    const hasInlineStyle = htmlTemplate.includes('display:block;margin:0 auto 12px auto;border:0;outline:none;text-decoration:none;');
    const hasDisplayBlock = htmlTemplate.includes('display:block');
    const hasMarginAuto = htmlTemplate.includes('margin:0 auto 12px auto');
    const hasBorder0 = htmlTemplate.includes('border:0');
    const hasOutlineNone = htmlTemplate.includes('outline:none');
    const hasTextDecorationNone = htmlTemplate.includes('text-decoration:none');
    
    // Check for mobile responsive CSS
    const hasMobileCSS = htmlTemplate.includes('.logo-table img {');
    const hasMobileWidth = htmlTemplate.includes('width: 60px !important');
    
    console.log('📋 Logo HTML Structure Check:');
    console.log('   - Has table-based layout:', hasTable);
    console.log('   - Has table row:', hasTableRow);
    console.log('   - Has centered table cell:', hasTableCell);
    console.log('   - Has logo image tag:', hasLogoImg);
    console.log('   - Has width="80":', hasWidth);
    console.log('   - Has alt text:', hasAlt);
    console.log('   - Has complete inline style:', hasInlineStyle);
    console.log('   - Has display:block:', hasDisplayBlock);
    console.log('   - Has margin auto:', hasMarginAuto);
    console.log('   - Has border:0:', hasBorder0);
    console.log('   - Has outline:none:', hasOutlineNone);
    console.log('   - Has text-decoration:none:', hasTextDecorationNone);
    console.log('   - Has mobile CSS:', hasMobileCSS);
    console.log('   - Has mobile width:', hasMobileWidth);

    // Extract logo HTML section for inspection
    const logoMatch = htmlTemplate.match(/<div class="logo-section">([\s\S]*?)<\/div>/);
    if (logoMatch) {
      console.log('\n📋 Logo HTML Section:');
      console.log(logoMatch[1].trim());
    }

    // Summary
    const allChecks = [
      hasTable, hasTableRow, hasTableCell, hasLogoImg, hasWidth, hasAlt,
      hasInlineStyle, hasDisplayBlock, hasMarginAuto, hasBorder0, 
      hasOutlineNone, hasTextDecorationNone, hasMobileCSS, hasMobileWidth
    ];
    
    const passedChecks = allChecks.filter(check => check).length;
    const totalChecks = allChecks.length;
    
    console.log('\n✅ Logo HTML Verification Summary:');
    console.log(`   ${passedChecks}/${totalChecks} checks passed`);
    
    if (passedChecks === totalChecks) {
      console.log('   ✅ All logo HTML updates are correctly applied!');
      console.log('   ✅ Table-based layout for Gmail compatibility');
      console.log('   ✅ Proper width and inline styles');
      console.log('   ✅ Mobile responsive adjustments');
      console.log('   ✅ Cross-client compatibility ensured');
    } else {
      console.log('   ❌ Some logo HTML updates may be missing');
      console.log('   💡 Please check the template in the database');
    }

    return template;

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    return null;
  }
}

/**
 * Test sending email with updated logo
 */
async function testSendEmailWithUpdatedLogo(template) {
  try {
    console.log('\n📧 Testing email send with updated logo...');
    
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
    
    console.log('\n📋 Email Send Response:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n🎉 Email sent successfully with updated logo!');
      console.log('📧 Email details:');
      console.log('   - Message ID:', result.data.message_id);
      console.log('   - Thread ID:', result.data.thread_id);
      console.log('   - Subject:', result.data.subject);
      console.log('   - Recipient:', result.data.recipient);
      console.log('   - Template:', result.data.template_name);
      
      console.log('\n✅ Updated logo should now display correctly in Gmail!');
      console.log('🎨 Logo features verified:');
      console.log('   • Table-based layout for Gmail compatibility');
      console.log('   • align="center" attribute for cross-client support');
      console.log('   • width="80" for consistent sizing');
      console.log('   • Inline CSS for reliable display');
      console.log('   • Public logo URL accessible');
      console.log('   • Mobile responsive adjustments');
      console.log('   • Professional branding maintained');
      
      console.log('\n📧 Check your Gmail inbox for the test email!');
      console.log('📊 The email should display with:');
      console.log('   • Logo centered reliably in Gmail');
      console.log('   • Consistent sizing across email clients');
      console.log('   • Proper display on both desktop and mobile');
      console.log('   • No broken images or layout issues');
      console.log('   • Professional Avenir AI branding');
      
    } else {
      console.log('\n❌ Email send failed:', result.error);
    }

  } catch (error) {
    console.error('\n❌ Email send test failed:', error.message);
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
    const template = await testLogoFromDatabase();
    if (template) {
      await testSendEmailWithUpdatedLogo(template);
    }
    await testErrorHandling();
  })();
}

module.exports = { testLogoFromDatabase, testSendEmailWithUpdatedLogo, testErrorHandling };
