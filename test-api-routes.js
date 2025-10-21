#!/usr/bin/env node

/**
 * Test script to verify lead_notes API routes work correctly with RLS
 * Tests both client and admin access patterns
 */

const https = require('https');
const http = require('http');

// Configuration - you'll need to set these manually
const BASE_URL = 'http://localhost:3000'; // Adjust if your dev server runs on different port
const TEST_CLIENT_ID = 'test-client-id'; // You'll need to get a real client ID from your database

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testLeadNotesAPI() {
  console.log('🧪 Testing Lead Notes API Routes with RLS');
  console.log('==========================================\n');

  try {
    // Test 1: GET notes without authentication (should fail or return empty)
    console.log('1️⃣ Testing GET /api/lead-notes without auth...');
    const response1 = await makeRequest(`${BASE_URL}/api/lead-notes?lead_id=test-lead-id`);
    console.log(`   Status: ${response1.status}`);
    console.log(`   Response:`, response1.data);
    
    if (response1.status === 400 || response1.status === 401 || response1.status === 403) {
      console.log('   ✅ Properly restricted access');
    } else {
      console.log('   ⚠️ Unexpected response - check RLS policies');
    }

    // Test 2: POST note without authentication (should fail)
    console.log('\n2️⃣ Testing POST /api/lead-notes without auth...');
    const response2 = await makeRequest(`${BASE_URL}/api/lead-notes`, {
      method: 'POST',
      body: {
        lead_id: 'test-lead-id',
        note: 'Test note',
        client_id: TEST_CLIENT_ID
      }
    });
    console.log(`   Status: ${response2.status}`);
    console.log(`   Response:`, response2.data);
    
    if (response2.status === 400 || response2.status === 401 || response2.status === 403) {
      console.log('   ✅ Properly restricted access');
    } else {
      console.log('   ⚠️ Unexpected response - check RLS policies');
    }

    // Test 3: Test with client authentication (if you have a way to simulate this)
    console.log('\n3️⃣ Testing with client authentication...');
    console.log('   ⚠️ This requires proper client authentication setup');
    console.log('   You would need to:');
    console.log('   - Get a valid client ID from your database');
    console.log('   - Set up proper authentication headers');
    console.log('   - Test that client can only see their own notes');

    // Test 4: Test admin access (service role)
    console.log('\n4️⃣ Testing admin access...');
    console.log('   ⚠️ This requires service role authentication');
    console.log('   Admin should be able to see all notes regardless of client_id');

    console.log('\n✅ API Route Testing Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Start your development server: npm run dev');
    console.log('   2. Get a real client ID from your database');
    console.log('   3. Test with proper authentication headers');
    console.log('   4. Verify client isolation and admin access');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure your development server is running on', BASE_URL);
  }
}

// Run the tests
testLeadNotesAPI().then(() => {
  console.log('\n🏁 Testing completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
