-- Translation System Tables
-- This migration creates the 3-layer translation system infrastructure

-- Handle schema_migrations table to make migration idempotent
DO $$ 
BEGIN
    -- Check if this migration version already exists in schema_migrations
    IF NOT EXISTS (
        SELECT 1 FROM supabase_migrations.schema_migrations 
        WHERE version = '20241220'
    ) THEN
        -- Insert migration version if it doesn't exist
        INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
        VALUES ('20241220', ARRAY['-- Translation System Tables Migration'], 'create_translation_tables');
    END IF;
END $$;

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
