import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { withAdminAuth } from "../../../../lib/auth-middleware";

async function approveHandler(req: NextRequest) {
  try {
    const { emailId, action } = await req.json();

    if (!emailId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing emailId or action" },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Check daily limit for approvals
    if (action === 'approve') {
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
        console.error('[OutreachApprove] Error counting today approvals:', countError);
        return NextResponse.json(
          { success: false, error: "Failed to check daily limit" },
          { status: 500 }
        );
      }

      const approvedToday = todayApprovals?.length || 0;
      const dailyLimit = 50; // Phase 1 limit

      if (approvedToday >= dailyLimit) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Daily approval limit reached (${dailyLimit}). Please try again tomorrow.`,
            dailyLimit,
            approvedToday
          },
          { status: 429 }
        );
      }
    }

    // Update email status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    const { data: updatedEmail, error: updateError } = await supabase
      .from('outreach_emails')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', emailId)
      .select()
      .single();

    if (updateError) {
      console.error('[OutreachApprove] Error updating email status:', updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update email status" },
        { status: 500 }
      );
    }

    if (!updatedEmail) {
      return NextResponse.json(
        { success: false, error: "Email not found" },
        { status: 404 }
      );
    }

    // Log the action to outreach_tracking
    const { error: trackingError } = await supabase
      .from('outreach_tracking')
      .insert({
        email_id: emailId,
        prospect_id: updatedEmail.prospect_id,
        campaign_id: updatedEmail.campaign_id,
        action: action,
        metadata: {
          performed_by: 'admin',
          timestamp: new Date().toISOString()
        }
      });

    if (trackingError) {
      console.error('[OutreachApprove] Error logging tracking:', trackingError);
      // Don't fail the request, just log the error
    }

    // Get updated count for response
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: todayApprovals } = await supabase
      .from('outreach_emails')
      .select('id')
      .eq('status', 'approved')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    const approvedToday = todayApprovals?.length || 0;

    return NextResponse.json({
      success: true,
      message: `Email ${action}d successfully`,
      data: {
        emailId,
        status: newStatus,
        dailyLimit: 50,
        approvedToday
      }
    });

  } catch (error) {
    console.error('[OutreachApprove] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(approveHandler);
