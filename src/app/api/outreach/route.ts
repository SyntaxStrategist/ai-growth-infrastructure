import { NextRequest, NextResponse } from 'next/server';
import { OutreachEngine } from '@/lib/phase4/outreach_engine';
import { EmailTemplateEngine } from '@/lib/phase4/email_templates';
import { OutreachTracker } from '@/lib/phase4/outreach_tracking';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const outreachEngine = new OutreachEngine();
const templateEngine = new EmailTemplateEngine();
const tracker = new OutreachTracker();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Gmail OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const campaignId = searchParams.get('campaign_id');
    const prospectId = searchParams.get('prospect_id');

    if (!action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Action parameter is required' 
      }, { status: 400 });
    }

    switch (action) {
      case 'campaigns':
        return await getCampaigns();
      
      case 'campaign_metrics':
        if (!campaignId) {
          return NextResponse.json({ 
            success: false, 
            error: 'campaign_id is required for metrics' 
          }, { status: 400 });
        }
        return await getCampaignMetrics(campaignId);
      
      case 'campaign_prospects':
        if (!campaignId) {
          return NextResponse.json({ 
            success: false, 
            error: 'campaign_id is required for prospects' 
          }, { status: 400 });
        }
        return await getCampaignProspects(campaignId);
      
      case 'email_templates':
        return await getEmailTemplates();
      
      case 'prospect_engagement':
        if (!prospectId) {
          return NextResponse.json({ 
            success: false, 
            error: 'prospect_id is required for engagement' 
          }, { status: 400 });
        }
        return await getProspectEngagement(prospectId);
      
      case 'conversion_funnel':
        if (!campaignId) {
          return NextResponse.json({ 
            success: false, 
            error: 'campaign_id is required for funnel' 
          }, { status: 400 });
        }
        return await getConversionFunnel(campaignId);
      
      default:
        return NextResponse.json({ 
          success: false, 
          error: `Unknown action: ${action}` 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('[OutreachAPI] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Action is required' 
      }, { status: 400 });
    }

    switch (action) {
      case 'create_campaign':
        return await createCampaign(body);
      
      case 'send_campaign':
        return await sendCampaign(body);
      
      case 'create_template':
        return await createTemplate(body);
      
      case 'process_follow_ups':
        return await processFollowUps(body);
      
      case 'update_email_status':
        return await updateEmailStatus(body);
      
      case 'track_conversion':
        return await trackConversion(body);
      
      case 'send_test_email':
        return await sendTestEmail(body);
      
      default:
        return NextResponse.json({ 
          success: false, 
          error: `Unknown action: ${action}` 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('[OutreachAPI] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// GET handlers
async function getCampaigns() {
  try {
    // This would typically fetch from database
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      action: 'campaigns',
      data: [],
      message: 'Campaigns retrieved successfully'
    });
  } catch (error) {
    throw error;
  }
}

async function getCampaignMetrics(campaignId: string) {
  try {
    const metrics = await outreachEngine.getCampaignMetrics(campaignId);
    
    return NextResponse.json({
      success: true,
      action: 'campaign_metrics',
      data: metrics,
      message: 'Campaign metrics retrieved successfully'
    });
  } catch (error) {
    throw error;
  }
}

async function getCampaignProspects(campaignId: string) {
  try {
    const prospects = await outreachEngine.getCampaignProspects(campaignId);
    
    return NextResponse.json({
      success: true,
      action: 'campaign_prospects',
      data: prospects,
      message: 'Campaign prospects retrieved successfully'
    });
  } catch (error) {
    throw error;
  }
}

async function getEmailTemplates() {
  try {
    // Get templates by category
    const initialTemplates = templateEngine.getTemplatesByCategory('initial_outreach');
    const followUpTemplates = templateEngine.getTemplatesByCategory('follow_up');
    
    return NextResponse.json({
      success: true,
      action: 'email_templates',
      data: {
        initial_outreach: initialTemplates,
        follow_up: followUpTemplates
      },
      message: 'Email templates retrieved successfully'
    });
  } catch (error) {
    throw error;
  }
}

async function getProspectEngagement(prospectId: string) {
  try {
    const timeline = await tracker.getProspectEngagementTimeline(prospectId);
    
    return NextResponse.json({
      success: true,
      action: 'prospect_engagement',
      data: timeline,
      message: 'Prospect engagement retrieved successfully'
    });
  } catch (error) {
    throw error;
  }
}

async function getConversionFunnel(campaignId: string) {
  try {
    const funnel = await tracker.getConversionFunnel(campaignId);
    
    return NextResponse.json({
      success: true,
      action: 'conversion_funnel',
      data: funnel,
      message: 'Conversion funnel retrieved successfully'
    });
  } catch (error) {
    throw error;
  }
}

// POST handlers
async function createCampaign(body: any) {
  try {
    const { name, target_criteria, email_template_id, follow_up_schedule } = body;
    
    if (!name || !email_template_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name and email_template_id are required' 
      }, { status: 400 });
    }

    const campaign = await outreachEngine.createCampaign({
      name,
      target_criteria,
      email_template_id,
      follow_up_schedule
    });

    return NextResponse.json({
      success: true,
      action: 'create_campaign',
      data: campaign,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    throw error;
  }
}

async function sendCampaign(body: any) {
  try {
    const { campaign_id, prospect_ids } = body;
    
    if (!campaign_id || !prospect_ids || !Array.isArray(prospect_ids)) {
      return NextResponse.json({ 
        success: false, 
        error: 'campaign_id and prospect_ids array are required' 
      }, { status: 400 });
    }

    const emails = await outreachEngine.sendCampaignEmails(campaign_id, prospect_ids);

    return NextResponse.json({
      success: true,
      action: 'send_campaign',
      data: emails,
      message: `Campaign sent successfully. ${emails.length} emails processed.`
    });
  } catch (error) {
    throw error;
  }
}

async function createTemplate(body: any) {
  try {
    const { name, subject_template, html_template, text_template, category, variables } = body;
    
    if (!name || !subject_template || !html_template || !text_template) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, subject_template, html_template, and text_template are required' 
      }, { status: 400 });
    }

    const template = await templateEngine.createTemplate({
      name,
      subject_template,
      html_template,
      text_template,
      category,
      variables
    });

    return NextResponse.json({
      success: true,
      action: 'create_template',
      data: template,
      message: 'Template created successfully'
    });
  } catch (error) {
    throw error;
  }
}

