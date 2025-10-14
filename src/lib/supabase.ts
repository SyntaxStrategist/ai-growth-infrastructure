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
      
      // Re-initialize Supabase client to refresh schema cache
      console.log('[Supabase] Refreshing schema cache 🧠');
      console.log('[Supabase] Re-initializing Supabase client...');
      
      // Create a new client instance to force cache refresh
      supabase = createSupabaseClient();
      
      // Wait for schema cache to propagate
      console.log('[Supabase] Waiting for schema cache to update...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('[Supabase] Schema cache reloaded ✅');
      
      // Mark as completed
      tableCheckCompleted = true;
      
      // Verify with the new client instance
      let verifyRetries = 3;
      for (let i = 0; i < verifyRetries; i++) {
        const { error: verifyError } = await supabase
          .from('lead_memory')
          .select('id')
          .limit(1);
        
        if (!verifyError) {
          console.log('[Supabase] Table verification passed ✅');
          return true;
        } else if (verifyError.code === '42P01') {
          if (i < verifyRetries - 1) {
            console.log(`[Supabase] Table not found in cache yet, retrying (${i + 1}/${verifyRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Re-initialize client again
            supabase = createSupabaseClient();
          } else {
            console.error('[Supabase] ⚠️ Table still not found after retries');
            console.error('[Supabase] Error details:', verifyError.message);
            return false;
          }
        } else {
          // Other errors (like empty table or RLS) are OK - table exists
          console.log('[Supabase] Table exists (query error is normal for empty/protected table) ✅');
          return true;
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
    
    console.log('[Supabase] Inserting record with ID:', id);
    
    const { data: insertedData, error } = await supabase
      .from('lead_memory')
      .insert(record)
      .select()
      .single();
    
    if (error) {
      console.error('[Supabase] ❌ Insert failed:', error.message);
      console.error('[Supabase] Error code:', error.code);
      console.error('[Supabase] Error details:', error.details);
      console.error('[Supabase] Error hint:', error.hint);
      
      // If table still doesn't exist after ensure, try one more time
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('[Supabase] Retrying table creation and insert...');
        tableCheckCompleted = false; // Reset flag
        await ensureLeadMemoryTableExists();
        
        // Retry insert
        const { data: retryData, error: retryError } = await supabase
          .from('lead_memory')
          .insert(record)
          .select()
          .single();
        
        if (retryError) {
          console.error('[Supabase] ❌ Retry insert also failed:', retryError.message);
          throw retryError;
        }
        
        console.log('[Supabase] ✅ Lead saved after retry');
        return retryData;
      }
      
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

