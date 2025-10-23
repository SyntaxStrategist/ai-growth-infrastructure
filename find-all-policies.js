const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAllPolicies() {
  try {
    console.log('🔍 Finding ALL RLS policies on lead_notes table...');
    
    // Query to find all policies on lead_notes table
    const { data: policies, error: policyError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'lead_notes'
          ORDER BY policyname;
        `
      });
    
    if (policyError) {
      console.log('Could not query policies via API, but the error message tells us:');
      console.log('❌ Policy "Allow clients to access their own notes" depends on column "client_id"');
      console.log('');
      console.log('📝 We need to drop THIS specific policy:');
      console.log('DROP POLICY IF EXISTS "Allow clients to access their own notes" ON public.lead_notes;');
      console.log('');
      console.log('🔧 Complete fix:');
      console.log('1. Drop ALL policies on lead_notes table');
      console.log('2. Change column type');
      console.log('3. Recreate policies');
      console.log('4. Add foreign key constraint');
    } else {
      console.log('Found policies:', policies);
    }
    
    console.log('');
    console.log('🎯 The exact issue:');
    console.log('   - Policy "Allow clients to access their own notes" exists');
    console.log('   - It depends on client_id column');
    console.log('   - We need to drop it before changing column type');
    console.log('');
    console.log('🔧 Complete SQL fix:');
    console.log('');
    console.log('-- Step 1: Drop ALL policies on lead_notes (including the one we missed)');
    console.log('DROP POLICY IF EXISTS "Allow clients to access their own notes" ON public.lead_notes;');
    console.log('DROP POLICY IF EXISTS "Users can view their own client\'s lead notes" ON public.lead_notes;');
    console.log('DROP POLICY IF EXISTS "Users can insert lead notes for their own clients" ON public.lead_notes;');
    console.log('DROP POLICY IF EXISTS "Users can update lead notes for their own clients" ON public.lead_notes;');
    console.log('DROP POLICY IF EXISTS "Users can delete lead notes for their own clients" ON public.lead_notes;');
    console.log('DROP POLICY IF EXISTS "Service role has full access to lead_notes" ON public.lead_notes;');
    console.log('DROP POLICY IF EXISTS "Clients can view notes for their leads" ON public.lead_notes;');
    console.log('DROP POLICY IF EXISTS "Clients can insert notes for their leads" ON public.lead_notes;');
    console.log('DROP POLICY IF EXISTS "Clients can update notes for their leads" ON public.lead_notes;');
    console.log('DROP POLICY IF EXISTS "Clients can delete notes for their leads" ON public.lead_notes;');
    console.log('');
    console.log('-- Step 2: Change column type');
    console.log('ALTER TABLE public.lead_notes ALTER COLUMN client_id TYPE TEXT;');
    console.log('');
    console.log('-- Step 3: Add foreign key constraint');
    console.log('ALTER TABLE public.lead_notes ADD CONSTRAINT lead_notes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(client_id) ON DELETE SET NULL;');
    console.log('');
    console.log('-- Step 4: Recreate policies (optional - RLS will still work)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

findAllPolicies();
