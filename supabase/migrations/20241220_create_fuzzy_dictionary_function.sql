-- Create fuzzy dictionary lookup function using pg_trgm
-- This function provides efficient fuzzy matching for the translation dictionary

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
