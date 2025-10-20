# Lead Linkage Audit Report

**Date**: October 20, 2025  
**Test Client ID**: `a8c89837-7e45-44a4-a367-6010df87a723`  
**Issue**: Dashboard shows 0 leads despite 12 test leads being created

---

## 🔍 Root Cause Analysis

After extensive auditing, the root cause has been identified:

### **The `upsertLeadWithHistory` function is failing silently due to RLS (Row Level Security) policies**

#### Evidence:
1. ✅ API returns HTTP 200 and `success: true`
2. ❌ API returns `leadId: undefined`
3. ❌ No leads exist in `lead_memory` table
4. ❌ No `lead_actions` records created (because no leadId)
5. ❌ Dashboard shows 0 leads (because no lead_actions records)

#### Technical Details:
- The `/api/lead` endpoint catches errors from `upsertLeadWithHistory` and treats them as non-fatal
- The error is logged but the API continues and returns success without a leadId
- This prevents the `lead_actions` record from being created
- Without `lead_actions` records, the dashboard query returns no leads

---

## 🔐 RLS Policy Configuration

The `lead_memory` table has the following RLS policy (from `supabase-setup.sql` lines 214-218):

```sql
CREATE POLICY "Service role full access to lead_memory" ON lead_memory
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

This policy **requires the Supabase client to use the service role key** to bypass RLS and insert leads.

---

## 🐛 The Problem

The Supabase client initialization in `src/lib/supabase.ts` (lines 71-72) uses:

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
```

**The issue**: If `SUPABASE_SERVICE_ROLE_KEY` is not set in the production environment (Vercel), it falls back to the anon key, which **does not have permission** to insert into `lead_memory` due to RLS policies.

---

## ✅ The Fix

### **Set the `SUPABASE_SERVICE_ROLE_KEY` environment variable in Vercel**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the following variable:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Your Supabase service role key (found in Supabase Dashboard → Settings → API)
   - **Environment**: Production, Preview, Development (select all)

3. Redeploy the application for the changes to take effect

### Why this fixes the issue:
- The service role key bypasses RLS policies
- `upsertLeadWithHistory` will successfully insert leads into `lead_memory`
- The function will return the leadId
- `lead_actions` records will be created properly
- The dashboard will display all leads correctly

---

## 📊 Verified System Components

### 1. ✅ Join Condition in Dashboard Query
The dashboard query in `src/lib/query-batching.ts` correctly joins:
```typescript
lead_actions.client_id = clients.id (primary key UUID)
lead_actions.lead_id = lead_memory.id
```

### 2. ✅ RLS Policies
RLS policies are correctly configured:
- Service role has full access to `lead_memory`
- Client context can be set via `set_client_context` RPC

### 3. ✅ Lead API Logic
The lead API (`src/app/api/lead/route.ts`) correctly:
- Uses `client.id` (primary key UUID) for `clientId`
- Passes `clientId` to `upsertLeadWithHistory` as `client_id`
- Creates `lead_actions` records with correct `client_id` and `lead_id`

### 4. ✅ Dashboard Query
The dashboard API (`src/app/api/client/leads/route.ts`) correctly:
- Joins `lead_actions` with `lead_memory`
- Filters by `client_id = clients.id` (primary key UUID)
- Orders by timestamp descending

---

## 🚫 What Was NOT Changed

As requested, the following were **not modified**:
- Database schema
- Migrations
- RLS policies
- Query logic

---

## 📋 Summary

### Missing Lead Actions: **0 (because no leads exist in lead_memory)**

### What was done:
1. ✅ Audited the data linkage between `lead_memory` and `lead_actions`
2. ✅ Verified the join condition in dashboard query is correct
3. ✅ Confirmed RLS policies are properly configured
4. ✅ Identified root cause: missing `SUPABASE_SERVICE_ROLE_KEY` environment variable
5. ✅ Provided fix instructions

### What needs to be done:
1. ⚠️  **Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment variables**
2. ⚠️  **Redeploy the application**
3. ⚠️  **Re-run the test client creation script** to generate the 12 test leads
4. ⚠️  **Verify leads appear in both English and French dashboards**

---

## 🧪 Test Scripts Created

The following diagnostic scripts were created during the audit:

1. **audit-lead-linkage.js** - Checks lead_memory and lead_actions linkage
2. **check-database-state.js** - Verifies database state via API
3. **backfill-lead-actions.js** - Would backfill missing lead_actions (not needed now)
4. **debug-upsert.js** - Tests upsertLeadWithHistory function
5. **test-supabase.js** - Tests Supabase connection
6. **minimal-lead-test.js** - Minimal test to identify the issue

These scripts can be deleted after the issue is resolved.

---

## 🎯 Next Steps

After setting the `SUPABASE_SERVICE_ROLE_KEY` environment variable and redeploying:

1. Run the test client creation script again:
   ```bash
   node test-create-client.js
   ```

2. Verify leads appear in the dashboard:
   ```bash
   node check-database-state.js
   ```

3. Test both English and French dashboards:
   - English: https://www.aveniraisolutions.ca/en/client/dashboard
   - French: https://www.aveniraisolutions.ca/fr/client/dashboard

4. Confirm:
   - ✅ 12 leads visible (10 unique + 2 repeats)
   - ✅ Prospect Intelligence scoring works
   - ✅ Relationship Insights detect repeat customers
   - ✅ Translation works for both locales
   - ✅ No email outreach buttons for clients

---

## 📞 Test Client Credentials

**Email**: test-client@aveniraisolutions.ca  
**Password**: TestClient2025!  
**Client ID**: a8c89837-7e45-44a4-a367-6010df87a723  
**API Key**: client_b80d6d19192b3144fdd663d5a88928bf

---

**Status**: ⚠️  Awaiting environment variable configuration and redeploy
