// ============================================
// Semantic Matcher for Business Fit Scoring
// ============================================
// Uses OpenAI embeddings to match prospects against Avenir's ICP profile
// and generate bilingual reasoning for fit scores.

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { ProspectCandidate } from '../../prospect-intelligence/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// ============================================
// Types
// ============================================

export interface BusinessFitResult {
  score: number; // 0-100
  reasoning: string; // Bilingual explanation
  topMatches: string[]; // Top matching profile chunks
  confidence: number; // 0-1
}

export interface EmbeddingChunk {
  id: string;
  chunk_text: string;
  embedding: number[];
  metadata: {
    section: string;
    chunk_index: number;
    total_chunks: number;
  };
}

// ============================================
// Text Chunking
// ============================================

/**
 * Split text into overlapping chunks for embedding
 */
export function chunkText(
  text: string,
  chunkSize: number = 512,
  overlap: number = 64
): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
    i += chunkSize - overlap; // Overlap for context
  }
  
  return chunks;
}

// ============================================
// Embedding Functions
// ============================================

/**
 * Generate embedding for a text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('[SemanticMatcher] ❌ Embedding generation failed:', error);
    throw error;
  }
}

/**
 * Embed Avenir profile and store in Supabase
 */
export async function embedAvenirProfile(profileText: string): Promise<void> {
  console.log('[SemanticMatcher] ============================================');
  console.log('[SemanticMatcher] Embedding Avenir AI Solutions profile');
  
  // Extract sections for better metadata
  const sections = profileText.split(/^## /gm).filter(s => s.trim());
  
  console.log('[SemanticMatcher] Found', sections.length, 'sections in profile');
  
  const allChunks: EmbeddingChunk[] = [];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sectionTitle = section.split('\n')[0].trim();
    const sectionText = section.substring(sectionTitle.length).trim();
    
    console.log(`[SemanticMatcher] Processing section ${i + 1}/${sections.length}: ${sectionTitle}`);
    
    // Chunk the section
    const chunks = chunkText(sectionText, 512, 64);
    
    console.log(`[SemanticMatcher]   → ${chunks.length} chunks created`);
    
    // Generate embeddings for each chunk
    for (let j = 0; j < chunks.length; j++) {
      const chunkText = chunks[j];
      
      if (chunkText.length < 50) {
        console.log(`[SemanticMatcher]   ⏭️  Skipping tiny chunk ${j + 1} (< 50 chars)`);
        continue;
      }
      
      console.log(`[SemanticMatcher]   🔄 Embedding chunk ${j + 1}/${chunks.length}...`);
      
      try {
        const embedding = await generateEmbedding(chunkText);
        
        allChunks.push({
          id: `${sectionTitle.toLowerCase().replace(/\s+/g, '_')}_chunk_${j}`,
          chunk_text: chunkText,
          embedding,
          metadata: {
            section: sectionTitle,
            chunk_index: j,
            total_chunks: chunks.length,
          }
        });
        
        console.log(`[SemanticMatcher]   ✅ Chunk ${j + 1} embedded (${embedding.length}D vector)`);
        
        // Rate limit: Wait 100ms between API calls
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`[SemanticMatcher]   ❌ Failed to embed chunk ${j + 1}:`, error);
        // Continue with next chunk
      }
    }
  }
  
  console.log('[SemanticMatcher] ============================================');
  console.log('[SemanticMatcher] Total chunks embedded:', allChunks.length);
  console.log('[SemanticMatcher] Saving to Supabase...');
  
  // Save to Supabase
  const records = allChunks.map(chunk => ({
    chunk_id: chunk.id,
    chunk_text: chunk.chunk_text,
    embedding: chunk.embedding,
    metadata: chunk.metadata,
  }));
  
  const { data, error } = await supabase
    .from('avenir_profile_embeddings')
    .upsert(records, { onConflict: 'chunk_id' });
  
  if (error) {
    console.error('[SemanticMatcher] ❌ Failed to save embeddings:', error);
    throw error;
  }
  
  console.log('[SemanticMatcher] ✅ Profile embeddings saved to Supabase');
  console.log('[SemanticMatcher] ============================================');
}

// ============================================
// Similarity Calculation
// ============================================

/**
 * Normalize and validate a vector from Supabase
 * Ensures the vector is a numeric array, not a string
 */
