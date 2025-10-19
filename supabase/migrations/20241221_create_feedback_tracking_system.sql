-- Phase 2.1 Module 1: Feedback Tracking System
-- Creates isolated feedback tracking and performance monitoring tables
-- SAFE: No existing tables modified, completely additive

-- Enable Row Level Security
-- (Already enabled globally, but ensuring it's explicit)

-- 1. Feedback Tracking Table
-- Tracks user actions, system outcomes, and learning data
CREATE TABLE IF NOT EXISTS public.feedback_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core tracking fields
  lead_id UUID, -- Optional: link to specific lead if applicable
  client_id UUID REFERENCES public.clients(id), -- Optional: link to client
  action_type VARCHAR(50) NOT NULL, -- 'lead_conversion', 'email_response', 'user_action', 'system_performance'
  outcome VARCHAR(20) NOT NULL, -- 'positive', 'negative', 'neutral'
  
  -- Performance and confidence metrics
  confidence_score DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
  impact_score INTEGER DEFAULT 0, -- -100 to +100
  
  -- Context and metadata
  context_data JSONB, -- Flexible storage for action-specific data
  notes TEXT, -- Human-readable notes or descriptions
  
  -- Bilingual support
  notes_en TEXT, -- English notes
  notes_fr TEXT, -- French notes
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ, -- When feedback was processed by learning system
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'), -- Auto-cleanup
  
  -- Learning integration
  learning_applied BOOLEAN DEFAULT FALSE, -- Whether this feedback was used for learning
  learning_impact DECIMAL(3,2) DEFAULT 0.0 -- Impact on learning algorithms
);

-- 2. Performance Metrics Table
-- Tracks system performance, AI accuracy, and response times
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core metric identification
  event_type VARCHAR(100) NOT NULL, -- 'api_response', 'ai_analysis', 'translation', 'lead_processing'
  metric_name VARCHAR(100) NOT NULL, -- 'response_time', 'accuracy', 'success_rate', 'error_rate'
  
  -- Metric values
  metric_value DECIMAL(10,4) NOT NULL, -- The actual metric value
  metric_unit VARCHAR(20), -- 'ms', 'percent', 'count', 'score'
  
  -- Performance context
  response_time_ms INTEGER, -- API response time in milliseconds
  success_rate DECIMAL(3,2), -- Success rate 0.0 to 1.0
  ai_accuracy DECIMAL(3,2), -- AI accuracy score 0.0 to 1.0
  error_count INTEGER DEFAULT 0, -- Number of errors encountered
  
  -- System context
  source_component VARCHAR(100) NOT NULL, -- 'lead_api', 'translation_service', 'intelligence_engine'
  client_id UUID REFERENCES public.clients(id), -- Optional: client-specific metrics
  
  -- Request context
  request_id VARCHAR(100), -- Optional: link to specific request
  user_agent TEXT, -- Optional: client information
  ip_address INET, -- Optional: client IP for analysis
  
  -- Timestamps
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB, -- Additional context and debugging information
  
  -- Bilingual support
  error_message_en TEXT, -- English error message if applicable
  error_message_fr TEXT -- French error message if applicable
);

-- Indexes for Performance
-- Feedback Tracking Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_tracking_action_type 
ON public.feedback_tracking (action_type);

CREATE INDEX IF NOT EXISTS idx_feedback_tracking_outcome 
ON public.feedback_tracking (outcome);

CREATE INDEX IF NOT EXISTS idx_feedback_tracking_client_id 
ON public.feedback_tracking (client_id) WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_tracking_lead_id 
ON public.feedback_tracking (lead_id) WHERE lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_tracking_created_at 
ON public.feedback_tracking (created_at);

CREATE INDEX IF NOT EXISTS idx_feedback_tracking_learning_applied 
ON public.feedback_tracking (learning_applied) WHERE learning_applied = FALSE;

-- Performance Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_event_type 
ON public.performance_metrics (event_type);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name 
ON public.performance_metrics (metric_name);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_source_component 
ON public.performance_metrics (source_component);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_client_id 
ON public.performance_metrics (client_id) WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at 
ON public.performance_metrics (recorded_at);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_response_time 
ON public.performance_metrics (response_time_ms) WHERE response_time_ms IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_feedback_tracking_action_outcome 
ON public.feedback_tracking (action_type, outcome);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_component_metric 
ON public.performance_metrics (source_component, metric_name);

-- Row Level Security (RLS)
ALTER TABLE public.feedback_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_tracking
-- Allow public read access (for system monitoring)
CREATE POLICY "Allow public read access to feedback_tracking"
ON public.feedback_tracking FOR SELECT
USING (TRUE);

-- Allow authenticated insert (for system logging)
CREATE POLICY "Allow authenticated insert to feedback_tracking"
ON public.feedback_tracking FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated update (for processing status)
CREATE POLICY "Allow authenticated update to feedback_tracking"
ON public.feedback_tracking FOR UPDATE
USING (auth.role() = 'authenticated');

