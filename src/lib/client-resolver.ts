/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerSupabaseClient } from './supabase-server-auth';

// In-memory cache for resolved client IDs
const clientIdCache = new Map<string, { uuid: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Validates if a string is a valid UUID v4
 */
function isValidUUIDv4(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Universal Client ID Resolver
 * Resolves any client identifier (UUID or string) to the actual UUID
 * 
 * @param inputId - The client ID to resolve (UUID or string like "demo-video-client-2024")
 * @returns Promise<string> - The resolved UUID
 */
export async function resolveClientId(inputId: string): Promise<string> {
  if (!inputId || typeof inputId !== 'string') {
    console.error('[ClientResolver] ❌ Invalid input ID:', inputId);
    throw new Error('Invalid client ID provided');
  }

  // Check cache first
  const cached = clientIdCache.get(inputId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[ClientResolver] ✅ Cache hit for "${inputId}" → "${cached.uuid}"`);
    return cached.uuid;
  }

  console.log(`[ClientResolver] 🔍 Resolving client ID: "${inputId}"`);

  // If it's already a valid UUID, return it directly
  if (isValidUUIDv4(inputId)) {
    console.log(`[ClientResolver] ✅ Input is valid UUID: "${inputId}"`);
    // Cache the UUID for future use
    clientIdCache.set(inputId, { uuid: inputId, timestamp: Date.now() });
    return inputId;
  }

  // If it's a string ID, query Supabase to find the matching UUID
  try {
    console.log(`[ClientResolver] 🔍 Querying Supabase for string ID: "${inputId}"`);
    
    const supabase = createServerSupabaseClient();
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, client_id')
      .eq('client_id', inputId)
      .single();


    if (clientError) {
      console.error(`[ClientResolver] ❌ Supabase query failed for "${inputId}":`, clientError);
      
      // Check if this is a demo client and we have a fallback
      if (inputId === 'demo-video-client-2024' || inputId === process.env.DEMO_CLIENT_ID) {
        console.log(`[ClientResolver] 🔄 Attempting demo client fallback for "${inputId}"`);
        return await resolveDemoClientId();
      }
      
      throw new Error(`Client not found: ${inputId}`);
    }

    if (!clientData || !clientData.id) {
      console.error(`[ClientResolver] ❌ No client data found for "${inputId}"`);
      throw new Error(`Client not found: ${inputId}`);
    }

    const resolvedUuid = clientData.id;
    console.log(`[ClientResolver] ✅ Resolved "${inputId}" → "${resolvedUuid}"`);

    // Cache the resolved mapping
    clientIdCache.set(inputId, { uuid: resolvedUuid, timestamp: Date.now() });
    
    return resolvedUuid;

  } catch (error) {
    console.error(`[ClientResolver] ❌ Failed to resolve client ID "${inputId}":`, error);
    throw error;
  }
}

/**
 * Resolves demo client ID with fallback logic
 */
async function resolveDemoClientId(): Promise<string> {
  const demoClientId = process.env.DEMO_CLIENT_ID || 'demo-video-client-2024';
  
  try {
    console.log(`[ClientResolver] 🔍 Resolving demo client: "${demoClientId}"`);
    
    const supabase = createServerSupabaseClient();
    const { data: demoClient, error: demoError } = await supabase
      .from('clients')
      .select('id, client_id')
      .eq('client_id', demoClientId)
      .single();

    if (demoError || !demoClient) {
      console.error(`[ClientResolver] ❌ Demo client not found:`, demoError);
      throw new Error(`Demo client not found: ${demoClientId}`);
    }

    console.log(`[ClientResolver] ✅ Demo client resolved: "${demoClientId}" → "${demoClient.id}"`);
    return demoClient.id;

  } catch (error) {
    console.error(`[ClientResolver] ❌ Demo client resolution failed:`, error);
    throw new Error(`Failed to resolve demo client: ${demoClientId}`);
  }
}

/**
 * Clears the client ID cache (useful for testing or when client data changes)
 */
export function clearClientIdCache(): void {
  console.log('[ClientResolver] 🧹 Clearing client ID cache');
  clientIdCache.clear();
}

/**
 * Gets cache statistics for monitoring
 */
export function getClientIdCacheStats(): { size: number; entries: string[] } {
  return {
    size: clientIdCache.size,
    entries: Array.from(clientIdCache.keys())
  };
}

/**
 * Validates client ID format and provides helpful error messages
 */
export function validateClientId(inputId: string): { isValid: boolean; type: 'uuid' | 'string' | 'invalid'; message?: string } {
  if (!inputId || typeof inputId !== 'string') {
    return { isValid: false, type: 'invalid', message: 'Client ID must be a non-empty string' };
  }

  if (isValidUUIDv4(inputId)) {
    return { isValid: true, type: 'uuid' };
  }

  // Check if it's a valid string format (alphanumeric with hyphens)
  const validStringFormat = /^[a-zA-Z0-9-]+$/.test(inputId);
  if (validStringFormat) {
    return { isValid: true, type: 'string' };
  }

  return { isValid: false, type: 'invalid', message: 'Client ID must be a valid UUID or alphanumeric string with hyphens' };
}
