/**
 * Supabase Client-Side Authentication Utility
 * Handles getting session tokens for API calls
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only check credentials at runtime, not during build
function validateCredentials() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase client credentials not configured');
  }
}

/**
 * Create Supabase client for client-side operations
 */
export function createClientSupabase() {
  validateCredentials();
  return createClient(supabaseUrl!, supabaseAnonKey!);
}

/**
 * Get current Supabase session token
 * Returns null if no valid session
 */
export async function getSupabaseSessionToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    const supabase = createClientSupabase();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      console.log('[SupabaseClient] No valid session found');
      return null;
    }
    
    console.log('[SupabaseClient] ✅ Session token retrieved');
    return session.access_token;
    
  } catch (error) {
    console.error('[SupabaseClient] ❌ Failed to get session token:', error);
    return null;
  }
}

/**
 * Create authenticated fetch headers for API calls
 * Includes Supabase session token if available
 */
export async function createAuthenticatedHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const token = await getSupabaseSessionToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}
