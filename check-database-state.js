#!/usr/bin/env node

/**
 * Check database state for test client using the admin API
 */

const BASE_URL = 'https://www.aveniraisolutions.ca';
const TEST_CLIENT_ID = 'a8c89837-7e45-44a4-a367-6010df87a723';

async function checkDatabaseState() {
  console.log('🔍 Checking database state for test client...');
  console.log('==============================================');
  console.log(`Test Client ID: ${TEST_CLIENT_ID}`);
  
  try {
    // Since we don't have direct database access, let's check via the API
    // We need to authenticate first
    console.log('\n1. Authenticating test client...');
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
      throw new Error(`Authentication failed: ${authResult.error}`);
    }
    
    console.log(`✅ Client authenticated: ${authResult.data.clientId}`);
    console.log(`✅ API Key: ${authResult.data.apiKey}`);
    
    // Check dashboard leads
    console.log('\n2. Checking dashboard leads...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/client/leads?clientId=${TEST_CLIENT_ID}&locale=en&status=active&page=1&limit=100`);
    const dashboardResult = await dashboardResponse.json();
    
    console.log(`Dashboard API Status: ${dashboardResponse.status}`);
    console.log(`Dashboard API Success: ${dashboardResult.success}`);
    console.log(`Leads Found: ${dashboardResult.data?.length || 0}`);
    
    if (dashboardResult.error) {
      console.error(`Dashboard API Error: ${dashboardResult.error}`);
    }
    
    // Summary
    console.log('\n📋 DATABASE STATE SUMMARY');
    console.log('==========================');
    console.log(`Client ID: ${TEST_CLIENT_ID}`);
    console.log(`Authentication: ✅ Working`);
    console.log(`Dashboard Leads: ${dashboardResult.data?.length || 0}`);
    
    if (dashboardResult.data && dashboardResult.data.length > 0) {
      console.log('\n✅ Leads are accessible from dashboard!');
      console.log('Displaying first few leads:');
      dashboardResult.data.slice(0, 5).forEach((lead, index) => {
        console.log(`  ${index + 1}. ${lead.name} (${lead.email}) - ${lead.intent || 'No intent'}`);
      });
    } else {
      console.log('\n❌ No leads accessible from dashboard');
      console.log('\nPossible issues:');
      console.log('1. Leads were never created in lead_memory table');
      console.log('2. lead_actions records are missing');
      console.log('3. Join query is not working properly');
      console.log('4. RLS policies are blocking access');
      
      console.log('\nDiagnostic: The upsertLeadWithHistory function is likely failing silently.');
      console.log('The API returns success but leadId is undefined, preventing lead_actions creation.');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkDatabaseState();
