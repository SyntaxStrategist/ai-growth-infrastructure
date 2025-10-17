// ============================================
// Supabase Database Connector for Prospect Intelligence
// ============================================

import { createClient } from '@supabase/supabase-js';
import { ProspectCandidate } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[SupabaseConnector] Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

/**
 * Save prospects to database
 * Uses upsert to avoid duplicates based on website URL
 */
export async function saveProspectsToDatabase(prospects: ProspectCandidate[]): Promise<void> {
  console.log('[SupabaseConnector] ============================================');
  console.log('[SupabaseConnector] Saving', prospects.length, 'prospects to database');

  if (prospects.length === 0) {
    console.log('[SupabaseConnector] No prospects to save');
    return;
  }

  const  records = prospects.map(p => ({
    business_name: p.business_name,
    website: p.website,
    contact_email: p.contact_email || null,
    industry: p.industry || null,
    region: p.region || null,
    language: p.language || 'en',
    form_url: p.form_url || null,
    last_tested: p.last_tested || new Date().toISOString(),
    response_score: p.response_score || 0,
    automation_need_score: p.automation_need_score || 0,
    contacted: p.contacted || false,
    metadata: p.metadata || {}
  }));

  try {
    const { data, error } = await supabase
      .from('prospect_candidates')
      .upsert(records, { onConflict: 'website', ignoreDuplicates: false });

    if (error) {
      console.error('[SupabaseConnector] ❌ Error saving prospects:', error);
      throw error;
    }

    console.log('[SupabaseConnector] ✅ Successfully saved', prospects.length, 'prospects');
  } catch (error) {
    console.error('[SupabaseConnector] ❌ Database operation failed:', error);
    throw error;
  }
}

/**
 * Save outreach log to database
 */
export async function saveOutreachLog(outreachLog: {
  prospect_id: string;
  subject: string;
  email_body: string;
  status: string;
  metadata?: any;
}): Promise<string> {
  console.log('[SupabaseConnector] Saving outreach log for prospect:', outreachLog.prospect_id);

  try {
    const { data, error } = await supabase
      .from('prospect_outreach_log')
      .insert([{
        prospect_id: outreachLog.prospect_id,
        subject: outreachLog.subject,
        email_body: outreachLog.email_body,
        status: outreachLog.status,
        sent_at: new Date().toISOString(),
        metadata: outreachLog.metadata || {}
      }])
      .select('id')
      .single();

    if (error) {
      console.error('[SupabaseConnector] ❌ Error saving outreach log:', error);
      throw error;
    }

    // Update prospect as contacted
    await supabase
      .from('prospect_candidates')
      .update({ contacted: true, updated_at: new Date().toISOString() })
      .eq('id', outreachLog.prospect_id);

    console.log('[SupabaseConnector] ✅ Outreach log saved:', data.id);
    return data.id;
  } catch (error) {
    console.error('[SupabaseConnector] ❌ Failed to save outreach log:', error);
    throw error;
  }
}

/**
 * Update outreach log status (opened, replied, etc.)
 */
export async function updateOutreachStatus(
  outreachId: string,
  status: 'opened' | 'replied' | 'bounced' | 'ignored',
  metadata?: any
): Promise<void> {
  console.log('[SupabaseConnector] Updating outreach status:', outreachId, '->', status);

  const updates: any = {
    status,
    metadata
  };

  if (status === 'opened') {
    updates.opened_at = new Date().toISOString();
  } else if (status === 'replied') {
    updates.replied_at = new Date().toISOString();
  }

  try {
    const { error } = await supabase
      .from('prospect_outreach_log')
      .update(updates)
      .eq('id', outreachId);

    if (error) {
      console.error('[SupabaseConnector] ❌ Error updating outreach status:', error);
      throw error;
    }

    console.log('[SupabaseConnector] ✅ Outreach status updated');
  } catch (error) {
    console.error('[SupabaseConnector] ❌ Failed to update outreach status:', error);
    throw error;
  }
}

/**
 * Update industry performance metrics
 */
