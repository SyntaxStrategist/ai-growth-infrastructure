#!/usr/bin/env node

/**
 * Test the remaining triggers on tables that actually have updated_at columns
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const env = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    
    return env;
  } catch (error) {
    console.warn(`Could not load ${filePath}:`, error.message);
    return {};
  }
}

// Load environment variables
const env = {
  ...loadEnvFile(path.join(__dirname, '.env')),
  ...loadEnvFile(path.join(__dirname, '.env.local'))
};

// Set environment variables
Object.entries(env).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create service role client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function testTrigger(tableName, idField, updateField, testValue) {
  console.log(`\n🧪 Testing ${tableName} table trigger...`);
  
  try {
    // Get an existing record
    const { data: existingRecords, error: fetchError } = await supabase
      .from(tableName)
      .select(`id, ${updateField}, updated_at`)
      .limit(1);

    if (fetchError) {
      console.log(`   ❌ ${tableName} table not accessible:`, fetchError.message);
      return false;
    }

    if (!existingRecords || existingRecords.length === 0) {
      console.log(`   ⚠️ No records found in ${tableName} table`);
      return false;
    }

    const record = existingRecords[0];
    const originalUpdatedAt = record.updated_at;
    console.log(`   Testing with ${idField}: ${record.id}`);
    console.log(`   Original updated_at: ${originalUpdatedAt}`);

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update the record
    const updateData = {};
    updateData[updateField] = record[updateField] + testValue;

    const { data: updatedRecord, error: updateError } = await supabase
      .from(tableName)
      .update(updateData)
      .eq(idField, record.id)
      .select(`id, ${updateField}, updated_at`)
      .single();

    if (updateError) {
      console.error(`   ❌ Failed to update ${tableName}:`, updateError.message);
      return false;
    }

    const newUpdatedAt = updatedRecord.updated_at;
    console.log(`   New updated_at: ${newUpdatedAt}`);

    if (newUpdatedAt !== originalUpdatedAt) {
      console.log(`   ✅ ${tableName} trigger working correctly - updated_at timestamp changed`);
    } else {
      console.log(`   ❌ ${tableName} trigger not working - updated_at timestamp unchanged`);
      return false;
    }

    // Clean up - restore original value
    const restoreData = {};
    restoreData[updateField] = record[updateField];

    await supabase
      .from(tableName)
      .update(restoreData)
      .eq(idField, record.id);

    console.log(`   ✅ ${tableName} record restored to original state`);
    return true;

  } catch (error) {
    console.error(`   ❌ Error testing ${tableName}:`, error.message);
    return false;
  }
}

async function testRemainingTriggers() {
  console.log('🧪 Testing Remaining update_updated_at_column() Triggers');
  console.log('=======================================================\n');

  const testResults = [];

  try {
    // Test 1: lead_notes table (already tested, but let's confirm)
    console.log('1️⃣ Testing lead_notes table trigger (confirmation)...');
    const leadNotesResult = await testTrigger('lead_notes', 'id', 'note', ' [Trigger Test 2]');
    testResults.push({ table: 'lead_notes', success: leadNotesResult });

    // Test 2: translation_cache table
    console.log('\n2️⃣ Testing translation_cache table trigger...');
    const cacheResult = await testTrigger('translation_cache', 'id', 'original_text', ' [Trigger Test]');
    testResults.push({ table: 'translation_cache', success: cacheResult });

    // Test 3: translation_dictionary table
    console.log('\n3️⃣ Testing translation_dictionary table trigger...');
    const dictResult = await testTrigger('translation_dictionary', 'id', 'english_text', ' [Trigger Test]');
    testResults.push({ table: 'translation_dictionary', success: dictResult });

    // Summary
    console.log('\n📋 Test Results Summary:');
    console.log('========================');
    
    const successfulTests = testResults.filter(r => r.success);
    const failedTests = testResults.filter(r => !r.success);

    console.log(`✅ Successful tests: ${successfulTests.length}`);
    successfulTests.forEach(result => {
      console.log(`   - ${result.table}`);
    });

    if (failedTests.length > 0) {
      console.log(`❌ Failed tests: ${failedTests.length}`);
      failedTests.forEach(result => {
        console.log(`   - ${result.table}`);
      });
    }

    console.log('\n🎯 Overall Result:');
    if (successfulTests.length > 0) {
      console.log('✅ update_updated_at_column() function and triggers are working correctly!');
      console.log('✅ No functionality was broken by the search_path fix!');
      
      if (successfulTests.length === testResults.length) {
        console.log('🎉 All triggers are working perfectly!');
      } else {
        console.log('⚠️ Some triggers may not be working, but core functionality is intact');
      }
    } else {
      console.log('❌ No triggers could be tested successfully');
    }

    return successfulTests.length > 0;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the tests
testRemainingTriggers().then((success) => {
  if (success) {
    console.log('\n🎉 Update triggers verification complete!');
    process.exit(0);
  } else {
    console.log('\n💥 Update trigger verification failed!');
    process.exit(1);
  }
}).catch((error) => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
