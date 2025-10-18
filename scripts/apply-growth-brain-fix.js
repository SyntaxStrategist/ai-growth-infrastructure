const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function applyGrowthBrainFix() {
  console.log('🔧 Applying growth_brain foreign key fix...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('🔍 Environment check:');
  console.log('  SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.log('  SERVICE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  
  try {
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'fix-growth-brain-foreign-key.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📋 Testing current upsert capability...');
    
    // Test if we can insert a record with the current setup
    const testRecord = {
      client_id: '550e8400-e29b-41d4-a716-446655440000', // Test UUID
      analysis_period_start: new Date().toISOString(),
      analysis_period_end: new Date().toISOString(),
      total_leads: 1,
      engagement_score: 75,
      avg_confidence: 0.8,
      tone_sentiment_score: 0.5,
      urgency_trend_percentage: 0,
      top_intents: {},
      urgency_distribution: {},
      tone_distribution: {},
      confidence_trajectory: {},
      language_ratio: {},
      predictive_insights: {}
    };
    
    const { data: testData, error: testError } = await supabase
      .from('growth_brain')
      .upsert(testRecord, {
        onConflict: 'client_id',
        ignoreDuplicates: false
      })
      .select();
    
    if (testError) {
      console.log('❌ Test upsert failed:', testError);
      console.log('Error details:', JSON.stringify(testError, null, 2));
      
      // This confirms the issue - let's provide manual instructions
      console.log('');
      console.log('🔧 MANUAL FIX REQUIRED:');
      console.log('The database schema needs to be updated manually.');
      console.log('Please run the following SQL in your Supabase SQL editor:');
      console.log('');
      console.log('-- Copy and paste this into Supabase SQL Editor:');
      console.log(sqlContent);
      console.log('');
      console.log('After running the SQL, test with: npm run seed-demo-full');
      
      return;
    } else {
      console.log('✅ Test upsert succeeded!');
      console.log('📊 Test data:', testData);
      
      // Clean up test record
      await supabase
        .from('growth_brain')
        .delete()
        .eq('client_id', '550e8400-e29b-41d4-a716-446655440000');
      
      console.log('🧹 Test record cleaned up');
      console.log('');
      console.log('🎯 The growth_brain table is working correctly!');
      console.log('✅ No manual fix required.');
      console.log('✅ You can run: npm run seed-demo-full');
    }
    
  } catch (error) {
    console.error('❌ Error testing growth brain fix:', error);
    console.error('Error stack:', error.stack);
  }
}

applyGrowthBrainFix();