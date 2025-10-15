# 🔧 Schema Fix Guide - AI Memory System

## 🎯 Problem

Error: "Could not find the 'confidence_history' column of 'lead_memory' in the schema cache"

**Root Cause:** The new history columns weren't added to Supabase, or PostgREST's schema cache hasn't refreshed.

---

## ✅ Solution

### **Step 1: Run Migration SQL**

**Option A: Use the dedicated migration script (Recommended)**

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `migration-add-history-columns.sql`
3. Paste and click "Run"
4. **Expected output:**
   ```
   NOTICE: ✅ Added tone_history column
   NOTICE: ✅ Added confidence_history column
   NOTICE: ✅ Added urgency_history column
   NOTICE: ✅ Added last_updated column
   NOTICE: ✅ Added relationship_insight column
   NOTICE: ============================================
   NOTICE: ✅ SUCCESS: All history columns present in lead_memory
   NOTICE: ============================================
   NOTICE: Columns verified:
   NOTICE:   - tone_history (jsonb)
   NOTICE:   - confidence_history (jsonb)
   NOTICE:   - urgency_history (jsonb)
   NOTICE:   - last_updated (timestamptz)
   NOTICE:   - relationship_insight (text)
   NOTICE: ============================================
   NOTICE: Schema cache refreshed. Ready to accept leads!
   NOTICE: ============================================
   ```

**Option B: Run full setup**

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase-setup.sql`
3. Paste and click "Run"
4. Look for the same success messages

---

### **Step 2: Verify Columns in Dashboard**

1. Go to Supabase Dashboard → Table Editor
2. Select `lead_memory` table
3. **Check these columns exist:**
   - ✅ `tone_history` (type: jsonb)
   - ✅ `confidence_history` (type: jsonb)
   - ✅ `urgency_history` (type: jsonb)
   - ✅ `last_updated` (type: timestamptz)
   - ✅ `relationship_insight` (type: text)

---

### **Step 3: Refresh Schema Cache (If Needed)**

If columns exist but you still get cache errors:

**Method 1: SQL Command**
```sql
ALTER TABLE lead_memory REPLICA IDENTITY FULL;
```

**Method 2: Restart API**
- Supabase Dashboard → Settings → API → Restart

**Method 3: Wait**
- PostgREST refreshes cache automatically every 5-10 minutes

---

### **Step 4: Redeploy Application**

```bash
# Commit changes
git add .
git commit -m "Add AI memory system with schema verification"

# Deploy to Vercel
vercel --prod
```

---

### **Step 5: Test Lead Submission**

1. Visit your deployed site
2. Submit a lead form
3. **Check Vercel logs for:**
   ```
   [LeadMemory] Verifying schema...
   [Schema Verification] ✅ Schema verified: tone_history, confidence_history, urgency_history, last_updated, relationship_insight present
   [LeadMemory] ✅ New lead created successfully
   ```

4. **Check Supabase Dashboard:**
   - Go to Table Editor → `lead_memory`
   - Verify new row exists
   - Check `tone_history` contains JSON array: `[{"value": "professional", "timestamp": "2025-10-15T..."}]`

---

## 🔍 **Troubleshooting**

### **Issue 1: Columns still missing after running SQL**

**Check:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lead_memory' 
ORDER BY ordinal_position;
```

**Expected to see:**
- `tone_history` | `jsonb`
- `confidence_history` | `jsonb`
- `urgency_history` | `jsonb`
- `last_updated` | `timestamp with time zone`
- `relationship_insight` | `text`

---

### **Issue 2: Schema cache not refreshing**

**Force refresh:**
```sql
-- Method 1: Change replica identity
ALTER TABLE lead_memory REPLICA IDENTITY FULL;

-- Method 2: Notify PostgREST
NOTIFY pgrst, 'reload schema';

-- Method 3: Add a dummy column and remove it
ALTER TABLE lead_memory ADD COLUMN _dummy TEXT;
ALTER TABLE lead_memory DROP COLUMN _dummy;
```

---

### **Issue 3: Still getting "column not found" errors**

