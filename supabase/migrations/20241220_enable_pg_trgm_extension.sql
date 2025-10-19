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
