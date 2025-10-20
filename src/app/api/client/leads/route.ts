import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { getClientDataAndLeads, getClientDataAndAllLeads } from '../../../../lib/query-batching';
import { resolveClientId, validateClientId } from '../../../../lib/client-resolver';
import { translateText } from '../../../../lib/translation-service';
import { handleApiError } from '../../../../lib/error-handler';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to translate text values using 3-layer service
async function translateValue(value: string, locale: string, type: 'tone' | 'intent' | 'urgency'): Promise<string> {
  if (!value) return value;
  
  try {
    return await translateText(value, locale, {
      context: `lead_${type}`,
      priority: 7
    });
  } catch (error) {
    console.error(`[ClientLeads] Translation failed for ${type}:`, error);
    return value; // Fallback to original
  }
}

// Helper function to detect if text is in French
function detectFrench(text: string): boolean {
  if (!text) return false;
  
  const frenchIndicators = [
    'entreprise', 'demande', 'besoin', 'équipe', 'secteur',
    'québec', 'montréal', 'rénovation', 'automatisation',
    'nous', 'pour', 'avec', 'dans', 'cette', 'sont'
  ];
  
  const textLower = text.toLowerCase();
  const frenchMatches = frenchIndicators.filter(indicator => textLower.includes(indicator)).length;
  
  return frenchMatches >= 2; // At least 2 French indicators
}

