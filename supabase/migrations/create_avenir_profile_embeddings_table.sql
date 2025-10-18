-- ============================================
-- Avenir Profile Embeddings Table
-- ============================================
-- Stores vector embeddings of Avenir AI Solutions business profile
-- for semantic matching and Business Fit Scoring

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for profile embeddings
CREATE TABLE IF NOT EXISTS public.avenir_profile_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id TEXT UNIQUE NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536) NOT NULL, -- OpenAI text-embedding-3-small dimension
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster vector similarity search
CREATE INDEX IF NOT EXISTS idx_avenir_profile_embeddings_embedding
ON public.avenir_profile_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for chunk_id lookups
CREATE INDEX IF NOT EXISTS idx_avenir_profile_embeddings_chunk_id
ON public.avenir_profile_embeddings(chunk_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_avenir_profile_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_avenir_profile_embeddings_updated_at
BEFORE UPDATE ON public.avenir_profile_embeddings
FOR EACH ROW
EXECUTE FUNCTION update_avenir_profile_embeddings_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.avenir_profile_embeddings IS 'Stores vector embeddings of Avenir AI Solutions business profile for semantic matching';
COMMENT ON COLUMN public.avenir_profile_embeddings.chunk_id IS 'Unique identifier for the profile chunk (e.g., "ideal_clients_chunk_0")';
COMMENT ON COLUMN public.avenir_profile_embeddings.chunk_text IS 'The actual text content of this chunk';
COMMENT ON COLUMN public.avenir_profile_embeddings.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions)';
COMMENT ON COLUMN public.avenir_profile_embeddings.metadata IS 'Additional metadata (section name, chunk index, etc.)';

