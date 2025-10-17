// ============================================
// Prospect Intelligence Feedback API
// Track and learn from outreach performance
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  updateOutreachStatus, 
  updateIndustryMetrics,
  calculateAndSavePerformanceMetrics 
} from '../../../../../prospect-intelligence/database/supabase_connector';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

/**
 * Update outreach feedback status
 * POST /api/prospect-intelligence/feedback
 */
export async function POST(req: NextRequest) {
  console.log('[FeedbackAPI] ============================================');
  console.log('[FeedbackAPI] Feedback update received');

  try {
    const body = await req.json();
    const { outreachId, status, replyContent, simulateRandom = false } = body;

    if (!outreachId) {
      return NextResponse.json(
        { success: false, error: 'outreachId is required' },
        { status: 400 }
      );
    }

    let finalStatus = status;

    // Simulate random feedback if requested (for demo/testing)
    if (simulateRandom) {
      const statuses = ['opened', 'replied', 'ignored'];
      const weights = [0.4, 0.2, 0.4]; // 40% opened, 20% replied, 40% ignored
      const random = Math.random();
      
      if (random < weights[0]) {
        finalStatus = 'opened';
      } else if (random < weights[0] + weights[1]) {
        finalStatus = 'replied';
      } else {
        finalStatus = 'ignored';
      }
      
      console.log('[FeedbackAPI] 🎲 Simulated random status:', finalStatus);
    }

    if (!['opened', 'replied', 'bounced', 'ignored'].includes(finalStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be: opened, replied, bounced, or ignored' },
        { status: 400 }
      );
    }

    console.log('[FeedbackAPI] Outreach ID:', outreachId);
    console.log('[FeedbackAPI] New Status:', finalStatus);

    // Update the outreach log
    await updateOutreachStatus(outreachId, finalStatus, {
      reply_content: replyContent || null,
      updated_at: new Date().toISOString(),
      simulated: simulateRandom
    });

    console.log('[FeedbackAPI] ✅ Outreach status updated');

    // Recalculate performance metrics
    console.log('[FeedbackAPI] Recalculating performance metrics...');
    await calculateAndSavePerformanceMetrics();

    console.log('[FeedbackAPI] ✅ Performance metrics updated');

    // Fetch updated metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('prospect_industry_performance')
      .select('*')
      .order('priority_score', { ascending: false });

    if (metricsError) {
      console.error('[FeedbackAPI] Error fetching updated metrics:', metricsError);
    }

    return NextResponse.json({
      success: true,
      data: {
        outreachId,
        status: finalStatus,
        message: 'Feedback recorded and metrics updated',
        metrics: metrics || []
      }
    });

  } catch (error) {
    console.error('[FeedbackAPI] ❌ Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update feedback'
      },
      { status: 500 }
    );
  }
}

/**
 * Get performance metrics
 * GET /api/prospect-intelligence/feedback?type=metrics
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  try {
    if (type === 'metrics') {
      // Fetch industry performance metrics
      const { data: metrics, error } = await supabase
        .from('prospect_industry_performance')
        .select('*')
        .order('priority_score', { ascending: false });

      if (error) {
        throw error;
      }

      // Calculate overall stats
      const totalContacted = metrics?.reduce((sum, m) => sum + (m.total_contacted || 0), 0) || 0;
      const totalOpened = metrics?.reduce((sum, m) => sum + (m.total_opened || 0), 0) || 0;
      const totalReplied = metrics?.reduce((sum, m) => sum + (m.total_replied || 0), 0) || 0;

      const overallOpenRate = totalContacted > 0 ? (totalOpened / totalContacted) * 100 : 0;
      const overallReplyRate = totalContacted > 0 ? (totalReplied / totalContacted) * 100 : 0;

      return NextResponse.json({
        success: true,
        data: {
          metrics: metrics || [],
          overall: {
            total_contacted: totalContacted,
            total_opened: totalOpened,
            total_replied: totalReplied,
            open_rate: Math.round(overallOpenRate * 100) / 100,
            reply_rate: Math.round(overallReplyRate * 100) / 100
          }
        }
      });
    }

    // Default: fetch recent outreach logs
    const { data: logs, error } = await supabase
      .from('prospect_outreach_log')
      .select('*, prospect_candidates(business_name, industry)')
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: { logs: logs || [] }
    });

  } catch (error) {
    console.error('[FeedbackAPI] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch feedback data'
      },
      { status: 500 }
    );
  }
}

/**
 * Simulate batch feedback for testing
 * PUT /api/prospect-intelligence/feedback
 */
export async function PUT(req: NextRequest) {
  console.log('[FeedbackAPI] ============================================');
  console.log('[FeedbackAPI] Batch feedback simulation requested');

  try {
    const body = await req.json();
    const { count = 10 } = body;

    console.log('[FeedbackAPI] Simulating feedback for', count, 'recent outreach attempts');

    // Get recent outreach logs without feedback
    const { data: logs, error: logsError } = await supabase
      .from('prospect_outreach_log')
      .select('id, status')
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(count);

    if (logsError) {
      throw logsError;
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'No outreach logs found to simulate feedback',
          updated: 0
        }
      });
    }

    console.log('[FeedbackAPI] Found', logs.length, 'logs to update');

    // Simulate feedback for each log
    let updated = 0;
    for (const log of logs) {
      // Simulate realistic feedback distribution
      const random = Math.random();
      let status: 'opened' | 'replied' | 'ignored';
      
      if (random < 0.45) {
        status = 'opened'; // 45% open rate
      } else if (random < 0.60) {
        status = 'replied'; // 15% reply rate
      } else {
        status = 'ignored'; // 40% ignore rate
      }

      await updateOutreachStatus(log.id, status, {
        simulated: true,
        simulation_date: new Date().toISOString()
      });

      updated++;
      console.log(`[FeedbackAPI] ${updated}/${logs.length} - ${status}`);
    }

    // Recalculate metrics
    await calculateAndSavePerformanceMetrics();

    console.log('[FeedbackAPI] ✅ Batch simulation complete');

    return NextResponse.json({
      success: true,
      data: {
        message: 'Batch feedback simulated successfully',
        updated,
        total_logs: logs.length
      }
    });

  } catch (error) {
    console.error('[FeedbackAPI] ❌ Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to simulate feedback'
      },
      { status: 500 }
    );
  }
}

