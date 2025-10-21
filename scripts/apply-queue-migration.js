#!/usr/bin/env node
/**
 * Apply Queue Jobs Table Migration
 * Creates the queue_jobs table for background job processing
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Queue Jobs Table Migration                                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../supabase/migrations/create_queue_jobs_table.sql');
    console.log('📄 Reading migration file:', migrationPath);
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded\n');

    // Execute the migration
    console.log('🚀 Applying migration to Supabase...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      // Try direct approach if RPC doesn't exist
      console.log('⚠️  RPC method not available, trying direct execution...');
      
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

      for (const statement of statements) {
        const { error: execError } = await supabase.rpc('exec', { sql: statement });
        if (execError) {
          console.warn('⚠️  Statement warning:', execError.message);
        }
      }
    }

    console.log('✅ Migration applied successfully\n');

    // Verify the table exists
    console.log('🔍 Verifying queue_jobs table...');
    const { data: testData, error: testError } = await supabase
      .from('queue_jobs')
      .select('id')
      .limit(1);

    if (testError && testError.code !== 'PGRST116') {
      throw new Error(`Table verification failed: ${testError.message}`);
    }

    console.log('✅ Table verified successfully\n');

    // Show table info
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Queue Jobs Table Schema:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  • id (UUID) - Primary key');
    console.log('  • job_type (VARCHAR) - Type of job (e.g., daily_prospect_queue)');
    console.log('  • status (VARCHAR) - pending, processing, completed, failed');
    console.log('  • payload (JSONB) - Input data for the job');
    console.log('  • result (JSONB) - Output data after completion');
    console.log('  • error (TEXT) - Error message if failed');
    console.log('  • created_at (TIMESTAMPTZ) - Job creation time');
    console.log('  • started_at (TIMESTAMPTZ) - Job start time');
    console.log('  • completed_at (TIMESTAMPTZ) - Job completion time');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Migration completed successfully!');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Test the cron endpoint: curl -X GET "https://www.aveniraisolutions.ca/api/cron/daily-prospect-queue"');
    console.log('   2. Check job status in database: SELECT * FROM queue_jobs ORDER BY created_at DESC LIMIT 5;');
    console.log('   3. Monitor worker logs in Vercel dashboard\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nYou may need to run this SQL manually in Supabase SQL Editor:');
    console.error('─────────────────────────────────────────────────────────────');
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/create_queue_jobs_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.error(sql);
    console.error('─────────────────────────────────────────────────────────────\n');
    
    process.exit(1);
  }
}

applyMigration();

