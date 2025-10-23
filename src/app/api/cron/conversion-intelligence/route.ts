/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { analyzeConversionPatterns } from "../../../../lib/conversion-intelligence";

/**
 * Cron job endpoint for conversion intelligence analysis
 * Runs silently in the background to build intelligence database
 * 
 * Security: Requires CRON_SECRET for authentication
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[Conversion Intelligence Cron] ============================================');
    console.log('[Conversion Intelligence Cron] Starting conversion intelligence analysis');
    console.log('[Conversion Intelligence Cron] ============================================');
    
    // Verify cron secret for security (skip if not configured for testing)
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (expectedSecret) {
      if (cronSecret !== expectedSecret) {
        console.error('[Conversion Intelligence Cron] ❌ Invalid cron secret');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Unauthorized" 
          }),
          { 
            status: 401, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
    } else {
      console.log('[Conversion Intelligence Cron] ⚠️ CRON_SECRET not configured - running without authentication');
    }
    
    console.log('[Conversion Intelligence Cron] ✅ Authentication verified');
    
    // Check if conversion_patterns table exists, create if not
    await ensureConversionPatternsTable();
    
    // Run the analysis
    console.log('[Conversion Intelligence Cron] Starting pattern analysis...');
    const startTime = Date.now();
    
    const patterns = await analyzeConversionPatterns();
    
    const duration = Date.now() - startTime;
    console.log(`[Conversion Intelligence Cron] Analysis completed in ${duration}ms`);
    console.log(`[Conversion Intelligence Cron] Generated ${patterns.length} patterns`);
    
    // Log pattern summary
    patterns.forEach(pattern => {
      console.log(`[Conversion Intelligence Cron] Pattern: ${pattern.pattern_type} - Rate: ${(pattern.conversion_rate * 100).toFixed(1)}% - Sample: ${pattern.sample_size}`);
    });
    
    console.log('[Conversion Intelligence Cron] ============================================');
    console.log('[Conversion Intelligence Cron] ✅ Conversion intelligence analysis completed');
    console.log('[Conversion Intelligence Cron] ============================================');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        patterns_generated: patterns.length,
        duration_ms: duration,
        patterns: patterns.map(p => ({
          type: p.pattern_type,
          rate: p.conversion_rate,
          sample_size: p.sample_size
        }))
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('[Conversion Intelligence Cron] ❌ Analysis failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

/**
 * Ensure the conversion_patterns table exists
 */
async function ensureConversionPatternsTable(): Promise<void> {
  try {
    console.log('[Conversion Intelligence Cron] Checking conversion_patterns table...');
    
    // Try to query the table to see if it exists
    const { supabase } = await import('../../../../lib/supabase');
    const { error } = await supabase
      .from('conversion_patterns')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // Table doesn't exist, create it
      console.log('[Conversion Intelligence Cron] Creating conversion_patterns table...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.conversion_patterns (
          id SERIAL PRIMARY KEY,
          pattern_type TEXT NOT NULL,
          pattern_data JSONB NOT NULL,
          conversion_rate NUMERIC(5,4) NOT NULL,
          sample_size INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS conversion_patterns_type_idx ON public.conversion_patterns(pattern_type);
        CREATE INDEX IF NOT EXISTS conversion_patterns_created_at_idx ON public.conversion_patterns(created_at);
        CREATE INDEX IF NOT EXISTS conversion_patterns_rate_idx ON public.conversion_patterns(conversion_rate);
      `;
      
      const sqlEndpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      const sqlResponse = await fetch(sqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ 
          query: createTableSQL 
        }),
      });
      
      if (!sqlResponse.ok) {
        const errorText = await sqlResponse.text();
        throw new Error(`Failed to create conversion_patterns table: ${errorText}`);
      }
      
      console.log('[Conversion Intelligence Cron] ✅ conversion_patterns table created');
    } else if (error) {
      throw error;
    } else {
      console.log('[Conversion Intelligence Cron] ✅ conversion_patterns table exists');
    }
  } catch (error) {
    console.error('[Conversion Intelligence Cron] ❌ Failed to ensure table:', error);
    throw error;
  }
}

// Handle GET requests (for testing)
export async function GET(req: NextRequest) {
  return new Response(
    JSON.stringify({ 
      message: "Conversion Intelligence Cron Endpoint",
      method: "POST",
      description: "Run conversion pattern analysis",
      security: "Requires x-cron-secret header"
    }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}