export async function updateIndustryMetrics(
  industry: string,
  metrics: {
    total_contacted?: number;
    total_opened?: number;
    total_replied?: number;
    open_rate?: number;
    reply_rate?: number;
    priority_score?: number;
  }
): Promise<void> {
  console.log('[SupabaseConnector] Updating industry metrics for:', industry);

  try {
    const { error } = await supabase
      .from('prospect_industry_performance')
      .upsert([{
        industry,
        ...metrics,
        last_updated: new Date().toISOString()
      }], { onConflict: 'industry' });

    if (error) {
      console.error('[SupabaseConnector] ❌ Error updating industry metrics:', error);
      throw error;
    }

    console.log('[SupabaseConnector] ✅ Industry metrics updated');
  } catch (error) {
    console.error('[SupabaseConnector] ❌ Failed to update industry metrics:', error);
    throw error;
  }
}

/**
 * Get prospects by ID
 */
export async function getProspectById(id: string): Promise<ProspectCandidate | null> {
  try {
    const { data, error } = await supabase
      .from('prospect_candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[SupabaseConnector] Error fetching prospect:', error);
      return null;
    }

    return data as ProspectCandidate;
  } catch (error) {
    console.error('[SupabaseConnector] Failed to get prospect:', error);
    return null;
  }
}

/**
 * Get prospects by website
 */
export async function getProspectByWebsite(website: string): Promise<ProspectCandidate | null> {
  try {
    const { data, error } = await supabase
      .from('prospect_candidates')
      .select('*')
      .eq('website', website)
      .single();

    if (error) {
      return null;
    }

    return data as ProspectCandidate;
  } catch (error) {
    return null;
  }
}

/**
 * Get all outreach logs for a prospect
 */
export async function getOutreachLogsForProspect(prospectId: string) {
  try {
    const { data, error } = await supabase
      .from('prospect_outreach_log')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('[SupabaseConnector] Error fetching outreach logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[SupabaseConnector] Failed to get outreach logs:', error);
    return [];
  }
}

/**
 * Calculate and update performance metrics
 */
export async function calculateAndSavePerformanceMetrics(): Promise<void> {
  console.log('[SupabaseConnector] ============================================');
  console.log('[SupabaseConnector] Calculating performance metrics...');

  try {
    // Get all outreach logs
    const { data: logs, error: logsError } = await supabase
      .from('prospect_outreach_log')
      .select('*, prospect_candidates(industry)')
      .order('sent_at', { ascending: false });

    if (logsError) throw logsError;

    // Group by industry
    const industryStats: Record<string, {
      contacted: number;
      opened: number;
      replied: number;
    }> = {};

    (logs || []).forEach((log: any) => {
      const industry = log.prospect_candidates?.industry || 'Unknown';
      
      if (!industryStats[industry]) {
        industryStats[industry] = { contacted: 0, opened: 0, replied: 0 };
      }

      industryStats[industry].contacted++;
      
      if (log.status === 'opened' || log.opened_at) {
        industryStats[industry].opened++;
      }
      
      if (log.status === 'replied' || log.replied_at) {
        industryStats[industry].replied++;
      }
    });

    // Save metrics for each industry
    for (const [industry, stats] of Object.entries(industryStats)) {
      const openRate = stats.contacted > 0 ? (stats.opened / stats.contacted) * 100 : 0;
      const replyRate = stats.contacted > 0 ? (stats.replied / stats.contacted) * 100 : 0;
      const priorityScore = (openRate * 0.4) + (replyRate * 0.6); // Reply rate weighted higher

      await updateIndustryMetrics(industry, {
        total_contacted: stats.contacted,
        total_opened: stats.opened,
        total_replied: stats.replied,
        open_rate: Math.round(openRate * 100) / 100,
        reply_rate: Math.round(replyRate * 100) / 100,
        priority_score: Math.round(priorityScore * 100) / 100
      });
    }

    console.log('[SupabaseConnector] ✅ Performance metrics calculated and saved');
    console.log('[SupabaseConnector] Industries tracked:', Object.keys(industryStats).length);
  } catch (error) {
    console.error('[SupabaseConnector] ❌ Failed to calculate performance metrics:', error);
    throw error;
  }
}

