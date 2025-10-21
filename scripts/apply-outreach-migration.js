#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔧 APPLYING OUTREACH_EMAILS MIGRATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/make_prospect_id_nullable_in_outreach_emails.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('Migration SQL:');
  console.log(migrationSQL);
  console.log('');

  console.log('Executing migration...');
  
  // Split by semicolons and execute each statement
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  for (const statement of statements) {
    if (statement) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error('❌ Error:', error.message);
        console.log('');
        console.log('Please run this SQL manually in Supabase SQL Editor:');
        console.log('');
        console.log(migrationSQL);
        console.log('');
        process.exit(1);
      }
    }
  }

  console.log('✅ Migration applied successfully!');
  console.log('');
  console.log('Verifying...');
  
  // Test insert
  const testEmail = {
    prospect_id: null, // Should now be allowed
    prospect_email: 'test@example.com',
    prospect_name: 'Test User',
    company_name: 'Test Company',
    subject: 'Test Subject',
    content: 'Test content',
    status: 'pending'
  };

  const { data, error } = await supabase
    .from('outreach_emails')
    .insert([testEmail])
    .select();

  if (error) {
    console.error('❌ Verification failed:', error.message);
  } else {
    console.log('✅ Verification successful! prospect_id can now be NULL');
    // Clean up
    await supabase.from('outreach_emails').delete().eq('id', data[0].id);
  }
}

applyMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

