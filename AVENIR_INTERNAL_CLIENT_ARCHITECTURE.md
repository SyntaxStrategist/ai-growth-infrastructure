# 🏗️ Avenir Internal Client — System Architecture

## 📊 Lead Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     LEAD SUBMISSION SOURCES                     │
└────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐      ┌──────────────────────────────┐
│  Marketing Site Form     │      │   External Client API Call   │
│  (aveniraisolutions.ca)  │      │   (Zapier, Direct API)       │
├──────────────────────────┤      ├──────────────────────────────┤
│  ✓ Name                  │      │  ✓ Name                      │
│  ✓ Email                 │      │  ✓ Email                     │
│  ✓ Message               │      │  ✓ Message                   │
│  ✗ NO API Key            │      │  ✓ x-api-key: client_xyz123  │
└──────────┬───────────────┘      └──────────┬───────────────────┘
           │                                  │
           │                                  │
           ▼                                  ▼
┌────────────────────────────────────────────────────────────────┐
│                      POST /api/lead                            │
│                  (Lead Processing Engine)                       │
└────────────────────────────────────────────────────────────────┘
           │                                  │
           │                                  │
     [NO API KEY?]                      [API KEY PRESENT?]
           │                                  │
           ▼                                  ▼
┌──────────────────────────┐      ┌──────────────────────────────┐
│  Internal Lead           │      │  External Client Lead        │
│  clientId =              │      │  clientId =                  │
│  'avenir-internal-client'│      │  <validated-client-id>       │
└──────────┬───────────────┘      └──────────┬───────────────────┘
           │                                  │
           │                                  │
           └──────────────┬───────────────────┘
                          │
                          ▼
         ┌────────────────────────────────────┐
         │      AI Enrichment (GPT-4)         │
         │  ✓ Intent Analysis                 │
         │  ✓ Tone Detection                  │
         │  ✓ Urgency Scoring                 │
         │  ✓ Confidence %                    │
         │  ✓ Summary Generation              │
         └────────────┬───────────────────────┘
                      │
                      ▼
         ┌────────────────────────────────────┐
         │   Store in lead_memory             │
         │   (id, name, email, message, ...)  │
         └────────────┬───────────────────────┘
                      │
                      ▼
         ┌────────────────────────────────────┐
         │   Link in lead_actions             │
         │   (lead_id, client_id, tag)        │
         └────────────┬───────────────────────┘
                      │
                      ▼
         ┌────────────────────────────────────┐
         │   Intelligence Engine (Cron)       │
         │   ✓ Per-client analytics           │
         │   ✓ Relationship insights          │
         │   ✓ Growth predictions             │
         └────────────┬───────────────────────┘
                      │
           ┌──────────┴──────────┐
           │                     │
           ▼                     ▼
┌──────────────────────┐  ┌──────────────────────────┐
│  Admin Dashboard     │  │  Client Dashboard        │
│  /en/dashboard       │  │  /en/client/dashboard    │
├──────────────────────┤  ├──────────────────────────┤
│  Client Filter:      │  │  Shows only:             │
│  ✓ All Clients       │  │  client_id =             │
│  ✓ Avenir AI ⭐      │  │  <logged-in-client>      │
│  ✓ Prime Reno        │  │                          │
│  ✓ RénovPrime        │  │  ✓ Analytics             │
│                      │  │  ✓ Lead table            │
│  Shows:              │  │  ✓ AI insights           │
│  ✓ Filtered leads    │  │  ✓ Conversions           │
│  ✓ Metrics           │  │                          │
│  ✓ AI analytics      │  │                          │
│  ✓ Command Center    │  │                          │
└──────────────────────┘  └──────────────────────────┘
```

---

## 🗄️ Database Schema

### **clients Table**
```sql
CREATE TABLE public.clients (
  id                UUID PRIMARY KEY,
  client_id         TEXT UNIQUE NOT NULL,      -- 'avenir-internal-client'
  business_name     TEXT NOT NULL,             -- 'Avenir AI Solutions'
  name              TEXT NOT NULL,             -- 'Avenir Team'
  email             TEXT UNIQUE NOT NULL,      -- 'info@aveniraisolutions.ca'
  contact_name      TEXT,
  password_hash     TEXT,
  language          TEXT,
  api_key           TEXT UNIQUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  last_login        TIMESTAMPTZ,
  last_connection   TIMESTAMPTZ
);

