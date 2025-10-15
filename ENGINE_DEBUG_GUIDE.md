# 🔍 Intelligence Engine - Complete Debug Guide

## 🎯 **What Will Happen When You Run It**

The enhanced logging will now show you **EXACTLY** what's failing.

---

## 📊 **Expected Console Output**

### **When You Run `/api/intelligence-engine`:**

```
[Engine] ============================================
[Engine] Starting weekly intelligence analysis...
[Engine] ============================================
[Engine] Analysis period: {
  start: '2025-10-08T...',
  end: '2025-10-15T...',
  days: 7
}
[Engine] -------- Global Analysis --------
[Engine] Analyzing leads for client: global
[Engine] Period: 2025-10-08... to 2025-10-15...
[Engine] Executing Supabase query (with time range filter)...

>>> CHECK THIS LINE <<<
[Engine] Initial query response: { rowCount: X, error: '...' }

If rowCount = 0:
  → Your lead is either too old or doesn't exist
  → Run: SELECT id, timestamp FROM lead_memory ORDER BY timestamp DESC;

If rowCount > 0:
  ↓ Continue...

[Engine] Filtered leads: X → Y (removed archived/deleted)

If Y < X:
  → Some leads were archived or deleted
  → Run: UPDATE lead_memory SET archived = FALSE, deleted = FALSE;

If Y = 0:
  → All leads were filtered out
  → Your lead has archived = true or deleted = true

If Y > 0:
  ↓ Continue...

[Engine] Fetched leads: Y
[Engine] Sample lead IDs: ['lead_1760462469775_asygrt3he']
[Engine] Sample lead data: [{
  id: 'lead_1760462469775_asygrt3he',
  intent: 'B2B partnership',  ← Check if this is NULL
  tone: 'professional',       ← Check if this is NULL
  urgency: 'High',            ← Check if this is NULL
  confidence: 0.85            ← Check if this is NULL
}]
[Engine] Starting metrics calculation...
[Engine] Top intents calculated: 1

>>> THIS IS WHERE INSERT HAPPENS <<<
[Engine] ============================================
[Engine] Storing insights to growth_brain table...
[Engine] ============================================
[Engine] Complete insights object: {
  "client_id": null,
  "analysis_period_start": "2025-10-08T...",
  "analysis_period_end": "2025-10-15T...",
  "total_leads": 1,
  "top_intents": [...],
  "urgency_distribution": {...},
  "urgency_trend_percentage": 15.5,
  "tone_distribution": [...],
  "tone_sentiment_score": 75.0,
  "avg_confidence": 0.85,
  "confidence_trajectory": [...],
  "language_ratio": {...},
  "engagement_score": 63.75,
  "predictive_insights": {...}
}
[Engine] Data summary: {
  client_id: null,
  total_leads: 1,
  period_start: '...',
  period_end: '...',
  avg_confidence: 0.85,
  engagement_score: 63.75,
  has_top_intents: true,
  has_urgency_dist: true,
  has_predictive: true
}
[Engine] Executing INSERT into growth_brain...

>>> CRITICAL: CHECK THIS RESPONSE <<<
[Engine] ============================================
[Engine] INSERT Result:
[Engine] ============================================
[Engine] Success: true/false
[Engine] Data returned: YES/NO
[Engine] Error: YES/NO

If Error = YES:
  ↓ You'll see:

[Engine] ❌ INSERT FAILED
[Engine] Error code: 42P01 (or other)
[Engine] Error message: "relation 'growth_brain' does not exist"
[Engine] Error details (full): {
  "code": "42P01",
  "message": "relation 'growth_brain' does not exist",
  "hint": "...",
  "details": "..."
}
[Engine] Hint: Create the table first
[Engine] Details: ...

>>> THIS WILL TELL YOU THE EXACT PROBLEM <<<
```

---

## 🔍 **Common Error Scenarios**

### **Error 1: Table Doesn't Exist**

**Console Shows:**
```
[Engine] Error code: 42P01
[Engine] Error message: relation "growth_brain" does not exist
```

**Fix:**
Run `supabase-setup.sql` in Supabase SQL Editor to create the table.

---

### **Error 2: Column Missing**

**Console Shows:**
```
[Engine] Error code: 42703
[Engine] Error message: column "some_column" does not exist
```

**Fix:**
Check which column is missing and add it to growth_brain table.

---

### **Error 3: Type Mismatch**

**Console Shows:**
```
[Engine] Error code: 42804
[Engine] Error message: column "avg_confidence" is of type numeric but expression is of type text
```

**Fix:**
The data type being inserted doesn't match the column type. Check the schema.

---

### **Error 4: NULL Violation**

**Console Shows:**
```
[Engine] Error code: 23502
[Engine] Error message: null value in column "some_column" violates not-null constraint
```

**Fix:**
A required column is receiving NULL. Check which field in the insights object is NULL.

---

### **Error 5: RLS Blocking**

**Console Shows:**
```
[Engine] Error code: 42501
[Engine] Error message: new row violates row-level security policy
```

**Fix:**
Service role doesn't have permission. Run:
```sql
CREATE POLICY "Service role full access to growth_brain" ON growth_brain
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

---

## 🧪 **Testing Procedure**

### **Step 1: Verify Your Lead**
```sql
SELECT 
  id, 
  name, 
  timestamp,
  timestamp >= NOW() - INTERVAL '7 days' AS within_period,
  COALESCE(archived, FALSE) AS archived,
  COALESCE(deleted, FALSE) AS deleted,
  intent,
  tone,
  urgency,
  confidence_score
