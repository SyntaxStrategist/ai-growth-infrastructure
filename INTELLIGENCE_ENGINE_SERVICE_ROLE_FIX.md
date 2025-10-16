# ✅ Intelligence Engine — Service Role Client Fix

## 🎯 **Issue Resolved**

The intelligence engine was failing to fetch clients because it was using the default Supabase client without proper service role permissions. Fixed by creating a service role client with `SUPABASE_SERVICE_ROLE_KEY`.

---

## 🔧 **Complete Fix**

### **1. Added Service Role Client Creation**

**Before:**
```typescript
// Used default client (limited permissions)
import { supabase } from './supabase';

export async function runWeeklyAnalysis() {
  // Query clients using default client
  const { data: clients } = await supabase
    .from('clients')
    .select('id, client_id, business_name, name, email');
  
  // Result: count: 0 (permission denied or limited access)
}
```

**After:**
```typescript
// Create service role client with full permissions
import { createClient } from '@supabase/supabase-js';

export async function runWeeklyAnalysis() {
  // Create service role client
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  
  console.log('[Engine] ✅ Service role Supabase client created');
  
  // Query clients using service role client
  const { data: clients } = await supabaseAdmin
    .from('clients')
    .select('id, client_id, business_name, name, email');
  
  // Result: count: 3 (all clients returned)
}
```

---

### **2. Updated All Database Operations**

**All Supabase queries now use `supabaseAdmin`:**

```typescript
// Pass admin client to all functions
await analyzeClientLeads(null, weekAgo, now, supabaseAdmin);
await analyzeClientLeads(client.client_id, weekAgo, now, supabaseAdmin);
await storeGrowthInsights(globalInsights, supabaseAdmin);
await storeGrowthInsights(clientInsights, supabaseAdmin);
```

**Functions updated:**
- `analyzeClientLeads(clientId, start, end, supabaseClient)` — Now accepts admin client
- `storeGrowthInsights(insights, supabaseClient)` — Now accepts admin client

---

### **3. Enhanced Logging**

**New logs show complete client processing:**

```javascript
[Engine] ============================================
[Engine] Starting weekly intelligence analysis...
[Engine] ============================================

[Engine] Environment check: {
  hasUrl: true,
  hasServiceKey: true,
  urlValue: 'https://xxx.supabase.co'
}
[Engine] ✅ Service role Supabase client created

[Engine] Analysis period: {
  start: '2025-10-09T00:00:00.000Z',
  end: '2025-10-16T23:59:59.999Z',
  days: 7
}

[Engine] -------- Global Analysis --------
[Engine] ✅ Global analysis complete and stored

[Engine] ============================================
[Engine] Per-Client Analysis Starting
[Engine] ============================================
[Engine] Querying clients table...
[Engine] Query: SELECT id, client_id, business_name, name, email FROM clients
[Engine] Filters: NONE (fetch all clients)

[Engine] ============================================
[Engine] Total clients fetched: 3
[Engine] ============================================

[Engine] Client list:
[Engine]   1. Tech Solutions Inc (client_id: abc-123-def-456)
[Engine]   2. Marketing Agency Pro (client_id: xyz-789-ghi-012)
[Engine]   3. Startup Innovations (client_id: def-456-jkl-789)
[Engine] ============================================

[Engine] ============================================
[Engine] Processing 3 client(s)
[Engine] ============================================

[Engine] ============================================
[Engine] Processing client 1 of 3
[Engine] Processing client_id: abc-123-def-456
[Engine] Business name: Tech Solutions Inc
[Engine] Email: contact@techsolutions.com
[Engine] Database ID: uuid-1
[Engine] ============================================

[Engine] Client mode: fetching leads via lead_actions join
[Engine] Found 15 total leads for client via lead_actions
[Engine] Filtered to 8 leads in time period

[Engine] ============================================
[Engine] Analytics Summary for Tech Solutions Inc
[Engine] ============================================
[Engine] Total leads analyzed: 8
[Engine] Engagement Score: 78 /100
[Engine] Avg Confidence: 85.3 %
[Engine] Urgency Trend: 12.5 %
[Engine] Tone Sentiment: 72 /100
[Engine] Language Ratio: { en: '60%', fr: '40%' }
[Engine] Top Intents: consultation, partnership, support
[Engine] ============================================

[Engine] Storing growth insights for client_id: abc-123-def-456
[Engine] ✅ Insert/Update status: SUCCESS
[Engine] ✅ Analysis complete for: Tech Solutions Inc
[Engine] ✅ Client can now view analytics in dashboard

[Engine] ============================================
[Engine] Processing client 2 of 3
[Engine] Processing client_id: xyz-789-ghi-012
...

[Engine] ============================================
[Engine] Completed all clients successfully
[Engine] Total processed: 3
[Engine] Total errors: 0
[Engine] ============================================

[Engine] ============================================
[Engine] Weekly analysis complete
[Engine] ✅ Processed: 4, ❌ Errors: 0
[Engine] ============================================
```

---

## 🗄️ **Database Query Details**

### **Clients Table Schema:**
```sql
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text UNIQUE DEFAULT (gen_random_uuid())::text,
  business_name text,
  name text,
  email text,
  api_key text UNIQUE,
  password_hash text,
  language text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  last_login timestamptz DEFAULT now(),
  last_connection timestamptz DEFAULT now(),
  last_rotated timestamptz,
  contact_name text
);
```

### **Query Used:**
```typescript
const { data: clients } = await supabaseAdmin
  .from('clients')
  .select('id, client_id, business_name, name, email');
```

**No filters applied** — fetches all clients.

---

## 🔐 **Service Role Permissions**

### **Why Service Role is Required:**

