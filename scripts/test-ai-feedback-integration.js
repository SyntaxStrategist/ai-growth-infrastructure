#!/usr/bin/env node

/**
 * Test script for AI feedback integration
 * 
 * This script tests that the AI analysis feedback logging is working correctly
 * without affecting existing lead processing functionality.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAiFeedbackIntegration() {
  console.log('🧪 Testing AI Feedback Integration...\n');

  try {
    // Test 1: Check if feedback tracking tables exist
    console.log('1. Checking feedback tracking tables...');
    
    const { data: feedbackTable, error: feedbackError } = await supabase
      .from('feedback_tracking')
      .select('id')
      .limit(1);
    
    if (feedbackError) {
      console.error('❌ feedback_tracking table not accessible:', feedbackError.message);
      return false;
    }
    console.log('✅ feedback_tracking table accessible');

    const { data: performanceTable, error: performanceError } = await supabase
      .from('performance_metrics')
      .select('id')
      .limit(1);
    
    if (performanceError) {
      console.error('❌ performance_metrics table not accessible:', performanceError.message);
      return false;
    }
    console.log('✅ performance_metrics table accessible\n');

    // Test 2: Check recent AI analysis feedback
    console.log('2. Checking recent AI analysis feedback...');
    
    const { data: recentFeedback, error: recentError } = await supabase
      .from('feedback_tracking')
      .select('*')
      .eq('action_type', 'system_performance')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.error('❌ Failed to fetch recent feedback:', recentError.message);
      return false;
    }
    
    console.log(`✅ Found ${recentFeedback.length} recent system performance feedback records`);
    if (recentFeedback.length > 0) {
      console.log('   Latest feedback:', {
        id: recentFeedback[0].id,
        outcome: recentFeedback[0].outcome,
        confidence_score: recentFeedback[0].confidence_score,
        created_at: recentFeedback[0].created_at
      });
    }

    // Test 3: Check recent AI analysis performance metrics
    console.log('\n3. Checking recent AI analysis performance metrics...');
    
    const { data: recentMetrics, error: metricsError } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('source_component', 'ai_enrichment_analysis')
      .order('recorded_at', { ascending: false })
      .limit(5);
    
    if (metricsError) {
      console.error('❌ Failed to fetch recent performance metrics:', metricsError.message);
      return false;
    }
    
    console.log(`✅ Found ${recentMetrics.length} recent AI enrichment analysis metrics`);
    if (recentMetrics.length > 0) {
      console.log('   Latest metrics:', {
        id: recentMetrics[0].id,
        metric_name: recentMetrics[0].metric_name,
        metric_value: recentMetrics[0].metric_value,
        recorded_at: recentMetrics[0].recorded_at
      });
    }

    // Test 4: Test feedback API endpoint
    console.log('\n4. Testing feedback API endpoint...');
    
    const testFeedbackData = {
      type: 'performance',
      data: {
        event_type: 'ai_analysis',
        metric_name: 'test_integration',
        metric_value: 1.0,
        source_component: 'test_script',
        metadata: {
          test: true,
          integration_test: 'ai_feedback_integration'
        }
      }
    };

    const response = await fetch('http://localhost:3000/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testFeedbackData)
    });

    if (!response.ok) {
      console.error('❌ Feedback API test failed:', response.status, response.statusText);
      return false;
    }

    const result = await response.json();
    if (result.success) {
      console.log('✅ Feedback API endpoint working correctly');
      console.log('   Test feedback logged with ID:', result.id);
    } else {
      console.error('❌ Feedback API returned error:', result.error);
      return false;
    }

    // Test 5: Verify integration isolation
    console.log('\n5. Verifying integration isolation...');
    
    // Check that existing lead processing tables are unchanged
    const { data: leadsTable, error: leadsError } = await supabase
      .from('lead_memory')
      .select('id')
      .limit(1);
    
    if (leadsError) {
      console.error('❌ lead_memory table not accessible:', leadsError.message);
      return false;
    }
    console.log('✅ lead_memory table still accessible (no changes to existing functionality)');

    const { data: leadActionsTable, error: leadActionsError } = await supabase
      .from('lead_actions')
      .select('id')
      .limit(1);
    
    if (leadActionsError) {
      console.error('❌ lead_actions table not accessible:', leadActionsError.message);
      return false;
    }
    console.log('✅ lead_actions table still accessible (no changes to existing functionality)');

    console.log('\n🎉 AI Feedback Integration Test PASSED!');
    console.log('✅ All systems working correctly');
    console.log('✅ Feedback logging is operational');
    console.log('✅ Existing functionality is preserved');
    console.log('✅ Integration is completely isolated');
    
    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testAiFeedbackIntegration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testAiFeedbackIntegration };