FROM lead_memory 
WHERE id = 'lead_1760462469775_asygrt3he';
```

**Expected:**
- `within_period = true`
- `archived = false`
- `deleted = false`
- `intent`, `tone`, `urgency` NOT NULL

---

### **Step 2: Check growth_brain Table**
```sql
-- Verify table exists
SELECT COUNT(*) FROM growth_brain;

-- Check schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'growth_brain'
ORDER BY ordinal_position;
```

**Expected Columns:**
- `id` (uuid)
- `client_id` (uuid, nullable)
- `analysis_period_start` (timestamptz)
- `analysis_period_end` (timestamptz)
- `total_leads` (integer)
- `top_intents` (jsonb)
- `urgency_distribution` (jsonb)
- `urgency_trend_percentage` (numeric)
- `tone_distribution` (jsonb)
- `tone_sentiment_score` (numeric)
- `avg_confidence` (numeric)
- `confidence_trajectory` (jsonb)
- `language_ratio` (jsonb)
- `engagement_score` (numeric)
- `predictive_insights` (jsonb)
- `analyzed_at` (timestamptz, default NOW())
- `created_at` (timestamptz, default NOW())

---

### **Step 3: Run Intelligence Engine**
```bash
curl http://localhost:3000/api/intelligence-engine
```

---

### **Step 4: Read the Logs**

The logs will tell you EXACTLY what's happening:

**If it succeeds:**
```
[Engine] ✅ Processed: 1, ❌ Errors: 0
```

**If it fails:**
```
[Engine] ❌ INSERT FAILED
[Engine] Error code: XXXXX
[Engine] Error message: (the exact problem)
[Engine] Error details (full): { ... }
```

**Copy the error details and the exact error code to debug further.**

---

## 🛠️ **Quick Fixes**

### **Fix 1: Table Missing**
```sql
-- Run complete supabase-setup.sql
-- OR create just growth_brain:
CREATE TABLE IF NOT EXISTS growth_brain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  analysis_period_start TIMESTAMPTZ NOT NULL,
  analysis_period_end TIMESTAMPTZ NOT NULL,
  total_leads INTEGER NOT NULL DEFAULT 0,
  top_intents JSONB,
  urgency_distribution JSONB,
  urgency_trend_percentage NUMERIC(5,2),
  tone_distribution JSONB,
  tone_sentiment_score NUMERIC(5,2),
  avg_confidence NUMERIC(5,2),
  confidence_trajectory JSONB,
  language_ratio JSONB,
  engagement_score NUMERIC(5,2),
  predictive_insights JSONB,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE growth_brain ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to growth_brain" ON growth_brain
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

---

### **Fix 2: Lead Too Old**
```sql
-- Update timestamp to be recent
UPDATE lead_memory 
SET timestamp = NOW() - INTERVAL '1 day'
WHERE id = 'lead_1760462469775_asygrt3he';
```

---

### **Fix 3: Lead Archived/Deleted**
```sql
UPDATE lead_memory 
SET archived = FALSE, deleted = FALSE
WHERE id = 'lead_1760462469775_asygrt3he';
```

---

### **Fix 4: Missing AI Fields**
```sql
-- Check if lead has AI enrichment
SELECT id, intent, tone, urgency, confidence_score
FROM lead_memory 
WHERE id = 'lead_1760462469775_asygrt3he';
```

If any are NULL, the lead wasn't enriched. Re-process it through `/api/lead`.

---

## ✅ **What to Expect**

**After running the endpoint, you'll see one of these outcomes:**

### **✅ Success:**
```json
{
  "success": true,
  "data": { "processed": 1, "errors": 0 },
  "message": "Processed 1 analyses with 0 errors"
}
```

Console shows:
- Fetched 1+ leads
- Analysis completed
- Insert succeeded
- ✅ Processed: 1

---

### **⚠️ No Data:**
```json
{
  "success": true,
  "data": { "processed": 0, "errors": 0 },
  "message": "Processed 0 analyses with 0 errors"
}
```

Console shows:
- Fetched 0 leads
- ⚠️ No leads found in period

**Not an error - just no data to analyze. Lead might be too old.**

---

### **❌ Error:**
```json
{
  "success": true,
  "data": { "processed": 0, "errors": 1 },
  "message": "Processed 0 analyses with 1 errors"
}
```

Console shows:
- ❌ INSERT FAILED (or other error)
- Error code: XXXXX
- Error message: (exact problem)
- Full error details

**This will tell you EXACTLY what to fix!**

---

## 🎯 **Summary**

**The Intelligence Engine now has:**
1. ✅ Comprehensive logging at EVERY step
2. ✅ Full error details with codes, messages, hints
3. ✅ Sample lead data display
4. ✅ Complete insights object logging
5. ✅ INSERT response details
6. ✅ Stack traces on all errors
7. ✅ Client-side filtering (handles NULL values)
8. ✅ Safe math (no division errors)

**When you run it, the logs will tell you:**
- Exactly how many leads were found ✓
- Which specific leads were processed ✓
- The complete data being inserted ✓
- Whether the insert succeeded ✓
- The EXACT error if it failed ✓

**No more guessing - full transparency!** 🔍

---

**Run the endpoint now and share the console output. The logs will reveal the exact issue!** 🚀
