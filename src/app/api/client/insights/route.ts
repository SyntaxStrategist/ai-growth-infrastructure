import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { resolveClientId, validateClientId } from '../../../../lib/client-resolver';

import { handleApiError } from '../../../../lib/error-handler';
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
    
    // Validate client ID format
    const validation = validateClientId(clientId);
    if (!validation.isValid) {
      console.error('[ClientInsights] ❌ Invalid client ID format:', clientId, validation.message);
      return NextResponse.json(
        { success: false, error: `Invalid client ID format: ${validation.message}` },
        { status: 400 }
      );
    }

    // Verify client exists by resolving (but don't use the UUID for lead_actions query)
    try {
      await resolveClientId(clientId);
      console.log(`[ClientInsights] ✅ Client ID validated: "${clientId}"`);
    } catch (error) {
      console.error('[ClientInsights] ❌ Client not found:', error);
      return NextResponse.json(
        { success: false, error: `Client not found: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 404 }
      );
    }
    
    // Query lead_actions using the PUBLIC client_id (not the internal UUID)
    // lead_actions.client_id stores the public client_id, not the internal UUID
    const { data: leadActionsData, error: leadActionsError } = await supabase
      .from('lead_actions')
      .select('lead_id')
      .eq('client_id', clientId);
    
    if (leadActionsError) {
      console.error('[ClientInsights] ❌ Error fetching lead_actions:', leadActionsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch lead actions' },
        { status: 500 }
      );
    }
    
    const leadIds = leadActionsData?.map(la => la.lead_id) || [];
    console.log('[ClientInsights] Found', leadIds.length, 'leads for client');
    
    if (leadIds.length === 0) {
      console.log('[ClientInsights] No leads found for client, returning empty insights');
      return NextResponse.json({
        success: true,
        data: {
          total: 0,
          avgConfidence: 0,
          intentCounts: {},
          urgencyCounts: { high: 0, medium: 0, low: 0 },
          toneCounts: {},
          dailyCounts: {},
          languageCounts: { en: 0, fr: 0 }
        }
      });
    }
    
    // Fetch leads data from lead_memory table using the resolved lead IDs
    const { data: leads, error } = await supabase
      .from('lead_memory')
      .select('*')
      .in('id', leadIds)
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
      ? leads.reduce((sum, lead) => sum + (lead.confidenceScore || 0), 0) / leads.length 
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
      const urgency = lead.urgency || 'Low';
      if (urgency === 'High' || urgency === 'Élevée') urgencyCounts.high++;
      else if (urgency === 'Medium' || urgency === 'Moyenne') urgencyCounts.medium++;
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
    return handleApiError(error, 'API');
  }
}
