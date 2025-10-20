#!/usr/bin/env node

/**
 * Minimal test to identify why upsertLeadWithHistory is failing
 */

const BASE_URL = 'https://www.aveniraisolutions.ca';

async function minimalTest() {
  console.log('🧪 Running minimal lead test...');
  console.log('===============================\n');
  
  try {
    // Authenticate
    console.log('1. Authenticating...');
    const authResponse = await fetch(`${BASE_URL}/api/client/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-client@aveniraisolutions.ca',
        password: 'TestClient2025!'
      })
    });
    
    const authResult = await authResponse.json();
    if (!authResponse.ok || !authResult.success) {
      throw new Error(`Auth failed: ${authResult.error}`);
    }
    
    console.log(`✅ Authenticated: ${authResult.data.clientId}\n`);
    
    // Create minimal lead
    console.log('2. Creating minimal lead...');
    const leadData = {
      name: 'Minimal Test',
      email: `test-${Date.now()}@example.com`,
      message: 'Minimal test message for debugging',
      api_key: authResult.data.apiKey
    };
    
    console.log('Lead data:', JSON.stringify(leadData, null, 2));
    
    const leadResponse = await fetch(`${BASE_URL}/api/lead`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': authResult.data.apiKey
      },
      body: JSON.stringify(leadData)
    });
    
    const leadResult = await leadResponse.json();
    
    console.log('\nResponse:');
    console.log(`  Status: ${leadResponse.status}`);
    console.log(`  Success: ${leadResult.success}`);
    console.log(`  Lead ID: ${leadResult.leadId || 'UNDEFINED'}`);
    console.log(`  Message: ${leadResult.message || 'N/A'}`);
    console.log(`  Error: ${leadResult.error || 'N/A'}`);
    console.log(`  Note: ${leadResult.note || 'N/A'}`);
    
    // Wait a moment then check dashboard
    console.log('\n3. Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('4. Checking dashboard...');
    const dashResponse = await fetch(`${BASE_URL}/api/client/leads?clientId=${authResult.data.clientId}&locale=en&status=active&page=1&limit=10`);
    const dashResult = await dashResponse.json();
    
    console.log(`  Leads found: ${dashResult.data?.length || 0}`);
    
    // Final diagnosis
    console.log('\n📋 DIAGNOSIS');
    console.log('=============');
    if (!leadResult.leadId) {
      console.log('❌ CONFIRMED: upsertLeadWithHistory is NOT returning leadId');
      console.log('   This means the function is failing BEFORE it can insert the lead');
      console.log('   OR it\'s throwing an error that\'s being caught and ignored');
      console.log('\n   Possible causes:');
      console.log('   1. Supabase client not properly initialized');
      console.log('   2. Database schema mismatch');
      console.log('   3. RLS policy blocking INSERT');
      console.log('   4. Invalid data type in newRecord');
    } else {
      console.log('✅ upsertLeadWithHistory IS returning leadId');
      console.log('   The issue must be in lead_actions creation or dashboard query');
    }
    
    if (dashResult.data?.length === 0) {
      console.log('\n❌ Dashboard shows 0 leads');
      console.log('   Either leads aren\'t being created OR lead_actions aren\'t being created');
    } else {
      console.log(`\n✅ Dashboard shows ${dashResult.data?.length} leads - WORKING!`);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

minimalTest();
