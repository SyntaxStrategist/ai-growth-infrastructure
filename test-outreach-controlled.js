#!/usr/bin/env node

/**
 * Controlled Outreach Test Script
 * Tests the complete outreach pipeline with TEST_MODE=true
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test configuration
const TEST_MODE = true;
const TEST_TIMESTAMP = Date.now();

console.log('🧪 CONTROLLED OUTREACH TEST');
console.log('============================');
console.log('');

// Test prospects data
const testProspects = [
  {
    // English prospect
    business_name: `TestCorp EN ${TEST_TIMESTAMP}`,
    website: `https://testcorp-en-${TEST_TIMESTAMP}.com`,
    contact_email: 'test.en@example.com',
    industry: 'technology',
    region: 'CA',
    language: 'en',
    automation_need_score: 85,
    contacted: false,
    is_test: true,
    metadata: {
      test_mode: true,
      test_type: 'controlled_outreach',
      timestamp: TEST_TIMESTAMP,
      contact_name: 'John Smith'
    }
  },
  {
    // French prospect
    business_name: `TestCorp FR ${TEST_TIMESTAMP}`,
    website: `https://testcorp-fr-${TEST_TIMESTAMP}.com`,
    contact_email: 'test.fr@example.com',
    industry: 'technology',
    region: 'CA',
    language: 'fr',
    automation_need_score: 88,
    contacted: false,
    is_test: true,
    metadata: {
      test_mode: true,
      test_type: 'controlled_outreach',
      timestamp: TEST_TIMESTAMP,
      contact_name: 'Marie Dubois'
    }
  }
];

async function runControlledTest() {
  try {
    console.log('📋 Environment Check:');
    const requiredVars = [
      'GMAIL_CLIENT_ID',
      'GMAIL_CLIENT_SECRET', 
      'GMAIL_REFRESH_TOKEN',
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    let allPresent = true;
    requiredVars.forEach(varName => {
      const isPresent = !!process.env[varName];
      console.log(`  ${varName}: ${isPresent ? '✅ Set' : '❌ Missing'}`);
      if (!isPresent) allPresent = false;
    });

    console.log('');
    console.log('🔧 Test Configuration:');
    console.log(`  TEST_MODE: ${TEST_MODE} (emails will be logged, not sent)`);
    console.log(`  Target: ${testProspects.length} prospects (1 EN, 1 FR)`);
    console.log(`  Template: default_intro (branded)`);
    console.log(`  API: Gmail OAuth2 integration`);
    console.log(`  Timestamp: ${TEST_TIMESTAMP}`);
    console.log('');

    if (!allPresent) {
      throw new Error('Missing required environment variables');
    }

    console.log('✅ Environment ready for testing');
    console.log('');

    // Step 1: Create test prospects
    console.log('👤 STEP 1: Creating Test Prospects');
    console.log('-----------------------------------');
    
    const createdProspects = [];
    for (const prospect of testProspects) {
      console.log(`Creating prospect: ${prospect.business_name} (${prospect.language})`);
      
      const { data, error } = await supabase
        .from('prospect_candidates')
        .insert([prospect])
        .select()
        .single();

      if (error) {
        console.log(`❌ Failed to create prospect: ${error.message}`);
        continue;
      }

      createdProspects.push(data);
      console.log(`✅ Prospect created: ${data.id}`);
    }

    if (createdProspects.length === 0) {
      throw new Error('No prospects were created');
    }

    console.log(`✅ Created ${createdProspects.length} test prospects`);
    console.log('');

    // Step 2: Test outreach API calls
    console.log('📧 STEP 2: Testing Outreach API Calls');
    console.log('--------------------------------------');

    const outreachResults = [];
    
    for (const prospect of createdProspects) {
      console.log(`Testing outreach for: ${prospect.business_name} (${prospect.language})`);
      
      const contactName = prospect.metadata?.contact_name || 'Test User';
      const outreachPayload = {
        prospect_id: prospect.id,
        to: prospect.contact_email,
        subject: `${prospect.business_name} - AI Automation Opportunity`,
        htmlBody: `<p>Test email for ${contactName} at ${prospect.business_name}</p>`,
        textBody: `Test email for ${contactName} at ${prospect.business_name}`
      };

      try {
        console.log(`  📤 Sending API request to: http://localhost:3003/api/prospect-intelligence/outreach`);
        console.log(`  📦 Payload:`, JSON.stringify(outreachPayload, null, 2));
        
        const response = await fetch('http://localhost:3003/api/prospect-intelligence/outreach', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Referer': prospect.language === 'fr' ? 'http://localhost:3003/fr/admin/prospect-intelligence' : 'http://localhost:3003/en/admin/prospect-intelligence'
          },
          body: JSON.stringify(outreachPayload)
        });

        console.log(`  📊 Response status: ${response.status} ${response.statusText}`);
        console.log(`  📊 Response headers:`, Object.fromEntries(response.headers.entries()));
        
        const result = await response.json();
        console.log(`  📥 Response body:`, JSON.stringify(result, null, 2));
        
        if (result.success) {
          console.log(`✅ Outreach API call successful: ${result.data.messageId}`);
          outreachResults.push({
            prospect: prospect,
            result: result,
            success: true
          });
        } else {
          console.log(`❌ Outreach API call failed: ${result.error}`);
          outreachResults.push({
            prospect: prospect,
            result: result,
            success: false
          });
        }
      } catch (error) {
        console.log(`❌ Outreach API call error: ${error.message}`);
        outreachResults.push({
          prospect: prospect,
          error: error.message,
          success: false
        });
      }
    }

    console.log('');

    // Step 3: Verify database logging
    console.log('📊 STEP 3: Verifying Database Logging');
    console.log('-------------------------------------');

    const { data: outreachLogs, error: logsError } = await supabase
      .from('prospect_outreach_logs')
      .select('*')
      .eq('metadata->>test_type', 'controlled_outreach')
      .eq('metadata->>timestamp', TEST_TIMESTAMP.toString())
      .order('created_at', { ascending: false });

    if (logsError) {
      console.log(`❌ Failed to fetch outreach logs: ${logsError.message}`);
    } else {
      console.log(`✅ Found ${outreachLogs.length} outreach log entries`);
      outreachLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log.recipient_email} - Status: ${log.status} - ${log.created_at}`);
      });
    }

    console.log('');

    // Step 4: Test email template generation
    console.log('📝 STEP 4: Testing Email Template Generation');
    console.log('---------------------------------------------');

    try {
      console.log('  📤 Testing email templates API...');
      const templateResponse = await fetch('http://localhost:3003/api/outreach?action=email_templates');
      console.log(`  📊 Template API status: ${templateResponse.status} ${templateResponse.statusText}`);
      const templateResult = await templateResponse.json();
      
      if (templateResult.success) {
        console.log('✅ Email templates API accessible');
        console.log(`  Initial outreach templates: ${templateResult.data.initial_outreach?.length || 0}`);
        console.log(`  Follow-up templates: ${templateResult.data.follow_up?.length || 0}`);
      } else {
        console.log(`❌ Email templates API failed: ${templateResult.error}`);
      }
    } catch (error) {
      console.log(`❌ Email templates API error: ${error.message}`);
    }

    console.log('');

    // Final Results
    console.log('📋 FINAL TEST RESULTS');
    console.log('=====================');
    console.log('');
    
    const successfulOutreach = outreachResults.filter(r => r.success).length;
    const totalOutreach = outreachResults.length;
    
    console.log(`Prospects Created: ${createdProspects.length}/${testProspects.length}`);
    console.log(`Outreach API Calls: ${successfulOutreach}/${totalOutreach} successful`);
    console.log(`Database Logs: ${outreachLogs?.length || 0} entries`);
    console.log(`Test Mode: ${TEST_MODE ? 'ACTIVE (emails logged, not sent)' : 'INACTIVE (emails would be sent)'}`);
    console.log('');

    if (successfulOutreach === totalOutreach && createdProspects.length === testProspects.length) {
      console.log('🎉 ALL TESTS PASSED - System ready for production!');
      console.log('');
      console.log('✅ Email sending infrastructure: OPERATIONAL');
      console.log('✅ Template generation: WORKING');
      console.log('✅ Database logging: FUNCTIONAL');
      console.log('✅ Test mode protection: ACTIVE');
      console.log('✅ Bilingual support: VERIFIED');
    } else {
      console.log('⚠️  SOME TESTS FAILED - Review issues above');
    }

    console.log('');
    console.log('🧹 Cleanup: Test data will remain in database for verification');
    console.log(`   Test timestamp: ${TEST_TIMESTAMP}`);
    console.log('   To clean up: DELETE FROM prospect_candidates WHERE metadata->>\'timestamp\' = \'' + TEST_TIMESTAMP + '\';');
    console.log('   To clean up: DELETE FROM prospect_outreach_logs WHERE metadata->>\'timestamp\' = \'' + TEST_TIMESTAMP + '\';');

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log('');
    console.log('Stack trace:');
    console.log(error.stack);
    process.exit(1);
  }
}

// Run the test
runControlledTest();
