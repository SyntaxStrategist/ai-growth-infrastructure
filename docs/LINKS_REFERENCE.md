# 🌐 Avenir AI Solutions — Platform Links Reference

## 📋 Overview / Aperçu

This document lists all local and production routes for the Avenir AI Solutions platform.

*Ce document répertorie toutes les routes locales et de production pour la plateforme Avenir AI Solutions.*

**Last Updated:** October 17, 2025  
**Platform Version:** 2.0.0  
**Bilingual:** English & Français

### 🔄 Smart Redirect System / Système de redirection intelligente

All base routes (without `/en` or `/fr` prefix) now automatically redirect to the correct locale version based on:

*Toutes les routes de base (sans préfixe `/en` ou `/fr`) redirigent maintenant automatiquement vers la version locale correcte en fonction de :*

1. **User's saved preference (cookie)** / *Préférence enregistrée de l'utilisateur (cookie)*
2. **Browser language setting** / *Paramètre de langue du navigateur*
3. **Default: English** / *Par défaut : Anglais*

**Example / Exemple:**
- Visit `/client/login` → Redirects to `/en/client/login` or `/fr/client/login`
- *Visitez `/client/login` → Redirige vers `/en/client/login` ou `/fr/client/login`*

---

## 🔗 Local Development URLs (localhost:3000)

### 🏠 Homepage / Page d'accueil

**English:** `http://localhost:3000/en`  
**Français:** `http://localhost:3000/fr`  
*Main landing page with hero animation and features overview.*  
*Page d'accueil principale avec animation et présentation des fonctionnalités.*

---

## 👥 Client Area / Espace Client

### 🚀 Shortcut URLs / URLs Raccourcis

All client routes support automatic language detection:

*Toutes les routes client prennent en charge la détection automatique de la langue :*

- `http://localhost:3000/client/signup`
- `http://localhost:3000/client/login`
- `http://localhost:3000/client/dashboard`
- `http://localhost:3000/client/settings`
- `http://localhost:3000/client/api-access`

→ **Auto-redirects to** `/en/...` **or** `/fr/...` *based on preference*  
→ ***Redirige automatiquement vers*** `/en/...` ***ou*** `/fr/...` *selon la préférence*

---

### 1. Client Signup / Inscription Client

**Shortcut:** `http://localhost:3000/client/signup` *(auto-redirects)*  
**English:** `http://localhost:3000/en/client/signup`  
**Français:** `http://localhost:3000/fr/client/signup`  
*New client registration page with personalization fields (industry, service, tone, etc.)*  
*Page d'inscription pour nouveaux clients avec champs de personnalisation (secteur, service, ton, etc.)*

**Fields / Champs:**
- Business Name / Nom de l'entreprise
- Contact Name / Nom du contact
- Email / Courriel
- Password / Mot de passe
- Industry Category / Catégorie d'industrie
- Primary Service / Service principal
- Booking Link / Lien de réservation (optional)
- Company Tagline / Slogan de l'entreprise (optional)
- Email Tone / Ton des courriels
- Follow-up Speed / Vitesse de suivi

---

### 2. Client Login / Connexion Client

**Shortcut:** `http://localhost:3000/client/login` *(auto-redirects)*  
**English:** `http://localhost:3000/en/client/login`  
**Français:** `http://localhost:3000/fr/client/login`  
*Client authentication page with email + password login.*  
*Page d'authentification client avec connexion courriel + mot de passe.*

---

### 3. Client Dashboard / Tableau de bord Client

**Shortcut:** `http://localhost:3000/client/dashboard` *(auto-redirects)*  
**English:** `http://localhost:3000/en/client/dashboard`  
**Français:** `http://localhost:3000/fr/client/dashboard`  
*Main client dashboard with AI analytics, lead management, and insights.*  
*Tableau de bord principal du client avec analyses IA, gestion des leads et insights.*

**Features / Fonctionnalités:**
- Real-time lead intelligence / Intelligence de leads en temps réel
- Predictive Growth Engine / Moteur de croissance prédictif
- Relationship Insights / Insights relationnels
- Growth Copilot / Copilote de croissance
- Lead tabs: Active, Archived, Deleted, Converted / Onglets: Actifs, Archivés, Supprimés, Convertis
- Tag, Archive, Delete controls / Contrôles d'étiquetage, archivage, suppression

---

### 4. Client Settings / Paramètres Client

