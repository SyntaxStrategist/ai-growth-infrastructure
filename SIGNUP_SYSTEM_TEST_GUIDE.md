# ✅ Client Signup System — Test Guide

## 🎯 What Was Fixed

### **1. API Route Validation (`/api/client/register`)**

**Issue:** Form was sending `businessName` and `contactName` (camelCase) but API expected `business_name` and `name` (snake_case).

**Fix:**
```typescript
// Now accepts both formats
const name = body.name || body.contactName;
const business_name = body.business_name || body.businessName;
```

**Result:**
- ✅ Frontend forms work (camelCase)
- ✅ Test scripts work (snake_case)
- ✅ Backward compatible

---

### **2. Signup Form Labels**

**Removed "(optional)" / "(optionnel)" from:**
- Lead Source Description
- Estimated Leads per Week
- Description de la source de leads
- Leads estimés par semaine

**Result:**
- ✅ Cleaner UI
- ✅ Fields remain non-required
- ✅ No validation changes

---

### **3. Test Data Detection**

**Automatic `is_test` flag:**
- ✅ Emails containing `@example.com`, `@test.com`, `@demo.com`
- ✅ Names containing "Test", "Demo", "Sample"
- ✅ Business names containing test keywords

**Result:**
- Test signups automatically marked with `is_test = true`
- Production signups remain `is_test = false`

---

## 🧪 Test URLs

### **Local Testing (Development Server)**

```bash
# Start local server
npm run dev
```

**English Signup:**
```
http://localhost:3000/en/client/signup
```

**French Signup:**
```
http://localhost:3000/fr/client/signup
```

---

### **Live Testing (Production)**

**English Signup:**
```
https://www.aveniraisolutions.ca/en/client/signup
```

**French Signup:**
```
https://www.aveniraisolutions.ca/fr/client/signup
```

---

## 📋 Test Scenarios

### **Test 1: Complete English Signup (Test Data)**

**URL:** `http://localhost:3000/en/client/signup` or `https://www.aveniraisolutions.ca/en/client/signup`

**Form Data:**
```
Business Name:           Test Company
Contact Name:            Test User
Email:                   test@example.com
Password:                TestPassword123!
Confirm Password:        TestPassword123!
Preferred Language:      English
Lead Source:             Testing signup form
Estimated Leads/Week:    10
```

**Expected Result:**
- ✅ Form submits successfully
- ✅ Success message appears
- ✅ Record in Supabase `clients` table with `is_test = TRUE`
- ✅ Console log: `[TestDetection] ⚠️  Client registration marked as TEST DATA`

**Verification Query:**
```sql
SELECT 
  business_name, 
  name, 
  email, 
  is_test, 
  client_id, 
  api_key
FROM clients
WHERE email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 1;

-- Expected: is_test = TRUE ✅
```

---

### **Test 2: Complete French Signup (Test Data)**

**URL:** `http://localhost:3000/fr/client/signup` or `https://www.aveniraisolutions.ca/fr/client/signup`

**Form Data:**
```
Nom de l'entreprise:                    Entreprise Test
Nom du contact:                         Utilisateur Test
Courriel:                               test-fr@example.com
Mot de passe:                           MotDePasse123!
Confirmer le mot de passe:              MotDePasse123!
Langue préférée:                        Français
Description de la source de leads:      Test du formulaire d'inscription
Leads estimés par semaine:              15
```

**Expected Result:**
- ✅ Form submits successfully
- ✅ French success message appears
- ✅ Record in Supabase with `is_test = TRUE`, `language = 'fr'`
- ✅ Console log: `[TestDetection] ⚠️  Client registration marked as TEST DATA`

**Verification Query:**
```sql
SELECT 
  business_name, 
  name, 
  email, 
  language,
  is_test
FROM clients
WHERE email = 'test-fr@example.com'
ORDER BY created_at DESC
LIMIT 1;

-- Expected: is_test = TRUE, language = 'fr' ✅
```

---

### **Test 3: Production Signup (Real Data)**

**URL:** Use live production URL only

**Form Data:**
```
Business Name:           Acme Corporation
Contact Name:            John Smith
Email:                   john.smith@acmecorp.com
Password:                SecurePassword123!
Confirm Password:        SecurePassword123!
Preferred Language:      English
Lead Source:             LinkedIn referral
Estimated Leads/Week:    25
```

**Expected Result:**
- ✅ Form submits successfully
- ✅ Success message appears
- ✅ Record in Supabase with `is_test = FALSE`
- ✅ Console log: `[TestDetection] ✅ Client registration marked as PRODUCTION DATA`

**Verification Query:**
```sql
SELECT 
  business_name, 
  name, 
  email, 
  is_test
FROM clients
WHERE email = 'john.smith@acmecorp.com'
ORDER BY created_at DESC
LIMIT 1;

-- Expected: is_test = FALSE ✅
```

---

### **Test 4: Minimal Signup (Required Fields Only)**

**URL:** Any signup URL

**Form Data:**
```
Business Name:           Quick Test Inc
Contact Name:            Jane Doe
Email:                   jane@example.com
Password:                Password123!
Confirm Password:        Password123!
Preferred Language:      English
Lead Source:             [LEAVE EMPTY]
Estimated Leads/Week:    [LEAVE EMPTY]
```

**Expected Result:**
- ✅ Form submits successfully (optional fields are truly optional)
- ✅ Success message appears
- ✅ Record created with `is_test = TRUE`
- ✅ `lead_source_description` and `estimated_leads_per_week` are NULL

