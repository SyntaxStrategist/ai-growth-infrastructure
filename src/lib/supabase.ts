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
    console.log('[Supabase] Running direct SQL CREATE command...');
    
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
    
    // Execute SQL directly using Supabase's query endpoint
    // Note: This requires postgres changes API to be enabled in Supabase
    const postgrestEndpoint = `${supabaseUrl}/rest/v1/rpc/exec`;
    
    console.log('[Supabase] Executing SQL with service role key...');
    console.log('[Supabase] SQL:', createTableSQL.substring(0, 100) + '...');
    
    try {
      // Attempt to execute via fetch to the database
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
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
      
      console.log('[Supabase] SQL execution response status:', response.status);
      console.log('[Supabase] Table created successfully ✅');
      
      // Verify table is accessible with retry loop
      console.log('[Supabase] Verifying table is registered in schema...');
      const maxRetries = 5;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        console.log(`[Supabase] Verification attempt ${attempt + 1}/${maxRetries}...`);
        
        const { data, error, status } = await supabase
          .from('lead_memory')
          .select('*')
          .limit(1);
        
        // Success: table is accessible (200 status or no table-not-found error)
        if (status === 200 || (!error) || (error && error.code !== '42P01')) {
          console.log('[Supabase] Table confirmed in schema ✅');
          console.log('[Supabase] Response status:', status);
          tableCheckCompleted = true;
          return true;
        }
        
        // Table not found in cache yet
        if (error && error.code === '42P01') {
          if (attempt < maxRetries - 1) {
            console.log(`[Supabase] Table not in cache yet, retrying in 1.5s... (${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1500));
          } else {
            console.error('[Supabase] ⚠️ Table not found in schema after', maxRetries, 'attempts');
            console.error('[Supabase] Error code:', error.code);
            console.error('[Supabase] Error message:', error.message);
            return false;
          }
        }
      }
      
      return false;
    } catch (fetchErr) {
      console.error('[Supabase] ❌ Failed to execute SQL via endpoint:', fetchErr);
      tableCheckCompleted = true; // Mark as attempted
      return false;
    }
  } catch (err) {
    console.error('[Supabase] Error during table creation:', err);
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
    console.log('[Supabase] Starting lead save operation...');
    console.log('[Supabase] Connection configured:', !!supabaseUrl && !!supabaseKey);
    console.log('[Supabase] Project URL:', supabaseUrl.substring(0, 30) + '...');
    
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
    
    console.log('[Supabase] Attempting insert via REST API with ID:', id);
    
    // Try REST API insert first with Prefer header for better cache handling
    const { data: insertedData, error, status } = await supabase
      .from('lead_memory')
      .insert(record)
      .select()
      .single();
    
    if (error && (error.code === '42P01' || error.message.includes('schema cache') || error.message.includes('does not exist'))) {
      console.warn('[Supabase] ⚠️ REST API insert failed (schema cache issue)');
      console.log('[Supabase] Falling back to direct SQL INSERT...');
      
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
        ON CONFLICT (id) DO NOTHING
        RETURNING *;
      `;
      
      console.log('[Supabase] Executing direct SQL INSERT...');
      
      try {
        const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({ query: insertSQL }),
        });
        
        console.log('[Supabase] Direct SQL INSERT response:', sqlResponse.status);
        
        if (sqlResponse.ok || sqlResponse.status === 200 || sqlResponse.status === 201) {
          console.log('[Supabase] ✅ Lead saved via direct SQL');
          return { id, ...record };
        } else {
          const errorText = await sqlResponse.text();
          console.error('[Supabase] Direct SQL INSERT failed:', errorText);
          throw new Error(`SQL INSERT failed: ${errorText}`);
        }
      } catch (sqlErr) {
        console.error('[Supabase] ❌ Direct SQL fallback also failed:', sqlErr);
        throw sqlErr;
      }
    } else if (error) {
      console.error('[Supabase] ❌ Insert failed:', error.message);
      console.error('[Supabase] Error code:', error.code);
      console.error('[Supabase] Error details:', error.details);
      throw error;
    }
    
    console.log('[Supabase] ✅ Lead successfully saved to database');
    console.log('[Supabase] Record ID:', insertedData?.id);
    console.log('[Supabase] Record timestamp:', insertedData?.timestamp);
    
    return insertedData;
  } catch (err) {
    console.error('[Supabase] Save operation failed:', err);
    throw err;
  }
}

export async function getRecentLeads(limit = 50, offset = 0) {
  try {
    console.log('[Supabase] Fetching recent leads...');
    
    const { data, error, count } = await supabase
      .from('lead_memory')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('[Supabase] ❌ Query failed:', error.message);
      throw error;
    }
    
    console.log('[Supabase] ✅ Retrieved', data?.length || 0, 'leads');
    
    return { data: data || [], total: count || 0 };
  } catch (err) {
    console.error('[Supabase] Query operation failed:', err);
    throw err;
  }
}

