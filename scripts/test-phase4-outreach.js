#!/usr/bin/env node

/**
 * Phase 4: Automated Outreach Engine Test Script
 * Tests the outreach system components and database integration
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPhase4Implementation() {
  console.log('🚀 Testing Phase 4: Automated Outreach Engine Implementation\n');

  try {
    // Test 1: Database Tables
    console.log('📊 Testing Database Tables...');
    await testDatabaseTables();

    // Test 2: API Endpoints
    console.log('\n🔗 Testing API Endpoints...');
    await testAPIEndpoints();

    // Test 3: File Structure
    console.log('\n📁 Testing File Structure...');
    await testFileStructure();

    // Test 4: Integration
    console.log('\n🔧 Testing Integration...');
    await testIntegration();

    console.log('\n✅ Phase 4 implementation test completed successfully!');

  } catch (error) {
    console.error('\n❌ Phase 4 test failed:', error.message);
    process.exit(1);
  }
}

async function testDatabaseTables() {
  const tables = [
    'email_templates',
    'outreach_campaigns', 
    'outreach_emails',
    'outreach_tracking',
    'outreach_metrics'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table} table not accessible: ${error.message}`);
      } else {
        console.log(`✅ ${table} table accessible`);
      }
    } catch (error) {
      console.log(`❌ ${table} table not accessible: ${error.message}`);
    }
  }
}

async function testAPIEndpoints() {
  const endpoints = [
    { url: '/api/outreach?action=campaigns', method: 'GET' },
    { url: '/api/outreach?action=email_templates', method: 'GET' },
    { url: '/api/outreach', method: 'POST', body: { action: 'create_campaign', name: 'Test Campaign' } }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint.url}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
      });

      if (response.ok) {
        console.log(`✅ ${endpoint.method} ${endpoint.url} - OK`);
      } else {
        console.log(`⚠️  ${endpoint.method} ${endpoint.url} - ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.method} ${endpoint.url} - ${error.message}`);
    }
  }
}

async function testFileStructure() {
  const fs = require('fs');
  const path = require('path');

  const requiredFiles = [
    'src/lib/phase4/outreach_engine.ts',
    'src/lib/phase4/gmail_integration.ts',
    'src/lib/phase4/email_templates.ts',
    'src/lib/phase4/outreach_tracking.ts',
    'src/app/api/outreach/route.ts',
    'src/app/api/gmail-webhook/route.ts',
    'src/components/dashboard/OutreachCenter.tsx',
    'supabase/migrations/20241227_create_phase4_outreach_tables.sql'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  }
}

async function testIntegration() {
  try {
    // Test email templates
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('*')
      .limit(5);

    if (templatesError) {
      console.log(`❌ Email templates not accessible: ${templatesError.message}`);
    } else {
      console.log(`✅ Email templates accessible (${templates?.length || 0} templates)`);
    }

    // Test outreach campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('outreach_campaigns')
      .select('*')
      .limit(5);

    if (campaignsError) {
      console.log(`❌ Outreach campaigns not accessible: ${campaignsError.message}`);
    } else {
      console.log(`✅ Outreach campaigns accessible (${campaigns?.length || 0} campaigns)`);
    }

    // Test outreach emails
    const { data: emails, error: emailsError } = await supabase
      .from('outreach_emails')
      .select('*')
      .limit(5);

    if (emailsError) {
      console.log(`❌ Outreach emails not accessible: ${emailsError.message}`);
    } else {
      console.log(`✅ Outreach emails accessible (${emails?.length || 0} emails)`);
    }

  } catch (error) {
    console.log(`❌ Integration test failed: ${error.message}`);
  }
}

// Run the test
testPhase4Implementation();
