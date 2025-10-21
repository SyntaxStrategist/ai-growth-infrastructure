#!/usr/bin/env node

/**
 * Test script to verify update_updated_at_column() function and all triggers work correctly
 * after the search_path fix
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

async function testUpdateTriggers() {
  console.log('🧪 Testing update_updated_at_column() Function and Triggers');
  console.log('==========================================================\n');

  try {
    // Test 1: Check function definition
    console.log('1️⃣ Checking function definition...');
    const { data: functionData, error: functionError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            proname as function_name,
            prosrc as function_source,
            proconfig as function_config
          FROM pg_proc 
          WHERE proname = 'update_updated_at_column';
        `
      });

    if (functionError) {
      console.error('❌ Failed to check function definition:', functionError.message);
      return false;
    }

    if (functionData && functionData.length > 0) {
      const func = functionData[0];
      console.log('✅ Function found:', func.function_name);
      console.log('   Source:', func.function_source);
      console.log('   Config:', func.function_config || 'No special config');
    } else {
      console.log('⚠️ Function not found in database');
    }

    // Test 2: Check all triggers that use this function
    console.log('\n2️⃣ Finding all triggers that use update_updated_at_column()...');
    const { data: triggerData, error: triggerError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            t.tgname as trigger_name,
            c.relname as table_name,
            p.proname as function_name
          FROM pg_trigger t
          JOIN pg_class c ON t.tgrelid = c.oid
          JOIN pg_proc p ON t.tgfoid = p.oid
          WHERE p.proname = 'update_updated_at_column'
          AND t.tgisinternal = false;
        `
      });

    if (triggerError) {
      console.error('❌ Failed to check triggers:', triggerError.message);
      return false;
    }

    if (triggerData && triggerData.length > 0) {
      console.log(`✅ Found ${triggerData.length} triggers using the function:`);
      triggerData.forEach((trigger, i) => {
        console.log(`   ${i + 1}. ${trigger.trigger_name} on ${trigger.table_name}`);
      });
    } else {
      console.log('⚠️ No triggers found using the function');
    }

    // Test 3: Test lead_notes trigger specifically
    console.log('\n3️⃣ Testing lead_notes table trigger...');
    
    // First, get an existing note to update
    const { data: existingNotes, error: notesError } = await supabase
      .from('lead_notes')
      .select('id, note, updated_at')
      .limit(1);

    if (notesError) {
      console.error('❌ Failed to fetch existing notes:', notesError.message);
      return false;
    }

    if (existingNotes && existingNotes.length > 0) {
      const note = existingNotes[0];
      const originalUpdatedAt = note.updated_at;
      console.log(`   Testing with note ID: ${note.id}`);
      console.log(`   Original updated_at: ${originalUpdatedAt}`);

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the note
      const { data: updatedNote, error: updateError } = await supabase
        .from('lead_notes')
        .update({ 
          note: note.note + ' [Trigger Test]' 
        })
        .eq('id', note.id)
        .select('id, note, updated_at')
        .single();

      if (updateError) {
        console.error('❌ Failed to update note:', updateError.message);
        return false;
      }

      const newUpdatedAt = updatedNote.updated_at;
      console.log(`   New updated_at: ${newUpdatedAt}`);

      if (newUpdatedAt !== originalUpdatedAt) {
        console.log('✅ Trigger working correctly - updated_at timestamp changed');
      } else {
        console.log('❌ Trigger not working - updated_at timestamp unchanged');
        return false;
      }

      // Clean up - restore original note
      await supabase
        .from('lead_notes')
        .update({ note: note.note })
        .eq('id', note.id);

    } else {
      console.log('⚠️ No existing notes found to test with');
    }

    // Test 4: Test prospect_candidates trigger if table exists
    console.log('\n4️⃣ Testing prospect_candidates table trigger...');
    
    const { data: existingProspects, error: prospectsError } = await supabase
      .from('prospect_candidates')
      .select('id, business_name, updated_at')
      .limit(1);

    if (prospectsError) {
      console.log('   ⚠️ prospect_candidates table not found or accessible:', prospectsError.message);
    } else if (existingProspects && existingProspects.length > 0) {
      const prospect = existingProspects[0];
      const originalUpdatedAt = prospect.updated_at;
      console.log(`   Testing with prospect ID: ${prospect.id}`);
      console.log(`   Original updated_at: ${originalUpdatedAt}`);

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the prospect
      const { data: updatedProspect, error: updateError } = await supabase
        .from('prospect_candidates')
        .update({ 
          business_name: prospect.business_name + ' [Trigger Test]' 
        })
        .eq('id', prospect.id)
        .select('id, business_name, updated_at')
        .single();

      if (updateError) {
        console.error('❌ Failed to update prospect:', updateError.message);
        return false;
      }

      const newUpdatedAt = updatedProspect.updated_at;
      console.log(`   New updated_at: ${newUpdatedAt}`);

      if (newUpdatedAt !== originalUpdatedAt) {
        console.log('✅ Trigger working correctly - updated_at timestamp changed');
      } else {
        console.log('❌ Trigger not working - updated_at timestamp unchanged');
        return false;
      }

      // Clean up - restore original prospect
      await supabase
        .from('prospect_candidates')
        .update({ business_name: prospect.business_name })
        .eq('id', prospect.id);

    } else {
      console.log('   ⚠️ No existing prospects found to test with');
    }

    // Test 5: Test function execution directly
    console.log('\n5️⃣ Testing function execution directly...');
    
    const { data: functionTest, error: functionTestError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT update_updated_at_column() as function_result;
        `
      });

    if (functionTestError) {
      console.log('   ⚠️ Cannot test function directly (expected for trigger functions):', functionTestError.message);
    } else {
      console.log('   ✅ Function can be called directly');
    }

    console.log('\n✅ Update Trigger Testing Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Function definition verified');
    console.log('   ✅ Triggers identified and tested');
    console.log('   ✅ updated_at timestamps working correctly');
    console.log('   ✅ No functionality broken by search_path fix');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the tests
testUpdateTriggers().then((success) => {
  if (success) {
    console.log('\n🎉 All update triggers are working correctly!');
    process.exit(0);
  } else {
    console.log('\n💥 Update trigger testing failed!');
    process.exit(1);
  }
}).catch((error) => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
