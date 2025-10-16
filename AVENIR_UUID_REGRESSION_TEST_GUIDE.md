# 🧪 Avenir AI Solutions Internal UUID Regression Test

## 📋 Overview

**Purpose:**  
Comprehensive end-to-end regression test to verify the internal client UUID (`00000000-0000-0000-0000-000000000001`) is correctly applied throughout the Avenir AI Solutions lead pipeline.

**Test Script:** `tests/test-avenir-internal-uuid-regression.sh`

---

## 🎯 What This Test Validates

### **1. Domain-Based Lead Routing ✅**
- New leads from `aveniraisolutions.ca/en` automatically get internal UUID
- New leads from `aveniraisolutions.ca/fr` automatically get internal UUID
- Domain detection works for all variations (www., staging., etc.)

### **2. Database Integrity ✅**
- `lead_memory` table stores correct `client_id`
- `lead_actions` table links leads with correct `client_id`
- Foreign key relationships maintained

### **3. Retroactive Assignment ✅**
- Existing leads with `client_id = NULL` automatically updated on resubmit
- Old leads with `client_id = 'avenir-internal-client'` corrected to UUID
- No data loss during migration

### **4. Admin Dashboard Compatibility ✅**
- Avenir AI Solutions appears in clients table with `is_internal = true`
- Leads can be filtered by internal UUID
- Command Center correctly displays Avenir leads

### **5. Core Features Still Work ✅**
- Relationship insights generated normally
- Lead conversion actions succeed
- Lead reversion actions succeed
- All features compatible with UUID format

---

## 🚀 How to Run

### **Prerequisites**

1. **Environment Variables:**
   ```bash
   # Required in .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Dependencies:**
   - `curl` (for API requests)
   - `jq` (for JSON parsing)

3. **Production Access:**
   - Tests run against production: `https://www.aveniraisolutions.ca`
   - Requires active deployment

---

### **Run Full Test Suite**

```bash
cd /Users/michaeloni/ai-growth-infrastructure
./tests/test-avenir-internal-uuid-regression.sh
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════════╗
║   Avenir AI Solutions Internal UUID Regression Test           ║
║   Internal UUID: 00000000-0000-0000-0000-000000000001         ║
╚════════════════════════════════════════════════════════════════╝

Base URL: https://www.aveniraisolutions.ca
Internal UUID: 00000000-0000-0000-0000-000000000001
Test Suffix: 1729095000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST 1: New Lead Submission from aveniraisolutions.ca (EN)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ PASS | Test 1.1: English lead created
   Details: Lead ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890

...

╔════════════════════════════════════════════════════════════════╗
║  🎉 ALL TESTS PASSED! Internal UUID Pipeline Verified ✅      ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 📊 Test Coverage

### **Test 1: New Lead Submission (English)**
- **Action:** Submit lead from `/en` with Avenir domain
- **Verification:**
  - HTTP 200/201 response
  - Lead ID returned
  - `lead_memory.client_id = '00000000-0000-0000-0000-000000000001'`

### **Test 2: New Lead Submission (French)**
- **Action:** Submit lead from `/fr` with Avenir domain
- **Verification:**
  - HTTP 200/201 response
  - Lead ID returned
  - `lead_memory.client_id = '00000000-0000-0000-0000-000000000001'`

### **Test 3: lead_memory Verification**
- **Action:** Query Supabase `lead_memory` table directly
- **Verification:**
  - EN lead has correct UUID
  - FR lead has correct UUID
  - No NULL or old string values

### **Test 4: lead_actions Verification**
- **Action:** Query Supabase `lead_actions` table
- **Verification:**
  - EN lead has `lead_actions` entry with internal UUID
  - FR lead has `lead_actions` entry with internal UUID
  - Action type = 'insert', tag = 'New Lead'

### **Test 5: Retroactive Assignment (NULL → UUID)**
- **Action:**
  1. Manually create lead with `client_id = NULL`
  2. Resubmit from Avenir domain
- **Verification:**
  - `client_id` updated to `'00000000-0000-0000-0000-000000000001'`
  - No data loss
  - Relationship history preserved

### **Test 6: Retroactive Correction (Old String → UUID)**
- **Action:**
  1. Manually create lead with `client_id = 'avenir-internal-client'`
  2. Resubmit from Avenir domain
- **Verification:**
  - `client_id` corrected to UUID
  - No data loss
  - Relationship history preserved

### **Test 7: Admin Dashboard - Client List**
- **Action:** Query `clients` table for Avenir
- **Verification:**
  - `client_id = '00000000-0000-0000-0000-000000000001'`
  - `business_name = 'Avenir AI Solutions'`
  - `is_internal = true`

### **Test 8: Lead Filtering by UUID**
- **Action:** Query `lead_actions` filtered by internal UUID
- **Verification:**
  - Multiple leads returned
  - EN and FR test leads appear in results
  - All have correct `client_id`

### **Test 9: Relationship Insights**
- **Action:** Check if leads have `relationship_insight` field populated
- **Verification:**
  - Insights generated successfully
  - Not NULL or empty
  - Appropriate for lead context

### **Test 10: Lead Conversion**
- **Action:** Tag EN test lead as "Converted"
- **Verification:**
  - HTTP 200/201 response
  - `lead_actions` entry created with `tag = 'Converted'`
  - `conversion_outcome = true`

### **Test 11: Lead Reversion**
- **Action:** Revert converted lead back to "Active"
- **Verification:**
  - HTTP 200/201 response
  - `lead_actions` entry created with `tag = 'Active'`
  - `reversion_reason` logged
  - `conversion_outcome = false`

---

## 📝 Test Output Files

### **Console Output**
- Color-coded pass/fail indicators
- Real-time test progress
- Detailed error messages

### **Markdown Report**
**File:** `AVENIR_INTERNAL_UUID_TEST_RESULTS.md`

**Contents:**
- Test date and configuration
- Summary statistics (pass/fail counts)
- Detailed results for each test
- Overall pass/fail status

**Example:**
```markdown
# Avenir AI Solutions Internal UUID Regression Test Results

