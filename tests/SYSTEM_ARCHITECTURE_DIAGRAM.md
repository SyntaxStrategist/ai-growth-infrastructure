# 🏗️ Avenir AI Solutions — System Architecture Diagram

**Version:** 2.0.0  
**Last Updated:** October 17, 2025  

---

## 🎯 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AVENIR AI PLATFORM                          │
│                    (Next.js 15 + React 19)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   PUBLIC     │    │   CLIENT     │    │    ADMIN     │
│   SITE       │    │    AREA      │    │    AREA      │
│  /[locale]/  │    │ /client/*    │    │  /admin/*    │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                    │
       │ LanguageToggle    │ UniversalToggle    │ UniversalToggle
       │                   │                    │
       ▼                   ▼                    ▼
┌──────────────────────────────────────────────────────┐
│                  API LAYER                           │
│              /api/* endpoints                        │
└──────────────┬───────────────────────────────────────┘
               │
               ├─→ /api/chat (OpenAI GPT-4o-mini)
               ├─→ /api/lead (AI Enrichment + Email)
               ├─→ /api/client/* (Auth, Settings, Leads)
               ├─→ /api/admin/* (Dashboard, Analytics)
               └─→ /api/prospect-intelligence/*
               │
               ▼
┌──────────────────────────────────────────────────────┐
│              SUPABASE (PostgreSQL)                   │
│  • clients                                           │
│  • lead_memory                                       │
│  • lead_actions                                      │
│  • prospect_candidates                               │
│  • growth_insights                                   │
│  • growth_brain                                      │
│  • prospect_outreach_log                             │
└──────────────────────────────────────────────────────┘
```

---

## 🔄 Lead Processing Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Lead Submission                                    │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ POST /api/lead
                         │ Headers: x-api-key
                         │ Body: { name, email, message }
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Authentication & Validation                        │
│  • Validate API key → Get client_id                         │
│  • Check if lead exists (by email)                          │
│  • Detect is_test flag                                      │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: AI Enrichment (if new lead)                        │
│  • OpenAI GPT-4o-mini analysis                              │
│  • Extract: intent, tone, urgency                           │
│  • Generate: AI summary                                     │
│  • Calculate: confidence score                              │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Database Operations                                │
│  • Upsert to lead_memory (create or update)                 │
│  • Insert to lead_actions (history entry)                   │
│  • Update client.last_connection                            │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Fetch Client Settings                              │
│  • Get: industry, service, tone, tagline                    │
│  • Get: booking_link, followup_speed                        │
│  • Get: SMTP credentials (if configured)                    │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: Build Personalized Email                           │
│  • Use client's tone (Friendly, Professional, etc.)         │
│  • Include industry + service mentions                      │
│  • Add booking link CTA (if available)                      │
│  • Include custom tagline                                   │
│  • Generate in correct language (en/fr)                     │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 7: Send Email                                         │
│  • Development: Log email (skip send)                       │
│  • Production: Send via Gmail API or SMTP                   │
│  • From: client's email or relay                            │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 8: Real-Time Dashboard Update                         │
│  • Client dashboard shows new lead                          │
│  • Admin dashboard (if filtered to client)                  │
│  • Growth Copilot updates                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

### **Client Authentication**

```
┌──────────────────┐
│  Client Signup   │
│  /client/signup  │
└────────┬─────────┘
         │ POST /api/client/register
         │ { businessName, email, password, ... }
         ▼
┌─────────────────────────────────────┐
│  1. Validate email uniqueness       │
│  2. Hash password (bcryptjs)        │
│  3. Generate client_id (UUID)       │
│  4. Generate api_key (crypto)       │
│  5. Detect is_test flag             │
│  6. Insert to clients table         │
│  7. Send welcome email              │
└────────┬────────────────────────────┘
         │ Returns: { success, clientId, apiKey }
         ▼
┌──────────────────┐
│  Auto-Login      │
│  Session stored  │
│  in localStorage │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Client Dashboard │
└──────────────────┘
```

### **Admin Authentication**

```
┌──────────────────┐
│  Admin Login     │
│  /admin/login    │
└────────┬─────────┘
         │ POST /api/auth-dashboard
         │ { password }
         ▼
┌─────────────────────────────────────┐
│  1. Compare with ADMIN_PASSWORD     │
│  2. Generate session token          │
│  3. Store in localStorage           │
└────────┬────────────────────────────┘
         │ Returns: { success, token }
         ▼
┌──────────────────┐
│ Admin Dashboard  │
│  Command Center  │
└──────────────────┘
```

---

## 🌐 Bilingual System Flow

```
┌────────────────────────────────────────────────────────────┐
│  User visits: /client/login (no locale)                    │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│  Middleware (src/middleware.ts)                            │
│  1. Check for avenir_language cookie                       │
│  2. Check Accept-Language header                           │
│  3. Default to 'en'                                        │
└────────────────┬───────────────────────────────────────────┘
                 │ Detected: 'fr'
                 ▼
┌────────────────────────────────────────────────────────────┐
│  Redirect to: /fr/client/login                             │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│  [locale]/layout.tsx                                       │
│  1. Extract locale from URL                                │
│  2. Validate locale (en/fr)                                │
│  3. Load messages from messages/{locale}.json              │
│  4. Wrap in NextIntlClientProvider                         │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│  Page renders with correct translations                    │
│  • All t() calls resolve to French                         │
│  • UniversalLanguageToggle shows FR as active              │
└────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Relationships

```
                    ┌──────────────┐
                    │   clients    │
                    │ (client_id)  │
                    └──────┬───────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
        ┌──────────────┐      ┌──────────────┐
        │ lead_memory  │      │growth_insights│
        │  (client_id) │      │  (client_id)  │
        └──────┬───────┘      └───────────────┘
               │
               │ FK: lead_id
               ▼
        ┌──────────────┐
        │ lead_actions │
        │   (lead_id)  │
        │  (client_id) │
        └──────────────┘

        ┌────────────────────┐
        │ prospect_candidates│ (Independent)
        └─────────┬──────────┘
                  │ FK: prospect_id
                  ▼
        ┌────────────────────┐
        │prospect_outreach_log│
        └────────────────────┘
```

---

## 🔧 Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                    AVENIR AI PLATFORM                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Supabase   │    │   OpenAI     │    │    Gmail     │
│  PostgreSQL  │    │ GPT-4o-mini  │    │     API      │
│   + RLS      │    │              │    │   + SMTP     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Real-time DB │    │ AI Enrichment│    │ Email Sender │
│ Subscriptions│    │ • Intent     │    │ Personalized │
│ Row Level    │    │ • Tone       │    │ Templates    │
│ Security     │    │ • Urgency    │    │ Bilingual    │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 🌊 User Journey Map

### **New Client Onboarding**

```
1. Visit homepage (/en or /fr)
   ↓
2. Click "Sign Up" or navigate to /client/signup
   ↓
3. Fill signup form (10+ fields)
   ↓
4. Submit → API key generated
   ↓
5. Welcome email sent
   ↓
6. Auto-redirect to dashboard
   ↓
7. See personalization settings
   ↓
8. View API integration docs
   ↓
9. Integrate API key into website
   ↓
10. Leads start flowing → Dashboard populates
```

### **Lead Journey**

```
1. Visitor fills contact form on client's website
   ↓
2. Form submits to /api/lead (with x-api-key)
   ↓
3. AI analyzes: intent, tone, urgency
   ↓
4. Lead saved to database
   ↓
5. Personalized email sent to visitor
   ↓
6. Lead appears in client dashboard
   ↓
7. Client tags lead (Active, Follow-Up, etc.)
   ↓
8. Lead converted → Moved to Converted tab
   ↓
9. Analytics updated in Growth Engine
```

### **Prospect Discovery Journey**

```
1. Admin clicks "Run Prospect Scan"
   ↓
2. Crawler discovers businesses
   ↓
3. Analyzer tests contact forms
   ↓
4. Scorer calculates automation need
   ↓
5. Prospects saved to database
   ↓
6. High-priority prospects identified (score >= 70)
   ↓
7. Outreach emails generated
   ↓
8. Admin reviews in Prospect Intelligence dashboard
```

---

## 🎨 Component Hierarchy

```
Root Layout (app/layout.tsx)
│
└─→ [locale] Layout (app/[locale]/layout.tsx)
    │ • NextIntlClientProvider
    │ • Message loading (en/fr)
    │
    ├─→ Public Page (page.tsx)
    │   ├─→ LanguageToggle
    │   ├─→ AvenirLogo
    │   ├─→ BridgeAnimation
    │   └─→ Chat + Lead Forms
    │
    ├─→ Client Area
    │   ├─→ /client/signup
    │   │   └─→ UniversalLanguageToggle
    │   ├─→ /client/login
    │   │   └─→ UniversalLanguageToggle
    │   ├─→ /client/dashboard
    │   │   ├─→ UniversalLanguageToggle
    │   │   ├─→ PredictiveGrowthEngine
    │   │   ├─→ RelationshipInsights
    │   │   └─→ GrowthCopilot
    │   ├─→ /client/settings
    │   │   ├─→ UniversalLanguageToggle
    │   │   └─→ Email Preview
    │   └─→ /client/api-access
    │       └─→ UniversalLanguageToggle
    │
    └─→ Admin Area
        ├─→ /admin/login
        │   └─→ UniversalLanguageToggle
        ├─→ /dashboard (main)
        │   ├─→ UniversalLanguageToggle
        │   ├─→ Command Center (Client Filter)
        │   ├─→ Metrics Summary
        │   ├─→ PredictiveGrowthEngine
        │   └─→ Lead Management Tabs
        ├─→ /admin/settings
        │   ├─→ UniversalLanguageToggle
        │   └─→ Client Selector
        └─→ /admin/prospect-intelligence
            ├─→ UniversalLanguageToggle
            ├─→ Scan Configuration
            └─→ Prospect Table
```

---

## 🔒 Security Architecture

```
┌────────────────────────────────────────────────────────────┐
│  LAYER 1: Frontend Security                                │
│  • Client-side validation                                  │
│  • Session storage (localStorage)                          │
│  • HTTPS only (production)                                 │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│  LAYER 2: API Authentication                               │
│  • API Key validation (clients)                            │
│  • Password hash comparison (admin)                        │
│  • Session token validation                                │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│  LAYER 3: Database Security                                │
│  • Row Level Security (RLS)                                │
│  • Client data isolation (client_id scoping)               │
│  • Service role key (admin only)                           │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│  LAYER 4: Environment Protection                           │
│  • .env.local (not committed)                              │
│  • .gitignore protection                                   │
│  • Vercel environment variables                            │
└────────────────────────────────────────────────────────────┘
```

---

## 📡 API Request Flow

### **Authenticated Client Request**

```
Client Browser
    │
    │ 1. User submits lead form on their website
    │
    ▼
┌────────────────────────────────────┐
│  POST /api/lead                    │
│  Headers:                          │
│    x-api-key: abc123...            │
│  Body:                             │
│    { name, email, message }        │
└────────────────┬───────────────────┘
                 │
                 │ 2. Validate API key
                 ▼
┌────────────────────────────────────┐
│  Supabase Query:                   │
│  SELECT * FROM clients             │
│  WHERE api_key = 'abc123...'       │
└────────────────┬───────────────────┘
                 │
                 │ 3. Found client_id
                 ▼
┌────────────────────────────────────┐
│  Process lead:                     │
│  • AI enrichment                   │
│  • Database insert                 │
│  • Email generation                │
└────────────────┬───────────────────┘
                 │
                 │ 4. Return response
                 ▼
┌────────────────────────────────────┐
│  Response:                         │
│  {                                 │
│    success: true,                  │
│    lead_id: "uuid",                │
│    enrichment: { ... }             │
│  }                                 │
└────────────────────────────────────┘
```

---

## 🧠 AI Intelligence Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Lead Message Input                                         │
│  "I need urgent help with marketing automation"             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  OpenAI GPT-4o-mini Analysis                                │
│  Model: gpt-4o-mini                                         │
│  Prompt: Extract intent, tone, urgency, generate summary    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  AI Response (JSON):                                        │
│  {                                                          │
│    "intent": "Marketing automation consultation",          │
│    "tone": "Professional and direct",                      │
│    "urgency": "High",                                      │
│    "ai_summary": "Business inquiry for marketing tools",   │
│    "confidence_score": 0.92                                │
│  }                                                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Stored in lead_memory                                      │
│  • Used in dashboard analytics                              │
│  • Displayed in Predictive Growth Engine                    │
│  • Triggers personalized email template                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Real-Time Updates

```
┌─────────────────────────────────────────────────────────────┐
│  New lead created in lead_memory                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase Real-Time Subscription                            │
│  Channel: public:lead_memory                                │
│  Filter: client_id = xxx                                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Client Dashboard (useEffect listener)                      │
│  • Receives INSERT event                                    │
│  • Updates leads state                                      │
│  • Re-renders lead list                                     │
│  • Updates analytics cards                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Scalability Design

```
┌─────────────────────────────────────────────────────────────┐
│  Multi-Tenant Architecture                                  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Client A    │    │  Client B    │    │  Client C    │
│ (client_id)  │    │ (client_id)  │    │ (client_id)  │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                    │
       │ Isolated          │ Isolated           │ Isolated
       ▼                   ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Leads (A)    │    │ Leads (B)    │    │ Leads (C)    │
│ Settings (A) │    │ Settings (B) │    │ Settings (C) │
│ Analytics(A) │    │ Analytics(B) │    │ Analytics(C) │
└──────────────┘    └──────────────┘    └──────────────┘

Admin Dashboard (Command Center)
    │
    ├─→ Filter: "All Clients" → See all leads
    ├─→ Filter: "Client A" → See only Client A's leads
    └─→ Filter: "Client B" → See only Client B's leads
```

---

## 🎯 Testing Coverage Map

```
┌─────────────────────────────────────────────────────────────┐
│  TESTED COMPONENTS                                          │
└─────────────────────────────────────────────────────────────┘

✅ Public Site
   └─→ Homepage (EN + FR)
   └─→ Chat Assistant
   └─→ Lead Form

✅ Client Area (5 pages)
   ├─→ Signup (EN + FR)
   ├─→ Login
   ├─→ Dashboard
   ├─→ Settings
   └─→ API Access

✅ Admin Area (5 pages)
   ├─→ Login
   ├─→ Dashboard (Command Center)
   ├─→ Settings
   ├─→ Prospect Intelligence
   └─→ Insights

✅ API Endpoints (14+ tested)
   ├─→ Client registration
   ├─→ Client authentication
   ├─→ Lead submission
   ├─→ Settings management
   ├─→ Prospect intelligence
   └─→ Language updates

✅ Background Features
   ├─→ AI enrichment
   ├─→ Email automation
   ├─→ Smart redirects
   ├─→ Language toggle
   └─→ Real-time updates
```

---

**End of Architecture Diagram**

*For detailed component documentation, see `AVENIR_AI_SYSTEM_BLUEPRINT.md`*

