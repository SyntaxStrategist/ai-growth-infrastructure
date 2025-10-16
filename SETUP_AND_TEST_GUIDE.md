# 🚀 Complete Setup & Test Guide

## ✅ Quick Setup (5 Minutes)

### **Step 1: Apply Database Migration**

**Copy this SQL and run it in Supabase Dashboard → SQL Editor:**

```sql
-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'fr')),
  api_key TEXT UNIQUE NOT NULL,
  client_id TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  lead_source_description TEXT,
  estimated_leads_per_week INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  last_connection TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_api_key ON public.clients(api_key);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_client_id ON public.clients(client_id);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Clients can view own data" ON public.clients
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Anyone can create account" ON public.clients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Clients can update own data" ON public.clients
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Grant access
GRANT SELECT, INSERT, UPDATE ON public.clients TO anon, authenticated;
```

---

### **Step 2: Verify Dependencies**

```bash
npm list bcryptjs
# Should show: bcryptjs@3.0.2
```

If missing:
```bash
npm install bcryptjs @types/bcryptjs
```

---

### **Step 3: Start Dev Server**

```bash
npm run dev
```

Wait for: `✓ Ready in X.Xs`

---

### **Step 4: Run Automated Tests**

```bash
./test-client-system-e2e.sh
```

**Expected Output:**
```
✅ ALL TESTS PASSED
🎉 Client onboarding system is fully functional!
```

---

## 🧪 Manual UI Testing

### **Test 1: English Client Signup**

```bash
open http://localhost:3000/en/client/signup
```

**Actions:**
1. Verify logo appears in header
2. Fill form:
   - Business Name: "Test Company"
   - Contact Name: "John Doe"
   - Email: "john@test.com"
   - Password: "password123"
   - Language: English
3. Click "Create Account"
4. Check console for logs:
   ```
   [E2E-Test] [ClientRegistration] ✅ Client created in Supabase
   [E2E-Test] [ClientRegistration] ✅ API key assigned
   ```
5. Check email for welcome message with credentials

**Expected Result:** Success message + redirect to dashboard

---

### **Test 2: Client Login**

```bash
open http://localhost:3000/en/client/dashboard
```

**Actions:**
1. Enter email: "john@test.com"
2. Enter password: "password123"
3. Click "Log In"
4. Check console for:
   ```
   [E2E-Test] [ClientAuth] ✅ Login successful
   [E2E-Test] [ClientAuth] ✅ Credentials verified
   ```

**Expected Result:** 
- Welcome screen with stats (all zeros initially)
- Logo in header
- API Access button visible

---

### **Test 3: API Access Page**

```bash
# From dashboard, click "🔑 API Access" button
# Or directly:
open http://localhost:3000/en/client/api-access
```

**Actions:**
1. Verify API endpoint displayed
2. Click "Show" on API key
3. Verify key format: `client_<32_hex_chars>`
4. Click "Copy" button
5. Check cURL example

**Expected Result:** All integration details visible

---

### **Test 4: Send Test Lead**

**Copy the cURL command from the API Access page, or:**

```bash
# Replace YOUR_API_KEY with the key from /client/api-access
curl -X POST http://localhost:3000/api/lead \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: YOUR_API_KEY' \
  -d '{
    "name": "Test Lead",
    "email": "testlead@example.com",
    "message": "I am interested in your AI solutions"
  }'
```

**Check Console for:**
```
[LeadAPI] API key provided - validating...
[LeadAPI] ✅ Valid API key
[LeadAPI] Lead received from client_id: <uuid>
[LeadAPI] Stored lead successfully
```

**Expected Result:** `{"success": true}`

---

### **Test 5: Verify Lead in Dashboard**

```bash
# Refresh the client dashboard
open http://localhost:3000/en/client/dashboard
```

**Expected Result:**
- Stats updated (Total Leads: 1)
- Lead appears in Recent Leads table
- AI analysis visible (intent, tone, urgency)

---

### **Test 6: French Flow**

**A. French Signup:**
```bash
open http://localhost:3000/fr/client/signup
```

**Actions:**
1. Fill form in French
2. Language: Français
3. Submit

**Expected Result:** Success in French

**B. French Dashboard:**
```bash
open http://localhost:3000/fr/client/dashboard
```

**Expected Result:**
- All labels in French
- "Bienvenue" message
- Stats in French

**C. French API Access:**
```bash
open http://localhost:3000/fr/client/api-access
```

**Expected Result:**
- French labels throughout
- Zapier guide in French

---

## 🔍 Console Logs to Monitor

### **During Tests, Watch For:**

**Signup:**
```
[E2E-Test] [ClientRegistration] New registration request
[E2E-Test] [ClientRegistration] Generated credentials
[E2E-Test] [ClientRegistration] ✅ Client created
[E2E-Test] [ClientRegistration] ✅ API key assigned
```

**Login:**
```
[E2E-Test] [ClientAuth] Login attempt
[E2E-Test] [ClientAuth] ✅ Login successful
[E2E-Test] [ClientAuth] ✅ Credentials verified
```

**Dashboard Load:**
```
[E2E-Test] [ClientLeads] Fetching leads for client
[E2E-Test] [ClientLeads] ✅ Found X leads
[E2E-Test] [ClientLeads] ✅ Client-scoped data loaded
```

**Lead Submission:**
```
[LeadAPI] API key provided - validating...
[LeadAPI] ✅ Valid API key
[LeadAPI] Lead received from client_id: <uuid>
[LeadAPI] Stored lead successfully
```

**Logo Loading:**
```
[AvenirLogo] Loading logo from: /assets/logos/logo.svg
[AvenirLogo] Locale: en
[AvenirLogo] Show text: true
```

---

## ✅ Verification Checklist

### **Code:**
- [x] All API routes created
- [x] All pages built
- [x] Logo component updated
- [x] E2E logging added
- [x] TypeScript builds successfully
- [x] Dependencies installed

### **Database:**
- [ ] Migration applied
- [ ] `clients` table exists
- [ ] Indexes created
- [ ] RLS policies applied

### **Functionality:**
- [ ] Client can sign up
- [ ] API key generated
- [ ] Welcome email sent
- [ ] Client can log in
- [ ] Dashboard shows stats
- [ ] API key visible
- [ ] Lead submission works
- [ ] Lead appears in dashboard
- [ ] Bilingual support works

---

## 🎯 Summary

**Current Status:** ⚠️ **ONE STEP AWAY FROM COMPLETE**

**What's Done:**
- ✅ All code implemented
- ✅ All pages built
- ✅ Logo restored
- ✅ Tests written
- ✅ Logging added

**What's Needed:**
- ❌ Apply database migration (5 minutes)

**Next Action:**
1. Copy SQL from `supabase/migrations/create_clients_table.sql`
2. Paste in Supabase Dashboard → SQL Editor
3. Click Run
4. Run `./test-client-system-e2e.sh`
5. All tests should pass ✅

---

**Complete client system ready to test!** 🧪✨