**Shortcut:** `http://localhost:3000/client/settings` *(auto-redirects)*  
**English:** `http://localhost:3000/en/client/settings`  
**Français:** `http://localhost:3000/fr/client/settings`  
*Client settings page for managing email personalization preferences.*  
*Page des paramètres pour gérer les préférences de personnalisation des courriels.*

**Editable Fields / Champs modifiables:**
- Industry Category / Catégorie d'industrie
- Primary Service / Service principal
- Booking Link / Lien de réservation
- Company Tagline / Slogan de l'entreprise
- Email Tone / Ton des courriels
- Follow-up Speed / Vitesse de suivi
- Language / Langue
- AI Personalized Replies / Réponses personnalisées IA

---

### 5. Client API Access / Accès API Client

**Shortcut:** `http://localhost:3000/client/api-access` *(auto-redirects)*  
**English:** `http://localhost:3000/en/client/api-access`  
**Français:** `http://localhost:3000/fr/client/api-access`  
*API integration details page with API key, endpoint, and examples.*  
*Page de détails d'intégration API avec clé API, point de terminaison et exemples.*

**Displays / Affiche:**
- API Endpoint / Point de terminaison API
- API Key (with copy button) / Clé API (avec bouton de copie)
- Example JSON request / Exemple de requête JSON
- Zapier integration steps / Étapes d'intégration Zapier
- Security warning / Avertissement de sécurité

---

## 🔐 Admin Area / Espace Administrateur

### 🚀 Shortcut URLs / URLs Raccourcis

All admin routes support automatic language detection:

*Toutes les routes administrateur prennent en charge la détection automatique de la langue :*

- `http://localhost:3000/admin/login`
- `http://localhost:3000/admin/dashboard`
- `http://localhost:3000/admin/settings`
- `http://localhost:3000/admin/prospect-intelligence`
- `http://localhost:3000/dashboard`
- `http://localhost:3000/dashboard/insights`

→ **Auto-redirects to** `/en/...` **or** `/fr/...` *based on preference*  
→ ***Redirige automatiquement vers*** `/en/...` ***ou*** `/fr/...` *selon la préférence*

---

### 1. Admin Login / Connexion Administrateur

**Shortcut:** `http://localhost:3000/admin/login` *(auto-redirects)*  
**English:** `http://localhost:3000/en/admin/login`  
**Français:** `http://localhost:3000/fr/admin/login`  
*Admin authentication page with email + password login.*  
*Page d'authentification administrateur avec connexion courriel + mot de passe.*

**Authentication / Authentification:**
- Uses ADMIN_PASSWORD from .env.local / Utilise ADMIN_PASSWORD de .env.local
- Stores session in localStorage / Stocke la session dans localStorage

---

### 2. Admin Dashboard / Tableau de bord Administrateur

**Shortcut:** `http://localhost:3000/dashboard` *(auto-redirects)*  
**English:** `http://localhost:3000/en/dashboard`  
**Français:** `http://localhost:3000/fr/dashboard`  
*Main admin dashboard with global analytics, client filtering, and command center.*  
*Tableau de bord administrateur principal avec analyses globales, filtrage client et centre de commande.*

**Features / Fonctionnalités:**
- Command Center (Client Filter) / Centre de commande (Filtre client)
- Global Analytics / Analyses globales
- All Clients Leads / Leads de tous les clients
- Predictive Growth Engine / Moteur de croissance prédictif
- Lead Management / Gestion des leads
- Growth Copilot (Global) / Copilote de croissance (Global)

---

### 3. Admin Settings / Paramètres Administrateur

**Shortcut:** `http://localhost:3000/admin/settings` *(auto-redirects)*  
**English:** `http://localhost:3000/en/admin/settings`  
**Français:** `http://localhost:3000/fr/admin/settings`  
*Admin settings page for managing any client's personalization preferences.*  
*Page des paramètres administrateur pour gérer les préférences de personnalisation de n'importe quel client.*

**Features / Fonctionnalités:**
- Client selector dropdown / Sélecteur de client déroulant
- Edit any client's settings / Modifier les paramètres de n'importe quel client
- Email template preview / Aperçu du modèle de courriel
- Admin override capabilities / Capacités de remplacement administrateur

---

### 4. Prospect Intelligence / Intelligence de Prospection

**Shortcut:** `http://localhost:3000/admin/prospect-intelligence` *(auto-redirects)*  
**English:** `http://localhost:3000/en/admin/prospect-intelligence`  
**Français:** `http://localhost:3000/fr/admin/prospect-intelligence`  
*Autonomous prospect discovery and scoring system.*  
*Système autonome de découverte et d'évaluation des prospects.*

