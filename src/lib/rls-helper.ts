/**
 * Row Level Security Helper Functions
 * Provides utilities for setting client context in Supabase RLS policies
 */

import { supabase } from './supabase';

/**
 * Set client context for RLS policies
 * This function sets the client_id in the session for RLS policies
 * 
 * @param clientId - The client ID to set in the context
 * @returns Promise<void>
 */
export async function setClientContext(clientId: string): Promise<void> {
  try {
    // Set the client_id in the session for RLS policies
    await supabase.rpc('set_client_context', {
      client_id_param: clientId
    });
  } catch (error) {
    console.error('[RLS Helper] Failed to set client context:', error);
    throw new Error('Failed to set client context for RLS policies');
  }
}

/**
 * Create a Supabase client with client context for RLS
 * This creates a client instance that will use the specified client_id for RLS policies
 * 
 * @param clientId - The client ID to use for RLS context
 * @returns Promise<Supabase client instance>
 */
export async function createClientWithContext(clientId: string) {
  await supabase.rpc('set_client_context', {
    client_id_param: clientId
  });
  return supabase;
}

/**
 * Execute a database operation with client context
 * This is a wrapper that sets the client context before executing the operation
 * 
 * @param clientId - The client ID to use for RLS context
 * @param operation - The database operation to execute
 * @returns Promise with the operation result
 */
export async function withClientContext<T>(
  clientId: string, 
  operation: () => Promise<T>
): Promise<T> {
  await setClientContext(clientId);
  return await operation();
}

/**
 * Validate that a client has access to a resource
 * This can be used in API routes to ensure proper access control
 * 
 * @param clientId - The client ID requesting access
 * @param resourceClientId - The client ID that owns the resource
 * @returns boolean indicating if access is allowed
 */
export function validateClientAccess(clientId: string, resourceClientId: string | null): boolean {
  // Allow access if the client IDs match
  if (clientId === resourceClientId) {
    return true;
  }
  
  // Allow access to global resources (client_id is null)
  if (resourceClientId === null) {
    return true;
  }
  
  return false;
}

/**
 * Get client ID from request headers or session
 * This extracts the client ID from various sources in API routes
 * 
 * @param request - The NextRequest object
 * @returns string | null - The client ID or null if not found
 */
export function getClientIdFromRequest(request: Request): string | null {
  // Try to get from Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.client_id || null;
    } catch (error) {
      console.warn('[RLS Helper] Failed to parse client_id from auth header:', error);
    }
  }
  
  // Try to get from X-Client-ID header
  const clientIdHeader = request.headers.get('x-client-id');
  if (clientIdHeader) {
    return clientIdHeader;
  }
  
  return null;
}

/**
 * Create RLS-safe database operations
 * This provides a set of common database operations that respect RLS policies
 */
export const rlsOperations = {
  /**
   * Get email templates for a client
   */
  async getEmailTemplates(clientId: string) {
    return withClientContext(clientId, async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    });
  },

  /**
   * Create an email template for a client
   */
  async createEmailTemplate(clientId: string, template: any) {
    return withClientContext(clientId, async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .insert({ ...template, client_id: clientId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    });
  },

  /**
   * Get outreach campaigns for a client
   */
  async getOutreachCampaigns(clientId: string) {
    return withClientContext(clientId, async () => {
      const { data, error } = await supabase
        .from('outreach_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    });
  },

  /**
   * Create an outreach campaign for a client
   */
  async createOutreachCampaign(clientId: string, campaign: any) {
    return withClientContext(clientId, async () => {
      const { data, error } = await supabase
        .from('outreach_campaigns')
        .insert({ ...campaign, client_id: clientId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    });
  },

  /**
   * Get outreach emails for a client
   */
  async getOutreachEmails(clientId: string, campaignId?: string) {
    return withClientContext(clientId, async () => {
      let query = supabase
        .from('outreach_emails')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    });
  },

  /**
   * Create an outreach email for a client
   */
  async createOutreachEmail(clientId: string, email: any) {
    return withClientContext(clientId, async () => {
      const { data, error } = await supabase
        .from('outreach_emails')
        .insert({ ...email, client_id: clientId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    });
  },

  /**
   * Get outreach metrics for a client
   */
  async getOutreachMetrics(clientId: string, campaignId?: string) {
    return withClientContext(clientId, async () => {
      let query = supabase
        .from('outreach_metrics')
        .select('*');
      
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    });
  },

  /**
   * Get outreach tracking for a client
   */
  async getOutreachTracking(clientId: string, emailId?: string) {
    return withClientContext(clientId, async () => {
      let query = supabase
        .from('outreach_tracking')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (emailId) {
        query = query.eq('email_id', emailId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    });
  }
};
