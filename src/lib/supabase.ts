/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import { createClient } from '@supabase/supabase-js';
import { createFailoverSupabaseClient, getFailoverStatus } from './failover';

export type HistoryEntry = {
  value: string | number;
  timestamp: string;
};

export type LeadMemoryRecord = {
  id: string;
  name: string;
  email: string;
  message: string;
  ai_summary: string | null;
  language: string;
  timestamp: string;
  intent?: string | null;
  tone?: string | null;
  urgency?: string | null;
  confidence_score?: number | null;
  client_id?: string | null;
  archived?: boolean;
  deleted?: boolean;
  current_tag?: string | null;
  tone_history?: HistoryEntry[];
  confidence_history?: HistoryEntry[];
  urgency_history?: HistoryEntry[];
  last_updated?: string;
  relationship_insight?: string | null;
};

export type ClientRecord = {
  id: string;
  client_id: string;
  business_name: string;
  name: string;
  contact_name?: string;
  email: string;
  password_hash: string;
  language: string;
  api_key: string;
  is_internal?: boolean;
  is_test?: boolean;
  industry_category?: string;
  primary_service?: string;
  booking_link?: string | null;
  custom_tagline?: string | null;
  email_tone?: string;
  followup_speed?: string;
  ai_personalized_reply?: boolean;
  outbound_email?: string | null;
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_username?: string | null;
  smtp_password?: string | null;
  created_at: string;
  last_login?: string;
  last_connection?: string;
  last_rotated?: string;
};

export type ApiKeyLog = {
  id: string;
  client_id: string;
  old_key: string;
  new_key: string;
  rotated_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

const isConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) && 
                     !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (!isConfigured) {
  console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY - database features disabled');
}

// Log which key is being used for debugging
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('[Supabase] Using service role key for full database access');
} else if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('[Supabase] Using anon key - may be limited by RLS policies');
} else {
  console.error('[Supabase] No valid Supabase key found');
}

