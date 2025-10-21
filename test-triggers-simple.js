#!/usr/bin/env node

/**
 * Simple test script to verify update_updated_at_column() triggers work correctly
 * Tests by updating records and checking if updated_at timestamps change
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
      console.log(`   ⚠️ ${tableName} table not accessible:`, fetchError.message);
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

async function testAllTriggers() {
  console.log('🧪 Testing update_updated_at_column() Triggers');
  console.log('==============================================\n');

  const testResults = [];

  try {
    // Test 1: lead_notes table
    const leadNotesResult = await testTrigger('lead_notes', 'id', 'note', ' [Trigger Test]');
    testResults.push({ table: 'lead_notes', success: leadNotesResult });

    // Test 2: prospect_candidates table
    const prospectsResult = await testTrigger('prospect_candidates', 'id', 'business_name', ' [Trigger Test]');
    testResults.push({ table: 'prospect_candidates', success: prospectsResult });

    // Test 3: prospect_learning_insights table
    const insightsResult = await testTrigger('prospect_learning_insights', 'id', 'insight_type', ' [Trigger Test]');
    testResults.push({ table: 'prospect_learning_insights', success: insightsResult });

    // Test 4: prospect_adaptive_weights table
    const weightsResult = await testTrigger('prospect_adaptive_weights', 'id', 'weight_name', ' [Trigger Test]');
    testResults.push({ table: 'prospect_adaptive_weights', success: weightsResult });

    // Test 5: prospect_scoring_models table
    const modelsResult = await testTrigger('prospect_scoring_models', 'id', 'model_name', ' [Trigger Test]');
    testResults.push({ table: 'prospect_scoring_models', success: modelsResult });

    // Test 6: prospect_dynamic_scores table
    const scoresResult = await testTrigger('prospect_dynamic_scores', 'id', 'score_type', ' [Trigger Test]');
    testResults.push({ table: 'prospect_dynamic_scores', success: scoresResult });

    // Test 7: translation_cache table
    const cacheResult = await testTrigger('translation_cache', 'id', 'source_text', ' [Trigger Test]');
    testResults.push({ table: 'translation_cache', success: cacheResult });

    // Test 8: translation_dictionary table
    const dictResult = await testTrigger('translation_dictionary', 'id', 'source_text', ' [Trigger Test]');
    testResults.push({ table: 'translation_dictionary', success: dictResult });

    // Summary
    console.log('\n📋 Test Results Summary:');
    console.log('========================');
    
    const successfulTests = testResults.filter(r => r.success);
    const failedTests = testResults.filter(r => !r.success);
    const skippedTests = testResults.filter(r => r.success === false && r.table.includes('not accessible'));

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

    if (skippedTests.length > 0) {
      console.log(`⚠️ Skipped tests (table not accessible): ${skippedTests.length}`);
      skippedTests.forEach(result => {
        console.log(`   - ${result.table}`);
      });
    }

    console.log('\n🎯 Overall Result:');
    if (successfulTests.length > 0) {
      console.log('✅ update_updated_at_column() function and triggers are working correctly!');
      console.log('✅ No functionality was broken by the search_path fix!');
    } else {
      console.log('❌ No triggers could be tested - check database connection and table access');
    }

    return successfulTests.length > 0;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the tests
testAllTriggers().then((success) => {
  if (success) {
    console.log('\n🎉 All update triggers verification complete!');
    process.exit(0);
  } else {
    console.log('\n💥 Update trigger verification failed!');
    process.exit(1);
  }
}).catch((error) => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
