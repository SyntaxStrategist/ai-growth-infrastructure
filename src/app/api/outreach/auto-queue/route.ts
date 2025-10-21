import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { withAdminAuth } from "../../../../lib/auth-middleware";
import { DEFAULT_INTRO_TEMPLATE_EN, DEFAULT_INTRO_TEMPLATE_FR } from "../../../../lib/phase4/default_intro_template";

// Timeout wrapper for database operations
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

async function autoQueueHandler(req: NextRequest) {
  console.log('[AutoQueue] ============================================');
  console.log('[AutoQueue] 🚀 Auto-queue handler started');
  console.log('[AutoQueue] ============================================');
  
  try {
    // Step 1: Find 1 new valid prospect that fits Avenir AI's ICP
    console.log('[AutoQueue] Step 1: Finding valid prospect...');
    
    const { data: prospects, error: prospectError } = await withTimeout(
      supabase
        .from('prospect_candidates')
        .select(`
          id,
          business_name,
          website,
          contact_email,
          industry,
          region,
          language,
          automation_need_score,
          contacted,
          is_test,
          created_at
        `)
        .eq('contacted', false) // Not yet contacted
        .eq('is_test', false) // Not test data
        .gte('automation_need_score', 70) // High priority prospects
        .in('industry', ['technology', 'construction', 'real estate', 'marketing', 'healthcare', 'finance']) // Avenir AI's target industries
        .order('automation_need_score', { ascending: false }) // Highest score first
        .limit(1),
      8000
    );

    if (prospectError) {
      console.error('[AutoQueue] ❌ Error fetching prospects:', prospectError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to fetch prospects",
          details: prospectError.message
        },
        { status: 500 }
      );
    }

    if (!prospects || prospects.length === 0) {
      console.log('[AutoQueue] ℹ️ No valid prospects found for auto-queue');
      return NextResponse.json({
        success: true,
        data: {
          message: "No valid prospects found for auto-queue",
          prospectsFound: 0,
          emailsQueued: 0
        }
      });
    }

    const prospect = prospects[0];
    console.log('[AutoQueue] ✅ Found prospect:', {
      id: prospect.id,
      business_name: prospect.business_name,
      industry: prospect.industry,
      score: prospect.automation_need_score,
      language: prospect.language
    });

    // Step 2: Generate outreach email using default_intro template
    console.log('[AutoQueue] Step 2: Generating outreach email...');
    
    const isFrench = prospect.language === 'fr';
    const template = isFrench ? DEFAULT_INTRO_TEMPLATE_FR : DEFAULT_INTRO_TEMPLATE_EN;
    
    // Prepare variables for the template
    const variables = {
      company_name: prospect.business_name,
      contact_name: prospect.contact_email ? prospect.contact_email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'there',
      contact_email: prospect.contact_email || 'contact@' + prospect.website.replace(/^https?:\/\//, '').replace(/^www\./, ''),
      industry: prospect.industry || 'business',
      pain_points: getPainPointsForIndustry(prospect.industry)
    };

    // Generate email content
    let subject = template.subject_template;
    let html = template.html_template;
    let text = template.text_template;

    // Replace variables in templates
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      html = html.replace(regex, value);
      text = text.replace(regex, value);
    });

    console.log('[AutoQueue] ✅ Email generated:', {
      subject: subject.substring(0, 50) + '...',
      language: isFrench ? 'FR' : 'EN',
      variables_used: Object.keys(variables)
    });

    // Step 3: Insert email into outreach_emails table with status 'pending'
    console.log('[AutoQueue] Step 3: Inserting email into outreach_emails table...');
    
    const { data: insertedEmail, error: insertError } = await withTimeout(
      supabase
        .from('outreach_emails')
        .insert({
          prospect_id: prospect.id,
          prospect_email: variables.contact_email,
          prospect_name: variables.contact_name,
          company_name: prospect.business_name,
          subject: subject,
          content: html,
          status: 'pending',
          follow_up_sequence: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single(),
      8000
    );

    if (insertError) {
      console.error('[AutoQueue] ❌ Error inserting email:', insertError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to insert email into queue",
          details: insertError.message
        },
        { status: 500 }
      );
    }

    console.log('[AutoQueue] ✅ Email queued successfully:', {
      email_id: insertedEmail.id,
      prospect: prospect.business_name,
      status: 'pending'
    });

    // Step 4: Mark prospect as contacted to avoid duplicates
    console.log('[AutoQueue] Step 4: Marking prospect as contacted...');
    
    const { error: updateError } = await withTimeout(
      supabase
        .from('prospect_candidates')
        .update({ contacted: true })
        .eq('id', prospect.id),
      5000
    );

    if (updateError) {
      console.error('[AutoQueue] ⚠️ Warning: Failed to mark prospect as contacted:', updateError);
      // Don't fail the whole operation for this
    } else {
      console.log('[AutoQueue] ✅ Prospect marked as contacted');
    }

    console.log('[AutoQueue] ============================================');
    console.log('[AutoQueue] ✅ Auto-queue completed successfully');
    console.log('[AutoQueue] ============================================');

    return NextResponse.json({
      success: true,
      data: {
        message: "Email queued successfully for approval",
        prospect: {
          id: prospect.id,
          business_name: prospect.business_name,
          industry: prospect.industry,
          score: prospect.automation_need_score,
          language: prospect.language
        },
        email: {
          id: insertedEmail.id,
          subject: subject,
          status: 'pending',
          language: isFrench ? 'FR' : 'EN'
        },
        prospectsFound: 1,
        emailsQueued: 1
      }
    });

  } catch (error) {
    console.error('[AutoQueue] ============================================');
    console.error('[AutoQueue] ❌ Unexpected error:', error);
    console.error('[AutoQueue] ============================================');
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to get pain points based on industry
function getPainPointsForIndustry(industry: string | null): string {
  const painPointsMap: Record<string, string> = {
    'technology': 'scaling challenges, manual processes, and inefficient workflows',
    'construction': 'project management complexity, resource allocation, and client communication',
    'real estate': 'lead generation challenges, client follow-up, and market analysis',
    'marketing': 'campaign optimization, lead qualification, and ROI measurement',
    'healthcare': 'patient engagement, administrative efficiency, and compliance management',
    'finance': 'client acquisition, risk assessment, and regulatory compliance',
    'default': 'operational efficiency, growth scaling, and process automation'
  };
  
  return painPointsMap[industry?.toLowerCase() || 'default'] || painPointsMap['default'];
}

export const POST = withAdminAuth(autoQueueHandler);
