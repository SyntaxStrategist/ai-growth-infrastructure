// Test the missing_email flag for prospects without emails
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMissingEmailFlow() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  TESTING MISSING EMAIL FLAG                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // ============================================
  // STEP 1: Create a prospect WITHOUT email
  // ============================================
  console.log('1️⃣  Creating prospect without email...');
  
  const { data: noEmailProspect, error: prospectError } = await supabase
    .from('prospect_candidates')
    .insert([{
      business_name: 'Test Company No Email',
      website: `https://test-no-email-${Date.now()}.example.com`,
      contact_email: null, // No email!
      industry: 'Technology',
      region: 'North America',
      automation_need_score: 80
    }])
    .select()
    .single();

  if (prospectError) {
    console.error('❌ Failed to create prospect:', prospectError);
    return;
  }

  console.log('✅ Prospect created (no email):', noEmailProspect.id);

  // ============================================
  // STEP 2: Create a campaign
  // ============================================
  console.log('\n2️⃣  Creating campaign...');
  
  const { data: campaign, error: campaignError } = await supabase
    .from('outreach_campaigns')
    .insert([{
      name: `Test Missing Email - ${new Date().toISOString()}`,
      status: 'active'
    }])
    .select()
    .single();

  if (campaignError) {
    console.error('❌ Failed to create campaign:', campaignError);
    await supabase.from('prospect_candidates').delete().eq('id', noEmailProspect.id);
    return;
  }

  console.log('✅ Campaign created:', campaign.id);

  // ============================================
  // STEP 3: Queue email WITHOUT prospect_email
  // ============================================
  console.log('\n3️⃣  Queuing email with missing_email flag...');
  
  const emailToQueue = {
    campaign_id: campaign.id,
    prospect_id: noEmailProspect.id,
    prospect_email: null, // NULL email
    prospect_name: 'Test Contact',
    company_name: noEmailProspect.business_name,
    website: noEmailProspect.website,
    subject: 'Test Subject - Needs Manual Email',
    content: 'This email needs a manual email address',
    status: 'pending',
    missing_email: true, // Flag it!
    sender_email: null
  };

  console.log('📋 Email to queue:', JSON.stringify(emailToQueue, null, 2));

  const { data: queuedEmail, error: queueError } = await supabase
    .from('outreach_emails')
    .insert([emailToQueue])
    .select()
    .single();

  if (queueError) {
    console.error('\n❌ Failed to queue email:', queueError);
    await supabase.from('outreach_campaigns').delete().eq('id', campaign.id);
    await supabase.from('prospect_candidates').delete().eq('id', noEmailProspect.id);
    return;
  }

  console.log('✅ Email queued successfully!');
  console.log('📧 Queued email details:');
  console.log('   ID:', queuedEmail.id);
  console.log('   Missing Email:', queuedEmail.missing_email);
  console.log('   Website:', queuedEmail.website);
  console.log('   Prospect Email:', queuedEmail.prospect_email || '(null)');

  // ============================================
  // STEP 4: Verify it appears in pending queue
  // ============================================
  console.log('\n4️⃣  Verifying in pending queue...');
  
  const { data: pendingEmails, error: pendingError } = await supabase
    .from('outreach_emails')
    .select(`
      id,
      prospect_email,
      prospect_name,
      company_name,
      website,
      sender_email,
      missing_email,
      status,
      prospect:prospect_candidates(
        business_name,
        website,
        automation_need_score
      )
    `)
    .eq('id', queuedEmail.id)
    .single();

  if (pendingError) {
    console.error('❌ Failed to verify:', pendingError);
  } else {
    console.log('✅ Verified in queue:');
    console.log('   Missing Email Flag:', pendingEmails.missing_email ? '✅ TRUE' : '❌ FALSE');
    console.log('   Prospect Email:', pendingEmails.prospect_email || '(null)');
    console.log('   Website:', pendingEmails.website);
    console.log('   Company:', pendingEmails.company_name);
  }

  // ============================================
  // CLEANUP
  // ============================================
  console.log('\n5️⃣  Cleaning up test data...');
  
  await supabase.from('outreach_emails').delete().eq('id', queuedEmail.id);
  console.log('🧹 Deleted test email');
  
  await supabase.from('outreach_campaigns').delete().eq('id', campaign.id);
  console.log('🧹 Deleted test campaign');
  
  await supabase.from('prospect_candidates').delete().eq('id', noEmailProspect.id);
  console.log('🧹 Deleted test prospect');

  console.log('\n✅ Test complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testMissingEmailFlow()
  .then(() => {
    console.log('✅ Missing email flow test complete\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });

