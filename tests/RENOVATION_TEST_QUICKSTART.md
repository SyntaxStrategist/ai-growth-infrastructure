# 🏗️ Renovation Pipeline Test — Quick Start

## TL;DR

Run a full end-to-end test simulating a bilingual renovation company using Avenir AI Solutions.

```bash
cd /Users/michaeloni/ai-growth-infrastructure/tests
./test-renovation-pipeline.sh
```

Expected: **9/9 tests pass** ✅

---

## 🎯 What It Tests

### **Companies Created**
1. **Prime Reno Solutions** (EN) — 4 English leads
2. **Solutions RénovPrime** (FR) — 4 French leads

### **Test Leads (8 Total)**

**Hot Leads (4):**
- Jennifer Anderson — Kitchen reno (EN)
- Sarah Martinez — Full home reno (EN)
- Sophie Tremblay — Cuisine (FR)
- Catherine Gagnon — Toiture urgente (FR)

**Warm Leads (2):**
- Michael Thompson — Bathroom (EN)
- Jean-François Leblanc — Salle de bain (FR)

**Cold Leads (2):**
- Robert Wilson — Browsing (EN)
- Luc Bergeron — Exploration (FR)

### **Validates**
- ✅ Bilingual signup
- ✅ API key generation
- ✅ Lead submission (8 leads)
- ✅ AI processing (intent, tone, urgency)
- ✅ Client isolation
- ✅ Dashboard analytics
- ✅ Conversion tracking
- ✅ Reversion with reason
- ✅ Growth brain logging

---

## 📊 Expected Results

**Score:** 9/9 tests passed  
**Companies:** 2 created  
**Leads:** 8 submitted  
**AI Analysis:** Complete  
**Conversion:** 1 successful  
**Reversion:** 1 successful  

---

## 🧪 Quick Verification

**After running the test:**

1. **Admin Dashboard** (`/en/dashboard`)
   - Client Filter dropdown shows both companies
   - Select "Prime Reno Solutions" → see 4 English leads
   - Select "Solutions RénovPrime" → see 4 French leads
   - Metrics accurate for each client

2. **Client Dashboards**
   - EN: Login with `test-prime-reno-en@example.com`
   - FR: Login with `test-prime-reno-fr@example.com`
   - Each sees only their 4 leads
   - Analytics showing correct insights

3. **Growth Brain** (Supabase)
   - Query `growth_brain` table
   - Should see conversion + reversion events
   - Timestamps match test execution time

---

## 🗑️ Cleanup

**Remove test data:**
```sql
DELETE FROM clients 
WHERE email IN (
  'test-prime-reno-en@example.com',
  'test-prime-reno-fr@example.com'
);
```

---

**Full documentation:** `RENOVATION_PIPELINE_TEST.md`

**Run test:** `./test-renovation-pipeline.sh`

✅ Simple. Fast. Validates everything.

