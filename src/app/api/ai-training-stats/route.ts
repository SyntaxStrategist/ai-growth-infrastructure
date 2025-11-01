import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('client_id');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
    }

    // Fetch all leads for this client
    const { data: leads, error: leadsError } = await supabase
      .from('lead_memory')
      .select('*')
      .eq('client_id', clientId)
      .eq('deleted', false);

    if (leadsError) {
      console.error('[AI Training Stats] Error fetching leads:', leadsError);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
      // Return default stats for new clients
      return NextResponse.json({
        totalLeadsProcessed: 0,
        daysActive: 0,
        learningProgress: 0,
        confidenceImprovement: 0,
        newPatternsLearned: 0,
        industryTermsLearned: 0,
        topDiscoveries: [],
        timeSavedHours: 0,
        valueGenerated: 0,
      });
    }

    // Calculate stats
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Total leads processed
    const totalLeadsProcessed = leads.length;

    // Days active (from first lead to now)
    const firstLeadDate = new Date(Math.min(...leads.map(l => new Date(l.timestamp || l.last_updated).getTime())));
    const daysActive = Math.max(1, Math.floor((now.getTime() - firstLeadDate.getTime()) / (24 * 60 * 60 * 1000)));

    // Learning progress (0-100 based on lead count and time)
    const learningProgress = Math.min(100, Math.floor((totalLeadsProcessed / 100) * 50 + (daysActive / 90) * 50));

    // Confidence improvement (last 30 days vs previous 30 days)
    const recentLeads = leads.filter(l => new Date(l.timestamp || l.last_updated) >= thirtyDaysAgo);
    const previousLeads = leads.filter(l => {
      const date = new Date(l.timestamp || l.last_updated);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    const recentAvgConfidence = recentLeads.length > 0
      ? recentLeads.reduce((sum, l) => sum + (parseFloat(l.confidence_score) || 0), 0) / recentLeads.length
      : 0;

    const previousAvgConfidence = previousLeads.length > 0
      ? previousLeads.reduce((sum, l) => sum + (parseFloat(l.confidence_score) || 0), 0) / previousLeads.length
      : recentAvgConfidence;

    const confidenceImprovement = previousAvgConfidence > 0
      ? Math.round(((recentAvgConfidence - previousAvgConfidence) / previousAvgConfidence) * 100)
      : 0;

    // Unique intents learned
    const uniqueIntents = new Set(leads.map(l => l.intent).filter(Boolean));
    const newPatternsLearned = uniqueIntents.size;

    // Industry terms (unique words from summaries, excluding common words)
    const allSummaries = leads.map(l => l.ai_summary || '').join(' ');
    const words = allSummaries.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const uniqueWords = new Set(words);
    const commonWords = new Set(['lead', 'inquiry', 'from', 'about', 'that', 'this', 'with', 'they', 'have', 'need', 'want', 'mode']);
    const industryTermsLearned = Array.from(uniqueWords).filter(w => !commonWords.has(w)).length;

    // Top discoveries (analyze patterns)
    const topDiscoveries: string[] = [];

    // Discovery 1: Top converting intent
    const intentCounts = leads.reduce((acc, l) => {
      const intent = l.intent || 'Unknown';
      acc[intent] = (acc[intent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedIntents = Object.entries(intentCounts).sort((a, b) => (b[1] as number) - (a[1] as number));
    const topIntent: [string, number] | null = sortedIntents.length > 0 ? (sortedIntents[0] as [string, number]) : null;
    if (topIntent && topIntent[1] >= 3) {
      topDiscoveries.push(`"${topIntent[0]}" leads are your most common inquiry type (${topIntent[1]} leads)`);
    }

    // Discovery 2: High confidence pattern
    const highConfidenceLeads = leads.filter(l => (parseFloat(l.confidence_score) || 0) >= 0.75);
    if (highConfidenceLeads.length >= 3) {
      const percentage = Math.round((highConfidenceLeads.length / totalLeadsProcessed) * 100);
      topDiscoveries.push(`${percentage}% of your leads show high confidence (75%+ score)`);
    }

    // Discovery 3: Language preference
    const languageCounts = leads.reduce((acc, l) => {
      const lang = l.language || 'en';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (languageCounts.fr && languageCounts.en) {
      const frPercent = Math.round((languageCounts.fr / totalLeadsProcessed) * 100);
      const enPercent = Math.round((languageCounts.en / totalLeadsProcessed) * 100);
      if (frPercent >= 20 && enPercent >= 20) {
        topDiscoveries.push(`Bilingual audience: ${enPercent}% English, ${frPercent}% French leads`);
      }
    }

    // Discovery 4: Urgency patterns
    const highUrgencyLeads = leads.filter(l => l.urgency === 'High' || l.urgency === 'Élevée');
    if (highUrgencyLeads.length >= 5) {
      const percentage = Math.round((highUrgencyLeads.length / totalLeadsProcessed) * 100);
      topDiscoveries.push(`${percentage}% of leads require urgent attention`);
    }

    // Time saved (assume 15 min per lead if manual)
    const timeSavedHours = Math.round((totalLeadsProcessed * 15) / 60);

    // Value generated (assume $150/hour for manual processing)
    const valueGenerated = timeSavedHours * 150;

    return NextResponse.json({
      totalLeadsProcessed,
      daysActive,
      learningProgress,
      confidenceImprovement: Math.max(0, confidenceImprovement),
      newPatternsLearned,
      industryTermsLearned: Math.min(999, industryTermsLearned),
      topDiscoveries: topDiscoveries.slice(0, 4),
      timeSavedHours,
      valueGenerated,
    });

  } catch (error) {
    console.error('[AI Training Stats] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

