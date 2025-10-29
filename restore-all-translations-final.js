const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseTranslationLine(line) {
  // Handle the SQL format: ('id', 'english', 'french', 'category', 'context', priority, true/false, 'created_at', 'updated_at'),
  const parts = line.split(',');
  
  if (parts.length < 9) return null;
  
  try {
    const id = parts[0].match(/\('([^']+)'/)?.[1];
    const english_text = parts[1].match(/ '([^']*)'/)?.[1]?.replace(/''/g, "'");
    const french_text = parts[2].match(/ '([^']*)'/)?.[1]?.replace(/''/g, "'");
    const category = parts[3].match(/ '([^']+)'/)?.[1];
    const context = parts[4].match(/ '([^']+)'/)?.[1];
    const priority = parseInt(parts[5].trim());
    const is_active = parts[6].trim() === 'true';
    const created_at = parts[7].match(/ '([^']+)'/)?.[1];
    const updated_at = parts[8].match(/ '([^']+)'/)?.[1];
    
    if (!id || !english_text || !french_text || !category || !context || isNaN(priority) || !created_at || !updated_at) {
      return null;
    }
    
    return {
      id,
      english_text,
      french_text,
      category,
      context,
      priority,
      is_active,
      created_at,
      updated_at
    };
  } catch (error) {
    return null;
  }
}

async function restoreAllTranslations() {
  console.log('🔄 Restoring ALL 6,967 translations from backup...\n');
  
  try {
    // Read the extracted data
    const fileContent = fs.readFileSync('translations-data.txt', 'utf8');
    const lines = fileContent.trim().split('\n');
    
    console.log(`📄 Found ${lines.length} translation records`);
    
    // Parse all translations
    const translations = [];
    let failedCount = 0;
    
    for (const line of lines) {
      const translation = parseTranslationLine(line);
      if (translation) {
        translations.push(translation);
      } else {
        failedCount++;
      }
    }
    
    console.log(`📊 Parsed ${translations.length} valid translation records`);
    console.log(`❌ Failed to parse ${failedCount} records`);
    
    // Clear existing translations
    console.log('🗑️  Clearing existing translations...');
    const { error: deleteError } = await supabase
      .from('translation_dictionary')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.error('❌ Error clearing translations:', deleteError.message);
      return;
    }
    
    console.log('✅ Existing translations cleared');
    
    // Insert in batches of 50 to avoid conflicts
    const batchSize = 50;
    let totalInserted = 0;
    
    for (let i = 0; i < translations.length; i += batchSize) {
      const batch = translations.slice(i, i + batchSize);
      
      console.log(`📥 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(translations.length / batchSize)} (${batch.length} records)...`);
      
      const { error } = await supabase
        .from('translation_dictionary')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        continue;
      }
      
      totalInserted += batch.length;
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} inserted successfully`);
    }
    
    console.log(`\n🎉 Translation restoration complete!`);
    console.log(`📊 Total records inserted: ${totalInserted}`);
    
    // Verify final count
    const { count, error: countError } = await supabase
      .from('translation_dictionary')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting final translations:', countError.message);
    } else {
      console.log(`📊 Final count in database: ${count}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

restoreAllTranslations();
