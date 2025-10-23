const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugConstraint() {
  try {
    console.log('🔍 Debugging lead_notes foreign key constraint...');
    
    // Check if the client exists in the clients table
    console.log('1. Checking if client exists in clients table...');
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, client_id, business_name')
      .eq('client_id', 'bba2bb74-4473-4ee3-8ef1-c356cd1428a8')
      .single();
    
    if (clientError) {
      console.error('Client lookup error:', clientError);
    } else {
      console.log('✅ Client found:', clientData);
    }
    
    // Check what the foreign key constraint is actually pointing to
    console.log('2. Checking foreign key constraint details...');
    const { data: constraintData, error: constraintError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            conname as constraint_name,
            confrelid::regclass as referenced_table,
            confkey as referenced_columns,
            pg_get_constraintdef(oid) as constraint_definition
          FROM pg_constraint 
          WHERE conname = 'lead_notes_client_id_fkey';
        `
      });
    
    if (constraintError) {
      console.log('Could not check constraint via API, but the issue is clear...');
    } else {
      console.log('Constraint details:', constraintData);
    }
    
    console.log('📝 The issue is:');
    console.log('   - The foreign key constraint exists but points to the wrong field');
    console.log('   - It needs to point to clients.client_id (TEXT) not clients.id (UUID)');
    console.log('');
    console.log('🔧 Run this SQL in Supabase Dashboard:');
    console.log('');
    console.log('-- Drop the existing constraint');
    console.log('ALTER TABLE public.lead_notes DROP CONSTRAINT IF EXISTS lead_notes_client_id_fkey;');
    console.log('');
    console.log('-- Add the correct constraint pointing to clients.client_id');
    console.log('ALTER TABLE public.lead_notes ADD CONSTRAINT lead_notes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(client_id) ON DELETE SET NULL;');
    console.log('');
    console.log('This will fix the constraint to point to the correct field.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugConstraint();
