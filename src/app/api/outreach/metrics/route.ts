import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { withAdminAuth } from "../../../../lib/auth-middleware";

async function metricsHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'today'; // today, week, month

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    }

    // Get outreach metrics
    const { data: emails, error: emailsError } = await supabase
      .from('outreach_emails')
      .select(`
        id,
        status,
        sent_at,
        opened_at,
        replied_at,
        created_at
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (emailsError) {
      console.error('[OutreachMetrics] Error fetching emails:', emailsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch email metrics" },
        { status: 500 }
      );
    }

    // Calculate metrics
    const totalSent = emails?.filter(e => e.status === 'sent' || e.status === 'delivered' || e.status === 'opened' || e.status === 'replied').length || 0;
    const totalOpened = emails?.filter(e => e.opened_at).length || 0;
    const totalReplied = emails?.filter(e => e.replied_at).length || 0;
    const totalPending = emails?.filter(e => e.status === 'pending').length || 0;
    const totalApproved = emails?.filter(e => e.status === 'approved').length || 0;
    const totalRejected = emails?.filter(e => e.status === 'rejected').length || 0;

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const replyRate = totalSent > 0 ? (totalReplied / totalSent) * 100 : 0;

    // Get tracking data for more detailed metrics
    const { data: tracking, error: trackingError } = await supabase
      .from('outreach_tracking')
      .select('action, timestamp')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', now.toISOString());

    if (trackingError) {
      console.error('[OutreachMetrics] Error fetching tracking data:', trackingError);
    }

    // Calculate action counts
    const actionCounts = tracking?.reduce((acc, item) => {
      acc[item.action] = (acc[item.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return NextResponse.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString()
        },
        metrics: {
          totalSent,
          totalOpened,
          totalReplied,
          totalPending,
          totalApproved,
          totalRejected,
          openRate: Math.round(openRate * 100) / 100,
          replyRate: Math.round(replyRate * 100) / 100
        },
        actionCounts,
        dailyLimit: {
          limit: 50,
          used: totalApproved
        }
      }
    });

  } catch (error) {
    console.error('[OutreachMetrics] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(metricsHandler);