**Features / Fonctionnalités:**
- Configure scan parameters / Configurer les paramètres de scan
- Run prospect scan / Lancer un scan de prospects
- View discovered prospects / Voir les prospects découverts
- Automation need scores / Scores de besoin d'automatisation
- High-priority filtering / Filtrage haute priorité
- Metrics refresh / Actualisation des statistiques

---

### 5. Dashboard Insights / Aperçus du Tableau de bord

**Shortcut:** `http://localhost:3000/dashboard/insights` *(auto-redirects)*  
**English:** `http://localhost:3000/en/dashboard/insights`  
**Français:** `http://localhost:3000/fr/dashboard/insights`  
*Detailed analytics and insights page (admin only).*  
*Page d'analyses et d'insights détaillés (administrateur seulement).*

---

## 🔌 API Endpoints / Points de terminaison API

### 1. Client Registration / Inscription Client

**Endpoint:** `POST /api/client/register`

**Purpose / Objectif:**  
Create new client account with API key and personalization settings.  
Créer un nouveau compte client avec clé API et paramètres de personnalisation.

**Request Body:**
```json
{
  "businessName": "Company Name",
  "contactName": "Contact Name",
  "email": "email@example.com",
  "password": "SecurePassword123!",
  "language": "en",
  "industryCategory": "Real Estate",
  "primaryService": "Residential Sales",
  "customTagline": "Your trusted partner",
  "emailTone": "Friendly",
  "followupSpeed": "Instant"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientId": "uuid",
    "apiKey": "client_xxxxx",
    "businessName": "Company Name"
  }
}
```

---

### 2. Client Settings (Fetch) / Paramètres Client (Récupération)

**Endpoint:** `GET /api/client/settings?clientId={uuid}`

**Purpose / Objectif:**  
Fetch client personalization settings.  
Récupérer les paramètres de personnalisation du client.

**Response:**
```json
{
  "success": true,
  "data": {
    "industry_category": "Real Estate",
    "primary_service": "Residential Sales",
    "booking_link": "https://calendly.com/...",
    "custom_tagline": "Your trusted partner",
    "email_tone": "Friendly",
    "followup_speed": "Instant",
    "language": "en",
    "ai_personalized_reply": true
  }
}
```

---

### 3. Client Settings (Update) / Paramètres Client (Mise à jour)

**Endpoint:** `PUT /api/client/settings?clientId={uuid}`

**Purpose / Objectif:**  
Update client personalization settings.  
Mettre à jour les paramètres de personnalisation du client.

**Request Body:**
```json
{
  "clientId": "uuid",
  "industryCategory": "Real Estate",
  "primaryService": "Residential Sales",
  "bookingLink": "https://calendly.com/...",
  "customTagline": "Your trusted partner",
  "emailTone": "Friendly",
  "followupSpeed": "Instant",
  "language": "en",
  "aiPersonalizedReply": true
}
```

---

### 4. Lead Submission / Soumission de Lead

**Endpoint:** `POST /api/lead`

**Purpose / Objectif:**  
Submit a new lead for AI processing and automated email response.  
Soumettre un nouveau lead pour traitement IA et réponse automatique par courriel.

**Headers / En-têtes:**
```
x-api-key: client_xxxxx
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Interested in your services",
  "locale": "en"
}
```

**Response:**
```json
{
  "success": true,
  "leadId": "lead_xxxxx",
  "message": "Lead processed successfully"
}
```

---

### 5. Client Leads (Fetch) / Leads Client (Récupération)

**Endpoint:** `GET /api/client/leads`

**Purpose / Objectif:**  
Fetch all leads for a specific client.  
Récupérer tous les leads pour un client spécifique.

**Query Parameters:**
- `status`: active | archived | deleted | converted

**Response:**
```json
{
  "success": true,
  "data": {
    "leads": [...],
    "count": 42
  }
}
```

---

### 6. Update Language Preference / Mettre à jour la préférence de langue

**Endpoint:** `PUT /api/client/update-language`

**Purpose / Objectif:**  
Update client's preferred language.  
Mettre à jour la langue préférée du client.

**Request Body:**
```json
{
  "clientId": "uuid",
  "language": "fr"
}
```

---

### 7. Prospect Intelligence Scan / Scan d'Intelligence de Prospection

**Endpoint:** `POST /api/prospect-intelligence/scan`

