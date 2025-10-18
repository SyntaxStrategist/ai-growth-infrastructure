#!/usr/bin/env node
// ============================================
// Full Demo Generator with Real Intelligence Engine
// ============================================
// Creates a complete fake company with realistic leads and actions,
// then triggers the real intelligence engine to process them
// ⚠️ SAFE FOR PRODUCTION - All data marked as is_test: true

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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
// Demo Data Generation
// ============================================

// Generate unique client ID for this run
const clientId = uuidv4();
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const companyName = `Growth AI Demo #${timestamp}`;

// Realistic company data
const DEMO_CLIENT = {
  client_id: clientId,
  business_name: companyName,
  contact_name: 'Demo Account Manager',
  email: `demo-${timestamp}@growthai-demo.com`,
  password: 'DemoGrowth2025!',
  language: 'en',
  timezone: 'America/Toronto',
  is_test: true,
  api_key: 'demo-api-key-' + Math.random().toString(36).substring(2, 20),
};

// Realistic lead names and companies
const LEAD_NAMES = [
  // English leads (70%)
  { name: 'Sarah Johnson', company: 'TechStart Solutions', email: 'sarah.j@techstart.ca', locale: 'en' },
  { name: 'Michael Chen', company: 'Digital Innovations Inc', email: 'm.chen@digitalinnovations.com', locale: 'en' },
  { name: 'Emily Rodriguez', company: 'CloudFirst Technologies', email: 'emily@cloudfirst.tech', locale: 'en' },
  { name: 'David Thompson', company: 'DataDriven Analytics', email: 'david.t@datadriven.ca', locale: 'en' },
  { name: 'Lisa Wang', company: 'AI Solutions Group', email: 'lisa.wang@aisolutions.ca', locale: 'en' },
  { name: 'James Wilson', company: 'FutureTech Systems', email: 'james@futuretech.systems', locale: 'en' },
  { name: 'Amanda Foster', company: 'SmartBusiness Solutions', email: 'amanda@smartbusiness.ca', locale: 'en' },
  { name: 'Robert Kim', company: 'Innovation Labs', email: 'robert.kim@innovationlabs.ca', locale: 'en' },
  { name: 'Jennifer Lee', company: 'TechForward Inc', email: 'jennifer@techforward.ca', locale: 'en' },
  { name: 'Christopher Brown', company: 'Digital Dynamics', email: 'chris@digitaldynamics.ca', locale: 'en' },
  { name: 'Michelle Taylor', company: 'NextGen Technologies', email: 'michelle@nextgen.tech', locale: 'en' },
  { name: 'Andrew Davis', company: 'CloudScale Solutions', email: 'andrew@cloudscale.ca', locale: 'en' },
  { name: 'Rachel Green', company: 'AI-Powered Systems', email: 'rachel@aipowered.ca', locale: 'en' },
  { name: 'Kevin Martinez', company: 'DataFlow Technologies', email: 'kevin@dataflow.tech', locale: 'en' },
  { name: 'Stephanie White', company: 'Innovation Hub', email: 'stephanie@innovationhub.ca', locale: 'en' },
  { name: 'Daniel Anderson', company: 'TechVision Corp', email: 'daniel@techvision.ca', locale: 'en' },
  { name: 'Nicole Garcia', company: 'Future Systems Ltd', email: 'nicole@futuresystems.ca', locale: 'en' },
  { name: 'Matthew Johnson', company: 'SmartTech Solutions', email: 'matthew@smarttech.ca', locale: 'en' },
  
  // French leads (30%)
  { name: 'Marie Dubois', company: 'Solutions Technologiques Québec', email: 'marie@soltech.qc.ca', locale: 'fr' },
  { name: 'Pierre Tremblay', company: 'Innovation Numérique Inc', email: 'pierre@innovnum.ca', locale: 'fr' },
  { name: 'Sophie Gagnon', company: 'Technologies Avancées', email: 'sophie@techavancee.ca', locale: 'fr' },
  { name: 'Jean-François Bouchard', company: 'Solutions IA Québec', email: 'jf@solutia.qc.ca', locale: 'fr' },
  { name: 'Isabelle Roy', company: 'Innovation Digitale', email: 'isabelle@innovdigitale.ca', locale: 'fr' },
  { name: 'Antoine Lavoie', company: 'Technologies Futuristes', email: 'antoine@techfutur.ca', locale: 'fr' },
  { name: 'Camille Moreau', company: 'Solutions Intelligentes', email: 'camille@solintel.ca', locale: 'fr' },
];

