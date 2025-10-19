import { NextRequest, NextResponse } from 'next/server';
import { OutreachEngine } from '@/lib/phase4/outreach_engine';
import { EmailTemplateEngine } from '@/lib/phase4/email_templates';
import { OutreachTracker } from '@/lib/phase4/outreach_tracking';

const outreachEngine = new OutreachEngine();
const templateEngine = new EmailTemplateEngine();
const tracker = new OutreachTracker();

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
