-- Fix auth_rls_initplan issues by replacing direct auth.uid()/auth.role() calls with SELECT subqueries
-- This prevents re-evaluation per row and improves performance

-- Drop existing policies that use direct auth.uid() calls
DROP POLICY IF EXISTS "Clients can view own data" ON public.clients;
DROP POLICY IF EXISTS "Clients can update own data" ON public.clients;

-- Recreate with optimized syntax
CREATE POLICY "Clients can view own data" ON public.clients
  FOR SELECT
  USING ((SELECT auth.uid())::text = id::text);

CREATE POLICY "Clients can update own data" ON public.clients
  FOR UPDATE
  USING ((SELECT auth.uid())::text = id::text);

-- Fix lead_notes policies
DROP POLICY IF EXISTS "Clients can view their own notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Clients can update their own notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Clients can delete their own notes" ON public.lead_notes;

CREATE POLICY "Clients can view their own notes" ON public.lead_notes
  FOR SELECT
  USING (client_id = (SELECT auth.uid()));

CREATE POLICY "Clients can update their own notes" ON public.lead_notes
  FOR UPDATE
  USING (client_id = (SELECT auth.uid()));

CREATE POLICY "Clients can delete their own notes" ON public.lead_notes
  FOR DELETE
  USING (client_id = (SELECT auth.uid()));

-- Fix feedback_tracking policies
DROP POLICY IF EXISTS "Allow authenticated update to feedback_tracking" ON public.feedback_tracking;

CREATE POLICY "Allow authenticated update to feedback_tracking" ON public.feedback_tracking
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

-- Fix intent_translations policies
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.intent_translations;

CREATE POLICY "Allow read access for authenticated users" ON public.intent_translations
  FOR SELECT
  USING ((SELECT auth.role()) = 'authenticated');

-- Fix performance_metrics policies
DROP POLICY IF EXISTS "Allow authenticated update to performance_metrics" ON public.performance_metrics;

CREATE POLICY "Allow authenticated update to performance_metrics" ON public.performance_metrics
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

-- Fix prompt policies
DROP POLICY IF EXISTS "Allow authenticated update to prompt_ab_tests" ON public.prompt_ab_tests;
DROP POLICY IF EXISTS "Allow authenticated update to prompt_registry" ON public.prompt_registry;

CREATE POLICY "Allow authenticated update to prompt_ab_tests" ON public.prompt_ab_tests
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated update to prompt_registry" ON public.prompt_registry
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

-- Fix prospect policies
DROP POLICY IF EXISTS "Allow authenticated update to prospect_adaptive_weights" ON public.prospect_adaptive_weights;
DROP POLICY IF EXISTS "Allow authenticated update to prospect_conversion_patterns" ON public.prospect_conversion_patterns;
DROP POLICY IF EXISTS "Allow authenticated update to prospect_dynamic_scores" ON public.prospect_dynamic_scores;
DROP POLICY IF EXISTS "Allow authenticated update to prospect_learning_insights" ON public.prospect_learning_insights;
DROP POLICY IF EXISTS "Allow authenticated update to prospect_scoring_models" ON public.prospect_scoring_models;

CREATE POLICY "Allow authenticated update to prospect_adaptive_weights" ON public.prospect_adaptive_weights
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated update to prospect_conversion_patterns" ON public.prospect_conversion_patterns
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated update to prospect_dynamic_scores" ON public.prospect_dynamic_scores
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated update to prospect_learning_insights" ON public.prospect_learning_insights
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated update to prospect_scoring_models" ON public.prospect_scoring_models
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

-- Fix translation policies
DROP POLICY IF EXISTS "Allow authenticated update to translation_cache" ON public.translation_cache;
DROP POLICY IF EXISTS "Allow authenticated update to translation_dictionary" ON public.translation_dictionary;

CREATE POLICY "Allow authenticated update to translation_cache" ON public.translation_cache
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated update to translation_dictionary" ON public.translation_dictionary
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ auth_rls_initplan issues fixed!';
  RAISE NOTICE '   - Replaced direct auth.uid() calls with (SELECT auth.uid())';
  RAISE NOTICE '   - Replaced direct auth.role() calls with (SELECT auth.role())';
  RAISE NOTICE '   - This prevents re-evaluation per row and improves performance';
END $$;
