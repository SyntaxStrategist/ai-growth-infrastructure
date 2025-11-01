#!/usr/bin/env node
/**
 * Cleanup Orphaned Leads
 * 
 * Finds leads in lead_memory that are NOT linked to any client in lead_actions
 * and provides options to fix the issue.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test email patterns
const TEST_PATTERNS = [
  'example.com',
  'test@',
  '@test.',
  'example@',
  'demo@',
  '@demo.',
  'sample@',
  '@sample.',
  'fake@',
  '@fake.',
];

function isTestEmail(email) {
  const emailLower = email.toLowerCase();
  return TEST_PATTERNS.some(pattern => emailLower.includes(pattern));
}

async function findOrphanedLeads() {
  console.log('\n🔍 Finding orphaned leads...\n');
  
  // Get all lead IDs from lead_actions
  const { data: linkedLeadIds, error: actionsError } = await supabase
    .from('lead_actions')
    .select('lead_id');
  
  if (actionsError) {
    console.error('❌ Error fetching lead_actions:', actionsError);
    throw actionsError;
  }
  
  const linkedIds = new Set((linkedLeadIds || []).map(la => la.lead_id));
  console.log(`📊 Found ${linkedIds.size} leads linked in lead_actions table`);
  
  // Get all leads from lead_memory
  const { data: allLeads, error: leadsError } = await supabase
    .from('lead_memory')
    .select('id, name, email, message, timestamp, is_test, client_id, deleted, archived')
    .order('timestamp', { ascending: false });
  
  if (leadsError) {
    console.error('❌ Error fetching lead_memory:', leadsError);
    throw leadsError;
  }
  
  console.log(`📊 Found ${allLeads.length} total leads in lead_memory table\n`);
  
  // Find orphaned leads (in lead_memory but NOT in lead_actions)
  const orphanedLeads = allLeads.filter(lead => !linkedIds.has(lead.id));
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚨 ORPHANED LEADS REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📊 Total orphaned leads: ${orphanedLeads.length}`);
  
  if (orphanedLeads.length === 0) {
    console.log('\n✅ No orphaned leads found! Your database is clean.\n');
    return { orphanedLeads: [], testLeads: [], realLeads: [] };
  }
  
  // Categorize orphaned leads
  const testLeads = orphanedLeads.filter(lead => 
    lead.is_test || isTestEmail(lead.email)
  );
  const realLeads = orphanedLeads.filter(lead => 
    !lead.is_test && !isTestEmail(lead.email)
  );
  
  console.log(`   🧪 Test/demo leads: ${testLeads.length}`);
  console.log(`   👤 Real leads: ${realLeads.length}`);
  console.log(`   🗑️  Already deleted: ${orphanedLeads.filter(l => l.deleted).length}`);
  console.log(`   📦 Already archived: ${orphanedLeads.filter(l => l.archived).length}`);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Show sample of orphaned leads
  console.log('📋 Sample of orphaned leads:\n');
  orphanedLeads.slice(0, 10).forEach((lead, idx) => {
    const isTest = lead.is_test || isTestEmail(lead.email);
    const badge = isTest ? '🧪' : '👤';
    const status = lead.deleted ? '[DELETED]' : lead.archived ? '[ARCHIVED]' : '[ACTIVE]';
    console.log(`${idx + 1}. ${badge} ${status} ${lead.name} <${lead.email}>`);
    console.log(`   Date: ${new Date(lead.timestamp).toLocaleString()}`);
    console.log(`   Message: ${lead.message.substring(0, 80)}...`);
    console.log('');
  });
  
  if (orphanedLeads.length > 10) {
    console.log(`   ... and ${orphanedLeads.length - 10} more\n`);
  }
  
  return { orphanedLeads, testLeads, realLeads };
}

async function linkToAvenirClient(leadIds) {
  console.log(`\n🔗 Linking ${leadIds.length} leads to Avenir AI Solutions client...\n`);
  
  const AVENIR_CLIENT_ID = '00000000-0000-0000-0000-000000000001';
  const now = new Date().toISOString();
  
  const actionRecords = leadIds.map(leadId => ({
    lead_id: leadId,
    client_id: AVENIR_CLIENT_ID,
    action_type: 'insert',
    tag: 'New Lead',
    created_at: now,
    timestamp: now,
    is_test: false,
  }));
  
  const { data, error } = await supabase
    .from('lead_actions')
    .insert(actionRecords)
    .select();
  
  if (error) {
    console.error('❌ Error linking leads:', error);
    throw error;
  }
  
  console.log(`✅ Successfully linked ${data.length} leads to Avenir client`);
  return data;
}

async function deleteLeads(leadIds, permanent = false) {
  console.log(`\n🗑️  ${permanent ? 'PERMANENTLY deleting' : 'Soft deleting'} ${leadIds.length} leads...\n`);
  
  if (permanent) {
    const { error } = await supabase
      .from('lead_memory')
      .delete()
      .in('id', leadIds);
    
    if (error) {
      console.error('❌ Error deleting leads:', error);
      throw error;
    }
  } else {
    const { error } = await supabase
      .from('lead_memory')
      .update({ deleted: true, archived: true })
      .in('id', leadIds);
    
    if (error) {
      console.error('❌ Error soft deleting leads:', error);
      throw error;
    }
  }
  
  console.log(`✅ Successfully ${permanent ? 'permanently deleted' : 'soft deleted'} ${leadIds.length} leads`);
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0]; // 'scan', 'link-all', 'link-real', 'delete-test', 'delete-all'
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        ORPHANED LEADS CLEANUP UTILITY                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const { orphanedLeads, testLeads, realLeads } = await findOrphanedLeads();
  
  if (orphanedLeads.length === 0) {
    return;
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🛠️  CLEANUP OPTIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (!mode) {
    console.log('Usage: node scripts/cleanup-orphaned-leads.js <mode>\n');
    console.log('Available modes:\n');
    console.log('  scan              - Just scan and report (no changes)');
    console.log('  link-all          - Link ALL orphaned leads to Avenir client');
    console.log(`  link-real         - Link only real leads (${realLeads.length}) to Avenir client`);
    console.log(`  delete-test       - Delete test leads (${testLeads.length}) only`);
    console.log(`  delete-all        - Delete ALL orphaned leads (${orphanedLeads.length})`);
    console.log('  link-and-clean    - Link real leads + delete test leads (RECOMMENDED)');
    console.log('');
    return;
  }
  
  switch (mode) {
    case 'scan':
      console.log('✅ Scan complete. No changes made.\n');
      break;
      
    case 'link-all':
      await linkToAvenirClient(orphanedLeads.map(l => l.id));
      console.log('\n✅ Done! All orphaned leads are now linked to Avenir client.\n');
      break;
      
    case 'link-real':
      if (realLeads.length === 0) {
        console.log('ℹ️  No real leads to link.\n');
      } else {
        await linkToAvenirClient(realLeads.map(l => l.id));
        console.log('\n✅ Done! Real leads are now linked to Avenir client.\n');
      }
      break;
      
    case 'delete-test':
      if (testLeads.length === 0) {
        console.log('ℹ️  No test leads to delete.\n');
      } else {
        await deleteLeads(testLeads.map(l => l.id));
        console.log('\n✅ Done! Test leads have been soft deleted.\n');
      }
      break;
      
    case 'delete-all':
      await deleteLeads(orphanedLeads.map(l => l.id));
      console.log('\n✅ Done! All orphaned leads have been soft deleted.\n');
      break;
      
    case 'link-and-clean':
      console.log('\n🚀 RECOMMENDED: Link real leads + Delete test leads\n');
      
      if (realLeads.length > 0) {
        await linkToAvenirClient(realLeads.map(l => l.id));
      } else {
        console.log('ℹ️  No real leads to link.');
      }
      
      if (testLeads.length > 0) {
        await deleteLeads(testLeads.map(l => l.id));
      } else {
        console.log('ℹ️  No test leads to delete.');
      }
      
      console.log('\n✅ Done! Database cleaned up.\n');
      break;
      
    default:
      console.log(`❌ Unknown mode: ${mode}\n`);
      console.log('Run without arguments to see available modes.\n');
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});