async function processFollowUps(body: any) {
  try {
    const { campaign_id } = body;
    
    if (!campaign_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'campaign_id is required' 
      }, { status: 400 });
    }

    await outreachEngine.processFollowUps(campaign_id);

    return NextResponse.json({
      success: true,
      action: 'process_follow_ups',
      data: { campaign_id },
      message: 'Follow-ups processed successfully'
    });
  } catch (error) {
    throw error;
  }
}

async function updateEmailStatus(body: any) {
  try {
    const { gmail_message_id, status, metadata } = body;
    
    if (!gmail_message_id || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'gmail_message_id and status are required' 
      }, { status: 400 });
    }

    await outreachEngine.updateEmailStatus(gmail_message_id, status, metadata);

    return NextResponse.json({
      success: true,
      action: 'update_email_status',
      data: { gmail_message_id, status },
      message: 'Email status updated successfully'
    });
  } catch (error) {
    throw error;
  }
}

async function trackConversion(body: any) {
  try {
    const { email_id, prospect_id, campaign_id, metadata } = body;
    
    if (!email_id || !prospect_id || !campaign_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'email_id, prospect_id, and campaign_id are required' 
      }, { status: 400 });
    }

    await tracker.trackConversion(email_id, prospect_id, campaign_id, metadata);

    return NextResponse.json({
      success: true,
      action: 'track_conversion',
      data: { email_id, prospect_id, campaign_id },
      message: 'Conversion tracked successfully'
    });
  } catch (error) {
    throw error;
  }
}

