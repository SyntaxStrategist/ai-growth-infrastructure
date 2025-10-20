# Post-Outage Execution Plan

**Date**: October 20, 2025  
**Status**: ⏳ Waiting for Supabase us-east-1 restoration  
**Priority**: Execute immediately upon service restoration

---

## 🚨 Critical Actions (Execute First)

### 1. **Environment Variable Fix** (CRITICAL - 2 minutes)
```bash
# Set SUPABASE_SERVICE_ROLE_KEY in Vercel
# Go to: Vercel Dashboard → Project → Settings → Environment Variables
# Add: SUPABASE_SERVICE_ROLE_KEY = [your-service-role-key]
# Environment: Production, Preview, Development (all)
# Then redeploy
```

### 2. **Verify Service Restoration** (1 minute)
```bash
# Test basic Supabase connectivity
curl -X GET "https://www.aveniraisolutions.ca/api/client/auth" \
  -H "Content-Type: application/json" \
  -d '{"email":"test-client@aveniraisolutions.ca","password":"TestClient2025!"}'
```

### 3. **Re-test Lead Creation** (2 minutes)
```bash
# Run minimal lead test
node minimal-lead-test.js
```

---

## ✅ Code Status (No Changes Needed)

### 4. **All API Routes Already Correct** (0 minutes)
```bash
# ✅ All API routes are already using service role key only
# ✅ No code changes needed
# ✅ Ready for immediate testing after environment variable is set
```

### 5. **Redeploy Application** (3 minutes)
```bash
# After setting environment variable, redeploy to Vercel
# This ensures the SUPABASE_SERVICE_ROLE_KEY is available
```

---

## 🧪 Verification Tests (Execute After Deployment)

### 6. **Re-create Test Client and Leads** (5 minutes)
```bash
# Run the full test client creation script
node test-create-client.js
```

### 7. **Verify Dashboard Functionality** (3 minutes)
```bash
# Check database state
node check-database-state.js
```

### 8. **Test Both Language Dashboards** (2 minutes)
```bash
# Manual verification:
# - English: https://www.aveniraisolutions.ca/en/client/dashboard
# - French: https://www.aveniraisolutions.ca/fr/client/dashboard
# Login: test-client@aveniraisolutions.ca / TestClient2025!
```

---

## 🧹 Cleanup (Execute After Verification)

### 9. **Remove Diagnostic Scripts** (1 minute)
```bash
# Clean up temporary files
rm -f audit-lead-linkage.js check-database-state.js backfill-lead-actions.js
rm -f debug-upsert.js test-supabase.js minimal-lead-test.js
```

### 10. **Final Verification** (2 minutes)
```bash
# Confirm all 12 leads visible in dashboard
# Confirm Prospect Intelligence scoring works
# Confirm Relationship Insights detect repeat customers
# Confirm translation works for both locales
# Confirm no email outreach buttons for clients
```

---

## 📋 Expected Results

After successful execution:
- ✅ 12 leads visible in dashboard (10 unique + 2 repeats)
- ✅ Prospect Intelligence scoring functional
- ✅ Relationship Insights working
- ✅ English/French translation working
- ✅ No email outreach buttons for clients
- ✅ All API routes using service role key
- ✅ Clean codebase (no diagnostic scripts)

---

## ⚠️ Rollback Plan (If Issues Occur)

If any step fails:
1. **Revert environment variable** (remove SUPABASE_SERVICE_ROLE_KEY)
2. **Revert code changes** (git revert)
3. **Redeploy** to restore previous state
4. **Investigate** specific failure point

---

## 📞 Test Client Credentials

**Email**: test-client@aveniraisolutions.ca  
**Password**: TestClient2025!  
**Client ID**: a8c89837-7e45-44a4-a367-6010df87a723  
**API Key**: client_b80d6d19192b3144fdd663d5a88928bf

---

## 🎯 Execution Order Summary

1. **Set SUPABASE_SERVICE_ROLE_KEY in Vercel** ⚡ (CRITICAL)
2. **Redeploy application** ⚡ (CRITICAL)
3. **Test basic connectivity** ✅
4. **Re-create test client** 🧪
5. **Verify dashboard** 🧪
6. **Test both languages** 🧪
7. **Clean up scripts** 🧹
8. **Final verification** ✅

**Total Estimated Time**: 15-20 minutes

---

**Status**: ⏳ **READY TO EXECUTE** - Awaiting Supabase service restoration confirmation
