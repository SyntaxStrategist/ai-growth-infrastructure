// ============================================
// Prospect Intelligence Configuration API
// Returns server-side configuration status
// ============================================

import { NextRequest, NextResponse } from 'next/server';

/**
 * Get prospect intelligence configuration status
 * Returns which data sources are available without exposing API keys
 */
export async function GET(req: NextRequest) {
  try {
    // Check server-side environment variables
    const hasPdlKey = !!process.env.PEOPLE_DATA_LABS_API_KEY;
    const hasApolloKey = !!process.env.APOLLO_API_KEY;
    const hasGoogleSearchKey = !!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    
    // Rate limit configurations
    const pdlRateLimit = parseInt(process.env.PDL_RATE_LIMIT_MS || '1000', 10);
    const autoSubmitEnabled = process.env.AUTO_SUBMIT_FORMS === 'true';

    console.info('[ProspectConfig] Configuration status requested');
    console.info('[ProspectConfig] PDL:', hasPdlKey ? 'Configured' : 'Not configured');
    console.info('[ProspectConfig] Apollo:', hasApolloKey ? 'Configured' : 'Not configured');
    console.info('[ProspectConfig] Google Search:', hasGoogleSearchKey ? 'Configured' : 'Not configured');

    return NextResponse.json({
      success: true,
      data: {
        // Boolean flags (safe to expose - don't reveal actual keys)
        hasPdl: hasPdlKey,
        hasApollo: hasApolloKey,
        hasGoogleSearch: hasGoogleSearchKey,
        
        // Configuration
        pdlRateLimit,
        autoSubmitEnabled,
        
        // Defaults
        defaultUsePdl: hasPdlKey, // Auto-enable PDL toggle if key is present
        defaultScanForms: true,
        
        // Feature availability
        features: {
          pdl: hasPdlKey,
          apollo: hasApolloKey,
          formScanning: true, // Always available
          autoSubmit: autoSubmitEnabled
        }
      }
    });

  } catch (error) {
    console.error('[ProspectConfig] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch configuration'
      },
      { status: 500 }
    );
  }
}

