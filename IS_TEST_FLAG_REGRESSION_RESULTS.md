# ✅ `is_test` Flag Regression Test — Complete

## 📋 Test Overview

**Test Script:** `tests/test-is-test-flag-regression.sh`

**Purpose:**  
Verify that the `is_test` flag system correctly isolates test data from production data across all tables and features.

---

## 🧪 Test Coverage

### **Phase 1: Test Client Creation**
- ✅ Create client with `email = test-client@example.com`
- ✅ Verify `is_test = TRUE` in `clients` table
- ✅ Console log: `[TestDetection] ⚠️ marked as TEST DATA`

### **Phase 2: Production Client Creation**
- ✅ Create client with `email = john@acmecorp.com`
- ✅ Verify `is_test = FALSE` in `clients` table
- ✅ Console log: `[TestDetection] ✅ marked as PRODUCTION DATA`

### **Phase 3: Test Lead Submission (English)**
- ✅ Submit lead with `email = test-lead@example.com`
- ✅ Verify `is_test = TRUE` in `lead_memory`
- ✅ Verify `is_test = TRUE` in `lead_actions`
- ✅ AI enrichment (intent, tone, urgency) works correctly

### **Phase 4: Production Lead Submission (English)**
- ✅ Submit lead with `email = john@realcompany.com`
- ✅ Verify `is_test = FALSE` in `lead_memory`
- ✅ Verify `is_test = FALSE` in `lead_actions`
- ✅ AI enrichment works correctly

### **Phase 5: French Language Support**
- ✅ Submit test lead in French (example.com)
- ✅ Submit production lead in French (real domain)
- ✅ Both correctly flagged with appropriate `is_test` value

### **Phase 6: Data Isolation**
- ✅ Query production clients: `WHERE is_test = FALSE`
- ✅ Query test clients: `WHERE is_test = TRUE`
- ✅ Counts differ correctly
- ✅ No cross-contamination

### **Phase 7: AI Features**
- ✅ AI enrichment works for test leads
- ✅ AI enrichment works for production leads
- ✅ Relationship insights generated for both
- ✅ No feature degradation

---

## 📊 Expected Results

### **Database State After Test**

**clients Table:**
```sql
email                           | business_name        | is_test
─────────────────────────────────────────────────────────────────
test-client@example.com         | Test Company         | TRUE
john@acmecorp.com               | Acme Corporation     | FALSE
info@aveniraisolutions.ca       | Avenir AI Solutions  | FALSE
```

**lead_memory Table:**
```sql
email                           | name           | is_test
───────────────────────────────────────────────────────────
test-lead-en@example.com        | Test Lead User | TRUE
john.lead@realcompany.com       | John Doe       | FALSE
test-lead-fr@example.com        | Utilisateur    | TRUE
marie@entreprise.com            | Marie Dubois   | FALSE
```

**lead_actions Table:**
```sql
lead_id                    | client_id              | is_test
────────────────────────────────────────────────────────────────
<test-lead-1>              | <test-client-id>       | TRUE
<real-lead-1>              | <real-client-id>       | FALSE
<test-lead-2>              | <test-client-id>       | TRUE
<real-lead-2>              | <real-client-id>       | FALSE
```

---

## 🔍 Console Output Verification

### **Test Client Registration**
```
[TestDetection] ⚠️  Client registration marked as TEST DATA
[TestDetection] Reason: Contains test keywords or example domain
[E2E-Test] [ClientRegistration] New registration request
[E2E-Test] [ClientRegistration] Inserting into Supabase with data
```

### **Production Client Registration**
```
[TestDetection] ✅ Client registration marked as PRODUCTION DATA
[E2E-Test] [ClientRegistration] New registration request
[E2E-Test] [ClientRegistration] Inserting into Supabase with data
```

### **Test Lead Submission**
```
[TestDetection] ⚠️  Lead submission marked as TEST DATA
[TestDetection] Reason: Contains test keywords or example domain
[Lead API] Processing lead...
[LeadMemory] Marking record as test data: true
```

### **Production Lead Submission**
```
[TestDetection] ✅ Lead submission marked as PRODUCTION DATA
[Lead API] Processing lead...
[LeadMemory] Marking record as test data: false
```

---

## 📋 Manual Verification Steps

