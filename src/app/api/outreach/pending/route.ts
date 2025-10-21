import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { withAdminAuth } from "../../../../lib/auth-middleware";

async function pendingHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch pending outreach emails with related data
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
        metadata,
        prospect:prospect_candidates(
          id,
          business_name,
          industry,
          language,
          automation_need_score
        ),
        campaign:outreach_campaigns(
          id,
          name,
          client_id
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[OutreachPending] Error fetching pending emails:', error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch pending emails" },
        { status: 500 }
      );
    }

    // Get today's approval count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: todayApprovals, error: countError } = await supabase
      .from('outreach_emails')
      .select('id')
      .eq('status', 'approved')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (countError) {
      console.error('[OutreachPending] Error counting today approvals:', countError);
    }

    const approvedToday = todayApprovals?.length || 0;
    const dailyLimit = 50; // Phase 1 limit

    return NextResponse.json({
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
    });

  } catch (error) {
    console.error('[OutreachPending] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(pendingHandler);
