/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import { createClient } from '@supabase/supabase-js';

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
    const { data, error } = await supabase
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

export async function getRecentLeads(limit = 50, offset = 0) {
  try {
    const { data, error, count } = await supabase
      .from('lead_memory')
      .select('*', { count: 'exact' })
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

