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

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

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

