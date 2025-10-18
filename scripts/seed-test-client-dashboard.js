#!/usr/bin/env node
// ============================================
// Seed Test Client for Dashboard Verification
// ============================================
// Creates a test client with bilingual sample leads

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

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
// Test Data
// ============================================

const TEST_CLIENT = {
  client_id: 'test-dashboard-client-001',
  business_name: 'Test Client - Dashboard',
  contact_name: 'Demo User',
  email: 'test.dashboard@aveniraisolutions.ca',
  password: 'Demo123!',
  language: 'en',
  is_test: true,
  api_key: 'test-api-key-dashboard-' + Math.random().toString(36).substring(2, 15),
};

const SAMPLE_LEADS = [
  // English Lead 1
  {
    name: 'Sarah Chen',
    email: 'sarah.chen@techstartup.com',
    message: 'We need AI automation for our customer support team. Looking to scale efficiently.',
    ai_summary: 'B2B inquiry for AI-powered customer support automation',
    language: 'en',
    intent: 'B2B partnership',
    tone: 'Professional',
    urgency: 'High',
    confidence_score: 0.92,
    current_tag: 'New Lead',
    relationship_insight: 'Strong initial interest — tech-savvy company ready for AI integration.',
    tone_history: JSON.stringify(['Professional', 'Direct']),
    confidence_history: JSON.stringify([0.92, 0.88]),
    urgency_history: JSON.stringify(['High', 'High']),
  },
  
  // English Lead 2
  {
    name: 'Alex Rivera',
    email: 'alex.r@salesgrowth.io',
    message: 'Looking to automate lead qualification for our sales pipeline. Can you help?',
    ai_summary: 'Sales automation and lead scoring needs',
    language: 'en',
    intent: 'Consultation',
    tone: 'Casual',
    urgency: 'Medium',
    confidence_score: 0.85,
    current_tag: 'New Lead',
    relationship_insight: 'Exploratory phase — interested in understanding capabilities.',
    tone_history: JSON.stringify(['Casual', 'Friendly']),
    confidence_history: JSON.stringify([0.85, 0.82]),
    urgency_history: JSON.stringify(['Medium', 'Medium']),
  },
  
  // English Lead 3
  {
    name: 'Jordan Lee',
    email: 'jordan@marketingpro.ca',
    message: 'Interested in exploring AI solutions for our marketing team. What do you offer?',
    ai_summary: 'Marketing AI exploration inquiry',
    language: 'en',
    intent: 'Information',
    tone: 'Formal',
    urgency: 'Low',
    confidence_score: 0.68,
    current_tag: 'New Lead',
    relationship_insight: 'Early stage inquiry — needs more information before commitment.',
    tone_history: JSON.stringify(['Formal']),
    confidence_history: JSON.stringify([0.68]),
    urgency_history: JSON.stringify(['Low']),
  },
  
  // French Lead 1
  {
    name: 'Sophie Martin',
    email: 'sophie.martin@renovationqc.ca',
    message: 'Nous cherchons une solution IA pour automatiser notre suivi de leads. Avez-vous de l\'expérience dans le secteur de la rénovation ?',
    ai_summary: 'Demande d\'automatisation pour une entreprise de rénovation québécoise',
    language: 'fr',
    intent: 'Partenariat B2B',
    tone: 'Professionnel',
    urgency: 'Haute',
    confidence_score: 0.89,
    current_tag: 'New Lead',
    relationship_insight: 'Forte correspondance avec le profil ICP — secteur prioritaire au Québec.',
    tone_history: JSON.stringify(['Professionnel', 'Formel']),
    confidence_history: JSON.stringify([0.89, 0.87]),
    urgency_history: JSON.stringify(['Haute', 'Haute']),
  },
  
  // French Lead 2
  {
    name: 'Alexandre Dubois',
    email: 'a.dubois@plomberiepro.qc.ca',
    message: 'Bonjour, je souhaite en savoir plus sur vos services d\'IA pour gérer mes clients. Merci.',
    ai_summary: 'Demande d\'information pour gestion de clients PME',
    language: 'fr',
    intent: 'Consultation',
    tone: 'Amical',
    urgency: 'Moyenne',
    confidence_score: 0.74,
    current_tag: 'New Lead',
    relationship_insight: 'PME locale intéressée — bon potentiel de conversion.',
    tone_history: JSON.stringify(['Amical', 'Décontracté']),
    confidence_history: JSON.stringify([0.74, 0.71]),
    urgency_history: JSON.stringify(['Moyenne', 'Moyenne']),
  },
];