-- Example Record
INSERT INTO clients VALUES (
  gen_random_uuid(),
  'avenir-internal-client',
  'Avenir AI Solutions',
  'Avenir Team',
  'info@aveniraisolutions.ca',
  'Avenir Team',
  '$2a$10$placeholder',
  'en',
  'internal-avenir-key-do-not-use-externally',
  NOW(),
  NULL,
  NULL
);
```

### **lead_memory Table**
```sql
CREATE TABLE public.lead_memory (
  id                UUID PRIMARY KEY,
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  message           TEXT NOT NULL,
  timestamp         TIMESTAMPTZ DEFAULT NOW(),
  intent            TEXT,
  tone              TEXT,
  urgency           TEXT,
  confidence        NUMERIC,
  summary           TEXT,
  locale            TEXT DEFAULT 'en',
  -- No direct client_id (linked via lead_actions)
);
```

### **lead_actions Table**
```sql
CREATE TABLE public.lead_actions (
  id                UUID PRIMARY KEY,
  lead_id           UUID REFERENCES lead_memory(id),
  client_id         TEXT NOT NULL,              -- Links to clients.client_id
  action_type       TEXT,                       -- 'insert', 'update', 'delete'
  tag               TEXT,                       -- 'New Lead', 'Converted', etc.
  timestamp         TIMESTAMPTZ DEFAULT NOW(),
  conversion_outcome BOOLEAN,
  reversion_reason  TEXT
);

-- Example Link
INSERT INTO lead_actions VALUES (
  gen_random_uuid(),
  '<lead-uuid>',
  'avenir-internal-client',                     -- ⭐ Link to Avenir
  'insert',
  'New Lead',
  NOW(),
  NULL,
  NULL
);
```

---

## 🔑 Client Identification Logic

### **Lead API Route (`/api/lead`)**

```typescript
// Check for API key authentication
const apiKey = req.headers.get('x-api-key');
let clientId: string | null = null;

if (apiKey) {
  // External client request
  const client = await validateApiKey(apiKey);
  
  if (!client) {
    return Response.json(
      { success: false, error: "Unauthorized: Invalid API key" },
      { status: 401 }
    );
  }
  
  clientId = client.client_id;
  console.log(`[LeadAPI] External client: ${client.business_name}`);
  
} else {
  // Internal marketing site request
  // NO API KEY → AVENIR LEAD ⭐
  clientId = 'avenir-internal-client';
  console.log('[LeadAPI] Internal lead → Avenir AI Solutions');
}

// Process lead with clientId...
await upsertLeadWithHistory({...leadData}, clientId);
```

---

## 📊 Admin Dashboard — Client Filter

### **Dropdown Options**

```typescript
interface ClientOption {
  value: string | null;
  label: string;
}

