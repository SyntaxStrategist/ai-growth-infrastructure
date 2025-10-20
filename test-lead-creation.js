#!/usr/bin/env node

/**
 * Test script to create a lead and check the database directly
 */

const BASE_URL = 'https://www.aveniraisolutions.ca';
const TEST_CLIENT_EMAIL = 'test-client@aveniraisolutions.ca';
const TEST_CLIENT_PASSWORD = 'TestClient2025!';

async function testLeadCreation() {
  console.log('🧪 Testing lead creation process...');
  
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
    const apiKey = authResult.data.apiKey;
    console.log(`✅ Client authenticated: ${clientId}`);
    console.log(`✅ API Key: ${apiKey.substring(0, 20)}...`);
    
    // Step 2: Create a test lead with detailed logging
    console.log('\n2. Creating test lead with detailed logging...');
    const testLead = {
      name: 'Database Test Lead',
      email: 'db-test@example.com',
      message: 'This is a test lead to verify database operations are working correctly.',
      timestamp: new Date().toISOString(),
      api_key: apiKey
    };
    
    console.log('📤 Sending lead to API...');
    console.log('   Payload:', JSON.stringify(testLead, null, 2));
    
    const leadResponse = await fetch(`${BASE_URL}/api/lead`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(testLead)
    });
    
    const leadResult = await leadResponse.json();
    
    console.log('📥 API Response:');
    console.log('   Status:', leadResponse.status);
    console.log('   Success:', leadResult.success);
    console.log('   Lead ID:', leadResult.leadId);
    console.log('   Message:', leadResult.message);
    
    if (leadResponse.ok && leadResult.success) {
      console.log('✅ Test lead created successfully');
      
      // Wait for processing
      console.log('\n3. Waiting for processing...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 3: Check if the lead appears in the dashboard
      console.log('\n4. Checking dashboard...');
      const dashboardResponse = await fetch(`${BASE_URL}/api/client/leads?clientId=${clientId}&locale=en&status=active&page=1&limit=20`);
      const dashboardResult = await dashboardResponse.json();
      
      console.log('📊 Dashboard Response:');
      console.log('   Status:', dashboardResponse.status);
      console.log('   Success:', dashboardResult.success);
      console.log('   Lead Count:', dashboardResult.data?.length || 0);
      
      if (dashboardResult.data && dashboardResult.data.length > 0) {
        console.log('✅ Leads found in dashboard!');
        dashboardResult.data.forEach((lead, index) => {
          console.log(`   ${index + 1}. ${lead.name} (${lead.email}) - ${lead.intent || 'No intent'}`);
        });
      } else {
        console.log('❌ No leads found in dashboard');
        if (dashboardResult.error) {
          console.log('   Error:', dashboardResult.error);
        }
      }
      
    } else {
      console.log('❌ Test lead creation failed');
      console.log('   Error:', leadResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLeadCreation();
