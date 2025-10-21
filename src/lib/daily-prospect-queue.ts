// ============================================
// Daily Prospect Queue Logic
// Automatically discovers, scores, and queues prospects for outreach
// ============================================

import { createClient } from '@supabase/supabase-js';
import { runProspectPipeline } from '../../prospect-intelligence/prospect_pipeline';
import { getAvenirICPProfile, getICPOptimizedCriteria } from './phase3/icp_profile';
import { generateOutreachEmail, batchGenerateOutreach } from '../../prospect-intelligence/outreach/generate_outreach_email';
import { ProspectCandidate, FormTestResult } from '../../prospect-intelligence/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface DailyQueueResult {
  prospectsDiscovered: number;
  prospectsScored: number;
  prospectsQueued: number;
  emailsGenerated: number;
  dailyLimit: number;
  errors: string[];
  executionTime: number;
}

/**
 * Run daily prospect discovery and queuing
 * Executes at 8 AM EST to queue prospects for 9 AM approval
 */
export async function runDailyProspectQueue(): Promise<DailyQueueResult> {
  const startTime = Date.now();
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  🌅 DAILY PROSPECT QUEUE - 8 AM EST                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const result: DailyQueueResult = {
    prospectsDiscovered: 0,
    prospectsScored: 0,
    prospectsQueued: 0,
    emailsGenerated: 0,
    dailyLimit: 50,
    errors: [],
    executionTime: 0
  };

  try {
    // ============================================
    // STEP 1: CHECK DAILY LIMITS
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1️⃣  CHECKING DAILY LIMITS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check how many emails are already queued today
    const { data: todayEmails, error: countError } = await supabase
      .from('outreach_emails')
      .select('id')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (countError) {
      throw new Error(`Failed to check daily limits: ${countError.message}`);
    }

    const emailsQueuedToday = todayEmails?.length || 0;
    const remainingQuota = result.dailyLimit - emailsQueuedToday;

    console.log(`📊 Daily Status:`);
    console.log(`   Emails queued today: ${emailsQueuedToday}`);
    console.log(`   Daily limit: ${result.dailyLimit}`);
    console.log(`   Remaining quota: ${remainingQuota}`);

    if (remainingQuota <= 0) {
      console.log('⚠️  Daily limit reached. No new prospects will be queued today.');
      result.executionTime = Date.now() - startTime;
      return result;
    }

    // ============================================
    // STEP 2: DISCOVER PROSPECTS
    // ============================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2️⃣  DISCOVERING PROSPECTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Get ICP-optimized criteria
    const icpCriteria = getICPOptimizedCriteria();
    console.log('🎯 ICP Criteria:');
    console.log(`   Industries: ${icpCriteria.industries.join(', ')}`);
    console.log(`   Company Size: ${icpCriteria.companySize.min}-${icpCriteria.companySize.max} employees`);
    console.log(`   Regions: ${icpCriteria.regions.join(', ')}`);
    console.log(`   Min ICP Score: ${icpCriteria.minICPScore}`);

    // Run prospect discovery pipeline
    const pipelineResult = await runProspectPipeline({
      industries: icpCriteria.industries,
      regions: icpCriteria.regions,
      minAutomationScore: icpCriteria.minICPScore,
      maxProspectsPerRun: Math.min(remainingQuota * 2, 100), // Get 2x quota to ensure we have enough after filtering
      testMode: false, // Production mode
      usePdl: true,
      scanForms: true
    });

    result.prospectsDiscovered = pipelineResult.totalCrawled;
    result.prospectsScored = pipelineResult.totalScored;

    console.log(`\n📊 Discovery Results:`);
    console.log(`   Prospects discovered: ${pipelineResult.totalCrawled}`);
    console.log(`   Forms tested: ${pipelineResult.totalTested}`);
    console.log(`   Prospects scored: ${pipelineResult.totalScored}`);
    console.log(`   High-priority prospects: ${pipelineResult.highPriorityProspects.length}`);

    if (pipelineResult.highPriorityProspects.length === 0) {
      console.log('⚠️  No high-priority prospects found. Ending queue process.');
      result.executionTime = Date.now() - startTime;
      return result;
    }

    // ============================================
    // STEP 3: FILTER AND RANK PROSPECTS
    // ============================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3️⃣  FILTERING AND RANKING PROSPECTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Filter prospects that haven't been contacted yet
    const uncontactedProspects = pipelineResult.highPriorityProspects.filter(p => !p.contacted);
    console.log(`📊 Uncontacted prospects: ${uncontactedProspects.length}`);

    // Sort by combined score (automation + business fit)
    const rankedProspects = uncontactedProspects
      .map(prospect => {
        const automationScore = prospect.automation_need_score || 0;
        const businessFitScore = prospect.metadata?.business_fit_score || 0;
        const combinedScore = (automationScore * 0.7) + (businessFitScore * 0.3); // Weight automation more heavily
        
        return {
          ...prospect,
          combinedScore
        };
      })
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, remainingQuota); // Take only what we can queue today

    console.log(`📊 Top prospects selected: ${rankedProspects.length}`);
    console.log('🎯 Top 5 prospects:');
    rankedProspects.slice(0, 5).forEach((p, i) => {
      const automationScore = p.automation_need_score || 0;
      const businessFitScore = p.metadata?.business_fit_score || 0;
      console.log(`   ${i + 1}. ${p.business_name} - Auto: ${automationScore}, Fit: ${businessFitScore}, Combined: ${Math.round(p.combinedScore)}`);
    });

    if (rankedProspects.length === 0) {
      console.log('⚠️  No suitable prospects found for queuing.');
      result.executionTime = Date.now() - startTime;
      return result;
    }

    // ============================================
    // STEP 4: GENERATE OUTREACH EMAILS
    // ============================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('4️⃣  GENERATING OUTREACH EMAILS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Create mock form test results for email generation
    const mockFormTests: FormTestResult[] = rankedProspects.map(prospect => ({
      prospect_id: prospect.id!,
      has_autoresponder: false,
      response_time_minutes: 0,
      form_accessible: true,
      test_successful: true,
      test_message: 'Test message',
      test_timestamp: new Date().toISOString()
    }));

    // Generate outreach emails
    const outreachTemplates = batchGenerateOutreach(
      rankedProspects,
      mockFormTests,
      new Map(rankedProspects.map(p => [p.id!, p.automation_need_score || 0]))
    );

    result.emailsGenerated = outreachTemplates.size;
    console.log(`📊 Outreach emails generated: ${result.emailsGenerated}`);

    // ============================================
    // STEP 5: QUEUE EMAILS FOR APPROVAL
    // ============================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('5️⃣  QUEUING EMAILS FOR APPROVAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Create a daily campaign for tracking
    const { data: campaign, error: campaignError } = await supabase
      .from('outreach_campaigns')
      .insert([{
        name: `Daily Queue - ${today.toISOString().split('T')[0]}`,
        status: 'active',
        target_criteria: {
          industries: icpCriteria.industries,
          regions: icpCriteria.regions,
          min_automation_score: icpCriteria.minICPScore,
          daily_queue: true
        },
        email_template_id: null, // Using generated templates
        follow_up_schedule: []
      }])
      .select()
      .single();

    if (campaignError) {
      console.error('❌ Failed to create daily campaign:', campaignError);
      result.errors.push('Failed to create daily campaign');
    }

    // Queue emails for approval
    const emailsToQueue = [];
    for (const prospect of rankedProspects) {
      const template = outreachTemplates.get(prospect.id!);
      if (!template) continue;

      emailsToQueue.push({
        campaign_id: campaign?.id || null,
        prospect_id: prospect.id,
        prospect_email: prospect.contact_email,
        prospect_name: extractContactName(prospect),
        company_name: prospect.business_name,
        template_id: null, // Using generated template
        subject: template.subject,
        content: template.body,
        status: 'pending',
        created_at: new Date().toISOString(),
        metadata: {
          automation_score: prospect.automation_need_score,
          business_fit_score: prospect.metadata?.business_fit_score,
          combined_score: prospect.combinedScore,
          industry: prospect.industry,
          region: prospect.region,
          language: template.language,
          daily_queue: true,
          queued_at: new Date().toISOString()
        }
      });
    }

    // Insert emails in batch
    const { data: queuedEmails, error: queueError } = await supabase
      .from('outreach_emails')
      .insert(emailsToQueue)
      .select();

    if (queueError) {
      console.error('❌ Failed to queue emails:', queueError);
      result.errors.push('Failed to queue emails for approval');
    } else {
      result.prospectsQueued = queuedEmails?.length || 0;
      console.log(`✅ Queued ${result.prospectsQueued} emails for approval`);
    }

    // ============================================
    // STEP 6: LOG TRACKING EVENTS
    // ============================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('6️⃣  LOGGING TRACKING EVENTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Log daily queue event
    await supabase
      .from('outreach_tracking')
      .insert([{
        email_id: null,
        prospect_id: null,
        campaign_id: campaign?.id || null,
        action: 'daily_queue_completed',
        metadata: {
          prospects_discovered: result.prospectsDiscovered,
          prospects_scored: result.prospectsScored,
          prospects_queued: result.prospectsQueued,
          emails_generated: result.emailsGenerated,
          daily_limit: result.dailyLimit,
          execution_time_ms: Date.now() - startTime,
          icp_criteria: icpCriteria,
          queued_at: new Date().toISOString()
        }
      }]);

    // Log individual prospect queuing events
    if (queuedEmails) {
      const trackingEvents = queuedEmails.map(email => ({
        email_id: email.id,
        prospect_id: email.prospect_id,
        campaign_id: email.campaign_id,
        action: 'email_queued_for_approval',
        metadata: {
          automation_score: email.metadata?.automation_score,
          business_fit_score: email.metadata?.business_fit_score,
          combined_score: email.metadata?.combined_score,
          daily_queue: true,
          queued_at: email.metadata?.queued_at
        }
      }));

      await supabase
        .from('outreach_tracking')
        .insert(trackingEvents);
    }

    console.log('✅ Tracking events logged');

    // ============================================
    // STEP 7: SUMMARY
    // ============================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DAILY QUEUE COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📊 Daily Queue Results:');
    console.log(`   Prospects Discovered:   ${result.prospectsDiscovered}`);
    console.log(`   Prospects Scored:       ${result.prospectsScored}`);
    console.log(`   Emails Generated:       ${result.emailsGenerated}`);
    console.log(`   Emails Queued:          ${result.prospectsQueued}`);
    console.log(`   Daily Limit:            ${result.dailyLimit}`);
    console.log(`   Remaining Quota:        ${result.dailyLimit - emailsQueuedToday - result.prospectsQueued}`);
    console.log(`   Execution Time:         ${Math.round((Date.now() - startTime) / 1000)}s`);
    console.log(`   Errors:                 ${result.errors.length}`);
    console.log('');

    if (result.prospectsQueued > 0) {
      console.log('🎯 Next Steps:');
      console.log('   1. Review queued emails in admin dashboard');
      console.log('   2. Approve emails before 9 AM EST');
      console.log('   3. Emails will auto-send after approval');
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Daily prospect queue failed:', errorMsg);
    result.errors.push(errorMsg);
  }

  result.executionTime = Date.now() - startTime;
  return result;
}

/**
 * Extract contact name from prospect data
 */
function extractContactName(prospect: ProspectCandidate): string | null {
  if (prospect.contact_email) {
    // Try to extract name from email (e.g., john.doe@company.com → John)
    const localPart = prospect.contact_email.split('@')[0];
    const namePart = localPart.split(/[._-]/)[0];
    if (namePart && namePart.length > 2 && !/info|contact|hello|support|admin/i.test(namePart)) {
      return namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
    }
  }
  return null;
}

/**
 * Manual trigger for testing
 */
export async function triggerManualQueue(): Promise<DailyQueueResult> {
  console.log('[ManualQueue] Manual trigger requested');
  return runDailyProspectQueue();
}
