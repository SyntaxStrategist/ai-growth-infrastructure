#!/usr/bin/env node

/**
 * Avenir AI Solutions — End-to-End Test Runner
 * Comprehensive automated testing with detailed reporting
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;
const REPORT_FILE = path.join(__dirname, 'AVENIR_AI_SYSTEM_E2E_REPORT.md');

// Test results
let results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
  startTime: new Date(),
  endTime: null,
  logs: [],
  errors: []
};

// Test data storage
let testData = {
  enClient: {},
  frClient: {},
  enLead: {},
  frLead: {}
};

// Utility functions
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[0m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    blue: '\x1b[34m'
  };
  
  const reset = '\x1b[0m';
  const color = colors[type] || colors.info;
  
  console.log(`${color}${message}${reset}`);
  results.logs.push({ time: new Date().toISOString(), type, message });
}

function logError(message, error) {
  log(`❌ ${message}`, 'error');
  results.errors.push({ message, error: error?.message || error, time: new Date().toISOString() });
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    const responseData = await response.json().catch(() => ({}));
    
    return {
      ok: response.ok,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message
    };
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test functions
async function test1_ClientSignupEN() {
  const testName = 'Client Signup (English)';
  log(`\n${'═'.repeat(60)}`, 'blue');
  log(`TEST 1: ${testName}`, 'blue');
  log('═'.repeat(60), 'blue');
  
  const timestamp = Date.now();
  const signupData = {
    businessName: 'E2E Test Agency EN',
    contactName: 'Test User EN',
    email: `avenir-e2e-test-en-${timestamp}@example.com`,
    password: 'TestPass123!',
    language: 'en',
    industryCategory: 'Marketing',
    primaryService: 'Lead Generation',
    bookingLink: 'https://calendly.com/e2e-test',
    customTagline: 'Testing the future',
    emailTone: 'Friendly',
    followupSpeed: 'Instant'
  };
  
  log(`📧 Email: ${signupData.email}`);
  
  const response = await makeRequest('POST', '/client/register', signupData);
  
  if (response.ok && response.data.success) {
    log('✅ Client signup successful', 'success');
    
    // Access data from response.data.data (API returns nested structure)
    const clientData = response.data.data || response.data;
    
    log(`   Client ID: ${clientData.clientId}`);
    log(`   API Key: ${clientData.apiKey?.substring(0, 20)}...`);
    log(`   Email: ${signupData.email}`);
    
    // Store for later tests (FIXED: use global testData with correct data path)
    testData.enClient = {
      clientId: clientData.clientId,
      apiKey: clientData.apiKey,
      email: signupData.email,
      password: signupData.password
    };
    
    log(`   ✅ Stored EN client data for subsequent tests:`, 'success');
    log(`      clientId: ${testData.enClient.clientId}`);
    log(`      apiKey: ${testData.enClient.apiKey?.substring(0, 20)}...`);
    log(`      email: ${testData.enClient.email}`);
    log(`      password: ${testData.enClient.password ? 'SET' : 'MISSING'}`);
    
    results.passed++;
    results.tests.push({ name: testName, status: 'PASS', details: response.data });
    return true;
  } else {
    logError(`Client signup failed: ${response.data.error || 'Unknown error'}`, response);
    results.failed++;
    results.tests.push({ name: testName, status: 'FAIL', details: response.data });
    return false;
  }
}

async function test2_ClientSignupFR() {
  const testName = 'Client Signup (French)';
  log(`\n${'═'.repeat(60)}`, 'blue');
  log(`TEST 2: ${testName}`, 'blue');
  log('═'.repeat(60), 'blue');
  
  const timestamp = Date.now();
  const signupData = {
    businessName: 'Agence Test E2E FR',
    contactName: 'Utilisateur Test FR',
    email: `avenir-e2e-test-fr-${timestamp}@example.com`,
    password: 'TestPass123!',
    language: 'fr',
    industryCategory: 'Construction',
    primaryService: 'Rénovation',
    emailTone: 'Professional',
    followupSpeed: 'Within 1 hour',
    customTagline: "L'avenir se construit aujourd'hui"
  };
  
  log(`📧 Email: ${signupData.email}`);
  
  const response = await makeRequest('POST', '/client/register', signupData);
  
  if (response.ok && response.data.success) {
    log('✅ Client signup successful (FR)', 'success');
    
    // Access data from response.data.data (API returns nested structure)
    const clientData = response.data.data || response.data;
    
    log(`   Client ID: ${clientData.clientId}`);
    log(`   API Key: ${clientData.apiKey?.substring(0, 20)}...`);
    log(`   Email: ${signupData.email}`);
    
    // Store for later tests (FIXED: use global testData with correct data path)
    testData.frClient = {
      clientId: clientData.clientId,
      apiKey: clientData.apiKey,
      email: signupData.email,
      password: signupData.password
    };
    
    log(`   ✅ Stored FR client data for subsequent tests:`, 'success');
    log(`      clientId: ${testData.frClient.clientId}`);
    log(`      apiKey: ${testData.frClient.apiKey?.substring(0, 20)}...`);
    log(`      email: ${testData.frClient.email}`);
    log(`      password: ${testData.frClient.password ? 'SET' : 'MISSING'}`);
    
    results.passed++;
    results.tests.push({ name: testName, status: 'PASS', details: response.data });
    return true;
  } else {
    logError(`Client signup failed (FR): ${response.data.error || 'Unknown error'}`, response);
    results.failed++;
    results.tests.push({ name: testName, status: 'FAIL', details: response.data });
    return false;
  }
}

async function test3_ClientLogin() {
  const testName = 'Client Login (English)';
  log(`\n${'═'.repeat(60)}`, 'blue');
  log(`TEST 3: ${testName}`, 'blue');
  log('═'.repeat(60), 'blue');
  
  if (!testData.enClient || !testData.enClient.email) {
    log('⚠️  Skipped: No client email from signup', 'warning');
    log(`   Debug: enClient = ${JSON.stringify(testData.enClient)}`);
    results.warnings++;
    results.tests.push({ name: testName, status: 'SKIP', details: 'No client data' });
    return false;
  }
  
  log(`   Using email: ${testData.enClient.email}`);
  log(`   Using password: ${testData.enClient.password}`);
  
  const loginData = {
    email: testData.enClient.email,
    password: testData.enClient.password
  };
  
  const response = await makeRequest('POST', '/client/auth', loginData);
  
  if (response.ok && response.data.success) {
    log('✅ Client login successful', 'success');
    log(`   Business: ${response.data.data?.businessName || 'N/A'}`);
    log(`   Language: ${response.data.data?.language || 'N/A'}`);
    log(`   Client ID verified: ${response.data.data?.clientId === testData.enClient.clientId ? '✅' : '❌'}`);
    
    results.passed++;
    results.tests.push({ name: testName, status: 'PASS', details: response.data });
    return true;
  } else {
    logError(`Client login failed: ${response.data.error || 'Unknown error'}`, response);
    results.failed++;
    results.tests.push({ name: testName, status: 'FAIL', details: response.data });
    return false;
  }
}

async function test4_LeadSubmissionEN() {
  const testName = 'Lead Submission (English)';
  log(`\n${'═'.repeat(60)}`, 'blue');
  log(`TEST 4: ${testName}`, 'blue');
  log('═'.repeat(60), 'blue');
  
  if (!testData.enClient || !testData.enClient.apiKey) {
    log('⚠️  Skipped: No API key from signup', 'warning');
    log(`   Debug: enClient.apiKey = ${testData.enClient?.apiKey ? 'EXISTS' : 'MISSING'}`);
    results.warnings++;
    results.tests.push({ name: testName, status: 'SKIP', details: 'No API key' });
    return false;
  }
  
  log(`   Using API Key: ${testData.enClient.apiKey.substring(0, 20)}...`);
  log(`   Client ID: ${testData.enClient.clientId}`);
  
  const leadData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    message: 'I need urgent help with marketing automation for my business',
    timestamp: new Date().toISOString(),
    locale: 'en'
  };
  
  const response = await makeRequest('POST', '/lead', leadData, {
    'x-api-key': testData.enClient.apiKey
  });
  
  if (response.ok && response.data.success) {
    log('✅ Lead submitted successfully', 'success');
    log(`   Lead ID: ${response.data.lead_id || 'N/A'}`);
    log(`   AI Summary: ${response.data.enrichment?.ai_summary?.substring(0, 50) || 'N/A'}...`);
    
    testData.enLead = { id: response.data.lead_id };
    
    results.passed++;
    results.tests.push({ name: testName, status: 'PASS', details: response.data });
    return true;
  } else {
    logError(`Lead submission failed: ${response.data.error || 'Unknown error'}`, response);
    results.failed++;
    results.tests.push({ name: testName, status: 'FAIL', details: response.data });
    return false;
  }
}

async function test5_LeadSubmissionFR() {
  const testName = 'Lead Submission (French)';
  log(`\n${'═'.repeat(60)}`, 'blue');
  log(`TEST 5: ${testName}`, 'blue');
  log('═'.repeat(60), 'blue');
  
  if (!testData.frClient || !testData.frClient.apiKey) {
    log('⚠️  Skipped: No API key from signup', 'warning');
    log(`   Debug: frClient.apiKey = ${testData.frClient?.apiKey ? 'EXISTS' : 'MISSING'}`);
    results.warnings++;
    results.tests.push({ name: testName, status: 'SKIP', details: 'No API key' });
    return false;
  }
  
  log(`   Using API Key: ${testData.frClient.apiKey.substring(0, 20)}...`);
  log(`   Client ID: ${testData.frClient.clientId}`);
  
  const leadData = {
    name: 'Marie Dubois',
    email: 'marie.dubois@example.com',
    message: "Besoin urgent d'automatisation pour notre équipe de vente",
    timestamp: new Date().toISOString(),
    locale: 'fr'
  };
  
  const response = await makeRequest('POST', '/lead', leadData, {
    'x-api-key': testData.frClient.apiKey
  });
  
  if (response.ok && response.data.success) {
    log('✅ Lead submitted successfully (FR)', 'success');
    log(`   Lead ID: ${response.data.lead_id || 'N/A'}`);
    
    testData.frLead = { id: response.data.lead_id };
    
    results.passed++;
    results.tests.push({ name: testName, status: 'PASS', details: response.data });
    return true;
  } else {
    logError(`Lead submission failed (FR): ${response.data.error || 'Unknown error'}`, response);
    results.failed++;
    results.tests.push({ name: testName, status: 'FAIL', details: response.data });
    return false;
  }
}

async function test6_FetchClientLeads() {
  const testName = 'Fetch Client Leads';
  log(`\n${'═'.repeat(60)}`, 'blue');
  log(`TEST 6: ${testName}`, 'blue');
  log('═'.repeat(60), 'blue');
  
  if (!testData.enClient || !testData.enClient.clientId) {
    log('⚠️  Skipped: No client ID available', 'warning');
    log(`   Debug: enClient.clientId = ${testData.enClient?.clientId || 'MISSING'}`);
    results.warnings++;
    results.tests.push({ name: testName, status: 'SKIP', details: 'No client ID' });
    return false;
  }
  
  log(`   Fetching leads for client: ${testData.enClient.clientId}`);
  
  const response = await makeRequest('GET', `/client/leads?clientId=${testData.enClient.clientId}`);
  
  if (response.ok && response.data.success) {
    const leadCount = response.data.leads?.length || 0;
    log('✅ Client leads fetched successfully', 'success');
    log(`   Lead count: ${leadCount}`);
    
    results.passed++;
    results.tests.push({ name: testName, status: 'PASS', details: { leadCount } });
    return true;
  } else {
    logError(`Failed to fetch client leads: ${response.data.error || 'Unknown error'}`, response);
    results.failed++;
    results.tests.push({ name: testName, status: 'FAIL', details: response.data });
    return false;
  }
}

async function test7_UpdateSettings() {
  const testName = 'Update Client Settings';
  log(`\n${'═'.repeat(60)}`, 'blue');
  log(`TEST 7: ${testName}`, 'blue');
  log('═'.repeat(60), 'blue');
  
  if (!testData.enClient || !testData.enClient.clientId) {
    log('⚠️  Skipped: No client ID available', 'warning');
    log(`   Debug: enClient.clientId = ${testData.enClient?.clientId || 'MISSING'}`);
    results.warnings++;
    results.tests.push({ name: testName, status: 'SKIP', details: 'No client ID' });
    return false;
  }
  
  log(`   Updating settings for client: ${testData.enClient.clientId}`);
  
  const settingsData = {
    clientId: testData.enClient.clientId,  // ✅ Must be in body, not query param
    industryCategory: 'Technology',
    emailTone: 'Professional',
    customTagline: 'Updated via E2E test'
  };
  
  const response = await makeRequest('PUT', `/client/settings`, settingsData);
  
  if (response.ok && response.data.success) {
    log('✅ Settings updated successfully', 'success');
    
    results.passed++;
    results.tests.push({ name: testName, status: 'PASS', details: response.data });
    return true;
  } else {
    logError(`Settings update failed: ${response.data.error || 'Unknown error'}`, response);
    results.failed++;
    results.tests.push({ name: testName, status: 'FAIL', details: response.data });
    return false;
  }
}

async function test8_ProspectScan() {
  const testName = 'Prospect Intelligence Scan';
  log(`\n${'═'.repeat(60)}`, 'blue');
  log(`TEST 8: ${testName}`, 'blue');
  log('═'.repeat(60), 'blue');
  
  const scanData = {
    industries: ['Real Estate', 'Legal'],
    regions: ['Canada', 'USA'],
    minScore: 50,
    maxResults: 5,
    testMode: true
  };
  
  const response = await makeRequest('POST', '/prospect-intelligence/scan', scanData);
  
  if (response.ok && response.data.success) {
    const discovered = response.data.discovered || 0;
    log('✅ Prospect scan completed', 'success');
    log(`   Prospects discovered: ${discovered}`);
    
    results.passed++;
    results.tests.push({ name: testName, status: 'PASS', details: { discovered } });
    return true;
  } else {
    logError(`Prospect scan failed: ${response.data.error || 'Unknown error'}`, response);
    results.failed++;
    results.tests.push({ name: testName, status: 'FAIL', details: response.data });
    return false;
  }
}

async function test9_FetchProspects() {
  const testName = 'Fetch Prospect Candidates';
  log(`\n${'═'.repeat(60)}`, 'blue');
  log(`TEST 9: ${testName}`, 'blue');
  log('═'.repeat(60), 'blue');
  
  const response = await makeRequest('GET', '/prospect-intelligence/prospects');
  
  if (response.ok && response.data.success) {
    const prospectCount = response.data.prospects?.length || 0;
    log('✅ Prospects fetched successfully', 'success');
    log(`   Prospect count: ${prospectCount}`);
    
    results.passed++;
    results.tests.push({ name: testName, status: 'PASS', details: { prospectCount } });
    return true;
  } else {
    logError(`Failed to fetch prospects: ${response.data.error || 'Unknown error'}`, response);
    results.failed++;
    results.tests.push({ name: testName, status: 'FAIL', details: response.data });
    return false;
  }
}

async function test10_ChatAssistant() {
  const testName = 'AI Chat Assistant';
  log(`\n${'═'.repeat(60)}`, 'blue');
  log(`TEST 10: ${testName}`, 'blue');
  log('═'.repeat(60), 'blue');
  
  const chatData = {
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is Avenir AI?' }
    ]
  };
  
  const response = await makeRequest('POST', '/chat', chatData);
  
  if (response.ok && response.data.message) {
    log('✅ Chat assistant responded', 'success');
    log(`   Response: ${response.data.message.content?.substring(0, 100)}...`);
    
    results.passed++;
    results.tests.push({ name: testName, status: 'PASS', details: { hasResponse: true } });
    return true;
  } else {
    logError(`Chat assistant failed: ${response.data.error || 'Unknown error'}`, response);
    results.failed++;
    results.tests.push({ name: testName, status: 'FAIL', details: response.data });
    return false;
  }
}

async function test11_UpdateLanguage() {
  const testName = 'Update Language Preference';
  log(`\n${'═'.repeat(60)}`, 'blue');
  log(`TEST 11: ${testName}`, 'blue');
  log('═'.repeat(60), 'blue');
  
  if (!testData.enClient || !testData.enClient.clientId) {
    log('⚠️  Skipped: No client ID available', 'warning');
    log(`   Debug: enClient.clientId = ${testData.enClient?.clientId || 'MISSING'}`);
    results.warnings++;
    results.tests.push({ name: testName, status: 'SKIP', details: 'No client ID' });
    return false;
  }
  
  log(`   Updating language for client: ${testData.enClient.clientId}`);
  
  const langData = {
    clientId: testData.enClient.clientId,
    language: 'fr'
  };
  
  const response = await makeRequest('PUT', '/client/update-language', langData);
  
  if (response.ok && response.data.success) {
    log('✅ Language updated successfully', 'success');
    log(`   New language: fr`);
    
    results.passed++;
    results.tests.push({ name: testName, status: 'PASS', details: response.data });
    return true;
  } else {
    logError(`Language update failed: ${response.data.error || 'Unknown error'}`, response);
    results.failed++;
    results.tests.push({ name: testName, status: 'FAIL', details: response.data });
    return false;
  }
}

// Debug function to show current testData state
function debugTestData(label) {
  log(`\n🔍 DEBUG (${label}):`, 'blue');
  log(`   testData.enClient: ${JSON.stringify(testData.enClient, null, 2)}`);
  log(`   testData.frClient: ${JSON.stringify(testData.frClient, null, 2)}`);
  log('');
}

// Main test runner
async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════════╗');
  log('║  🧪 AVENIR AI SOLUTIONS — END-TO-END TEST SUITE              ║');
  log('╚════════════════════════════════════════════════════════════════╝\n');
  
  log(`Test Environment: DEVELOPMENT`);
  log(`Base URL: ${BASE_URL}`);
  log(`Start Time: ${results.startTime.toISOString()}\n`);
  
  // Run tests sequentially
  await test1_ClientSignupEN();
  await sleep(1000);
  debugTestData('After Test 1');
  await sleep(1000);
  
  await test2_ClientSignupFR();
  await sleep(1000);
  debugTestData('After Test 2');
  await sleep(1000);
  
  await test3_ClientLogin();
  await sleep(2000);
  
  await test4_LeadSubmissionEN();
  await sleep(2000);
  
  await test5_LeadSubmissionFR();
  await sleep(2000);
  
  await test6_FetchClientLeads();
  await sleep(2000);
  
  await test7_UpdateSettings();
  await sleep(2000);
  
  await test8_ProspectScan();
  await sleep(2000);
  
  await test9_FetchProspects();
  await sleep(2000);
  
  await test10_ChatAssistant();
  await sleep(2000);
  
  await test11_UpdateLanguage();
  
  // Calculate final results
  results.endTime = new Date();
  const totalTests = results.passed + results.failed;
  const successRate = totalTests > 0 ? Math.round((results.passed / totalTests) * 100) : 0;
  
  // Display summary
  log('\n\n╔════════════════════════════════════════════════════════════════╗');
  log('║  📊 TEST SUITE COMPLETE                                       ║');
  log('╚════════════════════════════════════════════════════════════════╝\n');
  
  log(`Test Summary:`);
  log(`  ✅ Tests Passed: ${results.passed}`, results.passed > 0 ? 'success' : 'info');
  log(`  ❌ Tests Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'info');
  log(`  ⚠️  Warnings: ${results.warnings}`, results.warnings > 0 ? 'warning' : 'info');
  log(`  📊 Success Rate: ${successRate}%\n`);
  
  log(`Duration: ${((results.endTime - results.startTime) / 1000).toFixed(2)}s`);
  log(`End Time: ${results.endTime.toISOString()}\n`);
  
  if (results.failed === 0) {
    log('🎉 ALL TESTS PASSED!', 'success');
  } else {
    log('⚠️  SOME TESTS FAILED', 'error');
  }
  
  // Update report file
  updateReport(successRate);
  
  return results.failed === 0;
}

function updateReport(successRate) {
  log('\n📝 Updating report file...', 'blue');
  
  // Read current report template
  let reportContent = fs.readFileSync(REPORT_FILE, 'utf8');
  
  // Update execution date
  reportContent = reportContent.replace(
    /\*\*Execution Date:\*\* .*/,
    `**Execution Date:** ${new Date().toLocaleString()}`
  );
  
  // Update quick stats
  reportContent = reportContent.replace(/\*\*Total Tests:\*\* TBD/, `**Total Tests:** ${results.passed + results.failed}`);
  reportContent = reportContent.replace(/\*\*Tests Passed:\*\* TBD/, `**Tests Passed:** ${results.passed}`);
  reportContent = reportContent.replace(/\*\*Tests Failed:\*\* TBD/, `**Tests Failed:** ${results.failed}`);
  reportContent = reportContent.replace(/\*\*Warnings:\*\* TBD/, `**Warnings:** ${results.warnings}`);
  reportContent = reportContent.replace(/\*\*Success Rate:\*\* TBD%/, `**Success Rate:** ${successRate}%`);
  
  // Build test results table
  let tableRows = '';
  results.tests.forEach((test, idx) => {
    const statusIcon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    tableRows += `| ${idx + 1} | ${test.name} | ${statusIcon} ${test.status} | - | ${test.details?.error || '-'} |\n`;
  });
  
  // Replace TBD rows in results table
  reportContent = reportContent.replace(
    /\| 1 \| Client Signup \(EN\) \| TBD \| TBD \| - \|/,
    tableRows
  );
  
  // Add execution logs
  const logSection = results.logs.slice(-50).map(l => `[${l.time}] ${l.type.toUpperCase()}: ${l.message}`).join('\n');
  reportContent = reportContent.replace(
    /\(Logs will be appended here during test execution\)/,
    logSection || 'No logs generated'
  );
  
  // Add error logs
  if (results.errors.length > 0) {
    const errorSection = results.errors.map(e => `[${e.time}] ${e.message}\n  Error: ${e.error}`).join('\n\n');
    reportContent = reportContent.replace(
      /\(Error logs will be appended here if any tests fail\)/,
      errorSection
    );
  }
  
  // Update operational readiness
  const rating = Math.round((successRate / 100) * 10);
  reportContent = reportContent.replace(/\*\*Overall Rating:\*\* TBD \/ 10/, `**Overall Rating:** ${rating} / 10`);
  
  // Write updated report
  fs.writeFileSync(REPORT_FILE, reportContent, 'utf8');
  
  log(`✅ Report updated: ${REPORT_FILE}`, 'success');
}

// Run tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    logError('Unexpected error during test execution', error);
    process.exit(1);
  });

