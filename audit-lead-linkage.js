#!/usr/bin/env node

/**
 * Audit script to check lead_memory and lead_actions linkage
 */

const BASE_URL = 'https://www.aveniraisolutions.ca';
const TEST_CLIENT_EMAIL = 'test-client@aveniraisolutions.ca';
const TEST_CLIENT_PASSWORD = 'TestClient2025!';
const TEST_CLIENT_ID = 'a8c89837-7e45-44a4-a367-6010df87a723';

async function auditLeadLinkage() {
  console.log('🔍 Auditing lead_memory and lead_actions linkage...');
  console.log('================================================');
  
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
    
    // Step 2: Check lead_memory records for test client
    console.log('\n2. Checking lead_memory records...');
    
    // We need to check the database directly since the dashboard API isn't working
    // Let's create a test lead first to see what happens
    const testLead = {
      name: 'Audit Test Lead',
      email: 'audit-test@example.com',
      message: 'This is a test lead for auditing the linkage between lead_memory and lead_actions.',
      timestamp: new Date().toISOString(),
      api_key: authResult.data.apiKey
    };
    
    console.log('📤 Creating test lead...');
    const leadResponse = await fetch(`${BASE_URL}/api/lead`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': authResult.data.apiKey
      },
      body: JSON.stringify(testLead)
    });
    
    const leadResult = await leadResponse.json();
    console.log('📥 Lead creation response:', {
      status: leadResponse.status,
      success: leadResult.success,
      leadId: leadResult.leadId,
      message: leadResult.message
    });
    
    // Step 3: Check dashboard API
    console.log('\n3. Checking dashboard API...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/client/leads?clientId=${clientId}&locale=en&status=active&page=1&limit=20`);
    const dashboardResult = await dashboardResponse.json();
    
    console.log('📊 Dashboard API response:', {
      status: dashboardResponse.status,
      success: dashboardResult.success,
      leadCount: dashboardResult.data?.length || 0,
      error: dashboardResult.error
    });
    
    if (dashboardResult.data && dashboardResult.data.length > 0) {
      console.log('✅ Leads found in dashboard:');
      dashboardResult.data.forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.name} (${lead.email}) - ${lead.intent || 'No intent'}`);
      });
    } else {
      console.log('❌ No leads found in dashboard');
    }
    
    // Step 4: Check if we can access the database directly
    console.log('\n4. Attempting to check database directly...');
    
    // Try to get all leads for this client using a different approach
    const allLeadsResponse = await fetch(`${BASE_URL}/api/client/leads?clientId=${clientId}&locale=en&status=active&page=1&limit=100`);
    const allLeadsResult = await allLeadsResponse.json();
    
    console.log('📊 All leads response:', {
      status: allLeadsResponse.status,
      success: allLeadsResult.success,
      leadCount: allLeadsResult.data?.length || 0,
      error: allLeadsResult.error
    });
    
    // Step 5: Summary
    console.log('\n📋 AUDIT SUMMARY');
    console.log('================');
    console.log(`Client ID: ${clientId}`);
    console.log(`Test Lead Created: ${leadResponse.ok && leadResult.success ? '✅ Yes' : '❌ No'}`);
    console.log(`Lead ID Returned: ${leadResult.leadId || '❌ None'}`);
    console.log(`Dashboard Shows Leads: ${dashboardResult.data?.length || 0}`);
    console.log(`Total Leads Found: ${allLeadsResult.data?.length || 0}`);
    
    if (allLeadsResult.data && allLeadsResult.data.length > 0) {
      console.log('\n✅ SUCCESS: Leads are being found!');
      console.log('The issue might be with the dashboard query or pagination.');
    } else {
      console.log('\n❌ ISSUE: No leads found in database');
      console.log('This suggests a problem with:');
      console.log('1. lead_memory records not being created');
      console.log('2. lead_actions records not being created');
      console.log('3. Join query not working properly');
      console.log('4. RLS policies blocking access');
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
  }
}

auditLeadLinkage();
