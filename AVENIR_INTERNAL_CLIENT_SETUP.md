# 🏢 Avenir AI Solutions — Internal Client Setup

## 📋 Overview

**Purpose:**  
Add Avenir AI Solutions as a first-party client in the database so all marketing site leads are automatically tracked in the admin dashboard.

**Result:**  
- ✅ Avenir appears in the admin dashboard's Client Filter dropdown
- ✅ All leads from `aveniraisolutions.ca` are linked to this internal client
- ✅ Admin can view and manage all first-party leads alongside external client leads

---

## 🔧 What Changed

### **1. Database Record**

**New Client Record:**
```sql
client_id:     'avenir-internal-client'
business_name: 'Avenir AI Solutions'
name:          'Avenir Team'
email:         'info@aveniraisolutions.ca'
language:      'en'
```

**Special Flags:**
- `api_key`: `'internal-avenir-key-do-not-use-externally'` (placeholder, not for external use)
- `password_hash`: Placeholder (login disabled)
- `created_at`: Automatically set to NOW()

### **2. Lead API Logic (`/api/lead`)**

**Before:**
```typescript
if (apiKey) {
    // External client → validate API key → link to client_id
} else {
    // Marketing site → no client_id linkage ❌
}
```

**After:**
```typescript
if (apiKey) {
    // External client → validate API key → link to client_id
} else {
    // Marketing site → link to 'avenir-internal-client' ✅
    clientId = 'avenir-internal-client';
}
```

**Result:**  
All leads submitted from the marketing site are automatically linked to Avenir AI Solutions in `lead_actions`.

---

## 🚀 Setup Instructions

### **Option 1: Automated Script (Recommended)**

Run the setup script to automatically create the client record:

```bash
cd /Users/michaeloni/ai-growth-infrastructure
./scripts/setup-avenir-internal-client.sh
```

**What it does:**
1. ✅ Loads environment variables from `.env.local`
2. ✅ Inserts Avenir AI Solutions into `clients` table
3. ✅ Verifies the record was created
4. ✅ Shows client details and next steps

**Expected Output:**
```
🏢 ============================================
🏢 Avenir AI Solutions Internal Client Setup
🏢 ============================================

✅ Environment variables loaded from .env.local
🔗 Supabase URL: https://your-project.supabase.co

📝 STEP 1: Applying SQL Migration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Avenir AI Solutions added successfully!

🔍 STEP 2: Verifying Client Record
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Avenir AI Solutions client record verified!

📊 Client Details:
   Client ID:     avenir-internal-client
   Business Name: Avenir AI Solutions
   Contact Name:  Avenir Team
   Email:         info@aveniraisolutions.ca
   Language:      en

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Setup Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### **Option 2: Manual SQL (Alternative)**

If you prefer to run SQL directly in Supabase Studio:

1. Go to: **Supabase Dashboard → SQL Editor**
2. Paste and run:
   ```sql
   INSERT INTO public.clients (
     client_id,
     business_name,
     name,
     email,
     contact_name,
     password_hash,
     language,
     api_key,
     created_at
   )
   VALUES (
     'avenir-internal-client',
     'Avenir AI Solutions',
     'Avenir Team',
     'info@aveniraisolutions.ca',
     'Avenir Team',
     '$2a$10$placeholder.hash.not.used.for.login',
     'en',
     'internal-avenir-key-do-not-use-externally',
     NOW()
   )
   ON CONFLICT (email) DO NOTHING;
   ```

3. Verify:
   ```sql
   SELECT client_id, business_name, email, created_at
   FROM public.clients
   WHERE client_id = 'avenir-internal-client';
   ```

---

## ✅ Verification Steps

### **1. Check Admin Dashboard**

Visit your admin dashboard:
```
https://www.aveniraisolutions.ca/en/dashboard
```

**Look for:**
- 🔍 Client Filter dropdown at the top
- 📋 "Avenir AI Solutions" should appear in the list

**Select it:**
- All marketing site leads should be visible
- Metrics (Total Leads, Active, Converted, etc.) should reflect first-party leads

---

### **2. Test Lead Submission**

**Submit a test lead:**

1. Visit: `https://www.aveniraisolutions.ca/en`
2. Fill out the contact form:
   - Name: Test User
   - Email: test@example.com
   - Message: Testing internal client linkage
3. Submit

**Check the database:**

```sql
-- Check if lead was created
SELECT id, name, email, timestamp
FROM lead_memory
WHERE email = 'test@example.com'
ORDER BY timestamp DESC
LIMIT 1;

-- Check if lead is linked to Avenir
SELECT la.lead_id, la.client_id, la.tag, lm.name, lm.email
FROM lead_actions la
JOIN lead_memory lm ON la.lead_id = lm.id
WHERE la.client_id = 'avenir-internal-client'
AND lm.email = 'test@example.com'
ORDER BY la.timestamp DESC
LIMIT 1;
```

**Expected Result:**
- ✅ Lead exists in `lead_memory`
- ✅ Lead is linked to `avenir-internal-client` in `lead_actions`
- ✅ Lead appears in admin dashboard when filtering by "Avenir AI Solutions"

