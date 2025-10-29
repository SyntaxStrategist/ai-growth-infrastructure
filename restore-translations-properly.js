const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreTranslationsProperly() {
  console.log('🔄 Restoring translations from backup...\n');
  
  try {
    // Read backup file
    const backupContent = fs.readFileSync('backup.sql', 'utf8');
    
    // Extract the INSERT statement
    const insertMatch = backupContent.match(/INSERT INTO "public"\."translation_dictionary"[^;]+;/s);
    
    if (!insertMatch) {
      console.error('❌ Could not find translation_dictionary INSERT statement');
      return;
    }
    
    const insertStatement = insertMatch[0];
    console.log('📄 Found INSERT statement in backup');
    
    // Clear existing translations first
    console.log('🗑️  Clearing existing translations...');
    const { error: deleteError } = await supabase
      .from('translation_dictionary')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.error('❌ Error clearing translations:', deleteError.message);
      return;
    }
    
    console.log('✅ Existing translations cleared');
    
    // Execute the INSERT statement directly
    console.log('📥 Restoring all translations...');
    const { error } = await supabase.rpc('exec_sql', { sql: insertStatement });
    
    if (error) {
      console.error('❌ Error restoring translations:', error.message);
      return;
    }
    
    console.log('✅ Translations restored successfully!');
    
    // Verify count
    const { count, error: countError } = await supabase
      .from('translation_dictionary')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting translations:', countError.message);
    } else {
      console.log(`📊 Total translations restored: ${count}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

restoreTranslationsProperly();
