# Metadata JSONB Implementation Summary

**Date:** October 17, 2025  
**Status:** ✅ Complete  
**Build Status:** ✅ Passing

---

## Overview

Enhanced the `prospect_candidates` table to safely handle JSONB metadata with robust type checking and validation. The metadata column already existed in the schema but now has improved handling logic and a dedicated migration file.

---

## Changes Implemented

### 1. Database Schema

**File:** `supabase/migrations/add_metadata_to_prospect_candidates.sql` (NEW)

**Features:**
- Idempotent migration (safe to run multiple times)
- Checks if column exists before adding
- Creates GIN index for fast JSON queries
- Adds documentation comment

**Migration Code:**
```sql
-- Add metadata column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prospect_candidates' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.prospect_candidates 
        ADD COLUMN metadata JSONB;
        
        RAISE NOTICE 'Added metadata column to prospect_candidates';
    ELSE
        RAISE NOTICE 'metadata column already exists in prospect_candidates';
    END IF;
END $$;

-- Create index on metadata for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_prospect_metadata 
ON public.prospect_candidates USING GIN (metadata);

-- Add comment for documentation
COMMENT ON COLUMN public.prospect_candidates.metadata IS 'Flexible JSONB field for storing additional prospect data, test results, and enrichment information';
```

**Benefits:**
- ✅ GIN index enables fast queries on JSON fields
- ✅ Safe to run multiple times
- ✅ Clear logging messages
- ✅ Self-documenting with column comment

---

### 2. Enhanced Save Logic

**File:** `prospect-intelligence/database/supabase_connector.ts`

**Improvements:**
- Type-safe metadata handling
- Validates metadata is an object (not array)
- Wraps non-object metadata in `{ raw: value }`
- Defaults to empty object `{}` if missing
- Prevents database errors from invalid JSONB

**Updated Code:**
```typescript
const records = prospects.map(p => {
  // Safely handle metadata - ensure it's a valid object
  let safeMetadata = {};
  if (p.metadata && typeof p.metadata === 'object' && !Array.isArray(p.metadata)) {
    safeMetadata = p.metadata;
  } else if (p.metadata) {
    // If metadata exists but is not an object, wrap it
    safeMetadata = { raw: p.metadata };
  }

  return {
    business_name: p.business_name,
    website: p.website,
    contact_email: p.contact_email || null,
    industry: p.industry || null,
    region: p.region || null,
    language: p.language || 'en',
    form_url: p.form_url || null,
    last_tested: p.last_tested || new Date(),
    response_score: p.response_score || 0,
    automation_need_score: p.automation_need_score || 0,
    contacted: p.contacted || false,
    metadata: safeMetadata  // ✅ Always a valid object
  };
});
```

**Validation Rules:**
1. If `metadata` exists and is a plain object → use as-is
2. If `metadata` exists but is not an object (string, number, array) → wrap in `{ raw: metadata }`
3. If `metadata` is null/undefined → use empty object `{}`

**Examples:**

```javascript
// Valid object - used as-is
{ metadata: { test_data: true, source: 'crawler' } }
→ { test_data: true, source: 'crawler' }

// Array - wrapped
{ metadata: ['tag1', 'tag2'] }
→ { raw: ['tag1', 'tag2'] }

// String - wrapped
{ metadata: 'some string' }
→ { raw: 'some string' }

// Missing - defaults to empty object
{ metadata: null }
→ {}

// Undefined - defaults to empty object
{ }
→ {}
```

---

## Schema Definition

**Table:** `prospect_candidates`

```sql
CREATE TABLE public.prospect_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  website TEXT NOT NULL UNIQUE,
  contact_email TEXT,
  industry TEXT,
  region TEXT,
  language TEXT DEFAULT 'en',
  form_url TEXT,
  last_tested TIMESTAMPTZ,
  response_score NUMERIC DEFAULT 0,
  automation_need_score NUMERIC DEFAULT 0,
  contacted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB  -- ✅ Flexible JSON storage
);
```

**Index:**
```sql
CREATE INDEX idx_prospect_metadata 
ON public.prospect_candidates USING GIN (metadata);
```

---

## Metadata Use Cases

### 1. Test Data Information
```json
{
  "test_data": true,
  "generated_at": "2025-10-17T10:30:00Z",
  "response_time_minutes": 120,
  "has_autoresponder": false,
  "estimated_company_size": 25,
  "website_quality": "high"
}
```

### 2. Enrichment Data
```json
{
  "enrichment_source": "Clearbit",
  "enrichment_date": "2025-10-17T10:30:00Z",
  "employee_count": 50,
  "annual_revenue": "$2M-$5M",
  "founded_year": 2018,
  "technologies": ["WordPress", "Google Analytics", "Mailchimp"],
  "social_profiles": {
    "linkedin": "https://linkedin.com/company/...",
    "facebook": "https://facebook.com/..."
  }
}
```

