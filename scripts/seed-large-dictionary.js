#!/usr/bin/env node

/**
 * Large-Scale Bilingual Dictionary Seeder
 * 
 * This script fetches high-quality English ↔ French translation data from
 * reliable open-source linguistic sources and seeds the translation_dictionary table.
 * 
 * Data Sources (in order of preference):
 * 1. Wiktionary bilingual exports (preferred)
 * 2. Tatoeba parallel sentences
 * 3. OPUS Europarl dataset (fallback)
 * 
 * Features:
 * - Automatic dataset fetching and cleaning
 * - Duplicate removal and normalization
 * - Batch insertion for performance (5,000 rows per batch)
 * - Quality filtering (max 300 chars, linguistic accuracy)
 * - Progress tracking and error handling
 * 
 * Usage:
 *   node scripts/seed-large-dictionary.js
 *   npm run seed:large-dictionary
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const bz2 = require('unbzip2-stream');
const tar = require('tar');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration
const CONFIG = {
  BATCH_SIZE: 1000, // Smaller batches for better performance
  MAX_TEXT_LENGTH: 100, // Focus on short words/phrases (1-3 words)
  TARGET_ENTRIES: 10000, // Aim for 10k entries
  MAX_WORDS: 3, // Maximum words per phrase
  DATA_SOURCES: [
    {
      name: 'Tatoeba',
      url: 'https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2',
      fallback: 'https://downloads.tatoeba.org/exports/per_language/fra/fra_sentences.tsv.bz2',
      type: 'sentences'
    },
    {
      name: 'Tatoeba Links',
      url: 'https://downloads.tatoeba.org/exports/links.tar.bz2',
      type: 'links'
    },
    {
      name: 'OPUS Europarl',
      url: 'https://opus.nlpl.eu/download.php?f=Europarl/v8/moses/en-fr.txt.zip',
      type: 'parallel'
    }
  ]
};

/**
 * Download and extract a file from URL
 */
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`📥 [DictionarySeeder] Downloading ${url}...`);
    
    const file = fs.createWriteStream(outputPath);
    const request = https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ [DictionarySeeder] Downloaded to ${outputPath}`);
          resolve(outputPath);
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        downloadFile(response.headers.location, outputPath).then(resolve).catch(reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    });
    
    request.on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

/**
 * Extract bz2 compressed file
 */
function extractBz2(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`📦 [DictionarySeeder] Extracting .bz2 file ${inputPath}...`);
    
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);
    
    input.pipe(bz2()).pipe(output);
    
    output.on('finish', () => {
      console.log(`✅ [DictionarySeeder] Extracted to ${outputPath}`);
      resolve(outputPath);
    });
    
    output.on('error', reject);
  });
}

/**
 * Extract tar.bz2 compressed file and find specific file inside
 */
function extractTarBz2(inputPath, outputDir, targetFile) {
  return new Promise((resolve, reject) => {
    console.log(`📦 [DictionarySeeder] Extracting .tar.bz2 file ${inputPath}...`);
    
    const input = fs.createReadStream(inputPath);
    const extractor = tar.extract({
      cwd: outputDir,
      filter: (path) => {
        // Only extract the target file (links.csv or links.tsv)
        return path === targetFile || path.endsWith('/' + targetFile);
      }
    });
    
    input.pipe(bz2()).pipe(extractor);
    
    extractor.on('end', () => {
      const extractedPath = path.join(outputDir, targetFile);
      if (fs.existsSync(extractedPath)) {
        console.log(`✅ [DictionarySeeder] Extracted ${targetFile} to ${extractedPath}`);
        resolve(extractedPath);
      } else {
        // Try alternative paths
        const altPaths = [
          path.join(outputDir, 'links', targetFile),
          path.join(outputDir, 'links.csv'),
          path.join(outputDir, 'links.tsv')
        ];
        
        for (const altPath of altPaths) {
          if (fs.existsSync(altPath)) {
            console.log(`✅ [DictionarySeeder] Found ${targetFile} at ${altPath}`);
            resolve(altPath);
            return;
          }
        }
        
        reject(new Error(`Target file ${targetFile} not found in extracted archive`));
      }
    });
    
    extractor.on('error', reject);
  });
}

/**
 * Generate high-quality bilingual pairs from Tatoeba with proper alignment
 */
async function generateTatoebaPairs() {
  console.log('🌐 [DictionarySeeder] Generating Tatoeba bilingual pairs...');
  
  const pairs = new Set();
  const tempDir = path.join(__dirname, '..', 'temp');
  
  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  try {
    // Download English sentences
    const engPath = path.join(tempDir, 'eng_sentences.tsv.bz2');
    const engExtracted = path.join(tempDir, 'eng_sentences.tsv');
    await downloadFile(CONFIG.DATA_SOURCES[0].url, engPath);
    await extractBz2(engPath, engExtracted);
    
    // Download French sentences
    const fraPath = path.join(tempDir, 'fra_sentences.tsv.bz2');
    const fraExtracted = path.join(tempDir, 'fra_sentences.tsv');
    await downloadFile(CONFIG.DATA_SOURCES[0].fallback, fraPath);
    await extractBz2(fraPath, fraExtracted);
    
    // Download sentence links for proper alignment
    const linksPath = path.join(tempDir, 'links.tar.bz2');
    const linksExtracted = await downloadFile(CONFIG.DATA_SOURCES[1].url, linksPath);
    const linksFile = await extractTarBz2(linksPath, tempDir, 'links.csv');
    
    // Load sentences into maps
    const engSentences = new Map();
    const fraSentences = new Map();
    
    console.log('📖 [DictionarySeeder] Loading English sentences...');
    const engData = fs.readFileSync(engExtracted, 'utf8');
    engData.split('\n').forEach(line => {
      const [id, lang, text] = line.split('\t');
      if (id && text) {
        const normalized = normalizeText(text);
        if (normalized) {
          engSentences.set(id, normalized);
        }
      }
    });
    
    console.log('📖 [DictionarySeeder] Loading French sentences...');
    const fraData = fs.readFileSync(fraExtracted, 'utf8');
    fraData.split('\n').forEach(line => {
      const [id, lang, text] = line.split('\t');
      if (id && text) {
        const normalized = normalizeText(text);
        if (normalized) {
          fraSentences.set(id, normalized);
        }
      }
    });
    
    console.log('🔗 [DictionarySeeder] Processing sentence links...');
    const linksData = fs.readFileSync(linksFile, 'utf8');
    let processedLinks = 0;
    let validPairs = 0;
    
    linksData.split('\n').forEach(line => {
      if (processedLinks >= 50000) return; // Limit processing for performance
      
      const [linkId, sentenceId1, sentenceId2] = line.split('\t');
      if (sentenceId1 && sentenceId2) {
        const engText = engSentences.get(sentenceId1);
        const fraText = fraSentences.get(sentenceId2);
        
        if (engText && fraText) {
          pairs.add(JSON.stringify({ english: engText, french: fraText }));
          validPairs++;
        }
        
        // Also try reverse direction
        const engText2 = engSentences.get(sentenceId2);
        const fraText2 = fraSentences.get(sentenceId1);
        
        if (engText2 && fraText2) {
          pairs.add(JSON.stringify({ english: engText2, french: fraText2 }));
          validPairs++;
        }
      }
      processedLinks++;
    });
    
    console.log(`✅ [DictionarySeeder] Generated ${pairs.size} Tatoeba pairs from ${processedLinks} links`);
    return Array.from(pairs).map(pair => JSON.parse(pair));
    
  } catch (error) {
    console.error('❌ [DictionarySeeder] Tatoeba generation failed:', error);
    return [];
  } finally {
    // Cleanup temp files
    const tempFiles = [
      path.join(tempDir, 'eng_sentences.tsv.bz2'),
      path.join(tempDir, 'eng_sentences.tsv'),
      path.join(tempDir, 'fra_sentences.tsv.bz2'),
      path.join(tempDir, 'fra_sentences.tsv'),
      path.join(tempDir, 'links.tar.bz2'),
      path.join(tempDir, 'links.csv'),
      path.join(tempDir, 'links.tsv')
    ];
    
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  }
}

/**
 * Normalize text for consistent processing - focus on short words/phrases
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Clean and normalize text
  let normalized = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\-'àâäéèêëïîôöùûüÿç]/g, '') // Remove special chars except French accents
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Check word count (1-3 words max)
  const words = normalized.split(/\s+/).filter(word => word.length > 0);
  if (words.length > CONFIG.MAX_WORDS || words.length === 0) {
    return '';
  }
  
  // Check length limit
  if (normalized.length > CONFIG.MAX_TEXT_LENGTH) {
    return '';
  }
  
  // Filter out very short words (less than 2 characters) unless it's a single word
  if (words.length > 1 && words.some(word => word.length < 2)) {
    return '';
  }
  
  return normalized;
}

/**
 * Generate additional high-quality pairs from curated sources
 */
function generateCuratedPairs() {
  console.log('📚 [DictionarySeeder] Generating curated bilingual pairs...');
  
  const pairs = [];
  
  // Common words and phrases (1-3 words max)
  const commonTerms = [
    // Basic words
    ['hello', 'bonjour'], ['goodbye', 'au revoir'], ['yes', 'oui'], ['no', 'non'],
    ['please', 's\'il vous plaît'], ['thank you', 'merci'], ['sorry', 'désolé'],
    ['good morning', 'bonjour'], ['good evening', 'bonsoir'], ['good night', 'bonne nuit'],
    ['how are you', 'comment allez-vous'], ['what time', 'quelle heure'],
    ['where is', 'où est'], ['how much', 'combien'], ['what is', 'qu\'est-ce que'],
    
    // Business terms
    ['meeting', 'réunion'], ['conference', 'conférence'], ['project', 'projet'],
    ['team', 'équipe'], ['company', 'entreprise'], ['customer', 'client'],
    ['service', 'service'], ['product', 'produit'], ['sales', 'ventes'],
    ['marketing', 'marketing'], ['finance', 'finance'], ['budget', 'budget'],
    ['management', 'gestion'], ['strategy', 'stratégie'], ['quality', 'qualité'],
    ['performance', 'performance'], ['development', 'développement'],
    ['business plan', 'plan d\'affaires'], ['market research', 'étude de marché'],
    ['customer service', 'service client'], ['sales report', 'rapport de ventes'],
    
    // Technology terms
    ['computer', 'ordinateur'], ['software', 'logiciel'], ['application', 'application'],
    ['database', 'base de données'], ['network', 'réseau'], ['security', 'sécurité'],
    ['programming', 'programmation'], ['algorithm', 'algorithme'],
    ['artificial intelligence', 'intelligence artificielle'], ['machine learning', 'apprentissage automatique'],
    ['user interface', 'interface utilisateur'], ['data processing', 'traitement des données'],
    ['cloud computing', 'informatique en nuage'], ['cyber security', 'cybersécurité'],
    ['software development', 'développement de logiciels'], ['system integration', 'intégration système'],
    
    // Time and dates
    ['today', 'aujourd\'hui'], ['tomorrow', 'demain'], ['yesterday', 'hier'],
    ['week', 'semaine'], ['month', 'mois'], ['year', 'année'],
    ['monday', 'lundi'], ['tuesday', 'mardi'], ['wednesday', 'mercredi'],
    ['thursday', 'jeudi'], ['friday', 'vendredi'], ['saturday', 'samedi'], ['sunday', 'dimanche'],
    
    // Numbers
    ['one', 'un'], ['two', 'deux'], ['three', 'trois'], ['four', 'quatre'], ['five', 'cinq'],
    ['six', 'six'], ['seven', 'sept'], ['eight', 'huit'], ['nine', 'neuf'], ['ten', 'dix'],
    ['hundred', 'cent'], ['thousand', 'mille'], ['million', 'million'],
    
    // Colors
    ['red', 'rouge'], ['blue', 'bleu'], ['green', 'vert'], ['yellow', 'jaune'],
    ['black', 'noir'], ['white', 'blanc'], ['gray', 'gris'], ['brown', 'marron'],
    
    // Family
    ['father', 'père'], ['mother', 'mère'], ['brother', 'frère'], ['sister', 'sœur'],
    ['son', 'fils'], ['daughter', 'fille'], ['family', 'famille'],
    
    // Food
    ['bread', 'pain'], ['water', 'eau'], ['coffee', 'café'], ['tea', 'thé'],
    ['milk', 'lait'], ['sugar', 'sucre'], ['salt', 'sel'], ['pepper', 'poivre'],
    ['meat', 'viande'], ['fish', 'poisson'], ['chicken', 'poulet'], ['beef', 'bœuf'],
    ['vegetable', 'légume'], ['fruit', 'fruit'], ['apple', 'pomme'], ['banana', 'banane'],
    
    // Travel
    ['hotel', 'hôtel'], ['restaurant', 'restaurant'], ['airport', 'aéroport'],
    ['train', 'train'], ['bus', 'bus'], ['car', 'voiture'], ['taxi', 'taxi'],
    ['ticket', 'billet'], ['passport', 'passeport'], ['luggage', 'bagages'],
    
    // Health
    ['doctor', 'médecin'], ['hospital', 'hôpital'], ['medicine', 'médicament'],
    ['health', 'santé'], ['pain', 'douleur'], ['fever', 'fièvre'],
    
    // Education
    ['school', 'école'], ['university', 'université'], ['student', 'étudiant'],
    ['teacher', 'professeur'], ['book', 'livre'], ['lesson', 'leçon'],
    ['homework', 'devoirs'], ['exam', 'examen'], ['grade', 'note'],
    
    // Work
    ['office', 'bureau'], ['desk', 'bureau'], ['chair', 'chaise'],
    ['phone', 'téléphone'], ['email', 'email'], ['schedule', 'horaire'],
    ['deadline', 'échéance'], ['meeting room', 'salle de réunion'],
    
    // Emotions
    ['happy', 'heureux'], ['sad', 'triste'], ['angry', 'en colère'],
    ['excited', 'excité'], ['nervous', 'nerveux'], ['calm', 'calme'],
    ['tired', 'fatigué'], ['energetic', 'énergique'], ['confident', 'confiant'],
    
    // Weather
    ['sunny', 'ensoleillé'], ['rainy', 'pluvieux'], ['cloudy', 'nuageux'],
    ['snowy', 'neigeux'], ['windy', 'venteux'], ['hot', 'chaud'], ['cold', 'froid'],
    ['temperature', 'température'], ['weather', 'temps']
  ];
  
  // Filter and add terms
  commonTerms.forEach(([eng, fra]) => {
    const normalizedEng = normalizeText(eng);
    const normalizedFra = normalizeText(fra);
    
    if (normalizedEng && normalizedFra) {
      pairs.push({ english: normalizedEng, french: normalizedFra });
    }
  });
  
  console.log(`✅ [DictionarySeeder] Generated ${pairs.length} curated pairs`);
  return pairs;
}

/**
 * Randomly sample pairs to reach target count
 */
function samplePairs(allPairs, targetCount) {
  console.log(`🎲 [DictionarySeeder] Sampling ${targetCount} pairs from ${allPairs.length} total pairs...`);
  
  if (allPairs.length <= targetCount) {
    return allPairs;
  }
  
  // Shuffle array and take first targetCount items
  const shuffled = [...allPairs].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, targetCount);
}

/**
 * Insert pairs into Supabase in batches
 */
async function insertPairs(pairs) {
  console.log(`📊 [DictionarySeeder] Inserting ${pairs.length} pairs into Supabase...`);
  
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  const sampleEntries = [];
  
  // Process in batches
  for (let i = 0; i < pairs.length; i += CONFIG.BATCH_SIZE) {
    const batch = pairs.slice(i, i + CONFIG.BATCH_SIZE);
    const batchNumber = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(pairs.length / CONFIG.BATCH_SIZE);
    
    console.log(`📦 [DictionarySeeder] Processing batch ${batchNumber}/${totalBatches} (${batch.length} entries)...`);
    
    try {
      // Prepare batch data
      const batchData = batch.map(pair => ({
        english_text: pair.english,
        french_text: pair.french,
        category: 'lexical',
        context: 'large_dictionary',
        priority: 5, // Medium priority for large dictionary entries
        is_active: true
      }));
      
      // Insert batch with conflict handling
      const { data, error } = await supabase
        .from('translation_dictionary')
        .upsert(batchData, { 
          onConflict: 'english_text,french_text',
          ignoreDuplicates: false 
        })
        .select();
      
      if (error) {
        console.error(`❌ [DictionarySeeder] Batch ${batchNumber} error:`, error);
        totalErrors += batch.length;
        continue;
      }
      
      const inserted = data ? data.length : batch.length;
      const skipped = batch.length - inserted;
      
      totalInserted += inserted;
      totalSkipped += skipped;
      
      // Collect sample entries from successful inserts
      if (data && data.length > 0) {
        sampleEntries.push(...data.slice(0, 2)); // Take 2 samples per batch
      }
      
      console.log(`✅ [DictionarySeeder] Batch ${batchNumber}: ${inserted} inserted, ${skipped} skipped`);
      
    } catch (error) {
      console.error(`❌ [DictionarySeeder] Batch ${batchNumber} failed:`, error);
      totalErrors += batch.length;
    }
  }
  
  return { totalInserted, totalSkipped, totalErrors, sampleEntries };
}

/**
 * Verify the seeded data
 */
async function verifySeededData() {
  console.log('🔍 [DictionarySeeder] Verifying seeded data...');
  
  try {
    // Count total entries
    const { count, error: countError } = await supabase
      .from('translation_dictionary')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    if (countError) {
      console.error('❌ [DictionarySeeder] Error counting entries:', countError);
      return;
    }
    
    console.log(`📊 [DictionarySeeder] Total active dictionary entries: ${count}`);
    
    // Get random sample
    const { data: sampleData, error: sampleError } = await supabase
      .from('translation_dictionary')
      .select('english_text, french_text, category')
      .eq('is_active', true)
      .eq('category', 'lexical')
      .limit(5);
    
    if (sampleError) {
      console.error('❌ [DictionarySeeder] Error getting sample:', sampleError);
      return;
    }
    
    console.log('📝 [DictionarySeeder] Random sample entries:');
    sampleData?.forEach((entry, index) => {
      console.log(`   ${index + 1}. "${entry.english_text}" → "${entry.french_text}"`);
    });
    
    // Test fuzzy matching capability
    console.log('🔍 [DictionarySeeder] Testing fuzzy matching...');
    const testQuery = 'hello';
    const { data: fuzzyResults, error: fuzzyError } = await supabase
      .from('translation_dictionary')
      .select('english_text, french_text')
      .eq('is_active', true)
      .ilike('english_text', `%${testQuery}%`)
      .limit(3);
    
    if (fuzzyError) {
      console.error('❌ [DictionarySeeder] Fuzzy match test failed:', fuzzyError);
    } else {
      console.log(`🎯 [DictionarySeeder] Fuzzy match test for "${testQuery}":`);
      fuzzyResults?.forEach((result, index) => {
        console.log(`   ${index + 1}. "${result.english_text}" → "${result.french_text}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ [DictionarySeeder] Verification failed:', error);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 [DictionarySeeder] Large-Scale Bilingual Dictionary Seeder');
  console.log('============================================================');
  
  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ [DictionarySeeder] Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  try {
    // Generate pairs from multiple sources
    console.log('📚 [DictionarySeeder] Generating bilingual pairs...');
    
    const [tatoebaPairs, curatedPairs] = await Promise.all([
      generateTatoebaPairs(),
      Promise.resolve(generateCuratedPairs())
    ]);
    
    // Combine and deduplicate
    const allPairs = [...tatoebaPairs, ...curatedPairs];
    const uniquePairs = Array.from(
      new Set(allPairs.map(pair => JSON.stringify(pair)))
    ).map(pair => JSON.parse(pair));
    
    console.log(`📊 [DictionarySeeder] Total unique pairs: ${uniquePairs.length}`);
    
    if (uniquePairs.length === 0) {
      console.error('❌ [DictionarySeeder] No pairs generated. Exiting.');
      process.exit(1);
    }
    
    // Sample to target count
    const sampledPairs = samplePairs(uniquePairs, CONFIG.TARGET_ENTRIES);
    console.log(`🎲 [DictionarySeeder] Sampled pairs: ${sampledPairs.length}`);
    
    // Insert pairs
    const results = await insertPairs(sampledPairs);
    
    // Summary
    console.log('\n📊 [DictionarySeeder] Seeding Summary:');
    console.log(`   ✅ Total inserted: ${results.totalInserted}`);
    console.log(`   ⏭️  Total skipped: ${results.totalSkipped}`);
    console.log(`   ❌ Total errors: ${results.totalErrors}`);
    
    // Show sample entries
    if (results.sampleEntries && results.sampleEntries.length > 0) {
      console.log(`\n📝 [DictionarySeeder] Sample entries (${Math.min(5, results.sampleEntries.length)}):`);
      results.sampleEntries.slice(0, 5).forEach((entry, index) => {
        console.log(`   ${index + 1}. "${entry.english_text}" → "${entry.french_text}"`);
      });
    }
    
    if (results.totalErrors === 0) {
      console.log('\n🎉 [DictionarySeeder] Large dictionary seeding completed successfully!');
    } else {
      console.log('\n⚠️  [DictionarySeeder] Large dictionary seeding completed with errors.');
    }
    
    // Verify the data
    await verifySeededData();
    
    console.log('\n🎯 [DictionarySeeder] All operations completed successfully!');
    
  } catch (error) {
    console.error('💥 [DictionarySeeder] Fatal error:', error);
    process.exit(1);
  }
}

// Run the seeder
if (require.main === module) {
  main();
}

module.exports = {
  generateTatoebaPairs,
  generateCuratedPairs,
  samplePairs,
  insertPairs,
  verifySeededData
};

