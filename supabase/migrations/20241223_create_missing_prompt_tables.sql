-- Create missing prompt optimization tables
-- These tables should have been created by the 20241221 migration but weren't due to the duplicate key error

-- 1. Prompt Performance Tracking Table
CREATE TABLE IF NOT EXISTS public.prompt_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_registry_id UUID REFERENCES public.prompt_registry(id) ON DELETE CASCADE,
  execution_id VARCHAR(100),
  input_data JSONB,
  output_data JSONB,
  success BOOLEAN DEFAULT TRUE,
  error_occurred BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  response_time_ms INTEGER,
  output_quality_score DECIMAL(5,3),
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  client_id UUID,
  request_id VARCHAR(100)
);

-- 2. Prompt A/B Testing Table
CREATE TABLE IF NOT EXISTS public.prompt_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name VARCHAR(200) NOT NULL,
  test_description TEXT,
  prompt_name VARCHAR(100) NOT NULL,
  control_variant_id VARCHAR(50) NOT NULL,
  treatment_variant_id VARCHAR(50) NOT NULL,
  control_traffic_percentage DECIMAL(5,2) DEFAULT 50.0,
  treatment_traffic_percentage DECIMAL(5,2) DEFAULT 50.0,
  min_sample_size INTEGER DEFAULT 100,
  max_duration_days INTEGER DEFAULT 30,
  status VARCHAR(20) DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  statistical_significance DECIMAL(5,4),
  winner_variant_id VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Prompt Evolution History Table
CREATE TABLE IF NOT EXISTS public.prompt_evolution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_name VARCHAR(100) NOT NULL,
  parent_variant_id VARCHAR(50) NOT NULL,
  child_variant_id VARCHAR(50) NOT NULL,
  evolution_strategy VARCHAR(100) NOT NULL,
  evolution_algorithm VARCHAR(50),
  feedback_data JSONB,
  improvement_score DECIMAL(5,3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for the new tables
CREATE INDEX IF NOT EXISTS idx_prompt_performance_registry_id 
ON public.prompt_performance (prompt_registry_id);

CREATE INDEX IF NOT EXISTS idx_prompt_performance_executed_at 
ON public.prompt_performance (executed_at);

CREATE INDEX IF NOT EXISTS idx_prompt_performance_success 
ON public.prompt_performance (success);

CREATE INDEX IF NOT EXISTS idx_prompt_ab_tests_prompt_name 
ON public.prompt_ab_tests (prompt_name);

CREATE INDEX IF NOT EXISTS idx_prompt_ab_tests_status 
ON public.prompt_ab_tests (status);

CREATE INDEX IF NOT EXISTS idx_prompt_evolution_prompt_name 
ON public.prompt_evolution (prompt_name);

CREATE INDEX IF NOT EXISTS idx_prompt_evolution_created_at 
ON public.prompt_evolution (created_at);

-- Add comments for documentation
COMMENT ON TABLE public.prompt_performance IS 'Phase 2.2: Tracks individual prompt execution results and performance';
COMMENT ON TABLE public.prompt_ab_tests IS 'Phase 2.2: Manages A/B testing of prompt variants';
COMMENT ON TABLE public.prompt_evolution IS 'Phase 2.2: Tracks prompt evolution and optimization history';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Missing prompt optimization tables created successfully!';
  RAISE NOTICE '   - prompt_performance: Individual execution tracking';
  RAISE NOTICE '   - prompt_ab_tests: A/B testing management';
  RAISE NOTICE '   - prompt_evolution: Evolution history tracking';
  RAISE NOTICE '   - All indexes created for performance';
  RAISE NOTICE '';
END $$;
