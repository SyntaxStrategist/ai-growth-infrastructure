/* eslint-disable @typescript-eslint/no-explicit-any */
import { runSimulationAnalysis } from './intelligence-engine';

/**
 * Automatically trigger Intelligence Engine for a client if no growth insights exist
 * This ensures Growth Copilot always has data to display
 */
export async function ensureGrowthInsightsForClient(clientId: string): Promise<boolean> {
  try {
    console.log('[AutoIntelligence] ============================================');
    console.log('[AutoIntelligence] Checking if growth insights exist for client:', clientId);
    console.log('[AutoIntelligence] ============================================');

    // Check if growth insights already exist for this client
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[AutoIntelligence] ❌ Missing Supabase credentials');
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Validate that client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, client_id')
      .eq('client_id', clientId)
      .single();

    if (clientError || !client) {
      console.error('[AutoIntelligence] ❌ Client not found:', clientId);
      return false;
    }

    const internalClientId = client.id;
    console.log('[AutoIntelligence] Resolved client_id:', {
      public: clientId,
      internal: internalClientId,
    });

    // Check if growth insights exist (query with PUBLIC client_id, not UUID)
    const { data: existingInsights, error: insightsError } = await supabase
      .from('growth_brain')
      .select('id, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (insightsError) {
      console.error('[AutoIntelligence] ❌ Error checking existing insights:', insightsError);
      return false;
    }

    if (existingInsights && existingInsights.length > 0) {
      const lastInsight = existingInsights[0];
      const lastInsightAge = Date.now() - new Date(lastInsight.created_at).getTime();
      const ageInHours = lastInsightAge / (1000 * 60 * 60);

      console.log('[AutoIntelligence] ✅ Growth insights exist:', {
        id: lastInsight.id,
        age_hours: ageInHours.toFixed(1),
        created_at: lastInsight.created_at,
      });

      // If insights are less than 24 hours old, no need to regenerate
      if (ageInHours < 24) {
        console.log('[AutoIntelligence] ✅ Insights are fresh (< 24h), no regeneration needed');
        return true;
      }

      console.log('[AutoIntelligence] ⚠️ Insights are stale (> 24h), regenerating...');
    } else {
      console.log('[AutoIntelligence] ⚠️ No growth insights found, generating...');
    }

    // Check if client has any leads (lead_memory stores PUBLIC client_id)
    const { data: leads, error: leadsError } = await supabase
      .from('lead_memory')
      .select('id')
      .eq('client_id', clientId)
      .limit(1);

    if (leadsError) {
      console.error('[AutoIntelligence] ❌ Error checking leads:', leadsError);
      return false;
    }

    if (!leads || leads.length === 0) {
      console.log('[AutoIntelligence] ⚠️ No leads found for client, skipping intelligence generation');
      return false;
    }

    console.log('[AutoIntelligence] ✅ Client has leads, triggering Intelligence Engine...');

    // Trigger Intelligence Engine for this client
    const result = await runSimulationAnalysis(clientId);

    console.log('[AutoIntelligence] ============================================');
    console.log('[AutoIntelligence] Intelligence Engine result:', {
      processed: result.processed,
      errors: result.errors,
      success: result.processed > 0 && result.errors === 0,
    });
    console.log('[AutoIntelligence] ============================================');

    return result.processed > 0 && result.errors === 0;
  } catch (error) {
    console.error('[AutoIntelligence] ❌ Error ensuring growth insights:', error);
    return false;
  }
}

/**
 * Trigger Intelligence Engine for all clients that need it
 * This can be called from a cron job or manually
 */
export async function ensureGrowthInsightsForAllClients(): Promise<{ processed: number; errors: number }> {
  try {
    console.log('[AutoIntelligence] ============================================');
    console.log('[AutoIntelligence] Ensuring growth insights for all clients...');
    console.log('[AutoIntelligence] ============================================');

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[AutoIntelligence] ❌ Missing Supabase credentials');
      return { processed: 0, errors: 1 };
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Get all clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('client_id, business_name')
      .eq('is_internal', false); // Exclude internal clients

    if (clientsError) {
      console.error('[AutoIntelligence] ❌ Error fetching clients:', clientsError);
      return { processed: 0, errors: 1 };
    }

    if (!clients || clients.length === 0) {
      console.log('[AutoIntelligence] ⚠️ No clients found');
      return { processed: 0, errors: 0 };
    }

    console.log('[AutoIntelligence] Found', clients.length, 'clients to process');

    let processed = 0;
    let errors = 0;

    for (const client of clients) {
      try {
        console.log('[AutoIntelligence] Processing client:', client.business_name || client.client_id);
        const success = await ensureGrowthInsightsForClient(client.client_id);
        if (success) {
          processed++;
        } else {
          errors++;
        }
      } catch (error) {
        console.error('[AutoIntelligence] ❌ Error processing client:', client.client_id, error);
        errors++;
      }
    }

    console.log('[AutoIntelligence] ============================================');
    console.log('[AutoIntelligence] Completed processing all clients:', {
      processed,
      errors,
      total: clients.length,
    });
    console.log('[AutoIntelligence] ============================================');

    return { processed, errors };
  } catch (error) {
    console.error('[AutoIntelligence] ❌ Error ensuring growth insights for all clients:', error);
    return { processed: 0, errors: 1 };
  }
}
