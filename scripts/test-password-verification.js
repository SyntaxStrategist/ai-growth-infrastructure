const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPassword() {
  const email = 'iammikeoni879+test221001@gmail.com';
  const password = 'ballislife';
  
  console.log('🔍 Testing password verification...\n');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('');
  
  // Get client from database
  const { data: client, error } = await supabase
    .from('clients')
    .select('password_hash, status')
    .eq('email', email)
    .single();
    
  if (error || !client) {
    console.error('❌ Client not found:', error);
    return;
  }
  
  console.log('✅ Client found in database');
  console.log('   Status:', client.status);
  console.log('   Hash starts with:', client.password_hash.substring(0, 7));
  console.log('   Hash length:', client.password_hash.length);
  console.log('');
  
  // Test password verification
  console.log('🔐 Testing bcryptjs.compare()...');
  try {
    const isValid = await bcrypt.compare(password, client.password_hash);
    console.log('   Result:', isValid ? '✅ MATCH' : '❌ NO MATCH');
    
    if (!isValid) {
      console.log('');
      console.log('🧪 Testing if we can create a new hash...');
      const newHash = await bcrypt.hash(password, 10);
      console.log('   New hash:', newHash.substring(0, 20) + '...');
      
      const testNew = await bcrypt.compare(password, newHash);
      console.log('   New hash verifies:', testNew ? '✅ YES' : '❌ NO');
    }
  } catch (err) {
    console.error('❌ Error during verification:', err.message);
  }
}

testPassword();
