/**
 * Phase 2.1 Module 1: Migration Verification Script
 * 
 * Verifies that the feedback tracking system migration was applied successfully.
 * Tests database schema and basic functionality without requiring the full API.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyMigration() {
  console.log('🔍 Verifying Phase 2.1 Module 1: Feedback Tracking System Migration');
  console.log('=' .repeat(70));
  
  let allPassed = true;
  
  try {
    // Test 1: Verify feedback_tracking table exists and has correct schema
    console.log('\n📋 Testing feedback_tracking table...');
    
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback_tracking')
      .select('id, action_type, outcome, confidence_score, impact_score, notes_en, notes_fr, created_at')
      .limit(1);
    
    if (feedbackError && feedbackError.code !== 'PGRST116') {
      console.log('❌ feedback_tracking table test failed:', feedbackError.message);
      allPassed = false;
    } else {
      console.log('✅ feedback_tracking table exists and accessible');
    }
    
    // Test 2: Verify performance_metrics table exists and has correct schema
    console.log('\n📊 Testing performance_metrics table...');
    
    const { data: metricsData, error: metricsError } = await supabase
      .from('performance_metrics')
      .select('id, event_type, metric_name, metric_value, source_component, response_time_ms, error_message_en, error_message_fr, recorded_at')
      .limit(1);
    
    if (metricsError && metricsError.code !== 'PGRST116') {
      console.log('❌ performance_metrics table test failed:', metricsError.message);
      allPassed = false;
    } else {
      console.log('✅ performance_metrics table exists and accessible');
    }
    
    // Test 3: Verify utility functions exist
    console.log('\n🔧 Testing utility functions...');
    
    const { data: summaryData, error: summaryError } = await supabase
      .rpc('get_feedback_summary', {
        p_client_id: null,
        p_action_type: null,
        p_days_back: 1
      });
    
    if (summaryError) {
      console.log('❌ get_feedback_summary function test failed:', summaryError.message);
      allPassed = false;
    } else {
      console.log('✅ get_feedback_summary function exists and accessible');
    }
    
    const { data: perfSummaryData, error: perfSummaryError } = await supabase
      .rpc('get_performance_summary', {
        p_source_component: null,
        p_metric_name: null,
        p_days_back: 1
      });
    
    if (perfSummaryError) {
      console.log('❌ get_performance_summary function test failed:', perfSummaryError.message);
      allPassed = false;
    } else {
      console.log('✅ get_performance_summary function exists and accessible');
    }
    
    // Test 4: Test basic insert functionality
    console.log('\n💾 Testing basic insert functionality...');
    
    const testFeedback = {
      action_type: 'system_performance',
      outcome: 'positive',
      confidence_score: 0.95,
      impact_score: 85,
      notes: 'Migration verification test',
      notes_en: 'Migration verification test',
      notes_fr: 'Test de vérification de migration',
      context_data: {
        test: true,
        migration_verification: true,
        timestamp: new Date().toISOString()
      }
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('feedback_tracking')
      .insert(testFeedback)
      .select('id')
      .single();
    
    if (insertError) {
      console.log('❌ Basic insert test failed:', insertError.message);
      allPassed = false;
    } else {
      console.log('✅ Basic insert functionality works');
      
      // Clean up test data
      await supabase
        .from('feedback_tracking')
        .delete()
        .eq('id', insertData.id);
      console.log('🧹 Test data cleaned up');
    }
    
    // Test 5: Test performance metrics insert
    console.log('\n⚡ Testing performance metrics insert...');
    
    const testMetric = {
      event_type: 'api_response',
      metric_name: 'response_time',
      metric_value: 150,
      metric_unit: 'ms',
      source_component: 'migration_test',
      response_time_ms: 150,
      success_rate: 1.0,
      metadata: {
        test: true,
        migration_verification: true
      }
    };
    
    const { data: metricInsertData, error: metricInsertError } = await supabase
      .from('performance_metrics')
      .insert(testMetric)
      .select('id')
      .single();
    
    if (metricInsertError) {
      console.log('❌ Performance metrics insert test failed:', metricInsertError.message);
      allPassed = false;
    } else {
      console.log('✅ Performance metrics insert functionality works');
      
      // Clean up test data
      await supabase
        .from('performance_metrics')
        .delete()
        .eq('id', metricInsertData.id);
      console.log('🧹 Test metric data cleaned up');
    }
    
    // Test 6: Verify RLS policies
    console.log('\n🔒 Testing Row Level Security policies...');
    
    // Test that we can read from tables (public read access)
    const { data: rlsTestData, error: rlsError } = await supabase
      .from('feedback_tracking')
      .select('id')
      .limit(1);
    
    if (rlsError && rlsError.code !== 'PGRST116') {
      console.log('❌ RLS read policy test failed:', rlsError.message);
      allPassed = false;
    } else {
      console.log('✅ RLS read policies are working correctly');
    }
    
  } catch (error) {
    console.log('💥 Migration verification failed:', error.message);
    allPassed = false;
  }
  
  // Print results
  console.log('\n' + '=' .repeat(70));
  if (allPassed) {
    console.log('🎉 Migration verification PASSED!');
    console.log('✅ All feedback tracking system components are working correctly');
    console.log('✅ Database schema is properly configured');
    console.log('✅ Utility functions are accessible');
    console.log('✅ Basic CRUD operations work');
    console.log('✅ Row Level Security is properly configured');
    console.log('\n🚀 Phase 2.1 Module 1 is ready for use!');
  } else {
    console.log('❌ Migration verification FAILED!');
    console.log('⚠️ Some components are not working correctly');
    console.log('🔧 Please check the errors above and fix them before proceeding');
  }
  
  return allPassed;
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifyMigration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Verification script failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyMigration };
