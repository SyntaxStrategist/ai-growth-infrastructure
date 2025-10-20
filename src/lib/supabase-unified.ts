/**
 * Unified Supabase Client Configuration
 * Ensures consistent database access across all environments
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Validation function
function validateCredentials() {
  if (!supabaseUrl) {
    throw new Error('Supabase URL not configured. Please set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  }
  
  if (!supabaseServiceKey && !supabaseAnonKey) {
    throw new Error('Supabase keys not configured. Please set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  console.log('[SupabaseUnified] Configuration:');
  console.log('[SupabaseUnified]   URL:', supabaseUrl);
  console.log('[SupabaseUnified]   Service Key Available:', !!supabaseServiceKey);
  console.log('[SupabaseUnified]   Anon Key Available:', !!supabaseAnonKey);
}

/**
 * Create unified Supabase client for server-side operations
 * Uses service role key if available, falls back to anon key
 */
export function createUnifiedSupabaseClient() {
  validateCredentials();
  
  // Prefer service role key for full database access
  const key = supabaseServiceKey || supabaseAnonKey;
  
  if (!key) {
    throw new Error('No Supabase key available');
  }
  
  const client = createClient(supabaseUrl!, key, {
    auth: { persistSession: false },
    db: { schema: 'public' }
  });
  
  console.log('[SupabaseUnified] Client created with', supabaseServiceKey ? 'service role' : 'anon', 'key');
  
  return client;
}

/**
 * Create Supabase client specifically for client operations
 * Ensures consistent access to the clients table
 */
export function createClientSupabaseClient() {
  const client = createUnifiedSupabaseClient();
  
  // Add client-specific configuration
  return client;
}

// Export the unified client as default
export const supabase = createUnifiedSupabaseClient();
