import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { withAdminAuth } from "../../../../lib/auth-middleware";

// Timeout wrapper for database operations
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

async function pendingHandler(req: NextRequest) {
  console.log('[OutreachPending] ============================================');
  console.log('[OutreachPending] 🚀 Route handler started');
  console.log('[OutreachPending] ============================================');
  
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    console.log('[OutreachPending] Request params:', { limit, offset });
    console.log('[OutreachPending] Supabase client configured:', !!supabase);
    console.log('[OutreachPending] Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    // Test basic database connectivity first
    console.log('[OutreachPending] Testing database connectivity...');
    try {
      const { error: connectivityError } = await supabase.from('outreach_emails').select('id').limit(1);
      if (connectivityError) {
        console.error('[OutreachPending] ❌ Database connectivity test failed:', connectivityError);
        return NextResponse.json(
          { 
            success: false, 
            error: "Database connection failed",
            details: connectivityError.message
          },
          { status: 503 }
        );
      }
      console.log('[OutreachPending] ✅ Database connectivity test passed');
    } catch (connectivityError) {
      console.error('[OutreachPending] ❌ Database connectivity test failed:', connectivityError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Database connection failed",
          details: connectivityError instanceof Error ? connectivityError.message : 'Unknown error'
        },
        { status: 503 }
      );
    }

    // Fetch pending outreach emails with related data
    console.log('[OutreachPending] Fetching pending emails...');
    const queryStart = Date.now();
    
    try {
      const { data: pendingEmails, error } = await supabase
        .from('outreach_emails')
        .select(`
          id,
          prospect_email,
          prospect_name,
          company_name,
          subject,
          content,
          status,
          follow_up_sequence,
          created_at,
          updated_at,
          prospect_id,
          campaign_id
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);
      
      const queryDuration = Date.now() - queryStart;
      console.log('[OutreachPending] Query completed in', queryDuration, 'ms');

      if (error) {
        console.error('[OutreachPending] ❌ Database query error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return NextResponse.json(
          { 
            success: false, 
            error: "Failed to fetch pending emails",
            details: error.message,
            code: error.code
          },
          { status: 500 }
        );
      }

      console.log('[OutreachPending] ✅ Query successful, found', pendingEmails?.length || 0, 'pending emails');

      // Get today's approval count (with timeout)
      console.log('[OutreachPending] Fetching today\'s approval count...');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let approvedToday = 0;
      try {
        const { data: todayApprovals, error: countError } = await supabase
          .from('outreach_emails')
          .select('id')
          .eq('status', 'approved')
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString());

        if (countError) {
          console.error('[OutreachPending] ⚠️ Error counting today approvals (non-fatal):', countError);
        } else {
          approvedToday = todayApprovals?.length || 0;
          console.log('[OutreachPending] ✅ Today\'s approvals:', approvedToday);
        }
      } catch (countTimeoutError) {
        console.error('[OutreachPending] ⚠️ Timeout counting approvals (non-fatal):', countTimeoutError);
        // Continue with approvedToday = 0
      }

      const dailyLimit = 50; // Phase 1 limit

      const response = {
        success: true,
        data: {
          emails: pendingEmails || [],
          pagination: {
            limit,
            offset,
            total: pendingEmails?.length || 0
          },
          dailyLimits: {
            limit: dailyLimit,
            approvedToday,
            remaining: Math.max(0, dailyLimit - approvedToday)
          }
        }
      };

      console.log('[OutreachPending] ============================================');
      console.log('[OutreachPending] ✅ Response prepared successfully');
      console.log('[OutreachPending] Emails count:', pendingEmails?.length || 0);
      console.log('[OutreachPending] Daily limits:', response.data.dailyLimits);
      console.log('[OutreachPending] ============================================');

      return NextResponse.json(response);

    } catch (queryTimeoutError) {
      console.error('[OutreachPending] ❌ Query timeout:', queryTimeoutError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Database query timed out",
          details: queryTimeoutError instanceof Error ? queryTimeoutError.message : 'Unknown timeout error'
        },
        { status: 504 }
      );
    }

  } catch (error) {
    console.error('[OutreachPending] ============================================');
    console.error('[OutreachPending] ❌ Unexpected error:', error);
    console.error('[OutreachPending] Error type:', typeof error);
    console.error('[OutreachPending] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[OutreachPending] ============================================');
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(pendingHandler);
