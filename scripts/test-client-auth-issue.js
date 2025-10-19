#!/usr/bin/env node

/**
 * Test script to demonstrate the client authentication issue
 * Shows why /api/client/prospect-intelligence/prospects returns "Client authentication required"
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testClientAuthIssue() {
  console.log('🔍 Testing Client Authentication Issue\n');
  
  // Test 1: Call prospects API without any authentication
  console.log('1️⃣ Testing /api/client/prospect-intelligence/prospects without auth...');
  try {
    const response = await fetch(`${BASE_URL}/api/client/prospect-intelligence/prospects`);
    const data = await response.json();
    console.log('   Response:', data);
    console.log('   Status:', response.status);
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  console.log('\n2️⃣ Testing /api/client/insights with clientId parameter...');
  try {
    const response = await fetch(`${BASE_URL}/api/client/insights?clientId=test-client-123`);
    const data = await response.json();
    console.log('   Response:', data);
    console.log('   Status:', response.status);
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  console.log('\n3️⃣ Testing /api/client/prospect-intelligence/config without auth...');
  try {
    const response = await fetch(`${BASE_URL}/api/client/prospect-intelligence/config`);
    const data = await response.json();
    console.log('   Response:', data);
    console.log('   Status:', response.status);
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  console.log('\n📋 Analysis:');
  console.log('   • /api/client/insights expects clientId as query parameter');
  console.log('   • /api/client/prospect-intelligence/* expects API key or clientId in body');
  console.log('   • Frontend calls prospects API without any authentication parameters');
  console.log('   • This causes "Client authentication required" error');
}

testClientAuthIssue().catch(console.error);
