// ============================================
// Prospect Intelligence Configuration API
// Returns server-side configuration status
// ============================================

import { NextRequest, NextResponse } from 'next/server';

/**
 * Get prospect intelligence configuration status
 * Returns which data sources are available without exposing API keys
 */
export async function GET(_req: NextRequest) {
  try {
    console.log('[ProspectConfig] ============================================');
    console.log('[ProspectConfig] 🔍 Configuration status requested');
    
    // Debug: Check PDL key with detailed logging
    console.log('[ProspectConfig] 🔍 Checking PDL key...');
    console.log('[ProspectConfig] process.env.PEOPLE_DATA_LABS_API_KEY exists:', !!process.env.PEOPLE_DATA_LABS_API_KEY);
    console.log('[ProspectConfig] PDL key type:', typeof process.env.PEOPLE_DATA_LABS_API_KEY);
    console.log('[ProspectConfig] PDL key length:', process.env.PEOPLE_DATA_LABS_API_KEY?.length || 0);
    console.log('[ProspectConfig] PDL key preview:', process.env.PEOPLE_DATA_LABS_API_KEY ? process.env.PEOPLE_DATA_LABS_API_KEY.substring(0, 10) + '...' : 'NOT SET');
    
    // Check server-side environment variables
    const hasPdl = !!process.env.PEOPLE_DATA_LABS_API_KEY;
    const hasApollo = !!process.env.APOLLO_API_KEY;
    const hasGoogleSearch = !!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    
    console.log('[ProspectConfig] ✅ hasPdl (boolean):', hasPdl);
    console.log('[ProspectConfig] ✅ hasApollo (boolean):', hasApollo);
    console.log('[ProspectConfig] ✅ hasGoogleSearch (boolean):', hasGoogleSearch);
    
    // Get all PDL-related keys
    const pdlKeys = Object.keys(process.env).filter(k => k.includes('PDL'));
    const integrationKeys = Object.keys(process.env).filter(k => 
      k.includes('APOLLO') || 
      k.includes('PDL') || 
      k.includes('PEOPLE_DATA')
    );
    
    console.log('[ProspectConfig] PDL-related keys found:', pdlKeys);
    console.log('[ProspectConfig] All integration keys:', integrationKeys);
    
    // Rate limit configurations
    const pdlRateLimit = parseInt(process.env.PDL_RATE_LIMIT_MS || '1000', 10);
    const autoSubmitEnabled = process.env.AUTO_SUBMIT_FORMS === 'true';

    const responseData = {
      success: true,
      data: {
        // Boolean flags (safe to expose - don't reveal actual keys)
        hasPdl,
        hasApollo,
        hasGoogleSearch,
        
        // Configuration
        pdlRateLimit,
        autoSubmitEnabled,
        
        // Defaults
        defaultUsePdl: hasPdl, // Auto-enable PDL toggle if key is present
        defaultScanForms: true,
        
        // Feature availability
        features: {
          pdl: hasPdl,
          apollo: hasApollo,
          formScanning: true, // Always available
          autoSubmit: autoSubmitEnabled
        }
      }
    };
    
    console.log('[ProspectConfig] 📤 Returning config:', JSON.stringify(responseData, null, 2));
    console.log('[ProspectConfig] ============================================');
    
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[ProspectConfig] ❌ Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch configuration'
      },
      { status: 500 }
    );
  }
}
