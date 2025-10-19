#!/usr/bin/env node

/**
 * Test Script for Fuzzy Matching Translation System
 * 
 * This script tests the fuzzy matching capabilities of the translation system
 * to ensure it works correctly with the large dictionary.
 * 
 * Usage:
 *   node scripts/test-fuzzy-matching.js
 *   npm run test:fuzzy-matching
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test cases for fuzzy matching
const TEST_CASES = [
  // Exact matches (should work with exact matching)
  { input: 'hello', expected: 'bonjour', type: 'exact' },
  { input: 'goodbye', expected: 'au revoir', type: 'exact' },
  { input: 'meeting', expected: 'réunion', type: 'exact' },
  
  // Fuzzy matches (should work with fuzzy matching)
  { input: 'helo', expected: 'bonjour', type: 'fuzzy' }, // typo in hello
  { input: 'goodby', expected: 'au revoir', type: 'fuzzy' }, // typo in goodbye
  { input: 'meetin', expected: 'réunion', type: 'fuzzy' }, // typo in meeting
  { input: 'busines', expected: 'entreprise', type: 'fuzzy' }, // typo in business
  { input: 'computr', expected: 'ordinateur', type: 'fuzzy' }, // typo in computer
  
  // Similar words (should find close matches)
  { input: 'greeting', expected: 'salutation', type: 'similar' },
  { input: 'farewell', expected: 'adieu', type: 'similar' },
  { input: 'conference', expected: 'conférence', type: 'similar' },
  
  // Business terms
  { input: 'project', expected: 'projet', type: 'business' },
  { input: 'customer', expected: 'client', type: 'business' },
  { input: 'service', expected: 'service', type: 'business' },
  
  // Technology terms
  { input: 'software', expected: 'logiciel', type: 'tech' },
  { input: 'database', expected: 'base de données', type: 'tech' },
  { input: 'network', expected: 'réseau', type: 'tech' }
];

/**
 * Test exact dictionary lookup
 */
async function testExactLookup(text, isEnglishToFrench = true) {
  try {
    const { data, error } = await supabase
      .rpc('exact_dictionary_lookup', {
        search_text: text.toLowerCase(),
        source_column: isEnglishToFrench ? 'english_text' : 'french_text',
        target_column: isEnglishToFrench ? 'french_text' : 'english_text'
      });

    if (error) {
      console.error(`❌ Exact lookup error for "${text}":`, error);
      return null;
    }

    return data && data.length > 0 ? data[0].translated_text : null;
  } catch (error) {
    console.error(`❌ Exact lookup failed for "${text}":`, error);
    return null;
  }
}

/**
 * Test fuzzy dictionary lookup
 */
async function testFuzzyLookup(text, isEnglishToFrench = true) {
  try {
    const { data, error } = await supabase
      .rpc('fuzzy_dictionary_lookup', {
        search_text: text.toLowerCase(),
        source_column: isEnglishToFrench ? 'english_text' : 'french_text',
        target_column: isEnglishToFrench ? 'french_text' : 'english_text',
        similarity_threshold: 0.7
      });

    if (error) {
      console.error(`❌ Fuzzy lookup error for "${text}":`, error);
      return null;
    }

    return data && data.length > 0 ? {
      translated: data[0].translated_text,
      similarity: data[0].similarity
    } : null;
  } catch (error) {
    console.error(`❌ Fuzzy lookup failed for "${text}":`, error);
    return null;
  }
}

/**
 * Test dictionary statistics
 */
