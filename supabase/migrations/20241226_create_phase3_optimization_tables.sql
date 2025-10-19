-- ============================================
-- Phase 3: Prospect Optimization Engine
-- Database Schema for Adaptive Learning and Dynamic Scoring
-- ============================================

-- 1. Prospect Learning Insights Table
-- Stores insights from conversion analysis
CREATE TABLE IF NOT EXISTS public.prospect_learning_insights (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'current_insights',
  insights_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Prospect Adaptive Weights Table
-- Stores adaptive weights learned from conversion data
CREATE TABLE IF NOT EXISTS public.prospect_adaptive_weights (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'current_weights',
  weights_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Prospect Conversion Patterns Table
-- Stores identified conversion patterns
CREATE TABLE IF NOT EXISTS public.prospect_conversion_patterns (
  id VARCHAR(100) PRIMARY KEY,
  pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN ('industry', 'company_size', 'tech_stack', 'pain_point', 'geography', 'icp_score')),
  pattern_value VARCHAR(200) NOT NULL,
  conversion_rate DECIMAL(5,4) NOT NULL,
  total_prospects INTEGER NOT NULL,
  total_conversions INTEGER NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  trend VARCHAR(20) DEFAULT 'stable' CHECK (trend IN ('increasing', 'decreasing', 'stable')),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Prospect Conversion Insights Table
-- Stores actionable insights from pattern analysis
CREATE TABLE IF NOT EXISTS public.prospect_conversion_insights (
  id VARCHAR(100) PRIMARY KEY,
  insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('high_converter', 'low_converter', 'emerging_trend', 'declining_trend')),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  impact VARCHAR(20) NOT NULL CHECK (impact IN ('high', 'medium', 'low')),
  confidence DECIMAL(3,2) NOT NULL,
  data JSONB,
  recommendations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Prospect Scoring Models Table
-- Stores different scoring models and their performance
CREATE TABLE IF NOT EXISTS public.prospect_scoring_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  weights JSONB NOT NULL,
  performance JSONB NOT NULL,
  training_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Prospect Dynamic Scores Table
-- Stores calculated dynamic scores for prospects
CREATE TABLE IF NOT EXISTS public.prospect_dynamic_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES public.prospect_candidates(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  breakdown JSONB NOT NULL,
  factors JSONB NOT NULL,
  reasoning TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  recommendations TEXT[],
  scoring_model_id UUID REFERENCES public.prospect_scoring_models(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Prospect Optimization Log Table
-- Logs optimization actions and results
CREATE TABLE IF NOT EXISTS public.prospect_optimization_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('icp_update', 'weight_adjustment', 'pattern_discovery', 'model_training', 'scoring_update')),
  action_data JSONB NOT NULL,
  result_data JSONB,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
-- Learning Insights Indexes
CREATE INDEX IF NOT EXISTS idx_learning_insights_created_at ON public.prospect_learning_insights (created_at);

-- Adaptive Weights Indexes
CREATE INDEX IF NOT EXISTS idx_adaptive_weights_created_at ON public.prospect_adaptive_weights (created_at);

-- Conversion Patterns Indexes
CREATE INDEX IF NOT EXISTS idx_conversion_patterns_type ON public.prospect_conversion_patterns (pattern_type);
CREATE INDEX IF NOT EXISTS idx_conversion_patterns_rate ON public.prospect_conversion_patterns (conversion_rate DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_patterns_confidence ON public.prospect_conversion_patterns (confidence DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_patterns_trend ON public.prospect_conversion_patterns (trend);

-- Conversion Insights Indexes
CREATE INDEX IF NOT EXISTS idx_conversion_insights_type ON public.prospect_conversion_insights (insight_type);
CREATE INDEX IF NOT EXISTS idx_conversion_insights_impact ON public.prospect_conversion_insights (impact);
CREATE INDEX IF NOT EXISTS idx_conversion_insights_confidence ON public.prospect_conversion_insights (confidence DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_insights_created_at ON public.prospect_conversion_insights (created_at);

-- Scoring Models Indexes
CREATE INDEX IF NOT EXISTS idx_scoring_models_active ON public.prospect_scoring_models (is_active);
CREATE INDEX IF NOT EXISTS idx_scoring_models_created_at ON public.prospect_scoring_models (created_at);

-- Dynamic Scores Indexes
CREATE INDEX IF NOT EXISTS idx_dynamic_scores_prospect_id ON public.prospect_dynamic_scores (prospect_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_scores_overall ON public.prospect_dynamic_scores (overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_dynamic_scores_confidence ON public.prospect_dynamic_scores (confidence DESC);
CREATE INDEX IF NOT EXISTS idx_dynamic_scores_created_at ON public.prospect_dynamic_scores (created_at);

-- Optimization Log Indexes
CREATE INDEX IF NOT EXISTS idx_optimization_log_action_type ON public.prospect_optimization_log (action_type);
CREATE INDEX IF NOT EXISTS idx_optimization_log_success ON public.prospect_optimization_log (success);
CREATE INDEX IF NOT EXISTS idx_optimization_log_created_at ON public.prospect_optimization_log (created_at);

-- Updated_at trigger function (reuse existing)
-- Apply triggers to tables that need them
CREATE TRIGGER update_prospect_learning_insights_updated_at
    BEFORE UPDATE ON public.prospect_learning_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospect_adaptive_weights_updated_at
    BEFORE UPDATE ON public.prospect_adaptive_weights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospect_scoring_models_updated_at
    BEFORE UPDATE ON public.prospect_scoring_models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospect_dynamic_scores_updated_at
    BEFORE UPDATE ON public.prospect_dynamic_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE public.prospect_learning_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_adaptive_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_conversion_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_conversion_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_scoring_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_dynamic_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_optimization_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow public read access for system monitoring)
CREATE POLICY "Allow public read access to prospect_learning_insights"
ON public.prospect_learning_insights FOR SELECT
USING (TRUE);

CREATE POLICY "Allow authenticated insert to prospect_learning_insights"
ON public.prospect_learning_insights FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update to prospect_learning_insights"
ON public.prospect_learning_insights FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access to prospect_adaptive_weights"
ON public.prospect_adaptive_weights FOR SELECT
USING (TRUE);

CREATE POLICY "Allow authenticated insert to prospect_adaptive_weights"
ON public.prospect_adaptive_weights FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update to prospect_adaptive_weights"
ON public.prospect_adaptive_weights FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access to prospect_conversion_patterns"
ON public.prospect_conversion_patterns FOR SELECT
USING (TRUE);

CREATE POLICY "Allow authenticated insert to prospect_conversion_patterns"
ON public.prospect_conversion_patterns FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update to prospect_conversion_patterns"
ON public.prospect_conversion_patterns FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access to prospect_conversion_insights"
ON public.prospect_conversion_insights FOR SELECT
USING (TRUE);

CREATE POLICY "Allow authenticated insert to prospect_conversion_insights"
ON public.prospect_conversion_insights FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access to prospect_scoring_models"
ON public.prospect_scoring_models FOR SELECT
USING (TRUE);

CREATE POLICY "Allow authenticated insert to prospect_scoring_models"
ON public.prospect_scoring_models FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update to prospect_scoring_models"
ON public.prospect_scoring_models FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access to prospect_dynamic_scores"
ON public.prospect_dynamic_scores FOR SELECT
USING (TRUE);

CREATE POLICY "Allow authenticated insert to prospect_dynamic_scores"
ON public.prospect_dynamic_scores FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update to prospect_dynamic_scores"
ON public.prospect_dynamic_scores FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access to prospect_optimization_log"
ON public.prospect_optimization_log FOR SELECT
USING (TRUE);

CREATE POLICY "Allow authenticated insert to prospect_optimization_log"
ON public.prospect_optimization_log FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Utility functions for Phase 3 optimization

-- Function to get current adaptive weights
CREATE OR REPLACE FUNCTION get_current_adaptive_weights()
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT weights_data 
    FROM public.prospect_adaptive_weights 
    WHERE id = 'current_weights'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get current learning insights
CREATE OR REPLACE FUNCTION get_current_learning_insights()
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT insights_data 
    FROM public.prospect_learning_insights 
    WHERE id = 'current_insights'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get top conversion patterns
CREATE OR REPLACE FUNCTION get_top_conversion_patterns(
  p_pattern_type VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  pattern_type VARCHAR,
  pattern_value VARCHAR,
  conversion_rate DECIMAL,
  total_conversions INTEGER,
  confidence DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pcp.pattern_type,
    pcp.pattern_value,
    pcp.conversion_rate,
    pcp.total_conversions,
    pcp.confidence
  FROM public.prospect_conversion_patterns pcp
  WHERE 
    (p_pattern_type IS NULL OR pcp.pattern_type = p_pattern_type)
    AND pcp.conversion_rate > 0.05
  ORDER BY pcp.conversion_rate DESC, pcp.confidence DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get prospect dynamic score
CREATE OR REPLACE FUNCTION get_prospect_dynamic_score(p_prospect_id UUID)
RETURNS TABLE (
  overall_score INTEGER,
  breakdown JSONB,
  factors JSONB,
  reasoning TEXT,
  confidence DECIMAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pds.overall_score,
    pds.breakdown,
    pds.factors,
    pds.reasoning,
    pds.confidence,
    pds.created_at
  FROM public.prospect_dynamic_scores pds
  WHERE pds.prospect_id = p_prospect_id
  ORDER BY pds.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to log optimization action
CREATE OR REPLACE FUNCTION log_optimization_action(
  p_action_type VARCHAR,
  p_action_data JSONB,
  p_result_data JSONB DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.prospect_optimization_log (
    action_type,
    action_data,
    result_data,
    success,
    error_message
  ) VALUES (
    p_action_type,
    p_action_data,
    p_result_data,
    p_success,
    p_error_message
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on utility functions
GRANT EXECUTE ON FUNCTION get_current_adaptive_weights TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_learning_insights TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_conversion_patterns TO authenticated;
GRANT EXECUTE ON FUNCTION get_prospect_dynamic_score TO authenticated;
GRANT EXECUTE ON FUNCTION log_optimization_action TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.prospect_learning_insights IS 'Phase 3: Stores insights from conversion analysis for adaptive learning';
COMMENT ON TABLE public.prospect_adaptive_weights IS 'Phase 3: Stores adaptive weights learned from conversion data';
COMMENT ON TABLE public.prospect_conversion_patterns IS 'Phase 3: Stores identified conversion patterns for scoring optimization';
COMMENT ON TABLE public.prospect_conversion_insights IS 'Phase 3: Stores actionable insights from pattern analysis';
COMMENT ON TABLE public.prospect_scoring_models IS 'Phase 3: Stores different scoring models and their performance metrics';
COMMENT ON TABLE public.prospect_dynamic_scores IS 'Phase 3: Stores calculated dynamic scores for prospects';
COMMENT ON TABLE public.prospect_optimization_log IS 'Phase 3: Logs optimization actions and results for audit trail';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Phase 3: Prospect Optimization Engine tables created successfully';
    RAISE NOTICE 'Tables created: prospect_learning_insights, prospect_adaptive_weights, prospect_conversion_patterns, prospect_conversion_insights, prospect_scoring_models, prospect_dynamic_scores, prospect_optimization_log';
    RAISE NOTICE 'Utility functions created: get_current_adaptive_weights, get_current_learning_insights, get_top_conversion_patterns, get_prospect_dynamic_score, log_optimization_action';
    RAISE NOTICE 'All tables are isolated and non-breaking to existing systems';
END $$;
