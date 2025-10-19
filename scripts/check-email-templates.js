#!/usr/bin/env node

/**
 * Script to check email templates in the database
 * Looks for French version and lists all available templates
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
 * Check for French template and list all templates
 */
async function checkEmailTemplates() {
  try {
    console.log('🔍 Checking email templates in database...\n');

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

    // Check for French template specifically
    console.log('\n📧 Checking for French template (default_intro_fr)...');
    const { data: frenchTemplate, error: frenchError } = await supabase
      .from('email_templates')
      .select('id, name, language, subject_template, html_template, text_template, created_at, updated_at')
      .eq('name', 'default_intro_fr')
      .single();

    if (frenchError && frenchError.code !== 'PGRST116') {
      console.log('❌ Error checking for French template:', frenchError.message);
    } else if (frenchTemplate) {
      console.log('✅ French template found!');
      console.log('📋 French Template Details:');
      console.log('   - ID:', frenchTemplate.id);
      console.log('   - Name:', frenchTemplate.name);
      console.log('   - Language:', frenchTemplate.language || 'Not specified');
      console.log('   - Subject:', frenchTemplate.subject_template);
      console.log('   - HTML length:', frenchTemplate.html_template?.length || 0, 'characters');
      console.log('   - Text length:', frenchTemplate.text_template?.length || 0, 'characters');
      console.log('   - Created:', frenchTemplate.created_at);
      console.log('   - Updated:', frenchTemplate.updated_at);
    } else {
      console.log('❌ French template (default_intro_fr) not found');
    }

    // Get all templates in the table
    console.log('\n📋 Fetching all email templates...');
    const { data: allTemplates, error: allError } = await supabase
      .from('email_templates')
      .select('id, name, language, subject_template, html_template, text_template, created_at, updated_at')
      .order('name');

    if (allError) {
      console.log('❌ Error fetching all templates:', allError.message);
      return;
    }

    console.log(`✅ Found ${allTemplates.length} email template(s) in database:`);
    console.log('\n📋 All Available Templates:');
    
    if (allTemplates.length === 0) {
      console.log('   No templates found in the database');
    } else {
      allTemplates.forEach((template, index) => {
        console.log(`\n   ${index + 1}. Template Details:`);
        console.log(`      - ID: ${template.id}`);
        console.log(`      - Name: ${template.name}`);
        console.log(`      - Language: ${template.language || 'Not specified'}`);
        console.log(`      - Subject: ${template.subject_template}`);
        console.log(`      - HTML length: ${template.html_template?.length || 0} characters`);
        console.log(`      - Text length: ${template.text_template?.length || 0} characters`);
        console.log(`      - Created: ${template.created_at}`);
        console.log(`      - Updated: ${template.updated_at}`);
        
        // Show first 100 characters of HTML template
        if (template.html_template) {
          console.log(`      - HTML preview: ${template.html_template.substring(0, 100)}...`);
        }
      });
    }

    // Check for any templates with 'fr' in the name or language
    console.log('\n🔍 Checking for any French-related templates...');
    const frenchRelated = allTemplates.filter(template => 
      template.name.toLowerCase().includes('fr') || 
      template.language?.toLowerCase().includes('fr') ||
      template.name.toLowerCase().includes('french')
    );

    if (frenchRelated.length > 0) {
      console.log(`✅ Found ${frenchRelated.length} French-related template(s):`);
      frenchRelated.forEach((template, index) => {
        console.log(`   ${index + 1}. ${template.name} (${template.language || 'No language specified'})`);
      });
    } else {
      console.log('❌ No French-related templates found');
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   - Total templates: ${allTemplates.length}`);
    console.log(`   - French template (default_intro_fr): ${frenchTemplate ? '✅ Found' : '❌ Not found'}`);
    console.log(`   - French-related templates: ${frenchRelated.length}`);
    
    if (!frenchTemplate) {
      console.log('\n💡 Recommendations:');
      console.log('   - Create a French template (default_intro_fr) if needed');
      console.log('   - Set language field to "fr" for French templates');
      console.log('   - Consider creating bilingual template support');
    }

  } catch (error) {
    console.error('\n❌ Check failed with error:', error.message);
  }
}

// Run the check
if (require.main === module) {
  checkEmailTemplates();
}

module.exports = { checkEmailTemplates };
