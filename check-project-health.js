const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjectHealth() {
  console.log('🔍 Checking project health...\n');
  
  try {
    // Check key tables
    const tables = [
      'clients',
      'lead_memory', 
      'lead_actions',
      'lead_notes',
      'translation_dictionary',
      'translation_cache',
      'prospect_candidates',
      'prospect_outreach_logs',
      'email_templates',
      'outreach_emails',
      'integration_logs'
    ];
    
    console.log('📊 Checking table existence and data...');
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: ERROR - ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${count || 0} records`);
        }
      } catch (err) {
        console.log(`❌ ${table}: TABLE MISSING`);
      }
    }
    
    console.log('\n🔍 Checking specific data...');
    
    // Check clients
    const { data: clients } = await supabase.from('clients').select('*');
    console.log(`👥 Clients: ${clients?.length || 0}`);
    if (clients && clients.length > 0) {
      console.log(`   Sample: ${clients[0].business_name}`);
    }
    
    // Check translations
    const { data: translations } = await supabase.from('translation_dictionary').select('*', { count: 'exact' });
    console.log(`📚 Translations: ${translations?.length || 0}`);
    
    // Check leads
    const { data: leads } = await supabase.from('lead_memory').select('*', { count: 'exact' });
    console.log(`📝 Leads: ${leads?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Error checking project health:', error.message);
  }
}

checkProjectHealth();
