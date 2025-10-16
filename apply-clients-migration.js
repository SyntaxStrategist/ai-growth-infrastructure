const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('[E2E-Test] [Migration] Reading clients table migration...');
  
  const sql = fs.readFileSync('supabase/migrations/create_clients_table.sql', 'utf8');
  
  console.log('[E2E-Test] [Migration] Applying migration to Supabase...');
  
  // Execute the SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });
  
  if (error) {
    console.error('[E2E-Test] [Migration] ❌ Migration failed:', error);
    
    // Try alternative: create table directly
    console.log('[E2E-Test] [Migration] Trying direct table creation...');
    
    const { error: createError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (createError && createError.code === '42P01') {
      console.error('[E2E-Test] [Migration] ❌ Table does not exist');
      console.log('[E2E-Test] [Migration] Please run the migration manually in Supabase dashboard:');
      console.log('   1. Go to Supabase dashboard → SQL Editor');
      console.log('   2. Run: supabase/migrations/create_clients_table.sql');
      process.exit(1);
    }
  } else {
    console.log('[E2E-Test] [Migration] ✅ Migration applied successfully');
  }
  
  // Verify table exists
  const { error: checkError } = await supabase
    .from('clients')
    .select('*')
    .limit(1);
  
  if (checkError) {
    console.error('[E2E-Test] [Migration] ❌ Table verification failed:', checkError);
    process.exit(1);
  }
  
  console.log('[E2E-Test] [Migration] ✅ Clients table exists and is accessible');
}

applyMigration().catch(err => {
  console.error('[E2E-Test] [Migration] ❌ Unexpected error:', err);
  process.exit(1);
});