async function testDictionaryStats() {
  try {
    const { data, error } = await supabase
      .rpc('get_dictionary_stats');

    if (error) {
      console.error('❌ Dictionary stats error:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('❌ Dictionary stats failed:', error);
    return null;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 [FuzzyMatchingTest] Starting fuzzy matching tests...');
  console.log('=====================================================');

  // Test 1: Dictionary Statistics
  console.log('\n📊 [Test 1] Dictionary Statistics:');
  const stats = await testDictionaryStats();
  if (stats) {
    console.log(`   ✅ Total entries: ${stats.total_entries}`);
    console.log(`   ✅ Active entries: ${stats.active_entries}`);
    console.log(`   ✅ Categories: ${stats.categories.join(', ')}`);
    console.log(`   ✅ Average priority: ${stats.avg_priority?.toFixed(2) || 'N/A'}`);
  } else {
    console.log('   ❌ Failed to get dictionary statistics');
  }

  // Test 2: Exact Matching
  console.log('\n🎯 [Test 2] Exact Matching:');
  let exactMatches = 0;
  for (const testCase of TEST_CASES.filter(tc => tc.type === 'exact')) {
    const result = await testExactLookup(testCase.input);
    const success = result === testCase.expected;
    console.log(`   ${success ? '✅' : '❌'} "${testCase.input}" → "${result}" (expected: "${testCase.expected}")`);
    if (success) exactMatches++;
  }
  console.log(`   📊 Exact matches: ${exactMatches}/${TEST_CASES.filter(tc => tc.type === 'exact').length}`);

  // Test 3: Fuzzy Matching
  console.log('\n🔍 [Test 3] Fuzzy Matching:');
  let fuzzyMatches = 0;
  for (const testCase of TEST_CASES.filter(tc => tc.type === 'fuzzy')) {
    const result = await testFuzzyLookup(testCase.input);
    const success = result && result.translated === testCase.expected;
    console.log(`   ${success ? '✅' : '❌'} "${testCase.input}" → "${result?.translated || 'null'}" (similarity: ${result?.similarity?.toFixed(2) || 'N/A'}) (expected: "${testCase.expected}")`);
    if (success) fuzzyMatches++;
  }
  console.log(`   📊 Fuzzy matches: ${fuzzyMatches}/${TEST_CASES.filter(tc => tc.type === 'fuzzy').length}`);

  // Test 4: Similar Word Matching
  console.log('\n🔗 [Test 4] Similar Word Matching:');
  let similarMatches = 0;
  for (const testCase of TEST_CASES.filter(tc => tc.type === 'similar')) {
    const result = await testFuzzyLookup(testCase.input);
    const success = result && result.similarity > 0.7;
    console.log(`   ${success ? '✅' : '❌'} "${testCase.input}" → "${result?.translated || 'null'}" (similarity: ${result?.similarity?.toFixed(2) || 'N/A'}) (expected: "${testCase.expected}")`);
    if (success) similarMatches++;
  }
  console.log(`   📊 Similar matches: ${similarMatches}/${TEST_CASES.filter(tc => tc.type === 'similar').length}`);

  // Test 5: Business/Tech Terms
  console.log('\n💼 [Test 5] Business/Tech Terms:');
  let businessMatches = 0;
  for (const testCase of TEST_CASES.filter(tc => tc.type === 'business' || tc.type === 'tech')) {
    const result = await testFuzzyLookup(testCase.input);
    const success = result && result.translated === testCase.expected;
    console.log(`   ${success ? '✅' : '❌'} "${testCase.input}" → "${result?.translated || 'null'}" (similarity: ${result?.similarity?.toFixed(2) || 'N/A'}) (expected: "${testCase.expected}")`);
    if (success) businessMatches++;
  }
  console.log(`   📊 Business/Tech matches: ${businessMatches}/${TEST_CASES.filter(tc => tc.type === 'business' || tc.type === 'tech').length}`);

  // Summary
  console.log('\n📊 [Summary] Test Results:');
  const totalTests = TEST_CASES.length;
  const totalMatches = exactMatches + fuzzyMatches + similarMatches + businessMatches;
  const successRate = ((totalMatches / totalTests) * 100).toFixed(1);
  
  console.log(`   🎯 Total tests: ${totalTests}`);
  console.log(`   ✅ Successful matches: ${totalMatches}`);
  console.log(`   📈 Success rate: ${successRate}%`);
  
  if (successRate >= 80) {
    console.log('   🎉 Fuzzy matching system is working well!');
  } else if (successRate >= 60) {
    console.log('   ⚠️  Fuzzy matching system needs improvement.');
  } else {
    console.log('   ❌ Fuzzy matching system has significant issues.');
  }

  // Test 6: Performance Test
  console.log('\n⚡ [Test 6] Performance Test:');
  const performanceTests = ['hello', 'meeting', 'computer', 'business', 'software'];
  const startTime = Date.now();
  
  for (const testText of performanceTests) {
    const testStart = Date.now();
    await testFuzzyLookup(testText);
    const testTime = Date.now() - testStart;
    console.log(`   ⏱️  "${testText}": ${testTime}ms`);
  }
  
  const totalTime = Date.now() - startTime;
  const avgTime = (totalTime / performanceTests.length).toFixed(1);
  console.log(`   📊 Average lookup time: ${avgTime}ms`);
  
  if (avgTime < 100) {
    console.log('   🚀 Performance is excellent!');
  } else if (avgTime < 500) {
    console.log('   ✅ Performance is good.');
  } else {
    console.log('   ⚠️  Performance could be improved.');
  }

  console.log('\n🎯 [FuzzyMatchingTest] All tests completed!');
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testExactLookup,
  testFuzzyLookup,
  testDictionaryStats,
  runTests
};