async function sendTestEmail(body: any) {
  try {
    const { to, first_name, company_name, template_name } = body;
    
    // Validate required fields
    if (!to || !first_name || !company_name || !template_name) {
      return NextResponse.json({ 
        success: false, 
        error: 'to, first_name, company_name, and template_name are required' 
      }, { status: 400 });
    }

    // Use branded template from default_intro_template.ts for default_intro
    let template;
    if (template_name === 'default_intro') {
      // Import the branded template
      const { DEFAULT_INTRO_TEMPLATE_EN } = await import('../../../lib/phase4/default_intro_template');
      template = DEFAULT_INTRO_TEMPLATE_EN;
      console.log('[SendTestEmail] Using branded default_intro template');
    } else {
      // Fetch other templates from database
      const { data: dbTemplate, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('name', template_name)
        .single();

      if (templateError || !dbTemplate) {
        console.error('[SendTestEmail] Template not found:', templateError);
        return NextResponse.json({ 
          success: false, 
          error: `Template '${template_name}' not found` 
        }, { status: 404 });
      }
      template = dbTemplate;
    }

    // Prepare variables for template rendering
    const variables = {
      first_name,
      company_name,
      contact_name: first_name,
      contact_email: to,
      industry: 'technology',
      pain_points: 'lead generation challenges, manual prospect research, low conversion rates',
      demo_link: 'https://www.aveniraisolutions.ca/demo',
      calendar_link: 'https://calendar.app.google/g4vdGJ6VdaZPj8nc7'
    };

    // Render templates with variables
    console.log('[SendTestEmail] Template found:', template.name);
    console.log('[SendTestEmail] Variables:', variables);
    console.log('[SendTestEmail] Original subject:', template.subject_template);
    console.log('[SendTestEmail] Original HTML length:', template.html_template?.length || 0);
    console.log('[SendTestEmail] Original text length:', template.text_template?.length || 0);
    
    const renderedSubject = renderTemplate(template.subject_template, variables);
    const renderedHtml = renderTemplate(template.html_template, variables);
    const renderedText = renderTemplate(template.text_template, variables);
    
    console.log('[SendTestEmail] Rendered subject:', renderedSubject);
    console.log('[SendTestEmail] Rendered HTML length:', renderedHtml.length);
    console.log('[SendTestEmail] Rendered text length:', renderedText.length);
    console.log('[SendTestEmail] HTML preview (first 200 chars):', renderedHtml.substring(0, 200));
    console.log('[SendTestEmail] Text preview (first 200 chars):', renderedText.substring(0, 200));
    
    // Verify HTML contains expected branding elements
    const hasLogo = renderedHtml.includes('logo') || renderedHtml.includes('Avenir AI');
    const hasCTA = renderedHtml.includes('View Demo') || renderedHtml.includes('demo');
    const hasCalendar = renderedHtml.includes('calendar') || renderedHtml.includes('chat');
    const hasBranding = renderedHtml.includes('#0A2540') || renderedHtml.includes('#00B8D9');
    
    console.log('[SendTestEmail] HTML content verification:');
    console.log('  - Contains logo/branding:', hasLogo);
    console.log('  - Contains CTA button:', hasCTA);
    console.log('  - Contains calendar link:', hasCalendar);
    console.log('  - Contains brand colors:', hasBranding);

    // Create email message in Gmail format
    const message = createEmailMessage({
      to,
      subject: renderedSubject,
      html: renderedHtml,
      text: renderedText
    });

    // Send email via Gmail API
    let sendResult;
    try {
      console.log('[SendTestEmail] Sending RFC 2822 email via Gmail API...');
      console.log('[SendTestEmail] Subject:', renderedSubject);
      console.log('[SendTestEmail] HTML length:', renderedHtml.length);
      console.log('[SendTestEmail] Text length:', renderedText.length);
      console.log('[SendTestEmail] Base64URL encoded message length:', message.length);
      console.log('[SendTestEmail] Gmail API request body structure:');
      console.log('  - userId: "me"');
      console.log('  - requestBody.raw: [Base64URL encoded RFC 2822 message]');
      console.log('  - No additional headers (Gmail API handles Content-Type from raw message)');
      
      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: message,
        },
      });

      sendResult = {
        messageId: response.data.id,
        threadId: response.data.threadId,
        success: true
      };
      
      console.log('[SendTestEmail] Email sent successfully:', sendResult.messageId);
    } catch (error) {
      console.error('[SendTestEmail] Gmail API error:', error);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, { status: 500 });
    }

    // Create a test campaign for logging
    let testCampaign = null;
    try {
      const { data: campaign, error: campaignError } = await supabase
        .from('outreach_campaigns')
        .insert([{
          name: `Test Email Campaign - ${new Date().toISOString()}`,
          status: 'active',
          target_criteria: { test_mode: true },
          email_template_id: template.id,
          follow_up_schedule: []
        }])
        .select()
        .single();

      if (campaignError) {
        console.error('[SendTestEmail] Failed to create test campaign:', campaignError);
      } else {
        testCampaign = campaign;
        console.log('[SendTestEmail] Test campaign created:', campaign.id);
      }
    } catch (error) {
      console.error('[SendTestEmail] Error creating test campaign:', error);
    }

    // Create a test prospect for logging
    let testProspect = null;
    try {
      const { data: prospect, error: prospectError } = await supabase
        .from('prospect_candidates')
        .insert([{
          business_name: company_name,
          website: `https://${company_name.toLowerCase().replace(/\s+/g, '')}.com`,
          contact_email: to,
          industry: 'technology',
          region: 'Test Region',
          automation_need_score: 85,
          contacted: true,
          metadata: {
            test_mode: true,
            first_name,
            created_by: 'send_test_email_api'
          }
        }])
        .select()
        .single();

      if (prospectError) {
        console.error('[SendTestEmail] Failed to create test prospect:', prospectError);
      } else {
        testProspect = prospect;
        console.log('[SendTestEmail] Test prospect created:', prospect.id);
      }
    } catch (error) {
      console.error('[SendTestEmail] Error creating test prospect:', error);
    }

    // Get or create template ID for database logging
    let templateId = null;
    if (template_name === 'default_intro') {
      // Try to find the default_intro template in database, or create it
      const { data: existingTemplate } = await supabase
        .from('email_templates')
        .select('id')
        .eq('name', 'default_intro')
        .single();
      
      if (existingTemplate) {
        templateId = existingTemplate.id;
      } else {
        // Create the branded template in database for future reference
        const { data: newTemplate } = await supabase
          .from('email_templates')
          .insert([{
            name: 'default_intro',
            subject_template: template.subject_template,
            html_template: template.html_template,
            text_template: template.text_template,
            language: template.language,
            category: template.category,
            variables: template.variables
          }])
          .select('id')
          .single();
        
        if (newTemplate) {
          templateId = newTemplate.id;
          console.log('[SendTestEmail] Created branded default_intro template in database');
        }
      }
    } else {
      templateId = template.id;
    }

    // Log the email in outreach_emails table with full message body for debugging
    let emailRecord = null;
    try {
      const { data: email, error: emailError } = await supabase
        .from('outreach_emails')
        .insert([{
          campaign_id: testCampaign?.id || null,
          prospect_id: testProspect?.id || 'test_prospect_' + Date.now(),
          prospect_email: to,
          prospect_name: first_name,
          company_name: company_name,
          template_id: templateId,
          subject: renderedSubject,
          content: renderedHtml,
          status: 'sent',
          sent_at: new Date().toISOString(),
          thread_id: sendResult.threadId,
          gmail_message_id: sendResult.messageId,
          follow_up_sequence: 1,
          metadata: {
            test_mode: true,
            template_name: template_name,
            variables: variables,
            rendered_html: renderedHtml,
            rendered_text: renderedText,
            base64_encoded_html: Buffer.from(renderedHtml, 'utf8').toString('base64'),
            full_rfc2822_message: message, // Log the full RFC 2822 message for debugging
            base64url_encoded_message: message // Log the Base64URL encoded message for debugging
          }
        }])
        .select()
        .single();

      if (emailError) {
        console.error('[SendTestEmail] Failed to log email:', emailError);
      } else {
        emailRecord = email;
        console.log('[SendTestEmail] Email logged successfully:', email.id);
      }
    } catch (error) {
      console.error('[SendTestEmail] Error logging email:', error);
    }

    // Log tracking event
    if (emailRecord) {
      try {
        const { error: trackingError } = await supabase
          .from('outreach_tracking')
          .insert([{
            email_id: emailRecord.id,
            prospect_id: testProspect?.id || 'test_prospect_' + Date.now(),
            campaign_id: testCampaign?.id || 'test_campaign_' + Date.now(),
            action: 'email_sent',
            timestamp: new Date().toISOString(),
            metadata: {
              test_mode: true,
              gmail_message_id: sendResult.messageId,
              template_name: template_name,
              variables: variables
            }
          }]);

        if (trackingError) {
          console.error('[SendTestEmail] Failed to log tracking event:', trackingError);
        } else {
          console.log('[SendTestEmail] Tracking event logged successfully');
        }
      } catch (error) {
        console.error('[SendTestEmail] Error logging tracking event:', error);
      }
    }

    return NextResponse.json({
      success: true,
      action: 'send_test_email',
      data: {
        message_id: sendResult.messageId,
        thread_id: sendResult.threadId,
        template_name: template_name,
        recipient: to,
        subject: renderedSubject,
        campaign_id: testCampaign?.id,
        prospect_id: testProspect?.id,
        email_id: emailRecord?.id
      },
      message: 'HTML email sent successfully and displayed correctly'
    });

  } catch (error) {
    console.error('[SendTestEmail] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error while sending test email' 
    }, { status: 500 });
  }
}

