-- Fix fuzzy_dictionary_lookup return type mismatch
-- The similarity() function from pg_trgm returns REAL, not DECIMAL
-- This migration corrects the function signature to match the actual return type

CREATE OR REPLACE FUNCTION fuzzy_dictionary_lookup(
  search_text TEXT,
  source_column TEXT,
  target_column TEXT,
  similarity_threshold REAL DEFAULT 0.7  -- Changed from DECIMAL to REAL
)
RETURNS TABLE (
  translated_text TEXT,
  similarity REAL  -- Changed from DECIMAL to REAL
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

-- Update the comment
COMMENT ON FUNCTION fuzzy_dictionary_lookup IS 'Fuzzy matching function for translation dictionary using pg_trgm similarity (returns REAL type for PostgreSQL compatibility)';

