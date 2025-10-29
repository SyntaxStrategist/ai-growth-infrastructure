const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTables() {
  console.log('🔍 Checking ALL tables that should exist...\n');
  
  // All tables that should exist based on your migrations
  const expectedTables = [
    // Core tables
    'clients',
    'lead_memory', 
    'lead_actions',
    'lead_notes',
    
    // Translation system
    'translation_dictionary',
    'translation_cache',
    'intent_translations',
    
    // Prospect intelligence
    'prospect_candidates',
    'prospect_outreach_logs',
    'prospect_industry_performance',
    'prospect_learning_insights',
    'prospect_adaptive_weights',
    'prospect_conversion_patterns',
    'prospect_conversion_insights',
    'prospect_scoring_models',
    'prospect_dynamic_scores',
    'prospect_optimization_log',
    'prospect_form_tests',
    
    // Outreach system
    'outreach_emails',
    'outreach_campaigns',
    'outreach_metrics',
    'outreach_tracking',
    
    // Email system
    'email_templates',
    
    // Feedback and performance
    'feedback_tracking',
    'performance_metrics',
    
    // Prompt optimization
    'prompt_registry',
    'prompt_performance',
    'prompt_ab_tests',
    'prompt_evolution',
    
    // Avenir specific
    'avenir_profile_embeddings',
    
    // Integration
    'integration_logs'
  ];
  
  console.log('📊 Checking table existence...');
  
  const existingTables = [];
  const missingTables = [];
  
  for (const table of expectedTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        missingTables.push(table);
        console.log(`❌ ${table}: MISSING`);
      } else {
        existingTables.push(table);
        console.log(`✅ ${table}: ${count || 0} records`);
      }
    } catch (err) {
      missingTables.push(table);
      console.log(`❌ ${table}: MISSING`);
    }
  }
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`✅ Existing tables: ${existingTables.length}`);
  console.log(`❌ Missing tables: ${missingTables.length}`);
  
  if (missingTables.length > 0) {
    console.log(`\n❌ MISSING TABLES:`);
    missingTables.forEach(table => console.log(`   - ${table}`));
  }
}

checkAllTables();
