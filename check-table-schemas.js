#!/usr/bin/env node

/**
 * Check which tables exist and have updated_at columns
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const env = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    
    return env;
  } catch (error) {
    console.warn(`Could not load ${filePath}:`, error.message);
    return {};
  }
}

// Load environment variables
const env = {
  ...loadEnvFile(path.join(__dirname, '.env')),
  ...loadEnvFile(path.join(__dirname, '.env.local'))
};

// Set environment variables
Object.entries(env).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create service role client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function checkTableSchemas() {
  console.log('🔍 Checking Table Schemas for updated_at columns');
  console.log('================================================\n');

  const tablesToCheck = [
    'lead_notes',
    'prospect_candidates', 
    'prospect_learning_insights',
    'prospect_adaptive_weights',
    'prospect_scoring_models',
    'prospect_dynamic_scores',
    'translation_cache',
    'translation_dictionary',
    'lead_memory',
    'clients'
  ];

  const results = [];

  for (const tableName of tablesToCheck) {
    try {
      console.log(`Checking ${tableName}...`);
      
      // Try to get a sample record to see what columns exist
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`   ❌ Table not accessible: ${error.message}`);
        results.push({ table: tableName, accessible: false, error: error.message });
        continue;
      }

      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        const hasUpdatedAt = columns.includes('updated_at');
        const hasCreatedAt = columns.includes('created_at');
        
        console.log(`   ✅ Table accessible`);
        console.log(`   📋 Columns: ${columns.join(', ')}`);
        console.log(`   🕒 Has updated_at: ${hasUpdatedAt ? '✅' : '❌'}`);
        console.log(`   🕒 Has created_at: ${hasCreatedAt ? '✅' : '❌'}`);
        
        results.push({ 
          table: tableName, 
          accessible: true, 
          columns, 
          hasUpdatedAt, 
          hasCreatedAt,
          sampleData: data[0]
        });
      } else {
        console.log(`   ✅ Table accessible but empty`);
        results.push({ table: tableName, accessible: true, empty: true });
      }

    } catch (error) {
      console.log(`   ❌ Error checking table: ${error.message}`);
      results.push({ table: tableName, accessible: false, error: error.message });
    }
    
    console.log('');
  }

  // Summary
  console.log('📋 Summary:');
  console.log('===========');
  
  const accessibleTables = results.filter(r => r.accessible);
  const tablesWithUpdatedAt = results.filter(r => r.accessible && r.hasUpdatedAt);
  
  console.log(`✅ Accessible tables: ${accessibleTables.length}`);
  accessibleTables.forEach(result => {
    console.log(`   - ${result.table} ${result.hasUpdatedAt ? '(has updated_at)' : '(no updated_at)'}`);
  });

  console.log(`\n🕒 Tables with updated_at column: ${tablesWithUpdatedAt.length}`);
  tablesWithUpdatedAt.forEach(result => {
    console.log(`   - ${result.table}`);
  });

  return results;
}

// Run the check
checkTableSchemas().then((results) => {
  console.log('\n🏁 Schema check completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Schema check failed:', error);
  process.exit(1);
});
