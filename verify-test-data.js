#!/usr/bin/env node

/**
 * Verification script to check if test data was created correctly
 */

const BASE_URL = 'https://www.aveniraisolutions.ca';
const TEST_CLIENT_EMAIL = 'test-client@aveniraisolutions.ca';
const TEST_CLIENT_PASSWORD = 'TestClient2025!';

async function verifyTestData() {
  console.log('🔍 Verifying test data...');
  
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
    
    // Step 2: Check leads via API
    console.log('\n2. Checking leads via client API...');
    const leadsResponse = await fetch(`${BASE_URL}/api/client/leads?clientId=${clientId}&locale=en&status=active&page=1&limit=20`);
    const leadsResult = await leadsResponse.json();
    
    if (!leadsResponse.ok || !leadsResult.success) {
      throw new Error(`Leads API failed: ${leadsResult.error}`);
    }
    
    console.log(`✅ Found ${leadsResult.data?.length || 0} leads via API`);
    
    if (leadsResult.data && leadsResult.data.length > 0) {
      console.log('\n📋 Sample leads:');
      leadsResult.data.slice(0, 3).forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.name} (${lead.email}) - ${lead.intent} - ${lead.urgency}`);
      });
    }
    
    // Step 3: Test both language dashboards
    console.log('\n3. Testing language dashboards...');
    
    // English
    const enLeadsResponse = await fetch(`${BASE_URL}/api/client/leads?clientId=${clientId}&locale=en&status=active&page=1&limit=20`);
    const enLeadsResult = await enLeadsResponse.json();
    console.log(`   English: ${enLeadsResult.data?.length || 0} leads`);
    
    // French
    const frLeadsResponse = await fetch(`${BASE_URL}/api/client/leads?clientId=${clientId}&locale=fr&status=active&page=1&limit=20`);
    const frLeadsResult = await frLeadsResponse.json();
    console.log(`   French: ${frLeadsResult.data?.length || 0} leads`);
    
    // Step 4: Check for repeat customers
    console.log('\n4. Checking for repeat customers...');
    const allLeads = leadsResult.data || [];
    const companyCounts = {};
    
    allLeads.forEach(lead => {
      // Extract company from email domain
      const domain = lead.email.split('@')[1];
      const company = domain.split('.')[0];
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    });
    
    const repeatCompanies = Object.entries(companyCounts).filter(([company, count]) => count > 1);
    
    if (repeatCompanies.length > 0) {
      console.log('✅ Found repeat customers:');
      repeatCompanies.forEach(([company, count]) => {
        console.log(`   ${company}: ${count} leads`);
      });
    } else {
      console.log('⚠️  No repeat customers found');
    }
    
    // Step 5: Check relationship insights
    console.log('\n5. Checking relationship insights...');
    const leadsWithInsights = allLeads.filter(lead => lead.relationship_insight);
    console.log(`✅ ${leadsWithInsights.length} leads have relationship insights`);
    
    if (leadsWithInsights.length > 0) {
      console.log('\n📊 Sample insights:');
      leadsWithInsights.slice(0, 2).forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.name}: ${lead.relationship_insight}`);
      });
    }
    
    console.log('\n🎉 Verification complete!');
    console.log('\n📊 SUMMARY:');
    console.log(`   Total leads: ${allLeads.length}`);
    console.log(`   English leads: ${allLeads.filter(l => l.language === 'en').length}`);
    console.log(`   French leads: ${allLeads.filter(l => l.language === 'fr').length}`);
    console.log(`   Repeat customers: ${repeatCompanies.length}`);
    console.log(`   With insights: ${leadsWithInsights.length}`);
    
    console.log('\n🌐 Dashboard Links:');
    console.log(`   English: ${BASE_URL}/en/client/dashboard`);
    console.log(`   French: ${BASE_URL}/fr/client/dashboard`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyTestData();
