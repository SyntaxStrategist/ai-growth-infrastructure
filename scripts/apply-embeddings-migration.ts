#!/usr/bin/env ts-node
// ============================================
// Apply Avenir Profile Embeddings Migration
// ============================================
// Automatically creates the avenir_profile_embeddings table in Supabase

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not configured');
  console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function checkTableExists(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('avenir_profile_embeddings')
      .select('id')
      .limit(1);
    
    // If no error, table exists
    return !error;
  } catch (error) {
    return false;
  }
}

async function applyMigration() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   🏗️  AVENIR PROFILE EMBEDDINGS TABLE MIGRATION            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Check if table already exists
  console.log('🔍 Checking if table already exists...');
  const tableExists = await checkTableExists();
  
  if (tableExists) {
    console.log("ℹ️  Table 'avenir_profile_embeddings' already exists — skipping migration");
    console.log('');
    console.log("🏗️  Supabase migration for profile embeddings finished");
    console.log('');
    return;
  }
  
  console.log('📝 Table does not exist — applying migration...');
  console.log('');
  
  // Read migration SQL
  const migrationPath = path.join(
    process.cwd(),
    'supabase',
    'migrations',
    'create_avenir_profile_embeddings_table.sql'
  );
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }
  
  console.log('📄 Reading migration from:', migrationPath);
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log('📊 SQL size:', migrationSQL.length, 'characters');
  console.log('');
  
  // Execute migration
  console.log('🔄 Executing SQL migration...');
  console.log('');
  
  try {
    // Split SQL into individual statements (separated by semicolons)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log('📝 Found', statements.length, 'SQL statements to execute');
    console.log('');
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\s+/g, ' ') + '...';
      
      console.log(`   ${i + 1}/${statements.length}. ${preview}`);
      
      // Execute statement using Supabase RPC
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        // Try direct query execution as fallback
        console.log('      ⚠️  RPC failed, trying direct execution...');
        
        // For pgvector extension, we need to use a different approach
        if (statement.includes('CREATE EXTENSION')) {
          console.log('      ℹ️  Extension creation - may need manual setup in Supabase dashboard');
          console.log('      → Enable "vector" extension in Database → Extensions');
          continue;
        }
        
        // For other statements, we can't directly execute DDL via Supabase JS client
        // Log the issue but continue
        console.log('      ⚠️  Statement requires manual execution');
      } else {
        console.log('      ✅');
      }
    }
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  MANUAL STEP REQUIRED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Supabase JS client cannot execute DDL statements directly.');
    console.log('Please complete the migration manually:');
    console.log('');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy the contents of:');
    console.log('   supabase/migrations/create_avenir_profile_embeddings_table.sql');
    console.log('3. Paste and execute in SQL Editor');
    console.log('4. Verify table created:');
    console.log('   SELECT * FROM avenir_profile_embeddings LIMIT 1;');
    console.log('');
    console.log('Alternatively, use Supabase CLI:');
    console.log('   supabase db push');
    console.log('');
    console.log("🏗️  Supabase migration for profile embeddings finished");
    console.log('   (Manual execution required)');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ MIGRATION FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    console.error('Error:', error instanceof Error ? error.message : error);
    console.error('');
    console.error('Please apply the migration manually in Supabase dashboard');
    console.error('');
    process.exit(1);
  }
}

applyMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

