// ============================================
// Prospect Intelligence Scan API
// Trigger prospect discovery pipeline
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { runProspectPipeline } from '../../../../../prospect-intelligence/prospect_pipeline';

import { handleApiError } from '../../../../lib/error-handler';
export async function POST(req: NextRequest) {
  console.log('[ProspectAPI] ============================================');
  console.log('[ProspectAPI] Scan request received');

  try {
    const body = await req.json();
    const {
      industries = ['Construction', 'Real Estate', 'Marketing'],
      regions = ['CA'],
      minScore = 70,
      maxResults = 10,
      testMode = true
    } = body;

    console.log('[ProspectAPI] Configuration:');
    console.log('[ProspectAPI]   Industries:', industries);
    console.log('[ProspectAPI]   Regions:', regions);
    console.log('[ProspectAPI]   Min Score:', minScore);
    console.log('[ProspectAPI]   Max Results:', maxResults);
    console.log('[ProspectAPI]   Test Mode:', testMode);

    // Run pipeline
    const result = await runProspectPipeline({
      industries,
      regions,
      minAutomationScore: minScore,
      maxProspectsPerRun: maxResults,
      testMode
    });

    console.log('[ProspectAPI] ✅ Scan complete');
    console.log('[ProspectAPI]   Crawled:', result.totalCrawled);
    console.log('[ProspectAPI]   Tested:', result.totalTested);
    console.log('[ProspectAPI]   Contacted:', result.totalContacted);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    return handleApiError(error, 'API');
  }
}

export async function GET(req: NextRequest) {
  // Return scan status or last run information
  return NextResponse.json({
    success: true,
    message: 'Prospect Intelligence API - Use POST to trigger scan'
  });
}

