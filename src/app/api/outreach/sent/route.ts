import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { withAdminAuth } from "../../../../lib/auth-middleware";

async function sentHandler(req: NextRequest) {
  console.log('[OutreachSent] ============================================');
  console.log('[OutreachSent] 🚀 Route handler started');
  console.log('[OutreachSent] ============================================');

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || 'sent,approved'; // Default to both sent and approved

    console.log('[OutreachSent] Request params:', { limit, offset, status });
    console.log('[OutreachSent] Supabase client configured:', !!supabase);
    console.log('[OutreachSent] Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });

    // Test basic database connectivity first
    console.log('[OutreachSent] Testing database connectivity...');
    try {
      const { error: connectivityError } = await supabase.from('outreach_emails').select('id').limit(1);
      if (connectivityError) {
        console.error('[OutreachSent] ❌ Database connectivity test failed:', connectivityError);
        return NextResponse.json(
          { 
            success: false, 
            error: "Database connection failed",
            details: connectivityError.message
          },
          { status: 503 }
        );
      }
      console.log('[OutreachSent] ✅ Database connectivity test passed');
    } catch (connectivityError) {
      console.error('[OutreachSent] ❌ Database connectivity test failed:', connectivityError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Database connection failed",
          details: connectivityError instanceof Error ? connectivityError.message : 'Unknown error'
        },
        { status: 503 }
      );
    }

    // Parse status filter
    const statusArray = status.split(',').map(s => s.trim());
    console.log('[OutreachSent] Status filter:', statusArray);

    // Fetch sent/approved outreach emails with related data
    console.log('[OutreachSent] Fetching sent/approved emails...');
    const queryStart = Date.now();
    
    try {
      let query = supabase
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
          sent_at,
          opened_at,
          replied_at,
          prospect_id,
          campaign_id,
          gmail_message_id,
          thread_id
        `)
        .in('status', statusArray)
        .order('sent_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: sentEmails, error } = await query;
      
      const queryDuration = Date.now() - queryStart;
      console.log('[OutreachSent] Query completed in', queryDuration, 'ms');

      if (error) {
        console.error('[OutreachSent] ❌ Error fetching sent emails:', error);
        return NextResponse.json({ success: false, error: error.message, details: error.details }, { status: 500 });
      }

      console.log(`[OutreachSent] ✅ Query successful, found ${sentEmails?.length || 0} sent/approved emails`);

      // Get total count for pagination
      console.log('[OutreachSent] Fetching total count...');
      let totalCount = 0;
      try {
        const { count, error: countError } = await supabase
          .from('outreach_emails')
          .select('*', { count: 'exact', head: true })
          .in('status', statusArray);

        if (countError) {
          console.error('[OutreachSent] ⚠️ Error counting sent emails (non-fatal):', countError);
        } else {
          totalCount = count || 0;
        }
      } catch (countErr: any) {
        console.error('[OutreachSent] ❌ Uncaught error counting sent emails:', countErr);
      }
      console.log(`[OutreachSent] ✅ Total count: ${totalCount}`);

      const responseData = {
        success: true,
        emails: sentEmails || [],
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: (offset + limit) < totalCount
        },
        filters: {
          status: statusArray
        }
      };

      console.log('[OutreachSent] ============================================');
      console.log('[OutreachSent] ✅ Response prepared successfully');
      console.log('[OutreachSent] Emails count:', responseData.emails.length);
      console.log('[OutreachSent] Pagination:', responseData.pagination);
      console.log('[OutreachSent] ============================================');

      return NextResponse.json(responseData, { status: 200 });
    } catch (queryErr: any) {
      console.error('[OutreachSent] ❌ Error during main query:', queryErr);
      return NextResponse.json({ success: false, error: queryErr.message, details: queryErr.stack }, { status: 500 });
    }
  } catch (err: any) {
    console.error('[OutreachSent] ❌ Uncaught error in handler:', err);
    return NextResponse.json({ success: false, error: err.message, details: err.stack }, { status: 500 });
  }
}

export const GET = withAdminAuth(sentHandler);
