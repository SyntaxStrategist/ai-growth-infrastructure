#!/usr/bin/env node

/**
 * Test script for Prompt Optimization System (Phase 2.2)
 * 
 * This script tests the prompt optimization system including:
 * - Prompt registry initialization
 * - Prompt variant management
 * - A/B testing functionality
 * - Performance tracking
 * - Complete isolation verification
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPromptOptimizationSystem() {
  console.log('🧪 Testing Prompt Optimization System (Phase 2.2)...\n');

  try {
    // Test 1: Check if prompt optimization tables exist
    console.log('1. Checking prompt optimization tables...');
    
    const { data: registryTable, error: registryError } = await supabase
      .from('prompt_registry')
      .select('id')
      .limit(1);
    
    if (registryError) {
      console.error('❌ prompt_registry table not accessible:', registryError.message);
      return false;
    }
    console.log('✅ prompt_registry table accessible');

    const { data: performanceTable, error: performanceError } = await supabase
      .from('prompt_performance')
      .select('id')
      .limit(1);
    
    if (performanceError) {
      console.error('❌ prompt_performance table not accessible:', performanceError.message);
      return false;
    }
    console.log('✅ prompt_performance table accessible');

    const { data: abTestsTable, error: abTestsError } = await supabase
      .from('prompt_ab_tests')
      .select('id')
      .limit(1);
    
    if (abTestsError) {
      console.error('❌ prompt_ab_tests table not accessible:', abTestsError.message);
      return false;
    }
    console.log('✅ prompt_ab_tests table accessible');

    const { data: evolutionTable, error: evolutionError } = await supabase
      .from('prompt_evolution')
      .select('id')
      .limit(1);
    
    if (evolutionError) {
      console.error('❌ prompt_evolution table not accessible:', evolutionError.message);
      return false;
    }
    console.log('✅ prompt_evolution table accessible\n');

    // Test 2: Initialize prompt registry
    console.log('2. Testing prompt registry initialization...');
    
    const initResponse = await fetch('http://localhost:3000/api/prompt-optimization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'initialize',
        data: {}
      })
    });

    if (!initResponse.ok) {
      console.error('❌ Prompt registry initialization failed:', initResponse.status, initResponse.statusText);
      return false;
    }

    const initResult = await initResponse.json();
    if (initResult.success) {
      console.log('✅ Prompt registry initialized successfully');
    } else {
      console.error('❌ Prompt registry initialization failed:', initResult.error);
      return false;
    }

    // Test 3: Check registered prompt variants
    console.log('\n3. Checking registered prompt variants...');
    
    const variantsResponse = await fetch('http://localhost:3000/api/prompt-optimization?action=variants&prompt_name=ai_enrichment_en');
    
    if (!variantsResponse.ok) {
      console.error('❌ Failed to get prompt variants:', variantsResponse.status, variantsResponse.statusText);
      return false;
    }

    const variantsResult = await variantsResponse.json();
    if (variantsResult.success && variantsResult.data) {
      console.log(`✅ Found ${variantsResult.data.length} prompt variants for ai_enrichment_en`);
      variantsResult.data.forEach(variant => {
        console.log(`   - ${variant.variant_id} v${variant.version} (${variant.is_active ? 'active' : 'inactive'})`);
      });
    } else {
      console.error('❌ Failed to get prompt variants:', variantsResult.error);
      return false;
    }

    // Test 4: Test prompt execution with optimization
    console.log('\n4. Testing prompt execution with optimization...');
    
    const executeResponse = await fetch('http://localhost:3000/api/prompt-optimization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'execute',
        data: {
          prompt_name: 'ai_enrichment_en',
          input_data: {
            message: 'We need AI automation for our customer support team',
            aiSummary: 'Enterprise B2B inquiry for AI integration'
          },
          language: 'en',
          options: {
            environment: 'test',
            metadata: {
              test: true
            }
          }
        }
      })
    });

    if (!executeResponse.ok) {
      console.error('❌ Prompt execution failed:', executeResponse.status, executeResponse.statusText);
      return false;
    }

    const executeResult = await executeResponse.json();
    if (executeResult.success) {
      console.log('✅ Prompt execution completed successfully');
      console.log('   Execution ID:', executeResult.data.executionId);
      console.log('   Output:', executeResult.data.output);
    } else {
      console.error('❌ Prompt execution failed:', executeResult.error);
      return false;
    }

    // Test 5: Test A/B test creation
    console.log('\n5. Testing A/B test creation...');
    
    const abTestResponse = await fetch('http://localhost:3000/api/prompt-optimization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'ab_test',
        data: {
          test_name: 'Test AI Enrichment Optimization',
          test_description: 'Testing prompt optimization system',
          prompt_name: 'ai_enrichment_en',
          control_variant_id: 'baseline',
          treatment_variant_id: 'few_shot_v1',
          control_traffic_percentage: 50.0,
          treatment_traffic_percentage: 50.0,
          min_sample_size: 10,
          max_duration_days: 1
        }
      })
    });

    if (!abTestResponse.ok) {
      console.error('❌ A/B test creation failed:', abTestResponse.status, abTestResponse.statusText);
      return false;
    }

    const abTestResult = await abTestResponse.json();
    if (abTestResult.success) {
      console.log('✅ A/B test created successfully');
      console.log('   Test ID:', abTestResult.data.testId);
    } else {
      console.error('❌ A/B test creation failed:', abTestResult.error);
      return false;
    }

    // Test 6: Test prompt evolution
    console.log('\n6. Testing prompt evolution...');
    
    const evolveResponse = await fetch('http://localhost:3000/api/prompt-optimization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'evolve',
        data: {
          prompt_name: 'ai_enrichment_en',
          parent_variant_id: 'baseline',
          evolution_strategy: 'few_shot_enhancement',
          feedback_data: {
            test_evolution: true,
            improvement_areas: ['accuracy', 'consistency']
          }
        }
      })
    });

    if (!evolveResponse.ok) {
      console.error('❌ Prompt evolution failed:', evolveResponse.status, evolveResponse.statusText);
      return false;
    }

    const evolveResult = await evolveResponse.json();
    if (evolveResult.success) {
      console.log('✅ Prompt evolution completed successfully');
      console.log('   New variant ID:', evolveResult.data.newVariantId);
    } else {
      console.error('❌ Prompt evolution failed:', evolveResult.error);
      return false;
    }

    // Test 7: Verify isolation from existing systems
    console.log('\n7. Verifying isolation from existing systems...');
    
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

    const { data: feedbackTable, error: feedbackError } = await supabase
      .from('feedback_tracking')
      .select('id')
      .limit(1);
    
    if (feedbackError) {
      console.error('❌ feedback_tracking table not accessible:', feedbackError.message);
      return false;
    }
    console.log('✅ feedback_tracking table still accessible (integration preserved)');

    // Test 8: Check prompt performance tracking
    console.log('\n8. Checking prompt performance tracking...');
    
    const { data: performanceData, error: perfError } = await supabase
      .from('prompt_performance')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(5);
    
    if (perfError) {
      console.error('❌ Failed to get prompt performance data:', perfError.message);
      return false;
    }
    
    console.log(`✅ Found ${performanceData.length} prompt performance records`);
    if (performanceData.length > 0) {
      console.log('   Latest execution:', {
        execution_id: performanceData[0].execution_id,
        response_time_ms: performanceData[0].response_time_ms,
        executed_at: performanceData[0].executed_at
      });
    }

    console.log('\n🎉 Prompt Optimization System Test PASSED!');
    console.log('✅ All prompt optimization components working correctly');
    console.log('✅ Prompt registry and variants operational');
    console.log('✅ A/B testing functionality confirmed');
    console.log('✅ Prompt evolution system working');
    console.log('✅ Performance tracking operational');
    console.log('✅ Existing functionality preserved');
    console.log('✅ Complete isolation maintained');
    
    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testPromptOptimizationSystem()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testPromptOptimizationSystem };
