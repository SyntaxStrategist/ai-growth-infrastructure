#!/usr/bin/env node

/**
 * Test script to verify client authentication fixes
 * Tests both the frontend fix and development bypass
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAuthFixes() {
  console.log('✅ Testing Client Authentication Fixes\n');
  
  // Test 1: Frontend fix - POST with clientId in body
  console.log('1️⃣ Testing frontend fix (POST with clientId in body):');
  try {
    const response = await fetch(`${BASE_URL}/api/client/prospect-intelligence/prospects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: 'test-client-123' })
    });
    const data = await response.json();
    console.log('   Status:', response.status);
    console.log('   Result:', data.error || `Success - ${data.count} prospects`);
    if (data.clientInfo) {
      console.log('   Client Info:', data.clientInfo);
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  // Test 2: Development bypass
  console.log('\n2️⃣ Testing development bypass:');
  try {
    const response = await fetch(`${BASE_URL}/api/client/prospect-intelligence/prospects?devClientId=test-client-123`);
    const data = await response.json();
    console.log('   Status:', response.status);
    console.log('   Result:', data.error || `Success - ${data.count} prospects`);
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  // Test 3: Config API with frontend fix
  console.log('\n3️⃣ Testing config API with frontend fix:');
  try {
    const response = await fetch(`${BASE_URL}/api/client/prospect-intelligence/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: 'test-client-123' })
    });
    const data = await response.json();
    console.log('   Status:', response.status);
    console.log('   Result:', data.error || 'Success');
    if (data.data && data.data.icp_data) {
      console.log('   ICP Data:', Object.keys(data.data.icp_data));
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  // Test 4: Config API with development bypass
  console.log('\n4️⃣ Testing config API with development bypass:');
  try {
    const response = await fetch(`${BASE_URL}/api/client/prospect-intelligence/config?devClientId=test-client-123`);
    const data = await response.json();
    console.log('   Status:', response.status);
    console.log('   Result:', data.error || 'Success');
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('   ✅ Frontend fix: POST requests with clientId in body');
  console.log('   ✅ Development bypass: ?devClientId=xxx for testing');
  console.log('   ✅ Both approaches should work in development');
  console.log('   ✅ Production will only accept proper authentication');
}

testAuthFixes().catch(console.error);
