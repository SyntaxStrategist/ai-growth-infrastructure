// ============================================
// Prospect Intelligence Pipeline - Main Orchestrator
// ============================================

import { ProspectCandidate, FormTestResult, ProspectPipelineResult } from './types';
import { searchProspects, searchByIndustry } from './crawler/google_scraper';
import { generateTestProspects } from './crawler/test_data_generator';
import { searchMultipleIndustries as searchApolloMultiple } from '../src/lib/integrations/apollo_connector';
import { testContactForm, batchTestProspects } from './signal-analyzer/form_tester';
import { calculateAutomationScore, sortByAutomationNeed, filterByMinScore } from './signal-analyzer/site_score';
import { generateOutreachEmail, batchGenerateOutreach } from './outreach/generate_outreach_email';
import { sendOutreachEmail, batchSendEmails } from './outreach/send_outreach_email';
import { updateIndustryPerformance, generateInsightsReport } from './feedback/learn_icp_model';
import { saveProspectsToDatabase } from './database/supabase_connector';

export interface PipelineConfig {
  industries: string[];
  regions: string[];
  minAutomationScore: number;
  maxProspectsPerRun: number;
  testMode: boolean;
}

/**
 * Run complete prospect intelligence pipeline
 */
export async function runProspectPipeline(config: PipelineConfig): Promise<ProspectPipelineResult> {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  🧠 PROSPECT INTELLIGENCE PIPELINE                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const result: ProspectPipelineResult = {
    totalCrawled: 0,
    totalTested: 0,
    totalScored: 0,
    totalContacted: 0,
    highPriorityProspects: [],
    errors: []
  };

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 PIPELINE CONFIGURATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Industries:', config.industries.join(', '));
  console.log('Regions:', config.regions.join(', '));
  console.log('Min Automation Score:', config.minAutomationScore);
  console.log('Max Prospects:', config.maxProspectsPerRun);
  console.log('Test Mode:', config.testMode ? 'YES' : 'NO');
  console.log('');

  try {
    // ============================================
    // STAGE 1: CRAWL & DISCOVER PROSPECTS
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1️⃣  STAGE 1: PROSPECT DISCOVERY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    let allProspects: ProspectCandidate[] = [];

    // Use test data generator in test mode
    if (config.testMode) {
      console.log('🧪 TEST MODE: Using test data generator');
      allProspects = generateTestProspects(config.maxProspectsPerRun, config.industries, config.regions);
      console.log(`✅ Generated ${allProspects.length} test prospects\n`);
    } else {
      // Production mode: Try Apollo API first, fallback to Google scraper
      console.log('🌐 PRODUCTION MODE: Using real data sources');
      
      try {
        console.log('📡 Attempting Apollo API connection...');
        
        // Search Apollo for each industry/region combination
        for (const industry of config.industries) {
          for (const region of config.regions) {
            console.log(`🔍 Apollo Search: ${industry} in ${region}...`);
            
            try {
              const apolloModule = await import('../src/lib/integrations/apollo_connector');
              
              // Check if Apollo is configured
              if (!apolloModule.ApolloAPI.isConfigured()) {
                console.log('⚠️  Apollo API not configured, falling back to Google scraper');
                const prospects = await searchByIndustry(industry, region);
                allProspects = allProspects.concat(prospects);
                console.log(`✅ Google: Found ${prospects.length} prospects\n`);
                continue;
              }
              
              // Use Apollo API
              const apolloProspects = await apolloModule.ApolloAPI.searchProspects(industry, region, Math.ceil(config.maxProspectsPerRun / (config.industries.length * config.regions.length)));
              
              // Transform Apollo prospects to ProspectCandidate format
              const transformedProspects: ProspectCandidate[] = apolloProspects.map(ap => ({
                id: undefined,
                business_name: ap.business_name,
                website: ap.website,
                contact_email: ap.contact_email,
                industry: ap.industry || industry,
                region: ap.region || region,
                language: region.includes('QC') || region === 'FR' ? 'fr' : 'en',
                form_url: ap.website ? `${ap.website}/contact` : undefined,
                last_tested: undefined,
                response_score: 0,
                automation_need_score: ap.automation_need_score,
                contacted: false,
                metadata: ap.metadata
              }));
              
              allProspects = allProspects.concat(transformedProspects);
              console.log(`✅ Apollo: Found ${transformedProspects.length} prospects\n`);
              
            } catch (error) {
              const errorMsg = `Apollo search failed for ${industry} in ${region}, trying fallback`;
              console.warn(`⚠️  ${errorMsg}:`, error);
              
              // Fallback to Google scraper
              try {
                const prospects = await searchByIndustry(industry, region);
                allProspects = allProspects.concat(prospects);
                console.log(`✅ Google (fallback): Found ${prospects.length} prospects\n`);
              } catch (fallbackError) {
                const fallbackErrorMsg = `Both Apollo and Google search failed for ${industry} in ${region}`;
                console.error(`❌ ${fallbackErrorMsg}:`, fallbackError);
                result.errors.push(fallbackErrorMsg);
              }
            }
          }
        }
      } catch (error) {
        const errorMsg = 'Production data source initialization failed';
        console.error(`❌ ${errorMsg}:`, error);
        result.errors.push(errorMsg);
      }
    }

    // Deduplicate by website
    allProspects = deduplicateProspects(allProspects);
    
    // Limit to max prospects
    if (allProspects.length > config.maxProspectsPerRun) {
      allProspects = allProspects.slice(0, config.maxProspectsPerRun);
    }

    result.totalCrawled = allProspects.length;
    console.log(`📊 Total unique prospects discovered: ${result.totalCrawled}\n`);

    if (allProspects.length === 0) {
      console.log('⚠️  No prospects found. Ending pipeline.\n');
      return result;
    }

    // ============================================
    // Save to Database
    // ============================================
    console.log('💾 Saving prospects to database...');
    try {
      await saveProspectsToDatabase(allProspects);
      console.log('✅ Prospects saved to database\n');
    } catch (error) {
      console.error('❌ Failed to save prospects:', error);
      result.errors.push('Database save failed');
    }

    // ============================================
    // STAGE 2: TEST CONTACT FORMS
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2️⃣  STAGE 2: CONTACT FORM TESTING');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Assign IDs to prospects for tracking
    allProspects = allProspects.map((p, index) => ({
      ...p,
      id: `prospect_${Date.now()}_${index}`
    }));

    const formTests: FormTestResult[] = await batchTestProspects(allProspects, {
      testMessage: 'Interested in your services. Can you send me more information?',
      testEmail: 'prospect-test@aveniraisolutions.ca',
      testName: 'Test Prospect',
      timeout: 60
    });

    result.totalTested = formTests.length;
    console.log(`\n📊 Total forms tested: ${result.totalTested}\n`);

    // ============================================
    // STAGE 3: CALCULATE SCORES
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3️⃣  STAGE 3: AUTOMATION SCORING');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    const automationScores = new Map<string, number>();

    for (const prospect of allProspects) {
      const formTest = formTests.find(t => t.prospect_id === prospect.id);
      if (formTest && prospect.id) {
        const score = calculateAutomationScore(prospect, formTest);
        automationScores.set(prospect.id, score.automationNeedScore);
        
        // Update prospect with scores
        prospect.response_score = score.overallScore;
        prospect.automation_need_score = score.automationNeedScore;
        
        console.log(`${prospect.business_name}: ${score.automationNeedScore}/100`);
      }
    }

    result.totalScored = automationScores.size;
    console.log(`\n📊 Total prospects scored: ${result.totalScored}\n`);

    // Filter to high-priority prospects
    const highPriorityProspects = filterByMinScore(allProspects, config.minAutomationScore);
    const sortedProspects = sortByAutomationNeed(highPriorityProspects);
    
    result.highPriorityProspects = sortedProspects;
    console.log(`🎯 High-priority prospects (score >= ${config.minAutomationScore}): ${sortedProspects.length}\n`);

    if (sortedProspects.length === 0) {
      console.log('⚠️  No high-priority prospects found. Ending pipeline.\n');
      return result;
    }

    // ============================================
    // STAGE 4: GENERATE OUTREACH
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('4️⃣  STAGE 4: OUTREACH GENERATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    const outreachTemplates = batchGenerateOutreach(
      sortedProspects,
      formTests,
      automationScores
    );

    console.log(`\n📊 Outreach emails generated: ${outreachTemplates.size}\n`);

    // ============================================
    // STAGE 5: SEND OUTREACH
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('5️⃣  STAGE 5: OUTREACH DELIVERY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    if (config.testMode) {
      console.log('🧪 TEST MODE: Previewing emails (not sending)');
      console.log('');
    }

    const outreachLogs = await batchSendEmails(sortedProspects, outreachTemplates);
    result.totalContacted = outreachLogs.size;

    console.log(`\n📊 Outreach emails sent: ${result.totalContacted}\n`);

    // ============================================
    // STAGE 6: SUMMARY
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ PIPELINE COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📊 Pipeline Results:');
    console.log(`   Prospects Discovered:   ${result.totalCrawled}`);
    console.log(`   Forms Tested:           ${result.totalTested}`);
    console.log(`   Prospects Scored:       ${result.totalScored}`);
    console.log(`   High-Priority Found:    ${result.highPriorityProspects.length}`);
    console.log(`   Outreach Sent:          ${result.totalContacted}`);
    console.log(`   Errors:                 ${result.errors.length}`);
    console.log('');

    if (result.highPriorityProspects.length > 0) {
      console.log('🎯 Top 3 Prospects:');
      result.highPriorityProspects.slice(0, 3).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.business_name} - Score: ${p.automation_need_score}/100`);
      });
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    const errorMsg = 'Pipeline execution failed';
    console.error(`❌ ${errorMsg}:`, error);
    result.errors.push(errorMsg + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
  }

  return result;
}

/**
 * Deduplicate prospects by website URL
 */
function deduplicateProspects(prospects: ProspectCandidate[]): ProspectCandidate[] {
  const seen = new Set<string>();
  return prospects.filter(p => {
    const normalized = p.website.toLowerCase().replace(/^https?:\/\/(www\.)?/, '');
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

/**
 * Quick test run with minimal prospects
 */
export async function runQuickTest(): Promise<ProspectPipelineResult> {
  return runProspectPipeline({
    industries: ['Construction', 'Real Estate'],
    regions: ['CA'],
    minAutomationScore: 70,
    maxProspectsPerRun: 5,
    testMode: true
  });
}

/**
 * Full production run
 */
export async function runProductionScan(): Promise<ProspectPipelineResult> {
  return runProspectPipeline({
    industries: [
      'Construction',
      'Real Estate',
      'Marketing',
      'Legal',
      'Healthcare',
      'Home Services'
    ],
    regions: ['CA', 'US'],
    minAutomationScore: 70,
    maxProspectsPerRun: 50,
    testMode: false
  });
}

