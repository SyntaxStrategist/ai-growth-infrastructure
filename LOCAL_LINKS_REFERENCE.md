# Avenir AI Solutions - Local Links Reference

## Overview
This document provides a comprehensive reference of all routes and endpoints in the Avenir AI Solutions Next.js application, including both frontend pages and API endpoints.

**Base URL:** `http://localhost:3000`

## Frontend Routes (Pages)

### Public Routes

| Route | Description | Method | Notes |
|-------|-------------|--------|-------|
| `/` | Root redirect | GET | Redirects to `/en` |
| `/en` | English homepage | GET | Main landing page with AI chat |
| `/fr` | French homepage | GET | Page d'accueil française avec chat IA |
| `/demo` | Demo page | GET | Demo/example page |

### Client Routes (Localized)

| Route | Description | Method | Notes |
|-------|-------------|--------|-------|
| `/en/client/signup` | Client registration (EN) | GET | Client signup form |
| `/fr/client/signup` | Client registration (FR) | GET | Formulaire d'inscription client |
| `/en/client/login` | Client login (EN) | GET | Client authentication |
| `/fr/client/login` | Client login (FR) | GET | Authentification client |
| `/en/client/dashboard` | Client dashboard (EN) | GET | Main client interface |
| `/fr/client/dashboard` | Client dashboard (FR) | GET | Interface client principale |
| `/en/client/settings` | Client settings (EN) | GET | Client configuration |
| `/fr/client/settings` | Client settings (FR) | GET | Configuration client |
| `/en/client/api-access` | API access page (EN) | GET | API key management |
| `/fr/client/api-access` | API access page (FR) | GET | Gestion des clés API |
| `/en/client/insights` | Client insights (EN) | GET | Analytics and insights |
| `/fr/client/insights` | Client insights (FR) | GET | Analyses et insights |
| `/en/client/prospect-intelligence` | Prospect intelligence (EN) | GET | AI prospect analysis |
| `/fr/client/prospect-intelligence` | Prospect intelligence (FR) | GET | Analyse IA des prospects |

### Admin Routes (Localized)

| Route | Description | Method | Notes |
|-------|-------------|--------|-------|
| `/en/admin/login` | Admin login (EN) | GET | Administrator authentication |
| `/fr/admin/login` | Admin login (FR) | GET | Authentification administrateur |
| `/en/admin/settings` | Admin settings (EN) | GET | System configuration |
| `/fr/admin/settings` | Admin settings (FR) | GET | Configuration système |
| `/en/admin/prospect-intelligence` | Admin prospect intelligence (EN) | GET | Admin prospect analysis |
| `/fr/admin/prospect-intelligence` | Admin prospect intelligence (FR) | GET | Analyse admin des prospects |

### Dashboard Routes (Localized)

| Route | Description | Method | Notes |
|-------|-------------|--------|-------|
| `/en/dashboard` | Main dashboard (EN) | GET | Primary admin dashboard |
| `/fr/dashboard` | Main dashboard (FR) | GET | Tableau de bord principal |
| `/en/dashboard/clients` | Client management (EN) | GET | Client list and management |
| `/fr/dashboard/clients` | Client management (FR) | GET | Liste et gestion des clients |
| `/en/dashboard/insights` | Dashboard insights (EN) | GET | System analytics |
| `/fr/dashboard/insights` | Dashboard insights (FR) | GET | Analyses système |
| `/en/dashboard/outreach` | Outreach management (EN) | GET | Email outreach tools |
| `/fr/dashboard/outreach` | Outreach management (FR) | GET | Outils d'email outreach |

## API Endpoints

### Authentication & Authorization

| Route | Description | Method | Notes |
|-------|-------------|--------|-------|
| `/api/auth-dashboard` | Dashboard authentication | POST | Admin login endpoint |
| `/api/client-auth` | Client authentication | POST | Client login endpoint |
| `/api/client/auth` | Client auth (alternative) | POST | Alternative client auth |
| `/api/rotate-key` | API key rotation | POST | Rotate API keys |

### Lead Management

