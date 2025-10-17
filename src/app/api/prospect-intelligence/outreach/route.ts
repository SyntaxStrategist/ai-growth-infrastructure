// ============================================
// Prospect Intelligence Outreach API
// Send personalized outreach emails to prospects
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateOutreachEmail } from '../../../../../prospect-intelligence/outreach/generate_outreach_email';
import { saveOutreachLog } from '../../../../../prospect-intelligence/database/supabase_connector';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

/**
 * Send outreach email to a prospect
 */
export async function POST(req: NextRequest) {
  console.log('[OutreachAPI] ============================================');
  console.log('[OutreachAPI] Outreach request received');

  try {
    const body = await req.json();
    const { prospectId, testMode = true } = body;

    if (!prospectId) {
      return NextResponse.json(
        { success: false, error: 'prospectId is required' },
        { status: 400 }
      );
    }

    console.log('[OutreachAPI] Prospect ID:', prospectId);
    console.log('[OutreachAPI] Test Mode:', testMode);

    // Fetch prospect from database
    const { data: prospect, error: prospectError } = await supabase
      .from('prospect_candidates')
      .select('*')
      .eq('id', prospectId)
      .single();

    if (prospectError || !prospect) {
      console.error('[OutreachAPI] ❌ Prospect not found:', prospectError);
      return NextResponse.json(
        { success: false, error: 'Prospect not found' },
        { status: 404 }
      );
    }

    console.log('[OutreachAPI] Prospect:', prospect.business_name);

    // Create mock form test result for email generation
    const mockFormTest = {
      prospect_id: prospectId,
      test_submitted_at: new Date().toISOString(),
      response_received_at: null,
      response_time_minutes: prospect.metadata?.response_time_minutes || 120,
      has_autoresponder: prospect.metadata?.has_autoresponder || false,
      autoresponder_tone: 'none' as const,
      autoresponder_content: null,
      score: prospect.response_score || 0,
      test_status: 'completed' as const
    };

    // Generate personalized outreach email
    console.log('[OutreachAPI] Generating outreach email...');
    const outreachTemplate = generateOutreachEmail(
      prospect,
      mockFormTest,
      prospect.automation_need_score || 70
    );

    console.log('[OutreachAPI] Email generated');
    console.log('[OutreachAPI] Subject:', outreachTemplate.subject);
    console.log('[OutreachAPI] Language:', outreachTemplate.language);

    if (testMode) {
      console.log('[OutreachAPI] 🧪 TEST MODE: Not sending actual email');
      console.log('[OutreachAPI] Preview:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('To:', prospect.contact_email);
      console.log('Subject:', outreachTemplate.subject);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(outreachTemplate.body);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Save to outreach log (but mark as test)
      const outreachId = await saveOutreachLog({
        prospect_id: prospectId,
        subject: outreachTemplate.subject,
        email_body: outreachTemplate.body,
        status: 'sent',
        metadata: {
          test_mode: true,
          to: prospect.contact_email,
          language: outreachTemplate.language,
          automation_score: prospect.automation_need_score
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          outreachId,
          prospectId,
          businessName: prospect.business_name,
          email: prospect.contact_email,
          subject: outreachTemplate.subject,
          preview: outreachTemplate.body.substring(0, 200) + '...',
          status: 'test_mode_logged',
          message: 'Outreach email logged (test mode - not actually sent)'
        }
      });
    }

    // Production mode: Actually send the email (placeholder - would integrate with email service)
    console.log('[OutreachAPI] 📧 PRODUCTION MODE: Sending email...');
    
    // TODO: Integrate with actual email service (SendGrid, Mailgun, etc.)
    // For now, just log and save
    
    const outreachId = await saveOutreachLog({
      prospect_id: prospectId,
      subject: outreachTemplate.subject,
      email_body: outreachTemplate.body,
      status: 'sent',
      metadata: {
        test_mode: false,
        to: prospect.contact_email,
        language: outreachTemplate.language,
        automation_score: prospect.automation_need_score
      }
    });

    console.log('[OutreachAPI] ✅ Outreach sent and logged');

    return NextResponse.json({
      success: true,
      data: {
        outreachId,
        prospectId,
        businessName: prospect.business_name,
        email: prospect.contact_email,
        subject: outreachTemplate.subject,
        status: 'sent',
        message: 'Outreach email sent successfully'
      }
    });

  } catch (error) {
    console.error('[OutreachAPI] ❌ Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send outreach'
      },
      { status: 500 }
    );
  }
}

/**
 * Get outreach history for a prospect
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prospectId = searchParams.get('prospectId');

  if (!prospectId) {
    return NextResponse.json(
      { success: false, error: 'prospectId parameter required' },
      { status: 400 }
    );
  }

  try {
    const { data: logs, error } = await supabase
      .from('prospect_outreach_log')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('sent_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: { logs: logs || [] }
    });
  } catch (error) {
    console.error('[OutreachAPI] Error fetching logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch outreach logs'
      },
      { status: 500 }
    );
  }
}

