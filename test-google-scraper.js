#!/usr/bin/env node

/**
 * Test Google Custom Search API Integration
 * Tests that real companies are returned (not .test domains)
 */

// Load environment variables
require('dotenv').config();

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║  🧪 TESTING GOOGLE CUSTOM SEARCH API                         ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1️⃣  ENVIRONMENT CHECK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
const nodeEnv = process.env.NODE_ENV;

console.log('GOOGLE_CUSTOM_SEARCH_API_KEY:', apiKey ? '✅ SET' : '❌ MISSING');
console.log('GOOGLE_SEARCH_ENGINE_ID:', searchEngineId ? '✅ SET' : '❌ MISSING');
console.log('NODE_ENV:', nodeEnv || '(not set)');

if (!apiKey || !searchEngineId) {
  console.error('\n❌ ERROR: Missing required environment variables');
  console.error('Please set GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID');
  process.exit(1);
}

console.log('\n✅ All required environment variables are set\n');

async function testGoogleSearch() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  TESTING GOOGLE CUSTOM SEARCH API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const testQuery = 'Software Development company in Canada';
  console.log('Query:', testQuery);
  console.log('Region: CA');
  console.log('Max Results: 10\n');
  
  try {
    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    searchUrl.searchParams.append('key', apiKey);
    searchUrl.searchParams.append('cx', searchEngineId);
    searchUrl.searchParams.append('q', testQuery);
    searchUrl.searchParams.append('num', '10');
    searchUrl.searchParams.append('gl', 'ca');
    searchUrl.searchParams.append('lr', 'lang_en');
    
    console.log('🔍 Sending request to Google Custom Search API...\n');
    
    const response = await fetch(searchUrl.toString());
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('Error details:', JSON.stringify(data, null, 2));
      process.exit(1);
    }
    
    console.log('✅ API Response received successfully\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3️⃣  RESULTS ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const items = data.items || [];
    
    console.log(`📊 Total Results: ${items.length}`);
    console.log(`📈 Search Time: ${data.searchInformation?.searchTime || 'N/A'}s`);
    console.log(`🔢 Total Matches: ${data.searchInformation?.totalResults || 'N/A'}\n`);
    
    if (items.length === 0) {
      console.warn('⚠️  WARNING: No results returned');
      console.warn('This might indicate an issue with the search engine configuration');
      process.exit(1);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('4️⃣  VALIDATION: CHECKING FOR REAL DOMAINS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let testDomains = 0;
    let realDomains = 0;
    const prospects = [];
    
    items.forEach((item, index) => {
      const url = new URL(item.link);
      const domain = url.hostname;
      const isTestDomain = domain.endsWith('.test') || domain.includes('example.') || domain.includes('test.');
      
      if (isTestDomain) {
        testDomains++;
      } else {
        realDomains++;
      }
      
      prospects.push({
        index: index + 1,
        title: item.title,
        domain: domain,
        url: item.link,
        snippet: item.snippet?.substring(0, 100) + '...',
        isReal: !isTestDomain
      });
      
      const status = isTestDomain ? '❌ FAKE' : '✅ REAL';
      console.log(`${index + 1}. ${status} - ${domain}`);
      console.log(`   Title: ${item.title}`);
      console.log(`   URL: ${item.link}`);
      console.log('');
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('5️⃣  TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`✅ Real Domains: ${realDomains}/${items.length}`);
    console.log(`❌ Test/Fake Domains: ${testDomains}/${items.length}\n`);
    
    if (testDomains > 0) {
      console.error('⚠️  WARNING: Found test/fake domains in results');
      console.error('This should NOT happen with Google Custom Search API');
      console.log('\n❌ TEST FAILED\n');
      process.exit(1);
    }
    
    if (realDomains >= 5) {
      console.log('✅ SUCCESS: Google Custom Search API is working correctly!');
      console.log('✅ All results are real companies with legitimate domains');
      console.log('✅ No simulated/test data detected');
      console.log('\n🎉 TEST PASSED\n');
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('6️⃣  SAMPLE PROSPECTS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      prospects.slice(0, 3).forEach(p => {
        console.log(`${p.index}. ${p.title}`);
        console.log(`   Domain: ${p.domain}`);
        console.log(`   URL: ${p.url}`);
        console.log(`   Snippet: ${p.snippet}`);
        console.log('');
      });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ READY FOR PRODUCTION');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('Your daily cron will now discover REAL prospects!');
      console.log('Next run: Tomorrow at 8 AM EDT (12 PM UTC)');
      console.log('\n');
      
    } else {
      console.error('⚠️  WARNING: Too few real domains found');
      console.error(`Expected at least 5, got ${realDomains}`);
      console.log('\n❌ TEST INCONCLUSIVE\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testGoogleSearch().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

