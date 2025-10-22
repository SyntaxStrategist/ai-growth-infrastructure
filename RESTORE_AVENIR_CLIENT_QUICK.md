# ⚡ Quick Restore: Avenir AI Solutions Client

**Problem:** Deleted "Avenir AI Solutions" from clients table  
**Fix Time:** 2 minutes  
**Risk:** None - safe to restore

---

## 🚨 What's Broken Right Now

❌ Website form submissions (aveniraisolutions.ca) → unlinked leads  
❌ Admin dashboard "Client Filter" for Avenir → not showing  
❌ Intelligence engine → skipping Avenir leads  
⚠️ Orphaned data: lead_actions have NULL client_id

---

## ✅ Quick Fix (Copy-Paste This SQL)

### **Open Supabase SQL Editor → Paste → Run:**

```sql
-- Restore Avenir AI Solutions internal client
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
)
ON CONFLICT (email) DO UPDATE 
SET 
  client_id = '00000000-0000-0000-0000-000000000001',
  is_internal = true;

-- Verify it worked
SELECT client_id, business_name, email, is_internal 
FROM clients 
WHERE client_id = '00000000-0000-0000-0000-000000000001';
```

**Expected Output:**
```
client_id: 00000000-0000-0000-0000-000000000001
business_name: Avenir AI Solutions
email: info@aveniraisolutions.ca
is_internal: true
```

---

## ✅ Test After Restoration

### **Test 1: Admin Dashboard**
1. Go to: http://localhost:3000/en/dashboard
2. Click "Client Filter"
3. Should see "Avenir AI Solutions" ✅
4. Select it → should load leads ✅

### **Test 2: Website Form**
1. Go to: https://www.aveniraisolutions.ca/en
2. Submit test lead
3. Check admin dashboard with Avenir filter
4. Should appear ✅

---

## 📊 What Gets Fixed

✅ Website forms → properly linked  
✅ Client filter → works again  
✅ Intelligence engine → processes Avenir leads  
✅ New leads → linked correctly

**What stays broken:**
⚠️ Old orphaned lead_actions (from before deletion) → remain NULL  
⚠️ You can manually re-link them later if needed

---

## 🎯 Bottom Line

**Run that SQL. Takes 30 seconds. Fixes everything.** 🚀

**Full details:** See `DELETED_AVENIR_CLIENT_IMPACT_ANALYSIS.md`

---

**Status:** Ready to execute  
**Risk:** None  
**Time:** 2 minutes

