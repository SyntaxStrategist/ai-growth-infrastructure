# 🧠 Semantic Matching & Business Fit Scoring Guide

## Overview

This guide explains how Avenir AI Solutions uses semantic embeddings and AI reasoning to calculate **Business Fit Scores** for prospects, enabling intelligent prioritization and personalized outreach.

---

## 🎯 What is Business Fit Scoring?

**Business Fit Scoring** uses vector embeddings and semantic similarity to match prospect companies against Avenir's ideal customer profile (ICP). The system:

1. **Embeds** the Avenir AI Solutions business profile (`/data/avenir_profile.md`)
2. **Compares** new prospects against this profile using semantic similarity
3. **Calculates** a Business Fit Score (0-100)
4. **Generates** bilingual AI reasoning explaining the match quality

**Score Ranges:**
- **90-100** = Perfect fit (immediate outreach)
- **75-89** = Strong fit (prioritize)
- **60-74** = Moderate fit (nurture)
- **< 60** = Weak fit (skip or long-term nurture)

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `data/avenir_profile.md` | Comprehensive Avenir business context (26KB, 798 lines) |
| `src/lib/semantic_matcher.ts` | Embedding and similarity calculation engine |
| `scripts/embed-avenir-profile.ts` | One-time script to embed the profile |
| `supabase/migrations/create_avenir_profile_embeddings_table.sql` | Database table for storing embeddings |
| `prospect-intelligence/prospect_pipeline.ts` | Integration point (Stage 3.5) |
| `src/components/ProspectProofModal.tsx` | UI display of fit scores |

---

## 🚀 Setup Instructions

### **Step 1: Run Database Migration**

```bash
# Apply the migration to create the avenir_profile_embeddings table
# Option A: Using Supabase CLI
supabase db push

# Option B: Manual SQL (in Supabase dashboard)
# Copy contents of supabase/migrations/create_avenir_profile_embeddings_table.sql
# Execute in SQL Editor
```

**What this does:**
- Creates `avenir_profile_embeddings` table
- Enables pgvector extension
- Creates vector index for fast similarity search

### **Step 2: Embed the Avenir Profile**

```bash
# First time: Embed the profile (requires OPENAI_API_KEY)
npm run embed-profile

# Re-embed if profile updated (clears old embeddings):
npm run embed-profile -- --force
```

**What this does:**
- Reads `/data/avenir_profile.md`
- Chunks into ~512 token segments with ~64 token overlap
- Generates 1536D embeddings using OpenAI `text-embedding-3-small`
- Stores in Supabase `avenir_profile_embeddings` table

**Expected output:**
```
╔══════════════════════════════════════════════════════════════╗
║     🧠 AVENIR AI SOLUTIONS PROFILE EMBEDDING                ║
╚══════════════════════════════════════════════════════════════╝

📄 Reading profile from: /data/avenir_profile.md
📊 Profile size: 26003 characters
📊 Estimated tokens: 6500

🔄 Starting embedding process...
   Model: text-embedding-3-small
   Dimensions: 1536
   Chunk size: ~512 tokens
   Overlap: ~64 tokens

[SemanticMatcher] Processing section 1/12: Overview
[SemanticMatcher]   → 3 chunks created
[SemanticMatcher]   🔄 Embedding chunk 1/3...
[SemanticMatcher]   ✅ Chunk 1 embedded (1536D vector)
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SUCCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Total chunks embedded: 45
🗄️  Stored in: avenir_profile_embeddings table
✅ Profile ready for semantic matching
```

**Cost estimate:**
- ~45 chunks × $0.00002 per embedding = ~$0.001 (negligible)
- One-time cost (only re-run when profile updates)

### **Step 3: Verify Embeddings**

```sql
-- In Supabase SQL Editor
SELECT 
  chunk_id, 
  substring(chunk_text, 1, 100) as preview,
  metadata->>'section' as section
FROM avenir_profile_embeddings
ORDER BY created_at
LIMIT 10;
```

---

## 🔧 How It Works

### **1. Profile Embedding (One-Time)**

```
/data/avenir_profile.md
  ↓
Chunk into segments (~512 tokens each)
  ↓
OpenAI text-embedding-3-small
  ↓
1536D vectors
  ↓
Store in Supabase (avenir_profile_embeddings)
```

### **2. Prospect Matching (Per Prospect)**

```
New Prospect Discovery
  ↓
Generate prospect summary:
  - Business name
  - Industry
  - Region
  - Employee count
  - Website form presence
  - LinkedIn verification
  - Data source
  ↓
Embed prospect summary (1536D vector)
  ↓
Calculate cosine similarity with all profile chunks
  ↓
Average top 3 matches → Fit Score (0-100)
  ↓
GPT-4 generates bilingual reasoning
  ↓
Store in prospect.metadata:
  - business_fit_score
  - fit_reasoning
  - fit_top_matches
  - fit_confidence
```

