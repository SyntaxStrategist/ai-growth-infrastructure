/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './supabase';

export type ConversionPattern = {
  id?: number;
  pattern_type: string;
  pattern_data: any;
  conversion_rate: number;
  sample_size: number;
  created_at?: string;
};

export type LeadAnalysis = {
  id: string;
  message: string;
  intent: string | null;
  tone: string | null;
  urgency: string | null;
  confidence_score: number | null;
  language: string;
  timestamp: string;
  client_id: string | null;
};

/**
 * Analyze conversion patterns from converted leads
 * This runs silently in the background to build intelligence
 */
export async function analyzeConversionPatterns(): Promise<ConversionPattern[]> {
  try {
    console.log('[Conversion Intelligence] Starting pattern analysis...');
    
    // Get all converted leads
    const { data: convertedLeads, error: leadsError } = await supabase
      .from('lead_memory')
      .select('*')
      .eq('current_tag', 'Converted')
      .or('current_tag.eq.Converti');
    
    if (leadsError) {
      console.error('[Conversion Intelligence] Error fetching converted leads:', leadsError);
      return [];
    }
    
    if (!convertedLeads || convertedLeads.length === 0) {
      console.log('[Conversion Intelligence] No converted leads found');
      return [];
    }
    
    console.log(`[Conversion Intelligence] Analyzing ${convertedLeads.length} converted leads`);
    
    // Get all non-converted leads for comparison
    const { data: nonConvertedLeads, error: nonConvertedError } = await supabase
      .from('lead_memory')
      .select('*')
      .neq('current_tag', 'Converted')
      .neq('current_tag', 'Converti')
      .not('current_tag', 'is', null);
    
    if (nonConvertedError) {
      console.error('[Conversion Intelligence] Error fetching non-converted leads:', nonConvertedError);
      return [];
    }
    
    const totalLeads = (convertedLeads.length + (nonConvertedLeads?.length || 0));
    console.log(`[Conversion Intelligence] Total leads for analysis: ${totalLeads}`);
    
    // Analyze patterns
    const patterns: ConversionPattern[] = [];
    
    // 1. Tone Analysis
    const tonePattern = analyzeTonePatterns(convertedLeads, nonConvertedLeads || []);
    if (tonePattern) patterns.push(tonePattern);
    
    // 2. Intent Analysis
    const intentPattern = analyzeIntentPatterns(convertedLeads, nonConvertedLeads || []);
    if (intentPattern) patterns.push(intentPattern);
    
    // 3. Urgency Analysis
    const urgencyPattern = analyzeUrgencyPatterns(convertedLeads, nonConvertedLeads || []);
    if (urgencyPattern) patterns.push(urgencyPattern);
    
    // 4. Confidence Score Analysis
    const confidencePattern = analyzeConfidencePatterns(convertedLeads, nonConvertedLeads || []);
    if (confidencePattern) patterns.push(confidencePattern);
    
    // 5. Message Length Analysis
    const messageLengthPattern = analyzeMessageLengthPatterns(convertedLeads, nonConvertedLeads || []);
    if (messageLengthPattern) patterns.push(messageLengthPattern);
    
    // 6. Language Analysis
    const languagePattern = analyzeLanguagePatterns(convertedLeads, nonConvertedLeads || []);
    if (languagePattern) patterns.push(languagePattern);
    
    console.log(`[Conversion Intelligence] Generated ${patterns.length} patterns`);
    
    // Store patterns in database
    if (patterns.length > 0) {
      await storeConversionPatterns(patterns);
    }
    
    return patterns;
  } catch (error) {
    console.error('[Conversion Intelligence] Analysis failed:', error);
    return [];
  }
}

function analyzeTonePatterns(converted: any[], nonConverted: any[]): ConversionPattern | null {
  const convertedTones = converted.map(lead => lead.tone).filter(Boolean);
  const nonConvertedTones = nonConverted.map(lead => lead.tone).filter(Boolean);
  
  if (convertedTones.length === 0) return null;
  
  const toneCounts: { [key: string]: { converted: number; nonConverted: number } } = {};
  
  // Count converted tones
  convertedTones.forEach(tone => {
    if (!toneCounts[tone]) toneCounts[tone] = { converted: 0, nonConverted: 0 };
    toneCounts[tone].converted++;
  });
  
  // Count non-converted tones
  nonConvertedTones.forEach(tone => {
    if (!toneCounts[tone]) toneCounts[tone] = { converted: 0, nonConverted: 0 };
    toneCounts[tone].nonConverted++;
  });
  
  // Calculate conversion rates
  const toneRates: { [key: string]: number } = {};
  Object.keys(toneCounts).forEach(tone => {
    const total = toneCounts[tone].converted + toneCounts[tone].nonConverted;
    if (total > 0) {
      toneRates[tone] = toneCounts[tone].converted / total;
    }
  });
  
  // Find highest converting tone
  const bestTone = Object.keys(toneRates).reduce((a, b) => 
    toneRates[a] > toneRates[b] ? a : b
  );
  
  return {
    pattern_type: 'tone',
    pattern_data: {
      best_converting_tone: bestTone,
      conversion_rate: toneRates[bestTone],
      tone_rates: toneRates,
      sample_data: toneCounts
    },
    conversion_rate: toneRates[bestTone],
    sample_size: convertedTones.length + nonConvertedTones.length
  };
}

