import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { resolveClientId, validateClientId } from '../../../../lib/client-resolver';

import { handleApiError } from '../../../../lib/error-handler';

// Normalization functions to handle bilingual data
function normalizeUrgency(urgency: string): 'High' | 'Medium' | 'Low' {
  const normalized = urgency.toLowerCase().trim();
  if (normalized === 'high' || normalized === 'élevée' || normalized === 'elevée') {
    return 'High';
  } else if (normalized === 'medium' || normalized === 'moyenne') {
    return 'Medium';
  }
  return 'Low'; // Default to Low for 'low', 'faible', etc.
}

function normalizeTone(tone: string): string {
  const normalized = tone.toLowerCase().trim();
  
  // Map French tones to English equivalents
  const toneMap: Record<string, string> = {
    'formel': 'Formal',
    'formal': 'Formal',
    'urgent': 'Urgent',
    'urgente': 'Urgent',
    'casual': 'Casual',
    'décontracté': 'Casual',
    'decontracte': 'Casual',
    'professionnel': 'Professional',
    'professional': 'Professional',
    'amical': 'Friendly',
    'friendly': 'Friendly',
    'neutre': 'Neutral',
    'neutral': 'Neutral',
  };
  
  // Return mapped value with first letter capitalized, or capitalize original
  return toneMap[normalized] || tone.charAt(0).toUpperCase() + tone.slice(1).toLowerCase();
}