// ============================================
// Main Function
// ============================================

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🧪 SEED TEST CLIENT FOR DASHBOARD VERIFICATION         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Step 1: Check if test client already exists
  console.log('🔍 Step 1: Checking for existing test client...');
  const { data: existingClient, error: checkError } = await supabase
    .from('clients')
    .select('id, client_id, email')
    .eq('email', TEST_CLIENT.email)
    .single();
  
  let clientDbId;
  let clientId;
  
  if (existingClient && !checkError) {
    console.log('   ℹ️  Test client already exists');
    console.log('   Email:', existingClient.email);
    console.log('   Client ID:', existingClient.client_id);
    clientDbId = existingClient.id;
    clientId = existingClient.client_id;
    console.log('');
  } else {
    // Step 2: Create test client
    console.log('📝 Step 2: Creating test client...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(TEST_CLIENT.password, 10);
    
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert([{
        client_id: TEST_CLIENT.client_id,
        business_name: TEST_CLIENT.business_name,
        contact_name: TEST_CLIENT.contact_name,
        email: TEST_CLIENT.email,
        password_hash: hashedPassword,
        language: TEST_CLIENT.language,
        api_key: TEST_CLIENT.api_key,
        is_test: TEST_CLIENT.is_test,
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Failed to create client:', createError.message);
      process.exit(1);
    }
    
    clientDbId = newClient.id;
    clientId = newClient.client_id;
    
    console.log('   ✅ Test client created');
    console.log('   ID:', clientDbId);
    console.log('   Client ID:', clientId);
    console.log('   Email:', TEST_CLIENT.email);
    console.log('   Password:', TEST_CLIENT.password);
    console.log('');
  }
  
  // Step 3: Create sample leads
  console.log('📋 Step 3: Creating sample leads...');
  console.log('');
  
  const insertedLeads = [];
  
  for (let i = 0; i < SAMPLE_LEADS.length; i++) {
    const lead = SAMPLE_LEADS[i];
    
    console.log(`   [${i + 1}/${SAMPLE_LEADS.length}] Creating lead: ${lead.name} (${lead.language.toUpperCase()})...`);
    
    // Insert into lead_memory
    const { data: leadData, error: leadError } = await supabase
      .from('lead_memory')
      .insert([{
        name: lead.name,
        email: lead.email,
        message: lead.message,
        ai_summary: lead.ai_summary,
        language: lead.language,
        intent: lead.intent,
        tone: lead.tone,
        urgency: lead.urgency,
        confidence_score: lead.confidence_score,
        current_tag: lead.current_tag,
        relationship_insight: lead.relationship_insight,
        tone_history: lead.tone_history,
        confidence_history: lead.confidence_history,
        urgency_history: lead.urgency_history,
        archived: false,
        deleted: false,
        timestamp: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      }])
      .select()
      .single();
    
    if (leadError) {
      console.error(`      ❌ Failed to create lead:`, leadError.message);
      continue;
    }
    
    console.log(`      ✅ Lead created (ID: ${leadData.id})`);
    
    // Link lead to client via lead_actions
    // Note: lead_actions.client_id should store the TEXT client_id, not the UUID
    const { error: actionError } = await supabase
      .from('lead_actions')
      .insert([{
        client_id: clientId, // Using TEXT client_id (test-dashboard-client-001)
        lead_id: leadData.id,
        tag: lead.current_tag,
        is_test: true,
      }]);
    
    if (actionError) {
      console.error(`      ❌ Failed to link lead to client:`, actionError.message);
      console.error(`      Debug: Trying client_id as TEXT: "${clientId}"`);
      
      // Try alternate approach: check if client_id column might be expecting the UUID id instead
      console.error(`      Attempting fallback with UUID...`);
      const { error: actionError2 } = await supabase
        .from('lead_actions')
        .insert([{
          client_id: clientDbId, // Try UUID instead
          lead_id: leadData.id,
          tag: lead.current_tag,
          is_test: true,
        }]);
      
      if (actionError2) {
        console.error(`      ❌ Fallback also failed:`, actionError2.message);
        continue;
      }
      
      console.log(`      ✅ Linked using UUID (id: ${clientDbId})`);
    } else {
      console.log(`      ✅ Linked to client (client_id: ${clientId})`);
    }
    console.log('');
    
    insertedLeads.push({
      ...lead,
      id: leadData.id,
    });
  }
  
  // Final summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SEEDING COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📊 Test Client Created:');
  console.log('  • Business: Test Client - Dashboard');
  console.log('  • Email:', TEST_CLIENT.email);
  console.log('  • Password:', TEST_CLIENT.password);
  console.log('  • Client ID:', clientId);
  console.log('  • Is Test:', true);
  console.log('');
  console.log('📋 Sample Leads Created:', insertedLeads.length);
  console.log('  • English leads:', insertedLeads.filter(l => l.language === 'en').length);
  console.log('  • French leads:', insertedLeads.filter(l => l.language === 'fr').length);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Testing Instructions');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('1. Start development server:');
  console.log('   npm run dev');
  console.log('');
  console.log('2. Test English dashboard:');
  console.log('   http://localhost:3000/en/client/dashboard');
  console.log('');
  console.log('   Login credentials:');
  console.log('   • Email:', TEST_CLIENT.email);
  console.log('   • Password:', TEST_CLIENT.password);
  console.log('');
  console.log('   Verify:');
  console.log('   ✓ All UI labels in English');
  console.log('   ✓ French leads show English translations');
  console.log('   ✓ tone/intent/urgency values in English');
  console.log('   ✓ First letter capitalized');
  console.log('');
  console.log('3. Test French dashboard:');
  console.log('   http://localhost:3000/fr/client/dashboard');
  console.log('');
  console.log('   Same login credentials');
  console.log('');
  console.log('   Verify:');
  console.log('   ✓ All UI labels in French');
  console.log('   ✓ English leads show French translations');
  console.log('   ✓ tone/intent/urgency values in French');
  console.log('   ✓ First letter capitalized');
  console.log('');
  console.log('4. Check console for translation logs:');
  console.log('   [ClientLeads] 🔄 Translating X leads to locale: fr');
  console.log('   [ClientLeads] 🔄 Translating AI summary for lead: [name]');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Sample Leads:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  insertedLeads.forEach((lead, idx) => {
    console.log(`${idx + 1}. ${lead.name} (${lead.language.toUpperCase()})`);
    console.log(`   Email: ${lead.email}`);
    console.log(`   AI Summary: ${lead.ai_summary.substring(0, 50)}...`);
    console.log(`   Intent: ${lead.intent} | Tone: ${lead.tone} | Urgency: ${lead.urgency}`);
    console.log(`   Confidence: ${(lead.confidence_score * 100).toFixed(0)}%`);
    console.log('');
  });
  
  console.log('✅ Test environment ready for verification!');
  console.log('');
}

main().catch((error) => {
  console.error('');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ SEEDING FAILED');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');
  console.error('Error:', error.message || error);
  console.error('');
  console.error('Troubleshooting:');
  console.error('  1. Check Supabase connection (SUPABASE_SERVICE_ROLE_KEY)');
  console.error('  2. Ensure clients and lead_memory tables exist');
  console.error('  3. Verify lead_actions table exists');
  console.error('');
  process.exit(1);
});