const clients = [
  { value: null, label: "All Clients" },          // Default
  { value: "avenir-internal-client", label: "Avenir AI Solutions ⭐" },
  { value: "client-abc-123", label: "Prime Reno Solutions" },
  { value: "client-def-456", label: "Solutions RénovPrime" },
  // ... dynamically loaded from Supabase
];
```

### **Filtering Logic**

```typescript
const fetchLeads = async (clientId: string | null) => {
  let url = '/api/leads?status=active';
  
  if (clientId) {
    // Filter by specific client
    url += `&clientId=${clientId}`;
  }
  // If clientId is null, fetch ALL clients
  
  const response = await fetch(url);
  const data = await response.json();
  return data.leads;
};
```

### **API Endpoint (`/api/leads`)**

```typescript
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId');
  
  let query = supabase
    .from('lead_memory')
    .select(`
      *,
      lead_actions!inner(client_id, tag, action_type)
    `);
  
  if (clientId) {
    // Filter by specific client
    query = query.eq('lead_actions.client_id', clientId);
  }
  // Otherwise, return all leads from all clients
  
  const { data, error } = await query.order('timestamp', { ascending: false });
  
  return Response.json({ success: true, leads: data });
}
```

---

## 🎯 Use Case Examples

### **1. View All Avenir Marketing Leads**

**Steps:**
1. Go to admin dashboard: `/en/dashboard`
2. Client Filter → Select "Avenir AI Solutions"
3. See all leads from `aveniraisolutions.ca`

**SQL Query (Behind the Scenes):**
```sql
SELECT lm.*, la.client_id, la.tag
FROM lead_memory lm
INNER JOIN lead_actions la ON la.lead_id = lm.id
WHERE la.client_id = 'avenir-internal-client'
ORDER BY lm.timestamp DESC;
```

---

### **2. Compare Avenir vs. External Client Performance**

**Steps:**
1. View "All Clients" → See global metrics:
   - Total Leads: 45
   - Average Confidence: 78%
   - Conversion Rate: 12%

2. Filter "Avenir AI Solutions" → See Avenir metrics:
   - Total Leads: 23
   - Average Confidence: 82%
   - Conversion Rate: 15%

3. Filter "Prime Reno Solutions" → See client metrics:
   - Total Leads: 12
   - Average Confidence: 71%
   - Conversion Rate: 8%

**Insight:**
- ✅ Avenir's marketing site has higher quality leads
- ✅ Higher confidence scores and conversion rates
- 📊 Data-driven decisions for marketing optimization

---

### **3. Generate AI Insights for Avenir Leads Only**

**Steps:**
1. Filter by "Avenir AI Solutions"
2. Click "Generate Fresh Summary" in Growth Copilot
3. AI analyzes only Avenir leads:
   - Top Intent: "Partnership inquiry" (35%)
   - Dominant Tone: "Professional" (68%)
   - Urgency Distribution: High (40%), Medium (45%), Low (15%)
4. Growth Copilot generates tailored insights

**API Call:**
```typescript
POST /api/intelligence-engine
{
  "clientId": "avenir-internal-client"
}
```

---

### **4. Track Converted Marketing Leads**

**Steps:**
1. Go to "Converted Leads" tab
2. Filter by "Avenir AI Solutions"
3. See which marketing leads converted
4. Analyze conversion patterns:
   - Which intents convert best?
   - What urgency levels convert?
   - Which message tones convert?

**Result:**
- 📊 Data-driven marketing optimization
- 🎯 Focus on high-converting lead types
- ✅ ROI tracking for marketing campaigns

---

## 🔐 Security & Permissions

### **API Key Differences**

| Client Type | API Key | Purpose |
|-------------|---------|---------|
| **Avenir Internal** | `internal-avenir-key-do-not-use-externally` | Placeholder only, NOT for external use |
| **External Clients** | `client_abc123xyz...` | Authenticates API calls, links leads |

### **Row Level Security (RLS)**

```sql
-- Clients can only view their own leads
CREATE POLICY "clients_view_own_leads" ON lead_actions
  FOR SELECT
  USING (auth.uid() = client_id OR auth.role() = 'service_role');

-- Admin can view all leads
CREATE POLICY "admin_view_all_leads" ON lead_actions
  FOR SELECT
  USING (auth.role() = 'service_role');
```

---

## 🚀 Deployment Checklist

- [x] SQL migration created (`add_avenir_internal_client.sql`)
- [x] Setup script created (`setup-avenir-internal-client.sh`)
- [x] Lead API updated to link internal leads
- [x] Admin dashboard has Client Filter
- [x] Intelligence engine processes per-client analytics
- [x] Growth Copilot filters by client
- [ ] **Run setup script to create Avenir record**
- [ ] **Test lead submission from marketing site**
- [ ] **Verify admin dashboard shows Avenir in filter**
- [ ] **Deploy to production**

---

## ✅ Summary

**Architecture:**
- ✅ Two lead sources: Marketing site (internal) + External clients (API)
- ✅ Automatic client linkage based on API key presence
- ✅ Unified lead storage in `lead_memory`
- ✅ Client linkage in `lead_actions`
- ✅ Per-client filtering in admin dashboard

**Result:**
- ✅ Full visibility into first-party marketing leads
- ✅ Side-by-side comparison with external client leads
- ✅ Data-driven insights for marketing optimization
- ✅ ROI tracking and conversion analysis

**Ready to deploy!** 🚀

---

**Generated:** October 16, 2025  
**Feature:** Internal Client Architecture  
**Status:** Complete & Documented

