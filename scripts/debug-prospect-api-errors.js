#!/usr/bin/env node

/**
 * Debug script to identify the specific 500 errors in prospect intelligence APIs
 * Tests each step of the authentication and data fetching process
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function debugProspectAPIErrors() {
  console.log('🔍 Debugging Prospect Intelligence API 500 Errors\n');
  
  // Test 1: Check if client exists in database
  console.log('1️⃣ Testing client authentication (should work):');
  try {
    const response = await fetch(`${BASE_URL}/api/client/prospect-intelligence/prospects?devClientId=test-client-123`);
    const data = await response.json();
    console.log('   Status:', response.status);
    console.log('   Result:', data.error || 'Success');
    if (data.error && data.error.includes('Client authentication required')) {
      console.log('   ❌ Authentication still failing');
      return;
    }
  } catch (error) {
    console.log('   Error:', error.message);
    return;
  }
  
  // Test 2: Check config API specifically
  console.log('\n2️⃣ Testing config API:');
  try {
    const response = await fetch(`${BASE_URL}/api/client/prospect-intelligence/config?devClientId=test-client-123`);
    const data = await response.json();
    console.log('   Status:', response.status);
    console.log('   Result:', data.error || 'Success');
    if (data.error) {
      console.log('   ❌ Config API Error:', data.error);
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  // Test 3: Check prospects API specifically
  console.log('\n3️⃣ Testing prospects API:');
  try {
    const response = await fetch(`${BASE_URL}/api/client/prospect-intelligence/prospects?devClientId=test-client-123`);
    const data = await response.json();
    console.log('   Status:', response.status);
    console.log('   Result:', data.error || 'Success');
    if (data.error) {
      console.log('   ❌ Prospects API Error:', data.error);
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  // Test 4: Check if prospect_candidates table exists
  console.log('\n4️⃣ Testing database table access:');
  try {
    // This will help us see if the table exists and is accessible
    const response = await fetch(`${BASE_URL}/api/client/prospect-intelligence/prospects?devClientId=test-client-123`);
    const data = await response.json();
    console.log('   Status:', response.status);
    if (data.error && data.error.includes('relation') && data.error.includes('does not exist')) {
      console.log('   ❌ Database table missing:', data.error);
    } else if (data.error && data.error.includes('permission')) {
      console.log('   ❌ Database permission issue:', data.error);
    } else if (data.error) {
      console.log('   ❌ Other database error:', data.error);
    } else {
      console.log('   ✅ Database access working');
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  console.log('\n📋 Common 500 Error Causes:');
  console.log('   1. Missing database table: prospect_candidates');
  console.log('   2. Missing function: extractIndustriesFromICP');
  console.log('   3. Null/undefined ICP data causing crashes');
  console.log('   4. Database permission issues');
  console.log('   5. Missing columns in clients table');
  console.log('   6. Type errors in calculateMinScoreFromICP');
}

debugProspectAPIErrors().catch(console.error);
