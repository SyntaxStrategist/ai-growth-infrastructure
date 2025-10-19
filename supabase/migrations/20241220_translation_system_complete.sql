-- Enable pg_trgm extension for fuzzy text matching
-- This extension provides trigram-based text similarity functions

-- Enable the pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create similarity index on translation_dictionary for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_translation_dictionary_english_trgm 
ON public.translation_dictionary USING gin (english_text gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_translation_dictionary_french_trgm 
ON public.translation_dictionary USING gin (french_text gin_trgm_ops);

-- Create similarity index on translation_cache for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_translation_cache_original_trgm 
ON public.translation_cache USING gin (original_text gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_translation_cache_translated_trgm 
ON public.translation_cache USING gin (translated_text gin_trgm_ops);

-- Comments for documentation
COMMENT ON EXTENSION pg_trgm IS 'Trigram matching for fuzzy text search and similarity';
COMMENT ON INDEX idx_translation_dictionary_english_trgm IS 'Trigram index for fuzzy matching on English text';
COMMENT ON INDEX idx_translation_dictionary_french_trgm IS 'Trigram index for fuzzy matching on French text';
COMMENT ON INDEX idx_translation_cache_original_trgm IS 'Trigram index for fuzzy matching on original text in cache';
COMMENT ON INDEX idx_translation_cache_translated_trgm IS 'Trigram index for fuzzy matching on translated text in cache';

-- Translation Tables
-- 1. Translation Cache Table (Layer 2)
-- Stores AI-generated translations with metadata
CREATE TABLE IF NOT EXISTS public.translation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  source_language VARCHAR(5) NOT NULL,
  target_language VARCHAR(5) NOT NULL,
  model_used VARCHAR(50) DEFAULT 'gpt-4o-mini',
  confidence_score DECIMAL(3,2) DEFAULT 1.0,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year')
);

-- 2. Translation Dictionary Table (Layer 1)
-- Stores curated bilingual dictionary entries
CREATE TABLE IF NOT EXISTS public.translation_dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  english_text TEXT NOT NULL,
  french_text TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  context VARCHAR(100),
  priority INTEGER DEFAULT 1, -- Higher priority = more likely to match
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_translation_cache_lookup 
ON public.translation_cache (original_text, target_language);

CREATE INDEX IF NOT EXISTS idx_translation_cache_source_target 
ON public.translation_cache (source_language, target_language);

CREATE INDEX IF NOT EXISTS idx_translation_cache_expires 
ON public.translation_cache (expires_at);

CREATE INDEX IF NOT EXISTS idx_translation_dictionary_english 
ON public.translation_dictionary (english_text) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_translation_dictionary_french 
ON public.translation_dictionary (french_text) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_translation_dictionary_priority 
ON public.translation_dictionary (priority DESC, is_active) WHERE is_active = TRUE;

-- Unique constraints to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_translation_cache 
ON public.translation_cache (original_text, target_language);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_translation_dictionary 
ON public.translation_dictionary (english_text, french_text);

-- Row Level Security
ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_dictionary ENABLE ROW LEVEL SECURITY;

-- Policies for translation_cache (conditional creation)
DO $$ 
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'translation_cache' 
        AND policyname = 'Allow public read access to translation_cache'
    ) THEN
        CREATE POLICY "Allow public read access to translation_cache"
        ON public.translation_cache FOR SELECT
        USING (TRUE);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'translation_cache' 
        AND policyname = 'Allow authenticated insert to translation_cache'
    ) THEN
        CREATE POLICY "Allow authenticated insert to translation_cache"
        ON public.translation_cache FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'translation_cache' 
        AND policyname = 'Allow authenticated update to translation_cache'
    ) THEN
        CREATE POLICY "Allow authenticated update to translation_cache"
        ON public.translation_cache FOR UPDATE
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Policies for translation_dictionary (conditional creation)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'translation_dictionary' 
        AND policyname = 'Allow public read access to translation_dictionary'
    ) THEN
        CREATE POLICY "Allow public read access to translation_dictionary"
        ON public.translation_dictionary FOR SELECT
        USING (is_active = TRUE);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'translation_dictionary' 
        AND policyname = 'Allow authenticated insert to translation_dictionary'
    ) THEN
        CREATE POLICY "Allow authenticated insert to translation_dictionary"
        ON public.translation_dictionary FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'translation_dictionary' 
        AND policyname = 'Allow authenticated update to translation_dictionary'
    ) THEN
        CREATE POLICY "Allow authenticated update to translation_dictionary"
        ON public.translation_dictionary FOR UPDATE
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates (conditional creation)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_translation_cache_updated_at'
        AND tgrelid = 'public.translation_cache'::regclass
    ) THEN
        CREATE TRIGGER update_translation_cache_updated_at 
        BEFORE UPDATE ON public.translation_cache 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_translation_dictionary_updated_at'
        AND tgrelid = 'public.translation_dictionary'::regclass
    ) THEN
        CREATE TRIGGER update_translation_dictionary_updated_at 
        BEFORE UPDATE ON public.translation_dictionary 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Note: Usage count tracking is handled in application code