export function normalizeVector(vector: any): number[] {
  // If vector is a string, try to parse it as JSON
  if (typeof vector === 'string') {
    try {
      vector = JSON.parse(vector);
      console.log('[SemanticMatcher] ℹ️  Parsed vector from JSON string');
    } catch (e) {
      console.error('[SemanticMatcher] ⚠️  Failed to parse vector JSON:', e);
      throw new Error('Failed to parse vector from JSON string');
    }
  }
  
  // Validate that vector is an array
  if (!Array.isArray(vector)) {
    console.error('[SemanticMatcher] ❌ Invalid embedding format — expected array, got:', typeof vector);
    throw new Error('Invalid embedding format — expected array');
  }
  
  // Validate that all elements are numbers
  if (!vector.every(v => typeof v === 'number')) {
    console.error('[SemanticMatcher] ❌ Vector contains non-numeric values');
    throw new Error('Vector must contain only numeric values');
  }
  
  return vector;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  // Log vector lengths for debugging
  console.log('[SemanticMatcher] Vector lengths:', vecA.length, 'vs', vecB.length);
  
  if (vecA.length !== vecB.length) {
    console.error('[SemanticMatcher] ❌ Dimension mismatch:', vecA.length, 'vs', vecB.length);
    throw new Error(`Vectors must have the same dimension (got ${vecA.length} vs ${vecB.length})`);
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  
  if (denominator === 0) {
    return 0;
  }
  
  return dotProduct / denominator;
}

/**
 * Find top N most similar profile chunks for a given embedding
 */
export async function findTopMatches(
  prospectEmbedding: number[],
  topN: number = 3
): Promise<Array<{ chunk_text: string; similarity: number; metadata: any }>> {
  console.log('[SemanticMatcher] Finding top', topN, 'matching profile chunks...');
  
  // Fetch all profile embeddings from Supabase
  const { data: profileChunks, error } = await supabase
    .from('avenir_profile_embeddings')
    .select('chunk_id, chunk_text, embedding, metadata');
  
  if (error) {
    console.error('[SemanticMatcher] ❌ Failed to fetch profile embeddings:', error);
    throw error;
  }
  
  if (!profileChunks || profileChunks.length === 0) {
    console.warn('[SemanticMatcher] ⚠️  No profile embeddings found in database');
    return [];
  }
  
  console.log('[SemanticMatcher] Comparing against', profileChunks.length, 'profile chunks');
  
  // Normalize and validate vectors from Supabase
  console.log('[SemanticMatcher] Normalizing profile embeddings...');
  
  const normalizedChunks = profileChunks.map((chunk, index) => {
    try {
      const normalizedEmbedding = normalizeVector(chunk.embedding);
      
      // Verify dimension
      if (normalizedEmbedding.length !== 1536) {
        console.warn(`[SemanticMatcher] ⚠️  Chunk ${index + 1} has unexpected dimension: ${normalizedEmbedding.length}`);
      }
      
      return {
        ...chunk,
        embedding: normalizedEmbedding
      };
    } catch (error) {
      console.error(`[SemanticMatcher] ❌ Failed to normalize chunk ${index + 1}:`, error);
      throw error;
    }
  });
  
  console.log('[SemanticMatcher] ✅ All vectors normalized and validated');
  
  // Calculate similarity for each chunk
  const similarities = normalizedChunks.map((chunk, index) => {
    console.log(`[SemanticMatcher] Calculating similarity for chunk ${index + 1}/${normalizedChunks.length}...`);
    
    return {
      chunk_text: chunk.chunk_text,
      similarity: cosineSimilarity(prospectEmbedding, chunk.embedding),
      metadata: chunk.metadata,
    };
  });
  
  // Sort by similarity (descending) and take top N
  const topMatches = similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);
  
  console.log('[SemanticMatcher] Top match similarity:', topMatches[0]?.similarity.toFixed(3));
  
  return topMatches;
}

// ============================================
// Business Fit Scoring
// ============================================

/**
 * Generate a descriptive text summary for a prospect
 */
