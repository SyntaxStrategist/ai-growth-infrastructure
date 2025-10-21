// ============================================
// Test the exact worker flow for outreach_emails
// ============================================

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testWorkerFlow() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  TESTING WORKER OUTREACH EMAIL FLOW                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const today = new Date();
  
  // ============================================
  // STEP 1: Create a campaign (like the worker does)
  // ============================================
  console.log('1️⃣  Creating campaign...');
  
  const { data: campaign, error: campaignError } = await supabase
    .from('outreach_campaigns')
    .insert([{
      name: `Test Daily Queue - ${today.toISOString().split('T')[0]}`,
      status: 'active',
      target_criteria: {
        industries: ['Technology'],
        regions: ['North America'],
        min_automation_score: 70,
        daily_queue: true
      },
      email_template_id: null,
      follow_up_schedule: []
    }])
    .select()
    .single();

  if (campaignError) {
    console.error('❌ Failed to create campaign:', campaignError);
    console.error('   Code:', campaignError.code);
    console.error('   Message:', campaignError.message);
    console.error('   Details:', campaignError.details);
    return;
  }

  console.log('✅ Campaign created:', campaign.id);

  // ============================================
  // STEP 2: Check if we have any prospects WITH EMAIL
  // ============================================
  console.log('\n2️⃣  Checking for prospects with email addresses...');
  
  const { data: prospects, error: prospectError } = await supabase
    .from('prospect_candidates')
    .select('id, business_name, contact_email, website')
    .not('contact_email', 'is', null)
    .limit(1);

  if (prospectError) {
    console.error('❌ Failed to fetch prospects:', prospectError);
  } else if (!prospects || prospects.length === 0) {
    console.log('⚠️  No prospects with email found - creating a test prospect');
    
    // Create a test prospect
    const { data: newProspect, error: newProspectError } = await supabase
      .from('prospect_candidates')
      .insert([{
        business_name: 'Test Company',
        website: `https://test-${Date.now()}.example.com`,
        contact_email: 'test@example.com',
        industry: 'Technology',
        region: 'North America',
        automation_need_score: 75
      }])
      .select()
      .single();

    if (newProspectError) {
      console.error('❌ Failed to create test prospect:', newProspectError);
      // Clean up campaign
      await supabase.from('outreach_campaigns').delete().eq('id', campaign.id);
      return;
    }
    
    prospects.push(newProspect);
    console.log('✅ Test prospect created:', newProspect.id);
  } else {
    console.log('✅ Found prospect:', prospects[0].id);
  }

  const prospect = prospects[0];

  // ============================================
  // STEP 3: Queue emails (exactly like the worker)
  // ============================================
  console.log('\n3️⃣  Queuing emails...');
  
  const emailsToQueue = [{
    campaign_id: campaign.id,
    prospect_id: prospect.id,
    prospect_email: prospect.contact_email,
    prospect_name: 'Test Name',
    company_name: prospect.business_name,
    template_id: null,
    subject: 'Test Subject - AI Growth Automation',
    content: 'Test email content for prospect automation needs',
    status: 'pending',
    created_at: new Date().toISOString()
  }];

  console.log('📋 Email to queue:', JSON.stringify(emailsToQueue[0], null, 2));

  const { data: queuedEmails, error: queueError } = await supabase
    .from('outreach_emails')
    .insert(emailsToQueue)
    .select();

  if (queueError) {
    console.error('\n❌ Failed to queue emails:', queueError);
    console.error('   Code:', queueError.code);
    console.error('   Message:', queueError.message);
    console.error('   Details:', queueError.details);
    console.error('   Hint:', queueError.hint);
  } else {
    console.log('✅ Emails queued successfully:', queuedEmails.length);
    console.log('📧 Queued email:', queuedEmails[0]);
  }

  // ============================================
  // CLEANUP
  // ============================================
  console.log('\n4️⃣  Cleaning up test data...');
  
  if (queuedEmails && queuedEmails.length > 0) {
    await supabase
      .from('outreach_emails')
      .delete()
      .in('id', queuedEmails.map(e => e.id));
    console.log('🧹 Deleted test emails');
  }

  await supabase
    .from('outreach_campaigns')
    .delete()
    .eq('id', campaign.id);
  console.log('🧹 Deleted test campaign');

  if (prospect.business_name === 'Test Company') {
    await supabase
      .from('prospect_candidates')
      .delete()
      .eq('id', prospect.id);
    console.log('🧹 Deleted test prospect');
  }

  console.log('\n✅ Test complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testWorkerFlow()
  .then(() => {
    console.log('✅ Worker flow test complete\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Worker flow test failed:', err);
    process.exit(1);
  });