-- RLS Policies for performance_metrics
-- Allow public read access (for system monitoring)
CREATE POLICY "Allow public read access to performance_metrics"
ON public.performance_metrics FOR SELECT
USING (TRUE);

-- Allow authenticated insert (for system logging)
CREATE POLICY "Allow authenticated insert to performance_metrics"
ON public.performance_metrics FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated update (for metric updates)
CREATE POLICY "Allow authenticated update to performance_metrics"
ON public.performance_metrics FOR UPDATE
USING (auth.role() = 'authenticated');

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_feedback_processed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.learning_applied = TRUE AND OLD.learning_applied = FALSE THEN
        NEW.processed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_feedback_processed_at_trigger 
BEFORE UPDATE ON public.feedback_tracking 
FOR EACH ROW EXECUTE FUNCTION update_feedback_processed_at();

-- Utility functions for feedback analysis
CREATE OR REPLACE FUNCTION get_feedback_summary(
  p_client_id UUID DEFAULT NULL,
  p_action_type VARCHAR DEFAULT NULL,
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  action_type VARCHAR,
  outcome VARCHAR,
  total_count BIGINT,
  avg_confidence DECIMAL,
  avg_impact_score DECIMAL,
  positive_count BIGINT,
  negative_count BIGINT,
  neutral_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ft.action_type,
    ft.outcome,
    COUNT(*) as total_count,
    AVG(ft.confidence_score) as avg_confidence,
    AVG(ft.impact_score) as avg_impact_score,
    COUNT(*) FILTER (WHERE ft.outcome = 'positive') as positive_count,
    COUNT(*) FILTER (WHERE ft.outcome = 'negative') as negative_count,
    COUNT(*) FILTER (WHERE ft.outcome = 'neutral') as neutral_count
  FROM public.feedback_tracking ft
  WHERE 
    (p_client_id IS NULL OR ft.client_id = p_client_id)
    AND (p_action_type IS NULL OR ft.action_type = p_action_type)
    AND ft.created_at >= NOW() - INTERVAL '1 day' * p_days_back
  GROUP BY ft.action_type, ft.outcome
  ORDER BY total_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Utility function for performance metrics analysis
CREATE OR REPLACE FUNCTION get_performance_summary(
  p_source_component VARCHAR DEFAULT NULL,
  p_metric_name VARCHAR DEFAULT NULL,
  p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  source_component VARCHAR,
  metric_name VARCHAR,
  avg_value DECIMAL,
  min_value DECIMAL,
  max_value DECIMAL,
  total_count BIGINT,
  success_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.source_component,
    pm.metric_name,
    AVG(pm.metric_value) as avg_value,
    MIN(pm.metric_value) as min_value,
    MAX(pm.metric_value) as max_value,
    COUNT(*) as total_count,
    AVG(pm.success_rate) as success_rate
  FROM public.performance_metrics pm
  WHERE 
    (p_source_component IS NULL OR pm.source_component = p_source_component)
    AND (p_metric_name IS NULL OR pm.metric_name = p_metric_name)
    AND pm.recorded_at >= NOW() - INTERVAL '1 day' * p_days_back
  GROUP BY pm.source_component, pm.metric_name
  ORDER BY total_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on utility functions
GRANT EXECUTE ON FUNCTION get_feedback_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_summary TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.feedback_tracking IS 'Phase 2.1: Tracks user actions, system outcomes, and learning feedback for adaptive intelligence';
COMMENT ON TABLE public.performance_metrics IS 'Phase 2.1: Tracks system performance, AI accuracy, and response times for optimization';

COMMENT ON COLUMN public.feedback_tracking.action_type IS 'Type of action: lead_conversion, email_response, user_action, system_performance';
COMMENT ON COLUMN public.feedback_tracking.outcome IS 'Outcome classification: positive, negative, neutral';
COMMENT ON COLUMN public.feedback_tracking.confidence_score IS 'Confidence in the feedback accuracy (0.0 to 1.0)';
COMMENT ON COLUMN public.feedback_tracking.impact_score IS 'Impact on system performance (-100 to +100)';
COMMENT ON COLUMN public.feedback_tracking.learning_applied IS 'Whether this feedback has been processed by learning algorithms';

COMMENT ON COLUMN public.performance_metrics.event_type IS 'Type of event: api_response, ai_analysis, translation, lead_processing';
COMMENT ON COLUMN public.performance_metrics.metric_name IS 'Name of the metric: response_time, accuracy, success_rate, error_rate';
COMMENT ON COLUMN public.performance_metrics.metric_value IS 'The actual metric value';
COMMENT ON COLUMN public.performance_metrics.source_component IS 'Component that generated the metric: lead_api, translation_service, intelligence_engine';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Phase 2.1 Module 1: Feedback Tracking System tables created successfully';
    RAISE NOTICE 'Tables created: feedback_tracking, performance_metrics';
    RAISE NOTICE 'Utility functions created: get_feedback_summary, get_performance_summary';
    RAISE NOTICE 'All tables are isolated and non-breaking to existing systems';
END $$;
