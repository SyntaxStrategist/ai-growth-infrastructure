#!/usr/bin/env node

/**
 * Debug script to test upsertLeadWithHistory function directly
 */

const BASE_URL = 'https://www.aveniraisolutions.ca';
const TEST_CLIENT_EMAIL = 'test-client@aveniraisolutions.ca';
const TEST_CLIENT_PASSWORD = 'TestClient2025!';

async function debugUpsert() {
  console.log('🔍 Debugging upsertLeadWithHistory function...');
  console.log('===============================================');
  
  try {
    // Step 1: Authenticate and get client info
    console.log('\n1. Authenticating test client...');
    const authResponse = await fetch(`${BASE_URL}/api/client/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_CLIENT_EMAIL,
        password: TEST_CLIENT_PASSWORD
      })
    });
    
    const authResult = await authResponse.json();
    
    if (!authResponse.ok || !authResult.success) {
      throw new Error(`Authentication failed: ${authResult.error}`);
    }
    
    const clientId = authResult.data.clientId;
    console.log(`✅ Client authenticated: ${clientId}`);
    
    // Step 2: Create a test lead with detailed logging
    console.log('\n2. Creating test lead with detailed logging...');
    
    const testLead = {
      name: 'Debug Test Lead',
      email: 'debug-test@example.com',
      message: 'This is a test lead for debugging the upsertLeadWithHistory function.',
      timestamp: new Date().toISOString(),
      api_key: authResult.data.apiKey
    };
    
    console.log('📤 Test lead data:', testLead);
    
    const leadResponse = await fetch(`${BASE_URL}/api/lead`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': authResult.data.apiKey
      },
      body: JSON.stringify(testLead)
    });
    
    const leadResult = await leadResponse.json();
    
    console.log('📥 Lead creation response:');
    console.log('  Status:', leadResponse.status);
    console.log('  Success:', leadResult.success);
    console.log('  Lead ID:', leadResult.leadId);
    console.log('  Message:', leadResult.message);
    console.log('  Error:', leadResult.error);
    
    // Step 3: Check if the lead was created in the database
    console.log('\n3. Checking if lead was created in database...');
    
    // Try to get the lead from the dashboard API
    const dashboardResponse = await fetch(`${BASE_URL}/api/client/leads?clientId=${clientId}&locale=en&status=active&page=1&limit=20`);
    const dashboardResult = await dashboardResponse.json();
    
    console.log('📊 Dashboard API response:');
    console.log('  Status:', dashboardResponse.status);
    console.log('  Success:', dashboardResult.success);
    console.log('  Lead Count:', dashboardResult.data?.length || 0);
    console.log('  Error:', dashboardResult.error);
    
    if (dashboardResult.data && dashboardResult.data.length > 0) {
      console.log('✅ Leads found in dashboard:');
      dashboardResult.data.forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.name} (${lead.email}) - ${lead.intent || 'No intent'}`);
      });
    } else {
      console.log('❌ No leads found in dashboard');
    }
    
    // Step 4: Summary
    console.log('\n📋 DEBUG SUMMARY');
    console.log('================');
    console.log(`Client ID: ${clientId}`);
    console.log(`Lead Creation Status: ${leadResponse.status}`);
    console.log(`Lead Creation Success: ${leadResult.success}`);
    console.log(`Lead ID Returned: ${leadResult.leadId || 'None'}`);
    console.log(`Dashboard Shows Leads: ${dashboardResult.data?.length || 0}`);
    
    if (leadResult.leadId) {
      console.log('\n✅ SUCCESS: Lead ID was returned!');
      console.log('The issue might be with the dashboard query or lead_actions creation.');
    } else {
      console.log('\n❌ ISSUE: Lead ID was not returned');
      console.log('This suggests the upsertLeadWithHistory function is failing.');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

debugUpsert();
