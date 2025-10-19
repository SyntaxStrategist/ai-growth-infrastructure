/**
 * Supabase Server-Side Authentication Utility
 * Handles session validation for API routes in both development and production
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only check credentials at runtime, not during build
function validateCredentials() {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }
}

/**
 * Create Supabase client for server-side operations
 */
export function createServerSupabaseClient() {
  validateCredentials();
  return createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: { persistSession: false }
  });
}

/**
 * Create Supabase client for session validation
 */
export function createSessionSupabaseClient(req: NextRequest) {
  validateCredentials();
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

/**
 * Extract and validate Supabase session from request
 */
export async function getSupabaseSession(req: NextRequest) {
  try {
    // Create client for session validation
    const supabase = createSessionSupabaseClient(req);
    
    // Try to get session from Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        console.log('[SupabaseAuth] ✅ Session validated from Authorization header');
        return { user, session: { access_token: token } };
      }
    }
    
    // Try to get session from cookies
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      // Parse Supabase session cookies
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      const accessToken = cookies['sb-access-token'] || cookies['supabase-auth-token'];
      if (accessToken) {
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        
        if (!error && user) {
          console.log('[SupabaseAuth] ✅ Session validated from cookies');
          return { user, session: { access_token: accessToken } };
        }
      }
    }
    
    console.log('[SupabaseAuth] ❌ No valid session found');
    return null;
    
  } catch (error) {
    console.error('[SupabaseAuth] ❌ Session validation error:', error);
    return null;
  }
}

/**
 * Get authenticated client ID from Supabase session or fallback methods
 */
export async function getAuthenticatedClientId(req: NextRequest): Promise<string> {
  console.log('[ClientAuth] 🔍 Starting authentication process...');
  
  // Development bypass for testing (only in development environment)
  if (process.env.NODE_ENV === 'development') {
    const devClientId = req.nextUrl.searchParams.get('devClientId');
    if (devClientId) {
      console.log('[ClientAuth] 🛠️ Development bypass used for client:', devClientId);
      return devClientId;
    }
  }
  
  // Method 1: Try Supabase session authentication
  try {
    const session = await getSupabaseSession(req);
    if (session?.user?.email) {
      console.log('[ClientAuth] 🔍 Validating Supabase session for user:', session.user.email);
      
      // Get client data from email
      const supabase = createServerSupabaseClient();
      const { data: client, error } = await supabase
        .from('clients')
        .select('client_id, email')
        .eq('email', session.user.email)
        .single();
      
      if (!error && client) {
        console.log('[ClientAuth] ✅ Supabase session authenticated for client:', client.client_id);
        return client.client_id;
      } else {
        console.log('[ClientAuth] ❌ No client found for Supabase user:', session.user.email);
      }
    }
  } catch (error) {
    console.error('[ClientAuth] ❌ Supabase session validation failed:', error);
  }
  
  // Method 2: Try API key header (for external API access)
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    console.log('[ClientAuth] 🔍 Validating API key...');
    const supabase = createServerSupabaseClient();
    const { data: client, error } = await supabase
      .from('clients')
      .select('client_id')
      .eq('api_key', apiKey)
      .single();
    
    if (!error && client) {
      console.log('[ClientAuth] ✅ API key authenticated for client:', client.client_id);
      return client.client_id;
    } else {
      console.log('[ClientAuth] ❌ Invalid API key');
    }
  }
  
  // Method 3: Try clientId in request body (fallback for frontend calls)
  try {
    const body = await req.json().catch(() => ({}));
    if (body.clientId) {
      console.log('[ClientAuth] 🔍 Using clientId from request body:', body.clientId);
      
      // Validate that the client exists
      const supabase = createServerSupabaseClient();
      const { data: client, error } = await supabase
        .from('clients')
        .select('client_id')
        .eq('client_id', body.clientId)
        .single();
      
      if (!error && client) {
        console.log('[ClientAuth] ✅ ClientId validated for client:', client.client_id);
        return client.client_id;
      } else {
        console.log('[ClientAuth] ❌ Invalid clientId:', body.clientId);
      }
    }
  } catch (error) {
    console.error('[ClientAuth] ❌ Request body parsing failed:', error);
  }
  
  // Method 4: Try clientId from query parameter (for GET requests)
  const queryClientId = req.nextUrl.searchParams.get('clientId');
  if (queryClientId) {
    console.log('[ClientAuth] 🔍 Using clientId from query parameter:', queryClientId);
    
    // Validate that the client exists
    const supabase = createServerSupabaseClient();
    const { data: client, error } = await supabase
      .from('clients')
      .select('client_id')
      .eq('client_id', queryClientId)
      .single();
    
    if (!error && client) {
      console.log('[ClientAuth] ✅ Query clientId validated for client:', client.client_id);
      return client.client_id;
    } else {
      console.log('[ClientAuth] ❌ Invalid query clientId:', queryClientId);
    }
  }
  
  console.log('[ClientAuth] ❌ All authentication methods failed');
  throw new Error('Client authentication required');
}
