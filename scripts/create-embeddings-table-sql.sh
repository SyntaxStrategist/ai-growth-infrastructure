#!/bin/bash
# ============================================
# One-Line SQL for Supabase Dashboard
# ============================================
# Copy and paste this into Supabase SQL Editor

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   📋 COPY THIS SQL INTO SUPABASE SQL EDITOR                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Go to: SQL Editor"
echo "4. Click: '+ New Query'"
echo "5. Copy the SQL below and paste it:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat << 'EOF'
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table
CREATE TABLE IF NOT EXISTS public.avenir_profile_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id TEXT UNIQUE NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_avenir_profile_embeddings_embedding
ON public.avenir_profile_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for chunk_id
CREATE INDEX IF NOT EXISTS idx_avenir_profile_embeddings_chunk_id
ON public.avenir_profile_embeddings(chunk_id);

-- Create trigger for auto-update
CREATE OR REPLACE FUNCTION update_avenir_profile_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_update_avenir_profile_embeddings_updated_at
BEFORE UPDATE ON public.avenir_profile_embeddings
FOR EACH ROW
EXECUTE FUNCTION update_avenir_profile_embeddings_updated_at();

-- Add comments
COMMENT ON TABLE public.avenir_profile_embeddings IS 'Stores vector embeddings of Avenir AI Solutions business profile for semantic matching';
EOF

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "6. Click: 'Run' or press Cmd+Enter"
echo "7. Verify: Success message appears"
echo "8. Then run: npm run embed-profile"
echo ""
echo "✅ Table will be created and ready for embeddings"
echo ""

