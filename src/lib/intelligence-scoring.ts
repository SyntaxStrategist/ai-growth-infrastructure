/* eslint-disable @typescript-eslint/no-explicit-any */
import { calculateIntelligenceScore, getLatestConversionPatterns } from './conversion-intelligence';

export type EnhancedLeadScore = {
  original_score: number;
  intelligence_score: number;
  total_score: number;
  intelligence_factors: string[];
  conversion_likelihood: number;
};

/**
 * Enhance lead scoring with conversion intelligence
 * This function adds intelligence-based scoring to existing lead scores
 */
export async function enhanceLeadScore(
  lead: any,
  originalScore: number = 0
): Promise<EnhancedLeadScore> {
  try {
    // Get intelligence score based on conversion patterns
    const intelligenceScore = await calculateIntelligenceScore({
      id: lead.id,
      message: lead.message || '',
      intent: lead.intent,
      tone: lead.tone,
      urgency: lead.urgency,
      confidence_score: lead.confidence_score,
      language: lead.language || 'en',
      timestamp: lead.timestamp,
      client_id: lead.client_id
    });
    
    // Get conversion patterns for additional insights
    const patterns = await getLatestConversionPatterns();
    
    // Calculate intelligence factors
    const intelligenceFactors: string[] = [];
    let conversionLikelihood = 0;
    
    if (patterns.length > 0) {
      patterns.forEach(pattern => {
        switch (pattern.pattern_type) {
          case 'tone':
            if (lead.tone && pattern.pattern_data.best_converting_tone === lead.tone) {
              intelligenceFactors.push(`High-converting tone: ${lead.tone}`);
              conversionLikelihood += pattern.conversion_rate * 0.3;
            }
            break;
            
          case 'intent':
            if (lead.intent && pattern.pattern_data.best_converting_intent === lead.intent) {
              intelligenceFactors.push(`High-converting intent: ${lead.intent}`);
              conversionLikelihood += pattern.conversion_rate * 0.3;
            }
            break;
            
          case 'urgency':
            if (lead.urgency && pattern.pattern_data.best_converting_urgency === lead.urgency) {
              intelligenceFactors.push(`High-converting urgency: ${lead.urgency}`);
              conversionLikelihood += pattern.conversion_rate * 0.2;
            }
            break;
            
          case 'confidence':
            if (lead.confidence_score !== null && pattern.pattern_data.avg_converted_confidence) {
              if (lead.confidence_score >= pattern.pattern_data.avg_converted_confidence) {
                intelligenceFactors.push(`Above-average confidence: ${lead.confidence_score}`);
                conversionLikelihood += pattern.conversion_rate * 0.1;
              }
            }
            break;
            
          case 'language':
            if (lead.language && pattern.pattern_data.best_converting_language === lead.language) {
              intelligenceFactors.push(`High-converting language: ${lead.language}`);
              conversionLikelihood += pattern.conversion_rate * 0.1;
            }
            break;
        }
      });
    }
    
    // Calculate total score (original + intelligence boost)
    const totalScore = originalScore + (intelligenceScore * 0.1); // 10% boost from intelligence
    
    return {
      original_score: originalScore,
      intelligence_score: intelligenceScore,
      total_score: Math.min(totalScore, 100), // Cap at 100
      intelligence_factors: intelligenceFactors,
      conversion_likelihood: Math.min(conversionLikelihood, 1.0) // Cap at 100%
    };
    
  } catch (error) {
    console.error('[Intelligence Scoring] Failed to enhance lead score:', error);
    
    // Return original score if intelligence fails
    return {
      original_score: originalScore,
      intelligence_score: 0,
      total_score: originalScore,
      intelligence_factors: [],
      conversion_likelihood: 0
    };
  }
}

/**
 * Get intelligence insights for a lead
 * This provides human-readable insights about why a lead might convert
 */
export async function getIntelligenceInsights(lead: any): Promise<string[]> {
  try {
    const patterns = await getLatestConversionPatterns();
    const insights: string[] = [];
    
    if (patterns.length === 0) {
      return ['No conversion patterns available yet'];
    }
    
    patterns.forEach(pattern => {
      switch (pattern.pattern_type) {
        case 'tone':
          if (lead.tone && pattern.pattern_data.best_converting_tone === lead.tone) {
            insights.push(`✅ This lead has a high-converting tone (${lead.tone})`);
          } else if (lead.tone) {
            insights.push(`ℹ️ Tone "${lead.tone}" - best converting tone is "${pattern.pattern_data.best_converting_tone}"`);
          }
          break;
          
        case 'intent':
          if (lead.intent && pattern.pattern_data.best_converting_intent === lead.intent) {
            insights.push(`✅ This lead has a high-converting intent (${lead.intent})`);
          } else if (lead.intent) {
            insights.push(`ℹ️ Intent "${lead.intent}" - best converting intent is "${pattern.pattern_data.best_converting_intent}"`);
          }
          break;
          
        case 'urgency':
          if (lead.urgency && pattern.pattern_data.best_converting_urgency === lead.urgency) {
            insights.push(`✅ This lead has high-converting urgency (${lead.urgency})`);
          } else if (lead.urgency) {
            insights.push(`ℹ️ Urgency "${lead.urgency}" - best converting urgency is "${pattern.pattern_data.best_converting_urgency}"`);
          }
          break;
          
        case 'confidence':
          if (lead.confidence_score !== null && pattern.pattern_data.avg_converted_confidence) {
            if (lead.confidence_score >= pattern.pattern_data.avg_converted_confidence) {
              insights.push(`✅ Confidence score (${lead.confidence_score}) is above average for conversions`);
            } else {
              insights.push(`ℹ️ Confidence score (${lead.confidence_score}) is below average for conversions`);
            }
          }
          break;
      }
    });
    
    return insights.length > 0 ? insights : ['No specific intelligence insights available'];
    
  } catch (error) {
    console.error('[Intelligence Insights] Failed to get insights:', error);
    return ['Error generating intelligence insights'];
  }
}
