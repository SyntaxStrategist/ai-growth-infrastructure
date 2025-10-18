#!/usr/bin/env node
// ============================================
// Seed Production Demo Client
// ============================================
// Creates a demo client account with realistic sample leads
// for video recording and demonstrations
// ⚠️ SAFE FOR PRODUCTION - All data marked as is_test: true

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
// Production Demo Data
// ============================================

const DEMO_CLIENT = {
  client_id: 'demo-client-avenir-001',
  business_name: 'Demo Client – Dashboard',
  contact_name: 'Demo Account',
  email: 'demo.client@aveniraisolutions.ca',
  password: 'DemoAvenir2025!',
  language: 'en',
  is_test: true,
  api_key: 'demo-api-key-' + Math.random().toString(36).substring(2, 20),
};

// Get timestamps from this week
const now = new Date();
const thisWeek = [
  new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
  new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
];

const DEMO_LEADS = [
  // English Lead 1 - High Priority B2B
  {
    name: 'Jennifer Thompson',
    email: 'j.thompson@techventures.ca',
    message: 'We\'re a growing SaaS company looking to automate our customer onboarding process. Our current manual workflow is taking up 20+ hours per week. Interested in discussing AI solutions.',
    ai_summary: 'B2B SaaS company seeking customer onboarding automation to reduce 20+ hours of manual work weekly',
    language: 'en',
    intent: 'B2B partnership',
    tone: 'Professional',
    urgency: 'High',
    confidence_score: 0.94,
    current_tag: 'New Lead',
    relationship_insight: 'Strong fit — SaaS vertical with quantified pain point and clear ROI potential.',
    timestamp: thisWeek[0].toISOString(),
  },
  
  // English Lead 2 - Consultation Request
  {
    name: 'Michael Patterson',
    email: 'michael.p@buildersgroup.com',
    message: 'Hello, I run a construction company in Ontario. We get about 50 quote requests per week and I\'m drowning in emails. Can AI help organize and prioritize these leads?',
    ai_summary: 'Construction business owner with 50 weekly quote requests seeking lead organization and prioritization system',
    language: 'en',
    intent: 'Consultation',
    tone: 'Casual',
    urgency: 'Medium',
    confidence_score: 0.82,
    current_tag: 'New Lead',
    relationship_insight: 'Good potential — service business with high lead volume, clear automation opportunity.',
    timestamp: thisWeek[1].toISOString(),
  },
  
  // French Lead 1 - Partnership Inquiry
  {
    name: 'Marie-Claude Beauregard',
    email: 'mc.beauregard@renovationsquebec.ca',
    message: 'Bonjour, nous sommes une entreprise de rénovation résidentielle à Québec. Nous recevons environ 30-40 demandes par semaine et nous aimerions automatiser notre processus de qualification. Pouvez-vous nous aider ?',
    ai_summary: 'Entreprise de rénovation québécoise cherchant à automatiser la qualification de 30-40 demandes hebdomadaires',
    language: 'fr',
    intent: 'Partenariat B2B',
    tone: 'Professionnel',
    urgency: 'Haute',
    confidence_score: 0.91,
    current_tag: 'New Lead',
    relationship_insight: 'Forte correspondance — secteur prioritaire au Québec, volume élevé, besoin clair d\'automatisation.',
    timestamp: thisWeek[2].toISOString(),
  },
  
  // French Lead 2 - Automation Interest
  {
    name: 'François Gagnon',
    email: 'f.gagnon@plomberiemontreal.qc.ca',
    message: 'Nous sommes une entreprise de plomberie à Montréal. Nos employés passent beaucoup de temps à répondre aux mêmes questions. Est-ce que votre système peut gérer ça automatiquement ?',
    ai_summary: 'Entreprise de plomberie montréalaise cherchant automatisation pour questions clients répétitives',
    language: 'fr',
    intent: 'Consultation',
    tone: 'Amical',
    urgency: 'Moyenne',
    confidence_score: 0.76,
    current_tag: 'New Lead',
    relationship_insight: 'Bon potentiel — PME locale avec besoin identifié de réduction du temps de réponse.',
    timestamp: thisWeek[3].toISOString(),
  },
  
  // Bilingual-Style Lead - English Message, French AI Analysis
  {
    name: 'Robert Tremblay',
    email: 'r.tremblay@serviceselectriques.ca',
    message: 'We want to scale our electrical services business but our current CRM can\'t keep up. Looking for AI automation to handle leads better. Based in Laval, QC.',
    ai_summary: 'Entrepreneur en services électriques au Québec cherchant automatisation CRM pour gérer la croissance',
    language: 'en',
    intent: 'B2B partnership',
    tone: 'Formal',
    urgency: 'High',
    confidence_score: 0.87,
    current_tag: 'New Lead',
    relationship_insight: 'Excellent fit — Quebec-based service business with growth ambitions and CRM pain points.',
    timestamp: thisWeek[4].toISOString(),
  },
];