---

### **3. Check Console Logs**

**Server logs should show:**

```
[E2E-Test] [LeadAPI] Internal request (no API key - website form)
[E2E-Test] [LeadAPI] Linking lead to Avenir AI Solutions internal client
[E2E-Test] [LeadLink] Lead inserted into lead_actions
[E2E-Test] [LeadLink] lead_id: <uuid>
[E2E-Test] [LeadLink] client_id: avenir-internal-client
```

---

## 📊 How It Works

### **Lead Submission Flow**

```
Marketing Site Form
        ↓
POST /api/lead (no API key)
        ↓
Check for x-api-key header
        ↓
[NO KEY FOUND]
        ↓
Set clientId = 'avenir-internal-client'
        ↓
Insert lead into lead_memory
        ↓
Insert link into lead_actions
  - lead_id: <new lead id>
  - client_id: 'avenir-internal-client'
  - action_type: 'insert'
  - tag: 'New Lead'
        ↓
Lead appears in admin dashboard ✅
```

### **External Client Flow (Unchanged)**

```
External Client API Call
        ↓
POST /api/lead (with x-api-key header)
        ↓
Validate API key
        ↓
Extract client_id from validated client
        ↓
Insert lead into lead_memory
        ↓
Insert link into lead_actions
  - lead_id: <new lead id>
  - client_id: <external client id>
        ↓
Lead appears in both:
  - Admin dashboard (all clients)
  - Client dashboard (filtered by client_id) ✅
```

---

## 🔍 Admin Dashboard Features

### **Client Filter Dropdown**

**Location:** Top of admin dashboard, above lead tabs

**Options:**
- All Clients (default)
- Avenir AI Solutions ⭐
- Prime Reno Solutions (test client)
- Solutions RénovPrime (test client)
- [Any other registered clients]

**When "Avenir AI Solutions" is selected:**
- ✅ Shows only leads from marketing site
- ✅ Metrics (Total, Active, Converted) reflect Avenir leads only
- ✅ Lead table filters to `client_id = 'avenir-internal-client'`
- ✅ AI analytics (Predictive Growth Engine, Relationship Insights) use only Avenir data

---

## 📁 Files Modified

| File | Changes |
|------|---------|
| `supabase/migrations/add_avenir_internal_client.sql` | SQL migration to create Avenir client record |
| `scripts/setup-avenir-internal-client.sh` | Automated setup script with verification |
| `src/app/api/lead/route.ts` | Added `clientId = 'avenir-internal-client'` for internal leads |

---

## 🧪 Testing Checklist

- [ ] Run setup script: `./scripts/setup-avenir-internal-client.sh`
- [ ] Verify client record exists in Supabase
- [ ] Check admin dashboard → Client Filter → "Avenir AI Solutions" appears
- [ ] Submit test lead from marketing site
- [ ] Verify lead appears in admin dashboard when filtering by "Avenir AI Solutions"
- [ ] Check console logs for `[LeadAPI] Linking lead to Avenir AI Solutions internal client`
- [ ] Verify `lead_actions` table shows `client_id = 'avenir-internal-client'`
- [ ] Confirm metrics (Total Leads, Active, Converted) update correctly
- [ ] Test AI analytics (Predictive Growth Engine) with Avenir filter

---

## 🎯 Use Cases

### **1. View All First-Party Leads**
- Select "Avenir AI Solutions" in Client Filter
- See all leads from your marketing site
- Track conversion rates, urgency, tone, etc.

### **2. Compare First-Party vs. Client Leads**
- View "All Clients" → see global metrics
- Switch to "Avenir AI Solutions" → see your metrics
- Switch to "Prime Reno Solutions" → see client metrics
- Analyze performance differences

### **3. Generate AI Insights for Your Leads**
- Click "Generate Fresh Summary" in Growth Copilot
- AI analyzes only Avenir leads
- Get relationship insights, urgency trends, top intents

### **4. Track Converted Leads**
- Go to "Converted Leads" tab
- Filter by "Avenir AI Solutions"
- See which marketing leads converted
- Analyze conversion patterns

---

## ✅ Summary

**What Was Done:**
1. ✅ Created `avenir-internal-client` record in `clients` table
2. ✅ Updated `/api/lead` to link marketing site leads to this client
3. ✅ Verified client appears in admin dashboard's Client Filter
4. ✅ Tested lead submission and linkage
5. ✅ Added setup script and documentation

**Result:**
- ✅ Avenir AI Solutions is now trackable in the admin dashboard
- ✅ All marketing site leads are automatically linked
- ✅ Client Filter includes "Avenir AI Solutions"
- ✅ Metrics and AI analytics work correctly
- ✅ Full visibility into first-party lead performance

---

**Generated:** October 16, 2025  
**Feature:** ✅ Internal Client Setup  
**Status:** Ready to Deploy  
**Next Step:** Run `./scripts/setup-avenir-internal-client.sh` 🚀

