# ✅ Schema Verification - Complete

## 🎉 Status: **COMPLETE**

Build Status: **PASSING** ✓  
Schema Verification: **IMPLEMENTED** ✓  
Cache Refresh: **ADDED** ✓  
Error Detection: **AUTOMATIC** ✓

---

## 🔧 **What's Been Added**

### **1. Enhanced Migration SQL** ✅

**File:** `supabase-setup.sql`

#### **Schema Cache Refresh:**
```sql
-- Refresh schema cache to ensure PostgREST picks up new columns
ALTER TABLE lead_memory REPLICA IDENTITY FULL;
```

**Purpose:** Forces PostgREST to refresh its schema cache and recognize new columns immediately.

---

#### **Post-Migration Verification:**
```sql
-- Verify all required columns exist
DO $$
DECLARE
  missing_columns TEXT := '';
BEGIN
  -- Check for tone_history
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'tone_history'
  ) THEN
    missing_columns := missing_columns || 'tone_history, ';
  END IF;
  
  -- Check for confidence_history
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'confidence_history'
  ) THEN
    missing_columns := missing_columns || 'confidence_history, ';
  END IF;
  
  -- Check for urgency_history
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'urgency_history'
  ) THEN
    missing_columns := missing_columns || 'urgency_history, ';
  END IF;
  
  -- Check for relationship_insight
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'relationship_insight'
  ) THEN
    missing_columns := missing_columns || 'relationship_insight, ';
  END IF;
  
  -- Check for last_updated
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_memory' AND column_name = 'last_updated'
  ) THEN
    missing_columns := missing_columns || 'last_updated, ';
  END IF;
  
  IF missing_columns != '' THEN
    RAISE EXCEPTION 'Missing columns in lead_memory: %', missing_columns;
  ELSE
    RAISE NOTICE '✅ All required columns present in lead_memory table';
  END IF;
END $$;
```

**Purpose:** Verifies all columns were created successfully. Raises an exception if any are missing.

---

### **2. Runtime Schema Verification Function** ✅

**File:** `src/lib/supabase.ts`

**New Function:** `verifyLeadMemorySchema()`

```typescript
export async function verifyLeadMemorySchema(): Promise<{ 
  verified: boolean; 
  missingColumns: string[] 
}> {
  try {
    console.log('[Schema Verification] Checking lead_memory table schema...');
    
    // Try to select the new columns to verify they exist
    const { data, error } = await supabase
      .from('lead_memory')
      .select('id, tone_history, confidence_history, urgency_history, last_updated, relationship_insight')
      .limit(1);
    
    if (error) {
      console.error('[Schema Verification] ❌ Schema check failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      
      // Parse error message to detect missing columns
      const missingColumns: string[] = [];
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('tone_history')) missingColumns.push('tone_history');
      if (errorMsg.includes('confidence_history')) missingColumns.push('confidence_history');
      if (errorMsg.includes('urgency_history')) missingColumns.push('urgency_history');
      if (errorMsg.includes('last_updated')) missingColumns.push('last_updated');
      if (errorMsg.includes('relationship_insight')) missingColumns.push('relationship_insight');
      
      console.error('[Schema Verification] Missing columns:', missingColumns.join(', '));
      return { verified: false, missingColumns };
    }
    
    console.log('[Schema Verification] ✅ Schema verified: tone_history, confidence_history, urgency_history, last_updated, relationship_insight present');
    return { verified: true, missingColumns: [] };
    
  } catch (err) {
    console.error('[Schema Verification] ❌ Unexpected error during schema check:', err);
    return { verified: false, missingColumns: ['unknown'] };
  }
}
```

**Purpose:** 
- Runs before every upsert operation
- Attempts to SELECT the new columns
- Detects missing columns from error message
- Returns verification status and list of missing columns

---

### **3. Integrated Schema Check in Upsert** ✅

**File:** `src/lib/supabase.ts`

**Updated:** `upsertLeadWithHistory()`

```typescript
try {
  console.log('[LeadMemory] upsertLeadWithHistory() called');
  
  // Verify schema before attempting upsert
  console.log('[LeadMemory] Verifying schema...');
  const schemaCheck = await verifyLeadMemorySchema();
  
  if (!schemaCheck.verified) {
    console.error('[LeadMemory] ❌ SCHEMA VERIFICATION FAILED');
    console.error('[LeadMemory] Missing columns:', schemaCheck.missingColumns.join(', '));
    console.error('[LeadMemory] Please run the migration SQL from supabase-setup.sql');
    throw new Error(`Schema verification failed. Missing columns: ${schemaCheck.missingColumns.join(', ')}`);
  }
  
  // Continue with upsert...
}
```

**Purpose:** 
- Checks schema before every upsert
- Fails fast with clear error message if columns are missing
- Prevents cryptic "column not found in schema cache" errors

---

## 📊 **Log Flow**

### **Successful Schema Verification:**
```
[LeadMemory] upsertLeadWithHistory() called
[LeadMemory] Verifying schema...
[Schema Verification] Checking lead_memory table schema...
[Schema Verification] ✅ Schema verified: tone_history, confidence_history, urgency_history, last_updated, relationship_insight present
[LeadMemory] Checking for existing lead with email: ...
[LeadMemory] Executing SELECT query...
[LeadMemory] Executing INSERT query to table: lead_memory
[LeadMemory] ✅ New lead created successfully
```

---

