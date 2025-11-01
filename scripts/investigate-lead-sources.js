#!/usr/bin/env node
/**
 * Investigate Lead Sources
 * WHO created these leads?
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateLeadSources() {
  console.log('\n🔍 INVESTIGATING LEAD SOURCES\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Get all leads with timestamps
  const { data: allLeads, error } = await supabase
    .from('lead_memory')
    .select('id, name, email, message, timestamp, client_id, is_test')
    .order('timestamp', { ascending: false });
  
  if (error) {
    console.error('❌ Error:', error);
    throw error;
  }
  
  console.log(`📊 Total leads in database: ${allLeads.length}\n`);
  
  // Group by creation date
  const byDate = {};
  allLeads.forEach(lead => {
    const date = new Date(lead.timestamp).toDateString();
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(lead);
  });
  
  console.log('📅 LEADS BY DATE:\n');
  Object.keys(byDate).sort().reverse().forEach(date => {
    console.log(`   ${date}: ${byDate[date].length} leads`);
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Group by client_id
  const byClient = {};
  allLeads.forEach(lead => {
    const clientKey = lead.client_id || 'NULL (orphaned)';
    if (!byClient[clientKey]) byClient[clientKey] = [];
    byClient[clientKey].push(lead);
  });
  
  console.log('🏢 LEADS BY CLIENT:\n');
  for (const [clientId, leads] of Object.entries(byClient)) {
    console.log(`   ${clientId}: ${leads.length} leads`);
    if (clientId !== 'NULL (orphaned)' && leads.length > 0) {
      // Try to get client name
      const { data: client } = await supabase
        .from('clients')
        .select('business_name, name, email')
        .eq('client_id', clientId)
        .single();
      
      if (client) {
        console.log(`      → ${client.business_name || client.name} (${client.email})`);
      }
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Check lead_actions to see who inserted them
  console.log('🔍 CHECKING LEAD_ACTIONS TABLE...\n');
  
  const { data: actions, error: actionsError } = await supabase
    .from('lead_actions')
    .select('lead_id, client_id, action_type, created_at, tag')
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (actionsError) {
    console.error('❌ Error fetching actions:', actionsError);
  } else {
    const actionsByClient = {};
    actions.forEach(action => {
      if (!actionsByClient[action.client_id]) {
        actionsByClient[action.client_id] = 0;
      }
      actionsByClient[action.client_id]++;
    });
    
    console.log('📊 LEAD ACTIONS BY CLIENT:\n');
    for (const [clientId, count] of Object.entries(actionsByClient)) {
      console.log(`   ${clientId}: ${count} actions`);
      
      const { data: client } = await supabase
        .from('clients')
        .select('business_name, name')
        .eq('client_id', clientId)
        .single();
      
      if (client) {
        console.log(`      → ${client.business_name || client.name}`);
      }
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Look for patterns in orphaned leads
  const orphanedLeads = allLeads.filter(lead => !lead.client_id);
  
  if (orphanedLeads.length > 0) {
    console.log(`🚨 ORPHANED LEADS ANALYSIS (${orphanedLeads.length} total):\n`);
    
    // Check for bulk creation (same timestamp pattern)
    const timestamps = {};
    orphanedLeads.forEach(lead => {
      const hourKey = new Date(lead.timestamp).toISOString().substring(0, 13); // Group by hour
      if (!timestamps[hourKey]) timestamps[hourKey] = [];
      timestamps[hourKey].push(lead);
    });
    
    console.log('⏰ CREATION PATTERN (grouped by hour):\n');
    const sortedHours = Object.keys(timestamps).sort().reverse();
    sortedHours.slice(0, 10).forEach(hour => {
      const leads = timestamps[hour];
      console.log(`   ${hour}:xx → ${leads.length} leads`);
      
      // Show first few lead names to identify pattern
      const samples = leads.slice(0, 3).map(l => l.name).join(', ');
      console.log(`      Samples: ${samples}`);
    });
    
    // Check for sequential naming patterns
    console.log('\n🔢 NAMING PATTERNS:\n');
    const testLeadPattern = orphanedLeads.filter(l => /Test Lead \d+/i.test(l.name));
    const exampleEmailPattern = orphanedLeads.filter(l => l.email.includes('example.com'));
    const leadNumberPattern = orphanedLeads.filter(l => /lead\d+@/i.test(l.email));
    
    if (testLeadPattern.length > 0) {
      console.log(`   "Test Lead X" pattern: ${testLeadPattern.length} leads`);
    }
    if (exampleEmailPattern.length > 0) {
      console.log(`   @example.com emails: ${exampleEmailPattern.length} leads`);
    }
    if (leadNumberPattern.length > 0) {
      console.log(`   leadX@example.com emails: ${leadNumberPattern.length} leads`);
    }
    
    console.log('\n💡 CONCLUSION:\n');
    if (testLeadPattern.length > 30 || leadNumberPattern.length > 30) {
      console.log('   ✅ These appear to be BULK TEST LEADS from a seeding/testing script');
      console.log('   ✅ Likely created by: Development/testing automation');
      console.log('   ✅ Safe to delete: YES - these are synthetic test data');
    } else {
      console.log('   ⚠️  Mixed source - manual inspection recommended');
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

investigateLeadSources().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

