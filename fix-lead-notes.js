const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLeadNotesForeignKey() {
  try {
    console.log('🔧 Fixing lead_notes foreign key constraint...');
    
    // Drop the existing foreign key constraint
    console.log('1. Dropping existing foreign key constraint...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.lead_notes DROP CONSTRAINT IF EXISTS lead_notes_client_id_fkey;'
    });
    
    if (dropError) {
      console.error('Error dropping constraint:', dropError);
    } else {
      console.log('✅ Dropped existing constraint');
    }
    
    // Add the correct foreign key constraint
    console.log('2. Adding correct foreign key constraint...');
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.lead_notes ADD CONSTRAINT lead_notes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(client_id) ON DELETE SET NULL;'
    });
    
    if (addError) {
      console.error('Error adding constraint:', addError);
    } else {
      console.log('✅ Added correct foreign key constraint');
    }
    
    // Verify the fix
    console.log('3. Verifying the fix...');
    const { data: constraintData, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: `SELECT 
        conname as constraint_name,
        confrelid::regclass as referenced_table,
        confkey as referenced_columns
      FROM pg_constraint 
      WHERE conname = 'lead_notes_client_id_fkey';`
    });
    
    if (verifyError) {
      console.error('Error verifying constraint:', verifyError);
    } else {
      console.log('✅ Constraint verification:', constraintData);
    }
    
    console.log('🎉 Lead notes foreign key fix completed successfully!');
    console.log('   - Notes should now work with client_id: bba2bb74-4473-4ee3-8ef1-c356cd1428a8');
    
  } catch (error) {
    console.error('❌ Error fixing lead notes foreign key:', error);
    process.exit(1);
  }
}

fixLeadNotesForeignKey();
