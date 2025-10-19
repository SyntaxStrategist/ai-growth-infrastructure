/**
 * Phase 2.1 Module 1: Feedback System Test Script
 * 
 * Tests the feedback tracking system backend functionality without dashboard integration.
 * Verifies all components work correctly in isolation.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testClientId: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID v4
  testLeadId: '550e8400-e29b-41d4-a716-446655440002',   // Valid UUID v4
  testCampaignId: '550e8400-e29b-41d4-a716-446655440003' // Valid UUID v4
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, error = null) {
  testResults.tests.push({ testName, passed, error });
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: ${error}`);
  }
}

async function testDatabaseMigration() {
  console.log('\n🧪 Testing Database Migration...');
  
  try {
    // Test feedback_tracking table exists
    const { data: feedbackTable, error: feedbackError } = await supabase
      .from('feedback_tracking')
      .select('id')
      .limit(1);
    
    if (feedbackError && feedbackError.code !== 'PGRST116') {
      logTest('Feedback tracking table exists', false, feedbackError.message);
      return false;
    }
    
    logTest('Feedback tracking table exists', true);
    
    // Test performance_metrics table exists
    const { data: metricsTable, error: metricsError } = await supabase
      .from('performance_metrics')
      .select('id')
      .limit(1);
    
    if (metricsError && metricsError.code !== 'PGRST116') {
      logTest('Performance metrics table exists', false, metricsError.message);
      return false;
    }
    
    logTest('Performance metrics table exists', true);
    
    // Test utility functions exist
    const { data: summaryFunction, error: summaryError } = await supabase
      .rpc('get_feedback_summary', {
        p_client_id: null,
        p_action_type: null,
        p_days_back: 1
      });
    
    if (summaryError) {
      logTest('Feedback summary function exists', false, summaryError.message);
      return false;
    }
    
    logTest('Feedback summary function exists', true);
    
    return true;
    
  } catch (error) {
    logTest('Database migration test', false, error.message);
    return false;
  }
}

async function testFeedbackAPI() {
  console.log('\n🧪 Testing Feedback API...');
  
  try {
    // Test API documentation endpoint
    const docResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/feedback`, {
      method: 'OPTIONS'
    });
    
    if (!docResponse.ok) {
      logTest('API documentation endpoint', false, `HTTP ${docResponse.status}`);
      return false;
    }
    
    const docData = await docResponse.json();
    if (!docData.success || !docData.endpoints) {
      logTest('API documentation endpoint', false, 'Invalid response format');
      return false;
    }
    
    logTest('API documentation endpoint', true);
    
    // Test logging feedback
    const feedbackData = {
      type: 'feedback',
      data: {
        action_type: 'user_action',
        outcome: 'positive',
        // client_id: TEST_CONFIG.testClientId, // Removed to avoid foreign key constraint
        confidence_score: 0.85,
        impact_score: 75,
        notes: 'Test feedback from automated test',
        notes_en: 'Test feedback from automated test',
        notes_fr: 'Commentaires de test du test automatisé',
        context_data: {
          test: true,
          timestamp: new Date().toISOString()
        }
      }
    };
    
    const feedbackResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feedbackData)
    });
    
    if (!feedbackResponse.ok) {
      logTest('Log feedback endpoint', false, `HTTP ${feedbackResponse.status}`);
      return false;
    }
    
    const feedbackResult = await feedbackResponse.json();
    if (!feedbackResult.success || !feedbackResult.id) {
      logTest('Log feedback endpoint', false, 'Invalid response format');
      return false;
    }
    
    logTest('Log feedback endpoint', true);
    
    // Test logging performance metrics
    const performanceData = {
      type: 'performance',
      data: {
        event_type: 'api_response',
        metric_name: 'response_time',
        metric_value: 150,
        metric_unit: 'ms',
        source_component: 'test_component',
        // client_id: TEST_CONFIG.testClientId, // Removed to avoid foreign key constraint
        response_time_ms: 150,
        success_rate: 1.0,
        metadata: {
          test: true,
          endpoint: '/api/feedback'
        }
      }
    };
    
    const performanceResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(performanceData)
    });
    
    if (!performanceResponse.ok) {
      logTest('Log performance metrics endpoint', false, `HTTP ${performanceResponse.status}`);
      return false;
    }
    
    const performanceResult = await performanceResponse.json();
    if (!performanceResult.success || !performanceResult.id) {
      logTest('Log performance metrics endpoint', false, 'Invalid response format');
      return false;
    }
    
    logTest('Log performance metrics endpoint', true);
    
    // Test retrieving feedback summary
    const summaryResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/feedback?action=summary&days_back=1`);
    
    if (!summaryResponse.ok) {
      logTest('Get feedback summary endpoint', false, `HTTP ${summaryResponse.status}`);
      return false;
    }
    
    const summaryResult = await summaryResponse.json();
    if (!summaryResult.success || !Array.isArray(summaryResult.data)) {
      logTest('Get feedback summary endpoint', false, 'Invalid response format');
      return false;
    }
    
    logTest('Get feedback summary endpoint', true);
    
    // Test retrieving performance summary
    const perfSummaryResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/feedback?action=performance&days_back=1`);
    
    if (!perfSummaryResponse.ok) {
      logTest('Get performance summary endpoint', false, `HTTP ${perfSummaryResponse.status}`);
      return false;
    }
    
    const perfSummaryResult = await perfSummaryResponse.json();
    if (!perfSummaryResult.success || !Array.isArray(perfSummaryResult.data)) {
      logTest('Get performance summary endpoint', false, 'Invalid response format');
      return false;
    }
    
    logTest('Get performance summary endpoint', true);
    
    return true;
    
  } catch (error) {
    logTest('Feedback API test', false, error.message);
    return false;
  }
}

async function testOutcomeTracking() {
  console.log('\n🧪 Testing Outcome Tracking...');
  
  try {
    // Test AI outcome tracking
    const aiOutcomeData = {
      type: 'ai_outcome',
      data: {
        component: 'test_ai_component',
        prediction: {
          confidence: 0.85,
          predicted_value: 'positive',
          factors: ['test_factor_1', 'test_factor_2']
        },
        actual_outcome: {
          actual_value: 'positive',
          success: true,
          response_time_ms: 200
        },
        // client_id: TEST_CONFIG.testClientId, // Removed to avoid foreign key constraint
        notes: 'Test AI outcome tracking',
        notes_en: 'Test AI outcome tracking',
        notes_fr: 'Test de suivi des résultats IA'
      }
    };
    
    const aiOutcomeResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(aiOutcomeData)
    });
    
    if (!aiOutcomeResponse.ok) {
      logTest('AI outcome tracking endpoint', false, `HTTP ${aiOutcomeResponse.status}`);
      return false;
    }
    
    const aiOutcomeResult = await aiOutcomeResponse.json();
    if (!aiOutcomeResult.success || !aiOutcomeResult.data) {
      logTest('AI outcome tracking endpoint', false, 'Invalid response format');
      return false;
    }
    
    logTest('AI outcome tracking endpoint', true);
    
    // Test lead conversion tracking
    const leadConversionData = {
      type: 'lead_conversion',
      data: {
        lead_id: TEST_CONFIG.testLeadId,
        ai_prediction: {
          confidence: 0.75,
          predicted_likelihood: 0.8,
          factors: ['urgency_high', 'tone_positive']
        },
        actual_outcome: {
          converted: true,
          conversion_time_days: 3,
          conversion_value: 1000
        },
        // client_id: TEST_CONFIG.testClientId, // Removed to avoid foreign key constraint
        notes: 'Test lead conversion tracking',
        notes_en: 'Test lead conversion tracking',
        notes_fr: 'Test de suivi de conversion de lead'
      }
    };
    
    const leadConversionResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(leadConversionData)
    });
    
    if (!leadConversionResponse.ok) {
      logTest('Lead conversion tracking endpoint', false, `HTTP ${leadConversionResponse.status}`);
      return false;
    }
    
    const leadConversionResult = await leadConversionResponse.json();
    if (!leadConversionResult.success || !leadConversionResult.data) {
      logTest('Lead conversion tracking endpoint', false, 'Invalid response format');
      return false;
    }
    
    logTest('Lead conversion tracking endpoint', true);
    
    // Test AI analysis retrieval
    const aiAnalysisResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/feedback?action=ai_analysis&component=test_ai_component&days_back=1`);
    
    if (!aiAnalysisResponse.ok) {
      logTest('Get AI analysis endpoint', false, `HTTP ${aiAnalysisResponse.status}`);
      return false;
    }
    
    const aiAnalysisResult = await aiAnalysisResponse.json();
    if (!aiAnalysisResult.success || !aiAnalysisResult.data) {
      logTest('Get AI analysis endpoint', false, 'Invalid response format');
      return false;
    }
    
    logTest('Get AI analysis endpoint', true);
    
    // Test lead conversion analysis retrieval
    const leadAnalysisResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/feedback?action=lead_conversion&days_back=1`);
    
    if (!leadAnalysisResponse.ok) {
      logTest('Get lead conversion analysis endpoint', false, `HTTP ${leadAnalysisResponse.status}`);
      return false;
    }
    
    const leadAnalysisResult = await leadAnalysisResponse.json();
    if (!leadAnalysisResult.success || !leadAnalysisResult.data) {
      logTest('Get lead conversion analysis endpoint', false, 'Invalid response format');
      return false;
    }
    
    logTest('Get lead conversion analysis endpoint', true);
    
    return true;
    
  } catch (error) {
    logTest('Outcome tracking test', false, error.message);
    return false;
  }
}

async function testBilingualSupport() {
  console.log('\n🧪 Testing Bilingual Support...');
  
  try {
    // Test feedback with bilingual notes
    const bilingualData = {
      type: 'feedback',
      data: {
        action_type: 'user_action',
        outcome: 'positive',
        // client_id: TEST_CONFIG.testClientId, // Removed to avoid foreign key constraint
        confidence_score: 0.9,
        impact_score: 85,
        notes: 'Bilingual test feedback',
        notes_en: 'Bilingual test feedback in English',
        notes_fr: 'Commentaires de test bilingue en français',
        context_data: {
          test: true,
          language: 'bilingual',
          timestamp: new Date().toISOString()
        }
      }
    };
    
    const bilingualResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bilingualData)
    });
    
    if (!bilingualResponse.ok) {
      logTest('Bilingual feedback logging', false, `HTTP ${bilingualResponse.status}`);
      return false;
    }
    
    const bilingualResult = await bilingualResponse.json();
    if (!bilingualResult.success) {
      logTest('Bilingual feedback logging', false, 'Invalid response format');
      return false;
    }
    
    logTest('Bilingual feedback logging', true);
    
    // Test performance metrics with bilingual error messages
    const bilingualPerfData = {
      type: 'performance',
      data: {
        event_type: 'api_response',
        metric_name: 'error_rate',
        metric_value: 0.05,
        metric_unit: 'percent',
        source_component: 'test_bilingual_component',
        // client_id: TEST_CONFIG.testClientId, // Removed to avoid foreign key constraint
        error_count: 1,
        error_message_en: 'Test error message in English',
        error_message_fr: 'Message d\'erreur de test en français',
        metadata: {
          test: true,
          language: 'bilingual'
        }
      }
    };
    
    const bilingualPerfResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bilingualPerfData)
    });
    
    if (!bilingualPerfResponse.ok) {
      logTest('Bilingual performance metrics logging', false, `HTTP ${bilingualPerfResponse.status}`);
      return false;
    }
    
    const bilingualPerfResult = await bilingualPerfResponse.json();
    if (!bilingualPerfResult.success) {
      logTest('Bilingual performance metrics logging', false, 'Invalid response format');
      return false;
    }
    
    logTest('Bilingual performance metrics logging', true);
    
    return true;
    
  } catch (error) {
    logTest('Bilingual support test', false, error.message);
    return false;
  }
}

async function testDataRetrieval() {
  console.log('\n🧪 Testing Data Retrieval...');
  
  try {
    // Test feedback stats
    const statsResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/feedback?action=stats&days_back=1`);
    
    if (!statsResponse.ok) {
      logTest('Get feedback stats endpoint', false, `HTTP ${statsResponse.status}`);
      return false;
    }
    
    const statsResult = await statsResponse.json();
    if (!statsResult.success || !statsResult.data) {
      logTest('Get feedback stats endpoint', false, 'Invalid response format');
      return false;
    }
    
    logTest('Get feedback stats endpoint', true);
    
    // Test unprocessed feedback
    const unprocessedResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/feedback?action=unprocessed&limit=10`);
    
    if (!unprocessedResponse.ok) {
      logTest('Get unprocessed feedback endpoint', false, `HTTP ${unprocessedResponse.status}`);
      return false;
    }
    
    const unprocessedResult = await unprocessedResponse.json();
    if (!unprocessedResult.success || !Array.isArray(unprocessedResult.data)) {
      logTest('Get unprocessed feedback endpoint', false, 'Invalid response format');
      return false;
    }
    
    logTest('Get unprocessed feedback endpoint', true);
    
    return true;
    
  } catch (error) {
    logTest('Data retrieval test', false, error.message);
    return false;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Clean up test feedback records (by test context data instead of client_id)
    const { error: feedbackError } = await supabase
      .from('feedback_tracking')
      .delete()
      .contains('context_data', { test: true });
    
    if (feedbackError) {
      console.log(`⚠️ Failed to cleanup feedback data: ${feedbackError.message}`);
    } else {
      console.log('✅ Feedback test data cleaned up');
    }
    
    // Clean up test performance metrics (by test metadata instead of client_id)
    const { error: metricsError } = await supabase
      .from('performance_metrics')
      .delete()
      .contains('metadata', { test: true });
    
    if (metricsError) {
      console.log(`⚠️ Failed to cleanup performance data: ${metricsError.message}`);
    } else {
      console.log('✅ Performance test data cleaned up');
    }
    
  } catch (error) {
    console.log(`⚠️ Error during cleanup: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Phase 2.1 Module 1: Feedback System Tests');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  try {
    // Run all test suites
    await testDatabaseMigration();
    await testFeedbackAPI();
    await testOutcomeTracking();
    await testBilingualSupport();
    await testDataRetrieval();
    
    // Clean up test data
    await cleanupTestData();
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Print test results
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Results Summary');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏱️ Duration: ${duration}ms`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`  - ${test.testName}: ${test.error}`);
      });
  }
  
  const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
  console.log(`\n🎯 Success Rate: ${successRate}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Phase 2.1 Module 1 is ready for integration.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review and fix issues before integration.');
  }
  
  return testResults.failed === 0;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testDatabaseMigration,
  testFeedbackAPI,
  testOutcomeTracking,
  testBilingualSupport,
  testDataRetrieval
};
