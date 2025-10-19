#!/usr/bin/env node

/**
 * Translation Dictionary Seeder
 * 
 * This script seeds the Supabase translation_dictionary table with
 * bilingual entries from the JSON dictionary file.
 * 
 * Usage:
 *   node scripts/seed-translation-dictionary.js
 *   npm run seed:dictionary
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Load dictionary data
const dictionaryPath = path.join(__dirname, '..', 'data', 'en_fr.json');
const dictionaryData = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));

/**
 * Seed the translation dictionary table
 */
async function seedTranslationDictionary() {
  console.log('🌱 [DictionarySeeder] Starting translation dictionary seeding...');
  console.log(`📚 [DictionarySeeder] Loaded dictionary with ${dictionaryData.metadata.total_entries} entries`);
  
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  try {
    // Process each category
    for (const [category, entries] of Object.entries(dictionaryData.dictionary)) {
      console.log(`\n📂 [DictionarySeeder] Processing category: ${category} (${entries.length} entries)`);
      
      // Prepare entries for batch insert
      const entriesToInsert = entries.map(entry => ({
        english_text: entry.en,
        french_text: entry.fr,
        category: category,
        context: entry.context || 'general',
        priority: entry.priority || 1,
        is_active: true
      }));

      // Batch insert entries
      const { data, error } = await supabase
        .from('translation_dictionary')
        .upsert(entriesToInsert, { 
          onConflict: 'english_text,french_text',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error(`❌ [DictionarySeeder] Error inserting ${category} entries:`, error);
        totalErrors += entries.length;
        continue;
      }

      const inserted = data ? data.length : entries.length;
      const skipped = entries.length - inserted;
      
      totalInserted += inserted;
      totalSkipped += skipped;
      
      console.log(`✅ [DictionarySeeder] ${category}: ${inserted} inserted, ${skipped} skipped`);
    }

    // Summary
    console.log('\n📊 [DictionarySeeder] Seeding Summary:');
    console.log(`   ✅ Total inserted: ${totalInserted}`);
    console.log(`   ⏭️  Total skipped: ${totalSkipped}`);
    console.log(`   ❌ Total errors: ${totalErrors}`);
    
    if (totalErrors === 0) {
      console.log('🎉 [DictionarySeeder] Dictionary seeding completed successfully!');
    } else {
      console.log('⚠️  [DictionarySeeder] Dictionary seeding completed with errors.');
    }

  } catch (error) {
    console.error('💥 [DictionarySeeder] Fatal error during seeding:', error);
    process.exit(1);
  }
}

/**
 * Verify the seeded data
 */
async function verifySeededData() {
  console.log('\n🔍 [DictionarySeeder] Verifying seeded data...');
  
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

    // Count by category
    const { data: categoryData, error: categoryError } = await supabase
      .from('translation_dictionary')
      .select('category')
      .eq('is_active', true);

    if (categoryError) {
      console.error('❌ [DictionarySeeder] Error getting categories:', categoryError);
      return;
    }

    const categoryCounts = categoryData.reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + 1;
      return acc;
    }, {});

    console.log('📂 [DictionarySeeder] Entries by category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} entries`);
    });

  } catch (error) {
    console.error('❌ [DictionarySeeder] Error during verification:', error);
  }
}

/**
 * Clean up old entries (optional)
 */
async function cleanupOldEntries() {
  console.log('\n🧹 [DictionarySeeder] Cleaning up old entries...');
  
  try {
    // Remove entries that are no longer in the dictionary file
    const { data: existingEntries, error: fetchError } = await supabase
      .from('translation_dictionary')
      .select('id, english_text, french_text');

    if (fetchError) {
      console.error('❌ [DictionarySeeder] Error fetching existing entries:', fetchError);
      return;
    }

    // Get all current dictionary entries
    const currentEntries = new Set();
    Object.values(dictionaryData.dictionary).flat().forEach(entry => {
      currentEntries.add(`${entry.en}|${entry.fr}`);
    });

    // Find entries to remove
    const entriesToRemove = existingEntries.filter(entry => 
      !currentEntries.has(`${entry.english_text}|${entry.french_text}`)
    );

    if (entriesToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('translation_dictionary')
        .delete()
        .in('id', entriesToRemove.map(entry => entry.id));

      if (deleteError) {
        console.error('❌ [DictionarySeeder] Error removing old entries:', deleteError);
      } else {
        console.log(`🗑️  [DictionarySeeder] Removed ${entriesToRemove.length} old entries`);
      }
    } else {
      console.log('✨ [DictionarySeeder] No old entries to remove');
    }

  } catch (error) {
    console.error('❌ [DictionarySeeder] Error during cleanup:', error);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 [DictionarySeeder] Translation Dictionary Seeder');
  console.log('================================================');
  
  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ [DictionarySeeder] Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Check if dictionary file exists
  if (!fs.existsSync(dictionaryPath)) {
    console.error(`❌ [DictionarySeeder] Dictionary file not found: ${dictionaryPath}`);
    process.exit(1);
  }

  try {
    // Seed the dictionary
    await seedTranslationDictionary();
    
    // Verify the data
    await verifySeededData();
    
    // Clean up old entries
    await cleanupOldEntries();
    
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
  seedTranslationDictionary,
  verifySeededData,
  cleanupOldEntries
};