// Helper function to detect if text is in English
function detectEnglish(text: string): boolean {
  if (!text) return false;
  
  const englishIndicators = [
    'company', 'business', 'need', 'team', 'looking',
    'automation', 'inquiry', 'support', 'service',
    'we', 'for', 'with', 'this', 'are', 'have'
  ];
  
  const textLower = text.toLowerCase();
  const englishMatches = englishIndicators.filter(indicator => textLower.includes(indicator)).length;
  
  return englishMatches >= 2; // At least 2 English indicators
}


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const locale = searchParams.get('locale') || 'en';
    const status = searchParams.get('status') || 'active';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');

    console.log('[ClientResolver] ============================================');
    console.log('[ClientResolver] Request received');
    console.log('[ClientResolver] Input Client ID:', clientId);
    console.log('[ClientResolver] Locale:', locale);
    console.log('[ClientResolver] Status filter:', status);

    // Validate clientId format
    if (!clientId || clientId.trim() === '' || clientId === 'unknown' || clientId === 'null' || clientId === 'undefined') {
      console.error('[ClientResolver] ❌ Missing or invalid clientId parameter:', clientId);
      return NextResponse.json(
        { success: false, error: 'Valid clientId required' },
        { status: 400 }
      );
    }

    // Validate client ID format
    const validation = validateClientId(clientId);
    if (!validation.isValid) {
      console.error('[ClientResolver] ❌ Invalid client ID format:', clientId, validation.message);
      return NextResponse.json(
        { success: false, error: `Invalid client ID format: ${validation.message}` },
        { status: 400 }
      );
    }

    console.log(`[ClientResolver] ✅ Client ID format valid (${validation.type}):`, clientId);

    // Resolve client ID to UUID using universal resolver
    let clientUuid: string;
    try {
      clientUuid = await resolveClientId(clientId);
      console.log(`[ClientResolver] ✅ Resolved client ID: "${clientId}" → "${clientUuid}"`);
    } catch (error) {
      console.error('[ClientResolver] ❌ Failed to resolve client ID:', error);
      return NextResponse.json(
        { success: false, error: `Failed to resolve client ID: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 404 }
      );
    }

    // Use batched query to get client data and leads with resolved UUID
    const { client, leads: leadsQuery } = await getClientDataAndLeads(clientUuid, status, page, limit);
    
    if (client.error || !client.data) {
      console.error('[ClientResolver] ❌ Client not found after resolution:', clientUuid);
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }
    
    console.log('[ClientResolver] ✅ Client data retrieved successfully');
    
    // Use batched query results
    const { data: leadActions, error: actionsError } = leadsQuery;
    
    console.log('[E2E-Test] [ClientLeads] Batched query executed');
    console.log('[E2E-Test] [ClientLeads] Supabase response:', {
      hasData: !!leadActions,
      rowCount: leadActions?.length || 0,
      hasError: !!actionsError,
      errorMessage: actionsError?.message || 'none',
      errorCode: actionsError?.code || 'none',
    });

    if (actionsError) {
      console.error('[E2E-Test] [ClientLeads] ❌ Database error:', actionsError);
      console.error('[E2E-Test] [ClientLeads] ❌ Error details:', {
        message: actionsError.message,
        code: actionsError.code,
        hint: actionsError.hint,
        details: actionsError.details,
      });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leads: ' + actionsError.message },
        { status: 500 }
      );
    }

    // Transform the joined data
    const leadsRaw = (leadActions || [])
      .filter(action => {
        const leadMemory = Array.isArray(action.lead_memory) ? action.lead_memory[0] : action.lead_memory;
        if (!leadMemory) return false;
        
        // Filter by status
        if (status === 'active') {
          return !leadMemory.deleted && !leadMemory.archived;
        } else if (status === 'archived') {
          return leadMemory.archived && !leadMemory.deleted;
        } else if (status === 'deleted') {
          return leadMemory.deleted;
        }
        return true;
      })
      .map(action => {
        const leadMemory = Array.isArray(action.lead_memory) ? action.lead_memory[0] : action.lead_memory;
        return {
          ...leadMemory,
          client_id: action.client_id,
          action_tag: action.tag,
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Translate leads based on locale
    console.log('[ClientLeads] 🔄 Translating', leadsRaw.length, 'leads to locale:', locale.toUpperCase());
    console.log('[ClientLeads] Target language:', locale === 'fr' ? 'French' : 'English');
    console.log('');
    
    const leads = await Promise.all(leadsRaw.map(async (lead, index) => {
      console.log(`[ClientLeads] [${index + 1}/${leadsRaw.length}] Processing lead: ${lead.name} (original: ${lead.language})`);
      
      // Translate ai_summary to match dashboard locale
      const translatedSummary = await translateText(
        lead.ai_summary || '',
        locale,
        {
          context: 'lead_ai_summary',
          priority: 8
        }
      );
      
      // Translate relationship_insight to match dashboard locale
      const translatedInsight = lead.relationship_insight
        ? await translateText(
            lead.relationship_insight,
            locale,
            {
              context: 'lead_relationship_insight',
              priority: 9
            }
          )
        : undefined;
      
      // Translate values
      const translatedTone = await translateValue(lead.tone || '', locale, 'tone');
      const translatedIntent = await translateValue(lead.intent || '', locale, 'intent');
      const translatedUrgency = await translateValue(lead.urgency || '', locale, 'urgency');
      
      console.log(`[ClientLeads]   → tone: "${lead.tone}" → "${translatedTone}"`);
      console.log(`[ClientLeads]   → intent: "${lead.intent}" → "${translatedIntent}"`);
      console.log(`[ClientLeads]   → urgency: "${lead.urgency}" → "${translatedUrgency}"`);
      console.log('');
      
      return {
        ...lead,
        ai_summary: translatedSummary,
        relationship_insight: translatedInsight,
        tone: translatedTone,
        intent: translatedIntent,
        urgency: translatedUrgency,
      };
    }));

    console.log('[E2E-Test] [ClientLeads] ✅ Found', leadActions?.length || 0, 'lead actions for client', clientId);
    console.log('[E2E-Test] [ClientLeads] ✅ Filtered to', leads.length, status, 'leads');
    console.log('[E2E-Test] [ClientLeads] ✅ Client-scoped data loaded successfully');
    
    // Calculate pagination
    const totalLeads = leads.length;
    const totalPages = Math.ceil(totalLeads / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLeads = leads.slice(startIndex, endIndex);
    
    console.log('[E2E-Test] [ClientLeads] 📄 Pagination:', {
      page,
      limit,
      totalLeads,
      totalPages,
      startIndex,
      endIndex,
      returnedLeads: paginatedLeads.length
    });
    
    if (paginatedLeads.length > 0) {
      console.log('[E2E-Test] [ClientLeads] Sample lead:', {
        id: paginatedLeads[0].id,
        name: paginatedLeads[0].name,
        email: paginatedLeads[0].email,
        intent: paginatedLeads[0].intent,
        client_id: paginatedLeads[0].client_id,
      });
    }

    return NextResponse.json({
      success: true,
      data: paginatedLeads,
      pagination: {
        page,
        limit,
        totalLeads,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60', // Cache for 1 minute
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    return handleApiError(error, 'API');
  }
}