export function generateProspectSummary(prospect: ProspectCandidate): string {
  const parts: string[] = [];
  
  parts.push(`Business: ${prospect.business_name}`);
  
  if (prospect.industry) {
    parts.push(`Industry: ${prospect.industry}`);
  }
  
  if (prospect.region) {
    parts.push(`Location: ${prospect.region}`);
  }
  
  if (prospect.metadata?.employee_count) {
    parts.push(`Employees: ${prospect.metadata.employee_count}`);
  }
  
  if (prospect.metadata?.founded_year) {
    parts.push(`Founded: ${prospect.metadata.founded_year}`);
  }
  
  if (prospect.website) {
    parts.push(`Website: ${prospect.website}`);
  }
  
  if (prospect.contact_email) {
    parts.push(`Contact available: Yes`);
  }
  
  if (prospect.metadata?.form_scan) {
    const formScan = prospect.metadata.form_scan;
    if (formScan.has_form) {
      parts.push(`Has contact form: Yes (${formScan.form_count} forms)`);
    }
    if (formScan.has_captcha) {
      parts.push(`CAPTCHA: Detected`);
    }
  }
  
  if (prospect.metadata?.linkedin_url) {
    parts.push(`LinkedIn: Verified`);
  }
  
  if (prospect.metadata?.source) {
    parts.push(`Data source: ${prospect.metadata.source.toUpperCase()}`);
  }
  
  return parts.join('\n');
}

/**
 * Calculate Business Fit Score for a prospect
 */
export async function calculateBusinessFitScore(
  prospect: ProspectCandidate,
  locale: string = 'en'
): Promise<BusinessFitResult> {
  console.log('[SemanticMatcher] ============================================');
  console.log('[SemanticMatcher] 🧠 Calculating Business Fit for:', prospect.business_name);
  console.log('[SemanticMatcher] Locale:', locale);
  
  try {
    // Generate prospect summary text
    const prospectSummary = generateProspectSummary(prospect);
    console.log('[SemanticMatcher] Prospect summary:\n', prospectSummary);
    
    // Generate embedding for prospect
    console.log('[SemanticMatcher] Generating prospect embedding...');
    const prospectEmbedding = await generateEmbedding(prospectSummary);
    console.log('[SemanticMatcher] ✅ Prospect embedded (1536D vector)');
    
    // Find top matching profile chunks
    const topMatches = await findTopMatches(prospectEmbedding, 3);
    
    if (topMatches.length === 0) {
      console.warn('[SemanticMatcher] ⚠️  No profile matches found, using default score');
      return {
        score: 50, // Default neutral score
        reasoning: locale === 'fr' 
          ? 'Score par défaut (profil non intégré)'
          : 'Default score (profile not embedded)',
        topMatches: [],
        confidence: 0.5,
      };
    }
    
    // Calculate average similarity of top 3 matches
    const avgSimilarity = topMatches.reduce((sum, m) => sum + m.similarity, 0) / topMatches.length;
    
    // Convert similarity (-1 to 1) to score (0 to 100)
    // Similarity typically ranges from 0.3 to 0.9 for relevant matches
    // Map this to a 0-100 scale
    const rawScore = ((avgSimilarity + 1) / 2) * 100; // -1..1 → 0..100
    const normalizedScore = Math.round(Math.max(0, Math.min(100, rawScore)));
    
    console.log('[SemanticMatcher] 🧩 Semantic similarity score:', avgSimilarity.toFixed(3));
    console.log('[SemanticMatcher] 📊 Business Fit Score:', normalizedScore, '/100');
    
    // Generate AI reasoning
    console.log('[SemanticMatcher] 🤖 Generating AI reasoning...');
    const reasoning = await generateFitReasoning(prospect, topMatches, normalizedScore, locale);
    
    console.log('[SemanticMatcher] ✅ Reasoning generated:', reasoning.substring(0, 100) + '...');
    console.log('[SemanticMatcher] ============================================');
    
    return {
      score: normalizedScore,
      reasoning,
      topMatches: topMatches.map(m => m.metadata.section || 'Unknown'),
      confidence: avgSimilarity,
    };
    
  } catch (error) {
    console.error('[SemanticMatcher] ❌ Business fit calculation failed:', error);
    
    // Return fallback score
    return {
      score: 50,
      reasoning: locale === 'fr'
        ? 'Erreur lors du calcul du score'
        : 'Error calculating fit score',
      topMatches: [],
      confidence: 0,
    };
  }
}

// ============================================
// AI Reasoning Generation
// ============================================

/**
 * Generate bilingual reasoning for business fit score
 */
