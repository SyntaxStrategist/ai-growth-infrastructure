#!/usr/bin/env ts-node
// ============================================
// Embed Avenir AI Solutions Profile
// ============================================
// Reads /data/avenir_profile.md, chunks it, generates embeddings,
// and stores them in Supabase for semantic matching

import fs from 'fs';
import path from 'path';
import { embedAvenirProfile, getProfileEmbeddingCount, clearProfileEmbeddings } from '../src/lib/semantic_matcher';

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🧠 AVENIR AI SOLUTIONS PROFILE EMBEDDING                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Check if profile file exists
  const profilePath = path.join(process.cwd(), 'data', 'avenir_profile.md');
  
  if (!fs.existsSync(profilePath)) {
    console.error('❌ Profile file not found:', profilePath);
    console.error('   Please ensure /data/avenir_profile.md exists');
    process.exit(1);
  }
  
  console.log('📄 Reading profile from:', profilePath);
  const profileText = fs.readFileSync(profilePath, 'utf-8');
  
  console.log('📊 Profile size:', profileText.length, 'characters');
  console.log('📊 Estimated tokens:', Math.ceil(profileText.length / 4));
  console.log('');
  
  // Check if profile is already embedded
  const existingCount = await getProfileEmbeddingCount();
  
  if (existingCount > 0) {
    console.log('⚠️  Profile already embedded with', existingCount, 'chunks');
    console.log('   Do you want to re-embed? This will clear existing embeddings.');
    console.log('   To proceed, run: npm run embed-profile -- --force');
    
    const forceFlag = process.argv.includes('--force');
    
    if (!forceFlag) {
      console.log('');
      console.log('✅ Skipping embedding (use --force to re-embed)');
      process.exit(0);
    }
    
    console.log('');
    console.log('🗑️  Clearing existing embeddings...');
    await clearProfileEmbeddings();
    console.log('✅ Existing embeddings cleared');
    console.log('');
  }
  
  // Embed the profile
  console.log('🔄 Starting embedding process...');
  console.log('   Model: text-embedding-3-small');
  console.log('   Dimensions: 1536');
  console.log('   Chunk size: ~512 tokens');
  console.log('   Overlap: ~64 tokens');
  console.log('');
  
  try {
    await embedAvenirProfile(profileText);
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    const finalCount = await getProfileEmbeddingCount();
    console.log('📊 Total chunks embedded:', finalCount);
    console.log('🗄️  Stored in: avenir_profile_embeddings table');
    console.log('✅ Profile ready for semantic matching');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Run prospect scan to test Business Fit Scoring');
    console.log('  2. Check "View Proof" modal for fit scores and reasoning');
    console.log('  3. Verify bilingual reasoning (EN/FR)');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ EMBEDDING FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    console.error('Error:', error instanceof Error ? error.message : error);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  1. Check OPENAI_API_KEY is set in .env.local');
    console.error('  2. Verify Supabase connection (SUPABASE_SERVICE_ROLE_KEY)');
    console.error('  3. Ensure avenir_profile_embeddings table exists');
    console.error('  4. Check OpenAI API quota/limits');
    console.error('');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