### **3. Display in UI**

```
Prospect Intelligence Dashboard
  ↓
User clicks "📊 View Proof"
  ↓
ProspectProofModal opens
  ↓
Shows:
  - 🎯 Business Fit Score: 85/100
  - 🤖 AI Reasoning: "Strong fit..."
  - 📌 Top Matching Sections
```

---

## 📊 Pipeline Integration

Business Fit Scoring runs as **Stage 3.5** in the prospect pipeline:

```typescript
// prospect-intelligence/prospect_pipeline.ts

STAGE 1: PROSPECT DISCOVERY
  ↓ Apollo → PDL → Google

STAGE 1.5: FORM SCANNING
  ↓ Scan websites for contact forms

STAGE 2: FORM TESTING (skipped in most runs)
  ↓

STAGE 3: AUTOMATION SCORING
  ↓ Calculate automation_need_score

STAGE 3.5: BUSINESS FIT SCORING ← NEW
  ↓ Semantic matching against Avenir profile
  ↓ Generate bilingual AI reasoning

STAGE 4: OUTREACH GENERATION
  ↓

STAGE 5: SEND OUTREACH
  ↓

STAGE 6: DATABASE SAVE
```

**Code snippet:**
```typescript
// Check if Avenir profile is embedded
const profileEmbedded = await isProfileEmbedded();

if (profileEmbedded) {
  for (const prospect of sortedProspects) {
    const locale = prospect.language || 'en';
    const fitResult = await calculateBusinessFitScore(prospect, locale);
    
    prospect.metadata.business_fit_score = fitResult.score;
    prospect.metadata.fit_reasoning = fitResult.reasoning;
    prospect.metadata.fit_top_matches = fitResult.topMatches;
  }
}
```

---

## 🌐 Bilingual Reasoning

The system generates reasoning in **English or French** based on the prospect's language:

### **English Example:**
```
Fit Score: 87/100

AI Reasoning:
Strong fit for Avenir's target profile. This construction company with 
18 employees in Toronto matches our ideal client characteristics: 
service-based business in a priority industry, optimal team size for 
infrastructure ROI, and Canadian market alignment. The presence of a 
contact form indicates readiness for automation integration.
```

### **French Example:**
```
Score d'Adéquation: 87/100

Raisonnement IA:
Bonne correspondance avec le profil cible d'Avenir. Cette entreprise de 
construction avec 18 employés à Toronto correspond à nos caractéristiques 
de client idéal : entreprise de services dans une industrie prioritaire, 
taille d'équipe optimale pour le ROI de l'infrastructure, et alignement 
avec le marché canadien. La présence d'un formulaire de contact indique 
une volonté d'intégration d'automatisation.
```

---

## 📊 Scoring Factors

The semantic matcher considers all factors from the Avenir profile:

### **Primary Factors:**
- **Industry Match** (Construction, Real Estate, Marketing = highest)
- **Company Size** (5-50 employees = ideal)
- **Geographic Location** (Canada, especially QC = priority)
- **Digital Maturity** (website, form, email = ready)
- **Growth Stage** (scaling beyond manual = timing)

### **Secondary Factors:**
- LinkedIn presence (professional)
- Data source quality (PDL/Apollo = verified)
- Founded year (2015+ = modern)
- CAPTCHA status (none/basic = automatable)
- Contact paths (multiple = accessibility)

### **Scoring Formula:**
```
Semantic Similarity (top 3 chunks averaged)
  ↓
Convert to 0-100 scale
  ↓
Combine with:
  - Automation Need Score (existing)
  - Response Score (existing)
  ↓
Business Fit Score
```

---

## 🧪 Testing

### **Test 1: Check Profile Embedding Status**

```typescript
import { isProfileEmbedded, getProfileEmbeddingCount } from './src/lib/semantic_matcher';

const embedded = await isProfileEmbedded();
const count = await getProfileEmbeddingCount();

console.log('Profile embedded:', embedded);
console.log('Chunk count:', count);
```

**Expected:**
```
Profile embedded: true
Chunk count: 45
```

### **Test 2: Run Prospect Scan**

```bash
# Start dev server
npm run dev

# Open Prospect Intelligence
open http://localhost:3000/en/admin/prospect-intelligence

# Click "Scan for Prospects"
# Configure: Test Mode ON (for testing)
# Max Results: 5
```

**Expected console output:**
```
3.5️⃣  STAGE 3.5: BUSINESS FIT SCORING (SEMANTIC)
✅ Avenir profile embedded - calculating Business Fit Scores...
🧠 Calculating fit for: Elite Construction Group
   ✅ Fit Score: 85/100
   📝 Reasoning: Strong fit for Avenir's target profile...
```

### **Test 3: View Proof Modal**