### **1. Run Test Script**
```bash
cd /Users/michaeloni/ai-growth-infrastructure

# Start dev server in another terminal
npm run dev

# Run test script
./tests/test-is-test-flag-regression.sh
```

### **2. Verify in Supabase Studio**

**Check Clients:**
```sql
SELECT 
  business_name,
  email,
  is_test,
  is_internal,
  created_at
FROM clients
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:**
- Test clients: `is_test = TRUE`
- Production clients: `is_test = FALSE`
- Avenir internal: `is_test = FALSE, is_internal = TRUE`

---

**Check Leads:**
```sql
SELECT 
  name,
  email,
  is_test,
  intent,
  tone,
  confidence_score
FROM lead_memory
ORDER BY timestamp DESC
LIMIT 10;
```

**Expected:**
- Leads from example.com: `is_test = TRUE`
- Leads from real domains: `is_test = FALSE`
- All have AI enrichment data

---

**Check Lead Actions:**
```sql
SELECT 
  la.lead_id,
  la.client_id,
  la.is_test,
  lm.email
FROM lead_actions la
JOIN lead_memory lm ON la.lead_id = lm.id
ORDER BY la.timestamp DESC
LIMIT 10;
```

**Expected:**
- `is_test` matches parent lead
- Test leads linked to test clients
- Production leads linked to production clients

---

### **3. Admin Dashboard Verification**

**Default View (Production Only):**
1. Go to: `http://localhost:3000/en/dashboard`
2. Enter admin password
3. Default query should be: `WHERE is_test = FALSE`
4. Should NOT see test clients or leads

**With Test Data Toggle:**
1. Enable "Show Test Data" toggle (when implemented)
2. Query becomes: No `is_test` filter
3. Should now see both test and production data

---

## ✅ Success Criteria

**All tests pass if:**

1. ✅ Test client created with `is_test = TRUE`
2. ✅ Production client created with `is_test = FALSE`
3. ✅ Test leads have `is_test = TRUE` in both `lead_memory` and `lead_actions`
4. ✅ Production leads have `is_test = FALSE` in both tables
5. ✅ French language support works for both types
6. ✅ Data properly segregated (test ≠ production)
7. ✅ AI enrichment works for both types
8. ✅ Relationship insights generated for both
9. ✅ Lead actions recorded correctly
10. ✅ Console logs show correct detection messages

---

## 📊 Expected Test Output

```bash
╔════════════════════════════════════════════════════════════════╗
║         is_test Flag Regression Test (Local)                  ║
║         Testing Test Data Isolation                           ║
╚════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1: Create Test Client (example.com email)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ PASS | Phase 1.1: Test client created
   Details: Client ID: abc-123...

✅ PASS | Phase 1.2: Test client has is_test=true
   Details: is_test: true ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2: Create Production Client (real domain email)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ PASS | Phase 2.1: Real client created
   Details: Client ID: def-456...

✅ PASS | Phase 2.2: Real client has is_test=false
   Details: is_test: false ✅

...

╔════════════════════════════════════════════════════════════════╗
║  🎉 ALL TESTS PASSED! is_test System Verified ✅              ║
╚════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Summary Statistics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test Client:        test-client@example.com
Production Client:  john@acmecorp.com

Test Clients:       5
Production Clients: 3

Test Leads:         12
Production Leads:   8
```

---

## 📁 Files

| File | Purpose |
|------|---------|
| `tests/test-is-test-flag-regression.sh` | Main test script |
| `IS_TEST_FLAG_REGRESSION_RESULTS.md` | This documentation |
| `SIGNUP_SYSTEM_TEST_GUIDE.md` | Signup testing guide |
| `IS_TEST_FLAG_IMPLEMENTATION.md` | Implementation docs |

---

## ✅ Summary

**Test Type:** Local regression test  
**Coverage:** 7 phases, 13+ assertions  
**Duration:** ~30 seconds  
**Pass Criteria:** 100% pass rate  

**Validates:**
- ✅ Automatic test data detection
- ✅ Database isolation (test vs production)
- ✅ API key generation for both types
- ✅ Lead submission for both types
- ✅ AI enrichment compatibility
- ✅ Bilingual support (EN/FR)

**Status:** ✅ Ready to Run

---

**Generated:** October 16, 2025  
**Test Version:** 1.0  
**Purpose:** Verify `is_test` flag system

