const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteTestClient() {
  console.log('🗑️  Deleting old test clients...');
  
  // Delete leads first
  const { error: leadsError } = await supabase
    .from('lead_memory')
    .delete()
    .eq('email', 'demo.aitraining@test.local')
    .eq('is_test', true);
    
  if (leadsError) console.error('Error deleting leads:', leadsError);
  
  // Delete lead actions
  const { error: actionsError } = await supabase
    .from('lead_actions')
    .delete()
    .eq('is_test', true);
    
  if (actionsError) console.error('Error deleting actions:', actionsError);
  
  // Delete client
  const { error: clientError } = await supabase
    .from('clients')
    .delete()
    .eq('email', 'demo.aitraining@test.local');
    
  if (clientError) console.error('Error deleting client:', clientError);
  
  console.log('✅ Cleanup complete!');
}

deleteTestClient();