```bash
# After scan completes:
# 1. Find a prospect in the table
# 2. Click "📊 View Proof"
# 3. Verify you see:
#    - 🎯 Business Fit Score: 85/100
#    - 🤖 AI Reasoning: [explanation text]
#    - 📌 Top Matching Sections
```

### **Test 4: French Localization**

```bash
open http://localhost:3000/fr/admin/prospect-intelligence

# Run scan
# Click "📊 View Proof"
# Verify French UI:
#  - 🎯 Score d'Adéquation Business: 85/100
#  - 🤖 Raisonnement IA: [texte en français]
```

---

## 🗄️ Database Schema

### **avenir_profile_embeddings Table:**

```sql
CREATE TABLE avenir_profile_embeddings (
  id UUID PRIMARY KEY,
  chunk_id TEXT UNIQUE NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Fields:**
- `chunk_id` - Unique identifier (e.g., "ideal_clients_chunk_0")
- `chunk_text` - Actual text content from profile
- `embedding` - 1536-dimensional vector from OpenAI
- `metadata` - Section name, chunk index, total chunks

### **prospect_candidates.metadata (New Fields):**

```json
{
  "business_fit_score": 85,
  "fit_reasoning": "Strong fit for Avenir's target profile...",
  "fit_top_matches": ["Ideal Clients", "Success Indicators", "Value Proposition"],
  "fit_confidence": 0.78
}
```

---

## ⚙️ Configuration

### **Environment Variables Required:**

```bash
# OpenAI (for embeddings and reasoning)
OPENAI_API_KEY=sk-...

# Supabase (for storing embeddings)
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

### **Embedding Settings:**

```typescript
// In semantic_matcher.ts
model: 'text-embedding-3-small'
dimensions: 1536
chunk_size: 512 tokens
overlap: 64 tokens
top_matches: 3
reasoning_model: 'gpt-4-turbo'
reasoning_max_tokens: 200
```

---

## 📈 Performance

### **Embedding (One-Time):**
- **Time:** ~2-3 minutes for full profile
- **API Calls:** ~45 embedding calls (one per chunk)
- **Cost:** ~$0.001 (negligible)
- **Storage:** ~2MB in Supabase (vectors + text)

### **Per-Prospect Matching:**
- **Time:** ~1-2 seconds per prospect
- **API Calls:** 1 embedding + 1 GPT-4 reasoning call
- **Cost:** ~$0.001 per prospect
- **Rate Limit:** 500ms between prospects (built-in)

### **Recommended Usage:**
- **Test Mode:** 5-10 prospects (for testing)
- **Production:** 20-50 prospects per scan
- **Avoid:** 100+ prospects in one run (rate limits)

---

## 🔍 Debugging

### **Check Embedding Status:**

```typescript
import { getProfileEmbeddingCount } from './src/lib/semantic_matcher';

const count = await getProfileEmbeddingCount();
console.log('Profile chunks:', count); // Should be ~45
```

### **View Embeddings in Supabase:**

```sql
SELECT 
  chunk_id,
  substring(chunk_text, 1, 100) as preview,
  metadata,
  created_at
FROM avenir_profile_embeddings
ORDER BY created_at;
```

### **Common Issues:**

**Problem:** "No profile embeddings found"  
**Solution:** Run `npm run embed-profile`

**Problem:** "OpenAI API error"  
**Solution:** Check `OPENAI_API_KEY` is set in `.env.local`

**Problem:** "Supabase error: relation does not exist"  
**Solution:** Run the migration to create `avenir_profile_embeddings` table

**Problem:** "Rate limit exceeded"  
**Solution:** Wait 60 seconds, reduce max prospects per scan

---

## 🎨 UI Display

### **Proof Modal - Business Fit Section:**

```
┌──────────────────────────────────────────────────┐
│ 🎯 Business Fit Score                      85/100│
├──────────────────────────────────────────────────┤
│                                                  │
│ 🤖 AI Reasoning:                                 │
│ Strong fit for Avenir's target profile.          │
│ Construction company with 18 employees in        │
│ Toronto matches our ideal client                 │
│ characteristics...                               │
│                                                  │
│ 📌 Top Matching Sections:                        │
│ [Ideal Clients] [Success Indicators] [Value]     │
│                                                  │
│ 💡 Score calculated by semantic matching         │
│    against Avenir AI Solutions profile           │
└──────────────────────────────────────────────────┘
```

**Location:** Above "Scoring Breakdown" in View Proof modal  
**Visibility:** Only shows if `business_fit_score` exists in metadata  
**Styling:** Purple gradient border, prominent display

---

## 🔄 Updating the Profile

When Avenir's business focus changes (new industries, regions, etc.):

1. **Edit** `/data/avenir_profile.md`
2. **Re-embed** with `npm run embed-profile -- --force`
3. **Verify** new chunk count matches expectations
4. **Test** with a few prospects to validate new scoring

