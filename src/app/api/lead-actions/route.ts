/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { randomUUID } from "crypto";

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
    console.error('[LeadActions] Error processing lead action:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal server error", 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
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
    
    console.log('[LeadActions] Query params:', {
      limit,
      clientId: clientId || 'all (admin)',
      order: 'timestamp DESC',
    });

    const queryStart = Date.now();
    
    // Build query with optional client filtering
    let query = supabase
      .from('lead_actions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    // Filter by clientId if provided (client dashboard mode)
    if (clientId) {
      console.log('[LeadActions] Filtering by client_id:', clientId);
      query = query.eq('client_id', clientId);
    }
    
    const { data, error } = await query;
    const queryDuration = Date.now() - queryStart;

    console.log('[LeadActions] Query completed in', queryDuration, 'ms');
    console.log('[LeadActions] Query result:', {
      success: !error,
      rowCount: data?.length || 0,
      hasError: !!error,
    });

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

    console.log('[LeadActions] ============================================');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[LeadActions] ============================================');
    console.error('[LeadActions] ❌ GET request failed');
    console.error('[LeadActions] ============================================');
    console.error('[LeadActions] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[LeadActions] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[LeadActions] Full error object:', error);
    console.error('[LeadActions] ============================================');
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
