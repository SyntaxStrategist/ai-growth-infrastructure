const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRLS() {
  console.log('🔍 Checking RLS on clients table...\n');
  
  // Query with service role (should work)
  const { data: withService, error: serviceError } = await supabase
    .from('clients')
    .select('email')
    .eq('email', 'iammikeoni879+test221001@gmail.com')
    .single();
    
  console.log('With SERVICE ROLE key:');
  console.log('  Found:', !!withService);
  console.log('  Error:', serviceError?.message || 'none');
  console.log('');
  
  // Try with anon key (simulates what API might be using if misconfigured)
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const { data: withAnon, error: anonError } = await anonClient
    .from('clients')
    .select('email')
    .eq('email', 'iammikeoni879+test221001@gmail.com')
    .single();
    
  console.log('With ANON key:');
  console.log('  Found:', !!withAnon);
  console.log('  Error:', anonError?.message || 'none');
  console.log('');
  
  if (serviceError && !withService) {
    console.log('❌ RLS is blocking even SERVICE ROLE queries!');
  } else if (anonError && !withAnon) {
    console.log('⚠️  RLS is enabled and blocking ANON queries (expected)');
  } else {
    console.log('✅ No RLS issues detected');
  }
}

checkRLS();