function createSupabaseClient() {
  // Try to use failover client first, fall back to direct client
  try {
    return createFailoverSupabaseClient();
  } catch (error) {
    console.warn('[Supabase] Failover client not available, using direct client:', error instanceof Error ? error.message : error);
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
}

export let supabase = createSupabaseClient();

// Export failover status for monitoring
export { getFailoverStatus };

let tableCheckCompleted = false;

export async function ensureLeadMemoryTableExists() {
  // Only run once per runtime
  if (tableCheckCompleted) {
    return true;
  }

  try {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.lead_memory (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        ai_summary TEXT,
        language TEXT NOT NULL DEFAULT 'en',
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        intent TEXT,
        tone TEXT,
        urgency TEXT,
        confidence_score NUMERIC(5,2)
      );
      
      CREATE INDEX IF NOT EXISTS lead_memory_timestamp_idx ON public.lead_memory(timestamp);
      CREATE INDEX IF NOT EXISTS lead_memory_email_idx ON public.lead_memory(email);
      CREATE INDEX IF NOT EXISTS lead_memory_urgency_idx ON public.lead_memory(urgency);
      CREATE INDEX IF NOT EXISTS lead_memory_confidence_idx ON public.lead_memory(confidence_score);
    `;
    
    try {
      // Call exec_sql RPC function to create the table
      const sqlEndpoint = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
      
      await fetch(sqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ 
          query: createTableSQL 
        }),
      });
      
      // Verify table is accessible
      const maxRetries = 5;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const { error, status } = await supabase
          .from('lead_memory')
          .select('*')
          .limit(1);
        
        if (status === 200 || (!error) || (error && error.code !== '42P01')) {
          console.log('[Supabase] Table verified ✅');
          tableCheckCompleted = true;
          return true;
        }
        
        if (error && error.code === '42P01' && attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      
      return false;
    } catch {
      tableCheckCompleted = true;
      return false;
    }
  } catch {
    return false;
  }
}

export async function saveLeadToSupabase(data: {
  name: string;
  email: string;
  message: string;
  aiSummary: string | null;
  language: string;
  timestamp: string;
  clientId?: string | null;
}) {
  try {
    // Ensure table exists before insert
    await ensureLeadMemoryTableExists();
    
    // Generate unique ID
    const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    
    const record: any = {
      id,
      name: data.name,
      email: data.email,
      message: data.message,
      ai_summary: data.aiSummary,
      language: data.language,
      timestamp: data.timestamp,
    };
    
    if (data.clientId) {
      record.client_id = data.clientId;
    }
    
    // Try REST API insert first
    const { data: insertedData, error } = await supabase
      .from('lead_memory')
      .insert(record)
      .select()
      .single();
    
    if (error && (error.code === '42P01' || error.message.includes('schema cache') || error.message.includes('does not exist'))) {
      // Fallback: Use direct SQL INSERT bypassing REST cache
      const escapeSql = (str: string) => str.replace(/'/g, "''");
      const insertSQL = `
        INSERT INTO public.lead_memory (id, name, email, message, ai_summary, language, timestamp)
        VALUES (
          '${escapeSql(id)}',
          '${escapeSql(data.name)}',
          '${escapeSql(data.email)}',
          '${escapeSql(data.message)}',
          ${data.aiSummary ? `'${escapeSql(data.aiSummary)}'` : 'NULL'},
          '${escapeSql(data.language)}',
          '${data.timestamp}'::timestamptz
        )
        ON CONFLICT (id) DO NOTHING;
      `;
      
      const sqlEndpoint = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
      
      const sqlResponse = await fetch(sqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ 
          query: insertSQL 
        }),
      });
      
      if (!sqlResponse.ok) {
        const errorText = await sqlResponse.text();
        throw new Error(`SQL INSERT failed: ${errorText}`);
      }
      
      console.log('[Supabase] Lead inserted successfully');
      return record;
    } else if (error) {
      throw error;
    }
    
    console.log('[Supabase] Lead inserted successfully');
    return insertedData;
  } catch (err) {
    console.error('[Supabase] Insert failed:', err instanceof Error ? err.message : err);
    throw err;
  }
}

export async function verifyLeadMemorySchema(): Promise<{ verified: boolean; missingColumns: string[] }> {
  try {
    console.log('[Schema Verification] Checking lead_memory table schema...');
    
    // Try to select the new columns to verify they exist
    const { data, error } = await supabase
      .from('lead_memory')
      .select('id, tone_history, confidence_history, urgency_history, last_updated, relationship_insight')
      .limit(1);
    
    if (error) {
      console.error('[Schema Verification] ❌ Schema check failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      
      // Parse error message to detect missing columns
      const missingColumns: string[] = [];
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('tone_history')) missingColumns.push('tone_history');
      if (errorMsg.includes('confidence_history')) missingColumns.push('confidence_history');
      if (errorMsg.includes('urgency_history')) missingColumns.push('urgency_history');
      if (errorMsg.includes('last_updated')) missingColumns.push('last_updated');
      if (errorMsg.includes('relationship_insight')) missingColumns.push('relationship_insight');
      
      console.error('[Schema Verification] Missing columns:', missingColumns.join(', '));
      return { verified: false, missingColumns };
    }
    
    console.log('[Schema Verification] ✅ Schema verified: tone_history, confidence_history, urgency_history, last_updated, relationship_insight present');
    return { verified: true, missingColumns: [] };
    
  } catch (err) {
    console.error('[Schema Verification] ❌ Unexpected error during schema check:', err);
    return { verified: false, missingColumns: ['unknown'] };
  }
}

export async function enrichLeadInDatabase(params: {
  id: string;
  intent: string;
  tone: string;
  urgency: string;
  confidence_score: number;
}) {
  try {
    const { data, error} = await supabase
      .from('lead_memory')
      .update({
        intent: params.intent,
        tone: params.tone,
        urgency: params.urgency,
        confidence_score: params.confidence_score,
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log('[Supabase] Lead enriched successfully');
    return data;
  } catch (err) {
    console.error('[Supabase] Enrichment update failed:', err instanceof Error ? err.message : err);
    throw err;
  }
}

export async function upsertLeadWithHistory(params: {
  email: string;
  name: string;
  message: string;
  ai_summary: string | null;
  language: string;
  timestamp: string;
  intent: string;
  tone: string;
  urgency: string;
  confidence_score: number;
  client_id?: string | null;
  is_test?: boolean;
}): Promise<{ isNew: boolean; leadId: string; insight: string | null }> {
  try {
    console.log('[LeadMemory] ============================================');
    console.log('[LeadMemory] upsertLeadWithHistory() called');
    console.log('[LeadMemory] ============================================');
    console.log('[LeadMemory] Input params:', {
      email: params.email,
      name: params.name,
      language: params.language,
      intent: params.intent,
      tone: params.tone,
      urgency: params.urgency,
      confidence_score: params.confidence_score,
      client_id: params.client_id || 'none',
      message_length: params.message?.length || 0,
      ai_summary_length: params.ai_summary?.length || 0,
    });
    
    // Verify schema before attempting upsert
    console.log('[LeadMemory] Verifying schema...');
    const schemaCheck = await verifyLeadMemorySchema();
    
    if (!schemaCheck.verified) {
      console.error('[LeadMemory] ============================================');
      console.error('[LeadMemory] ❌ SCHEMA VERIFICATION FAILED');
      console.error('[LeadMemory] ============================================');
      console.error('[LeadMemory] Missing columns:', schemaCheck.missingColumns.join(', '));
      console.error('[LeadMemory] Please run the migration SQL from supabase-setup.sql');
      console.error('[LeadMemory] ============================================');
      throw new Error(`Schema verification failed. Missing columns: ${schemaCheck.missingColumns.join(', ')}`);
    }
    
    console.log('[LeadMemory] Checking for existing lead with email:', params.email);
    console.log('[LeadMemory] Supabase URL:', supabaseUrl);
    console.log('[LeadMemory] Supabase key configured:', !!supabaseKey);
    console.log('[LeadMemory] Service role key length:', supabaseKey?.length || 0);
    
    // Check if lead with this email already exists
    console.log('[LeadMemory] Executing SELECT query...');
    const selectStart = Date.now();
    const { data: existingLead, error: fetchError } = await supabase
      .from('lead_memory')
      .select('*')
      .eq('email', params.email)
      .eq('deleted', false)
      .single();
    const selectDuration = Date.now() - selectStart;
    
    console.log('[LeadMemory] SELECT query completed in', selectDuration, 'ms');
    console.log('[LeadMemory] SELECT result:', {
      found: !!existingLead,
      error: fetchError ? {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
      } : null,
    });
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[LeadMemory] ❌ Error checking for existing lead');
      console.error('[LeadMemory] Error code:', fetchError.code);
      console.error('[LeadMemory] Error message:', fetchError.message);
      console.error('[LeadMemory] Error details:', fetchError.details);
      console.error('[LeadMemory] Error hint:', fetchError.hint);
      console.error('[LeadMemory] Full error object:', JSON.stringify(fetchError, null, 2));
      throw fetchError;
    }
    
    const now = new Date().toISOString();
    
    if (existingLead) {
      console.log('[LeadMemory] Existing record found for email:', params.email);
      console.log('[LeadMemory] Lead ID:', existingLead.id);
      
      // Parse existing histories
      const toneHistory: HistoryEntry[] = Array.isArray(existingLead.tone_history) ? existingLead.tone_history : [];
      const confidenceHistory: HistoryEntry[] = Array.isArray(existingLead.confidence_history) ? existingLead.confidence_history : [];
      const urgencyHistory: HistoryEntry[] = Array.isArray(existingLead.urgency_history) ? existingLead.urgency_history : [];
      
      // Append new values
      toneHistory.push({ value: params.tone, timestamp: now });
      confidenceHistory.push({ value: params.confidence_score, timestamp: now });
      urgencyHistory.push({ value: params.urgency, timestamp: now });
      
      console.log('[LeadMemory] Updated tone history length:', toneHistory.length);
      console.log('[LeadMemory] Updated confidence history length:', confidenceHistory.length);
      console.log('[LeadMemory] Updated urgency history length:', urgencyHistory.length);
      
      // Generate relationship insight (ALWAYS generates a value)
      console.log('[LeadMemory] ============================================');
      console.log('[LeadMemory] Generating relationship insight...');
      console.log('[LeadMemory] ============================================');
      console.log('[LeadMemory] Previous values:', {
        tone: existingLead.tone,
        confidence: existingLead.confidence_score,
        urgency: existingLead.urgency,
      });
      console.log('[LeadMemory] Current values:', {
        tone: params.tone,
        confidence: params.confidence_score,
        urgency: params.urgency,
      });
      
      const previousTone = existingLead.tone;
      const previousConfidence = existingLead.confidence_score;
      const previousUrgency = existingLead.urgency;
      const isEnglish = params.language === 'en';
      
      let insight = '';
      let hasChange = false;
      
      // Detect tone change
      if (previousTone && previousTone.toLowerCase() !== params.tone.toLowerCase()) {
        hasChange = true;
        if (isEnglish) {
          insight = `Tone shifted from ${previousTone.toLowerCase()} to ${params.tone.toLowerCase()}`;
        } else {
          insight = `Ton passé de ${previousTone.toLowerCase()} à ${params.tone.toLowerCase()}`;
        }
        console.log('[LeadMemory] Tone changed:', previousTone, '→', params.tone);
      }
      
      // Detect confidence change (>= 10% threshold)
      if (previousConfidence !== null && previousConfidence !== undefined) {
        const confidenceDiff = params.confidence_score - previousConfidence;
        if (Math.abs(confidenceDiff) >= 0.10) { // 10% change
          hasChange = true;
          const direction = confidenceDiff > 0 ? (isEnglish ? 'increased' : 'augmenté') : (isEnglish ? 'decreased' : 'diminué');
          const changePercent = Math.abs(confidenceDiff * 100).toFixed(0);
          
          if (insight) {
            insight += isEnglish ? ` and confidence ${direction}` : ` et confiance ${direction}`;
          } else {
            insight = isEnglish 
              ? `Confidence ${direction} by ${changePercent}%` 
              : `Confiance ${direction} de ${changePercent}%`;
          }
          console.log('[LeadMemory] Confidence changed:', previousConfidence, '→', params.confidence_score, `(${confidenceDiff > 0 ? '+' : ''}${(confidenceDiff * 100).toFixed(0)}%)`);
        }
      }
      
      // Detect urgency change
      if (previousUrgency && previousUrgency.toLowerCase() !== params.urgency.toLowerCase()) {
        hasChange = true;
        const urgencyChange = isEnglish
          ? `Urgency changed from ${previousUrgency.toLowerCase()} to ${params.urgency.toLowerCase()}`
          : `Urgence passée de ${previousUrgency.toLowerCase()} à ${params.urgency.toLowerCase()}`;
        
        if (insight) {
          insight += isEnglish ? `, urgency changed to ${params.urgency.toLowerCase()}` : `, urgence passée à ${params.urgency.toLowerCase()}`;
        } else {
          insight = urgencyChange;
        }
        console.log('[LeadMemory] Urgency changed:', previousUrgency, '→', params.urgency);
      }
      
      // If no changes detected, generate default insight based on current state
      if (!hasChange || !insight) {
        console.log('[LeadMemory] No significant changes detected - generating default insight');
        
        // Check current tone and urgency for default message
        const toneLower = params.tone.toLowerCase();
        const urgencyLower = params.urgency.toLowerCase();
        
        if (toneLower.includes('confident') || toneLower.includes('confiant')) {
          insight = isEnglish 
            ? 'Tone stayed confident — good time to engage' 
            : 'Ton resté confiant — bon moment pour engager';
        } else if (toneLower.includes('hesitant') || toneLower.includes('hésitant')) {
          insight = isEnglish 
            ? 'Tone remains hesitant — nurture with more info' 
            : 'Ton reste hésitant — nourrir avec plus d\'info';
        } else if (urgencyLower.includes('high') || urgencyLower.includes('élevée')) {
          insight = isEnglish 
            ? 'High urgency maintained — follow up now' 
            : 'Urgence élevée maintenue — suivre maintenant';
        } else if (urgencyLower.includes('low') || urgencyLower.includes('faible')) {
          insight = isEnglish 
            ? 'Low urgency — passive nurturing recommended' 
            : 'Urgence faible — nurturing passif recommandé';
        } else {
          insight = isEnglish 
            ? 'Tone stayed consistent, confidence unchanged — monitor engagement' 
            : 'Ton resté constant, confiance inchangée — surveiller l\'engagement';
        }
      } else {
        // Add follow-up recommendation based on final state
        const toneLower = params.tone.toLowerCase();
        const urgencyLower = params.urgency.toLowerCase();
        
        if (toneLower.includes('confident') || toneLower.includes('confiant') || urgencyLower.includes('high') || urgencyLower.includes('élevée')) {
          insight += isEnglish ? ' — great time to follow up!' : ' — bon moment pour suivre!';
        } else if (toneLower.includes('hesitant') || toneLower.includes('hésitant')) {
          insight += isEnglish ? ' — nurture with more info.' : ' — nourrir avec plus d\'info.';
        } else if (urgencyLower.includes('low') || urgencyLower.includes('faible')) {
          insight += isEnglish ? ' — follow up to confirm interest.' : ' — suivre pour confirmer l\'intérêt.';
        }
      }
      
      console.log('[LeadMemory] ============================================');
      console.log('[LeadMemory] Generated relationship insight:', insight);
      console.log('[LeadMemory] Insight language:', isEnglish ? 'EN' : 'FR');
      console.log('[LeadMemory] Insight length:', insight.length);
      console.log('[LeadMemory] ============================================');
      
      // Check if we need to add or correct client_id on existing lead
      let shouldUpdateClientId = false;
      const needsClientIdUpdate = 
        existingLead.client_id == null || 
        existingLead.client_id === 'avenir-internal-client';
      
      if (needsClientIdUpdate && params.client_id) {
        console.log('[LeadMemory] ============================================');
        console.log('[LeadMemory] 🔗 Client ID correction needed on existing lead');
        console.log('[LeadMemory] Lead ID:', existingLead.id);
        console.log('[LeadMemory] Current client_id:', existingLead.client_id || 'NULL');
        console.log('[LeadMemory] Incoming client_id:', params.client_id);
        
        if (existingLead.client_id === 'avenir-internal-client') {
          console.log('[LeadMemory] 🔄 Correcting old string format to UUID');
          console.log('[LeadMemory] Old: \'avenir-internal-client\' → New: \'00000000-0000-0000-0000-000000000001\'');
        } else {
          console.log('[LeadMemory] 🔗 Adding missing client_id to existing lead');
        }
        
        console.log('[LeadMemory] ✅ Will update client_id for lead:', existingLead.id);
        console.log('[LeadMemory] ============================================');
        shouldUpdateClientId = true;
      }
      
      // Update the existing lead
      console.log('[LeadMemory] Preparing UPDATE query...');
      console.log('[LeadMemory] Fields to update:', {
        name: params.name,
        email: params.email,
        intent: params.intent,
        tone: params.tone,
        urgency: params.urgency,
        confidence_score: params.confidence_score,
        tone_history_length: toneHistory.length,
        confidence_history_length: confidenceHistory.length,
        urgency_history_length: urgencyHistory.length,
        relationship_insight: insight,
        relationship_insight_length: insight.length,
        last_updated: now,
        client_id: shouldUpdateClientId ? params.client_id : undefined,
      });
      
      // Prepare update object
      const updateData: any = {
        name: params.name,
        message: params.message,
        ai_summary: params.ai_summary,
        language: params.language,
        timestamp: params.timestamp,
        intent: params.intent,
        tone: params.tone,
        urgency: params.urgency,
        confidence_score: params.confidence_score,
        tone_history: toneHistory,
        confidence_history: confidenceHistory,
        urgency_history: urgencyHistory,
        last_updated: now,
        relationship_insight: insight,
      };
      
      // Add client_id if needed
      if (shouldUpdateClientId) {
        updateData.client_id = params.client_id;
      }
      
      const updateStart = Date.now();
      const { data: updatedLead, error: updateError } = await supabase
        .from('lead_memory')
        .update(updateData)
        .eq('id', existingLead.id)
        .select()
        .single();
      const updateDuration = Date.now() - updateStart;
      
      console.log('[LeadMemory] UPDATE query completed in', updateDuration, 'ms');
      console.log('[LeadMemory] UPDATE result:', {
        success: !updateError,
        hasData: !!updatedLead,
        error: updateError ? {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        } : null,
      });
      
      if (updateError) {
        console.error('[LeadMemory] ============================================');
        console.error('[LeadMemory] ❌ UPDATE FAILED');
        console.error('[LeadMemory] ============================================');
        console.error('[LeadMemory] Error code:', updateError.code);
        console.error('[LeadMemory] Error message:', updateError.message);
        console.error('[LeadMemory] Error details:', updateError.details);
        console.error('[LeadMemory] Error hint:', updateError.hint);
        console.error('[LeadMemory] Full error object:', JSON.stringify(updateError, null, 2));
        console.error('[LeadMemory] ============================================');
        throw updateError;
      }
      
      console.log('[LeadMemory] ============================================');
      console.log('[LeadMemory] ✅ Existing lead updated successfully');
      console.log('[LeadMemory] ============================================');
      console.log('[LeadMemory] Updated lead ID:', existingLead.id);
      console.log('[LeadMemory] Saved relationship insight to Supabase: success=true');
      console.log('[LeadMemory] Verified insight in response:', updatedLead?.relationship_insight?.substring(0, 80) + '...');
      console.log('[LeadMemory] ============================================');
      
      return { isNew: false, leadId: existingLead.id, insight: insight };
      
    } else {
      console.log('[LeadMemory] ============================================');
      console.log('[LeadMemory] No existing record found - creating new lead');
      console.log('[LeadMemory] ============================================');
      
      // Generate unique ID
      const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      console.log('[LeadMemory] Generated new ID:', id);
      
      // Initialize histories with first entry
      const initialToneHistory: HistoryEntry[] = [{ value: params.tone, timestamp: now }];
      const initialConfidenceHistory: HistoryEntry[] = [{ value: params.confidence_score, timestamp: now }];
      const initialUrgencyHistory: HistoryEntry[] = [{ value: params.urgency, timestamp: now }];
      
      const newRecord: any = {
        id,
        name: params.name,
        email: params.email,
        message: params.message,
        ai_summary: params.ai_summary,
        language: params.language,
        timestamp: params.timestamp,
        intent: params.intent,
        tone: params.tone,
        urgency: params.urgency,
        confidence_score: params.confidence_score,
        tone_history: initialToneHistory,
        confidence_history: initialConfidenceHistory,
        urgency_history: initialUrgencyHistory,
        last_updated: now,
        relationship_insight: null, // No insight for first contact
      };
      
      if (params.client_id) {
        newRecord.client_id = params.client_id;
        console.log('[LeadMemory] Adding client_id to record:', params.client_id);
      }
      
      if (params.is_test !== undefined) {
        newRecord.is_test = params.is_test;
        console.log('[LeadMemory] Marking record as test data:', params.is_test);
      }
      
      console.log('[LeadMemory] Record to insert:', {
        id: newRecord.id,
        email: newRecord.email,
        name: newRecord.name,
        language: newRecord.language,
        intent: newRecord.intent,
        tone: newRecord.tone,
        urgency: newRecord.urgency,
        confidence_score: newRecord.confidence_score,
        tone_history_length: newRecord.tone_history.length,
        confidence_history_length: newRecord.confidence_history.length,
        urgency_history_length: newRecord.urgency_history.length,
        client_id: newRecord.client_id || 'null',
      });
      
      console.log('[LeadMemory] Executing INSERT query to table: lead_memory');
      const insertStart = Date.now();
      const { data: insertedLead, error: insertError } = await supabase
        .from('lead_memory')
        .insert(newRecord)
        .select()
        .single();
      const insertDuration = Date.now() - insertStart;
      
      console.log('[LeadMemory] INSERT query completed in', insertDuration, 'ms');
      console.log('[LeadMemory] INSERT result:', {
        success: !insertError,
        hasData: !!insertedLead,
        error: insertError ? {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        } : null,
      });
      
      if (insertError) {
        console.error('[LeadMemory] ============================================');
        console.error('[LeadMemory] ❌ INSERT FAILED');
        console.error('[LeadMemory] ============================================');
        console.error('[LeadMemory] Error code:', insertError.code);
        console.error('[LeadMemory] Error message:', insertError.message);
        console.error('[LeadMemory] Error details:', insertError.details);
        console.error('[LeadMemory] Error hint:', insertError.hint);
        console.error('[LeadMemory] Full error object:', JSON.stringify(insertError, null, 2));
        console.error('[LeadMemory] ============================================');
        console.error('[LeadMemory] Record that failed to insert:');
        console.error(JSON.stringify(newRecord, null, 2));
        console.error('[LeadMemory] ============================================');
        throw insertError;
      }
      
      console.log('[LeadMemory] ============================================');
      console.log('[LeadMemory] ✅ New lead created successfully');
      console.log('[LeadMemory] Inserted lead ID:', insertedLead?.id);
      console.log('[LeadMemory] ============================================');
      return { isNew: true, leadId: id, insight: null };
    }
  } catch (err) {
    console.error('[LeadMemory] upsertLeadWithHistory failed:', err instanceof Error ? err.message : err);
    throw err;
  }
}

export async function getRecentLeads(limit = 50, offset = 0, clientId?: string) {
  try {
    console.log('[Supabase] getRecentLeads called with:', { limit, offset, clientId });
    
    // Validate clientId before using it in query
    // Ignore invalid values like 'unknown', 'null', empty strings, etc.
    const isValidClientId = clientId && 
                           clientId.trim() !== '' && 
                           clientId !== 'unknown' && 
                           clientId !== 'null' && 
                           clientId !== 'undefined';
    
    // If client filter is active, fetch via lead_actions join
    if (isValidClientId) {
      console.log('[Supabase] [CommandCenter] Fetching client-filtered leads via lead_actions join');
      
      // Step 1: Get lead_ids for this client
      const { data: leadActions, error: actionsError } = await supabase
        .from('lead_actions')
        .select('lead_id')
        .eq('client_id', clientId);
      
      if (actionsError) {
        console.error('[Supabase] Error fetching lead_actions:', actionsError);
        throw actionsError;
      }
      
      const leadIds = (leadActions || []).map(la => la.lead_id);
      console.log('[Supabase] Found', leadIds.length, 'lead_ids for client');
      
      if (leadIds.length === 0) {
        return { data: [], total: 0 };
      }
      
      // Step 2: Fetch leads for those IDs
      const { data, error, count } = await supabase
        .from('lead_memory')
        .select('*', { count: 'exact' })
        .in('id', leadIds)
        .eq('archived', false)
        .eq('deleted', false)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      console.log('[Supabase] [CommandCenter] Returned', data?.length || 0, 'client-filtered leads');
      return { data: data || [], total: count || 0 };
    }
    
    // Default: fetch all leads (no client filter)
    const { data, error, count } = await supabase
      .from('lead_memory')
      .select('*', { count: 'exact' })
      .eq('archived', false)
      .eq('deleted', false) // Only fetch active (non-archived, non-deleted) leads
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    return { data: data || [], total: count || 0 };
  } catch (err) {
    console.error('[Supabase] Query failed:', err instanceof Error ? err.message : err);
    throw err;
  }
}

export async function getArchivedLeads(limit = 50, offset = 0, clientId?: string) {
  try {
    // If client filter is active, fetch via lead_actions join
    if (clientId) {
      const { data: leadActions } = await supabase
        .from('lead_actions')
        .select('lead_id')
        .eq('client_id', clientId);
      
      const leadIds = (leadActions || []).map(la => la.lead_id);
      
      if (leadIds.length === 0) {
        return { data: [], total: 0 };
      }
      
      const { data, error, count } = await supabase
        .from('lead_memory')
        .select('*', { count: 'exact' })
        .in('id', leadIds)
        .eq('archived', true)
        .eq('deleted', false)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return { data: data || [], total: count || 0 };
    }
    
    const { data, error, count } = await supabase
      .from('lead_memory')
      .select('*', { count: 'exact' })
      .eq('archived', true)
      .eq('deleted', false) // Archived but not deleted
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    return { data: data || [], total: count || 0 };
  } catch (err) {
    console.error('[Supabase] Query failed:', err instanceof Error ? err.message : err);
    throw err;
  }
}

export async function getDeletedLeads(limit = 50, offset = 0, clientId?: string) {
  try {
    // If client filter is active, fetch via lead_actions join
    if (clientId) {
      const { data: leadActions } = await supabase
        .from('lead_actions')
        .select('lead_id')
        .eq('client_id', clientId);
      
      const leadIds = (leadActions || []).map(la => la.lead_id);
      
      if (leadIds.length === 0) {
        return { data: [], total: 0 };
      }
      
      const { data, error, count } = await supabase
        .from('lead_memory')
        .select('*', { count: 'exact' })
        .in('id', leadIds)
        .eq('deleted', true)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return { data: data || [], total: count || 0 };
    }
    
    const { data, error, count } = await supabase
      .from('lead_memory')
      .select('*', { count: 'exact' })
      .eq('deleted', true) // All deleted leads (regardless of archived status)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    return { data: data || [], total: count || 0 };
  } catch (err) {
    console.error('[Supabase] Query failed:', err instanceof Error ? err.message : err);
    throw err;
  }
}

// ==================== CLIENT MANAGEMENT FUNCTIONS ====================

export async function validateApiKey(apiKey: string): Promise<ClientRecord | null> {
  try {
    console.log('[E2E-Test] [validateApiKey] Validating API key:', apiKey.substring(0, 20) + '...');
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('api_key', apiKey)
      .single();
    
    console.log('[E2E-Test] [validateApiKey] Query result:', {
      found: !!data,
      error: error?.message || 'none',
      errorCode: error?.code || 'none',
    });
    
    if (error) {
      console.error('[E2E-Test] [validateApiKey] ❌ API key validation failed:', error);
      return null;
    }
    
    if (data) {
      console.log('[E2E-Test] [validateApiKey] ✅ Valid API key for client:', {
        id: data.id,
        client_id: data.client_id,
        business_name: data.business_name,
        email: data.email,
      });
    }
    
    return data as ClientRecord;
  } catch (err) {
    console.error('[E2E-Test] [validateApiKey] ❌ Unexpected error:', err);
    return null;
  }
}

export async function getAllClients(): Promise<ClientRecord[]> {
  try {
    console.log('[Supabase] getAllClients() called');
    console.log('[Supabase] Using service role key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('[Supabase] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    const { data, error } = await supabase
      .from('clients')
      .select('client_id, business_name, language, created_at, email, api_key, is_internal')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[Supabase] ❌ Query error:', error);
      console.error('[Supabase] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log('[Supabase] ✅ Query successful');
    console.log('[Supabase] Rows returned:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('[Supabase] Sample client:', {
        client_id: data[0].client_id,
        business_name: data[0].business_name,
        language: data[0].language
      });
    }
    
    return (data || []) as ClientRecord[];
  } catch (err) {
    console.error('[Supabase] Failed to fetch clients:', err instanceof Error ? err.message : err);
    throw err;
  }
}

export async function createClientRecord(params: {
  company_name: string;
  contact_email: string;
  api_key: string;
}): Promise<ClientRecord> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        company_name: params.company_name,
        contact_email: params.contact_email,
        api_key: params.api_key,
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log('[Supabase] Client created successfully');
    return data as ClientRecord;
  } catch (err) {
    console.error('[Supabase] Failed to create client:', err instanceof Error ? err.message : err);
    throw err;
  }
}

export async function deleteClient(clientId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);
    
    if (error) {
      throw error;
    }
    
    console.log('[Supabase] Client deleted successfully');
  } catch (err) {
    console.error('[Supabase] Failed to delete client:', err instanceof Error ? err.message : err);
    throw err;
  }
}

export async function rotateApiKey(clientId: string, newApiKey: string): Promise<ClientRecord> {
  try {
    // First, get the old API key for logging
    const { data: oldClient, error: fetchError } = await supabase
      .from('clients')
      .select('api_key')
      .eq('id', clientId)
      .single();
    
    if (fetchError) {
      throw fetchError;
    }
    
    const oldKey = oldClient?.api_key || '';
    
    // Update the client with new API key and timestamp
    const { data, error } = await supabase
      .from('clients')
      .update({
        api_key: newApiKey,
        last_rotated: new Date().toISOString(),
      })
      .eq('id', clientId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Log the rotation event
    const { error: logError } = await supabase
      .from('api_key_logs')
      .insert({
        client_id: clientId,
        old_key: oldKey,
        new_key: newApiKey,
      });
    
    if (logError) {
      console.error('[Supabase] Failed to log API key rotation:', logError);
      // Don't throw - rotation succeeded even if logging failed
    }
    
    console.log('[Supabase] API key rotated successfully');
    return data as ClientRecord;
  } catch (err) {
    console.error('[Supabase] Failed to rotate API key:', err instanceof Error ? err.message : err);
    throw err;
  }
}

export async function getApiKeyLogs(clientId: string): Promise<ApiKeyLog[]> {
  try {
    const { data, error } = await supabase
      .from('api_key_logs')
      .select('*')
      .eq('client_id', clientId)
      .order('rotated_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return (data || []) as ApiKeyLog[];
  } catch (err) {
    console.error('[Supabase] Failed to fetch API key logs:', err instanceof Error ? err.message : err);
    throw err;
  }
}

