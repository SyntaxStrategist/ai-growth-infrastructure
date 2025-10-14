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
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
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
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS lead_memory_timestamp_idx ON public.lead_memory(timestamp);
      CREATE INDEX IF NOT EXISTS lead_memory_email_idx ON public.lead_memory(email);
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
    } catch (fetchErr) {
      tableCheckCompleted = true;
      return false;
    }
  } catch (err) {
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
}) {
  try {
    // Ensure table exists before insert
    await ensureLeadMemoryTableExists();
    
    // Generate unique ID
    const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    
    const record = {
      id,
      name: data.name,
      email: data.email,
      message: data.message,
      ai_summary: data.aiSummary,
      language: data.language,
      timestamp: data.timestamp,
    };
    
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

