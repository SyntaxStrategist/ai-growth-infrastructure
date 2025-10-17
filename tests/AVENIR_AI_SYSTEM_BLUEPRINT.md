# 🏗️ Avenir AI Solutions — System Blueprint

**Version:** 2.0.0  
**Last Updated:** October 17, 2025  
**Status:** Production Ready  

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Modules](#architecture-modules)
3. [API Endpoints](#api-endpoints)
4. [Frontend Pages](#frontend-pages)
5. [Database Schema](#database-schema)
6. [Data Flow](#data-flow)
7. [Integrations](#integrations)
8. [Key Features](#key-features)

---

## 🎯 System Overview

**Avenir AI Solutions** is a complete bilingual (EN/FR) AI growth infrastructure platform that:

- ✅ Captures and enriches leads with AI intelligence
- ✅ Provides personalized automated email responses
- ✅ Enables client-specific dashboard analytics
- ✅ Discovers and scores potential prospects autonomously
- ✅ Supports multi-tenant architecture with API key authentication
- ✅ Offers admin command center for global oversight

**Technology Stack:**
- **Frontend:** Next.js 15.5.4, React 19, TailwindCSS, Framer Motion
- **Backend:** Next.js API Routes (Edge Runtime)
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI GPT-4o-mini
- **Email:** Gmail API + SMTP
- **Internationalization:** next-intl
- **Authentication:** bcryptjs, API Keys, Session Storage
- **Testing:** Playwright, Custom E2E Scripts

---

## 🧩 Architecture Modules

### 1️⃣ **Public Marketing Site**
- **Location:** `/[locale]/page.tsx`
- **Features:**
  - Bilingual hero section with animated logo
  - Infrastructure framework cards (4 pillars)
  - Live AI assistant demo
  - Lead capture form with AI enrichment
  - Bridge animation showing AI flow
- **Language Toggle:** Original `LanguageToggle` component
- **Routes:** `/en`, `/fr`

### 2️⃣ **Client Area**
- **Location:** `/[locale]/client/*`
- **Features:**
  - Signup with personalization fields (industry, service, tone, etc.)
  - Login with session management
  - Dashboard with AI analytics (mirrored from admin)
  - Settings page with email template preview
  - API access page with integration docs
- **Language Toggle:** `UniversalLanguageToggle` (top-right, z-60)
- **Routes:**
  - `/[locale]/client/signup`
  - `/[locale]/client/login`
  - `/[locale]/client/dashboard`
  - `/[locale]/client/settings`
  - `/[locale]/client/api-access`

### 3️⃣ **Admin Area**
- **Location:** `/[locale]/admin/*` and `/[locale]/dashboard/*`
- **Features:**
  - Command Center with client filtering
  - Global lead analytics and management
  - Predictive Growth Engine
  - Lead tagging (Active, Follow-Up, Converted, Archived, Deleted)
  - Admin settings for managing client preferences
  - Prospect Intelligence dashboard
- **Language Toggle:** `UniversalLanguageToggle` (top-right, z-60)
- **Routes:**
  - `/[locale]/admin/login`
  - `/[locale]/dashboard` (main admin dashboard)
  - `/[locale]/admin/settings`
  - `/[locale]/admin/prospect-intelligence`
  - `/[locale]/dashboard/insights`
  - `/[locale]/dashboard/clients`

### 4️⃣ **Personalized Email Automation**
- **Location:** `/lib/personalized-email.ts`
- **Features:**
  - Client-specific email templates
  - Dynamic tone (Friendly, Professional, Formal, Casual)
  - Industry and service mentions
  - Booking link integration
  - Custom tagline support
  - Bilingual email generation
  - SMTP integration (client's own email server)
- **Trigger:** Automatic on new lead creation via `/api/lead`

### 5️⃣ **Prospect Intelligence Module**
- **Location:** `/prospect-intelligence/*`
- **Features:**
  - Autonomous prospect discovery (simulated Google Search)
  - Contact form testing and response time measurement
  - Automation need scoring (0-100)
  - Outreach email generation
  - High-priority prospect filtering
  - Admin dashboard integration
- **API Routes:**
  - `/api/prospect-intelligence/scan`
  - `/api/prospect-intelligence/prospects`

### 6️⃣ **AI Intelligence Engine**
- **Location:** `/lib/ai-enrichment.ts`, `/api/intelligence-engine/*`
- **Features:**
  - Lead intent detection
  - Tone analysis (Professional, Friendly, Urgent, etc.)
  - Urgency scoring (High, Medium, Low)
  - Confidence scoring (0-1)
  - AI summary generation
  - Relationship insights
  - Growth predictions
- **Trigger:** 
  - On demand via dashboard button
  - Daily cron job at 03:00 UTC

### 7️⃣ **Smart Redirect System**
- **Location:** `/src/middleware.ts`
- **Features:**
  - Auto-redirects base routes to locale-prefixed routes
  - 3-tier locale detection (cookie → browser → default)
  - 11 shortcut URLs supported
  - Cookie-based preference storage
- **Example:** `/client/login` → `/en/client/login` or `/fr/client/login`

### 8️⃣ **Universal Language Toggle**
- **Location:** `/src/components/UniversalLanguageToggle.tsx`
- **Features:**
  - Fixed top-right positioning (z-60)
  - 18px font, purple glow on active
  - Triple persistence (localStorage + Supabase + cookie)
  - Hover tooltip
  - Toast notifications
  - Only active on `/client/*` and `/admin/*` pages

---

## 🔌 API Endpoints

### **Public Endpoints**

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/api/chat` | POST | AI assistant chat completion | None |
| `/api/lead` | POST | Lead submission with AI enrichment | x-api-key (optional) |

### **Client Endpoints**

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/api/client/register` | POST | Client signup | None |
| `/api/client/auth` | POST | Client login | Email + Password |
| `/api/client/leads` | GET | Fetch client-scoped leads | Session |
| `/api/client/settings` | GET, PUT | Get/update client settings | clientId query param |
| `/api/client/update-language` | PUT | Update client language | clientId |

### **Admin Endpoints**

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/api/auth-dashboard` | POST | Admin login | ADMIN_PASSWORD |
| `/api/leads` | GET | Fetch all leads (global or filtered) | Admin session |
| `/api/leads/archived` | GET | Fetch archived leads | Admin session |
| `/api/leads/deleted` | GET | Fetch deleted leads | Admin session |
| `/api/leads/insights` | GET | Fetch relationship insights | Admin session |
| `/api/lead-actions` | GET, POST | Lead tagging and actions | Admin/Client session |
| `/api/clients` | GET | Fetch all clients | Admin session |

### **Intelligence & Automation Endpoints**

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/api/intelligence-engine` | POST | Generate AI analytics | Admin session |
| `/api/intelligence-engine/cron` | GET | Daily analytics refresh | Vercel Cron |
| `/api/growth-insights` | GET | Fetch growth insights | Admin session |
| `/api/insights` | GET | Fetch AI-generated insights | Admin session |
| `/api/prospect-intelligence/scan` | POST | Run prospect discovery scan | Admin session |
| `/api/prospect-intelligence/prospects` | GET | Fetch prospect candidates | Admin session |

### **Utility Endpoints**

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/api/rotate-key` | POST | Rotate client API key | Client session |
| `/api/gmail/auth` | GET | OAuth Gmail authorization | Admin |
| `/api/gmail/callback` | GET | Gmail OAuth callback | Admin |

---

## 🖥️ Frontend Pages

### **Public Pages (Marketing)**

| Route | Purpose | Language Toggle |
|-------|---------|-----------------|
| `/[locale]` | Homepage with AI demo | `LanguageToggle` |

### **Client Pages**

| Route | Purpose | Authentication | Language Toggle |
|-------|---------|----------------|-----------------|
| `/[locale]/client/signup` | Client registration | None | `UniversalLanguageToggle` |
| `/[locale]/client/login` | Client authentication | None | `UniversalLanguageToggle` |
| `/[locale]/client/dashboard` | Lead analytics & management | Session | `UniversalLanguageToggle` |
| `/[locale]/client/settings` | Email personalization settings | Session | `UniversalLanguageToggle` |
| `/[locale]/client/api-access` | API key & integration docs | Session | `UniversalLanguageToggle` |

### **Admin Pages**

| Route | Purpose | Authentication | Language Toggle |
|-------|---------|----------------|-----------------|
| `/[locale]/admin/login` | Admin authentication | None | `UniversalLanguageToggle` |
| `/[locale]/dashboard` | Main admin command center | Admin session | `UniversalLanguageToggle` |
| `/[locale]/admin/settings` | Manage client settings | Admin session | `UniversalLanguageToggle` |
| `/[locale]/admin/prospect-intelligence` | Prospect discovery | Admin session | `UniversalLanguageToggle` |
| `/[locale]/dashboard/insights` | Detailed analytics | Admin session | `UniversalLanguageToggle` |
| `/[locale]/dashboard/clients` | Client management | Admin session | `UniversalLanguageToggle` |

### **Shortcut URLs (Auto-Redirect)**

All base routes auto-redirect based on cookie → browser language → default (en):

- `/client/signup` → `/[locale]/client/signup`
- `/client/login` → `/[locale]/client/login`
- `/client/dashboard` → `/[locale]/client/dashboard`
- `/client/settings` → `/[locale]/client/settings`
- `/client/api-access` → `/[locale]/client/api-access`
- `/admin/login` → `/[locale]/admin/login`
- `/dashboard` → `/[locale]/dashboard`
- `/admin/settings` → `/[locale]/admin/settings`
- `/admin/prospect-intelligence` → `/[locale]/admin/prospect-intelligence`
- `/dashboard/insights` → `/[locale]/dashboard/insights`

---

## 🗄️ Database Schema

### **Table: `public.clients`**

Client accounts with personalization settings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `client_id` | UUID | Unique client identifier |
| `business_name` | TEXT | Company name |
| `contact_name` | TEXT | Contact person name |
| `name` | TEXT | User name |
| `email` | TEXT | Unique email address |
| `password_hash` | TEXT | Hashed password |
| `api_key` | TEXT | Unique API key for lead submission |
| `language` | TEXT | Preferred language (en/fr) |
| `is_internal` | BOOLEAN | Flag for Avenir's internal client |
| `is_test` | BOOLEAN | Flag for test data |
| `industry_category` | TEXT | Industry (Real Estate, Marketing, etc.) |
| `primary_service` | TEXT | Main service offered |
| `booking_link` | TEXT | Calendar/booking URL |
| `custom_tagline` | TEXT | Email signature tagline |
| `email_tone` | TEXT | Email tone (Friendly, Professional, etc.) |
| `followup_speed` | TEXT | Response speed (Instant, Within 1 hour, etc.) |
| `ai_personalized_reply` | BOOLEAN | Enable AI personalization |
| `outbound_email` | TEXT | Custom SMTP sender email |
| `smtp_host` | TEXT | SMTP server host |
| `smtp_port` | INT | SMTP port |
| `smtp_username` | TEXT | SMTP username |
| `smtp_password` | TEXT | SMTP password |
| `created_at` | TIMESTAMPTZ | Account creation timestamp |
| `last_login` | TIMESTAMPTZ | Last login timestamp |
| `last_connection` | TIMESTAMPTZ | Last API connection |
| `last_rotated` | TIMESTAMPTZ | Last API key rotation |

### **Table: `public.lead_memory`**

Core lead storage with AI enrichment.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Lead name |
| `email` | TEXT | Lead email |
| `message` | TEXT | Lead message/inquiry |
| `ai_summary` | TEXT | AI-generated summary |
| `intent` | TEXT | Detected intent |
| `tone` | TEXT | Communication tone |
| `urgency` | TEXT | Urgency level (High/Medium/Low) |
| `confidence_score` | NUMERIC | Confidence score (0-1) |
| `language` | TEXT | Lead language (en/fr) |
| `client_id` | UUID | Associated client (FK) |
| `current_tag` | TEXT | Current tag (Active, Follow-Up, etc.) |
| `archived` | BOOLEAN | Archive status |
| `deleted` | BOOLEAN | Deletion status |
| `is_test` | BOOLEAN | Test data flag |
| `timestamp` | TIMESTAMPTZ | Lead creation timestamp |
| `last_updated` | TIMESTAMPTZ | Last update timestamp |
| `tone_history` | JSONB | Historical tone changes |
| `urgency_history` | JSONB | Historical urgency changes |
| `confidence_history` | JSONB | Historical confidence changes |
| `relationship_insight` | TEXT | AI relationship analysis |

### **Table: `public.lead_actions`**

Lead activity history and tagging.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `lead_id` | UUID | Lead reference (FK) |
| `client_id` | UUID | Client reference (FK) |
| `action_type` | TEXT | Action type (insert, update, tag, etc.) |
| `tag` | TEXT | Applied tag |
| `conversion_outcome` | BOOLEAN | Conversion flag |
| `reversion_reason` | TEXT | Reason for reverting conversion |
| `timestamp` | TIMESTAMPTZ | Action timestamp |
| `is_test` | BOOLEAN | Test data flag |

### **Table: `public.prospect_candidates`**

Discovered prospects for outreach.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `business_name` | TEXT | Company name |
| `website` | TEXT | Company website |
| `contact_email` | TEXT | Contact email |
| `form_url` | TEXT | Contact form URL |
| `industry` | TEXT | Industry category |
| `region` | TEXT | Geographic region |
| `language` | TEXT | Preferred language |
| `response_score` | NUMERIC | Response quality score (0-100) |
| `automation_need_score` | NUMERIC | Automation need (0-100) |
| `contacted` | BOOLEAN | Outreach sent flag |
| `last_tested` | TIMESTAMPTZ | Last contact form test |
| `created_at` | TIMESTAMPTZ | Discovery timestamp |

### **Table: `public.growth_brain`**

AI learning snapshots and growth analytics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `client_id` | UUID | Client reference (FK) |
| `insight_type` | TEXT | Type of insight |
| `insight_text` | TEXT | AI-generated insight |
| `confidence` | NUMERIC | Insight confidence |
| `created_at` | TIMESTAMPTZ | Generation timestamp |

### **Table: `public.growth_brain`**

Learning snapshots and AI memory.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `client_id` | UUID | Client reference (FK) |
| `event_type` | TEXT | Event type (conversion, reversion, etc.) |
| `learning_snapshot` | JSONB | AI learning data |
| `timestamp` | TIMESTAMPTZ | Event timestamp |

### **Table: `public.prospect_outreach_log`**

Outreach email tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `prospect_id` | UUID | Prospect reference (FK) |
| `email_subject` | TEXT | Email subject line |
| `email_body` | TEXT | Email HTML body |
| `status` | TEXT | Status (sent, opened, replied, ignored) |
| `sent_at` | TIMESTAMPTZ | Send timestamp |

---

## 🔄 Data Flow

### **Lead Submission Flow**

```
┌─────────────────┐
│  Client Website │
│  Contact Form   │
└────────┬────────┘
         │ POST /api/lead
         │ (with x-api-key)
         ▼
┌─────────────────────────────────────┐
│  /api/lead Route                    │
│  1. Validate API key                │
│  2. Detect client_id                │
│  3. Check if lead exists (by email) │
│  4. Enrich with AI (if new)         │
│  5. Upsert to lead_memory           │
│  6. Insert to lead_actions          │
│  7. Fetch client settings           │
│  8. Build personalized email        │
│  9. Send email (Gmail or SMTP)      │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Supabase Database                  │
│  • lead_memory (enriched lead)      │
│  • lead_actions (history entry)     │
│  • clients (update last_connection) │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Client Dashboard                   │
│  • Real-time lead display           │
│  • AI analytics cards               │
│  • Predictive Growth Engine         │
└─────────────────────────────────────┘
```

### **Client Signup Flow**

```
┌─────────────────┐
│  /client/signup │
│  Form Submission│
└────────┬────────┘
         │ POST /api/client/register
         ▼
┌─────────────────────────────────────┐
│  /api/client/register               │
│  1. Validate email uniqueness       │
│  2. Hash password                   │
│  3. Generate client_id + API key    │
│  4. Detect is_test flag             │
│  5. Insert to clients table         │
│  6. Send welcome email              │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  /client/dashboard                  │
│  Auto-login with session            │
└─────────────────────────────────────┘
```

### **Prospect Intelligence Flow**

```
┌─────────────────────────────────────┐
│  Admin: Run Prospect Scan           │
└────────┬────────────────────────────┘
         │ POST /api/prospect-intelligence/scan
         ▼
┌─────────────────────────────────────┐
│  Prospect Pipeline                  │
│  1. Crawler: Discover businesses    │
│  2. Analyzer: Test contact forms    │
│  3. Scorer: Calculate need (0-100)  │
│  4. Outreach: Generate emails       │
│  5. Save to prospect_candidates     │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  /admin/prospect-intelligence       │
│  • View discovered prospects        │
│  • High-priority filtering          │
│  • Metrics dashboard                │
└─────────────────────────────────────┘
```

---

## 🔗 Integrations

### **1. Supabase**
- **Purpose:** PostgreSQL database + real-time subscriptions
- **Tables:** 8 main tables (clients, lead_memory, lead_actions, etc.)
- **Auth:** Service role key for admin, anon key for client
- **Features:** Row Level Security (RLS), real-time updates

### **2. OpenAI GPT-4o-mini**
- **Purpose:** AI enrichment and chat assistant
- **Endpoints:** `/api/chat`, `/api/lead` (enrichment)
- **Features:**
  - Intent detection
  - Tone analysis
  - Urgency scoring
  - Summary generation
  - Confidence scoring

### **3. Gmail API**
- **Purpose:** Send automated welcome and lead response emails
- **Auth:** OAuth 2.0 with refresh tokens
- **Dev Mode:** Skipped when `NODE_ENV=development`
- **Features:** HTML email templates, personalized content

### **4. SMTP (Client-Owned)**
- **Purpose:** Send emails from client's own domain
- **Config:** Stored in `clients` table (smtp_host, smtp_port, etc.)
- **Fallback:** Uses Gmail API if SMTP not configured

### **5. next-intl**
- **Purpose:** Internationalization (EN/FR)
- **Files:** `messages/en.json`, `messages/fr.json`
- **Features:**
  - Route-based locale detection
  - Message loading per locale
  - Translation helpers (`t()`)

### **6. Middleware (Smart Redirects)**
- **Purpose:** Auto-redirect base routes to locale-prefixed routes
- **Detection:** Cookie → Browser language → Default (en)
- **Routes:** 11 shortcut URLs supported

### **7. Vercel Cron Jobs**
- **Purpose:** Scheduled analytics refresh
- **Schedule:** Daily at 03:00 UTC
- **Endpoint:** `/api/intelligence-engine/cron`
- **Features:** Per-client and global analytics generation

---

## ✨ Key Features

### **🌐 Bilingual Support**
- Complete EN/FR translations for all pages
- Locale-specific routing (`/en/*`, `/fr/*`)
- Smart redirect system for shortcut URLs
- Language toggle with triple persistence
- Bilingual email templates
- Locale-aware error messages

### **🎯 Lead Intelligence**
- AI-powered intent detection
- Tone and urgency analysis
- Confidence scoring (0-100%)
- Automatic tagging (Active, Follow-Up, Converted)
- Historical tracking (tone_history, urgency_history)
- Relationship insights

### **📧 Personalized Email Automation**
- Client-specific templates
- Dynamic tone adjustment (Friendly, Professional, Formal, Casual)
- Industry and service mentions
- Booking link CTAs
- Custom taglines
- SMTP integration
- Bilingual email generation

### **🔐 Multi-Tenant Architecture**
- Client-scoped data isolation
- API key authentication
- Session-based authentication
- Admin override capabilities
- Command Center with client filtering
- Row Level Security (Supabase RLS)

### **🧠 Prospect Intelligence**
- Autonomous prospect discovery
- Contact form testing
- Automation need scoring
- High-priority filtering
- Outreach email generation
- Performance metrics

### **📊 Analytics & Insights**
- Predictive Growth Engine
- Engagement scoring
- Urgency trend analysis
- Confidence insights
- Tone distribution
- Language ratio
- Lead activity timeline

### **🏷️ Lead Management**
- Multi-tab view (Active, Converted, Archived, Deleted)
- Tagging system with modals
- Conversion tracking with outcomes
- Reversion with reason logging
- Search and filtering
- Real-time updates
- Growth Copilot sidebar

### **⚙️ Settings & Customization**
- Client settings page (self-service)
- Admin settings page (override any client)
- Email template preview
- Auto-save with toast notifications
- Manual save button
- Industry and service configuration
- Tone and speed preferences

### **🧪 Test Data Isolation**
- `is_test` flag across all tables
- Auto-detection (email contains "test" or "example.com")
- Admin dashboard toggle to show/hide test data
- Default view: production data only

### **🔄 Smart Redirect System**
- 11 base routes with auto-redirect
- Cookie-based preference
- Browser language detection
- Default fallback (en)
- Middleware implementation

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js config with next-intl plugin |
| `tsconfig.json` | TypeScript configuration |
| `tailwind.config.js` | Tailwind CSS configuration |
| `eslint.config.mjs` | ESLint rules |
| `postcss.config.mjs` | PostCSS configuration |
| `.env.local` | Environment variables (Supabase, OpenAI, etc.) |
| `src/i18n/routing.ts` | Locale routing configuration |
| `src/i18n/request.ts` | Message loading configuration |
| `src/middleware.ts` | Smart redirect middleware |

---

## 📦 Dependencies

### **Core Framework**
- Next.js 15.5.4
- React 19.1.0
- TypeScript

### **UI & Animation**
- TailwindCSS
- Framer Motion 12.23.24

### **Backend & Database**
- @supabase/supabase-js 2.75.0
- @prisma/client 6.17.1

### **AI & Automation**
- openai 6.3.0 (GPT-4o-mini)

### **Email**
- googleapis 162.0.0 (Gmail API)
- Custom SMTP support

### **Authentication**
- bcryptjs 3.0.2

### **Internationalization**
- next-intl 4.3.12

### **Testing**
- @playwright/test 1.56.0

---

## 🎯 System Health Metrics

| Component | Status | Notes |
|-----------|--------|-------|
| Public Site | ✅ Operational | Bilingual, translations working |
| Client Signup | ✅ Operational | API key generation, welcome emails |
| Client Login | ✅ Operational | Session management, language restore |
| Client Dashboard | ✅ Operational | Real-time analytics, lead management |
| Client Settings | ✅ Operational | Auto-save, email preview |
| Admin Dashboard | ✅ Operational | Command Center, client filtering |
| Admin Settings | ✅ Operational | Client override capabilities |
| Lead API | ✅ Operational | AI enrichment, email automation |
| Prospect Intelligence | ✅ Operational | Discovery, scoring, outreach |
| Language Toggle | ✅ Operational | Triple persistence, smart redirects |
| Email Automation | ✅ Operational | Personalized templates, SMTP |
| AI Intelligence | ✅ Operational | Intent, tone, urgency detection |
| Database | ✅ Operational | Supabase, 8+ tables, RLS |
| Cron Jobs | ✅ Operational | Daily analytics refresh |

---

## 🔒 Security Features

- ✅ Password hashing (bcryptjs)
- ✅ API key authentication
- ✅ Session-based auth for dashboards
- ✅ Admin password protection
- ✅ Row Level Security (Supabase RLS)
- ✅ Client data isolation (client_id scoping)
- ✅ CORS headers for API endpoints
- ✅ Input validation and sanitization
- ✅ Environment variable protection
- ✅ Test data separation (is_test flag)

---

## 📈 Scalability Features

- ✅ Multi-tenant architecture
- ✅ Client-scoped data queries
- ✅ Serverless API routes (Edge Runtime)
- ✅ Static page generation (SSG)
- ✅ Real-time database subscriptions
- ✅ Vercel deployment optimizations
- ✅ CDN caching
- ✅ Middleware for smart routing

---

## 🚀 Deployment

**Platform:** Vercel  
**Domain:** https://www.aveniraisolutions.ca  
**Regions:** Global CDN  
**Build:** Automated via Git integration  
**Cron:** Vercel Cron Jobs (daily at 03:00 UTC)  

---

**End of System Blueprint**

---

*For detailed testing instructions, see `AVENIR_AI_SYSTEM_E2E_REPORT.md`*

