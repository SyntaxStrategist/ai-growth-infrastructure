# 🚀 AI Memory System - Deployment Instructions

## 🎯 Current Issue

**Error:** "Could not find the 'confidence_history' column of 'lead_memory' in the schema cache"

**Cause:** New columns need to be added to Supabase and schema cache needs refresh.

---

## ✅ Fix (5 Minutes)

### **Step 1: Add Columns to Supabase** (2 min)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of: **`migration-add-history-columns.sql`**
4. Click **"Run"**
5. **Wait for success message:**
   ```
   ✅ SUCCESS: All history columns present in lead_memory
   Schema cache refreshed. Ready to accept leads!
   ```

---

### **Step 2: Verify Columns** (1 min)

1. Go to **Supabase Dashboard** → **Table Editor**
2. Select **`lead_memory`** table
3. **Scroll right** to see new columns:
   - ✅ `tone_history` (jsonb)
   - ✅ `confidence_history` (jsonb)
   - ✅ `urgency_history` (jsonb)
   - ✅ `last_updated` (timestamptz)
   - ✅ `relationship_insight` (text)

---

### **Step 3: Redeploy to Vercel** (2 min)

```bash
# Commit changes
git add .
git commit -m "Add AI memory system with comprehensive logging"

# Deploy to production
vercel --prod
```

---

### **Step 4: Test** (1 min)

1. Visit your deployed site
2. Submit a lead form
3. **Check Vercel logs** (Vercel Dashboard → Deployments → Latest → Functions → /api/lead)
4. **Look for:**
   ```
   [Schema Verification] ✅ Schema verified
   [LeadMemory] ✅ New lead created successfully
   ```

---

### **Step 5: Verify in Supabase** (1 min)

1. Go to **Supabase Dashboard** → **Table Editor** → **`lead_memory`**
2. **Check for new row** with:
   - `tone_history`: `[{"value": "professional", "timestamp": "2025-10-15T..."}]`
   - `confidence_history`: `[{"value": 0.85, "timestamp": "2025-10-15T..."}]`
   - `urgency_history`: `[{"value": "high", "timestamp": "2025-10-15T..."}]`
   - `last_updated`: Recent timestamp
   - `relationship_insight`: `null` (first contact)

---

## 📊 **What You'll See in Logs**

### **Success:**
```
[Lead API] POST /api/lead triggered
[Lead API] ✅ Validation passed
[AI Intelligence] ✅ Enrichment complete
[LeadMemory] Verifying schema...
[Schema Verification] ✅ Schema verified: tone_history, confidence_history, urgency_history, last_updated, relationship_insight present
[LeadMemory] No existing record found - creating new lead
[LeadMemory] Executing INSERT query to table: lead_memory
[LeadMemory] INSERT result: { success: true }
[LeadMemory] ✅ New lead created successfully
[AI Intelligence] ✅ New lead created: lead_1234567890_abc123
[Lead API] ✅ Lead processing COMPLETE
```

---

### **If Schema Still Missing:**
```
[LeadMemory] Verifying schema...
[Schema Verification] ❌ Schema check failed
[Schema Verification] Missing columns: confidence_history
[LeadMemory] ❌ SCHEMA VERIFICATION FAILED
[LeadMemory] Please run the migration SQL from supabase-setup.sql
```

**Action:** Run the migration SQL again and wait 5 minutes for cache refresh.

---

## 🔄 **Testing Historical Updates**

### **Test Returning Lead:**

1. Submit a form with email: `test@example.com`
2. **Check logs:**
   ```
   [LeadMemory] ✅ New lead created successfully
   ```

3. Submit **another form** with the **same email**: `test@example.com`
4. **Check logs:**
   ```
   [LeadMemory] Existing record found for email: test@example.com
   [LeadMemory] Updated tone history length: 2
   [LeadMemory] Updated confidence history length: 2
   [LeadMemory] Generated new relationship insight: Tone shifted from curious to confident — great time to follow up!
   [LeadMemory] ✅ Existing lead updated successfully
   [AI Intelligence] 📊 Relationship insight: Tone shifted from curious to confident — great time to follow up!
   ```

5. **Check Supabase:**
   - Same record (no duplicate)
   - `tone_history` has 2 entries
   - `relationship_insight` has generated text

---

## 🧠 **View Insights in Growth Copilot**

1. Visit `/en/dashboard` or `/fr/dashboard`
2. Click **"🧠 Growth Copilot"** button (top-right)
3. Click **"Generate Fresh Summary"**
4. **See new section:** "📈 Relationship Insights"
5. **Shows leads with insights:**
   ```
   Sophie Martin
   sophie@example.com
   💡 Tone shifted from hesitant to confident — great time to follow up!
   ```

---

## ✅ **Checklist**

Before deploying, ensure:
- ✅ Migration SQL executed in Supabase
- ✅ Success message received
- ✅ Columns visible in Table Editor
- ✅ Schema cache refreshed
- ✅ Code deployed to Vercel
- ✅ Test lead submitted successfully
- ✅ New row appears in Supabase with history arrays

---

## 📁 **Files to Use**

### **For Migration:**
- `migration-add-history-columns.sql` - Quick migration (recommended)
- `supabase-setup.sql` - Full setup (if starting fresh)

### **For Verification:**
Check these files were deployed:
- `src/lib/supabase.ts` - Schema verification function
- `src/app/api/lead/route.ts` - Enhanced logging
- `src/components/GrowthCopilot.tsx` - Relationship insights display

---

## 🎉 **Expected Results**

After fixing:
- ✅ Leads save to Supabase successfully
- ✅ No duplicate records (email-based upsert)
- ✅ History arrays track changes over time
- ✅ Relationship insights generated automatically
- ✅ Growth Copilot displays insights
- ✅ Full bilingual support (EN + FR)

**Everything will work perfectly after running the migration!** 🚀✨
