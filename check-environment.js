#!/usr/bin/env node

/**
 * Environment Check Script
 * Safely checks environment configuration without database operations
 */

console.log('🔍 Environment Configuration Check');
console.log('===================================');
console.log('');

// Check Supabase configuration
console.log('📊 Supabase Configuration:');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('');

// Check other required environment variables
console.log('🔑 Other Required Variables:');
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('  GOOGLE_CREDENTIALS_JSON:', process.env.GOOGLE_CREDENTIALS_JSON ? '✅ Set' : '❌ Missing');
console.log('  GMAIL_FROM_ADDRESS:', process.env.GMAIL_FROM_ADDRESS ? '✅ Set' : '❌ Missing');
console.log('');

// Determine which Supabase key would be used
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🎯 Supabase Key Selection:');
if (serviceKey) {
  console.log('  ✅ Will use SERVICE ROLE KEY (full database access)');
  console.log('  ✅ Can bypass RLS policies');
  console.log('  ✅ Lead creation will work correctly');
} else if (anonKey) {
  console.log('  ⚠️  Will use ANON KEY (limited access)');
  console.log('  ❌ Cannot bypass RLS policies');
  console.log('  ❌ Lead creation will fail silently');
} else {
  console.log('  ❌ No Supabase key available');
  console.log('  ❌ Database operations will fail');
}
console.log('');

// Summary
console.log('📋 Summary:');
if (supabaseUrl && serviceKey) {
  console.log('  ✅ Environment is correctly configured');
  console.log('  ✅ Ready for lead creation and dashboard functionality');
} else if (supabaseUrl && anonKey) {
  console.log('  ⚠️  Environment is partially configured');
  console.log('  ❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.log('  ❌ Lead creation will fail due to RLS policies');
} else {
  console.log('  ❌ Environment is not properly configured');
  console.log('  ❌ Missing required Supabase credentials');
}
console.log('');

console.log('🔧 Next Steps:');
if (!serviceKey) {
  console.log('  1. Set SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables');
  console.log('  2. Redeploy the application');
  console.log('  3. Test lead creation functionality');
} else {
  console.log('  1. Environment is ready');
  console.log('  2. Test lead creation functionality');
  console.log('  3. Verify dashboard displays leads correctly');
}
console.log('');

console.log('📞 Test Client Credentials:');
console.log('  Email: test-client@aveniraisolutions.ca');
console.log('  Password: TestClient2025!');
console.log('  Client ID: a8c89837-7e45-44a4-a367-6010df87a723');
console.log('');
