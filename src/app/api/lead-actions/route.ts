/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { randomUUID } from "crypto";

import { handleApiError } from '../../../lib/error-handler';
// Translation mappings for action data
const tagTranslations = {
  // English to French
  'Converted': 'Converti',
  'Hot Lead': 'Lead chaud',
  'Cold Lead': 'Lead froid',
  'Warm Lead': 'Lead tiède',
  'Follow Up': 'Suivi',
  'Not Interested': 'Pas intéressé',
  'Interested': 'Intéressé',
  'Qualified': 'Qualifié',
  'Unqualified': 'Non qualifié',
  'Demo Scheduled': 'Démonstration programmée',
  'Demo Completed': 'Démonstration terminée',
  'Proposal Sent': 'Proposition envoyée',
  'Negotiating': 'Négociation',
  'Closed Won': 'Fermé gagné',
  'Closed Lost': 'Fermé perdu',
  // French to English
  'Converti': 'Converted',
  'Lead chaud': 'Hot Lead',
  'Lead froid': 'Cold Lead',
  'Lead tiède': 'Warm Lead',
  'Suivi': 'Follow Up',
  'Pas intéressé': 'Not Interested',
  'Intéressé': 'Interested',
  'Qualifié': 'Qualified',
  'Non qualifié': 'Unqualified',
  'Démonstration programmée': 'Demo Scheduled',
  'Démonstration terminée': 'Demo Completed',
  'Proposition envoyée': 'Proposal Sent',
  'Négociation': 'Negotiating',
  'Fermé gagné': 'Closed Won',
  'Fermé perdu': 'Closed Lost',
};

// Helper function to detect if text is in French
function isFrenchText(text: string): boolean {
  const frenchIndicators = ['é', 'è', 'ê', 'ë', 'à', 'â', 'ä', 'ç', 'ù', 'û', 'ü', 'ô', 'ö', 'î', 'ï'];
  const frenchWords = ['converti', 'démonstration', 'programmée', 'terminée', 'proposition', 'envoyée', 'négociation', 'fermé', 'gagné', 'perdu', 'intéressé', 'qualifié'];
  
  const lowerText = text.toLowerCase();
  const hasFrenchChars = frenchIndicators.some(char => lowerText.includes(char));
  const hasFrenchWords = frenchWords.some(word => lowerText.includes(word));
  
  return hasFrenchChars || hasFrenchWords;
}

// Translation function for action tags
function translateTag(value: string, targetLocale: string): string {
  if (!value) return value;
  
  const isValueFrench = isFrenchText(value);
  const isTargetFrench = targetLocale === 'fr';
  
  if (isTargetFrench && !isValueFrench) {
    // We need French, but value is in English - translate to French
    const translated = tagTranslations[value as keyof typeof tagTranslations] || value;
    if (translated !== value) {
      console.log(`[LeadActions] Translating tag from EN → FR: "${value}" → "${translated}"`);
    }
    return translated;
  } else if (!isTargetFrench && isValueFrench) {
    // We need English, but value is in French - translate to English
    const translated = tagTranslations[value as keyof typeof tagTranslations] || value;
    if (translated !== value) {
      console.log(`[LeadActions] Translating tag from FR → EN: "${value}" → "${translated}"`);
    }
    return translated;
  }
  
  return value;
}

// Main translation function for action data
function translateActionData(data: any[], locale: string): any[] {
  return data.map((action: any) => {
    const translatedAction = { ...action };
    
    // Translate tag field
    if (action.tag) {
      translatedAction.tag = translateTag(action.tag, locale);
    }
    
    return translatedAction;
  });
}

export interface LeadAction {
  id: string;
  lead_id: string;
  action: string;
  tag: string | null;
  performed_by: string;
  timestamp: string;
}

