const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLeadNotesDataTypes() {
  try {
    console.log('🔧 Fixing lead_notes data type mismatch...');
    console.log('   - lead_notes.client_id is UUID but clients.client_id is TEXT');
    console.log('   - Need to change lead_notes.client_id to TEXT');
    
    // Check current data types
    console.log('1. Checking current data types...');
    const { data: columnInfo, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, data_type')
      .in('table_name', ['lead_notes', 'clients'])
      .in('column_name', ['client_id']);
    
    if (columnError) {
      console.log('Could not check column info via API, proceeding with fix...');
    } else {
      console.log('Current column types:', columnInfo);
    }
    
    console.log('📝 Manual fix required:');
    console.log('');
    console.log('Go to Supabase Dashboard > SQL Editor and run:');
    console.log('');
    console.log('-- Fix lead_notes foreign key constraint with correct data types');
    console.log('ALTER TABLE public.lead_notes DROP CONSTRAINT IF EXISTS lead_notes_client_id_fkey;');
    console.log('ALTER TABLE public.lead_notes ALTER COLUMN client_id TYPE TEXT;');
    console.log('ALTER TABLE public.lead_notes ADD CONSTRAINT lead_notes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(client_id) ON DELETE SET NULL;');
    console.log('');
    console.log('This will:');
    console.log('1. Drop the existing constraint');
    console.log('2. Change lead_notes.client_id from UUID to TEXT');
    console.log('3. Add the correct foreign key constraint');
    console.log('');
    console.log('After this, notes should work with client_id: bba2bb74-4473-4ee3-8ef1-c356cd1428a8');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixLeadNotesDataTypes();