async function generateFitReasoning(
  prospect: ProspectCandidate,
  topMatches: Array<{ chunk_text: string; similarity: number; metadata: any }>,
  score: number,
  locale: string
): Promise<string> {
  const isFrench = locale === 'fr';
  
  // Build context from prospect data
  const context = {
    business_name: prospect.business_name,
    industry: prospect.industry || 'Unknown',
    region: prospect.region || 'Unknown',
    employee_count: prospect.metadata?.employee_count || 'Unknown',
    founded_year: prospect.metadata?.founded_year || 'Unknown',
    has_form: prospect.metadata?.form_scan?.has_form || false,
    has_linkedin: !!prospect.metadata?.linkedin_url,
    data_source: prospect.metadata?.source || 'Unknown',
    automation_score: prospect.automation_need_score || 0,
  };
  
  // Build prompt
  const systemPrompt = isFrench
    ? `Tu es un analyste d'affaires pour Avenir AI Solutions, une entreprise d'infrastructure de croissance IA bilingue pour le marché canadien. Génère une explication concise (2-3 phrases) expliquant pourquoi cette entreprise correspond (ou ne correspond pas) au profil client idéal d'Avenir.`
    : `You are a business analyst for Avenir AI Solutions, a bilingual AI growth infrastructure company for the Canadian market. Generate a concise explanation (2-3 sentences) of why this company fits (or doesn't fit) Avenir's ideal client profile.`;
  
  const userPrompt = isFrench
    ? `Score d'adéquation: ${score}/100

Données de l'entreprise:
- Nom: ${context.business_name}
- Industrie: ${context.industry}
- Région: ${context.region}
- Employés: ${context.employee_count}
- Fondée: ${context.founded_year}
- Formulaire web: ${context.has_form ? 'Oui' : 'Non'}
- LinkedIn: ${context.has_linkedin ? 'Vérifié' : 'Non trouvé'}
- Source: ${context.data_source}
- Score d'automatisation: ${context.automation_score}/100

Sections du profil Avenir correspondantes:
${topMatches.map(m => `- ${m.metadata.section} (similarité: ${(m.similarity * 100).toFixed(1)}%)`).join('\n')}

Génère une explication concise et professionnelle en français expliquant le score d'adéquation.`
    : `Fit Score: ${score}/100

Company Data:
- Name: ${context.business_name}
- Industry: ${context.industry}
- Region: ${context.region}
- Employees: ${context.employee_count}
- Founded: ${context.founded_year}
- Web form: ${context.has_form ? 'Yes' : 'No'}
- LinkedIn: ${context.has_linkedin ? 'Verified' : 'Not found'}
- Source: ${context.data_source}
- Automation score: ${context.automation_score}/100

Matching Avenir profile sections:
${topMatches.map(m => `- ${m.metadata.section} (similarity: ${(m.similarity * 100).toFixed(1)}%)`).join('\n')}

Generate a concise, professional explanation in English of the fit score.`;
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Low temperature for consistency
      max_tokens: 200,
    });
    
    const reasoning = completion.choices[0].message.content || (isFrench
      ? 'Score calculé automatiquement'
      : 'Score calculated automatically');
    
    return reasoning.trim();
    
  } catch (error) {
    console.error('[SemanticMatcher] ❌ Reasoning generation failed:', error);
    
    // Fallback reasoning
    return isFrench
      ? `Score d'adéquation: ${score}/100. Industrie: ${context.industry}, Région: ${context.region}.`
      : `Fit score: ${score}/100. Industry: ${context.industry}, Region: ${context.region}.`;
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if Avenir profile is embedded
 */
export async function isProfileEmbedded(): Promise<boolean> {
  const { count, error } = await supabase
    .from('avenir_profile_embeddings')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error('[SemanticMatcher] ❌ Failed to check profile status:', error);
    return false;
  }
  
  return (count || 0) > 0;
}

/**
 * Get profile embedding count
 */
export async function getProfileEmbeddingCount(): Promise<number> {
  const { count, error } = await supabase
    .from('avenir_profile_embeddings')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error('[SemanticMatcher] ❌ Failed to get embedding count:', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * Clear all profile embeddings (for re-embedding)
 */
export async function clearProfileEmbeddings(): Promise<void> {
  console.log('[SemanticMatcher] Clearing existing profile embeddings...');
  
  const { error } = await supabase
    .from('avenir_profile_embeddings')
    .delete()
    .neq('chunk_id', '___impossible___'); // Delete all
  
  if (error) {
    console.error('[SemanticMatcher] ❌ Failed to clear embeddings:', error);
    throw error;
  }
  
  console.log('[SemanticMatcher] ✅ Profile embeddings cleared');
}

