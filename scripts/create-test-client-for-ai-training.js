const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs'); // Must use bcryptjs to match the API
const path = require('path');
const crypto = require('crypto');
// Try .env first, then .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestClient() {
  console.log('🧪 Creating test client for AI Training demo...\n');

  const testClient = {
    client_id: crypto.randomUUID(),
    business_name: 'AI Training Demo Corp',
    contact_name: 'Demo User',
    email: 'demo.aitraining@test.local',
    password: 'Demo2025!',
    language: 'en',
    is_test: true,
    api_key: 'demo-api-key-' + Math.random().toString(36).substring(2, 15),
  };

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(testClient.password, 10);

    // Insert client
    console.log('📝 Creating client account...');
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        id: testClient.client_id,
        business_name: testClient.business_name,
        contact_name: testClient.contact_name,
        email: testClient.email,
        password_hash: passwordHash,
        language: testClient.language,
        api_key: testClient.api_key,
        is_test: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (clientError) throw clientError;

    console.log('✅ Client created!');

    // Create sample leads (30 days of data for good metrics)
    console.log('\n📊 Creating sample leads for AI training metrics...');
    
    const leads = [];
    const now = new Date();
    
    // Create 50 leads over the past 30 days
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      const intents = ['Request for quotation', 'B2B partnership', 'General Information', 'Technical Support'];
      const tones = ['Professional', 'Casual', 'Urgent', 'Enthusiastic'];
      const urgencies = ['High', 'Medium', 'Low'];
      
      const intent = intents[Math.floor(Math.random() * intents.length)];
      const tone = tones[Math.floor(Math.random() * tones.length)];
      const urgency = urgencies[Math.floor(Math.random() * urgencies.length)];
      const confidence = 0.5 + Math.random() * 0.45; // 50-95%
      
      leads.push({
        id: `lead_${timestamp.getTime()}_${i}`,
        name: `Test Lead ${i + 1}`,
        email: `lead${i + 1}@example.com`,
        message: `Sample inquiry about AI automation services. Lead #${i + 1}`,
        ai_summary: `AI-powered inquiry from Test Lead ${i + 1} regarding automation solutions`,
        language: Math.random() > 0.4 ? 'en' : 'fr',
        timestamp: timestamp.toISOString(),
        intent,
        tone,
        urgency,
        confidence_score: confidence.toFixed(2),
        tone_history: JSON.stringify([tone]),
        confidence_history: JSON.stringify([confidence]),
        urgency_history: JSON.stringify([urgency]),
        client_id: testClient.client_id,
        is_test: true,
        archived: false,
        deleted: false,
        last_updated: timestamp.toISOString(),
      });
    }

    const { data: insertedLeads, error: leadsError } = await supabase
      .from('lead_memory')
      .insert(leads)
      .select();

    if (leadsError) throw leadsError;

    console.log(`✅ Created ${insertedLeads.length} sample leads`);

    // Create lead_actions entries
    console.log('\n📝 Creating lead actions...');
    const actions = insertedLeads.map(lead => ({
      lead_id: lead.id,
      client_id: testClient.client_id,
      action: 'insert',
      action_type: 'insert',
      tag: 'New Lead',
      created_at: lead.timestamp,
      timestamp: lead.timestamp,
      is_test: true,
    }));

    const { error: actionsError } = await supabase
      .from('lead_actions')
      .insert(actions);

    if (actionsError) throw actionsError;

    console.log('✅ Lead actions created!');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 TEST CLIENT CREATED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('   Email:    demo.aitraining@test.local');
    console.log('   Password: Demo2025!\n');
    console.log('🌐 TEST URL:');
    console.log('   http://localhost:3000/en/client/dashboard\n');
    console.log('✨ This client has:');
    console.log('   • 50 leads over 30 days');
    console.log('   • Mix of intents, tones, urgencies');
    console.log('   • 60% English, 40% French leads');
    console.log('   • Confidence scores 50-95%\n');
    console.log('🧠 AI Training metrics will show:');
    console.log('   • Learning progress');
    console.log('   • Top discoveries');
    console.log('   • Confidence improvements');
    console.log('   • Time & value saved\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestClient();

