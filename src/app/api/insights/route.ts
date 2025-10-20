import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

import { handleApiError } from '../../../lib/error-handler';
export async function GET() {
  try {
    // Fetch all leads
    const { data: leads, error } = await supabase
      .from('lead_memory')
      .select('intent, tone, urgency, confidence_score, timestamp, language')
      .order('timestamp', { ascending: false });

    if (error) {
      throw error;
    }

    const allLeads = leads || [];

    // Aggregate by intent
    const intentCounts: Record<string, number> = {};
    allLeads.forEach(lead => {
      const intent = lead.intent || 'N/A';
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;
    });

    // Aggregate by urgency
    const urgencyCounts = {
      high: allLeads.filter(l => l.urgency === 'High' || l.urgency === 'Élevée').length,
      medium: allLeads.filter(l => l.urgency === 'Medium' || l.urgency === 'Moyenne').length,
      low: allLeads.filter(l => l.urgency === 'Low' || l.urgency === 'Faible').length,
    };

    // Aggregate by tone
    const toneCounts: Record<string, number> = {};
    allLeads.forEach(lead => {
      const tone = lead.tone || 'N/A';
      toneCounts[tone] = (toneCounts[tone] || 0) + 1;
    });

    // Calculate average confidence
    const avgConfidence = allLeads.length > 0
      ? allLeads.reduce((sum, l) => sum + (l.confidence_score || 0), 0) / allLeads.length
      : 0;

    // Group by date for timeline
    const dailyCounts: Record<string, number> = {};
    allLeads.forEach(lead => {
      const date = new Date(lead.timestamp).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    // Language distribution
    const languageCounts = {
      en: allLeads.filter(l => l.language === 'en').length,
      fr: allLeads.filter(l => l.language === 'fr').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        total: allLeads.length,
        avgConfidence,
        intentCounts,
        urgencyCounts,
        toneCounts,
        dailyCounts,
        languageCounts,
      },
    });
  } catch (error) {
    return handleApiError(error, 'API');
  }
}