**Test Date:** Thu Oct 16 2025 15:30:00  
**Internal UUID:** `00000000-0000-0000-0000-000000000001`  
**Pass Rate:** 100%

## 📊 Summary

- **Total Tests:** 18
- **Passed:** 18 ✅
- **Failed:** 0 ❌

## 📋 Detailed Results

### ✅ Test 1.1: English lead created
**Details:** Lead ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890

...
```

---

## 🔍 Troubleshooting

### **"Missing Supabase credentials" Error**

**Cause:** `.env.local` not loaded or missing variables

**Fix:**
```bash
# Verify .env.local exists
cat .env.local

# Check for required variables
grep NEXT_PUBLIC_SUPABASE_URL .env.local
grep SUPABASE_SERVICE_ROLE_KEY .env.local
```

---

### **"jq: command not found" Error**

**Cause:** JSON parser not installed

**Fix:**
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

---

### **Tests Fail with "404" or "500" Errors**

**Cause:** Production site not deployed or endpoints changed

**Fix:**
1. Verify deployment: `curl -I https://www.aveniraisolutions.ca`
2. Check API routes exist: `curl -I https://www.aveniraisolutions.ca/api/lead`
3. Review Vercel deployment logs

---

### **Database Queries Return Empty Results**

**Cause:** Test leads not yet indexed or database delay

**Fix:**
- Wait 5-10 seconds between creation and verification
- Script includes `sleep 2` between tests (increase if needed)
- Check Supabase dashboard for recent inserts

---

## ✅ Success Criteria

**All tests pass if:**

1. ✅ New leads from `aveniraisolutions.ca` (EN + FR) have internal UUID
2. ✅ `lead_memory.client_id = '00000000-0000-0000-0000-000000000001'`
3. ✅ `lead_actions` entries created with correct UUID
4. ✅ NULL client_ids retroactively updated
5. ✅ Old string format corrected to UUID
6. ✅ Avenir AI Solutions in clients table with `is_internal = true`
7. ✅ Leads filterable by internal UUID
8. ✅ Relationship insights generated
9. ✅ Conversion actions work
10. ✅ Reversion actions work

---

## 📊 Expected Results

**Pass Rate:** 100% (18/18 tests)

**Test Duration:** ~45 seconds

**Sample Output:**
```
Total Tests: 18
Passed: 18 ✅
Failed: 0 ❌

╔════════════════════════════════════════════════════════════════╗
║  🎉 ALL TESTS PASSED! Internal UUID Pipeline Verified ✅      ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 🔄 Continuous Testing

### **When to Run This Test**

1. **After Deployment:**
   - Verify UUID migration deployed correctly
   - Confirm no regression from previous version

2. **Before Major Releases:**
   - Validate core functionality intact
   - Ensure database schema compatible

3. **After Schema Changes:**
   - Verify foreign key constraints
   - Confirm data integrity maintained

4. **Monthly Health Check:**
   - Validate production data quality
   - Detect any UUID inconsistencies

---

### **Automated Testing (Optional)**

**GitHub Actions Workflow:**
```yaml
name: Avenir UUID Regression Test

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday 2 AM

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install jq
        run: sudo apt-get install -y jq
      - name: Run regression test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: ./tests/test-avenir-internal-uuid-regression.sh
```

---

## 📁 Files

| File | Purpose |
|------|---------|
| `tests/test-avenir-internal-uuid-regression.sh` | Main test script |
| `AVENIR_INTERNAL_UUID_TEST_RESULTS.md` | Generated report |
| `AVENIR_UUID_REGRESSION_TEST_GUIDE.md` | This documentation |

---

## ✅ Summary

**Test Suite:** Comprehensive UUID migration regression test  
**Coverage:** 11 major test areas, 18 individual checks  
**Duration:** ~45 seconds  
**Pass Criteria:** 100% pass rate required  

**Purpose:**
- ✅ Validate internal UUID applied correctly
- ✅ Verify retroactive migration logic
- ✅ Confirm database integrity
- ✅ Ensure core features still work
- ✅ Detect regressions early

**Status:** ✅ Ready to run

---

**Generated:** October 16, 2025  
**Test Version:** 1.0  
**Internal UUID:** `00000000-0000-0000-0000-000000000001`

