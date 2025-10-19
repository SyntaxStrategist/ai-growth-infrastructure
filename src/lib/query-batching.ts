/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './supabase';

/**
 * Batch multiple Supabase queries for better performance
 */
export async function batchSupabaseQueries(
  queries: Array<() => Promise<{ data: any; error: any }>>
): Promise<Record<string, { data: any; error: any }>> {
  try {
    // Execute all queries in parallel
    const results = await Promise.all(queries.map(query => query()));
    
    // Transform results into a keyed object
    const batchedResults: Record<string, { data: any; error: any }> = {};
    
    results.forEach((result, index) => {
      const key = `query_${index}`;
      batchedResults[key] = result;
    });
    
    return batchedResults;
  } catch (error) {
    console.error('[QueryBatching] Error batching queries:', error);
    throw error;
  }
}

/**
 * Optimized function to get client data and leads in a single batch
 */
export async function getClientDataAndLeads(
  clientId: string,
  status: string = 'active',
  page: number = 1,
  limit: number = 5
) {
  try {
    // Batch the client lookup and leads query
    const [clientResult, leadsResult] = await Promise.all([
      // Client lookup query
      supabase
        .from('clients')
        .select('id, client_id')
        .eq('client_id', clientId)
        .single(),
      
      // Leads query (we'll need to do this in two steps due to the join)
      supabase
        .from('lead_actions')
        .select(`
          lead_id,
          client_id,
          tag,
          lead_memory!inner(
            id,
            name,
            email,
            message,
            ai_summary,
            language,
            timestamp,
            intent,
            tone,
            urgency,
            confidence_score,
            archived,
            deleted,
            current_tag,
            relationship_insight,
            tone_history,
            urgency_history,
            last_updated
          )
        `)
        .eq('client_id', clientId)
        .range((page - 1) * limit, page * limit - 1)
    ]);

    return {
      client: clientResult,
      leads: leadsResult
    };
  } catch (error) {
    console.error('[QueryBatching] Error in getClientDataAndLeads:', error);
    throw error;
  }
}

/**
 * Optimized function to get client data and all leads for stats
 */
export async function getClientDataAndAllLeads(
  clientId: string,
  status: string = 'active'
) {
  try {
    // Batch the client lookup and all leads query
    const [clientResult, allLeadsResult] = await Promise.all([
      // Client lookup query
      supabase
        .from('clients')
        .select('id, client_id')
        .eq('client_id', clientId)
        .single(),
      
      // All leads query for stats
      supabase
        .from('lead_actions')
        .select(`
          lead_id,
          client_id,
          tag,
          lead_memory!inner(
            id,
            name,
            email,
            message,
            ai_summary,
            language,
            timestamp,
            intent,
            tone,
            urgency,
            confidence_score,
            archived,
            deleted,
            current_tag,
            relationship_insight,
            tone_history,
            urgency_history,
            last_updated
          )
        `)
        .eq('client_id', clientId)
        .limit(1000) // Get all leads for stats calculation
    ]);

    return {
      client: clientResult,
      allLeads: allLeadsResult
    };
  } catch (error) {
    console.error('[QueryBatching] Error in getClientDataAndAllLeads:', error);
    throw error;
  }
}

/**
 * Optimized function to get leads insights with batching
 */
export async function getLeadsInsightsBatch(
  clientId: string,
  locale: string = 'en'
) {
  try {
    // Batch multiple queries for insights
    const [clientResult, leadsResult, actionsResult] = await Promise.all([
      // Client lookup
      supabase
        .from('clients')
        .select('id, client_id')
        .eq('client_id', clientId)
        .single(),
      
      // Leads with insights
      supabase
        .from('lead_actions')
        .select(`
          lead_id,
          client_id,
          tag,
          lead_memory!inner(
            id,
            name,
            email,
            message,
            ai_summary,
            language,
            timestamp,
            intent,
            tone,
            urgency,
            confidence_score,
            archived,
            deleted,
            current_tag,
            relationship_insight,
            tone_history,
            urgency_history,
            last_updated
          )
        `)
        .eq('client_id', clientId)
        .limit(100),
      
      // Recent actions
      supabase
        .from('lead_actions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    return {
      client: clientResult,
      leads: leadsResult,
      actions: actionsResult
    };
  } catch (error) {
    console.error('[QueryBatching] Error in getLeadsInsightsBatch:', error);
    throw error;
  }
}
