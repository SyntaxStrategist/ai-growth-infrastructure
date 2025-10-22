# ✅ Fixed SQL: Restore Avenir AI Solutions Client

**Problem:** Original SQL failed with "no unique or exclusion constraint matching"  
**Fix:** Simplified SQL without ON CONFLICT clause

---

## 🔧 CORRECTED RESTORATION SQL

### **Option 1: Simple Insert (Recommended)**

Copy and paste this into **Supabase SQL Editor**:

```sql
-- ============================================
-- RESTORE: Avenir AI Solutions Internal Client
-- ============================================

-- Step 1: Check if it already exists (should return 0)
SELECT COUNT(*) as existing_count
FROM clients 
WHERE email = 'info@aveniraisolutions.ca';

-- Step 2: Delete if exists (cleanup from partial attempts)
DELETE FROM clients 
WHERE email = 'info@aveniraisolutions.ca';

-- Step 3: Insert the Avenir AI Solutions record
INSERT INTO public.clients (
  id,
  client_id,
  business_name,
  name,
  contact_name,
  email,
  password_hash,
  language,
  api_key,
  is_internal,
  is_test,
  industry_category,
  primary_service,
  email_tone,
  followup_speed,
  ai_personalized_reply,
  created_at,
  last_connection
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001',
  'Avenir AI Solutions',
  'Avenir Team',
  'Avenir Team',
  'info@aveniraisolutions.ca',
  '$2b$10$placeholder.hash.not.used.for.login',
  'en',
  'avenir-internal-' || gen_random_uuid()::text,
  true,
  false,
  'Technology',
  'AI Growth Infrastructure',
  'Professional',
  'Instant',
  true,
  '2024-12-01 00:00:00+00'::timestamptz,
  NOW()
);

-- Step 4: Verify restoration
SELECT 
  '✅ RESTORATION COMPLETE' as status,
  id,
  client_id,
  business_name,
  email,
  is_internal,
  api_key,
  created_at
FROM clients 
WHERE client_id = '00000000-0000-0000-0000-000000000001';
```

**Expected Output:**
```
status: ✅ RESTORATION COMPLETE
id: 00000000-0000-0000-0000-000000000001
client_id: 00000000-0000-0000-0000-000000000001
business_name: Avenir AI Solutions
email: info@aveniraisolutions.ca
is_internal: true
api_key: avenir-internal-[unique-id]
```

---

## 🔄 Alternative: If Email Conflict Exists

If you get an error like "duplicate key value violates unique constraint", it means a partial record exists. Use this instead:

```sql
-- Delete any existing records first
DELETE FROM clients 
WHERE email = 'info@aveniraisolutions.ca'
   OR client_id = '00000000-0000-0000-0000-000000000001'
   OR id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Then run the INSERT from above
INSERT INTO public.clients (
  id,
  client_id,
  business_name,
  name,
  contact_name,
  email,
  password_hash,
  language,
  api_key,
  is_internal,
  is_test,
  industry_category,
  primary_service,
  email_tone,
  followup_speed,
  ai_personalized_reply,
  created_at,
  last_connection
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001',
  'Avenir AI Solutions',
  'Avenir Team',
  'Avenir Team',
  'info@aveniraisolutions.ca',
  '$2b$10$placeholder.hash.not.used.for.login',
  'en',
  'avenir-internal-' || gen_random_uuid()::text,
  true,
  false,
  'Technology',
  'AI Growth Infrastructure',
  'Professional',
  'Instant',
  true,
  '2024-12-01 00:00:00+00'::timestamptz,
  NOW()
);
```

---

## ✅ After Running SQL

### **Immediate Tests:**

**Test 1: Check record exists**
```sql
SELECT * FROM clients WHERE email = 'info@aveniraisolutions.ca';
```
Expected: 1 row returned ✅

**Test 2: Check Client Filter**
- Go to: http://localhost:3000/en/dashboard
- Open "Client Filter" dropdown
- Should see "Avenir AI Solutions" ✅

**Test 3: Submit test lead**
- Go to: https://www.aveniraisolutions.ca/en
- Fill form and submit
- Check logs - should see: `Auto-linked lead to internal client 'Avenir AI Solutions'` ✅

---

## 🎯 Why This Version Works

**Original SQL had:**
```sql
ON CONFLICT (email) DO UPDATE ...
```

**Problem:** PostgreSQL couldn't find the unique constraint on `email` (even though it should exist)

**This version:**
- ✅ Explicitly deletes old record first (cleanup)
- ✅ Then does simple INSERT (no conflict handling needed)
- ✅ Works even if constraints are missing or named differently

---

## ⚠️ If You Still Get Errors

**Error: "column X does not exist"**

Some columns might not exist in your table. Run this minimal version:

```sql
-- Minimal restoration (only required fields)
INSERT INTO public.clients (
  id,
  client_id,
  business_name,
  name,
  email,
  password_hash,
  language,
  api_key,
  is_internal
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001',
  'Avenir AI Solutions',
  'Avenir Team',
  'info@aveniraisolutions.ca',
  '$2b$10$placeholder',
  'en',
  'avenir-internal-' || gen_random_uuid()::text,
  true
);
```

---

**Try the corrected SQL above. Let me know if you get any errors!** 🚀

