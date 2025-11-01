const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkClients() {
  console.log('🔍 Checking client accounts...\n');
  
  const { data: clients, error } = await supabase
    .from('clients')
    .select('email, password_hash, status, created_at, is_test')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`Found ${clients.length} recent clients:\n`);
  
  clients.forEach((client, i) => {
    const hashPrefix = client.password_hash?.substring(0, 7) || 'none';
    console.log(`${i + 1}. ${client.email}`);
    console.log(`   Status: ${client.status || 'null'}`);
    console.log(`   Hash starts with: ${hashPrefix}`);
    console.log(`   Is test: ${client.is_test}`);
    console.log(`   Created: ${client.created_at}`);
    console.log('');
  });
  
  console.log('💡 bcryptjs hashes start with: $2a$ or $2b$');
  console.log('💡 bcrypt (native) also starts with: $2a$ or $2b$');
  console.log('   (They\'re actually compatible!)\n');
}

checkClients();