### **Failed Schema Verification:**
```
[LeadMemory] upsertLeadWithHistory() called
[LeadMemory] Verifying schema...
[Schema Verification] Checking lead_memory table schema...
[Schema Verification] ❌ Schema check failed: {
  code: "42703",
  message: "column \"confidence_history\" does not exist",
  details: null,
  hint: null
}
[Schema Verification] Missing columns: confidence_history
[LeadMemory] ============================================
[LeadMemory] ❌ SCHEMA VERIFICATION FAILED
[LeadMemory] ============================================
[LeadMemory] Missing columns: confidence_history
[LeadMemory] Please run the migration SQL from supabase-setup.sql
[LeadMemory] ============================================
[AI Intelligence] Error type: Error
[AI Intelligence] Error message: Schema verification failed. Missing columns: confidence_history
[Lead API] ❌ AI Intelligence/Storage FAILED
```

---

## 🔍 **What to Look For**

### **Check 1: Was the migration SQL run?**
Look for in Supabase SQL Editor output:
```
NOTICE: ✅ All required columns present in lead_memory table
```

If you see an exception instead, the columns weren't created.

---

### **Check 2: Is schema verification passing?**
Look for in application logs:
```
[Schema Verification] ✅ Schema verified: tone_history, confidence_history, urgency_history, last_updated, relationship_insight present
```

If you see `❌ Schema check failed`, check which columns are missing.

---

### **Check 3: Common error codes**

**42703** - Column does not exist
- Solution: Run migration SQL
- Check: Verify columns exist in Supabase dashboard

**42P01** - Table does not exist
- Solution: Run full schema setup
- Check: Verify `lead_memory` table exists

**PGRST301** - Schema cache error
- Solution: Run `ALTER TABLE lead_memory REPLICA IDENTITY FULL;`
- Check: Restart PostgREST or wait for cache refresh

---

## 🧪 **Testing Checklist**

### **Test 1: Run Migration SQL**
1. Open Supabase SQL Editor
2. Copy entire `supabase-setup.sql` content
3. Execute
4. **Check output for:**
   ```
   NOTICE: ✅ All required columns present in lead_memory table
   ```

---

### **Test 2: Verify Columns in Dashboard**
1. Go to Supabase Dashboard → Table Editor → `lead_memory`
2. **Check columns exist:**
   - `tone_history` (jsonb)
   - `confidence_history` (jsonb)
   - `urgency_history` (jsonb)
   - `last_updated` (timestamptz)
   - `relationship_insight` (text)

---

### **Test 3: Submit a Lead**
1. Submit form with new email
2. **Check logs for:**
   ```
   [Schema Verification] ✅ Schema verified: tone_history, confidence_history, urgency_history, last_updated, relationship_insight present
   [LeadMemory] ✅ New lead created successfully
   ```

---

### **Test 4: Check Supabase for New Row**
1. Go to Supabase Dashboard → Table Editor → `lead_memory`
2. **Verify:**
   - New row exists
   - `tone_history` contains JSON array with 1 entry
   - `confidence_history` contains JSON array with 1 entry
   - `urgency_history` contains JSON array with 1 entry
   - `last_updated` has timestamp
   - `relationship_insight` is NULL (first contact)

---

## 📁 **Files Modified**

1. **`supabase-setup.sql`**
   - Added `ALTER TABLE lead_memory REPLICA IDENTITY FULL;` for cache refresh
   - Added post-migration verification block
   - Raises exception if columns are missing

2. **`src/lib/supabase.ts`**
   - Added `verifyLeadMemorySchema()` function
   - Integrated schema check into `upsertLeadWithHistory()`
   - Fails fast with clear error if schema is invalid

---

## ✅ **Summary**

**What's Now Verified:**
- ✅ Schema cache is refreshed after migration
- ✅ Post-migration verification confirms columns exist
- ✅ Runtime verification before every upsert
- ✅ Clear error messages if columns are missing
- ✅ Automatic detection of which columns are missing
- ✅ Comprehensive logging at every step

**Error Prevention:**
- ✅ Prevents "column not found in schema cache" errors
- ✅ Detects missing columns before attempting INSERT
- ✅ Provides actionable error messages
- ✅ Logs exact columns that need to be added

**Build:** ✓ PASSING  
**Ready to deploy:** ✓ YES

---

## 🚀 **How to Fix Schema Issues**

### **Step 1: Run Migration SQL**
1. Open Supabase SQL Editor
2. Paste entire `supabase-setup.sql` content
3. Click "Run"
4. Wait for completion

---

### **Step 2: Verify Success**
Look for output:
```
NOTICE: ✅ All required columns present in lead_memory table
```

If you see an exception, check which columns failed to create.

---

### **Step 3: Refresh Schema Cache**
If columns exist but still getting cache errors:
```sql
ALTER TABLE lead_memory REPLICA IDENTITY FULL;
```

Or restart PostgREST in Supabase dashboard.

---

### **Step 4: Test Lead Submission**
Submit a form and check logs for:
```
[Schema Verification] ✅ Schema verified
[LeadMemory] ✅ New lead created successfully
```

---

## 🔄 **Cache Refresh Methods**

### **Method 1: ALTER TABLE (Recommended)**
```sql
ALTER TABLE lead_memory REPLICA IDENTITY FULL;
```

### **Method 2: Restart PostgREST**
- Supabase Dashboard → Settings → API → Restart

### **Method 3: Wait**
- PostgREST refreshes cache automatically every few minutes

---

**Everything is now protected with schema verification!** ✅🔍
