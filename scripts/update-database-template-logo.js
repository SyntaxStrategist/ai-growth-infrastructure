#!/usr/bin/env node

/**
 * Script to update the email_templates table with proper logo HTML
 * Updates the default_intro template to include the Avenir AI logo
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Update the default_intro template with proper logo HTML
 */
async function updateTemplateWithLogo() {
  try {
    console.log('🚀 Updating email template with proper logo HTML...\n');

    // Check if required environment variables are set
    console.log('🔍 Checking environment variables...');
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.log(`   - ${varName}`));
      return;
    }

    console.log('✅ All required environment variables are set');

    // Fetch current template
    console.log('\n📧 Fetching current template from database...');
    const { data: currentTemplate, error: fetchError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'default_intro')
      .single();

    if (fetchError) {
      console.log('❌ Error fetching template from database:', fetchError.message);
      return;
    }

    if (!currentTemplate) {
      console.log('❌ Template not found in database: default_intro');
      return;
    }

    console.log('✅ Current template found');
    console.log('📋 Current template details:');
    console.log('   - Name:', currentTemplate.name);
    console.log('   - Subject:', currentTemplate.subject_template);
    console.log('   - HTML length:', currentTemplate.html_template?.length || 0, 'characters');
    console.log('   - Text length:', currentTemplate.text_template?.length || 0, 'characters');

    // Create the logo HTML snippet
    const logoHTML = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
  <tr>
    <td align="center">
      <img 
        src="https://www.aveniraisolutions.ca/assets/logo.png" 
        alt="Avenir AI Solutions" 
        width="80" 
        height="80" 
        style="display:block;margin:0 auto 12px auto;border:0;outline:none;text-decoration:none;" 
      />
    </td>
  </tr>
</table>`;

    // Get the current HTML template
    let currentHTML = currentTemplate.html_template || '';
    
    // Remove any existing logo or header content before "Hi {{first_name}},"
    // Look for the greeting line and remove everything before it
    const greetingMatch = currentHTML.match(/(.*?)(<h2>Hi \{\{first_name\}\},<\/h2>)/s);
    
    let updatedHTML;
    if (greetingMatch) {
      // Keep only the greeting and everything after it
      const greetingAndAfter = greetingMatch[2] + currentHTML.substring(greetingMatch[0].length);
      // Add the logo before the greeting
      updatedHTML = logoHTML + '\n\n' + greetingAndAfter;
    } else {
      // If no greeting found, just prepend the logo
      updatedHTML = logoHTML + '\n\n' + currentHTML;
    }

    console.log('\n📋 Logo HTML to be added:');
    console.log(logoHTML);
    
    console.log('\n📋 Updated HTML template preview (first 500 chars):');
    console.log(updatedHTML.substring(0, 500) + '...');

    // Update the template in the database
    console.log('\n💾 Updating template in database...');
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('email_templates')
      .update({
        html_template: updatedHTML,
        updated_at: new Date().toISOString()
      })
      .eq('name', 'default_intro')
      .select()
      .single();

    if (updateError) {
      console.log('❌ Error updating template in database:', updateError.message);
      return;
    }

    console.log('✅ Template updated successfully in database');
    console.log('📋 Updated template details:');
    console.log('   - Name:', updatedTemplate.name);
    console.log('   - Subject:', updatedTemplate.subject_template);
    console.log('   - HTML length:', updatedTemplate.html_template?.length || 0, 'characters');
    console.log('   - Text length:', updatedTemplate.text_template?.length || 0, 'characters');
    console.log('   - Updated at:', updatedTemplate.updated_at);

    // Verify the logo HTML is in the updated template
    console.log('\n🧪 Verifying logo HTML in updated template...');
    const hasLogoTable = updatedTemplate.html_template.includes('<table role="presentation"');
    const hasLogoImg = updatedTemplate.html_template.includes('src="https://www.aveniraisolutions.ca/assets/logo.png"');
    const hasLogoWidth = updatedTemplate.html_template.includes('width="80"');
    const hasLogoHeight = updatedTemplate.html_template.includes('height="80"');
    const hasLogoStyle = updatedTemplate.html_template.includes('display:block;margin:0 auto 12px auto;border:0;outline:none;text-decoration:none;');

    console.log('📋 Logo HTML Verification:');
    console.log('   - Has logo table:', hasLogoTable);
    console.log('   - Has logo image:', hasLogoImg);
    console.log('   - Has width="80":', hasLogoWidth);
    console.log('   - Has height="80":', hasLogoHeight);
    console.log('   - Has inline styles:', hasLogoStyle);

    if (hasLogoTable && hasLogoImg && hasLogoWidth && hasLogoHeight && hasLogoStyle) {
      console.log('\n🎉 Logo HTML successfully added to template!');
      console.log('✅ Template is ready for testing');
      console.log('📧 Logo will display at the top of emails');
      console.log('🎨 Logo features:');
      console.log('   • Table-based layout for Gmail compatibility');
      console.log('   • Centered alignment with role="presentation"');
      console.log('   • 80x80 pixel dimensions');
      console.log('   • Inline CSS for reliable display');
      console.log('   • Public logo URL accessible');
      console.log('   • Professional Avenir AI branding');
    } else {
      console.log('\n❌ Logo HTML verification failed');
      console.log('💡 Please check the template update');
    }

    return updatedTemplate;

  } catch (error) {
    console.error('\n❌ Update failed with error:', error.message);
    return null;
  }
}

/**
 * Test the updated template by sending an email
 */
async function testUpdatedTemplate() {
  try {
    console.log('\n📧 Testing updated template by sending email...');
    
    const testData = {
      to: 'onimichael89@gmail.com',
      first_name: 'Michael',
      company_name: 'Test Greatness',
      template_name: 'default_intro'
    };

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
      console.log('\n🎉 Test email sent successfully with updated logo!');
      console.log('📧 Email details:');
      console.log('   - Message ID:', result.data.message_id);
      console.log('   - Thread ID:', result.data.thread_id);
      console.log('   - Subject:', result.data.subject);
      console.log('   - Recipient:', result.data.recipient);
      console.log('   - Template:', result.data.template_name);
      
      console.log('\n✅ Updated logo should now display correctly in Gmail!');
      console.log('📧 Check your Gmail inbox for the test email!');
      console.log('📊 The email should display with:');
      console.log('   • Avenir AI logo at the top');
      console.log('   • Logo centered and properly sized (80x80)');
      console.log('   • Professional branding');
      console.log('   • Gmail-compatible table layout');
      console.log('   • Reliable display across email clients');
      
    } else {
      console.log('\n❌ Test email send failed:', result.error);
    }

  } catch (error) {
    console.error('\n❌ Test email send failed:', error.message);
  }
}

// Run the update
if (require.main === module) {
  (async () => {
    const updatedTemplate = await updateTemplateWithLogo();
    if (updatedTemplate) {
      await testUpdatedTemplate();
    }
  })();
}

module.exports = { updateTemplateWithLogo, testUpdatedTemplate };