function analyzeIntentPatterns(converted: any[], nonConverted: any[]): ConversionPattern | null {
  const convertedIntents = converted.map(lead => lead.intent).filter(Boolean);
  const nonConvertedIntents = nonConverted.map(lead => lead.intent).filter(Boolean);
  
  if (convertedIntents.length === 0) return null;
  
  const intentCounts: { [key: string]: { converted: number; nonConverted: number } } = {};
  
  convertedIntents.forEach(intent => {
    if (!intentCounts[intent]) intentCounts[intent] = { converted: 0, nonConverted: 0 };
    intentCounts[intent].converted++;
  });
  
  nonConvertedIntents.forEach(intent => {
    if (!intentCounts[intent]) intentCounts[intent] = { converted: 0, nonConverted: 0 };
    intentCounts[intent].nonConverted++;
  });
  
  const intentRates: { [key: string]: number } = {};
  Object.keys(intentCounts).forEach(intent => {
    const total = intentCounts[intent].converted + intentCounts[intent].nonConverted;
    if (total > 0) {
      intentRates[intent] = intentCounts[intent].converted / total;
    }
  });
  
  const bestIntent = Object.keys(intentRates).reduce((a, b) => 
    intentRates[a] > intentRates[b] ? a : b
  );
  
  return {
    pattern_type: 'intent',
    pattern_data: {
      best_converting_intent: bestIntent,
      conversion_rate: intentRates[bestIntent],
      intent_rates: intentRates,
      sample_data: intentCounts
    },
    conversion_rate: intentRates[bestIntent],
    sample_size: convertedIntents.length + nonConvertedIntents.length
  };
}

function analyzeUrgencyPatterns(converted: any[], nonConverted: any[]): ConversionPattern | null {
  const convertedUrgency = converted.map(lead => lead.urgency).filter(Boolean);
  const nonConvertedUrgency = nonConverted.map(lead => lead.urgency).filter(Boolean);
  
  if (convertedUrgency.length === 0) return null;
  
  const urgencyCounts: { [key: string]: { converted: number; nonConverted: number } } = {};
  
  convertedUrgency.forEach(urgency => {
    if (!urgencyCounts[urgency]) urgencyCounts[urgency] = { converted: 0, nonConverted: 0 };
    urgencyCounts[urgency].converted++;
  });
  
  nonConvertedUrgency.forEach(urgency => {
    if (!urgencyCounts[urgency]) urgencyCounts[urgency] = { converted: 0, nonConverted: 0 };
    urgencyCounts[urgency].nonConverted++;
  });
  
  const urgencyRates: { [key: string]: number } = {};
  Object.keys(urgencyCounts).forEach(urgency => {
    const total = urgencyCounts[urgency].converted + urgencyCounts[urgency].nonConverted;
    if (total > 0) {
      urgencyRates[urgency] = urgencyCounts[urgency].converted / total;
    }
  });
  
  const bestUrgency = Object.keys(urgencyRates).reduce((a, b) => 
    urgencyRates[a] > urgencyRates[b] ? a : b
  );
  
  return {
    pattern_type: 'urgency',
    pattern_data: {
      best_converting_urgency: bestUrgency,
      conversion_rate: urgencyRates[bestUrgency],
      urgency_rates: urgencyRates,
      sample_data: urgencyCounts
    },
    conversion_rate: urgencyRates[bestUrgency],
    sample_size: convertedUrgency.length + nonConvertedUrgency.length
  };
}

function analyzeConfidencePatterns(converted: any[], nonConverted: any[]): ConversionPattern | null {
  const convertedConfidence = converted.map(lead => lead.confidence_score).filter(score => score !== null && score !== undefined);
  const nonConvertedConfidence = nonConverted.map(lead => lead.confidence_score).filter(score => score !== null && score !== undefined);
  
  if (convertedConfidence.length === 0) return null;
  
  const avgConvertedConfidence = convertedConfidence.reduce((a, b) => a + b, 0) / convertedConfidence.length;
  const avgNonConvertedConfidence = nonConvertedConfidence.reduce((a, b) => a + b, 0) / nonConvertedConfidence.length;
  
  return {
    pattern_type: 'confidence',
    pattern_data: {
      avg_converted_confidence: avgConvertedConfidence,
      avg_non_converted_confidence: avgNonConvertedConfidence,
      confidence_difference: avgConvertedConfidence - avgNonConvertedConfidence,
      converted_samples: convertedConfidence.length,
      non_converted_samples: nonConvertedConfidence.length
    },
    conversion_rate: avgConvertedConfidence,
    sample_size: convertedConfidence.length + nonConvertedConfidence.length
  };
}