**Purpose / Objectif:**  
Trigger autonomous prospect discovery pipeline.  
Déclencher le pipeline de découverte autonome de prospects.

**Request Body:**
```json
{
  "industries": ["Construction", "Real Estate"],
  "regions": ["CA"],
  "minScore": 70,
  "maxResults": 10,
  "testMode": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCrawled": 8,
    "totalTested": 8,
    "totalScored": 8,
    "totalContacted": 2,
    "highPriorityProspects": [...]
  }
}
```

---

### 8. Prospect Data Fetch / Récupération de données de prospects

**Endpoint:** `GET /api/prospect-intelligence/prospects`

**Purpose / Objectif:**  
Fetch all prospect candidates with metrics.  
Récupérer tous les candidats prospects avec statistiques.

**Response:**
```json
{
  "success": true,
  "data": {
    "prospects": [...],
    "metrics": {
      "totalCrawled": 8,
      "totalTested": 6,
      "totalScored": 6,
      "totalContacted": 2,
      "highPriorityCount": 2
    }
  }
}
```

---

### 9. Admin Dashboard Authentication / Authentification Tableau de bord Admin

**Endpoint:** `POST /api/auth-dashboard`

**Purpose / Objectif:**  
Authenticate admin user.  
Authentifier l'utilisateur administrateur.

**Request Body:**
```json
{
  "password": "admin_password"
}
```

---

### 10. Intelligence Engine (Cron) / Moteur d'Intelligence (Cron)

**Endpoint:** `GET /api/intelligence-engine/cron`

**Purpose / Objectif:**  
Daily scheduled job for AI analytics refresh (3:00 AM UTC).  
Tâche planifiée quotidienne pour actualisation des analyses IA (3h00 UTC).

**Authorization:**
```
Authorization: Bearer {CRON_SECRET}
```

---

### 11. Lead Actions / Actions sur les Leads

**Endpoint:** `POST /api/lead-actions`

**Purpose / Objectif:**  
Tag, archive, delete, or convert leads.  
Étiqueter, archiver, supprimer ou convertir les leads.

**Request Body:**
```json
{
  "lead_id": "lead_xxxxx",
  "action": "tag",
  "tag": "Converted"
}
```

---

### 12. Fetch All Clients / Récupérer tous les clients

**Endpoint:** `GET /api/clients`

**Purpose / Objectif:**  
Fetch all clients for admin command center dropdown.  
Récupérer tous les clients pour le menu déroulant du centre de commande administrateur.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "client_id": "uuid",
      "business_name": "Company Name",
      "email": "email@example.com",
      "language": "en"
    }
  ]
}
```

---

## 🌍 Production URLs (www.aveniraisolutions.ca)

### 🏠 Homepage / Page d'accueil

**English:** `https://www.aveniraisolutions.ca/en`  
**Français:** `https://www.aveniraisolutions.ca/fr`  
*Main landing page with hero animation and features overview.*  
*Page d'accueil principale avec animation et présentation des fonctionnalités.*

---

## 👥 Client Area / Espace Client (Production)

### 1. Client Signup / Inscription Client

**English:** `https://www.aveniraisolutions.ca/en/client/signup`  
**Français:** `https://www.aveniraisolutions.ca/fr/client/signup`  
*New client registration page.*  
*Page d'inscription pour nouveaux clients.*

---

### 2. Client Dashboard / Tableau de bord Client

**English:** `https://www.aveniraisolutions.ca/en/client/dashboard`  
**Français:** `https://www.aveniraisolutions.ca/fr/client/dashboard`  
*Main client dashboard with AI analytics.*  
*Tableau de bord principal du client avec analyses IA.*

---

### 3. Client Settings / Paramètres Client

**English:** `https://www.aveniraisolutions.ca/en/client/settings`  
**Français:** `https://www.aveniraisolutions.ca/fr/client/settings`  
*Client settings and email personalization.*  
*Paramètres client et personnalisation des courriels.*

---

### 4. Client API Access / Accès API Client

**English:** `https://www.aveniraisolutions.ca/en/client/api-access`  
**Français:** `https://www.aveniraisolutions.ca/fr/client/api-access`  
*API integration details and documentation.*  
*Détails et documentation d'intégration API.*

---

## 🔐 Admin Area / Espace Administrateur (Production)

### 1. Admin Login / Connexion Administrateur

**English:** `https://www.aveniraisolutions.ca/en/admin/login`  
**Français:** `https://www.aveniraisolutions.ca/fr/admin/login`  
*Admin authentication page.*  
*Page d'authentification administrateur.*