// ============================================
// Main Function
// ============================================

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🎬 SEED PRODUCTION DEMO CLIENT                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('⚠️  PRODUCTION MODE - All data will be marked as is_test: true');
  console.log('');
  
  // Step 1: Check if demo client already exists
  console.log('🔍 Step 1: Checking for existing demo client...');
  const { data: existingClient, error: checkError } = await supabase
    .from('clients')
    .select('id, client_id, email, business_name')
    .eq('email', DEMO_CLIENT.email)
    .single();
  
  let clientDbId;
  let clientId;
  
  if (existingClient && !checkError) {
    console.log('   ℹ️  Demo client already exists');
    console.log('   Business:', existingClient.business_name);
    console.log('   Email:', existingClient.email);
    console.log('   Client ID:', existingClient.client_id);
    console.log('   UUID:', existingClient.id);
    clientDbId = existingClient.id;
    clientId = existingClient.client_id;
    console.log('');
    console.log('   Using existing client for demo leads...');
    console.log('');
  } else {
    // Step 2: Create demo client
    console.log('📝 Step 2: Creating production demo client...');
    console.log('   ⚠️  This will create a real client account marked as test data');
    console.log('');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(DEMO_CLIENT.password, 10);
    
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert([{
        client_id: DEMO_CLIENT.client_id,
        business_name: DEMO_CLIENT.business_name,
        contact_name: DEMO_CLIENT.contact_name,
        email: DEMO_CLIENT.email,
        password_hash: hashedPassword,
        language: DEMO_CLIENT.language,
        api_key: DEMO_CLIENT.api_key,
        is_test: DEMO_CLIENT.is_test,
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Failed to create demo client:', createError.message);
      console.error('   Error details:', createError);
      process.exit(1);
    }
    
    clientDbId = newClient.id;
    clientId = newClient.client_id;
    
    console.log('   ✅ Production demo client created');
    console.log('   ID:', clientDbId);
    console.log('   Client ID:', clientId);
    console.log('   Email:', DEMO_CLIENT.email);
    console.log('   Password:', DEMO_CLIENT.password);
    console.log('   Is Test:', DEMO_CLIENT.is_test);
    console.log('');
  }
  
  // Step 3: Create demo leads
  console.log('📋 Step 3: Creating production demo leads...');
  console.log('   Target: 5 bilingual demo leads');
  console.log('   All marked as is_test: true');
  console.log('');
  
  const insertedLeads = [];
  
  for (let i = 0; i < DEMO_LEADS.length; i++) {
    const lead = DEMO_LEADS[i];
    
    console.log(`   [${i + 1}/${DEMO_LEADS.length}] Creating lead: ${lead.name} (${lead.language.toUpperCase()})...`);
    
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
        tone_history: JSON.stringify([lead.tone]),
        confidence_history: JSON.stringify([lead.confidence_score]),
        urgency_history: JSON.stringify([lead.urgency]),
        archived: false,
        deleted: false,
        timestamp: lead.timestamp,
        last_updated: lead.timestamp,
        is_test: true, // Mark as test data
      }])
      .select()
      .single();
    
    if (leadError) {
      console.error(`      ❌ Failed to create lead:`, leadError.message);
      continue;
    }
    
    console.log(`      ✅ Lead created (ID: ${leadData.id})`);
    
    // Link lead to demo client via lead_actions
    const { error: actionError } = await supabase
      .from('lead_actions')
      .insert([{
        client_id: clientDbId, // Use UUID
        lead_id: leadData.id,
        tag: lead.current_tag,
        is_test: true, // Mark action as test
      }]);
    
    if (actionError) {
      console.error(`      ❌ Failed to link lead to client:`, actionError.message);
      
      // Try to clean up orphaned lead
      await supabase.from('lead_memory').delete().eq('id', leadData.id);
      console.error(`      🧹 Cleaned up orphaned lead`);
      continue;
    }
    
    console.log(`      ✅ Linked to demo client`);
    console.log('');
    
    insertedLeads.push({
      ...lead,
      id: leadData.id,
    });
  }
  
  // Final summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ PRODUCTION DEMO SEEDING COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📊 Demo Client Created (PRODUCTION):');
  console.log('  • Business: Demo Client – Dashboard');
  console.log('  • Email:', DEMO_CLIENT.email);
  console.log('  • Password:', DEMO_CLIENT.password);
  console.log('  • Client ID:', clientId);
  console.log('  • UUID:', clientDbId);
  console.log('  • Is Test: true ✅');
  console.log('  • Environment: PRODUCTION');
  console.log('');
  console.log('📋 Demo Leads Created:', insertedLeads.length);
  console.log('  • English leads:', insertedLeads.filter(l => l.language === 'en').length);
  console.log('  • French leads:', insertedLeads.filter(l => l.language === 'fr').length);
  console.log('  • All marked as is_test: true ✅');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Demo Leads Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  insertedLeads.forEach((lead, idx) => {
    console.log(`${idx + 1}. ${lead.name} (${lead.language.toUpperCase()})`);
    console.log(`   Email: ${lead.email}`);
    console.log(`   Intent: ${lead.intent} | Tone: ${lead.tone} | Urgency: ${lead.urgency}`);
    console.log(`   Confidence: ${(lead.confidence_score * 100).toFixed(0)}%`);
    console.log(`   Summary: ${lead.ai_summary.substring(0, 60)}...`);
    console.log('');
  });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Expected Dashboard Stats');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  Total Leads:', insertedLeads.length);
  console.log('  Avg Confidence:', Math.round((insertedLeads.reduce((sum, l) => sum + l.confidence_score, 0) / insertedLeads.length) * 100) + '%');
  console.log('  High Urgency:', insertedLeads.filter(l => l.urgency === 'High' || l.urgency === 'Haute').length);
  
  const intentCounts = {};
  insertedLeads.forEach(l => {
    intentCounts[l.intent] = (intentCounts[l.intent] || 0) + 1;
  });
  const topIntent = Object.keys(intentCounts).sort((a, b) => intentCounts[b] - intentCounts[a])[0];
  console.log('  Top Intent:', topIntent);
  
  const langCounts = { en: 0, fr: 0 };
  insertedLeads.forEach(l => {
    if (l.language === 'en') langCounts.en++;
    if (l.language === 'fr') langCounts.fr++;
  });
  console.log('  Language Ratio: EN:', langCounts.en, '/ FR:', langCounts.fr);
  console.log('');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎬 Production Access URLs');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('English Dashboard:');
  console.log('  https://www.aveniraisolutions.ca/en/client/dashboard');
  console.log('');
  console.log('French Dashboard:');
  console.log('  https://www.aveniraisolutions.ca/fr/client/dashboard');
  console.log('');
  console.log('Login Credentials:');
  console.log('  • Email:', DEMO_CLIENT.email);
  console.log('  • Password:', DEMO_CLIENT.password);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Verification Checklist');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('English Dashboard (/en):');
  console.log('  ✓ All UI labels in English');
  console.log('  ✓ French leads show English translations');
  console.log('  ✓ All tone/intent/urgency values in English');
  console.log('  ✓ AI summaries in English');
  console.log('  ✓ Relationship insights in English');
  console.log('  ✓ First letter capitalized (High, Professional, etc.)');
  console.log('  ✓ Original messages unchanged (may be French)');
  console.log('');
  console.log('French Dashboard (/fr):');
  console.log('  ✓ All UI labels in French');
  console.log('  ✓ English leads show French translations');
  console.log('  ✓ All tone/intent/urgency values in French');
  console.log('  ✓ AI summaries in French');
  console.log('  ✓ Relationship insights in French');
  console.log('  ✓ First letter capitalized (Haute, Professionnel, etc.)');
  console.log('  ✓ Original messages unchanged (may be English)');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎥 Ready for Video Recording!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('The demo account is now live in production with:');
  console.log('  • 5 realistic bilingual leads');
  console.log('  • Proper stats and analytics');
  console.log('  • Full translation working');
  console.log('  • Professional demo data');
  console.log('  • Safe to use (is_test: true)');
  console.log('');
  console.log('✅ You can now record your video demonstration!');
  console.log('');
}

main().catch((error) => {
  console.error('');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ PRODUCTION SEEDING FAILED');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');
  console.error('Error:', error.message || error);
  console.error('');
  console.error('Troubleshooting:');
  console.error('  1. Verify production Supabase connection');
  console.error('  2. Check SUPABASE_SERVICE_ROLE_KEY is set');
  console.error('  3. Ensure clients, lead_memory, lead_actions tables exist');
  console.error('  4. Verify is_test column exists in all tables');
  console.error('');
  console.error('If you need to clean up test data:');
  console.error('  DELETE FROM lead_actions WHERE is_test = true;');
  console.error('  DELETE FROM lead_memory WHERE is_test = true;');
  console.error('  DELETE FROM clients WHERE is_test = true;');
  console.error('');
  process.exit(1);
});

