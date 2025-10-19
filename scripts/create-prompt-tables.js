#!/usr/bin/env node

/**
 * Create Prompt Optimization Tables
 * 
 * This script creates the prompt optimization tables directly using the Supabase client.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPromptTables() {
  console.log('🔄 Creating Prompt Optimization Tables...\n');

  try {
    // Create prompt_registry table
    console.log('1. Creating prompt_registry table...');
    const { error: registryError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.prompt_registry (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          prompt_name VARCHAR(100) NOT NULL,
          version VARCHAR(20) NOT NULL,
          variant_id VARCHAR(50) NOT NULL,
          prompt_content TEXT NOT NULL,
          prompt_type VARCHAR(50) NOT NULL,
          language VARCHAR(10) NOT NULL,
          optimization_strategy VARCHAR(100),
          parent_version VARCHAR(20),
          generation_method VARCHAR(50),
          is_active BOOLEAN DEFAULT FALSE,
          is_baseline BOOLEAN DEFAULT FALSE,
          traffic_percentage DECIMAL(5,2) DEFAULT 0.0,
          overall_score DECIMAL(5,3) DEFAULT 0.0,
          accuracy_score DECIMAL(5,3) DEFAULT 0.0,
          response_time_score DECIMAL(5,3) DEFAULT 0.0,
          consistency_score DECIMAL(5,3) DEFAULT 0.0,
          user_satisfaction_score DECIMAL(5,3) DEFAULT 0.0,
          total_uses INTEGER DEFAULT 0,
          successful_uses INTEGER DEFAULT 0,
          failed_uses INTEGER DEFAULT 0,
          avg_response_time_ms INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          last_used_at TIMESTAMPTZ,
          activated_at TIMESTAMPTZ,
          metadata JSONB,
          tags TEXT[],
          UNIQUE(prompt_name, version, variant_id)
        );
      `
    });

    if (registryError) {
      console.log('   ⚠️  prompt_registry table may already exist:', registryError.message);
    } else {
      console.log('   ✅ prompt_registry table created successfully');
    }

    // Create prompt_performance table
    console.log('2. Creating prompt_performance table...');
    const { error: performanceError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.prompt_performance (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          prompt_registry_id UUID NOT NULL,
          execution_id VARCHAR(100) NOT NULL,
          request_id VARCHAR(100),
          client_id UUID,
          input_data JSONB,
          input_hash VARCHAR(64),
          output_data JSONB,
          output_quality_score DECIMAL(5,3),
          response_time_ms INTEGER NOT NULL,
          token_count INTEGER,
          cost_usd DECIMAL(10,6),
          accuracy_score DECIMAL(5,3),
          consistency_score DECIMAL(5,3),
          completeness_score DECIMAL(5,3),
          error_occurred BOOLEAN DEFAULT FALSE,
          error_message TEXT,
          error_type VARCHAR(50),
          feedback_id UUID,
          user_rating INTEGER,
          executed_at TIMESTAMPTZ DEFAULT NOW(),
          metadata JSONB,
          environment VARCHAR(50) DEFAULT 'production'
        );
      `
    });

    if (performanceError) {
      console.log('   ⚠️  prompt_performance table may already exist:', performanceError.message);
    } else {
      console.log('   ✅ prompt_performance table created successfully');
    }

    // Create prompt_ab_tests table
    console.log('3. Creating prompt_ab_tests table...');
    const { error: abTestsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.prompt_ab_tests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          test_name VARCHAR(100) NOT NULL,
          test_description TEXT,
          prompt_name VARCHAR(100) NOT NULL,
          control_variant_id UUID NOT NULL,
          treatment_variant_id UUID NOT NULL,
          control_traffic_percentage DECIMAL(5,2) DEFAULT 50.0,
          treatment_traffic_percentage DECIMAL(5,2) DEFAULT 50.0,
          min_sample_size INTEGER DEFAULT 100,
          max_duration_days INTEGER DEFAULT 7,
          significance_level DECIMAL(5,3) DEFAULT 0.05,
          status VARCHAR(20) DEFAULT 'draft',
          start_date TIMESTAMPTZ,
          end_date TIMESTAMPTZ,
          control_metrics JSONB,
          treatment_metrics JSONB,
          statistical_significance DECIMAL(5,3),
          winner_variant_id UUID,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          metadata JSONB,
          created_by VARCHAR(100) DEFAULT 'system'
        );
      `
    });

    if (abTestsError) {
      console.log('   ⚠️  prompt_ab_tests table may already exist:', abTestsError.message);
    } else {
      console.log('   ✅ prompt_ab_tests table created successfully');
    }

    // Create prompt_evolution table
    console.log('4. Creating prompt_evolution table...');
    const { error: evolutionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.prompt_evolution (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          parent_prompt_id UUID NOT NULL,
          child_prompt_id UUID NOT NULL,
          evolution_type VARCHAR(50) NOT NULL,
          evolution_strategy VARCHAR(100),
          parent_performance JSONB,
          child_performance JSONB,
          improvement_score DECIMAL(5,3),
          feedback_data JSONB,
          optimization_goals TEXT[],
          evolved_at TIMESTAMPTZ DEFAULT NOW(),
          metadata JSONB,
          evolution_algorithm VARCHAR(50)
        );
      `
    });

    if (evolutionError) {
      console.log('   ⚠️  prompt_evolution table may already exist:', evolutionError.message);
    } else {
      console.log('   ✅ prompt_evolution table created successfully');
    }

    // Test table creation
    console.log('\n🧪 Testing table creation...');
    
    const tables = ['prompt_registry', 'prompt_performance', 'prompt_ab_tests', 'prompt_evolution'];
    let allTablesCreated = true;
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('id').limit(1);
        if (error) {
          console.log(`   ❌ Table ${table}: ${error.message}`);
          allTablesCreated = false;
        } else {
          console.log(`   ✅ Table ${table}: Accessible`);
        }
      } catch (err) {
        console.log(`   ❌ Table ${table}: ${err.message}`);
        allTablesCreated = false;
      }
    }

    if (allTablesCreated) {
      console.log('\n🎉 All prompt optimization tables created successfully!');
      return true;
    } else {
      console.log('\n⚠️  Some tables may not have been created properly.');
      return false;
    }

  } catch (error) {
    console.error('❌ Table creation failed:', error.message);
    return false;
  }
}

// Run the table creation
if (require.main === module) {
  createPromptTables()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Table creation script failed:', error);
      process.exit(1);
    });
}

module.exports = { createPromptTables };