---

### 2. Admin Dashboard / Tableau de bord Administrateur

**English:** `https://www.aveniraisolutions.ca/en/dashboard`  
**Français:** `https://www.aveniraisolutions.ca/fr/dashboard`  
*Main admin dashboard with global analytics and client filtering.*  
*Tableau de bord administrateur principal avec analyses globales et filtrage client.*

---

### 3. Admin Settings / Paramètres Administrateur

**English:** `https://www.aveniraisolutions.ca/en/admin/settings`  
**Français:** `https://www.aveniraisolutions.ca/fr/admin/settings`  
*Admin settings for managing client personalization.*  
*Paramètres administrateur pour gérer la personnalisation des clients.*

---

### 4. Prospect Intelligence / Intelligence de Prospection

**English:** `https://www.aveniraisolutions.ca/en/admin/prospect-intelligence`  
**Français:** `https://www.aveniraisolutions.ca/fr/admin/prospect-intelligence`  
*Autonomous prospect discovery and scoring system.*  
*Système autonome de découverte et d'évaluation des prospects.*

---

### 5. Dashboard Insights / Aperçus du Tableau de bord

**English:** `https://www.aveniraisolutions.ca/en/dashboard/insights`  
**Français:** `https://www.aveniraisolutions.ca/fr/dashboard/insights`  
*Detailed analytics and insights (admin only).*  
*Analyses et insights détaillés (administrateur seulement).*

---

## 🔌 API Endpoints (Production)

All API endpoints use the same base URL for both local and production:

**Base URL (Local):** `http://localhost:3000/api/...`  
**Base URL (Production):** `https://www.aveniraisolutions.ca/api/...`

### Complete API List / Liste complète des API

1. `POST /api/client/register` - Client registration / Inscription client
2. `POST /api/client/auth` - Client authentication / Authentification client
3. `GET /api/client/settings?clientId={uuid}` - Fetch settings / Récupérer paramètres
4. `PUT /api/client/settings?clientId={uuid}` - Update settings / Mettre à jour paramètres
5. `POST /api/lead` - Submit lead / Soumettre un lead
6. `GET /api/client/leads` - Fetch client leads / Récupérer leads client
7. `PUT /api/client/update-language` - Update language / Mettre à jour langue
8. `POST /api/auth-dashboard` - Admin authentication / Authentification admin
9. `POST /api/prospect-intelligence/scan` - Prospect scan / Scanner prospects
10. `GET /api/prospect-intelligence/prospects` - Fetch prospects / Récupérer prospects
11. `GET /api/clients` - Fetch all clients / Récupérer tous les clients
12. `POST /api/lead-actions` - Lead actions / Actions sur leads
13. `GET /api/leads/insights` - Relationship insights / Insights relationnels
14. `GET /api/intelligence-engine/cron` - Daily analytics refresh / Actualisation quotidienne

---

## 📊 Quick Reference Tables

### Client Routes / Routes Client

| Page | Shortcut (Auto) | English URL | French URL |
|------|-----------------|-------------|------------|
| Signup | `/client/signup` | `/en/client/signup` | `/fr/client/signup` |
| Login | `/client/login` | `/en/client/login` | `/fr/client/login` |
| Dashboard | `/client/dashboard` | `/en/client/dashboard` | `/fr/client/dashboard` |
| Settings | `/client/settings` | `/en/client/settings` | `/fr/client/settings` |
| API Access | `/client/api-access` | `/en/client/api-access` | `/fr/client/api-access` |

**Note:** Shortcut URLs automatically redirect based on cookie → browser language → default (en)  
**Remarque :** Les URLs raccourcis redirigent automatiquement selon cookie → langue du navigateur → défaut (en)

---

### Admin Routes / Routes Administrateur

| Page | Shortcut (Auto) | English URL | French URL |
|------|-----------------|-------------|------------|
| Login | `/admin/login` | `/en/admin/login` | `/fr/admin/login` |
| Dashboard | `/dashboard` | `/en/dashboard` | `/fr/dashboard` |
| Settings | `/admin/settings` | `/en/admin/settings` | `/fr/admin/settings` |
| Prospect Intel | `/admin/prospect-intelligence` | `/en/admin/prospect-intelligence` | `/fr/admin/prospect-intelligence` |
| Insights | `/dashboard/insights` | `/en/dashboard/insights` | `/fr/dashboard/insights` |