-- PostgreSQL doesn't support AFTER SELECT triggers
-- The translation service will increment usage_count when reading from cache

-- Comments for documentation
COMMENT ON TABLE public.translation_cache IS 'Layer 2: AI-generated translation cache with usage tracking';
COMMENT ON TABLE public.translation_dictionary IS 'Layer 1: Curated bilingual dictionary for instant lookups';
COMMENT ON COLUMN public.translation_cache.usage_count IS 'Number of times this translation has been used';
COMMENT ON COLUMN public.translation_cache.expires_at IS 'When this cached translation expires (default 1 year)';
COMMENT ON COLUMN public.translation_dictionary.priority IS 'Higher priority entries are matched first (1-10)';
COMMENT ON COLUMN public.translation_dictionary.category IS 'Category for organizing dictionary entries (e.g., business, technical, ui)';

-- Fuzzy Dictionary Functions

-- Create the fuzzy dictionary lookup function
CREATE OR REPLACE FUNCTION fuzzy_dictionary_lookup(
  search_text TEXT,
  source_column TEXT,
  target_column TEXT,
  similarity_threshold DECIMAL DEFAULT 0.7
)
RETURNS TABLE (
  translated_text TEXT,
  similarity DECIMAL
) AS $$
BEGIN
  -- Dynamic query to handle both English->French and French->English lookups
  RETURN QUERY EXECUTE format('
    SELECT 
      %I as translated_text,
      similarity(%I, %L) as similarity
    FROM public.translation_dictionary 
    WHERE is_active = true 
      AND similarity(%I, %L) > %s
    ORDER BY similarity(%I, %L) DESC, priority DESC
    LIMIT 1
  ', 
    target_column,           -- %I: target column (french_text or english_text)
    source_column,           -- %I: source column for similarity calculation
    search_text,             -- %L: search text (literal)
    source_column,           -- %I: source column for WHERE clause
    search_text,             -- %L: search text for WHERE clause (literal)
    similarity_threshold,    -- %s: similarity threshold
    source_column,           -- %I: source column for ORDER BY
    search_text              -- %L: search text for ORDER BY (literal)
  );
END;
$$ LANGUAGE plpgsql;

-- Create a simpler version for exact matches
CREATE OR REPLACE FUNCTION exact_dictionary_lookup(
  search_text TEXT,
  source_column TEXT,
  target_column TEXT
)
RETURNS TABLE (
  translated_text TEXT
) AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    SELECT %I as translated_text
    FROM public.translation_dictionary 
    WHERE is_active = true 
      AND LOWER(%I) = LOWER(%L)
    ORDER BY priority DESC
    LIMIT 1
  ', 
    target_column,    -- %I: target column
    source_column,    -- %I: source column for comparison
    search_text       -- %L: search text (literal)
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to get dictionary statistics
CREATE OR REPLACE FUNCTION get_dictionary_stats()
RETURNS TABLE (
  total_entries BIGINT,
  active_entries BIGINT,
  categories TEXT[],
  avg_priority DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE is_active = true) as active_entries,
    ARRAY_AGG(DISTINCT category) as categories,
    AVG(priority) as avg_priority
  FROM public.translation_dictionary;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON FUNCTION fuzzy_dictionary_lookup IS 'Fuzzy matching function for translation dictionary using pg_trgm similarity';
COMMENT ON FUNCTION exact_dictionary_lookup IS 'Exact matching function for translation dictionary';
COMMENT ON FUNCTION get_dictionary_stats IS 'Get statistics about the translation dictionary';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION fuzzy_dictionary_lookup TO authenticated;
GRANT EXECUTE ON FUNCTION exact_dictionary_lookup TO authenticated;
GRANT EXECUTE ON FUNCTION get_dictionary_stats TO authenticated;