**Update triggers:**
- New target industries
- Geographic expansion
- Major product features
- Competitive positioning shift
- ICP refinement based on client data

---

## 📊 Example Workflow

```bash
# 1. Setup (one-time)
npm run embed-profile

# 2. Run prospect scan
npm run dev
# Visit http://localhost:3000/en/admin/prospect-intelligence
# Click "Scan for Prospects"
# Test Mode: ON
# Max Results: 10

# 3. View results
# Click "📊 View Proof" on any prospect
# See Business Fit Score and AI reasoning

# 4. Verify bilingual
# Visit http://localhost:3000/fr/admin/prospect-intelligence
# Run scan
# Click "📊 View Proof"
# Verify French reasoning
```

---

## 🧠 AI Reasoning Examples

### **High Fit (90+):**

**EN:**
```
Perfect alignment with Avenir's ideal client profile. This Quebec-based 
real estate brokerage with 25 employees operates in a priority industry 
and serves the bilingual market. Their active website and contact form 
indicate digital readiness, while their growth stage (founded 2018) 
suggests they're outgrowing manual processes. Strong candidate for 
automated lead management and bilingual client communication.
```

**FR:**
```
Alignement parfait avec le profil client idéal d'Avenir. Cette agence 
immobilière basée au Québec avec 25 employés opère dans une industrie 
prioritaire et dessert le marché bilingue. Leur site web actif et 
formulaire de contact indiquent une maturité numérique, tandis que 
leur stade de croissance (fondée en 2018) suggère qu'ils dépassent 
les processus manuels. Candidat fort pour la gestion automatisée des 
leads et la communication client bilingue.
```

### **Moderate Fit (70-75):**

**EN:**
```
Moderate fit for Avenir. This marketing agency in Vancouver has digital 
presence and appropriate team size (15 employees), but operates outside 
Quebec's bilingual market which reduces strategic alignment. Industry 
match is good (professional services), though not in our highest-priority 
sectors. Consider for outreach if expanding beyond bilingual focus.
```

### **Low Fit (< 60):**

**EN:**
```
Limited fit for Avenir's current ICP. While this is a service business, 
the 200+ employee count suggests enterprise needs beyond our SMB focus. 
Geographic location outside Canada also reduces fit. Better suited for 
enterprise SaaS providers.
```

---

## ✅ Success Criteria

### **Embedding Complete When:**
- ✅ `avenir_profile_embeddings` table has 40-50 chunks
- ✅ Each chunk has 1536D embedding vector
- ✅ All profile sections represented
- ✅ No errors in embedding logs

### **Matching Working When:**
- ✅ Prospect scans calculate fit scores (0-100)
- ✅ AI reasoning generated in correct language
- ✅ Top matching sections identified
- ✅ Scores displayed in View Proof modal
- ✅ French prospects get French reasoning

### **Production Ready When:**
- ✅ Profile embedded and verified
- ✅ 10+ test prospects scored successfully
- ✅ Bilingual reasoning tested
- ✅ No OpenAI rate limit errors
- ✅ Supabase queries fast (< 500ms)

---

## 🚨 Important Notes

### **OpenAI API Costs:**
- Embeddings: ~$0.00002 per chunk (negligible)
- Reasoning: ~$0.01 per prospect (GPT-4 turbo)
- **Budget:** ~$0.50 per 50 prospects scanned

### **Rate Limits:**
- OpenAI: 10,000 RPM (requests per minute)
- Built-in delays: 100ms (embeddings), 500ms (reasoning)
- Recommended: Max 50 prospects per scan

### **Data Privacy:**
- Profile stored in Supabase (Canadian-friendly)
- Embeddings are numerical (not reversible to original text)
- No prospect PII sent to OpenAI (only business data)

---

## 📚 Related Documentation

- `data/avenir_profile.md` - Full business context
- `PEOPLE_DATA_LABS_INTEGRATION.md` - PDL setup for prospect discovery
- `FORM_SCANNER.md` - Form detection logic
- `PROSPECT_INTELLIGENCE_FRENCH_LOCALIZATION.md` - Bilingual UI

---

## ✅ Summary

**What You Get:**
- 🎯 Intelligent prospect prioritization (fit scores)
- 🤖 AI-generated reasoning (bilingual)
- 🧠 Semantic matching (not just keyword rules)
- 📊 Transparent scoring breakdown
- 🌐 Full EN/FR support

**Next Steps:**
1. Run migration: Create `avenir_profile_embeddings` table
2. Embed profile: `npm run embed-profile`
3. Test scan: Generate prospects and view fit scores
4. Verify bilingual: Test French reasoning
5. Deploy: Push to production

---

✅ **Semantic matching ready for production!** 🚀