**Note:** Shortcut URLs automatically redirect based on cookie → browser language → default (en)  
**Remarque :** Les URLs raccourcis redirigent automatiquement selon cookie → langue du navigateur → défaut (en)

---

### API Endpoints / Points de terminaison API

| Endpoint | Method | Purpose (EN) | Objectif (FR) |
|----------|--------|--------------|---------------|
| `/api/client/register` | POST | Register new client | Inscrire nouveau client |
| `/api/client/auth` | POST | Client login | Connexion client |
| `/api/client/settings` | GET/PUT | Manage settings | Gérer paramètres |
| `/api/lead` | POST | Submit lead | Soumettre lead |
| `/api/client/leads` | GET | Fetch leads | Récupérer leads |
| `/api/client/update-language` | PUT | Update language | Mettre à jour langue |
| `/api/auth-dashboard` | POST | Admin login | Connexion admin |
| `/api/prospect-intelligence/scan` | POST | Scan prospects | Scanner prospects |
| `/api/prospect-intelligence/prospects` | GET | Fetch prospects | Récupérer prospects |
| `/api/clients` | GET | List all clients | Lister tous clients |
| `/api/lead-actions` | POST | Tag/archive/delete | Étiqueter/archiver/supprimer |

---

## 🔧 Environment Variables Required

### Required for Production / Requis pour la production

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_ANON_KEY=xxx

# Admin Access
ADMIN_PASSWORD=your_secure_password

# OpenAI
OPENAI_API_KEY=sk-xxx

# Gmail API (Optional)
GOOGLE_CREDENTIALS_JSON={"type":"service_account",...}

# Google Custom Search (Optional - for Prospect Intelligence)
GOOGLE_CUSTOM_SEARCH_API_KEY=xxx
GOOGLE_SEARCH_ENGINE_ID=xxx

# Cron Secret
CRON_SECRET=your_cron_secret
```

---

## 📱 Mobile Access / Accès Mobile

All routes are fully responsive and work on mobile devices.  
Toutes les routes sont entièrement responsives et fonctionnent sur appareils mobiles.

**Optimized for / Optimisé pour:**
- ✅ Desktop (1920px+)
- ✅ Laptop (1366px)
- ✅ Tablet (768px)
- ✅ Mobile (375px)

---

## 🎯 Common Workflows / Flux de travail courants

### Client Onboarding Workflow / Flux d'intégration client

```
1. Signup       /en/client/signup
   ↓
2. Dashboard    /en/client/dashboard (auto-login)
   ↓
3. Settings     /en/client/settings (configure preferences)
   ↓
4. API Access   /en/client/api-access (get API key)
   ↓
5. Submit Lead  POST /api/lead (via API)
   ↓
6. View Results Dashboard updates in real-time
```

---

### Admin Workflow / Flux administrateur

```
1. Login        /en/admin/login
   ↓
2. Dashboard    /en/dashboard
   ↓
3. Filter       Select client from Command Center
   ↓
4. Settings     /en/admin/settings (edit client prefs)
   ↓
5. Prospects    /en/admin/prospect-intelligence (run scan)
   ↓
6. Insights     /en/dashboard/insights (view analytics)
```

---

## 📝 Notes / Remarques

### Language Toggle / Basculement de langue

All pages include a universal language toggle (🇬🇧/🇫🇷) in the top-right corner.  
Toutes les pages incluent un basculement de langue universel (🇬🇧/🇫🇷) dans le coin supérieur droit.

**Features / Fonctionnalités:**
- Instant language switch / Changement de langue instantané
- No page reload / Pas de rechargement de page
- Persistent preference / Préférence persistante
- Syncs with Supabase / Synchronise avec Supabase

---

### Test Data Isolation / Isolation des données de test

Test data is automatically flagged with `is_test = true` when:  
Les données de test sont automatiquement marquées avec `is_test = true` lorsque :

- Email contains "example.com", "test.com", etc.
- Business name contains "test", "demo", etc.

This allows easy filtering in production dashboards.  
Cela permet un filtrage facile dans les tableaux de bord de production.

---

## 📞 Support / Assistance

**Email / Courriel:** support@aveniraisolutions.ca  
**Website / Site Web:** https://www.aveniraisolutions.ca

**Business Hours / Heures d'ouverture:**  
Monday-Friday 9:00 AM - 5:00 PM EST  
Lundi-Vendredi 9h00 - 17h00 HNE

---

**Generated:** October 16, 2025  
**Version:** 2.0.0  
**Platform:** Avenir AI Solutions  
**Languages:** English & Français

