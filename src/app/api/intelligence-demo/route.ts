/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { enhanceLeadScore, getIntelligenceInsights } from "../../../lib/intelligence-scoring";
import { supabase } from "../../../lib/supabase";

/**
 * Demo endpoint to show conversion intelligence in action
 * This demonstrates how the intelligence system works
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Intelligence Demo] Starting intelligence demonstration...');
    
    // Get a sample lead from the database
    const { data: leads, error } = await supabase
      .from('lead_memory')
      .select('*')
      .limit(1)
      .order('timestamp', { ascending: false });
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!leads || leads.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No leads found in database",
          demo_data: {
            sample_lead: null,
            intelligence_enhanced: false,
            patterns_available: 0
          }
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const sampleLead = leads[0];
    console.log('[Intelligence Demo] Using sample lead:', sampleLead.id);
    
    // Enhance the lead score with intelligence
    const enhancedScore = await enhanceLeadScore(sampleLead, 75); // Start with base score of 75
    
    // Get intelligence insights
    const insights = await getIntelligenceInsights(sampleLead);
    
    console.log('[Intelligence Demo] Enhanced score:', enhancedScore);
    console.log('[Intelligence Demo] Insights:', insights);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        demo_data: {
          sample_lead: {
            id: sampleLead.id,
            name: sampleLead.name,
            email: sampleLead.email,
            message: sampleLead.message?.substring(0, 100) + '...',
            intent: sampleLead.intent,
            tone: sampleLead.tone,
            urgency: sampleLead.urgency,
            confidence_score: sampleLead.confidence_score,
            language: sampleLead.language
          },
          intelligence_enhanced: true,
          enhanced_score: enhancedScore,
          insights: insights,
          patterns_available: enhancedScore.intelligence_factors.length
        }
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('[Intelligence Demo] ❌ Demo failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
