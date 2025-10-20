#!/usr/bin/env node

/**
 * Debug script to check lead_actions and lead_memory tables directly
 */

const BASE_URL = 'https://www.aveniraisolutions.ca';
const TEST_CLIENT_EMAIL = 'test-client@aveniraisolutions.ca';
const TEST_CLIENT_PASSWORD = 'TestClient2025!';

async function debugLeads() {
  console.log('🔍 Debugging lead data...');
  
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
    
    // Step 2: Check if we can resolve the client ID
    console.log('\n2. Testing client ID resolution...');
    try {
      const resolveResponse = await fetch(`${BASE_URL}/api/client/leads?clientId=${clientId}&locale=en&status=active&page=1&limit=1`);
      const resolveResult = await resolveResponse.json();
      
      if (resolveResponse.ok) {
        console.log('✅ Client ID resolution works');
      } else {
        console.log(`❌ Client ID resolution failed: ${resolveResult.error}`);
      }
    } catch (error) {
      console.log(`❌ Client ID resolution error: ${error.message}`);
    }
    
    // Step 3: Try to create a test lead directly
    console.log('\n3. Creating a test lead...');
    const testLead = {
      name: 'Debug Test Lead',
      email: 'debug-test@example.com',
      message: 'This is a debug test lead to verify the system is working.',
      timestamp: new Date().toISOString(),
      api_key: authResult.data.apiKey
    };
    
    const leadResponse = await fetch(`${BASE_URL}/api/lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testLead)
    });
    
    const leadResult = await leadResponse.json();
    
    if (leadResponse.ok && leadResult.success) {
      console.log('✅ Test lead created successfully');
      console.log(`   Lead ID: ${leadResult.leadId}`);
      
      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 4: Check if the lead appears in the client dashboard
      console.log('\n4. Checking if test lead appears in dashboard...');
      const checkResponse = await fetch(`${BASE_URL}/api/client/leads?clientId=${clientId}&locale=en&status=active&page=1&limit=20`);
      const checkResult = await checkResponse.json();
      
      if (checkResponse.ok && checkResult.success) {
        console.log(`✅ Found ${checkResult.data?.length || 0} leads in dashboard`);
        
        if (checkResult.data && checkResult.data.length > 0) {
          const debugLead = checkResult.data.find(lead => lead.email === 'debug-test@example.com');
          if (debugLead) {
            console.log('✅ Debug test lead found in dashboard!');
            console.log(`   Name: ${debugLead.name}`);
            console.log(`   Intent: ${debugLead.intent}`);
            console.log(`   Urgency: ${debugLead.urgency}`);
          } else {
            console.log('⚠️  Debug test lead not found in dashboard results');
          }
        }
      } else {
        console.log(`❌ Dashboard check failed: ${checkResult.error}`);
      }
      
    } else {
      console.log(`❌ Test lead creation failed: ${leadResult.error}`);
    }
    
    // Step 5: Check all leads (including the original test leads)
    console.log('\n5. Final check of all leads...');
    const finalResponse = await fetch(`${BASE_URL}/api/client/leads?clientId=${clientId}&locale=en&status=active&page=1&limit=100`);
    const finalResult = await finalResponse.json();
    
    if (finalResponse.ok && finalResult.success) {
      console.log(`✅ Total leads found: ${finalResult.data?.length || 0}`);
      
      if (finalResult.data && finalResult.data.length > 0) {
        console.log('\n📋 All leads:');
        finalResult.data.forEach((lead, index) => {
          console.log(`   ${index + 1}. ${lead.name} (${lead.email}) - ${lead.intent || 'No intent'} - ${lead.urgency || 'No urgency'}`);
        });
      }
    } else {
      console.log(`❌ Final check failed: ${finalResult.error}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugLeads();