---

### **Test 5: Validation Errors**

**Test Password Mismatch:**
```
Password:           Test123!
Confirm Password:   Test456!
```
**Expected:** ❌ Error: "Passwords do not match"

**Test Invalid Email:**
```
Email:              notanemail
```
**Expected:** ❌ Error: "Invalid email format"

**Test Missing Required Fields:**
```
[Leave Business Name empty]
```
**Expected:** ❌ Error: "Please fill in all required fields"

---

## 🔍 Verification Checklist

### **1. Supabase Database Check**

**After signup, verify in Supabase Studio:**

```sql
-- View recent signups
SELECT 
  business_name,
  name,
  email,
  language,
  is_test,
  is_internal,
  client_id,
  created_at
FROM clients
ORDER BY created_at DESC
LIMIT 10;
```

**Check for:**
- ✅ `is_test = TRUE` for test@example.com
- ✅ `is_test = FALSE` for real domain emails
- ✅ `is_internal = FALSE` (all signups are external)
- ✅ `api_key` is present and starts with "client_"
- ✅ `client_id` is a valid UUID

---

### **2. Console Logs Check**

**Look for these logs in browser console or Vercel logs:**

**Test Data:**
```
[TestDetection] ⚠️  Client registration marked as TEST DATA
[TestDetection] Reason: Contains test keywords or example domain
[E2E-Test] [ClientRegistration] New registration request
[E2E-Test] [ClientRegistration] Inserting into Supabase with data
```

**Production Data:**
```
[TestDetection] ✅ Client registration marked as PRODUCTION DATA
[E2E-Test] [ClientRegistration] New registration request
[E2E-Test] [ClientRegistration] Inserting into Supabase with data
```

---

### **3. API Key Validation**

**Verify API key was generated:**

```sql
SELECT api_key
FROM clients
WHERE email = 'test@example.com';

-- Should return something like: client_abc123xyz789...
```

**Test API key works:**
```bash
curl -X POST https://www.aveniraisolutions.ca/api/lead \
  -H "x-api-key: [YOUR_API_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "email": "lead@example.com",
    "message": "Test message"
  }'
```

**Expected:** HTTP 200 with success response

---

## 🐛 Troubleshooting

### **Issue: "All required fields must be filled" Error**

**Cause:** Form data not reaching API correctly

**Check:**
1. Browser console for network errors
2. Verify all 4 required fields are filled
3. Check if password and confirm password match

**Fix:** Ensure you're using the latest deployed version with the camelCase/snake_case fix

---

### **Issue: "Email already registered" Error**

**Cause:** Email already exists in database

**Solutions:**
1. Use a different email (add timestamp: `test-1234@example.com`)
2. Or delete the existing record:
   ```sql
   DELETE FROM clients WHERE email = 'test@example.com';
   ```

---

### **Issue: `is_test` is FALSE but should be TRUE**

**Cause:** Email domain or name doesn't contain test keywords

**Check:** 
```sql
SELECT email, name, business_name, is_test
FROM clients
WHERE email = 'youremail@domain.com';
```

**Verify test detection:**
- Email must contain: `@example.com`, `@test.com`, `@demo.com`
- OR name must contain: "test", "demo", "sample"
- OR business_name must contain test keywords

---

### **Issue: Form doesn't submit on production**

**Possible Causes:**
1. CORS issues
2. API route not deployed
3. Environment variables missing

**Check:**
1. Verify deployment: `https://www.aveniraisolutions.ca/api/client/register`
2. Check Vercel logs for errors
3. Verify `.env` variables are set in Vercel dashboard

---

## 📊 Success Criteria

### **All Tests Pass If:**

1. ✅ English signup form submits successfully
2. ✅ French signup form submits successfully
3. ✅ Test emails (`@example.com`) marked with `is_test = TRUE`
4. ✅ Production emails marked with `is_test = FALSE`
5. ✅ API key generated and stored correctly
6. ✅ Client can login to dashboard after signup
7. ✅ Optional fields can be left empty
8. ✅ Required field validation works correctly
9. ✅ Password mismatch validation works
10. ✅ Email format validation works

---

## 🚀 Quick Test Commands

### **Local Test**
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Open browser
open http://localhost:3000/en/client/signup
```

### **Production Test**
```bash
# Open production signup
open https://www.aveniraisolutions.ca/en/client/signup
```

### **Database Verification**
```sql
-- Check recent signups
SELECT 
  business_name,
  email,
  is_test,
  created_at
FROM clients
ORDER BY created_at DESC
LIMIT 5;

-- Count test vs production
SELECT 
  is_test,
  COUNT(*) as count
FROM clients
GROUP BY is_test;
```

---

## ✅ Summary

**What to Test:**
1. ✅ Complete signup (all fields)
2. ✅ Minimal signup (required fields only)
3. ✅ Validation errors (missing fields, password mismatch, invalid email)
4. ✅ Test data detection (`is_test = TRUE`)
5. ✅ Production data detection (`is_test = FALSE`)
6. ✅ French language version
7. ✅ Labels no longer show "(optional)"

**Expected Results:**
- ✅ Smooth signup experience
- ✅ Proper data storage in Supabase
- ✅ Automatic test data flagging
- ✅ API key generation
- ✅ Console logging for debugging

**Status:** ✅ Ready to Test

---

**Generated:** October 16, 2025  
**Feature:** Client Signup System  
**Test Type:** Manual + Database Verification  
**Build:** ✅ Success

