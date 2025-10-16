# 🏗️ Avenir AI Solutions — System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         AVENIR AI SOLUTIONS                                   │
│                    Complete System Architecture                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                              PUBLIC ROUTES                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  /[en|fr]                          → Landing Page (Marketing)              │
│  /[en|fr]/client/signup            → Client Registration Form              │
│  /[en|fr]/client/dashboard         → Client Login + Dashboard              │
│  /[en|fr]/client/api-access        → API Integration Guide                 │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                           ADMIN ROUTES (Private)                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  /[en|fr]/dashboard                → Admin Dashboard (All Leads)           │
│  /[en|fr]/dashboard/insights       → Predictive Growth Insights            │
│  /[en|fr]/dashboard/clients        → Client Management (Future)            │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                               API ROUTES                                    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  POST /api/lead                    → Submit Lead (Public/API Key)          │
│  POST /api/client/register         → Create Client Account                 │
│  POST /api/client/auth             → Client Login                          │
│  GET  /api/client/leads            → Fetch Client Leads                    │
│  GET  /api/leads                   → Fetch All Leads (Admin)               │
│  POST /api/auth-dashboard          → Admin Authentication                  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW DIAGRAM                                 │
└────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐
   │   CLIENT    │
   │  BUSINESS   │
   └──────┬──────┘
          │
          │ 1. Signup
          ▼
   ┌─────────────────┐
   │ /client/signup  │
   └──────┬──────────┘
          │
          │ 2. POST /api/client/register
          ▼
   ┌──────────────────────────────┐
   │  Generate API Key + Hash PW  │
   │  client_abc123...            │
   └──────┬───────────────────────┘
          │
          │ 3. Store in Database
          ▼
   ┌──────────────────────────────┐
   │   Supabase: clients table    │
   │   - id, client_id, api_key   │
   │   - business_name, email     │
   │   - password_hash, language  │
   └──────┬───────────────────────┘
          │
          │ 4. Send Welcome Email
          ▼
   ┌──────────────────────────────┐
   │   Gmail API (EN/FR)          │
   │   Contains: Dashboard URL    │
   │             API Key          │
   │             API Endpoint     │
   └──────┬───────────────────────┘
          │
          │ 5. Client Receives Credentials
          │
          ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                  CLIENT API INTEGRATION                      │
   ├─────────────────────────────────────────────────────────────┤
   │                                                              │
   │  Client System (CRM/Website)                                │
   │       │                                                      │
   │       │ POST /api/lead                                      │
   │       │ Headers: x-api-key: client_abc123...               │
   │       │ Body: {name, email, message}                        │
   │       ▼                                                      │
   │  ┌─────────────────────────┐                               │
   │  │  API Key Validation     │                               │
   │  │  - Verify x-api-key     │                               │
   │  │  - Get client_id        │                               │
   │  │  - Update last_conn     │                               │
   │  └──────────┬──────────────┘                               │
   │             │                                                │
   │             │ Valid Key                                     │
   │             ▼                                                │
   │  ┌─────────────────────────┐                               │
   │  │   AI Enrichment         │                               │
   │  │   (GPT-4o-mini)         │                               │
   │  │   - Intent Analysis     │                               │
   │  │   - Tone Detection      │                               │
   │  │   - Urgency Level       │                               │
   │  │   - Confidence Score    │                               │
   │  └──────────┬──────────────┘                               │
   │             │                                                │
   │             │ Enriched Data                                 │
   │             ▼                                                │
   │  ┌─────────────────────────────────┐                       │
   │  │   Store in lead_memory          │                       │
   │  │   WITH client_id                │                       │
   │  │   - email, name, message        │                       │
   │  │   - ai_summary, intent, tone    │                       │
   │  │   - urgency, confidence_score   │                       │
   │  │   - client_id (from API key)    │                       │
   │  └──────────┬──────────────────────┘                       │
   │             │                                                │
   │             │ Success                                       │
   │             ▼                                                │
   │        200 OK                                               │
   │                                                              │
   └──────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT DASHBOARD VIEW                             │
└────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────┐
   │   Client Logs In        │
   │   (email + password)    │
   └───────────┬─────────────┘
               │
               │ POST /api/client/auth
               ▼
   ┌─────────────────────────┐
   │   Verify Credentials    │
   │   (bcrypt compare)      │
   └───────────┬─────────────┘
               │
               │ Valid
               ▼
   ┌──────────────────────────────────────────────┐
   │     /client/dashboard                        │
   │                                               │
   │  GET /api/client/leads?clientId=<uuid>      │
   │                                               │
   │  SELECT * FROM lead_memory                   │
   │  WHERE client_id = <current_client>         │
   │    AND deleted = false                       │
   │    AND archived = false                      │
   │  ORDER BY timestamp DESC                     │
   │                                               │
   └───────────┬──────────────────────────────────┘
               │
               │ Display:
               ▼
   ┌──────────────────────────────────────────────┐
   │  📊 Stats:                                    │
   │     - Total Leads: 47                        │
   │     - Avg Confidence: 87%                    │
   │     - Top Intent: Partnership                │
   │     - High Urgency: 12                       │
   │                                               │
   │  📋 Recent Leads Table:                      │
   │     Name | Email | Message | Intent | ...    │
   │     -----|-------|---------|--------|----     │
   │     John | j@... | I want...| Consul...      │
   │     Jane | j@... | Looking...| Partner...    │
   │                                               │
   └───────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                            ADMIN DASHBOARD VIEW                             │
