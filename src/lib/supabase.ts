/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import { createClient } from '@supabase/supabase-js';

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
  company_name: string;
  contact_email: string;
  api_key: string;
  created_at: string;
  last_rotated: string;
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

function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export let supabase = createSupabaseClient();

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
}): Promise<{ isNew: boolean; leadId: string; insight: string | null }> {
  try {
    console.log('[LeadMemory] Checking for existing lead with email:', params.email);
    
    // Check if lead with this email already exists
    const { data: existingLead, error: fetchError } = await supabase
      .from('lead_memory')
      .select('*')
      .eq('email', params.email)
      .eq('deleted', false)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[LeadMemory] Error checking for existing lead:', fetchError);
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
      
      // Generate relationship insight
      let insight = '';
      const previousTone = existingLead.tone;
      const previousConfidence = existingLead.confidence_score;
      const previousUrgency = existingLead.urgency;
      
      // Detect tone change
      if (previousTone && previousTone !== params.tone) {
        insight = `Tone shifted from ${previousTone.toLowerCase()} to ${params.tone.toLowerCase()}`;
      }
      
      // Detect confidence change
      if (previousConfidence !== null && previousConfidence !== undefined) {
        const confidenceDiff = params.confidence_score - previousConfidence;
        if (Math.abs(confidenceDiff) >= 0.15) { // 15% change
          const direction = confidenceDiff > 0 ? 'increased' : 'decreased';
          if (insight) {
            insight += ` and confidence ${direction}`;
          } else {
            insight = `Confidence ${direction} by ${Math.abs(confidenceDiff * 100).toFixed(0)}%`;
          }
        }
      }
      
      // Add follow-up recommendation
      if (params.tone.toLowerCase().includes('confident') || params.urgency.toLowerCase().includes('high')) {
        insight += insight ? ' — great time to follow up!' : 'High urgency detected — follow up now!';
      } else if (params.tone.toLowerCase().includes('hesitant')) {
        insight += insight ? ' — nurture with more info.' : 'Hesitant tone — provide more information.';
      }
      
      console.log('[LeadMemory] Generated new relationship insight:', insight || 'No significant change');
      
      // Update the existing lead
      const { data: updatedLead, error: updateError } = await supabase
        .from('lead_memory')
        .update({
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
          relationship_insight: insight || null,
        })
        .eq('id', existingLead.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('[LeadMemory] Failed to update existing lead:', updateError);
        throw updateError;
      }
      
      console.log('[LeadMemory] ✅ Existing lead updated successfully');
      return { isNew: false, leadId: existingLead.id, insight: insight || null };
      
    } else {
      console.log('[LeadMemory] No existing record found - creating new lead');
      
      // Generate unique ID
      const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      
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
      }
      
      const { data: insertedLead, error: insertError } = await supabase
        .from('lead_memory')
        .insert(newRecord)
        .select()
        .single();
      
      if (insertError) {
        console.error('[LeadMemory] Failed to insert new lead:', insertError);
        throw insertError;
      }
      
      console.log('[LeadMemory] ✅ New lead created successfully');
      return { isNew: true, leadId: id, insight: null };
    }
  } catch (err) {
    console.error('[LeadMemory] upsertLeadWithHistory failed:', err instanceof Error ? err.message : err);
    throw err;
  }
}

export async function getRecentLeads(limit = 50, offset = 0) {
  try {
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

export async function getArchivedLeads(limit = 50, offset = 0) {
  try {
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

export async function getDeletedLeads(limit = 50, offset = 0) {
  try {
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
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('api_key', apiKey)
      .single();
    
    if (error) {
      return null;
    }
    
    return data as ClientRecord;
  } catch {
    return null;
  }
}

export async function getAllClients(): Promise<ClientRecord[]> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
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

