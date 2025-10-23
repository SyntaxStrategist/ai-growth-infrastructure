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
    
    // First, let's check the current constraint
    console.log('1. Checking current foreign key constraints...');
    const { data: currentConstraints, error: checkError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'lead_notes')
      .eq('constraint_type', 'FOREIGN KEY');
    
    if (checkError) {
      console.error('Error checking constraints:', checkError);
    } else {
      console.log('Current constraints:', currentConstraints);
    }
    
    // Try to drop the constraint using a direct SQL query
    console.log('2. Attempting to drop existing constraint...');
    const { error: dropError } = await supabase
      .rpc('sql', {
        query: 'ALTER TABLE public.lead_notes DROP CONSTRAINT IF EXISTS lead_notes_client_id_fkey;'
      });
    
    if (dropError) {
      console.log('Drop constraint error (may be expected):', dropError.message);
    } else {
      console.log('✅ Dropped existing constraint');
    }
    
    // Try to add the new constraint
    console.log('3. Attempting to add correct constraint...');
    const { error: addError } = await supabase
      .rpc('sql', {
        query: 'ALTER TABLE public.lead_notes ADD CONSTRAINT lead_notes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(client_id) ON DELETE SET NULL;'
      });
    
    if (addError) {
      console.log('Add constraint error (may be expected):', addError.message);
    } else {
      console.log('✅ Added correct foreign key constraint');
    }
    
    console.log('🎉 Attempted to fix lead notes foreign key constraint!');
    console.log('   - If this didn\'t work, you may need to run the SQL manually in Supabase dashboard');
    console.log('   - The SQL commands are in fix-lead-notes-fk.sql');
    
  } catch (error) {
    console.error('❌ Error fixing lead notes foreign key:', error);
    console.log('📝 Manual fix required:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Run the SQL commands from fix-lead-notes-fk.sql');
    console.log('   3. This will fix the foreign key constraint issue');
  }
}

fixLeadNotesForeignKey();
