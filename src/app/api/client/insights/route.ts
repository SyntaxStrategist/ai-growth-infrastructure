import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('clientId');
    
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID required' },
        { status: 400 }
      );
    }
    
    console.log('[ClientInsights] Fetching insights for client:', clientId);
    
    // Fetch leads data scoped to this client
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('client_id', clientId)
      .eq('deleted', false);
    
    if (error) {
      console.error('[ClientInsights] ❌ Fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch insights' },
        { status: 500 }
      );
    }
    
    // Calculate insights from client's leads
    const total = leads.length;
    const avgConfidence = leads.length > 0 
      ? leads.reduce((sum, lead) => sum + (lead.confidence_score || 0), 0) / leads.length 
      : 0;
    
    // Intent distribution
    const intentCounts: Record<string, number> = {};
    leads.forEach(lead => {
      const intent = lead.intent || 'Unknown';
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;
    });
    
    // Urgency breakdown
    const urgencyCounts = { high: 0, medium: 0, low: 0 };
    leads.forEach(lead => {
      const urgency = lead.urgency || 'low';
      if (urgency === 'high') urgencyCounts.high++;
      else if (urgency === 'medium') urgencyCounts.medium++;
      else urgencyCounts.low++;
    });
    
    // Tone analysis
    const toneCounts: Record<string, number> = {};
    leads.forEach(lead => {
      const tone = lead.tone || 'neutral';
      toneCounts[tone] = (toneCounts[tone] || 0) + 1;
    });
    
    // Daily counts (last 30 days)
    const dailyCounts: Record<string, number> = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    leads.forEach(lead => {
      const leadDate = new Date(lead.timestamp);
      if (leadDate >= thirtyDaysAgo) {
        const dateKey = leadDate.toISOString().split('T')[0];
        dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
      }
    });
    
    // Language distribution
    const languageCounts = { en: 0, fr: 0 };
    leads.forEach(lead => {
      const language = lead.language || 'en';
      if (language === 'fr') languageCounts.fr++;
      else languageCounts.en++;
    });
    
    const insights = {
      total,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      intentCounts,
      urgencyCounts,
      toneCounts,
      dailyCounts,
      languageCounts
    };
    
    console.log('[ClientInsights] ✅ Insights calculated successfully');
    return NextResponse.json({ success: true, data: insights });
    
  } catch (error) {
    console.error('[ClientInsights] ❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
