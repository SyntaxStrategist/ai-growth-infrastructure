// ============================================
// Prospect Intelligence Pipeline - Main Orchestrator
// ============================================

import { ProspectCandidate, FormTestResult, ProspectPipelineResult } from './types';
import { searchProspects, searchByIndustry } from './crawler/google_scraper';
import { generateTestProspects } from './crawler/test_data_generator';
import { searchMultipleIndustries as searchApolloMultiple } from '../src/lib/integrations/apollo_connector';
import { PdlAPI } from '../src/lib/integrations/pdl_connector';
import { FormScanner } from '../src/lib/form_scanner';
import { logIntegration } from '../src/lib/integration_logger';
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
  usePdl?: boolean; // Enable People Data Labs
  scanForms?: boolean; // Enable form scanning
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
        
        // Search using data source cascade: Apollo → PDL → Google
        for (const industry of config.industries) {
          for (const region of config.regions) {
            console.log(`🔍 Searching: ${industry} in ${region}...`);
            
            let prospects: ProspectCandidate[] = [];
            let dataSource = 'unknown';
            
            try {
              // DATA SOURCE 1: Apollo API
              const apolloModule = await import('../src/lib/integrations/apollo_connector');
              
              if (apolloModule.ApolloAPI.isConfigured()) {
                try {
                  console.log('📡 Trying Apollo...');
                  await logIntegration('apollo', 'info', `Searching: ${industry} in ${region}`);
                  
                  const apolloProspects = await apolloModule.ApolloAPI.searchProspects(
                    industry, 
                    region, 
                    Math.ceil(config.maxProspectsPerRun / (config.industries.length * config.regions.length))
                  );
                  
                  prospects = apolloProspects.map(ap => ({
                    id: undefined,
                    business_name: ap.business_name,
                    website: ap.website,
                    contact_email: ap.contact_email || undefined,
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
                  
                  dataSource = 'apollo';
                  console.log(`✅ Apollo: ${prospects.length} prospects`);
                  await logIntegration('apollo', 'info', 'Success', { count: prospects.length });
                  
                } catch (apolloError) {
                  console.warn('⚠️  Apollo failed');
                  await logIntegration('apollo', 'warn', 'API failed', {
                    error: apolloError instanceof Error ? apolloError.message : 'Unknown'
                  });
                }
              }
              
              // DATA SOURCE 2: People Data Labs
              if (prospects.length === 0 && config.usePdl !== false && PdlAPI.isConfigured()) {
                try {
                  console.log('📡 Trying PDL...');
                  await logIntegration('pdl', 'info', `Searching: ${industry} in ${region}`);
                  
                  const pdlProspects = await PdlAPI.searchProspects(industry, region, Math.ceil(config.maxProspectsPerRun / (config.industries.length * config.regions.length)));
                  
                  prospects = pdlProspects.map(pp => ({
                    id: undefined,
                    business_name: pp.business_name,
                    website: pp.website,
                    contact_email: pp.contact_email || undefined,
                    industry: pp.industry || industry,
                    region: pp.region || region,
                    language: region.includes('QC') || region === 'FR' ? 'fr' : 'en',
                    form_url: pp.website ? `${pp.website}/contact` : undefined,
                    last_tested: undefined,
                    response_score: 0,
                    automation_need_score: pp.automation_need_score,
                    contacted: false,
                    metadata: pp.metadata
                  }));
                  
                  dataSource = 'pdl';
                  console.log(`✅ PDL: ${prospects.length} prospects`);
                  await logIntegration('pdl', 'info', 'Success', { count: prospects.length });
                  
                } catch (pdlError) {
                  if (pdlError instanceof Error && pdlError.message.includes('not allowed')) {
                    console.warn('⚠️  PDL not available on current plan');
                    await logIntegration('pdl', 'warn', 'API_INACCESSIBLE');
                    result.errors.push(`PDL not available - ${industry}`);
                  } else {
                    console.warn('⚠️  PDL failed');
                    await logIntegration('pdl', 'warn', 'API failed', {
                      error: pdlError instanceof Error ? pdlError.message : 'Unknown'
                    });
                  }
                }
              }
              
              // DATA SOURCE 3: Google Scraper (final fallback)
              if (prospects.length === 0) {
                console.log('📡 Using Google fallback...');
                await logIntegration('google', 'info', `Fallback: ${industry} in ${region}`);
                prospects = await searchByIndustry(industry, region);
                dataSource = 'google';
                console.log(`✅ Google: ${prospects.length} prospects`);
              }
              
              allProspects = allProspects.concat(prospects);
              console.log(`✅ ${dataSource.toUpperCase()}: Total ${prospects.length} for ${industry}\n`);
              
            } catch (error) {
              const errorMsg = `All sources failed: ${industry} in ${region}`;
              console.error(`❌ ${errorMsg}:`, error);
              await logIntegration('pipeline', 'error', errorMsg, {
                error: error instanceof Error ? error.message : 'Unknown'
              });
              result.errors.push(errorMsg);
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
    // FORM SCANNING (Optional)
    // ============================================
    if (config.scanForms !== false) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 STAGE 1.5: FORM SCANNING');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      
      await logIntegration('form_scanner', 'info', `Scanning ${allProspects.length} websites for forms`);
      
      for (let i = 0; i < allProspects.length; i++) {
        const prospect = allProspects[i];
        console.log(`[${i + 1}/${allProspects.length}] Scanning: ${prospect.website}`);
        
        try {
          const formScanResult = await FormScanner.scan(prospect.website);
          
          // Add form scan results to metadata
          prospect.metadata = {
            ...prospect.metadata,
            form_scan: {
              has_form: formScanResult.hasForm,
              form_count: formScanResult.formCount,
              has_mailto: formScanResult.hasMailto,
              has_captcha: formScanResult.hasCaptcha,
              submit_method: formScanResult.submitMethod,
              recommended_approach: formScanResult.recommendedApproach,
              scanned_at: formScanResult.metadata.scanned_at,
              contact_paths: formScanResult.metadata.contact_paths_found,
              mailto_emails: formScanResult.metadata.mailto_emails
            }
          };
          
          console.log(`   ${formScanResult.hasForm ? '✅' : '❌'} Form: ${formScanResult.formCount} | Mailto: ${formScanResult.hasMailto} | CAPTCHA: ${formScanResult.hasCaptcha}`);
          
          // Email enrichment: Extract email from mailto links
          if (formScanResult.metadata.mailto_emails && formScanResult.metadata.mailto_emails.length > 0) {
            const extractedEmails = formScanResult.metadata.mailto_emails;
            console.log(`   [EmailEnrichment] Found ${extractedEmails.length} mailto emails:`, extractedEmails);
            
            // Use first valid email if contact_email is missing
            if (!prospect.contact_email) {
              const fallbackEmail = extractedEmails[0];
              prospect.contact_email = fallbackEmail;
              console.log(`   [EmailEnrichment] ✅ Populated contact_email from mailto link: ${fallbackEmail}`);
              console.log(`   [EmailEnrichment] ✅ Email will be saved to Supabase for ${prospect.business_name}`);
              await logIntegration('form_scanner', 'info', 'Extracted fallback email from mailto link', {
                business_name: prospect.business_name,
                website: prospect.website,
                email: fallbackEmail,
                source: 'mailto_extraction'
              });
            } else {
              console.log(`   [EmailEnrichment] ℹ️  Contact email already exists: ${prospect.contact_email} (mailto not used)`);
            }
          } else if (!prospect.contact_email) {
            console.log(`   [EmailEnrichment] ⚠️  No mailto links found - contact_email remains empty`);
          }
          
        } catch (scanError) {
          console.warn(`   ⚠️  Scan failed for ${prospect.website}`);
          await logIntegration('form_scanner', 'warn', 'Scan failed', {
            website: prospect.website,
            error: scanError instanceof Error ? scanError.message : 'Unknown'
          });
        }
        
        // Small delay between scans
        if (i < allProspects.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
      
      console.log('');
      const withForms = allProspects.filter(p => p.metadata?.form_scan?.has_form).length;
      console.log(`✅ Form scanning complete: ${withForms}/${allProspects.length} have contact forms\n`);
      await logIntegration('form_scanner', 'info', 'Scanning complete', {
        total: allProspects.length,
        with_forms: withForms
      });
    }

    // ============================================
    // Save to Database
    // ============================================
    console.log('💾 Saving prospects to database...');
    try {
      await saveProspectsToDatabase(allProspects);
      console.log('✅ Prospects saved to database\n');
      await logIntegration('database', 'info', 'Prospects saved', { count: allProspects.length });
    } catch (error) {
      console.error('❌ Failed to save prospects:', error);
      await logIntegration('database', 'error', 'Save failed', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
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