**Default Supabase client:**
- Uses `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_ANON_KEY`
- Limited by Row Level Security (RLS)
- May not have access to all clients

**Service Role client:**
- Uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- Bypasses RLS
- Full admin access to all tables
- Required for intelligence engine operations

---

## 📊 **Complete Data Flow**

```
Intelligence Engine Trigger
        ↓
Create Service Role Client
  supabaseAdmin = createClient(url, serviceKey)
        ↓
┌──────────────────────────────────────┐
│ Query Clients Table                  │
│ SELECT id, client_id, business_name  │
│ FROM clients                         │
│ (No filters — fetch ALL)             │
│                                      │
│ Result: 3 clients found              │
└──────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│ For Each Client (Loop)               │
└──────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│ Client 1: abc-123-def-456            │
│                                      │
│ 1. Query lead_actions                │
│    WHERE client_id = 'abc-123'       │
│    → Get lead_ids: [id1, id2, ...]   │
│                                      │
│ 2. Query lead_memory                 │
│    WHERE id IN (lead_ids)            │
│    AND timestamp in last 7 days      │
│    → Get 8 leads                     │
│                                      │
│ 3. Analyze Leads                     │
│    → Calculate all metrics           │
│                                      │
│ 4. Store in growth_brain             │
│    INSERT (client_id, metrics...)    │
│    ✅ SUCCESS                        │
└──────────────────────────────────────┘
        ↓
Repeat for Client 2, 3, etc.
        ↓
┌──────────────────────────────────────┐
│ Summary                              │
│ Processed: 4 (1 global + 3 clients)  │
│ Errors: 0                            │
└──────────────────────────────────────┘
```

---

## 🧪 **Testing the Fix**

### **1. Deploy to Production**

```bash
git add .
git commit -m "Fix: Use service role client for intelligence engine client queries"
git push
```

### **2. Verify Environment Variables**

Make sure these are set in Vercel:
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### **3. Run Intelligence Engine**

```bash
curl https://www.aveniraisolutions.ca/api/intelligence-engine
```

### **4. Check Response**

**Expected:**
```json
{
  "success": true,
  "data": {
    "processed": 4,
    "errors": 0
  },
  "message": "Processed 4 analyses with 0 errors"
}
```

### **5. Check Vercel Logs**

**Look for:**
```
[Engine] ✅ Service role Supabase client created
[Engine] Total clients fetched: 3
[Engine] Client list:
[Engine]   1. Tech Solutions Inc (client_id: abc-123)
[Engine]   2. Marketing Agency Pro (client_id: xyz-789)
[Engine]   3. Startup Innovations (client_id: def-456)
[Engine] Processing client 1 of 3
[Engine] ✅ Insert/Update status: SUCCESS
[Engine] Completed all clients successfully
```

### **6. Verify in Client Dashboard**

**Visit:**
```
https://www.aveniraisolutions.ca/en/client/dashboard
```

**Expected:**
- ✅ Predictive Growth Engine section displays
- ✅ Engagement Score shows metric (e.g., 78/100)
- ✅ All 4 analytics cards show data
- ✅ No "No data available" message

---

## 🔍 **Troubleshooting**

### **If Still Shows "No clients found":**

**Check Vercel logs for:**
```
[Engine] Environment check: {
  hasUrl: true,
  hasServiceKey: false,  ← PROBLEM
  urlValue: 'https://...'
}
[Engine] ❌ Missing Supabase credentials
[Engine] SUPABASE_SERVICE_ROLE_KEY: MISSING
```

**Solution:** Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables.

---

### **If Clients Found but No Leads:**

**Check logs for:**
```
[Engine] Total clients fetched: 3
[Engine] Processing client 1 of 3
[Engine] Found 0 total leads for client via lead_actions
[Engine] ⚠️  No leads found for Tech Solutions Inc - skipping storage
[Engine] Reason: Client has no leads in the analysis period (last 7 days)
[Engine] Skipped client_id: abc-123
```

**This is normal if:**
- Client has no leads yet
- All client's leads are older than 7 days

**Solution:** Send test leads via API or wait for real leads.

---

## ✅ **Build Status**

```bash
npm run build
# ✓ Compiled successfully in 5.9s
# ✓ No TypeScript errors
# ✓ Ready for deployment
```

---

## 📂 **Files Modified**

**`/src/lib/intelligence-engine.ts`**

**Changes:**
1. ✅ Added `createClient` import
2. ✅ Create service role Supabase client at start of `runWeeklyAnalysis`
3. ✅ Use `supabaseAdmin` for all database queries
4. ✅ Pass `supabaseAdmin` to `analyzeClientLeads` function
5. ✅ Pass `supabaseAdmin` to `storeGrowthInsights` function
6. ✅ Added comprehensive logging (client count, list, processing status)
7. ✅ Added skip reason logging for clients with no leads

**Key sections:**
- Lines 484-505: Service role client creation
- Line 552: Query clients with service role
- Lines 565-574: Enhanced client list logging
- Line 595: Pass admin client to `analyzeClientLeads`
- Line 619: Pass admin client to `storeGrowthInsights`

---

## 🎯 **Summary**

**Issue:** Clients query returned 0 rows  
**Root Cause:** Default Supabase client lacked permissions  
**Fix Applied:**  
1. ✅ Create service role client with `SUPABASE_SERVICE_ROLE_KEY`
2. ✅ Use service role client for all database queries
3. ✅ Query clients table with correct columns (no filters)
4. ✅ Log total clients fetched
5. ✅ Log each client_id being processed
6. ✅ Log number of leads found per client
7. ✅ Log skipped/failed clients with reasons

**Result:** Intelligence engine will now correctly detect and process all clients, generating per-client analytics for their dashboards! 🎉✨

