# 🔍 Intelligence Engine - Maximum Debugging Mode

## 🎯 **CRITICAL: What You'll See Now**

The engine now logs **EVERYTHING** about the INSERT operation.

---

## 📊 **Complete Console Output**

When you run `/api/intelligence-engine`, you'll see:

```
[Engine] ============================================
[Engine] Starting weekly intelligence analysis...
[Engine] ============================================
[Engine] Analysis period: { start: ..., end: ..., days: 7 }
[Engine] -------- Global Analysis --------
[Engine] Analyzing leads for client: global
[Engine] Period: ...
[Engine] Executing Supabase query (with time range filter)...
[Engine] Initial query response: { rowCount: 1, error: 'none' }
[Engine] Filtered leads: 1 → 1 (removed archived/deleted)
[Engine] Fetched leads: 1
[Engine] Sample lead IDs: ['lead_1760462469775_asygrt3he']
[Engine] Sample lead data: [{ id: '...', intent: '...', tone: '...', urgency: '...', confidence: 0.85 }]
[Engine] Starting metrics calculation...
[Engine] Top intents calculated: 1
[Engine] Analysis complete: { total_leads: 1, ... }
[Engine] Global insights generated: { total_leads: 1, avg_confidence: 0.85, engagement_score: 63.75 }

>>> CRITICAL SECTION - INSERT <<<
[Engine] ============================================
[Engine] Storing insights to growth_brain table...
[Engine] ============================================
[Engine] Validating data types...
[Engine] client_id type: object | value: null
[Engine] total_leads type: number | value: 1
[Engine] period_start type: string | value: 2025-10-08T...
[Engine] period_end type: string | value: 2025-10-15T...
[Engine] avg_confidence type: number | value: 0.85
[Engine] engagement_score type: number | value: 63.75
[Engine] urgency_trend_percentage type: number | value: 15.5
[Engine] tone_sentiment_score type: number | value: 75.0
[Engine] top_intents: array[1]
[Engine] urgency_distribution: object
[Engine] tone_distribution: array[1]
[Engine] confidence_trajectory: array[1]
[Engine] language_ratio: object
[Engine] predictive_insights: object
[Engine] Has undefined values: false
[Engine] Has NaN values: false
[Engine] Executing INSERT into growth_brain...

>>> THIS LINE SHOWS IF IT WORKED <<<
[Engine] ============================================
[Engine] INSERT Result (took XXX ms):
[Engine] ============================================
[Engine] Success: true/false
[Engine] Data returned: YES/NO
[Engine] Error: YES/NO

If Error = YES, you'll see:
  ↓

[Engine] ❌ INSERT FAILED
[Engine] ============================================
[Engine] PostgreSQL Error Code: 42P01
[Engine] Error Message: relation "growth_brain" does not exist
[Engine] Error Hint: Create the table first
[Engine] Error Details: ...
[Engine] ============================================
[Engine] Full Supabase error object:
{
  "code": "42P01",
  "message": "relation 'growth_brain' does not exist",
  "details": "...",
  "hint": "..."
}
[Engine] ============================================
[Engine] Data that failed to insert:
{
  "client_id": null,
  "analysis_period_start": "...",
  ... (full object)
}
[Engine] ============================================

>>> THIS TELLS YOU EXACTLY WHAT TO FIX <<<
```

---

## 🔍 **Error Code Reference**

### **42P01 - Table Doesn't Exist**
```
[Engine] Error Code: 42P01
[Engine] Error Message: relation "growth_brain" does not exist
```

**Fix:** Run `supabase-setup.sql` to create the table

---

### **42703 - Column Doesn't Exist**
```
[Engine] Error Code: 42703
[Engine] Error Message: column "some_field" of relation "growth_brain" does not exist
```

**Fix:** Check schema - the column name in the code doesn't match the table

---

### **23502 - NULL Violation**
```
[Engine] Error Code: 23502
[Engine] Error Message: null value in column "analysis_period_start" violates not-null constraint
```

**Fix:** A required field is NULL - check the insights object

---

### **42804 - Type Mismatch**
```
[Engine] Error Code: 42804
[Engine] Error Message: column "avg_confidence" is of type numeric but expression is of type text
```

**Fix:** Data type mismatch - check the value type being inserted

---

### **42501 - RLS Policy**
```
[Engine] Error Code: 42501
[Engine] Error Message: new row violates row-level security policy
```

**Fix:** Service role doesn't have permission - create RLS policy

---

## 🧪 **What to Do**

### **Step 1: Run the Endpoint**
```bash
curl http://localhost:3000/api/intelligence-engine
```

### **Step 2: Copy the ENTIRE Console Output**

Look specifically for these sections:
```
[Engine] Initial query response: { rowCount: X, ... }
[Engine] Filtered leads: X → Y
[Engine] Fetched leads: Y
[Engine] Sample lead data: [...]
[Engine] Has undefined values: true/false
[Engine] Has NaN values: true/false
[Engine] INSERT Result: ...
[Engine] PostgreSQL Error Code: XXXXX
[Engine] Error Message: (exact error)
```

### **Step 3: Share the Error Details**

The logs will show:
- **Error Code** (e.g., 42P01, 23502, 42703)
- **Error Message** (exact problem)
- **Error Hint** (suggested fix)
- **Full data object** (what failed to insert)

This will tell us **EXACTLY** what's wrong!

---

## 🎯 **Key Log Lines to Check**

1. **Lead Count:**
   ```
   [Engine] Fetched leads: X
   ```
   If X = 0 → No leads in period, check timestamps

2. **Sample Data:**
   ```
   [Engine] Sample lead data: [{ ... }]
   ```
   Verify intent, tone, urgency aren't NULL

3. **Data Validation:**
   ```
   [Engine] Has undefined values: false
   [Engine] Has NaN values: false
   ```
   If true → Data integrity issue

4. **INSERT Success:**
   ```
   [Engine] Success: true
   ```
   If false → Check error code and message

5. **Error Code:**
   ```
   [Engine] PostgreSQL Error Code: XXXXX
   ```
   This tells you the exact problem category

---

## ✅ **What's Been Added**

**Maximum logging:**
- ✅ Data type validation for every field
- ✅ Array length logging
- ✅ Undefined/NaN detection
- ✅ Complete insights object (full JSON)
- ✅ INSERT timing (duration in ms)
- ✅ PostgreSQL error code
- ✅ Error message, hint, details
- ✅ Full Supabase error object
- ✅ Data that failed to insert

**The logs will show you:**
- Which field has wrong type
- Which field is NULL when it shouldn't be
- Whether the table exists
- Whether RLS is blocking
- Exact PostgreSQL error code

---

## 🚀 **Next Action**

**Run the endpoint and paste the console output!**

The enhanced logging will reveal the **exact** error:
- Error code
- Error message
- Which field is problematic
- What value it's trying to insert

**No more mysteries - maximum transparency!** 🔍✨
