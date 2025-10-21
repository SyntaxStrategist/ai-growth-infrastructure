#!/usr/bin/env node

/**
 * Test Daily Prospect Queue System
 * Manually triggers the daily queue to verify it works correctly
 */

const { runDailyProspectQueue } = require('./src/lib/daily-prospect-queue.ts');

async function testDailyQueue() {
  console.log('🧪 Testing Daily Prospect Queue System');
  console.log('=====================================\n');

  try {
    const result = await runDailyProspectQueue();
    
    console.log('\n📊 Test Results:');
    console.log(`   Prospects Discovered: ${result.prospectsDiscovered}`);
    console.log(`   Prospects Scored:     ${result.prospectsScored}`);
    console.log(`   Emails Generated:     ${result.emailsGenerated}`);
    console.log(`   Emails Queued:        ${result.prospectsQueued}`);
    console.log(`   Daily Limit:          ${result.dailyLimit}`);
    console.log(`   Execution Time:       ${Math.round(result.executionTime / 1000)}s`);
    console.log(`   Errors:               ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }
    
    if (result.prospectsQueued > 0) {
      console.log('\n✅ Test successful! Emails queued for approval.');
      console.log('   Check the admin dashboard to review and approve emails.');
    } else {
      console.log('\n⚠️  No emails were queued. This could be due to:');
      console.log('   - Daily limit already reached');
      console.log('   - No suitable prospects found');
      console.log('   - System errors');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testDailyQueue();
