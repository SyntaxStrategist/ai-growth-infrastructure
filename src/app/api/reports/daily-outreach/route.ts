import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { createWriteStream } from 'fs';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { saveHTMLReport } from "../../../../lib/pdf-generator";

export async function POST(req: NextRequest) {
  try {
    const { date } = await req.json();
    
    // Use provided date or default to yesterday (for 9 AM EST generation)
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setDate(reportDate.getDate() - 1); // Yesterday's data
    
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`[DailyReport] Generating report for ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    // Fetch outreach data for the day
    const { data: emails, error: emailsError } = await supabase
      .from('outreach_emails')
      .select(`
        id,
        prospect_email,
        prospect_name,
        company_name,
        subject,
        status,
        sent_at,
        opened_at,
        replied_at,
        created_at,
        prospect:prospect_candidates(
          business_name,
          industry,
          language,
          automation_need_score
        )
      `)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (emailsError) {
      console.error('[DailyReport] Error fetching emails:', emailsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch email data" },
        { status: 500 }
      );
    }

    // Fetch tracking data for the day
    const { data: tracking, error: trackingError } = await supabase
      .from('outreach_tracking')
      .select('action, timestamp, metadata')
      .gte('timestamp', startOfDay.toISOString())
      .lte('timestamp', endOfDay.toISOString());

    if (trackingError) {
      console.error('[DailyReport] Error fetching tracking data:', trackingError);
    }

    // Calculate metrics
    const totalEmails = emails?.length || 0;
    const totalSent = emails?.filter(e => e.status === 'sent' || e.status === 'delivered' || e.status === 'opened' || e.status === 'replied').length || 0;
    const totalOpened = emails?.filter(e => e.opened_at).length || 0;
    const totalReplied = emails?.filter(e => e.replied_at).length || 0;
    const totalPending = emails?.filter(e => e.status === 'pending').length || 0;
    const totalApproved = emails?.filter(e => e.status === 'approved').length || 0;
    const totalRejected = emails?.filter(e => e.status === 'rejected').length || 0;

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const replyRate = totalSent > 0 ? (totalReplied / totalSent) * 100 : 0;

    // Calculate action counts
    const actionCounts = tracking?.reduce((acc, item) => {
      acc[item.action] = (acc[item.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Generate report data
    const reportData = {
      date: reportDate.toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      summary: {
        totalEmails,
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
      emails: emails?.map(email => ({
        id: email.id,
        prospectEmail: email.prospect_email,
        prospectName: email.prospect_name,
        companyName: email.company_name,
        subject: email.subject,
        status: email.status,
        sentAt: email.sent_at,
        openedAt: email.opened_at,
        repliedAt: email.replied_at,
        createdAt: email.created_at,
        prospect: Array.isArray(email.prospect) && email.prospect.length > 0 ? email.prospect[0] : undefined
      })) || []
    };

    // Create reports directory if it doesn't exist
    const reportsDir = join(process.cwd(), 'reports');
    try {
      await mkdir(reportsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate filenames
    const jsonFilename = `daily-outreach-summary-${reportDate.toISOString().split('T')[0]}.json`;
    const htmlFilename = `daily-outreach-summary-${reportDate.toISOString().split('T')[0]}.html`;
    const jsonFilepath = join(reportsDir, jsonFilename);

    // Write JSON report to file
    const fs = require('fs');
    fs.writeFileSync(jsonFilepath, JSON.stringify(reportData, null, 2));

    // Generate and save HTML report
    const htmlFilepath = await saveHTMLReport(reportData, htmlFilename);

    console.log(`[DailyReport] Reports generated: ${jsonFilepath} and ${htmlFilepath}`);

    return NextResponse.json({
      success: true,
      message: "Daily report generated successfully",
      data: {
        jsonFilename,
        htmlFilename,
        jsonFilepath,
        htmlFilepath,
        reportData: {
          date: reportData.date,
          summary: reportData.summary,
          actionCounts: reportData.actionCounts,
          emailCount: reportData.emails.length
        }
      }
    });

  } catch (error) {
    console.error('[DailyReport] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve a specific report
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json(
        { success: false, error: "Date parameter required" },
        { status: 400 }
      );
    }

    const filename = `daily-outreach-summary-${date}.json`;
    const filepath = join(process.cwd(), 'reports', filename);

    try {
      const fs = require('fs');
      const reportData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      
      return NextResponse.json({
        success: true,
        data: reportData
      });
    } catch (fileError) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('[DailyReport] Error retrieving report:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