**Check RLS policies:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'lead_memory';
```

**Ensure service role has access:**
```sql
CREATE POLICY "Service role full access to lead_memory" ON lead_memory
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

---

### **Issue 4: Runtime verification fails**

**Check logs for:**
```
[Schema Verification] ❌ Schema check failed
[Schema Verification] Missing columns: confidence_history
```

**Solution:**
- Run migration SQL again
- Wait 5 minutes for cache refresh
- Restart PostgREST API

---

## 📊 **Expected Log Sequence (Success)**

```
1. [Lead API] POST /api/lead triggered
2. [Lead API] Request body parsed: { name, email, ... }
3. [Lead API] ✅ Validation passed
4. [Lead API] Starting AI Intelligence & Storage
5. [AI Intelligence] ✅ Enrichment complete: { intent, tone, urgency, confidence }
6. [AI Intelligence] Calling upsertLeadWithHistory()...
7. [LeadMemory] upsertLeadWithHistory() called
8. [LeadMemory] Verifying schema...
9. [Schema Verification] Checking lead_memory table schema...
10. [Schema Verification] ✅ Schema verified: tone_history, confidence_history, urgency_history, last_updated, relationship_insight present
11. [LeadMemory] Executing SELECT query...
12. [LeadMemory] SELECT result: { found: false }
13. [LeadMemory] No existing record found - creating new lead
14. [LeadMemory] Executing INSERT query to table: lead_memory
15. [LeadMemory] INSERT result: { success: true, hasData: true }
16. [LeadMemory] ✅ New lead created successfully
17. [AI Intelligence] ✅ New lead created: lead_123...
18. [Lead API] ✅ AI Intelligence & Storage COMPLETE
19. [Lead API] ✅ Lead processing COMPLETE
```

---

## 📊 **Expected Log Sequence (Schema Error)**

```
1. [Lead API] POST /api/lead triggered
2. [Lead API] Request body parsed: { name, email, ... }
3. [Lead API] ✅ Validation passed
4. [Lead API] Starting AI Intelligence & Storage
5. [AI Intelligence] ✅ Enrichment complete: { intent, tone, urgency, confidence }
6. [AI Intelligence] Calling upsertLeadWithHistory()...
7. [LeadMemory] upsertLeadWithHistory() called
8. [LeadMemory] Verifying schema...
9. [Schema Verification] Checking lead_memory table schema...
10. [Schema Verification] ❌ Schema check failed: { code: "42703", message: "column \"confidence_history\" does not exist" }
11. [Schema Verification] Missing columns: confidence_history
12. [LeadMemory] ❌ SCHEMA VERIFICATION FAILED
13. [LeadMemory] Missing columns: confidence_history
14. [LeadMemory] Please run the migration SQL from supabase-setup.sql
15. [AI Intelligence] Error message: Schema verification failed. Missing columns: confidence_history
16. [Lead API] ❌ AI Intelligence/Storage FAILED
```

---

## ✅ **Summary**

**What's Been Added:**
- ✅ Dedicated migration SQL file (`migration-add-history-columns.sql`)
- ✅ Schema cache refresh command (`ALTER TABLE ... REPLICA IDENTITY FULL`)
- ✅ Post-migration verification in SQL
- ✅ Runtime schema verification function
- ✅ Automatic detection of missing columns
- ✅ Clear error messages with actionable steps

**Files Created:**
1. `migration-add-history-columns.sql` - Quick migration script

**Files Modified:**
1. `supabase-setup.sql` - Added cache refresh + verification
2. `src/lib/supabase.ts` - Added `verifyLeadMemorySchema()` + integrated check

**Build:** ✓ PASSING  
**Ready to fix:** ✓ YES

---

## 🚀 **Quick Fix (3 Steps)**

### **1. Run Migration:**
```
Supabase Dashboard → SQL Editor → Paste migration-add-history-columns.sql → Run
```

### **2. Verify Success:**
Look for:
```
✅ SUCCESS: All history columns present in lead_memory
```

### **3. Redeploy:**
```bash
vercel --prod
```

**Done! Leads will now save with full history tracking!** 🎉✨