| Route | Description | Method | Notes |
|-------|-------------|--------|-------|
| `/api/lead` | Lead submission | POST | Main lead capture endpoint |
| `/api/leads` | Lead retrieval | GET | Get all leads |
| `/api/leads/archived` | Archived leads | GET | Get archived leads |
| `/api/leads/deleted` | Deleted leads | GET | Get deleted leads |
| `/api/leads/insights` | Lead analytics | GET | Lead performance metrics |
| `/api/lead-actions` | Lead actions | GET, POST | Lead interaction tracking |
| `/api/client/leads` | Client leads | GET | Client-specific leads |
| `/api/client-leads` | Client leads (alt) | POST | Alternative client leads |

### Client Management

| Route | Description | Method | Notes |
|-------|-------------|--------|-------|
| `/api/clients` | Client CRUD | GET, POST, DELETE | Client management |
| `/api/client/register` | Client registration | POST | New client signup |
| `/api/client/settings` | Client settings | GET, PUT | Client configuration |
| `/api/client/update-language` | Language preference | PUT | Update client language |
| `/api/client/insights` | Client insights | GET | Client analytics |

### Prospect Intelligence

| Route | Description | Method | Notes |
|-------|-------------|--------|-------|
| `/api/prospect-intelligence/config` | PI configuration | GET | Prospect intelligence settings |
| `/api/prospect-intelligence/prospects` | Prospect data | GET, PUT | Prospect management |
| `/api/prospect-intelligence/scan` | Website scanning | GET, POST | Website prospect scanning |
| `/api/prospect-intelligence/optimize` | Optimization | GET, POST | Prospect optimization |
| `/api/prospect-intelligence/outreach` | Outreach generation | GET, POST | AI outreach creation |
| `/api/prospect-intelligence/proof` | Proof generation | GET | Generate proof of concept |
| `/api/prospect-intelligence/proof-visuals` | Visual proof | GET, POST | Generate visual proof |
| `/api/prospect-intelligence/feedback` | Feedback system | GET, POST, PUT | User feedback collection |
| `/api/client/prospect-intelligence/config` | Client PI config | GET | Client-specific PI settings |
| `/api/client/prospect-intelligence/prospects` | Client prospects | GET | Client prospect data |
| `/api/client/prospect-intelligence/scan` | Client scanning | POST | Client website scanning |

### Intelligence Engine

| Route | Description | Method | Notes |
|-------|-------------|--------|-------|
| `/api/intelligence-engine` | Main engine | GET, POST | Core intelligence processing |
| `/api/intelligence-engine/cron` | Scheduled tasks | GET | Cron job endpoint |

### Outreach & Communication

| Route | Description | Method | Notes |
|-------|-------------|--------|-------|
| `/api/outreach` | Outreach management | GET, POST | Email outreach system |
| `/api/outreach/email-templates` | Email templates | GET, POST, PUT, DELETE | Template management |
| `/api/gmail/auth` | Gmail authentication | GET | Gmail OAuth initiation |
| `/api/gmail/callback` | Gmail callback | GET | Gmail OAuth callback |
| `/api/gmail-webhook` | Gmail webhook | GET, POST | Gmail webhook handler |

### AI & Analytics

| Route | Description | Method | Notes |
|-------|-------------|--------|-------|
| `/api/chat` | AI chat | POST | OpenAI chat completion |
| `/api/translate` | Translation service | GET, POST | Text translation |
| `/api/translate-intent` | Intent translation | - | Intent-based translation |
| `/api/insights` | System insights | GET | General system analytics |
| `/api/growth-insights` | Growth analytics | GET | Growth metrics |
| `/api/feedback` | User feedback | GET, POST, PUT | Feedback collection |
| `/api/prompt-optimization` | Prompt optimization | GET, POST, PUT | AI prompt tuning |

### System & Utilities

| Route | Description | Method | Notes |
|-------|-------------|--------|-------|
| `/api/failover/status` | Failover status | GET, POST | System failover monitoring |
| `/api/debug/env` | Environment debug | - | Debug environment variables |

## Local Development URLs

