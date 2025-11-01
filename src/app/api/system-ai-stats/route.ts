import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Fetch all clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, business_name, industry_category, is_test');

    if (clientsError) {
      console.error('[System AI Stats] Error fetching clients:', clientsError);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    // Fetch all leads
    const { data: leads, error: leadsError } = await supabase
      .from('lead_memory')
      .select('client_id, confidence_score, timestamp, intent, industry_category, deleted');

    if (leadsError) {
      console.error('[System AI Stats] Error fetching leads:', leadsError);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    // Calculate system-wide stats
    const activeLeads = leads?.filter(l => !l.deleted) || [];
    const totalLeadsProcessed = activeLeads.length;
    const totalClients = clients?.length || 0;
    const activeClients = clients?.filter(c => !c.is_test).length || 0;

    // System confidence (average across all leads)
    const avgConfidence = activeLeads.length > 0
      ? activeLeads.reduce((sum, l) => sum + (parseFloat(l.confidence_score) || 0), 0) / activeLeads.length
      : 0;

    // Calculate confidence change (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentLeads = activeLeads.filter(l => new Date(l.timestamp) >= thirtyDaysAgo);
    const previousLeads = activeLeads.filter(l => {
      const date = new Date(l.timestamp);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    const recentAvg = recentLeads.length > 0
      ? recentLeads.reduce((sum, l) => sum + (parseFloat(l.confidence_score) || 0), 0) / recentLeads.length
      : avgConfidence;

    const previousAvg = previousLeads.length > 0
      ? previousLeads.reduce((sum, l) => sum + (parseFloat(l.confidence_score) || 0), 0) / previousLeads.length
      : recentAvg;

    const confidenceChange = previousAvg > 0
      ? Math.round(((recentAvg - previousAvg) / previousAvg) * 100)
      : 0;

    // Time saved and value (15 min per lead, $150/hour)
    const totalTimeSaved = Math.round((totalLeadsProcessed * 15) / 60);
    const totalValueGenerated = totalTimeSaved * 150;

    // Top performing clients (by lead count and confidence)
    const clientLeadCounts = activeLeads.reduce((acc, lead) => {
      if (!acc[lead.client_id]) {
        acc[lead.client_id] = { count: 0, totalConfidence: 0 };
      }
      acc[lead.client_id].count++;
      acc[lead.client_id].totalConfidence += parseFloat(lead.confidence_score) || 0;
      return acc;
    }, {} as Record<string, { count: number; totalConfidence: number }>);

    const topPerformingClients = Object.entries(clientLeadCounts)
      .map(([clientId, stats]) => {
        const client = clients?.find(c => c.id === clientId);
        return {
          clientId,
          businessName: client?.business_name || 'Unknown',
          leadsProcessed: stats.count,
          confidence: Math.round((stats.totalConfidence / stats.count) * 100),
        };
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);

    // Industry insights
    const industryStats = activeLeads.reduce((acc, lead) => {
      // Try to get industry from lead or client
      const client = clients?.find(c => c.id === lead.client_id);
      const industry = lead.industry_category || client?.industry_category || 'Unknown';
      
      if (!acc[industry]) {
        acc[industry] = { count: 0, totalConfidence: 0 };
      }
      acc[industry].count++;
      acc[industry].totalConfidence += parseFloat(lead.confidence_score) || 0;
      return acc;
    }, {} as Record<string, { count: number; totalConfidence: number }>);

    const industryInsights = Object.entries(industryStats)
      .map(([industry, stats]) => ({
        industry,
        leadCount: stats.count,
        avgConfidence: Math.round((stats.totalConfidence / stats.count) * 100),
      }))
      .sort((a, b) => b.leadCount - a.leadCount)
      .slice(0, 5);

    // Cross-client patterns
    const crossClientPatterns: string[] = [];

    // Pattern 1: Top intent across all clients
    const intentCounts = activeLeads.reduce((acc, l) => {
      const intent = l.intent || 'Unknown';
      acc[intent] = (acc[intent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topIntent = Object.entries(intentCounts).sort((a, b) => b[1] - a[1])[0];
    if (topIntent && topIntent[1] >= 10) {
      crossClientPatterns.push(`"${topIntent[0]}" is the most common intent across all clients (${topIntent[1]} leads)`);
    }

    // Pattern 2: High confidence threshold
    const highConfidenceLeads = activeLeads.filter(l => (parseFloat(l.confidence_score) || 0) >= 0.75);
    if (highConfidenceLeads.length >= 10) {
      const percentage = Math.round((highConfidenceLeads.length / totalLeadsProcessed) * 100);
      crossClientPatterns.push(`${percentage}% of all leads show high confidence (75%+) across the platform`);
    }

    // Pattern 3: Recent activity
    if (recentLeads.length >= 5) {
      const recentPercentage = Math.round((recentLeads.length / totalLeadsProcessed) * 100);
      crossClientPatterns.push(`${recentPercentage}% of leads were processed in the last 30 days`);
    }

    // Pattern 4: Client activity
    if (activeClients >= 3) {
      const avgLeadsPerClient = Math.round(totalLeadsProcessed / activeClients);
      crossClientPatterns.push(`Average ${avgLeadsPerClient} leads per active client`);
    }

    return NextResponse.json({
      totalLeadsProcessed,
      totalClients,
      activeClients,
      systemConfidence: Math.round(avgConfidence * 100),
      systemConfidenceChange: confidenceChange,
      totalTimeSaved,
      totalValueGenerated,
      topPerformingClients,
      industryInsights,
      crossClientPatterns,
    });

  } catch (error) {
    console.error('[System AI Stats] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