// POST /api/lead-actions - Log a lead action (delete, archive, tag)
export async function POST(req: NextRequest) {
  try {
    const { lead_id, action, tag, performed_by, reversion_reason, is_reversion } = await req.json();

    console.log(`[LeadActions] POST received - type: ${action}, lead_id: ${lead_id}`);
    if (is_reversion) {
      console.log(`[LeadActions] 🔄 Reversion detected - reason: ${reversion_reason}`);
    }

    if (!lead_id || !action) {
      console.error('[LeadActions] Missing required fields');
      return NextResponse.json(
        { success: false, message: "lead_id and action are required" },
        { status: 400 }
      );
    }

    // Validate action type
    if (!['delete', 'archive', 'tag', 'reactivate', 'permanent_delete'].includes(action)) {
      console.error(`[LeadActions] Invalid action type: ${action}`);
      return NextResponse.json(
        { success: false, message: `Invalid action type: ${action}` },
        { status: 400 }
      );
    }

    // Perform the actual lead action first
    if (action === 'delete') {
      console.log(`[LeadActions] Soft deleting lead ${lead_id}...`);
      
      const { error: deleteError } = await supabase
        .from('lead_memory')
        .update({ deleted: true })
        .eq('id', lead_id);

      console.log(`[LeadActions] Delete response:`, { error: deleteError || 'success' });

      if (deleteError) {
        console.error('[LeadActions] Failed to soft delete lead:', JSON.stringify(deleteError));
        return NextResponse.json(
          { success: false, message: "Error deleting lead", error: deleteError.message },
          { status: 500 }
        );
      }
    } else if (action === 'archive') {
      console.log(`[LeadActions] Archiving lead ${lead_id}...`);
      
      const { error: archiveError } = await supabase
        .from('lead_memory')
        .update({ archived: true })
        .eq('id', lead_id);

      console.log(`[LeadActions] Archive response:`, { error: archiveError || 'success' });

      if (archiveError) {
        console.error('[LeadActions] Failed to archive lead:', JSON.stringify(archiveError));
        return NextResponse.json(
          { success: false, message: "Error archiving lead", error: archiveError.message },
          { status: 500 }
        );
      }
    } else if (action === 'reactivate') {
      console.log(`[LeadActions] Reactivating lead ${lead_id}...`);
      
      const { error: reactivateError } = await supabase
        .from('lead_memory')
        .update({ archived: false, deleted: false })
        .eq('id', lead_id);

      console.log(`[LeadActions] Reactivate response:`, { error: reactivateError || 'success' });

      if (reactivateError) {
        console.error('[LeadActions] Failed to reactivate lead:', JSON.stringify(reactivateError));
        return NextResponse.json(
          { success: false, message: "Error reactivating lead", error: reactivateError.message },
          { status: 500 }
        );
      }
    } else if (action === 'tag') {
      console.log(`[LeadActions] Tagging lead ${lead_id} with ${tag}...`);
      
      // Check if this is a conversion tag or reversion
      const isConversion = tag === 'Converted' || tag === 'Converti';
      
      if (isConversion) {
        console.log(`[LeadActions] 🎯 CONVERSION EVENT DETECTED for lead ${lead_id}`);
      }
      
      if (is_reversion) {
        console.log(`[LeadActions] 🔄 REVERSION EVENT DETECTED for lead ${lead_id}`);
        console.log(`[LeadActions] Reversion reason: ${reversion_reason}`);
      }
      
      // Update current_tag in lead_memory
      const { error: tagError } = await supabase
        .from('lead_memory')
        .update({ current_tag: tag })
        .eq('id', lead_id);

      console.log(`[LeadActions] Tag update response:`, { error: tagError || 'success' });

      if (tagError) {
        console.error('[LeadActions] Failed to update tag in lead_memory:', JSON.stringify(tagError));
        return NextResponse.json(
          { success: false, message: "Error tagging lead", error: tagError.message },
          { status: 500 }
        );
      }
      
      // Fetch lead data for growth_brain logging (used for both conversion and reversion)
      const { data: leadData, error: fetchError } = await supabase
        .from('lead_memory')
        .select('*')
        .eq('id', lead_id)
        .single();
      
      // If conversion, log to growth_brain for learning loop
      if (isConversion && !fetchError && leadData) {
        try {
          console.log(`[LeadActions] Logging conversion to growth_brain...`);
          
          const learningSnapshot = {
            id: randomUUID(),
            event_type: 'conversion',
            lead_id: lead_id,
            intent: leadData.intent,
            tone: leadData.tone,
            urgency: leadData.urgency,
            confidence_score: leadData.confidence_score,
            conversion_tag: tag,
            timestamp: new Date().toISOString(),
          };
          
          const { error: growthError } = await supabase
            .from('growth_brain')
            .insert({
              id: learningSnapshot.id,
              learning_snapshot: learningSnapshot,
              created_at: new Date().toISOString(),
            });
          
          if (growthError) {
            console.error('[LeadActions] ⚠️ Failed to log conversion to growth_brain:', growthError);
          } else {
            console.log('[LeadActions] ✅ Conversion logged to growth_brain successfully');
          }
        } catch (conversionErr) {
          console.error('[LeadActions] ⚠️ Error during conversion logging:', conversionErr);
        }
      }
      
      // If reversion, log to growth_brain for learning loop
      if (is_reversion && !fetchError && leadData) {
        try {
          console.log(`[LeadActions] Logging reversion to growth_brain...`);
          
          const learningSnapshot = {
            id: randomUUID(),
            event_type: 'reversion',
            lead_id: lead_id,
            intent: leadData.intent,
            tone: leadData.tone,
            urgency: leadData.urgency,
            confidence_score: leadData.confidence_score,
            reversion_reason: reversion_reason,
            reverted_to_tag: tag,
            timestamp: new Date().toISOString(),
          };
          
          const { error: growthError } = await supabase
            .from('growth_brain')
            .insert({
              id: learningSnapshot.id,
              learning_snapshot: learningSnapshot,
              created_at: new Date().toISOString(),
            });
          
          if (growthError) {
            console.error('[LeadActions] ⚠️ Failed to log reversion to growth_brain:', growthError);
          } else {
            console.log('[LeadActions] ✅ Reversion logged to growth_brain successfully');
          }
        } catch (reversionErr) {
          console.error('[LeadActions] ⚠️ Error during reversion logging:', reversionErr);
        }
      }
    } else if (action === 'permanent_delete') {
      console.log(`[LeadActions] PERMANENTLY deleting lead ${lead_id}...`);
      
      // First, delete all related actions
      const { error: actionsDeleteError } = await supabase
        .from('lead_actions')
        .delete()
        .eq('lead_id', lead_id);

      if (actionsDeleteError) {
        console.error('[LeadActions] Failed to delete related actions:', JSON.stringify(actionsDeleteError));
      }

      // Then permanently delete the lead record
      const { error: permanentDeleteError } = await supabase
        .from('lead_memory')
        .delete()
        .eq('id', lead_id);

      console.log(`[LeadActions] Permanent delete response:`, { error: permanentDeleteError || 'success' });

      if (permanentDeleteError) {
        console.error('[LeadActions] Failed to permanently delete lead:', JSON.stringify(permanentDeleteError));
        return NextResponse.json(
          { success: false, message: "Error permanently deleting lead", error: permanentDeleteError.message },
          { status: 500 }
        );
      }

      // For permanent delete, we don't log to lead_actions (record is gone)
      console.log(`[LeadActions] Lead permanently deleted - no action log created`);
      return NextResponse.json({ 
        success: true, 
        message: 'Lead permanently deleted successfully',
        permanent: true 
      });
    }

    // Log the action to lead_actions table
    console.log('[LeadActions] ============================================');
    console.log('[LeadActions] Logging action to lead_actions table...');
    console.log('[LeadActions] ============================================');
    
    const actionId = randomUUID();
    const isConversion = tag === 'Converted' || tag === 'Converti';
    const logRecord: any = {
      id: actionId,
      lead_id,
      action,
      tag: tag || null,
      performed_by: performed_by || 'admin',
      conversion_outcome: isConversion || null,
    };
    
    // Add reversion_reason if this is a reversion
    if (is_reversion && reversion_reason) {
      logRecord.reversion_reason = reversion_reason;
      // Set conversion_outcome to false for reversions
      logRecord.conversion_outcome = false;
    }
    
    console.log('[LeadActions] Action log record to insert:', {
      id: logRecord.id,
      lead_id: logRecord.lead_id,
      action: logRecord.action,
      tag: logRecord.tag || 'null',
      performed_by: logRecord.performed_by,
      conversion_outcome: logRecord.conversion_outcome,
      reversion_reason: logRecord.reversion_reason || 'null',
      timestamp: 'AUTO (NOW())',
    });
    
    const insertStart = Date.now();
    const { data: logData, error: logError } = await supabase
      .from('lead_actions')
      .insert(logRecord)
      .select()
      .single();
    const insertDuration = Date.now() - insertStart;

    console.log('[LeadActions] INSERT to lead_actions completed in', insertDuration, 'ms');
    console.log('[LeadActions] INSERT result:', {
      success: !logError,
      hasData: !!logData,
      error: logError ? {
        code: logError.code,
        message: logError.message,
        details: logError.details,
        hint: logError.hint,
      } : null,
    });

    if (logError) {
      console.error('[LeadActions] ============================================');
      console.error('[LeadActions] ❌ Failed to log lead action');
      console.error('[LeadActions] ============================================');
      console.error('[LeadActions] Error code:', logError.code);
      console.error('[LeadActions] Error message:', logError.message);
      console.error('[LeadActions] Error details:', logError.details);
      console.error('[LeadActions] Error hint:', logError.hint);
      console.error('[LeadActions] Full error object:', JSON.stringify(logError, null, 2));
      console.error('[LeadActions] ============================================');
      console.error('[LeadActions] Record that failed to insert:');
      console.error(JSON.stringify(logRecord, null, 2));
      console.error('[LeadActions] ============================================');
      // Don't fail the request if logging fails - the main action succeeded
      console.warn('[LeadActions] ⚠️  Main action succeeded but logging failed');
    } else {
      console.log('[LeadActions] ✅ Action logged successfully');
      console.log('[LeadActions] Log ID:', logData?.id);
      console.log('[LeadActions] Timestamp:', logData?.timestamp);
    }

    // Return success with appropriate message
    let message = '';
    switch (action) {
      case 'delete':
        message = 'Lead deleted successfully';
        break;
      case 'archive':
        message = 'Lead archived successfully';
        break;
      case 'tag':
        message = `Lead tagged successfully`;
        break;
      case 'reactivate':
        message = 'Lead reactivated successfully';
        break;
    }

    console.log(`[LeadActions] ${message}`);
    return NextResponse.json({ success: true, message, data: logData });
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}

// GET /api/lead-actions - Fetch recent lead actions
export async function GET(req: NextRequest) {
  try {
    console.log('[LeadActions] ============================================');
    console.log('[LeadActions] GET /api/lead-actions triggered');
    console.log('[LeadActions] ============================================');
    
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);
    const clientId = url.searchParams.get('clientId');
    const locale = url.searchParams.get('locale') || 'en';
    
    console.log('[LeadActions] Query params:', {
      limit,
      clientId: clientId || 'all (admin)',
      locale,
      order: 'timestamp DESC',
    });

    const queryStart = Date.now();
    
    // If clientId provided, need to resolve to internal UUID first
    let query;
    if (clientId) {
      console.log('[LeadActions] Resolving public client_id:', clientId);
      
      // First, resolve the public client_id to internal UUID
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('client_id', clientId)
        .single();
      
      if (clientError || !clientData) {
        console.error('[LeadActions] ❌ Client not found:', clientId);
        return NextResponse.json(
          { success: false, error: 'Client not found' },
          { status: 404 }
        );
      }
      
      const clientUuid = clientData.id;
      console.log('[LeadActions] Resolved → internal UUID:', clientUuid);
      
      // Build query with internal UUID filtering
      query = supabase
        .from('lead_actions')
        .select('*')
        .eq('client_id', clientUuid)
        .order('timestamp', { ascending: false })
        .limit(limit);
    } else {
      // Admin mode - get all actions
      query = supabase
        .from('lead_actions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);
    }
    
    const { data, error } = await query;
    const queryDuration = Date.now() - queryStart;

    console.log('[LeadActions] Query completed in', queryDuration, 'ms');
    console.log('[LeadActions] Query result:', {
      success: !error,
      rowCount: data?.length || 0,
      hasError: !!error,
    });
    
    if (clientId) {
      console.log('[LeadActions] ✅ Query executed successfully with resolved client UUID');
    }

    if (error) {
      console.error('[LeadActions] ============================================');
      console.error('[LeadActions] ❌ Query FAILED');
      console.error('[LeadActions] ============================================');
      console.error('[LeadActions] Error code:', error.code);
      console.error('[LeadActions] Error message:', error.message);
      console.error('[LeadActions] Error details:', error.details);
      console.error('[LeadActions] Error hint:', error.hint);
      console.error('[LeadActions] Full error object:', JSON.stringify(error, null, 2));
      console.error('[LeadActions] ============================================');
      throw error;
    }

    if (data && data.length > 0) {
      console.log('[LeadActions] ✅ Found', data.length, 'recent actions');
      console.log('[LeadActions] Sample (first action):', {
        id: data[0].id,
        action: data[0].action,
        lead_id: data[0].lead_id,
        tag: data[0].tag || 'null',
        performed_by: data[0].performed_by,
        timestamp: data[0].timestamp,
      });
    } else {
      console.log('[LeadActions] ℹ️  No actions found in lead_actions table');
    }

    // Apply locale-aware translation to action data
    console.log(`[LeadActions] Locale detected: ${locale}`);
    const translatedData = translateActionData(data, locale);
    console.log('[LeadActions] ✅ Translation applied successfully');

    console.log('[LeadActions] ============================================');
    return NextResponse.json({ success: true, data: translatedData });
  } catch (error) {
    return handleApiError(error, 'API');
  }
}
