#!/usr/bin/env ts-node
// ============================================
// PDL Integration Test Script
// ============================================
// Tests People Data Labs integration with or without API key

import { PdlAPI } from '../src/lib/integrations/pdl_connector';
import { FormScanner } from '../src/lib/form_scanner';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(level: 'success' | 'error' | 'info' | 'warn', message: string) {
  const color = level === 'success' ? colors.green :
                level === 'error' ? colors.red :
                level === 'warn' ? colors.yellow :
                colors.blue;
  
  const icon = level === 'success' ? '✅' :
               level === 'error' ? '❌' :
               level === 'warn' ? '⚠️' : 'ℹ️';
  
  console.log(`${color}${icon} ${message}${colors.reset}`);
}

async function testPdlIntegration() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  🧪 PEOPLE DATA LABS INTEGRATION TEST                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  let allPassed = true;

  // Test 1: Check API key configuration
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣  API Key Configuration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const isConfigured = PdlAPI.isConfigured();
  if (isConfigured) {
    log('success', 'PDL API key found in environment');
  } else {
    log('warn', 'PDL API key not configured (will use mock data)');
  }
  
  const rateLimit = PdlAPI.getRateLimit();
  log('info', `Rate limit: ${rateLimit}ms between requests`);
  console.log('');

  // Test 2: Connection test (only if API key present)
  if (isConfigured) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2️⃣  Connection Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    try {
      const connectionOk = await PdlAPI.testConnection();
      if (connectionOk) {
        log('success', 'PDL API connection successful');
      } else {
        log('error', 'PDL API connection failed');
        allPassed = false;
      }
    } catch (error) {
      log('error', `Connection test error: ${error instanceof Error ? error.message : 'Unknown'}`);
      allPassed = false;
    }
    console.log('');
  }

  // Test 3: Search prospects (with or without key)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣  Prospect Search');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    log('info', 'Searching for Construction companies in CA (limit: 5)');
    const prospects = await PdlAPI.searchProspects('Construction', 'CA', 5);
    
    if (prospects.length > 0) {
      log('success', `Found ${prospects.length} prospects`);
      console.log('\n📊 Sample Prospect:');
      console.log(JSON.stringify(prospects[0], null, 2));
      
      // Validate structure
      const hasRequiredFields = prospects.every(p => 
        p.business_name &&
        p.website &&
        typeof p.automation_need_score === 'number' &&
        p.metadata?.source === 'pdl'
      );
      
      if (hasRequiredFields) {
        log('success', 'All prospects have required fields');
      } else {
        log('error', 'Some prospects missing required fields');
        allPassed = false;
      }
    } else if (!isConfigured) {
      log('info', 'No results (expected without API key)');
    } else {
      log('warn', 'Search returned 0 results');
    }
  } catch (error) {
    if (!isConfigured && error instanceof Error && error.message.includes('not configured')) {
      log('info', 'Search blocked (no API key) - expected behavior');
    } else {
      log('error', `Search error: ${error instanceof Error ? error.message : 'Unknown'}`);
      allPassed = false;
    }
  }
  console.log('');

  // Test 4: Form Scanner
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4️⃣  Form Scanner');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    log('info', 'Scanning test website: https://aveniraisolutions.ca');
    const scanResult = await FormScanner.scan('https://aveniraisolutions.ca');
    
    log('success', 'Form scan completed');
    console.log('\n📊 Scan Results:');
    console.log(JSON.stringify({
      hasForm: scanResult.hasForm,
      formCount: scanResult.formCount,
      hasMailto: scanResult.hasMailto,
      hasCaptcha: scanResult.hasCaptcha,
      submitMethod: scanResult.submitMethod,
      recommendedApproach: scanResult.recommendedApproach,
      scanDuration: scanResult.metadata.scan_duration_ms + 'ms'
    }, null, 2));
    
    // Validate structure
    if (typeof scanResult.hasForm === 'boolean' && 
        typeof scanResult.recommendedApproach === 'string') {
      log('success', 'Scan result has valid structure');
    } else {
      log('error', 'Scan result structure invalid');
      allPassed = false;
    }
  } catch (error) {
    log('error', `Form scan error: ${error instanceof Error ? error.message : 'Unknown'}`);
    allPassed = false;
  }
  console.log('');

  // Test 5: Auto-submit check
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('5️⃣  Auto-Submit Safety Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const autoSubmitEnabled = FormScanner.isAutoSubmitEnabled();
  if (autoSubmitEnabled) {
    log('warn', 'AUTO_SUBMIT_FORMS is ENABLED - forms will be submitted');
    log('warn', 'This should be OFF in production');
  } else {
    log('success', 'AUTO_SUBMIT_FORMS is disabled (safe)');
  }
  console.log('');

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (allPassed) {
    log('success', 'All tests passed! ✨');
  } else {
    log('error', 'Some tests failed - check output above');
  }
  
  console.log('\n📋 Next Steps:');
  if (!isConfigured) {
    console.log('   1. Add PEOPLE_DATA_LABS_API_KEY to .env.local');
    console.log('   2. Get key from: https://dashboard.peopledatalabs.com/api-keys');
    console.log('   3. Restart dev server and run this test again');
  } else {
    console.log('   1. Run a prospect scan with Test Mode OFF');
    console.log('   2. Enable "Use People Data Labs" toggle');
    console.log('   3. Check logs/pdl_integration.log for requests');
  }
  console.log('');
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
testPdlIntegration().catch(error => {
  console.error('\n❌ Test script failed:', error);
  process.exit(1);
});

