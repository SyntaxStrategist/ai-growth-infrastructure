-- Fix multiple_permissive_policies issues by merging overlapping policies
-- This reduces policy evaluation overhead and improves performance

-- Fix lead_notes table - merge overlapping policies
DROP POLICY IF EXISTS "Clients can view their own notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Clients can update their own notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Clients can delete their own notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Users can view their own client's lead notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Users can update lead notes for their own clients" ON public.lead_notes;
DROP POLICY IF EXISTS "Users can delete lead notes for their own clients" ON public.lead_notes;
DROP POLICY IF EXISTS "Service role has full access to lead_notes" ON public.lead_notes;

-- Create unified policies for lead_notes
CREATE POLICY "lead_notes_select_policy" ON public.lead_notes
  FOR SELECT
  USING (
    (SELECT auth.role()) = 'service_role' OR
    client_id = (SELECT auth.uid())
  );

CREATE POLICY "lead_notes_insert_policy" ON public.lead_notes
  FOR INSERT
  WITH CHECK (
    (SELECT auth.role()) = 'service_role' OR
    client_id = (SELECT auth.uid())
  );

CREATE POLICY "lead_notes_update_policy" ON public.lead_notes
  FOR UPDATE
  USING (
    (SELECT auth.role()) = 'service_role' OR
    client_id = (SELECT auth.uid())
  );

CREATE POLICY "lead_notes_delete_policy" ON public.lead_notes
  FOR DELETE
  USING (
    (SELECT auth.role()) = 'service_role' OR
    client_id = (SELECT auth.uid())
  );

-- Fix lead_memory table - merge overlapping policies
DROP POLICY IF EXISTS "Users can view their own client's leads" ON public.lead_memory;
DROP POLICY IF EXISTS "Users can update leads for their own clients" ON public.lead_memory;
DROP POLICY IF EXISTS "Users can delete leads for their own clients" ON public.lead_memory;
DROP POLICY IF EXISTS "Service role has full access to lead_memory" ON public.lead_memory;

-- Create unified policies for lead_memory
CREATE POLICY "lead_memory_select_policy" ON public.lead_memory
  FOR SELECT
  USING (
    (SELECT auth.role()) = 'service_role' OR
    client_id IN (
      SELECT id FROM public.clients WHERE (SELECT auth.uid())::text = id::text
    )
  );

CREATE POLICY "lead_memory_insert_policy" ON public.lead_memory
  FOR INSERT
  WITH CHECK (
    (SELECT auth.role()) = 'service_role' OR
    client_id IN (
      SELECT id FROM public.clients WHERE (SELECT auth.uid())::text = id::text
    )
  );

CREATE POLICY "lead_memory_update_policy" ON public.lead_memory
  FOR UPDATE
  USING (
    (SELECT auth.role()) = 'service_role' OR
    client_id IN (
      SELECT id FROM public.clients WHERE (SELECT auth.uid())::text = id::text
    )
  );

CREATE POLICY "lead_memory_delete_policy" ON public.lead_memory
  FOR DELETE
  USING (
    (SELECT auth.role()) = 'service_role' OR
    client_id IN (
      SELECT id FROM public.clients WHERE (SELECT auth.uid())::text = id::text
    )
  );

-- Fix lead_actions table - merge overlapping policies
DROP POLICY IF EXISTS "Users can view their own client's lead actions" ON public.lead_actions;
DROP POLICY IF EXISTS "Users can update lead actions for their own clients" ON public.lead_actions;
DROP POLICY IF EXISTS "Users can delete lead actions for their own clients" ON public.lead_actions;
DROP POLICY IF EXISTS "Service role has full access to lead_actions" ON public.lead_actions;

-- Create unified policies for lead_actions
CREATE POLICY "lead_actions_select_policy" ON public.lead_actions
  FOR SELECT
  USING (
    (SELECT auth.role()) = 'service_role' OR
    client_id IN (
      SELECT id FROM public.clients WHERE (SELECT auth.uid())::text = id::text
    )
  );

CREATE POLICY "lead_actions_insert_policy" ON public.lead_actions
  FOR INSERT
  WITH CHECK (
    (SELECT auth.role()) = 'service_role' OR
    client_id IN (
      SELECT id FROM public.clients WHERE (SELECT auth.uid())::text = id::text
    )
  );

CREATE POLICY "lead_actions_update_policy" ON public.lead_actions
  FOR UPDATE
  USING (
    (SELECT auth.role()) = 'service_role' OR
    client_id IN (
      SELECT id FROM public.clients WHERE (SELECT auth.uid())::text = id::text
    )
  );

CREATE POLICY "lead_actions_delete_policy" ON public.lead_actions
  FOR DELETE
  USING (
    (SELECT auth.role()) = 'service_role' OR
    client_id IN (
      SELECT id FROM public.clients WHERE (SELECT auth.uid())::text = id::text
    )
  );

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Multiple permissive policies issues fixed!';
  RAISE NOTICE '   - Merged overlapping policies on lead_notes, lead_memory, lead_actions';
  RAISE NOTICE '   - Reduced policy evaluation overhead';
  RAISE NOTICE '   - Maintained same access logic with better performance';
END $$;
