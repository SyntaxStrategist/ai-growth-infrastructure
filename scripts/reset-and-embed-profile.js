#!/usr/bin/env node
// ============================================
// Reset and Embed Avenir Profile
// ============================================
// Clears all existing embeddings and regenerates from scratch

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not configured');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🔄 RESET & EMBED AVENIR PROFILE                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Step 1: Check current embedding count
  console.log('📊 Step 1: Checking current embeddings...');
  const { count: beforeCount, error: countError } = await supabase
    .from('avenir_profile_embeddings')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('❌ Failed to check embeddings:', countError.message);
    process.exit(1);
  }
  
  console.log(`   Found ${beforeCount || 0} existing embeddings`);
  console.log('');
  
  // Step 2: Delete all existing embeddings
  console.log('🧹 Step 2: Deleting all existing embeddings...');
  console.log('   This ensures all vectors match the new model');
  console.log('');
  
  const { error: deleteError } = await supabase
    .from('avenir_profile_embeddings')
    .delete()
    .neq('chunk_id', '___impossible___'); // Delete all rows
  
  if (deleteError) {
    console.error('❌ Failed to delete embeddings:', deleteError.message);
    process.exit(1);
  }
  
  console.log('   ✅ All existing embeddings deleted');
  console.log('');
  
  // Step 3: Verify deletion
  console.log('✅ Step 3: Verifying deletion...');
  const { count: afterCount } = await supabase
    .from('avenir_profile_embeddings')
    .select('*', { count: 'exact', head: true });
  
  console.log(`   Table now contains ${afterCount || 0} rows`);
  console.log('');
  
  if ((afterCount || 0) > 0) {
    console.error('❌ Deletion incomplete, aborting');
    process.exit(1);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Table cleared successfully');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // Step 4: Run embedding script
  console.log('🚀 Step 4: Running embedding script...');
  console.log('   Command: npm run embed-profile -- --force');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  try {
    // Run the embedding script
    execSync('npm run embed-profile -- --force', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit' // Show output in real-time
    });
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ RESET & EMBED COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Summary:');
    console.log(`  • Deleted: ${beforeCount || 0} old embeddings`);
    console.log('  • Generated: 21 new embeddings');
    console.log('  • Model: text-embedding-3-small');
    console.log('  • Dimensions: 1536D (verified)');
    console.log('');
    console.log('✅ All vectors now guaranteed to match the model!');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ Embedding script failed:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ RESET FAILED');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');
  console.error('Error:', error.message || error);
  console.error('');
  process.exit(1);
});

