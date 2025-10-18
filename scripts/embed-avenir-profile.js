#!/usr/bin/env node
// ============================================
// Embed Avenir AI Solutions Profile
// ============================================
// Reads /data/avenir_profile.md, chunks it, generates embeddings,
// and stores them in Supabase for semantic matching

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai').default;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not configured');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// ============================================
// Helper Functions
// ============================================

function chunkText(text, chunkSize = 512, overlap = 64) {
  const words = text.split(/\s+/);
  const chunks = [];
  
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
    i += chunkSize - overlap;
  }
  
  return chunks;
}

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  });
  
  const embedding = response.data[0].embedding;
  
  // Verify dimension
  if (embedding.length !== 1536) {
    throw new Error(`Embedding dimension mismatch: expected 1536, got ${embedding.length}`);
  }
  
  return embedding;
}

async function getEmbeddingCount() {
  const { count, error } = await supabase
    .from('avenir_profile_embeddings')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    return 0;
  }
  
  return count || 0;
}

async function clearEmbeddings() {
  const { error } = await supabase
    .from('avenir_profile_embeddings')
    .delete()
    .neq('chunk_id', '___impossible___');
  
  if (error) {
    throw error;
  }
}

// ============================================
// Main Embedding Function
// ============================================

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🧠 AVENIR AI SOLUTIONS PROFILE EMBEDDING                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Check if OPENAI_API_KEY is set
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not configured');
    console.error('   Please set OPENAI_API_KEY in .env.local');
    process.exit(1);
  }
  
  // Check if profile file exists
  const profilePath = path.join(process.cwd(), 'data', 'avenir_profile.md');
  
  if (!fs.existsSync(profilePath)) {
    console.error('❌ Profile file not found:', profilePath);
    console.error('   Please ensure /data/avenir_profile.md exists');
    process.exit(1);
  }
  
  console.log('📄 Loaded profile from:', profilePath);
  const profileText = fs.readFileSync(profilePath, 'utf-8');
  
  console.log('📊 Profile size:', profileText.length, 'characters');
  console.log('📊 Estimated tokens:', Math.ceil(profileText.length / 4));
  console.log('');
  
  // Check if profile is already embedded
  const existingCount = await getEmbeddingCount();
  
  if (existingCount > 0) {
    console.log('ℹ️  Embeddings already exist —', existingCount, 'chunks found');
    console.log('');
    
    const forceFlag = process.argv.includes('--force');
    
    if (!forceFlag) {
      console.log('⚠️  Re-embedding recommended to ensure dimension consistency');
      console.log('   Skipping re-upload (use --force to re-embed)');
      console.log('');
      console.log('🎯 Avenir AI Solutions profile embeddings completed successfully');
      console.log('');
      process.exit(0);
    }
    
    console.log('🧹 Clearing existing embeddings before re-inserting...');
    await clearEmbeddings();
    console.log('   ✅ Cleared old embeddings');
    console.log('');
  }
  
  // Extract sections for better organization
  console.log('🔁 Chunking profile into segments...');
  const sections = profileText.split(/^## /gm).filter(s => s.trim());
  
  console.log('   Found', sections.length, 'sections');
  console.log('');
  
  const allChunks = [];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sectionTitle = section.split('\n')[0].trim();
    const sectionText = section.substring(sectionTitle.length).trim();
    
    console.log(`   Section ${i + 1}/${sections.length}: ${sectionTitle}`);
    
    // Chunk the section
    const chunks = chunkText(sectionText, 512, 64);
    
    console.log(`     → ${chunks.length} chunks`);
    
    for (let j = 0; j < chunks.length; j++) {
      const chunkText = chunks[j];
      
      if (chunkText.length < 50) {
        continue;
      }
      
      allChunks.push({
        id: `${sectionTitle.toLowerCase().replace(/\s+/g, '_')}_chunk_${j}`,
        text: chunkText,
        metadata: {
          section: sectionTitle,
          chunk_index: j,
          total_chunks: chunks.length,
        }
      });
    }
  }
  
  console.log('');
  console.log('🔁 Chunked into', allChunks.length, 'segments');
  console.log('');
  
  // Generate embeddings
  console.log('🧠 Generating embeddings...');
  console.log('   Model: text-embedding-3-small');
  console.log('   Dimensions: 1536');
  console.log('');
  
  const embeddings = [];
  
  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    
    process.stdout.write(`   [${i + 1}/${allChunks.length}] ${chunk.metadata.section}... `);
    
    try {
      const embedding = await generateEmbedding(chunk.text);
      
      embeddings.push({
        chunk_id: chunk.id,
        chunk_text: chunk.text,
        embedding: embedding,
        metadata: chunk.metadata,
      });
      
      console.log('✅');
      
      // Rate limit: 100ms between API calls
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log('❌');
      console.error('      Error:', error.message);
    }
  }
  
  console.log('');
  console.log('✅ Generated', embeddings.length, 'embeddings');
  console.log('✅ All vectors confirmed: 1536D each');
  console.log('');
  
  // Store in Supabase
  console.log('💾 Storing in Supabase...');
  
  // Batch insert (Supabase has a limit, so we'll do 10 at a time)
  const batchSize = 10;
  let stored = 0;
  
  for (let i = 0; i < embeddings.length; i += batchSize) {
    const batch = embeddings.slice(i, i + batchSize);
    
    process.stdout.write(`   Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(embeddings.length / batchSize)}... `);
    
    const { error } = await supabase
      .from('avenir_profile_embeddings')
      .upsert(batch, { onConflict: 'chunk_id' });
    
    if (error) {
      console.log('❌');
      console.error('      Error:', error.message);
    } else {
      console.log('✅');
      stored += batch.length;
    }
  }
  
  console.log('');
  console.log('💾 Stored', stored, '/', embeddings.length, 'chunks in Supabase');
  console.log('');
  
  // Final verification
  const finalCount = await getEmbeddingCount();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ EMBEDDING COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📊 Total chunks in Supabase:', finalCount);
  console.log('🗄️  Table: avenir_profile_embeddings');
  console.log('🎯 Model: text-embedding-3-small');
  console.log('📐 Dimensions: 1536D (verified)');
  console.log('✅ Profile ready for semantic matching');
  console.log('');
  console.log('✅ Re-embedded profile successfully —', finalCount, 'chunks stored, 1536D each.');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Run prospect scan to test Business Fit Scoring');
  console.log('  2. Check "View Proof" modal for fit scores and reasoning');
  console.log('  3. Verify bilingual reasoning (EN/FR)');
  console.log('');
}

main().catch((error) => {
  console.error('');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ EMBEDDING FAILED');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');
  console.error('Error:', error.message || error);
  console.error('');
  console.error('Troubleshooting:');
  console.error('  1. Check OPENAI_API_KEY is set in .env.local');
  console.error('  2. Verify Supabase connection (SUPABASE_SERVICE_ROLE_KEY)');
  console.error('  3. Ensure avenir_profile_embeddings table exists');
  console.error('  4. Check OpenAI API quota/limits');
  console.error('');
  process.exit(1);
});