function analyzeMessageLengthPatterns(converted: any[], nonConverted: any[]): ConversionPattern | null {
  const convertedLengths = converted.map(lead => lead.message?.length || 0);
  const nonConvertedLengths = nonConverted.map(lead => lead.message?.length || 0);
  
  if (convertedLengths.length === 0) return null;
  
  const avgConvertedLength = convertedLengths.reduce((a, b) => a + b, 0) / convertedLengths.length;
  const avgNonConvertedLength = nonConvertedLengths.reduce((a, b) => a + b, 0) / nonConvertedLengths.length;
  
  return {
    pattern_type: 'message_length',
    pattern_data: {
      avg_converted_length: avgConvertedLength,
      avg_non_converted_length: avgNonConvertedLength,
      length_difference: avgConvertedLength - avgNonConvertedLength,
      converted_samples: convertedLengths.length,
      non_converted_samples: nonConvertedLengths.length
    },
    conversion_rate: avgConvertedLength / (avgConvertedLength + avgNonConvertedLength),
    sample_size: convertedLengths.length + nonConvertedLengths.length
  };
}

function analyzeLanguagePatterns(converted: any[], nonConverted: any[]): ConversionPattern | null {
  const convertedLanguages = converted.map(lead => lead.language).filter(Boolean);
  const nonConvertedLanguages = nonConverted.map(lead => lead.language).filter(Boolean);
  
  if (convertedLanguages.length === 0) return null;
  
  const languageCounts: { [key: string]: { converted: number; nonConverted: number } } = {};
  
  convertedLanguages.forEach(lang => {
    if (!languageCounts[lang]) languageCounts[lang] = { converted: 0, nonConverted: 0 };
    languageCounts[lang].converted++;
  });
  
  nonConvertedLanguages.forEach(lang => {
    if (!languageCounts[lang]) languageCounts[lang] = { converted: 0, nonConverted: 0 };
    languageCounts[lang].nonConverted++;
  });
  
  const languageRates: { [key: string]: number } = {};
  Object.keys(languageCounts).forEach(lang => {
    const total = languageCounts[lang].converted + languageCounts[lang].nonConverted;
    if (total > 0) {
      languageRates[lang] = languageCounts[lang].converted / total;
    }
  });
  
  const bestLanguage = Object.keys(languageRates).reduce((a, b) => 
    languageRates[a] > languageRates[b] ? a : b
  );
  
  return {
    pattern_type: 'language',
    pattern_data: {
      best_converting_language: bestLanguage,
      conversion_rate: languageRates[bestLanguage],
      language_rates: languageRates,
      sample_data: languageCounts
    },
    conversion_rate: languageRates[bestLanguage],
    sample_size: convertedLanguages.length + nonConvertedLanguages.length
  };
}

async function storeConversionPatterns(patterns: ConversionPattern[]): Promise<void> {
  try {
    console.log('[Conversion Intelligence] Storing patterns in database...');
    
    const { error } = await supabase
      .from('conversion_patterns')
      .insert(patterns);
    
    if (error) {
      console.error('[Conversion Intelligence] Error storing patterns:', error);
    } else {
      console.log(`[Conversion Intelligence] Successfully stored ${patterns.length} patterns`);
    }
  } catch (error) {
    console.error('[Conversion Intelligence] Failed to store patterns:', error);
  }
}

/**
 * Get the latest conversion patterns for intelligence application
 */
export async function getLatestConversionPatterns(): Promise<ConversionPattern[]> {
  try {
    const { data, error } = await supabase
      .from('conversion_patterns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('[Conversion Intelligence] Error fetching patterns:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('[Conversion Intelligence] Failed to fetch patterns:', error);
    return [];
  }
}

/**
 * Calculate intelligence score for a lead based on conversion patterns
 */
export async function calculateIntelligenceScore(lead: LeadAnalysis): Promise<number> {
  try {
    const patterns = await getLatestConversionPatterns();
    if (patterns.length === 0) return 0;
    
    let score = 0;
    let factors = 0;
    
    patterns.forEach(pattern => {
      switch (pattern.pattern_type) {
        case 'tone':
          if (lead.tone && pattern.pattern_data.best_converting_tone === lead.tone) {
            score += pattern.conversion_rate * 10;
            factors++;
          }
          break;
          
        case 'intent':
          if (lead.intent && pattern.pattern_data.best_converting_intent === lead.intent) {
            score += pattern.conversion_rate * 10;
            factors++;
          }
          break;
          
        case 'urgency':
          if (lead.urgency && pattern.pattern_data.best_converting_urgency === lead.urgency) {
            score += pattern.conversion_rate * 10;
            factors++;
          }
          break;
          
        case 'confidence':
          if (lead.confidence_score !== null && lead.confidence_score >= pattern.pattern_data.avg_converted_confidence) {
            score += pattern.conversion_rate * 5;
            factors++;
          }
          break;
          
        case 'language':
          if (lead.language && pattern.pattern_data.best_converting_language === lead.language) {
            score += pattern.conversion_rate * 5;
            factors++;
          }
          break;
      }
    });
    
    return factors > 0 ? score / factors : 0;
  } catch (error) {
    console.error('[Conversion Intelligence] Failed to calculate intelligence score:', error);
    return 0;
  }
}