### Frontend URLs
```
http://localhost:3000/
http://localhost:3000/en
http://localhost:3000/fr
http://localhost:3000/demo

# Client Routes
http://localhost:3000/en/client/signup
http://localhost:3000/fr/client/signup
http://localhost:3000/en/client/login
http://localhost:3000/fr/client/login
http://localhost:3000/en/client/dashboard
http://localhost:3000/fr/client/dashboard
http://localhost:3000/en/client/settings
http://localhost:3000/fr/client/settings
http://localhost:3000/en/client/api-access
http://localhost:3000/fr/client/api-access
http://localhost:3000/en/client/insights
http://localhost:3000/fr/client/insights
http://localhost:3000/en/client/prospect-intelligence
http://localhost:3000/fr/client/prospect-intelligence

# Admin Routes
http://localhost:3000/en/admin/login
http://localhost:3000/fr/admin/login
http://localhost:3000/en/admin/settings
http://localhost:3000/fr/admin/settings
http://localhost:3000/en/admin/prospect-intelligence
http://localhost:3000/fr/admin/prospect-intelligence

# Dashboard Routes
http://localhost:3000/en/dashboard
http://localhost:3000/fr/dashboard
http://localhost:3000/en/dashboard/clients
http://localhost:3000/fr/dashboard/clients
http://localhost:3000/en/dashboard/insights
http://localhost:3000/fr/dashboard/insights
http://localhost:3000/en/dashboard/outreach
http://localhost:3000/fr/dashboard/outreach
```

### API URLs
```
# Authentication
http://localhost:3000/api/auth-dashboard
http://localhost:3000/api/client-auth
http://localhost:3000/api/client/auth
http://localhost:3000/api/rotate-key

# Lead Management
http://localhost:3000/api/lead
http://localhost:3000/api/leads
http://localhost:3000/api/leads/archived
http://localhost:3000/api/leads/deleted
http://localhost:3000/api/leads/insights
http://localhost:3000/api/lead-actions
http://localhost:3000/api/client/leads
http://localhost:3000/api/client-leads

# Client Management
http://localhost:3000/api/clients
http://localhost:3000/api/client/register
http://localhost:3000/api/client/settings
http://localhost:3000/api/client/update-language
http://localhost:3000/api/client/insights

# Prospect Intelligence
http://localhost:3000/api/prospect-intelligence/config
http://localhost:3000/api/prospect-intelligence/prospects
http://localhost:3000/api/prospect-intelligence/scan
http://localhost:3000/api/prospect-intelligence/optimize
http://localhost:3000/api/prospect-intelligence/outreach
http://localhost:3000/api/prospect-intelligence/proof
http://localhost:3000/api/prospect-intelligence/proof-visuals
http://localhost:3000/api/prospect-intelligence/feedback
http://localhost:3000/api/client/prospect-intelligence/config
http://localhost:3000/api/client/prospect-intelligence/prospects
http://localhost:3000/api/client/prospect-intelligence/scan

# Intelligence Engine
http://localhost:3000/api/intelligence-engine
http://localhost:3000/api/intelligence-engine/cron

# Outreach & Communication
http://localhost:3000/api/outreach
http://localhost:3000/api/outreach/email-templates
http://localhost:3000/api/gmail/auth
http://localhost:3000/api/gmail/callback
http://localhost:3000/api/gmail-webhook

# AI & Analytics
http://localhost:3000/api/chat
http://localhost:3000/api/translate
http://localhost:3000/api/translate-intent
http://localhost:3000/api/insights
http://localhost:3000/api/growth-insights
http://localhost:3000/api/feedback
http://localhost:3000/api/prompt-optimization

# System & Utilities
http://localhost:3000/api/failover/status
http://localhost:3000/api/debug/env
```

## Route Configuration

### Middleware
- **File:** `src/middleware.ts`
- **Purpose:** Automatic locale detection and redirection
- **Supported locales:** `en`, `fr`
- **Default locale:** `en`

### Internationalization
- **Configuration:** `src/i18n/routing.ts`
- **Supported languages:** English (`en`), French (`fr`)
- **Auto-redirect:** Base routes without locale are redirected to detected locale

### Route Protection
- Public routes: Homepage, demo, client signup/login
- Protected routes: All dashboard and admin routes require authentication
- API routes: Most require authentication or API keys

## Notes

1. **Locale Detection:** The middleware automatically detects user language preference from cookies or browser headers
2. **API Authentication:** Most API endpoints require proper authentication headers
3. **CORS:** API endpoints are configured for local development
4. **Webhooks:** Gmail webhook endpoint is configured for external service integration
5. **Edge Runtime:** Some API routes use edge runtime for better performance

## Development Setup

To run the application locally:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

---

*Generated on: $(date)*
*Total Routes: 18 frontend pages, 42 API endpoints*
