#!/usr/bin/env node

/**
 * Backfill script to create missing lead_actions records
 * This will fix the linkage between lead_memory and lead_actions
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const TEST_CLIENT_ID = 'a8c89837-7e45-44a4-a367-6010df87a723';

async function backfillLeadActions() {
  console.log('🔧 Backfilling lead_actions records...');
  console.log('========================================');
  
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials in environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('✅ Supabase client initialized');
    console.log(`📋 Test Client ID: ${TEST_CLIENT_ID}`);
    
    // Step 1: Get all leads from lead_memory for this client
    console.log('\n1. Fetching leads from lead_memory...');
    const { data: leads, error: leadsError } = await supabase
      .from('lead_memory')
      .select('*')
      .eq('client_id', TEST_CLIENT_ID)
      .eq('deleted', false);
    
    if (leadsError) {
      throw new Error(`Failed to fetch leads: ${leadsError.message}`);
    }
    
    console.log(`✅ Found ${leads?.length || 0} leads in lead_memory`);
    
    if (!leads || leads.length === 0) {
      console.log('❌ No leads found in lead_memory for this client');
      console.log('⚠️  This suggests the leads were never created in the database');
      return;
    }
    
    // Step 2: Get existing lead_actions for this client
    console.log('\n2. Checking existing lead_actions...');
    const { data: existingActions, error: actionsError } = await supabase
      .from('lead_actions')
      .select('lead_id')
      .eq('client_id', TEST_CLIENT_ID);
    
    if (actionsError) {
      throw new Error(`Failed to fetch lead_actions: ${actionsError.message}`);
    }
    
    const existingLeadIds = new Set(existingActions?.map(a => a.lead_id) || []);
    console.log(`✅ Found ${existingLeadIds.size} existing lead_actions`);
    
    // Step 3: Identify missing lead_actions
    const missingLeads = leads.filter(lead => !existingLeadIds.has(lead.id));
    console.log(`📊 Missing lead_actions: ${missingLeads.length}`);
    
    if (missingLeads.length === 0) {
      console.log('✅ All leads already have lead_actions records');
      return;
    }
    
    // Step 4: Create missing lead_actions
    console.log('\n3. Creating missing lead_actions...');
    let created = 0;
    let failed = 0;
    
    for (const lead of missingLeads) {
      const actionRecord = {
        lead_id: lead.id,
        client_id: TEST_CLIENT_ID,
        action: 'insert',
        timestamp: lead.timestamp || new Date().toISOString(),
        metadata: {
          source: 'backfill_script',
          backfilled_at: new Date().toISOString()
        }
      };
      
      const { error: insertError } = await supabase
        .from('lead_actions')
        .insert(actionRecord);
      
      if (insertError) {
        console.error(`❌ Failed to create lead_action for ${lead.id}:`, insertError.message);
        failed++;
      } else {
        console.log(`✅ Created lead_action for ${lead.name} (${lead.email})`);
        created++;
      }
    }
    
    // Step 5: Verify the fix
    console.log('\n4. Verifying the fix...');
    const { data: finalActions, error: finalError } = await supabase
      .from('lead_actions')
      .select('lead_id')
      .eq('client_id', TEST_CLIENT_ID);
    
    if (finalError) {
      throw new Error(`Failed to verify lead_actions: ${finalError.message}`);
    }
    
    console.log(`✅ Total lead_actions after backfill: ${finalActions?.length || 0}`);
    
    // Step 6: Test the dashboard query
    console.log('\n5. Testing dashboard query...');
    const { data: dashboardLeads, error: dashboardError } = await supabase
      .from('lead_actions')
      .select(`
        id,
        lead_id,
        action,
        timestamp,
        lead_memory!inner (
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
          last_updated
        )
      `)
      .eq('client_id', TEST_CLIENT_ID)
      .eq('lead_memory.deleted', false)
      .order('timestamp', { ascending: false })
      .limit(20);
    
    if (dashboardError) {
      console.error('❌ Dashboard query failed:', dashboardError.message);
    } else {
      console.log(`✅ Dashboard query successful: ${dashboardLeads?.length || 0} leads found`);
    }
    
    // Summary
    console.log('\n📋 BACKFILL SUMMARY');
    console.log('===================');
    console.log(`Leads in lead_memory: ${leads.length}`);
    console.log(`Existing lead_actions: ${existingLeadIds.size}`);
    console.log(`Missing lead_actions: ${missingLeads.length}`);
    console.log(`Successfully created: ${created}`);
    console.log(`Failed to create: ${failed}`);
    console.log(`Total lead_actions now: ${finalActions?.length || 0}`);
    console.log(`Dashboard can access: ${dashboardLeads?.length || 0} leads`);
    
    if (created > 0) {
      console.log('\n✅ SUCCESS: Lead linkage has been repaired!');
      console.log('The dashboard should now display all leads correctly.');
    } else if (leads.length === 0) {
      console.log('\n❌ ISSUE: No leads exist in lead_memory');
      console.log('The upsertLeadWithHistory function is not creating leads in the database.');
    } else {
      console.log('\n✅ All lead_actions were already in place');
    }
    
  } catch (error) {
    console.error('❌ Backfill failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

backfillLeadActions();
