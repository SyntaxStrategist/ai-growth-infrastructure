// ============================================
// Phase 3: Prospect Optimization Engine Test
// ============================================
// Test script to verify Phase 3 implementation

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testPhase3Optimization() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  🚀 PHASE 3: PROSPECT OPTIMIZATION ENGINE TEST               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 PHASE 3 DATABASE TABLES VERIFICATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const phase3Tables = [
    'prospect_learning_insights',
    'prospect_adaptive_weights',
    'prospect_conversion_patterns',
    'prospect_conversion_insights',
    'prospect_scoring_models',
    'prospect_dynamic_scores',
    'prospect_optimization_log'
  ];

  let tablesExist = 0;
  let tablesWithData = 0;

  for (const tableName of phase3Tables) {
    try {
      console.log(`\n🔍 Checking table: ${tableName}`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ Table not accessible: ${error.message}`);
      } else {
        console.log(`   ✅ Table accessible`);
        tablesExist++;
        
        if (data && data.length > 0) {
          console.log(`   📊 Has data: ${data.length} record(s)`);
          tablesWithData++;
        } else {
          console.log(`   📭 No data yet`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error checking table: ${error.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 PHASE 3 TABLES SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Tables exist: ${tablesExist}/${phase3Tables.length}`);
  console.log(`Tables with data: ${tablesWithData}/${phase3Tables.length}`);
  console.log('');

  // Test API endpoint
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌐 PHASE 3 API ENDPOINT TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/prospect-intelligence/optimize`;
    
    console.log(`\n🔗 Testing API endpoint: ${apiUrl}`);
    
    // Test GET request for optimization status
    const response = await fetch(`${apiUrl}?action=get_optimization_status`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ API endpoint accessible');
      console.log('   📊 Response:', JSON.stringify(data, null, 2));
    } else {
      console.log(`   ❌ API endpoint error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   ❌ API endpoint test failed: ${error.message}`);
  }

  // Test Phase 3 file structure
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📁 PHASE 3 FILE STRUCTURE VERIFICATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const fs = require('fs');
  const path = require('path');

  const phase3Files = [
    'prospect-intelligence/phase3/icp_profile.ts',
    'prospect-intelligence/phase3/adaptive_learning.ts',
    'prospect-intelligence/phase3/conversion_analyzer.ts',
    'prospect-intelligence/phase3/dynamic_scoring.ts',
    'prospect-intelligence/phase3/optimized_pipeline.ts',
    'src/app/api/prospect-intelligence/optimize/route.ts',
    'supabase/migrations/20241226_create_phase3_optimization_tables.sql'
  ];

  let filesExist = 0;
  let filesValid = 0;

  for (const filePath of phase3Files) {
    const fullPath = path.join(process.cwd(), filePath);
    
    try {
      if (fs.existsSync(fullPath)) {
        console.log(`   ✅ ${filePath}`);
        filesExist++;
        
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.length > 100) { // Basic validation
          console.log(`      📄 Valid content (${content.length} chars)`);
          filesValid++;
        } else {
          console.log(`      ⚠️  Content seems too short`);
        }
      } else {
        console.log(`   ❌ ${filePath} - File not found`);
      }
    } catch (error) {
      console.log(`   ❌ ${filePath} - Error reading: ${error.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 PHASE 3 FILES SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Files exist: ${filesExist}/${phase3Files.length}`);
  console.log(`Files valid: ${filesValid}/${phase3Files.length}`);
  console.log('');

  // Test integration with existing systems
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔗 INTEGRATION VERIFICATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Check if existing prospect_candidates table is accessible
    const { data: prospects, error: prospectsError } = await supabase
      .from('prospect_candidates')
      .select('id, business_name, industry, region, automation_need_score')
      .limit(5);
    
    if (prospectsError) {
      console.log('   ❌ prospect_candidates table not accessible:', prospectsError.message);
    } else {
      console.log('   ✅ prospect_candidates table accessible');
      console.log(`   📊 Found ${prospects?.length || 0} prospects`);
    }

    // Check if feedback_tracking table is accessible
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback_tracking')
      .select('id, action_type, outcome')
      .limit(5);
    
    if (feedbackError) {
      console.log('   ❌ feedback_tracking table not accessible:', feedbackError.message);
    } else {
      console.log('   ✅ feedback_tracking table accessible');
      console.log(`   📊 Found ${feedback?.length || 0} feedback records`);
    }

  } catch (error) {
    console.log(`   ❌ Integration verification failed: ${error.message}`);
  }

  // Final summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ PHASE 3 OPTIMIZATION ENGINE TEST COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📊 Test Results:');
  console.log(`   Database Tables: ${tablesExist}/${phase3Tables.length} exist`);
  console.log(`   Tables with Data: ${tablesWithData}/${phase3Tables.length}`);
  console.log(`   Source Files: ${filesExist}/${phase3Files.length} exist`);
  console.log(`   Valid Files: ${filesValid}/${phase3Files.length}`);
  console.log('');
  
  if (tablesExist === phase3Tables.length && filesExist === phase3Files.length) {
    console.log('🎉 Phase 3 implementation is ready!');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Run the database migration: supabase db push');
    console.log('   2. Test the optimized pipeline: npm run test:phase3');
    console.log('   3. Monitor learning progress in the dashboard');
  } else {
    console.log('⚠️  Phase 3 implementation needs attention');
    console.log('');
    console.log('🔧 Required actions:');
    if (tablesExist < phase3Tables.length) {
      console.log('   - Apply database migration for missing tables');
    }
    if (filesExist < phase3Files.length) {
      console.log('   - Check for missing source files');
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run the test
testPhase3Optimization().catch(console.error);
