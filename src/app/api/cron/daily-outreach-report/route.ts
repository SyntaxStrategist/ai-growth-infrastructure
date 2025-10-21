import { NextRequest, NextResponse } from "next/server";
import { withCronAuth } from "../../../../lib/auth-middleware";

async function cronHandler(req: NextRequest) {
  try {

    console.log('[CronJob] Starting daily outreach report generation...');

    // Call the daily report generation API
    const reportResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/reports/daily-outreach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: new Date().toISOString() // Today's date
      })
    });

    const reportData = await reportResponse.json();

    if (!reportData.success) {
      console.error('[CronJob] Failed to generate daily report:', reportData.error);
      return NextResponse.json(
        { success: false, error: "Failed to generate report" },
        { status: 500 }
      );
    }

    console.log('[CronJob] Daily outreach report generated successfully:', reportData.data.filename);

    return NextResponse.json({
      success: true,
      message: "Daily outreach report generated successfully",
      data: reportData.data
    });

  } catch (error) {
    console.error('[CronJob] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Allow POST requests as well for manual triggering
export const GET = withCronAuth(cronHandler);
export const POST = withCronAuth(cronHandler);
