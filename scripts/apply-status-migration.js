#!/usr/bin/env node
// ============================================
// Apply Status Column Migration for Clients
// ============================================
// Adds the status column to clients table for admin approval workflow

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not configured');
  console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function checkColumnExists() {
  try {
    // Try to query with status column
    const { error } = await supabase
      .from('clients')
      .select('id, status')
      .limit(1);
    
    // If no error or error is not about missing column, column exists
    if (!error || error.code !== '42703') {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function checkExistingClients() {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .limit(1);
    
    return { exists: !!data && data.length > 0, error };
  } catch (error) {
    return { exists: false, error };
  }
}

async function applyMigration() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   🏗️  STATUS COLUMN MIGRATION FOR CLIENTS TABLE             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Check if column already exists
  console.log('🔍 Checking if status column exists...');
  const columnExists = await checkColumnExists();
  
  if (columnExists) {
    console.log('✅ Column \'status\' already exists — migration complete');
    console.log('');
    
    // Check what statuses exist
    const { data: statuses } = await supabase
      .from('clients')
      .select('status')
      .not('status', 'is', null);
    
    console.log(`ℹ️  Found ${statuses?.length || 0} clients with status values`);
    console.log('');
    return;
  }
  
  console.log('📝 Status column does not exist — needs migration');
  console.log('');
  
  // Check if there are existing clients
  const { exists } = await checkExistingClients();
  if (exists) {
    console.log('ℹ️  Found existing clients in database');
    console.log('   These will be set to \'active\' status after migration');
    console.log('');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  MANUAL MIGRATION REQUIRED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('The migration needs to be run via Supabase.');
  console.log('');
  console.log('📋 Instructions:');
  console.log('');
  console.log('1. Go to: https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to: SQL Editor');
  console.log('4. Click: "+ New Query"');
  console.log('5. Copy and paste the SQL below:');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // Read and display the migration SQL
  const migrationPath = path.join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '20250122_add_status_to_clients.sql'
  );
  
  if (fs.existsSync(migrationPath)) {
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log(migrationSQL);
  } else {
    console.log('-- ERROR: Migration file not found');
  }
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('6. Click: "Run" or press Cmd/Ctrl + Enter');
  console.log('7. Verify success message');
  console.log('');
  console.log('✅ After running, signups will work with admin approval!');
  console.log('');
}

applyMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

