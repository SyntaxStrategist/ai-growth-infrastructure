// ============================================
// Prospect Intelligence Outreach API
// Send personalized outreach emails to prospects
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOutreachEmail } from '../../../../lib/outreach/gmail_sender';
import { generateBrandedEmailTemplate } from '../../../../lib/email/branded_templates';

import { handleApiError } from '../../../../lib/error-handler';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

/**
 * Send outreach email to a prospect via Gmail
 */
export async function POST(req: NextRequest) {
  console.log('[OutreachAPI] ============================================');
  console.log('[OutreachAPI] Outreach request received');

  try {
    const body = await req.json();
    const { prospect_id, to, subject, htmlBody, textBody } = body;

    // Detect locale from referer header or request URL
    const referer = req.headers.get('referer') || '';
    const isFrench = referer.includes('/fr') || req.url.includes('/fr');
    const locale = isFrench ? 'fr' : 'en';
    
    console.log('[OutreachAPI] 🌍 Detected locale:', locale);
    console.log('[OutreachAPI] 🌍 Referer:', referer);

    // Check for Test Mode
    const testMode = process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'development';

    if (!prospect_id || !to || !subject) {
      console.error('[OutreachAPI] ❌ Missing required fields');
      return NextResponse.json(
        { success: false, error: 'prospect_id, to, and subject are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error('[OutreachAPI] ❌ Invalid email format:', to);
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log('[OutreachAPI] Prospect ID:', prospect_id);
    console.log('[OutreachAPI] Recipient:', to);
    console.log('[OutreachAPI] Subject:', subject);
    console.log('[OutreachAPI] Test Mode:', testMode);

    // Fetch prospect from database for metadata
    const { data: prospect, error: prospectError } = await supabase
      .from('prospect_candidates')
      .select('*')
      .eq('id', prospect_id)
      .single();

    if (prospectError) {
      console.warn('[OutreachAPI] ⚠️ Could not fetch prospect details:', prospectError.message);
    }

    // Generate email template if not provided
    let finalHtmlBody = htmlBody;
    let finalTextBody = textBody;

    if (!htmlBody && prospect) {
      console.log('[OutreachAPI] Generating branded email template for locale:', locale);
      const template = generateBrandedEmailTemplate({
        business_name: prospect.business_name,
        industry: prospect.industry || 'your industry',
        website: prospect.website || ''
      }, locale);
      finalHtmlBody = template.html;
      finalTextBody = template.text;
      console.log('[OutreachAPI] ✅ Template generated in', locale === 'fr' ? 'French' : 'English');
    }

    if (testMode) {
      console.log('[OutreachAPI] 🧪 TEST MODE: Email will NOT be sent');
      console.log('[OutreachAPI] Preview:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(finalTextBody?.substring(0, 200) || '(no preview)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Log to database (mark as test)
      const { data: logEntry, error: logError } = await supabase
        .from('prospect_outreach_logs')
        .insert([{
          prospect_id,
          recipient_email: to,
          subject,
          email_body: finalHtmlBody || finalTextBody || '',
          status: 'test',
          metadata: {
            test_mode: true,
            sent_at: new Date().toISOString()
          }
        }])
        .select()
        .single();

      if (logError) {
        console.error('[OutreachAPI] ⚠️ Failed to log test email:', logError.message);
      }

      console.log('[OutreachAPI] ✅ Test email logged (not sent)');
      console.log('[OutreachAPI] ============================================');

      return NextResponse.json({
        success: true,
        data: {
          messageId: 'test-mode-' + Date.now(),
          status: 'test',
          message: 'Test mode - email logged but not sent'
        }
      });
    }

    // Production mode: Send via Gmail
    console.log('[OutreachAPI] 📧 PRODUCTION MODE: Sending via Gmail...');

    const gmailResult = await sendOutreachEmail({
      to,
      subject,
      htmlBody: finalHtmlBody || '',
      textBody: finalTextBody || '',
      fromName: 'Avenir AI Solutions',
      replyTo: process.env.GMAIL_FROM_ADDRESS || 'contact@aveniraisolutions.ca'
    });

    if (!gmailResult.success) {
      console.error('[OutreachAPI] ❌ Gmail sending failed:', gmailResult.error);
      
      // Log failure to database
      await supabase
        .from('prospect_outreach_logs')
        .insert([{
          prospect_id,
          recipient_email: to,
          subject,
          email_body: finalHtmlBody || finalTextBody || '',
          status: 'failed',
          metadata: {
            error: gmailResult.error,
            sent_at: new Date().toISOString()
          }
        }]);

      return NextResponse.json(
        { success: false, error: gmailResult.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log('[OutreachAPI] ✅ Email sent via Gmail');
    console.log('[OutreachAPI] Message ID:', gmailResult.messageId);

    // Log success to database
    const { data: logEntry, error: logError } = await supabase
      .from('prospect_outreach_logs')
      .insert([{
        prospect_id,
        recipient_email: to,
        subject,
        email_body: finalHtmlBody || finalTextBody || '',
        status: 'sent',
        metadata: {
          message_id: gmailResult.messageId,
          sent_at: new Date().toISOString()
        }
      }])
      .select()
      .single();

    if (logError) {
      console.warn('[OutreachAPI] ⚠️ Email sent but logging failed:', logError.message);
    }

    console.log('[OutreachAPI] ✅ Outreach complete and logged');
    console.log('[OutreachAPI] ============================================');

    return NextResponse.json({
      success: true,
      data: {
        messageId: gmailResult.messageId,
        status: 'sent',
        message: 'Email sent successfully via Gmail',
        logId: logEntry?.id
      }
    });

  } catch (error) {
    return handleApiError(error, 'API');
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
      .from('prospect_outreach_logs')
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
    return handleApiError(error, 'API');
  }
}