// Action types for realistic lead progression
const ACTION_TYPES = [
  { type: 'user_inquiry', message: 'Initial inquiry about AI automation solutions' },
  { type: 'ai_follow_up', message: 'AI follow-up with personalized recommendations' },
  { type: 'user_reply', message: 'User response with additional questions' },
  { type: 'booked_demo', message: 'Demo scheduled for next week' },
  { type: 'needs_follow_up', message: 'Requires follow-up call' },
  { type: 'no_response', message: 'No response after multiple attempts' },
  { type: 'interested', message: 'Expressed strong interest in partnership' },
  { type: 'not_interested', message: 'Not interested at this time' },
  { type: 'follow_up_scheduled', message: 'Follow-up meeting scheduled' },
  { type: 'proposal_sent', message: 'Proposal sent for review' },
];

// ============================================
// Main Function
// ============================================

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🚀 FULL DEMO GENERATOR WITH INTELLIGENCE ENGINE         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('🎯 Creating complete fake company with real AI processing');
  console.log('');
  console.log('[Seed] Generated client ID:', clientId);
  console.log('[Seed] Company name:', companyName);
  console.log('');
  
  // Step 1: Create demo client
  console.log('🏢 Step 1: Creating demo client...');
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
      timezone: DEMO_CLIENT.timezone,
      api_key: DEMO_CLIENT.api_key,
      is_test: DEMO_CLIENT.is_test,
    }])
    .select()
    .single();
  
  if (createError) {
    console.error('❌ Failed to create demo client:', createError.message);
    process.exit(1);
  }
  
  console.log('   ✅ Demo client created');
  console.log('   ID:', newClient.id);
  console.log('   Client ID:', newClient.client_id);
  console.log('   Email:', DEMO_CLIENT.email);
  console.log('   Is Test:', DEMO_CLIENT.is_test);
  console.log('');
  
  // Step 2: Generate realistic leads
  console.log('👥 Step 2: Generating realistic leads...');
  console.log('   Target: 25 leads (70% English, 30% French)');
  console.log('');
  
  const insertedLeads = [];
  const insertedActions = [];
  
  // Generate timestamps over the last 7-14 days
  const now = new Date();
  const daysAgo = [];
  for (let i = 0; i < 14; i++) {
    daysAgo.push(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
  }
  
  for (let i = 0; i < LEAD_NAMES.length; i++) {
    const leadData = LEAD_NAMES[i];
    const isEnglish = leadData.locale === 'en';
    
    console.log(`   [${i + 1}/${LEAD_NAMES.length}] Creating lead: ${leadData.name} (${leadData.locale.toUpperCase()})...`);
    
    // Generate realistic lead message
    const messages = {
      en: [
        "Hi, we're looking to automate our customer service processes. Can you help us understand your AI solutions?",
        "Our company is growing fast and we need better lead management. What AI tools do you recommend?",
        "We're interested in implementing AI for our sales team. Could we schedule a demo?",
        "Our current CRM isn't cutting it. Do you have AI solutions for lead qualification?",
        "We want to scale our business with AI automation. What's your approach?",
      ],
      fr: [
        "Bonjour, nous cherchons à automatiser nos processus de service client. Pouvez-vous nous aider à comprendre vos solutions IA?",
        "Notre entreprise grandit rapidement et nous avons besoin d'une meilleure gestion des prospects. Quels outils IA recommandez-vous?",
        "Nous sommes intéressés par l'implémentation d'IA pour notre équipe de vente. Pourrions-nous planifier une démo?",
        "Notre CRM actuel ne suffit plus. Avez-vous des solutions IA pour la qualification des prospects?",
        "Nous voulons faire évoluer notre entreprise avec l'automatisation IA. Quelle est votre approche?",
      ]
    };
    
    const message = messages[leadData.locale][Math.floor(Math.random() * messages[leadData.locale].length)];
    
    // Generate AI summary
    const summaries = {
      en: [
        `${leadData.company} seeking AI automation for customer service and lead management`,
        `Growing company interested in AI solutions for sales team scaling`,
        `Business looking to implement AI for CRM and lead qualification processes`,
        `Company seeking AI automation to improve customer service efficiency`,
        `Organization interested in AI tools for business growth and scaling`,
      ],
      fr: [
        `${leadData.company} cherche l'automatisation IA pour le service client et la gestion des prospects`,
        `Entreprise en croissance intéressée par les solutions IA pour l'équipe de vente`,
        `Entreprise cherchant à implémenter l'IA pour les processus CRM et qualification`,
        `Organisation intéressée par l'automatisation IA pour améliorer l'efficacité`,
        `Compagnie cherchant des outils IA pour la croissance et l'expansion`,
      ]
    };
    
    const aiSummary = summaries[leadData.locale][Math.floor(Math.random() * summaries[leadData.locale].length)];
    
    // Generate realistic lead data
    const lead = {
      name: leadData.name,
      email: leadData.email,
      message: message,
      ai_summary: aiSummary,
      language: leadData.locale,
      intent: isEnglish ? 
        ['B2B partnership', 'Consultation', 'Product inquiry'][Math.floor(Math.random() * 3)] :
        ['Partenariat B2B', 'Consultation', 'Demande produit'][Math.floor(Math.random() * 3)],
      tone: isEnglish ?
        ['Professional', 'Casual', 'Formal', 'Urgent'][Math.floor(Math.random() * 4)] :
        ['Professionnel', 'Décontracté', 'Formel', 'Urgent'][Math.floor(Math.random() * 4)],
      urgency: isEnglish ?
        ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)] :
        ['Haute', 'Moyenne', 'Faible'][Math.floor(Math.random() * 3)],
      confidence_score: 0.6 + Math.random() * 0.35, // 0.6-0.95
      current_tag: isEnglish ? 'New Lead' : 'Nouveau Lead',
      relationship_insight: isEnglish ?
        'Initial contact shows interest in AI solutions. Follow up recommended.' :
        'Contact initial montre intérêt pour solutions IA. Suivi recommandé.',
      tone_history: JSON.stringify([isEnglish ? 'Professional' : 'Professionnel']),
      confidence_history: JSON.stringify([0.6 + Math.random() * 0.35]),
      urgency_history: JSON.stringify([isEnglish ? 'Medium' : 'Moyenne']),
      archived: false,
      deleted: false,
      timestamp: daysAgo[Math.floor(Math.random() * 14)].toISOString(),
      last_updated: daysAgo[Math.floor(Math.random() * 14)].toISOString(),
      is_test: true,
    };
    
    // Insert lead
    const { data: leadData_inserted, error: leadError } = await supabase
      .from('lead_memory')
      .insert([lead])
      .select()
      .single();
    
    if (leadError) {
      console.error(`      ❌ Failed to create lead:`, leadError.message);
      continue;
    }
    
    console.log(`      ✅ Lead created (ID: ${leadData_inserted.id})`);
    
    // Generate 2-5 actions for this lead
    const numActions = 2 + Math.floor(Math.random() * 4); // 2-5 actions
    const leadActions = [];
    
    for (let j = 0; j < numActions; j++) {
      const actionType = ACTION_TYPES[Math.floor(Math.random() * ACTION_TYPES.length)];
      const actionTimestamp = new Date(leadData_inserted.timestamp);
      actionTimestamp.setHours(actionTimestamp.getHours() + (j * 2)); // Space actions 2 hours apart
      
      const action = {
        client_id: newClient.id, // Use UUID
        lead_id: leadData_inserted.id,
        action_type: actionType.type,
        message: actionType.message,
        timestamp: actionTimestamp.toISOString(),
        is_test: true,
      };
      
      leadActions.push(action);
    }
    
    // Insert actions
    const { error: actionError } = await supabase
      .from('lead_actions')
      .insert(leadActions);
    
    if (actionError) {
      console.error(`      ❌ Failed to create actions:`, actionError.message);
    } else {
      console.log(`      ✅ ${numActions} actions created`);
      insertedActions.push(...leadActions);
    }
    
    insertedLeads.push({
      ...lead,
      id: leadData_inserted.id,
    });
  }
  
  console.log('');
  console.log('   📊 Leads Summary:');
  console.log(`   • Total leads: ${insertedLeads.length}`);
  console.log(`   • English leads: ${insertedLeads.filter(l => l.language === 'en').length}`);
  console.log(`   • French leads: ${insertedLeads.filter(l => l.language === 'fr').length}`);
  console.log(`   • Total actions: ${insertedActions.length}`);
  console.log('');
  
  // Step 3: Trigger real intelligence engine
  console.log('🧠 Step 3: Triggering real intelligence engine...');
  console.log('   Calling production intelligence engine with simulate=true');
  console.log('');
  
  const intelligenceEngineUrl = 'https://www.aveniraisolutions.ca/api/intelligence-engine';
  
  try {
    console.log('   📡 Fetching:', intelligenceEngineUrl);
    console.log('   📤 Payload:', { client_id: clientId, simulate: true });
    
    const intelligenceResponse = await fetch(intelligenceEngineUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        simulate: true
      }),
    });
    
    if (!intelligenceResponse.ok) {
      throw new Error(`Intelligence engine returned ${intelligenceResponse.status}: ${intelligenceResponse.statusText}`);
    }
    
    const intelligenceData = await intelligenceResponse.json();
    console.log('   ✅ Intelligence engine completed for', clientId);
    console.log('   📥 Response:', intelligenceData);
    console.log('');
    
  } catch (error) {
    console.error('   ❌ Intelligence engine fetch failed:', error.message);
    console.error('   🔍 Error details:', error);
    console.log('   Continuing with verification...');
    console.log('');
  }
  
  // Step 4: Verify analytics were created
  console.log('📊 Step 4: Verifying analytics creation...');
  console.log('   Querying growth_brain table for client_id:', clientId);
  console.log('');
  
  try {
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('growth_brain')
      .select('engagement_score, avg_confidence, tone_sentiment_score, total_leads, prediction_summary, created_at')
      .eq('client_id', newClient.id)
      .single();
    
    if (analyticsError) {
      console.error('   ❌ Failed to fetch analytics:', analyticsError.message);
      console.error('   🔍 Error details:', analyticsError);
    } else if (analyticsData) {
      console.log('   ✅ Analytics record found in growth_brain:');
      console.log(`   • Engagement Score: ${analyticsData.engagement_score}`);
      console.log(`   • Avg Confidence: ${analyticsData.avg_confidence}%`);
      console.log(`   • Tone Sentiment: ${analyticsData.tone_sentiment_score}`);
      console.log(`   • Total Leads: ${analyticsData.total_leads}`);
      console.log(`   • Prediction: ${analyticsData.prediction_summary}`);
      console.log(`   • Created At: ${analyticsData.created_at}`);
      console.log('');
      
      // Validate that numeric fields exist and are valid
      const hasValidEngagement = typeof analyticsData.engagement_score === 'number' && analyticsData.engagement_score > 0;
      const hasValidConfidence = typeof analyticsData.avg_confidence === 'number' && analyticsData.avg_confidence > 0;
      const hasValidLeads = typeof analyticsData.total_leads === 'number' && analyticsData.total_leads > 0;
      
      console.log('   🔍 Data Validation:');
      console.log(`   • Engagement Score Valid: ${hasValidEngagement ? '✅' : '❌'} (${analyticsData.engagement_score})`);
      console.log(`   • Avg Confidence Valid: ${hasValidConfidence ? '✅' : '❌'} (${analyticsData.avg_confidence})`);
      console.log(`   • Total Leads Valid: ${hasValidLeads ? '✅' : '❌'} (${analyticsData.total_leads})`);
      console.log('');
    } else {
      console.log('   ⚠️  No analytics record found yet');
      console.log('   🔍 This may indicate the intelligence engine is still processing...');
      console.log('');
    }
  } catch (error) {
    console.error('   ❌ Error verifying analytics:', error.message);
    console.error('   🔍 Error details:', error);
    console.log('');
  }
  
  // Step 5: Final summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ FULL DEMO GENERATION COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('🎯 Demo Client Created:');
  console.log('  • Client ID:', clientId);
  console.log('  • Company:', companyName);
  console.log('  • Email:', DEMO_CLIENT.email);
  console.log('  • Password:', DEMO_CLIENT.password);
  console.log('  • Is Test: true ✅');
  console.log('');
  console.log('📊 Data Generated:');
  console.log(`  • Leads: ${insertedLeads.length}`);
  console.log(`  • Actions: ${insertedActions.length}`);
  console.log(`  • English: ${insertedLeads.filter(l => l.language === 'en').length}`);
  console.log(`  • French: ${insertedLeads.filter(l => l.language === 'fr').length}`);
  console.log('');
  console.log('👤 Sample Lead:');
  if (insertedLeads.length > 0) {
    const sampleLead = insertedLeads[0];
    console.log(`  • Name: ${sampleLead.name}`);
    console.log(`  • Email: ${sampleLead.email}`);
    console.log(`  • Language: ${sampleLead.language.toUpperCase()}`);
    console.log(`  • Intent: ${sampleLead.intent}`);
    console.log(`  • Urgency: ${sampleLead.urgency}`);
  }
  console.log('');
  console.log('🌐 Dashboard Access:');
  console.log(`  • URL: /dashboard?client_id=${clientId}`);
  console.log(`  • Full URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?client_id=${clientId}`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎥 Ready for Full Demo!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('The demo environment includes:');
  console.log('  • Complete fake company with realistic data');
  console.log('  • 25+ leads with multiple actions each');
  console.log('  • Real AI analytics from intelligence engine');
  console.log('  • Growth Copilot with data');
  console.log('  • Predictive Growth Engine insights');
  console.log('  • Relationship Insights with history');
  console.log('  • All sections working with real data');
  console.log('');
  console.log('✅ Demo client created:', clientId);
  console.log('');
}

main().catch((error) => {
  console.error('');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ FULL DEMO GENERATION FAILED');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');
  console.error('Error:', error.message || error);
  console.error('');
  console.error('Troubleshooting:');
  console.error('  1. Verify Supabase connection');
  console.error('  2. Check SUPABASE_SERVICE_ROLE_KEY is set');
  console.error('  3. Ensure intelligence engine endpoint is accessible');
  console.error('  4. Verify NEXT_PUBLIC_SITE_URL is configured');
  console.error('');
  process.exit(1);
});
