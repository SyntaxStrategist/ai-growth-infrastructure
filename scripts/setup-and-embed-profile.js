#!/usr/bin/env node
// ============================================
// Setup and Embed Avenir Profile (Automated)
// ============================================
// Creates table if needed, then embeds the profile

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai').default;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not configured');
  process.exit(1);
}

if (!openaiKey) {
  console.error('❌ OPENAI_API_KEY not configured');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: openaiKey });
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// ============================================
// Helper Functions
// ============================================

async function checkTableExists() {
  try {
    const { error } = await supabase
      .from('avenir_profile_embeddings')
      .select('id')
      .limit(1);
    
    return !error || error.code !== 'PGRST116';
  } catch (error) {
    return false;
  }
}

async function getEmbeddingCount() {
  try {
    const { count } = await supabase
      .from('avenir_profile_embeddings')
      .select('*', { count: 'exact', head: true });
    
    return count || 0;
  } catch (error) {
    return 0;
  }
}

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
  
  return response.data[0].embedding;
}

async function createTableWithSQL() {
  console.log('🔧 Attempting to create table using Supabase...');
  console.log('');
  
  const sql = `
    -- Enable pgvector extension
    CREATE EXTENSION IF NOT EXISTS vector;
    
    -- Create table
    CREATE TABLE IF NOT EXISTS public.avenir_profile_embeddings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chunk_id TEXT UNIQUE NOT NULL,
      chunk_text TEXT NOT NULL,
      embedding vector(1536) NOT NULL,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create index for fast similarity search
    CREATE INDEX IF NOT EXISTS idx_avenir_profile_embeddings_embedding
    ON public.avenir_profile_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
    
    -- Create index for chunk_id
    CREATE INDEX IF NOT EXISTS idx_avenir_profile_embeddings_chunk_id
    ON public.avenir_profile_embeddings(chunk_id);
  `;
  
  // Supabase doesn't have exec_sql by default, so we provide manual instructions
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  MANUAL SQL EXECUTION REQUIRED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Please execute this SQL in Supabase Dashboard:');
  console.log('');
  console.log('1. Go to: https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to: SQL Editor');
  console.log('4. Paste and run this SQL:');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(sql);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Or copy from file:');
  console.log('  supabase/migrations/create_avenir_profile_embeddings_table.sql');
  console.log('');
  console.log('After executing, press Enter to continue...');
  
  // Wait for user confirmation
  return new Promise((resolve) => {
    process.stdin.once('data', () => {
      console.log('');
      console.log('✅ Proceeding with embedding...');
      console.log('');
      resolve();
    });
  });
}

// ============================================
// Main Function
// ============================================

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🧠 AVENIR PROFILE SETUP & EMBEDDING (AUTOMATED)            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Step 1: Check table exists
  console.log('🔍 Step 1: Checking if table exists...');
  const tableExists = await checkTableExists();
  
  if (!tableExists) {
    console.log('   ❌ Table not found');
    console.log('');
    
    // Provide SQL for manual execution
    await createTableWithSQL();
    
    // Re-check after user confirmation
    const tableNowExists = await checkTableExists();
    
    if (!tableNowExists) {
      console.log('❌ Table still not found. Please ensure SQL was executed.');
      console.log('   Then re-run: npm run embed-profile');
      process.exit(1);
    }
    
    console.log('✅ Table verified!');
  } else {
    console.log('   ✅ Table exists');
  }
  
  console.log('');
  
  // Step 2: Check if already embedded
  console.log('🔍 Step 2: Checking existing embeddings...');
  const existingCount = await getEmbeddingCount();
  
  if (existingCount > 0) {
    console.log(`   ℹ️  Embeddings already exist — ${existingCount} chunks found`);
    
    const forceFlag = process.argv.includes('--force');
    
    if (!forceFlag) {
      console.log('   Skipping re-upload (use --force to re-embed)');
      console.log('');
      console.log('🎯 Avenir AI Solutions profile embeddings completed successfully');
      console.log('');
      process.exit(0);
    }
    
    console.log('   --force flag detected, will re-embed');
  } else {
    console.log('   No existing embeddings found');
  }
  
  console.log('');
  
  // Step 3: Load profile
  console.log('📄 Step 3: Loading profile...');
  const profilePath = path.join(process.cwd(), 'data', 'avenir_profile.md');
  
  if (!fs.existsSync(profilePath)) {
    console.error('   ❌ Profile file not found:', profilePath);
    process.exit(1);
  }
  
  const profileText = fs.readFileSync(profilePath, 'utf-8');
  console.log('   ✅ Loaded (', profileText.length, 'characters,', Math.ceil(profileText.length / 4), 'tokens)');
  console.log('');
  
  // Step 4: Chunk
  console.log('🔁 Step 4: Chunking into segments...');
  const sections = profileText.split(/^## /gm).filter(s => s.trim());
  
  const allChunks = [];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sectionTitle = section.split('\n')[0].trim();
    const sectionText = section.substring(sectionTitle.length).trim();
    
    const chunks = chunkText(sectionText, 512, 64);
    
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
  
  console.log('   ✅ Chunked into', allChunks.length, 'segments');
  console.log('');
  
  // Step 5: Generate embeddings
  console.log('🧠 Step 5: Generating embeddings...');
  console.log('   Model: text-embedding-3-small');
  console.log('   Dimensions: 1536');
  console.log('');
  
  const embeddings = [];
  
  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    
    const progress = `[${i + 1}/${allChunks.length}]`;
    const sectionPreview = chunk.metadata.section.substring(0, 30);
    process.stdout.write(`   ${progress} ${sectionPreview}... `);
    
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
  console.log('   ✅ Generated', embeddings.length, 'embeddings');
  console.log('');
  
  // Step 6: Store in Supabase
  console.log('💾 Step 6: Storing in Supabase...');
  
  const batchSize = 10;
  let stored = 0;
  
  for (let i = 0; i < embeddings.length; i += batchSize) {
    const batch = embeddings.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(embeddings.length / batchSize);
    
    process.stdout.write(`   Batch ${batchNum}/${totalBatches} (${batch.length} chunks)... `);
    
    try {
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
    } catch (error) {
      console.log('❌');
      console.error('      Error:', error.message);
    }
  }
  
  console.log('');
  console.log('   ✅ Stored', stored, '/', embeddings.length, 'chunks');
  console.log('');
  
  // Final verification
  const finalCount = await getEmbeddingCount();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ EMBEDDING COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📊 Total chunks in Supabase:', finalCount);
  console.log('🗄️  Table: avenir_profile_embeddings');
  console.log('✅ Profile ready for semantic matching');
  console.log('');
  console.log('🎯 Avenir AI Solutions profile embeddings fully stored in Supabase');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Run prospect scan: npm run dev');
  console.log('  2. Visit: http://localhost:3000/en/admin/prospect-intelligence');
  console.log('  3. Click: "Scan for Prospects"');
  console.log('  4. Click: "📊 View Proof" to see Business Fit Scores');
  console.log('');
}

main().catch((error) => {
  console.error('');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ SETUP FAILED');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');
  console.error('Error:', error.message || error);
  console.error('');
  process.exit(1);
});

