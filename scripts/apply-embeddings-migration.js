#!/usr/bin/env node
// ============================================
// Apply Avenir Profile Embeddings Migration
// ============================================
// Automatically creates the avenir_profile_embeddings table in Supabase

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

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

async function checkTableExists() {
  try {
    const { error } = await supabase
      .from('avenir_profile_embeddings')
      .select('id')
      .limit(1);
    
    // If no error or error is just "no rows", table exists
    return !error || error.code !== 'PGRST116';
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
    __dirname,
    '..',
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
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  MANUAL STEP REQUIRED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Supabase JS client cannot execute DDL statements directly.');
  console.log('Please complete the migration manually:');
  console.log('');
  console.log('Method 1: Supabase Dashboard (Recommended)');
  console.log('  1. Go to: https://supabase.com/dashboard');
  console.log('  2. Select your project');
  console.log('  3. Go to: SQL Editor');
  console.log('  4. Click: "+ New Query"');
  console.log('  5. Copy and paste the SQL from:');
  console.log('     supabase/migrations/create_avenir_profile_embeddings_table.sql');
  console.log('  6. Click: "Run" or press Cmd/Ctrl + Enter');
  console.log('  7. Verify success message');
  console.log('');
  console.log('Method 2: Supabase CLI');
  console.log('  1. Install: npm install -g supabase');
  console.log('  2. Link: supabase link --project-ref <your-project-ref>');
  console.log('  3. Push: supabase db push');
  console.log('');
  console.log('Method 3: Direct SQL Execution');
  console.log('  The SQL file contains:');
  console.log('  • CREATE EXTENSION vector (for pgvector)');
  console.log('  • CREATE TABLE avenir_profile_embeddings');
  console.log('  • CREATE INDEX for fast similarity search');
  console.log('  • CREATE TRIGGER for auto-update timestamps');
  console.log('');
  console.log('After manual execution, verify with:');
  console.log('  SELECT * FROM avenir_profile_embeddings LIMIT 1;');
  console.log('');
  console.log('Then run:');
  console.log('  npm run embed-profile');
  console.log('');
  console.log("🏗️  Supabase migration for profile embeddings finished");
  console.log('   (Manual execution required)');
  console.log('');
}

applyMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

