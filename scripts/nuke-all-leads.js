#!/usr/bin/env node
/**
 * NUCLEAR OPTION: Delete ALL leads and lead_actions
 * Use this to start fresh with a clean slate
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function nukeAllLeads() {
  console.log('\n💣 NUCLEAR CLEANUP: Deleting ALL leads\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Get counts before deletion
  const { count: leadActionsCount } = await supabase
    .from('lead_actions')
    .select('*', { count: 'exact', head: true });
  
  const { count: leadMemoryCount } = await supabase
    .from('lead_memory')
    .select('*', { count: 'exact', head: true });
  
  console.log('📊 Current state:');
  console.log(`   lead_actions: ${leadActionsCount} records`);
  console.log(`   lead_memory: ${leadMemoryCount} records`);
  console.log('');
  
  // Step 1: Delete lead_actions
  console.log('🗑️  Step 1: Deleting lead_actions...');
  const { error: actionsError } = await supabase
    .from('lead_actions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything
  
  if (actionsError) {
    console.error('❌ Error deleting lead_actions:', actionsError);
    throw actionsError;
  }
  console.log('✅ lead_actions cleared');
  
  // Step 2: Delete lead_memory
  console.log('🗑️  Step 2: Deleting lead_memory...');
  const { error: memoryError } = await supabase
    .from('lead_memory')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything
  
  if (memoryError) {
    console.error('❌ Error deleting lead_memory:', memoryError);
    throw memoryError;
  }
  console.log('✅ lead_memory cleared');
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 SUCCESS! All leads deleted');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('✨ Your database is now clean and ready for production!\n');
}

nukeAllLeads().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});