function normalizeIntent(intent: string): string {
  const trimmed = intent.trim();
  
  // Common French to English mappings
  const intentMap: Record<string, string> = {
    // B2B and Partnership
    'partenariat b2b': 'B2B partnership',
    'partenariat B2B': 'B2B partnership',
    'Partenariat B2B': 'B2B partnership',
    'partenariat': 'Partnership',
    'partenariat pour mise à l\'échelle ia': 'B2B partnership for AI scaling',
    'partenariat pour services de charpente et cloison sèche': 'B2B partnership for framing and drywall services',
    
    // Information and Consultation
    'demande de renseignements': 'Information request',
    'demande d\'information': 'Information request',
    'consultation': 'Consultation',
    'question': 'Question',
    'inquiry': 'Inquiry',
    
    // Quote and Pricing
    'devis': 'Quote request',
    'quote': 'Quote request',
    'tarification': 'Pricing',
    'demande de coût': 'Cost inquiry',
    
    // Sales and Marketing
    'optimisation du pipeline de vente': 'Sales pipeline optimization',
    'intérêt pour l\'automatisation marketing': 'Marketing automation interest',
    'qualification des prospects': 'Lead qualification',
    'automatisation des ventes': 'Sales automation',
    
    // Technical and Support
    'support technique': 'Technical support',
    'intégration': 'Integration',
    'implémentation': 'Implementation',
    'configuration': 'Setup',
    
    // General business
    'demande commerciale': 'Business inquiry',
    'demande de service': 'Service inquiry',
    'demande générale': 'General inquiry',
    'suivi': 'Follow-up',
    
    // AI and Automation specific
    'intégration ia': 'AI integration',
    'automatisation ia': 'AI automation',
    'mise à l\'échelle ia': 'AI scaling',
    'consultation ia': 'AI consultation',
    
    // Default fallbacks
    'inconnu': 'Unknown',
    'autre': 'Other'
  };
  
  const normalized = trimmed.toLowerCase();
  if (intentMap[normalized]) {
    return intentMap[normalized];
  }
  
  // Capitalize first letter of original
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

// Translation functions for display
function translateUrgency(urgency: 'High' | 'Medium' | 'Low', locale: string): string {
  if (locale === 'fr') {
    const translations: Record<string, string> = {
      'High': 'Élevée',
      'Medium': 'Moyenne',
      'Low': 'Faible',
    };
    return translations[urgency] || urgency;
  }
  return urgency;
}

function translateTone(tone: string, locale: string): string {
  if (locale === 'fr') {
    const translations: Record<string, string> = {
      'Formal': 'Formel',
      'Urgent': 'Urgent',
      'Casual': 'Décontracté',
      'Professional': 'Professionnel',
      'Friendly': 'Amical',
      'Neutral': 'Neutre',
    };
    return translations[tone] || tone;
  }
  return tone;
}

function translateIntent(intent: string, locale: string): string {
  if (locale === 'fr') {
    const translations: Record<string, string> = {
      // B2B and Partnership related
      'B2B partnership': 'Partenariat B2B',
      'B2b partnership': 'Partenariat B2B',
      'Partnership': 'Partenariat',
      'B2B partnership for AI scaling': 'Partenariat B2B pour mise à l\'échelle IA',
      'B2B partnership for framing and drywall services': 'Partenariat B2B pour services de charpente et cloison sèche',
      
      // Information and Consultation
      'Information request': 'Demande d\'information',
      'Consultation': 'Consultation',
      'Inquiry': 'Demande de renseignements',
      'Question': 'Question',
      
      // Quote and Pricing
      'Quote request': 'Devis',
      'Quote': 'Devis',
      'Pricing': 'Tarification',
      'Cost inquiry': 'Demande de coût',
      
      // Sales and Marketing
      'Sales pipeline optimization': 'Optimisation du pipeline de vente',
      'Marketing automation interest': 'Intérêt pour l\'automatisation marketing',
      'Lead qualification': 'Qualification des prospects',
      'Sales automation': 'Automatisation des ventes',
      
      // Technical and Support
      'Technical support': 'Support technique',
      'Integration': 'Intégration',
      'Implementation': 'Implémentation',
      'Setup': 'Configuration',
      
      // General business
      'Business inquiry': 'Demande commerciale',
      'Service inquiry': 'Demande de service',
      'General inquiry': 'Demande générale',
      'Follow-up': 'Suivi',
      
      // AI and Automation specific
      'AI integration': 'Intégration IA',
      'AI automation': 'Automatisation IA',
      'AI scaling': 'Mise à l\'échelle IA',
      'AI consultation': 'Consultation IA',
      
      // Default fallback
      'Unknown': 'Inconnu',
      'Other': 'Autre'
    };
    
    // Try exact match first
    if (translations[intent]) {
      return translations[intent];
    }
    
    // Try case-insensitive match
    const lowerIntent = intent.toLowerCase();
    for (const [key, value] of Object.entries(translations)) {
      if (key.toLowerCase() === lowerIntent) {
        return value;
      }
    }
    
    // If no translation found, return original intent
    return intent;
  }
  return intent;
}
export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('clientId');
    const locale = req.nextUrl.searchParams.get('locale'); // Optional: 'en' or 'fr'
    
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID required' },
        { status: 400 }
      );
    }
    
    console.log('[ClientInsights] Fetching insights for client:', clientId);
    console.log('[ClientInsights] Locale filter:', locale || 'none (all languages)');
    
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
    
    // Fetch ALL leads data from lead_memory table using the resolved lead IDs
    // No language filter - we want all leads, then normalize/translate for display
    const { data: leads, error } = await supabase
      .from('lead_memory')
      .select('*')
      .in('id', leadIds)
      .eq('deleted', false);
    
    console.log('[ClientInsights] Fetched all leads (no language filter), will normalize and translate for locale:', locale || 'none');
    
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
    
    // Normalize data first (consolidate bilingual values), then translate for display
    
    // Intent distribution - normalize to English, then translate
    const normalizedIntentCounts: Record<string, number> = {};
    leads.forEach(lead => {
      const rawIntent = lead.intent || 'Unknown';
      const normalized = normalizeIntent(rawIntent);
      normalizedIntentCounts[normalized] = (normalizedIntentCounts[normalized] || 0) + 1;
    });
    
    // Translate intents for display based on locale
    const intentCounts: Record<string, number> = {};
    Object.entries(normalizedIntentCounts).forEach(([intent, count]) => {
      const translated = locale ? translateIntent(intent, locale) : intent;
      intentCounts[translated] = count;
    });
    
    // Urgency breakdown - normalize first
    const normalizedUrgencyCounts = { high: 0, medium: 0, low: 0 };
    leads.forEach(lead => {
      const rawUrgency = lead.urgency || 'Low';
      const normalized = normalizeUrgency(rawUrgency);
      if (normalized === 'High') normalizedUrgencyCounts.high++;
      else if (normalized === 'Medium') normalizedUrgencyCounts.medium++;
      else normalizedUrgencyCounts.low++;
    });
    
    // Translate urgency labels for display
    const urgencyCounts = {
      high: normalizedUrgencyCounts.high,
      medium: normalizedUrgencyCounts.medium,
      low: normalizedUrgencyCounts.low
    };
    
    // Tone analysis - normalize to English, then translate
    const normalizedToneCounts: Record<string, number> = {};
    leads.forEach(lead => {
      const rawTone = lead.tone || 'neutral';
      const normalized = normalizeTone(rawTone);
      normalizedToneCounts[normalized] = (normalizedToneCounts[normalized] || 0) + 1;
    });
    
    // Translate tones for display based on locale
    const toneCounts: Record<string, number> = {};
    Object.entries(normalizedToneCounts).forEach(([tone, count]) => {
      const translated = locale ? translateTone(tone, locale) : tone;
      toneCounts[translated] = count;
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
      avgConfidence: Math.round(avgConfidence * 100), // Convert decimal to percentage (0.5 → 50)
      intentCounts,
      urgencyCounts,
      toneCounts,
      dailyCounts,
      languageCounts
    };
    
    console.log('[ClientInsights] ✅ Insights calculated successfully');
    console.log('[ClientInsights] Total leads (all languages):', total);
    console.log('[ClientInsights] Average confidence:', insights.avgConfidence + '%');
    console.log('[ClientInsights] Display locale:', locale || 'en (default)');
    console.log('[ClientInsights] Normalized and translated data for display');
    return NextResponse.json({ success: true, data: insights });
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}
