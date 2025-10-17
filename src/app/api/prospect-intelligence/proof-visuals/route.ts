// ============================================
// Prospect Intelligence Proof Visuals API
// Generate before/after snapshots for demos
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

/**
 * Generate proof of concept visuals for prospect intelligence
 * Demonstrates before/after metrics
 */
export async function POST(req: NextRequest) {
  console.log('[ProofVisualsAPI] ============================================');
  console.log('[ProofVisualsAPI] Generating proof visuals');

  try {
    const body = await req.json();
    const { prospectId } = body;

    // Fetch prospect and their outreach history
    const { data: prospect, error: prospectError } = await supabase
      .from('prospect_candidates')
      .select('*')
      .eq('id', prospectId)
      .single();

    if (prospectError || !prospect) {
      return NextResponse.json(
        { success: false, error: 'Prospect not found' },
        { status: 404 }
      );
    }

    const { data: outreach, error: outreachError } = await supabase
      .from('prospect_outreach_log')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('sent_at', { ascending: false });

    if (outreachError) {
      throw outreachError;
    }

    // Generate before/after comparison
    const beforeMetrics = {
      status: 'No AI Automation',
      response_time: prospect.metadata?.response_time_minutes || 120,
      has_autoresponder: prospect.metadata?.has_autoresponder || false,
      response_quality: 'Generic or None',
      lead_qualification: 'Manual',
      follow_up: 'Manual/Delayed',
      engagement_rate: '0%'
    };

    const afterMetrics = {
      status: 'Avenir AI Active',
      response_time: 0.5, // < 30 seconds
      has_autoresponder: true,
      response_quality: 'Personalized & Context-Aware',
      lead_qualification: 'Instant AI Analysis',
      follow_up: 'Automated & Timely',
      engagement_rate: outreach && outreach.length > 0 
        ? `${Math.round((outreach.filter(o => o.status === 'opened' || o.status === 'replied').length / outreach.length) * 100)}%`
        : 'Pending'
    };

    // Generate visual comparison data
    const comparison = {
      business_name: prospect.business_name,
      industry: prospect.industry,
      automation_score: prospect.automation_need_score,
      before: beforeMetrics,
      after: afterMetrics,
      improvements: {
        response_time_improvement: `${Math.round((1 - (afterMetrics.response_time / beforeMetrics.response_time)) * 100)}%`,
        automation_coverage: '100%',
        lead_quality_score: '+85%',
        time_saved_per_lead: `${Math.round(beforeMetrics.response_time - afterMetrics.response_time)} minutes`
      },
      roi_projection: {
        monthly_leads_handled: 50,
        time_saved_hours: Math.round((beforeMetrics.response_time * 50) / 60),
        cost_savings_monthly: '$2,400 - $4,000',
        conversion_rate_increase: '+25-40%'
      }
    };

    // Generate mock screenshot URLs (in production, these would be actual screenshots)
    const visuals = {
      before_screenshot: {
        url: `https://placehold.co/800x600/gray/white?text=Before:+No+AI+Automation`,
        description: 'Contact form with no instant response',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        metrics: beforeMetrics
      },
      after_screenshot: {
        url: `https://placehold.co/800x600/green/white?text=After:+Avenir+AI+Active`,
        description: 'Contact form with instant AI response and qualification',
        timestamp: new Date().toISOString(),
        metrics: afterMetrics
      },
      comparison_chart: {
        url: `https://placehold.co/1200x400/blue/white?text=Performance+Comparison+Chart`,
        description: 'Before/After metrics comparison',
        chart_type: 'bar_chart',
        data_points: [
          { metric: 'Response Time', before: beforeMetrics.response_time, after: afterMetrics.response_time, unit: 'minutes' },
          { metric: 'Engagement Rate', before: 0, after: 45, unit: '%' },
          { metric: 'Lead Quality Score', before: 30, after: 85, unit: 'points' }
        ]
      },
      roi_dashboard: {
        url: `https://placehold.co/1200x600/purple/white?text=ROI+Dashboard`,
        description: 'Projected ROI and cost savings',
        projections: comparison.roi_projection
      }
    };

    console.log('[ProofVisualsAPI] ✅ Proof visuals generated');
    console.log('[ProofVisualsAPI] Business:', prospect.business_name);
    console.log('[ProofVisualsAPI] Improvement:', comparison.improvements.response_time_improvement);

    return NextResponse.json({
      success: true,
      data: {
        prospect: {
          id: prospect.id,
          business_name: prospect.business_name,
          industry: prospect.industry,
          website: prospect.website
        },
        comparison,
        visuals,
        generated_at: new Date().toISOString(),
        message: 'Proof visuals generated successfully'
      }
    });

  } catch (error) {
    console.error('[ProofVisualsAPI] ❌ Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate proof visuals'
      },
      { status: 500 }
    );
  }
}

/**
 * Get existing proof visuals or generate batch
 */
export async function GET(req: NextRequest) {
  console.log('[ProofVisualsAPI] Fetching proof visuals data');

  try {
    // Fetch top prospects with high scores
    const { data: prospects, error } = await supabase
      .from('prospect_candidates')
      .select('*')
      .gte('automation_need_score', 70)
      .order('automation_need_score', { ascending: false })
      .limit(5);

    if (error) {
      throw error;
    }

    const proofCases = (prospects || []).map(p => ({
      prospect_id: p.id,
      business_name: p.business_name,
      industry: p.industry,
      automation_score: p.automation_need_score,
      potential_improvement: `${Math.round((p.automation_need_score || 70) * 0.8)}%`,
      estimated_time_saved: `${Math.round((p.metadata?.response_time_minutes || 120) - 0.5)} minutes per lead`,
      before_thumbnail: `https://placehold.co/400x300/gray/white?text=${encodeURIComponent(p.business_name)}+Before`,
      after_thumbnail: `https://placehold.co/400x300/green/white?text=${encodeURIComponent(p.business_name)}+After`
    }));

    return NextResponse.json({
      success: true,
      data: {
        proof_cases: proofCases,
        total: proofCases.length,
        message: 'Top proof of concept cases'
      }
    });

  } catch (error) {
    console.error('[ProofVisualsAPI] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch proof visuals'
      },
      { status: 500 }
    );
  }
}

