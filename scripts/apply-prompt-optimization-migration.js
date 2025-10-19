#!/usr/bin/env node

/**
 * Apply Prompt Optimization Migration
 * 
 * This script applies the prompt optimization system migration to the database.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🔄 Applying Prompt Optimization Migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20241221_create_prompt_optimization_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log('📊 Migration size:', migrationSQL.length, 'characters');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔧 Executing ${statements.length} SQL statements...\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim() === '') continue;

      try {
        console.log(`[${i + 1}/${statements.length}] Executing statement...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Check if it's a "already exists" error (which is OK)
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`   ⚠️  Statement skipped (already exists): ${error.message.substring(0, 100)}...`);
            successCount++;
          } else {
            console.error(`   ❌ Statement failed: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`   ✅ Statement executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.error(`   ❌ Statement error: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Results:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      
      // Test that tables were created
      console.log('\n🧪 Testing table creation...');
      
      const tables = ['prompt_registry', 'prompt_performance', 'prompt_ab_tests', 'prompt_evolution'];
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('id').limit(1);
          if (error) {
            console.log(`   ❌ Table ${table}: ${error.message}`);
          } else {
            console.log(`   ✅ Table ${table}: Created successfully`);
          }
        } catch (err) {
          console.log(`   ❌ Table ${table}: ${err.message}`);
        }
      }
      
      return true;
    } else {
      console.log('\n⚠️  Migration completed with errors. Some tables may not have been created.');
      return false;
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

// Run the migration
if (require.main === module) {
  applyMigration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { applyMigration };
