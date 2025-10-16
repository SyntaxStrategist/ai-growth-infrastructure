# 🔧 Environment Setup Guide

## ⚠️ **Current Issue: Supabase Connection Failed**

The E2E tests are failing with `"TypeError: fetch failed"` because Supabase environment variables are not configured.

---

## ✅ **Quick Fix (2 Minutes)**

### **Step 1: Create .env.local file**

```bash
cd /Users/michaeloni/ai-growth-infrastructure
cp env.example .env.local
```

---

### **Step 2: Get Supabase Credentials**

1. Go to https://supabase.com/dashboard
2. Select your Avenir AI project
3. Click **Settings** → **API**
4. You'll see:

```
Configuration
├─ Project URL:      https://xxxxx.supabase.co
├─ anon public:      eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...
└─ service_role:     eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...  (🔒 secret)
```

---

### **Step 3: Fill in .env.local**

Open `.env.local` and paste your values:

```env
# Supabase (copy from dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your-service-role-key...
SUPABASE_ANON_KEY=eyJhbGci...your-anon-key...

# Aliases (use same values as above)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGci...your-service-role-key...

# Optional (for full functionality)
ADMIN_PASSWORD=your-admin-password
OPENAI_API_KEY=sk-...
```

**Important:**
- `NEXT_PUBLIC_*` = Public (client-side code)
- Others = Private (server-side only)
- `SUPABASE_URL` = Same as `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_KEY` = Same as `SUPABASE_SERVICE_ROLE_KEY`

---

### **Step 4: Restart Server**

```bash
# Stop current server
pkill -f "next dev"

# Start fresh (will load .env.local)
npm run dev
```

Wait for: `✓ Ready in X.Xs`

---

### **Step 5: Run E2E Tests**

```bash
./test-client-system-e2e.sh
```

**Expected Output:**
```
✅ ALL TESTS PASSED (8/8)
🎉 Client onboarding system is fully functional!
```

---

## 🔍 **Verify Environment Variables Loaded**

### **In terminal:**
```bash
# After server starts, check if vars are loaded
grep SUPABASE .env.local | wc -l
# Should show: 5
```

### **In browser console:**
```javascript
// Check public variable (should be set)
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
// Should show: https://xxxxx.supabase.co
```

### **Test Supabase connection:**
```bash
curl -s http://localhost:3000/api/client/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@test.com","business_name":"Test Co","password":"test1234","language":"en"}' | jq '.'

# Should return:
# {
#   "success": true,
#   "data": {
#     "clientId": "<uuid>",
#     "businessName": "Test Co",
#     "name": "Test",
#     "email": "test@test.com"
#   }
# }
```

---

## 📊 **Expected Console Logs (After Fix)**

Once environment variables are set, you should see:

```
[E2E-Test] [ClientRegistration] New registration request: {name: "Test", email: "test@test.com", business_name: "Test Co", language: "en"}
[E2E-Test] [ClientRegistration] Email check result: {exists: false, error: "none"}
[E2E-Test] [ClientRegistration] Generated credentials: {clientId: "<uuid>", apiKey: "client_abc...", passwordHashLength: 60}
[E2E-Test] [ClientRegistration] Inserting into Supabase with data: {name: "Test", email: "test@test.com", business_name: "Test Co", language: "en"}
[E2E-Test] [ClientRegistration] ✅ Client created in Supabase: <uuid>
[E2E-Test] [ClientRegistration] ✅ Full client data: {id, client_id, name, email, business_name, language}
[E2E-Test] [ClientRegistration] ✅ API key assigned: client_abc123...
```

**No more "fetch failed" errors!** ✅

---

## ⚠️ **Troubleshooting**

### **If still getting errors after setting variables:**

**1. Verify .env.local exists and has content:**
```bash
cat .env.local | grep NEXT_PUBLIC_SUPABASE_URL
# Should show: NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
```

**2. Check variable format (no quotes needed):**
```env
# ✅ Correct:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# ❌ Wrong:
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
```

**3. Restart server (required after changing .env.local):**
```bash
pkill -f "next dev"
npm run dev
```

**4. Test Supabase connection manually:**
```bash
# In Supabase SQL Editor:
SELECT * FROM clients LIMIT 1;
# Should return rows or empty result (not an error)
```

---

## 📋 **Environment Variables Checklist**

- [ ] `.env.local` file created
- [ ] `NEXT_PUBLIC_SUPABASE_URL` filled
- [ ] `SUPABASE_SERVICE_ROLE_KEY` filled
- [ ] `SUPABASE_ANON_KEY` filled
- [ ] `SUPABASE_URL` filled (same as NEXT_PUBLIC_SUPABASE_URL)
- [ ] `SUPABASE_KEY` filled (same as SUPABASE_SERVICE_ROLE_KEY)
- [ ] Server restarted
- [ ] E2E tests run successfully

---

## 🎯 **Summary**

**Current Error:** "TypeError: fetch failed"  
**Root Cause:** Missing Supabase environment variables  
**Solution:** Create `.env.local` with Supabase credentials  
**Time to Fix:** ~2 minutes  

**After fix:**
- ✅ Client registration will work
- ✅ Client authentication will work
- ✅ API key validation will work
- ✅ Lead submission will work
- ✅ All 8 E2E tests will pass

---

**Quick setup to unblock all E2E tests!** 🔧✨