└────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────┐
   │   Admin Enters Password │
   └───────────┬─────────────┘
               │
               │ POST /api/auth-dashboard
               ▼
   ┌─────────────────────────┐
   │   Verify Password       │
   └───────────┬─────────────┘
               │
               │ Valid
               ▼
   ┌──────────────────────────────────────────────┐
   │     /dashboard                                │
   │                                               │
   │  GET /api/leads?limit=100&locale=en          │
   │                                               │
   │  SELECT * FROM lead_memory                   │
   │  WHERE deleted = false                       │
   │    AND archived = false                      │
   │  ORDER BY timestamp DESC                     │
   │  LIMIT 100                                   │
   │                                               │
   └───────────┬──────────────────────────────────┘
               │
               │ Display:
               ▼
   ┌──────────────────────────────────────────────┐
   │  📊 Global Stats (All Clients):               │
   │     - Total Leads: 1,247                     │
   │     - Avg Confidence: 83%                    │
   │     - Top Intent: Consultation               │
   │     - High Urgency: 89                       │
   │                                               │
   │  📋 All Leads Table:                         │
   │     Name | Email | Intent | client_id | ...  │
   │     -----|-------|--------|-----------|----   │
   │     John | j@... | Consul...| abc123 |...    │
   │     Jane | j@... | Partner...| def456 |...   │
   │                                               │
   │  🎯 Predictive Growth Engine                 │
   │  📊 Relationship Insights                    │
   │  🧠 Growth Copilot                           │
   │                                               │
   └───────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA                                   │
└────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────┐         ┌─────────────────────────┐
   │     clients             │         │     lead_memory         │
   ├─────────────────────────┤         ├─────────────────────────┤
   │  id (UUID)              │         │  id (UUID)              │
   │  client_id (TEXT)       │◄────────│  client_id (TEXT)       │
   │  business_name (TEXT)   │         │  name (TEXT)            │
   │  contact_name (TEXT)    │         │  email (TEXT)           │
   │  email (TEXT)           │         │  message (TEXT)         │
   │  password_hash (TEXT)   │         │  ai_summary (TEXT)      │
   │  api_key (TEXT)         │         │  intent (TEXT)          │
   │  language (TEXT)        │         │  tone (TEXT)            │
   │  created_at (TIMESTAMPTZ│         │  urgency (TEXT)         │
   │  last_login (TIMESTAMPTZ│         │  confidence_score (FLOAT│
   │  last_connection (TSTZ) │         │  timestamp (TIMESTAMPTZ)│
   │  is_active (BOOLEAN)    │         │  deleted (BOOLEAN)      │
   └─────────────────────────┘         │  archived (BOOLEAN)     │
                                       │  relationship_insight   │
                                       └─────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY LAYERS                                │
└────────────────────────────────────────────────────────────────────────────┘

   1. Password Security
      └─ bcrypt hashing (10 rounds)

   2. API Key Validation
      └─ x-api-key header required for external leads
      └─ Validated against clients table

   3. Data Isolation
      └─ RLS policies on clients table
      └─ Client dashboard: WHERE client_id = current_client
      └─ Admin dashboard: Full access

   4. Session Management
      └─ localStorage (client sessions)
      └─ Admin password in env (ADMIN_PASSWORD)

   5. Timestamps
      └─ last_login (client auth)
      └─ last_connection (API usage)

┌────────────────────────────────────────────────────────────────────────────┐
│                           BILINGUAL SUPPORT                                 │
└────────────────────────────────────────────────────────────────────────────┘

   Routes:
   └─ /en/* → English
   └─ /fr/* → Français

   Translations:
   └─ Page labels, buttons, headings
   └─ Intent translation (FR → EN)
   └─ Welcome emails (EN/FR)
   └─ Error messages
   └─ Dashboard stats labels

   AI Analysis:
   └─ Detects input language automatically
   └─ Generates summary in detected language
   └─ Intent/tone/urgency in appropriate language

┌────────────────────────────────────────────────────────────────────────────┐
│                              COMPLETE FLOW                                  │
└────────────────────────────────────────────────────────────────────────────┘

   1. Client Signup → Account Created → Email Sent
   2. Client Receives Welcome Email → Credentials Provided
   3. Client Logs In → Private Dashboard Accessed
   4. Client Integrates API → Sends Leads via x-api-key
   5. Lead Processed → AI Enrichment → Stored with client_id
   6. Client Checks Dashboard → Sees Only Their Leads
   7. Admin Checks Dashboard → Sees All Leads (All Clients)

   ✅ Complete Isolation
   ✅ Secure Authentication
   ✅ Bilingual Throughout
   ✅ Professional UI
   ✅ Real-time AI Analysis
   ✅ Scalable Architecture

┌────────────────────────────────────────────────────────────────────────────┐
│                              READY FOR PRODUCTION                           │
└────────────────────────────────────────────────────────────────────────────┘