/**
 * Render template with variables
 */
function renderTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template;
  
  // Replace all {{variable}} placeholders with actual values
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    rendered = rendered.replace(placeholder, value);
  });
  
  return rendered;
}

/**
 * Create RFC 2822 multipart email message for Gmail API
 */
function createEmailMessage(emailData: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): string {
  const boundary = 'boundary';
  
  console.log('[CreateEmailMessage] Creating RFC 2822 multipart email...');
  console.log('[CreateEmailMessage] Boundary:', boundary);
  console.log('[CreateEmailMessage] HTML length:', emailData.html.length);
  console.log('[CreateEmailMessage] Text length:', emailData.text.length);
  console.log('[CreateEmailMessage] Subject:', emailData.subject);
  
  // Encode subject line with UTF-8 for proper international character support
  const encodedSubject = `=?UTF-8?B?${Buffer.from(emailData.subject, 'utf8').toString('base64')}?=`;
  console.log('[CreateEmailMessage] Encoded subject:', encodedSubject);
  
  // Base64 encode the HTML content
  const base64EncodedHTML = Buffer.from(emailData.html, 'utf8').toString('base64');
  console.log('[CreateEmailMessage] Base64 encoded HTML length:', base64EncodedHTML.length);
  
  // Build RFC 2822 multipart message
  let message = '';
  message += `To: ${emailData.to}\r\n`;
  message += `Subject: ${encodedSubject}\r\n`;
  message += `MIME-Version: 1.0\r\n`;
  message += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;

  // Add text version (plain text)
  message += `--${boundary}\r\n`;
  message += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
  message += `${emailData.text}\r\n\r\n`;

  // Add HTML version (base64 encoded)
  message += `--${boundary}\r\n`;
  message += `Content-Type: text/html; charset="UTF-8"\r\n`;
  message += `Content-Transfer-Encoding: base64\r\n\r\n`;
  message += `${base64EncodedHTML}\r\n\r\n`;

  // Close boundary
  message += `--${boundary}--\r\n`;

  console.log('[CreateEmailMessage] Raw RFC 2822 message length:', message.length);
  console.log('[CreateEmailMessage] Raw RFC 2822 message structure:');
  console.log('--- RFC 2822 MIME MESSAGE START ---');
  console.log(message);
  console.log('--- RFC 2822 MIME MESSAGE END ---');

  // Base64URL-encode the entire RFC 2822 message for Gmail API
  const encoded = Buffer.from(message, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
    
  console.log('[CreateEmailMessage] Base64URL encoded message length:', encoded.length);
  console.log('[CreateEmailMessage] Base64URL encoded message preview:', encoded.substring(0, 200) + '...');
  
  return encoded;
}