### 3. Form Test Results
```json
{
  "form_test_id": "uuid",
  "test_date": "2025-10-17T10:30:00Z",
  "form_found": true,
  "response_time_seconds": 7200,
  "autoresponder_detected": false,
  "autoresponder_tone": "none",
  "test_status": "completed"
}
```

### 4. Scoring Details
```json
{
  "automation_score_breakdown": {
    "response_time_score": 30,
    "form_quality_score": 25,
    "industry_fit_score": 35,
    "engagement_potential_score": 10
  },
  "scoring_date": "2025-10-17T10:30:00Z",
  "scoring_version": "1.0"
}
```

---

## Querying JSONB Data

### Basic Queries

**Get prospects with specific metadata key:**
```sql
SELECT * FROM prospect_candidates 
WHERE metadata ? 'test_data';
```

**Get prospects where metadata value matches:**
```sql
SELECT * FROM prospect_candidates 
WHERE metadata->>'source' = 'crawler';
```

**Get prospects with nested value:**
```sql
SELECT * FROM prospect_candidates 
WHERE metadata->'enrichment'->>'employee_count' > '50';
```

### Advanced Queries

**Filter by JSON array contains:**
```sql
SELECT * FROM prospect_candidates 
WHERE metadata->'technologies' @> '["WordPress"]';
```

**Update metadata:**
```sql
UPDATE prospect_candidates 
SET metadata = metadata || '{"updated": true}'::jsonb 
WHERE id = 'uuid';
```

**Add new key to metadata:**
```sql
UPDATE prospect_candidates 
SET metadata = jsonb_set(metadata, '{enriched}', 'true')
WHERE contacted = false;
```

---

## Testing

### Verify Metadata Storage

**Test 1: Run prospect scan**
```bash
# Navigate to /en/admin/prospect-intelligence
# Click "Run Prospect Scan"
# Check database:
SELECT business_name, metadata FROM prospect_candidates LIMIT 5;
```

**Expected Output:**
```sql
business_name              | metadata
---------------------------|------------------------------------------------
Elite Construction Group   | {"test_data": true, "generated_at": "2025-...", ...}
Premier Realty Group       | {"test_data": true, "response_time_minutes": 120, ...}
```

**Test 2: Verify index**
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'prospect_candidates' 
  AND indexname = 'idx_prospect_metadata';
```

**Expected Output:**
```
indexname            | indexdef
---------------------|-----------------------------------------------
idx_prospect_metadata| CREATE INDEX idx_prospect_metadata ON public.prospect_candidates USING gin (metadata)
```

**Test 3: Query by metadata**
```sql
-- Find all test data prospects
SELECT COUNT(*) FROM prospect_candidates 
WHERE metadata->>'test_data' = 'true';

-- Find prospects with quick response
SELECT business_name, metadata->>'response_time_minutes' AS response_time
FROM prospect_candidates 
WHERE (metadata->>'response_time_minutes')::int < 60;
```

---

## Performance Considerations

### GIN Index Benefits
- ✅ Fast lookups on JSON keys
- ✅ Efficient containment queries (`@>`, `?`)
- ✅ Supports partial matching

### Best Practices
1. Keep metadata objects flat when possible
2. Use consistent key names across all records
3. Index frequently queried JSON paths
4. Consider separate columns for critical fields

---

## Migration Instructions

### For Existing Databases

**Step 1: Run migration**
```bash
# Connect to Supabase
psql $DATABASE_URL

# Run migration
\i supabase/migrations/add_metadata_to_prospect_candidates.sql
```

**Step 2: Verify column exists**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prospect_candidates' 
  AND column_name = 'metadata';
```

**Step 3: Check index**
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'prospect_candidates';
```

### For New Databases

The column is already defined in `add_prospect_intelligence_tables.sql`, so new databases will have it automatically.

---

## Build Verification

✅ **TypeScript Compilation:** Successful  
✅ **Linting:** No errors  
✅ **Static Generation:** 55/55 pages  
✅ **Exit Code:** 0

---

## Files Modified

1. ✅ `supabase/migrations/add_metadata_to_prospect_candidates.sql` (NEW)
2. ✅ `prospect-intelligence/database/supabase_connector.ts`

---

## Related Documentation

- `PROSPECT_INTELLIGENCE_AUTOMATION_REPORT.md` - Full prospect system overview
- `PROSPECT_INTELLIGENCE_QUICK_START.md` - Getting started guide
- `supabase/migrations/add_prospect_intelligence_tables.sql` - Main schema

---

## Support

**For Issues:**
- Check that migration has been run: `\d prospect_candidates`
- Verify GIN index exists: `\di idx_prospect_metadata`
- Check save logic handles edge cases
- Review metadata validation in `supabase_connector.ts`

---

**Status:** ✅ Complete and Production-Ready  
**Last Updated:** October 17, 2025

