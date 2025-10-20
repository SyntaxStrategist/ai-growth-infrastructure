#!/usr/bin/env node

/**
 * Test script to check Supabase connection and basic operations
 */

const BASE_URL = 'https://www.aveniraisolutions.ca';
const TEST_CLIENT_EMAIL = 'test-client@aveniraisolutions.ca';
const TEST_CLIENT_PASSWORD = 'TestClient2025!';

async function testSupabase() {
  console.log('🔍 Testing Supabase connection...');
  console.log('==================================');
  
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
    
    // Step 2: Test a simple lead creation with minimal data
    console.log('\n2. Testing simple lead creation...');
    
    const simpleLead = {
      name: 'Simple Test',
      email: 'simple-test@example.com',
      message: 'Simple test message',
      api_key: authResult.data.apiKey
    };
    
    console.log('📤 Simple lead data:', simpleLead);
    
    const leadResponse = await fetch(`${BASE_URL}/api/lead`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': authResult.data.apiKey
      },
      body: JSON.stringify(simpleLead)
    });
    
    const leadResult = await leadResponse.json();
    
    console.log('📥 Lead creation response:');
    console.log('  Status:', leadResponse.status);
    console.log('  Success:', leadResult.success);
    console.log('  Lead ID:', leadResult.leadId);
    console.log('  Message:', leadResult.message);
    console.log('  Error:', leadResult.error);
    
    // Step 3: Check if we can get any leads at all
    console.log('\n3. Checking if any leads exist...');
    
    const allLeadsResponse = await fetch(`${BASE_URL}/api/client/leads?clientId=${clientId}&locale=en&status=active&page=1&limit=100`);
    const allLeadsResult = await allLeadsResponse.json();
    
    console.log('📊 All leads response:');
    console.log('  Status:', allLeadsResponse.status);
    console.log('  Success:', allLeadsResult.success);
    console.log('  Lead Count:', allLeadsResult.data?.length || 0);
    console.log('  Error:', allLeadsResult.error);
    
    // Step 4: Try to get leads without client filter
    console.log('\n4. Checking leads without client filter...');
    
    const noFilterResponse = await fetch(`${BASE_URL}/api/client/leads?locale=en&status=active&page=1&limit=100`);
    const noFilterResult = await noFilterResponse.json();
    
    console.log('📊 No filter response:');
    console.log('  Status:', noFilterResponse.status);
    console.log('  Success:', noFilterResult.success);
    console.log('  Lead Count:', noFilterResult.data?.length || 0);
    console.log('  Error:', noFilterResult.error);
    
    // Step 5: Summary
    console.log('\n📋 SUPABASE TEST SUMMARY');
    console.log('========================');
    console.log(`Client ID: ${clientId}`);
    console.log(`Lead Creation Status: ${leadResponse.status}`);
    console.log(`Lead Creation Success: ${leadResult.success}`);
    console.log(`Lead ID Returned: ${leadResult.leadId || 'None'}`);
    console.log(`Leads with Client Filter: ${allLeadsResult.data?.length || 0}`);
    console.log(`Leads without Client Filter: ${noFilterResult.data?.length || 0}`);
    
    if (leadResult.leadId) {
      console.log('\n✅ SUCCESS: Lead ID was returned!');
    } else {
      console.log('\n❌ ISSUE: Lead ID was not returned');
      console.log('This suggests the upsertLeadWithHistory function is failing.');
    }
    
    if (allLeadsResult.data?.length > 0) {
      console.log('\n✅ SUCCESS: Leads found with client filter!');
    } else if (noFilterResult.data?.length > 0) {
      console.log('\n⚠️  WARNING: Leads found without client filter but not with client filter');
      console.log('This suggests an issue with the client_id association.');
    } else {
      console.log('\n❌ ISSUE: No leads found at all');
      console.log('This suggests the leads are not being created in the database.');
    }
    
  } catch (error) {
    console.error('❌ Supabase test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testSupabase();
