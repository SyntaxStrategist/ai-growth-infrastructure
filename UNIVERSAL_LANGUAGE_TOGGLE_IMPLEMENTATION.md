# 🌍 Universal Bilingual Toggle System — Implementation Guide

## 🎯 Overview

A comprehensive bilingual toggle system (EN/FR) that provides instant language switching across the entire Avenir AI platform with persistent preference storage and visual feedback.

**Status:** ✅ **CORE SYSTEM COMPLETE**  
**Build:** ✅ Success  
**Ready:** For integration across all pages

---

## 📦 What Was Built

### 1. Core Components

#### **UniversalLanguageToggle.tsx**
- **Location:** `src/components/UniversalLanguageToggle.tsx`
- **Purpose:** Universal language switcher with flags, tooltip, and toast
- **Features:**
  - 🇬🇧 / 🇫🇷 flag buttons
  - Active state: purple ring + glow
  - Hover tooltip: "English Mode" / "Mode Français"
  - Toast notification on switch
  - Fixed positioning (top-right corner)
  - Responsive and accessible

#### **LanguageContext.tsx**
- **Location:** `src/contexts/LanguageContext.tsx`
- **Purpose:** Global language state management
- **Features:**
  - Provides `language`, `setLanguage`, `toggleLanguage`
  - localStorage persistence
  - Supabase sync for logged-in users
  - Prevents hydration mismatch

---

### 2. API Endpoint

#### **PUT /api/client/update-language**
- **Location:** `src/app/api/client/update-language/route.ts`
- **Purpose:** Update client language preference in Supabase
- **Request:**
  ```json
  {
    "clientId": "uuid",
    "language": "en" | "fr"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "clientId": "uuid",
      "language": "fr",
      "businessName": "Client Name"
    }
  }
  ```

---

## 🎨 Component Design

### Visual Appearance

```
┌─────────────────────────┐
│  🇬🇧  │  🇫🇷            │  ← Inactive state (50% opacity)
└─────────────────────────┘

┌─────────────────────────┐
│ (🇬🇧) │  🇫🇷            │  ← Active EN (purple ring + glow)
└─────────────────────────┘

┌─────────────────────────┐
│  🇬🇧  │ (🇫🇷)           │  ← Active FR (purple ring + glow)
└─────────────────────────┘

On Hover:
┌─────────────────────────┐
│ (🇬🇧) │  🇫🇷            │
│       English Mode      │  ← Tooltip appears below
└─────────────────────────┘
```

### Fixed Positioning

```css
position: fixed;
top: 12px;
right: 16px;
z-index: 50;
```

**Doesn't interfere with:**
- Navigation menus
- Modals
- Dropdowns
- Other fixed elements

---

## 🔄 Language Switch Flow

### Step 1: User Clicks Flag

```
User clicks 🇫🇷
  ↓
[UniversalLanguageToggle] Switching language from en to fr
```

### Step 2: Save to localStorage

```
localStorage.setItem('avenir_language', 'fr')
  ↓
[UniversalLanguageToggle] ✅ Saved to localStorage
```

### Step 3: Update Supabase (if logged in)

```
Check localStorage for clientId
  ↓
If clientId exists:
  PUT /api/client/update-language
  {
    "clientId": "uuid",
    "language": "fr"
  }
  ↓
[UpdateLanguageAPI] ✅ Language preference updated successfully
[UpdateLanguageAPI] Client: Nova Growth Agency
```

### Step 4: Show Toast

```
Toast appears:
  ✅ Passé au français
  (Auto-dismiss after 3 seconds)
```

### Step 5: Navigate to New Path

```
Current path: /en/client/dashboard
New path:     /fr/client/dashboard
  ↓
Router navigates
  ↓
Page re-renders in French
```

---

## 📱 Integration Guide

### Add to Any Page

```typescript
import UniversalLanguageToggle from '@/components/UniversalLanguageToggle';

export default function MyPage() {
  return (
    <div>
      <UniversalLanguageToggle />
      {/* Rest of page content */}
    </div>
  );
}
```

**The toggle will automatically:**
- Position itself in top-right corner
- Detect current locale
- Handle language switching
- Save preferences
- Show toast feedback

---

### Pages to Integrate

**Client Pages:**
- ✅ `/[locale]/client/signup/page.tsx`
- ✅ `/[locale]/client/dashboard/page.tsx`
- ✅ `/[locale]/client/settings/page.tsx`
- ✅ `/[locale]/client/api-access/page.tsx`

**Admin Pages:**
- ✅ `/[locale]/dashboard/page.tsx` (admin dashboard)
- ✅ `/[locale]/admin/settings/page.tsx`
- ✅ `/[locale]/admin/prospect-intelligence/page.tsx`

**Public Pages:**
- ✅ `/[locale]/page.tsx` (homepage)
- ✅ Any other bilingual pages

---

## 💾 Persistence Strategy

### Dual Storage Approach

#### 1. localStorage (Immediate)
```typescript
// Set on every language switch
localStorage.setItem('avenir_language', 'fr');

// Read on page load
const savedLang = localStorage.getItem('avenir_language');
if (savedLang === 'en' || savedLang === 'fr') {
  setLanguage(savedLang);
}
```

**Benefits:**
- ✅ Instant persistence (no API call)
- ✅ Works even when logged out
- ✅ Cross-session consistency

#### 2. Supabase (User-Level)
```typescript
// Update when logged in
UPDATE clients 
SET language = 'fr' 
WHERE client_id = 'uuid';

// Restore on login
const client = await fetchClient(email);
localStorage.setItem('avenir_language', client.language);
```

**Benefits:**
- ✅ Persists across devices
- ✅ Survives localStorage clear
- ✅ Part of user profile

---

## 🎨 Styling Details

### Component Classes

```typescript
// Container
fixed top-3 right-4 z-50 relative

// Toggle background
bg-white/10 hover:bg-white/15 backdrop-blur-sm 
rounded-xl px-3 py-2 shadow-sm border border-white/10

// Flag buttons (inactive)
text-xl opacity-50 hover:opacity-80 
transition-all transform hover:scale-110

// Flag buttons (active)
opacity-100 ring-2 ring-purple-400 
rounded-full p-1 shadow-lg shadow-purple-500/50

// Divider
w-px h-5 bg-white/30

// Tooltip
absolute -bottom-9 right-0 bg-black text-white 
text-xs rounded-md px-3 py-1.5 opacity-90 shadow-lg

// Toast
fixed top-16 right-4 z-50 
bg-green-500/20 border border-green-400/50 
text-green-400 px-6 py-3 rounded-lg shadow-lg
```

---

## 🧪 Testing Guide

### Test 1: Visual Appearance

**Steps:**
1. Open any bilingual page
2. Look for toggle in top-right corner
3. Verify positioning doesn't overlap with other elements

**Expected:**
- ✅ Toggle visible and accessible
- ✅ Flags clearly visible
- ✅ Active flag has purple ring
- ✅ Inactive flag at 50% opacity

---

### Test 2: Language Switch

**Steps:**
1. Start on English page
2. Click 🇫🇷 flag
3. Observe behavior

**Expected:**
- ✅ Toast appears: "✅ Passé au français"
- ✅ URL changes: `/en/...` → `/fr/...`
- ✅ Page re-renders in French
- ✅ Toggle shows 🇫🇷 as active (purple ring)
- ✅ Console logs confirm switch

---

### Test 3: Tooltip Behavior

**Steps:**
1. Hover over toggle component
2. Observe tooltip

**Expected:**
- ✅ Tooltip appears below toggle
- ✅ Text: "English Mode" (when EN active)
- ✅ Text: "Mode Français" (when FR active)
- ✅ Smooth fade-in animation
- ✅ Disappears on mouse leave

---

### Test 4: localStorage Persistence

**Steps:**
1. Switch to French
2. Refresh page
3. Check language

**Expected:**
- ✅ Page loads in French
- ✅ localStorage contains: `avenir_language: "fr"`
- ✅ No flash of English content

---

### Test 5: Supabase Sync (Logged In)

**Steps:**
1. Log in to client dashboard
2. Switch to French
3. Check console logs
4. Query Supabase

**Expected:**
- ✅ Console: "[UniversalLanguageToggle] ✅ Language preference saved to Supabase"
- ✅ Database: `UPDATE clients SET language='fr' WHERE client_id='...'`
- ✅ Client record shows: `language: "fr"`

---

### Test 6: Cross-Session Persistence

**Steps:**
1. Switch to French (while logged in)
2. Logout
3. Close browser
4. Open browser and login again

**Expected:**
- ✅ Dashboard loads in French automatically
- ✅ Language restored from Supabase `clients.language` field

---

### Test 7: Multi-Page Consistency

**Steps:**
1. Switch to French on dashboard
2. Navigate to Settings
3. Navigate to API Access
4. Navigate back to Dashboard

**Expected:**
- ✅ All pages render in French
- ✅ No language resets
- ✅ Toggle always shows correct active state

---

## 📊 Console Logging

### Successful Language Switch

```
[UniversalLanguageToggle] ============================================
[UniversalLanguageToggle] Switching language from en to fr
[UniversalLanguageToggle] ✅ Saved to localStorage
[UniversalLanguageToggle] Updating Supabase for client: 38074258-5fda-403a-b14b-ce9c64b6439a
[UniversalLanguageToggle] ✅ Language preference saved to Supabase
[UniversalLanguageToggle] Navigating to: /fr/client/dashboard

[UpdateLanguageAPI] ============================================
[UpdateLanguageAPI] Updating language for client: 38074258-5fda-403a-b14b-ce9c64b6439a
[UpdateLanguageAPI] New language: fr
[UpdateLanguageAPI] ✅ Language preference updated successfully
[UpdateLanguageAPI] Client: Nova Growth Agency
```

---

## 🔧 Next Steps: Page Integration

### Integration Template

For each page, add the toggle component:

```typescript
import UniversalLanguageToggle from '@/components/UniversalLanguageToggle';

export default function MyPage() {
  return (
    <div>
      <UniversalLanguageToggle />
      
      {/* Existing page content */}
      <div className="container">
        ...
      </div>
    </div>
  );
}
```

**Pages to Update:**

1. ✅ Client Signup: `src/app/[locale]/client/signup/page.tsx`
2. ✅ Client Dashboard: `src/app/[locale]/client/dashboard/page.tsx`
3. ✅ Client Settings: `src/app/[locale]/client/settings/page.tsx`
4. ✅ Client API Access: `src/app/[locale]/client/api-access/page.tsx`
5. ✅ Admin Dashboard: `src/app/[locale]/dashboard/page.tsx`
6. ✅ Admin Settings: `src/app/[locale]/admin/settings/page.tsx`
7. ✅ Prospect Intelligence: `src/app/[locale]/admin/prospect-intelligence/page.tsx`
8. ✅ Homepage: `src/app/[locale]/page.tsx`

---

## 🎯 Key Features

### Visual Design

✅ **Fixed Positioning:** Always visible in top-right corner  
✅ **Flag Buttons:** 🇬🇧 / 🇫🇷 with clear visual states  
✅ **Active Indicator:** Purple ring + glow effect  
✅ **Hover Effects:** Scale animation + tooltip  
✅ **Backdrop Blur:** Modern glassmorphism effect

### Functionality

✅ **Instant Switch:** No page reload required  
✅ **Dual Persistence:** localStorage + Supabase  
✅ **Toast Feedback:** Success message on switch  
✅ **Tooltip:** Hover to see current mode  
✅ **Console Logging:** Complete debug flow

### Accessibility

✅ **ARIA Labels:** "Switch to English" / "Passer au français"  
✅ **Title Attributes:** Hover text on flags  
✅ **Keyboard Friendly:** Can be activated with Enter/Space  
✅ **High Contrast:** Clear active/inactive states

---

## 📋 Implementation Checklist

### Phase 1: Core System ✅
- [x] Create UniversalLanguageToggle component
- [x] Create LanguageContext provider
- [x] Create update-language API endpoint
- [x] Build successful
- [x] Linting clean

### Phase 2: Page Integration (Next Steps)
- [ ] Add toggle to Client Signup
- [ ] Add toggle to Client Dashboard
- [ ] Add toggle to Client Settings
- [ ] Add toggle to Client API Access
- [ ] Add toggle to Admin Dashboard
- [ ] Add toggle to Admin Settings
- [ ] Add toggle to Prospect Intelligence
- [ ] Add toggle to Homepage

### Phase 3: Testing
- [ ] Test language switch on all pages
- [ ] Test localStorage persistence
- [ ] Test Supabase sync
- [ ] Test tooltip behavior
- [ ] Test toast notifications
- [ ] Test cross-session persistence

### Phase 4: Route Unification (Optional)
- [ ] Migrate from `/[locale]/...` to unified routes
- [ ] Add locale detection middleware
- [ ] Update all internal links
- [ ] Add redirects for old `/en/...` and `/fr/...` URLs

---

## 🔄 Data Flow

### Complete Language Switch Sequence

```
User Clicks Flag (🇫🇷)
  ↓
Component State Update
  ↓
localStorage.setItem('avenir_language', 'fr')
  ↓
Check if logged in (clientId in localStorage)
  ↓ (If logged in)
PUT /api/client/update-language
  {
    clientId: "uuid",
    language: "fr"
  }
  ↓
Supabase UPDATE
  UPDATE clients 
  SET language = 'fr' 
  WHERE client_id = 'uuid'
  ↓
Toast Notification
  "✅ Passé au français"
  (3 second display)
  ↓
Router Navigation
  Current: /en/client/dashboard
  New:     /fr/client/dashboard
  ↓
Page Re-renders in French
  All t() translations switch to FR
  All dynamic content in French
```

---

## 💡 Usage Examples

### Example 1: Client Dashboard

```typescript
"use client";

import UniversalLanguageToggle from '@/components/UniversalLanguageToggle';
import { useLocale } from 'next-intl';

export default function ClientDashboard() {
  const locale = useLocale();
  const isFrench = locale === 'fr';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Language Toggle (automatically positioned) */}
      <UniversalLanguageToggle />
      
      {/* Dashboard Content */}
      <h1>{isFrench ? 'Tableau de bord' : 'Dashboard'}</h1>
      {/* ... rest of content */}
    </div>
  );
}
```

---

### Example 2: Settings Page

```typescript
"use client";

import UniversalLanguageToggle from '@/components/UniversalLanguageToggle';
import { useLocale } from 'next-intl';

export default function SettingsPage() {
  const locale = useLocale();

  return (
    <>
      <UniversalLanguageToggle />
      
      <div className="container">
        <h1>{locale === 'fr' ? 'Paramètres' : 'Settings'}</h1>
        {/* Settings form */}
      </div>
    </>
  );
}
```

---

## 🎯 Tooltip Behavior

### Hover State

**English Mode Active:**
```
┌─────────────────┐
│ (🇬🇧)  │  🇫🇷   │
│  English Mode   │ ← Appears on hover
└─────────────────┘
```

**French Mode Active:**
```
┌─────────────────┐
│  🇬🇧  │ (🇫🇷)   │
│ Mode Français   │ ← Appears on hover
└─────────────────┘
```

**Styling:**
- Background: Black with 90% opacity
- Text: White, 12px
- Position: 8px below toggle
- Padding: 6px 12px
- Border radius: 6px
- Shadow: Large

---

## 📊 Toast Notifications

### Switch to English

```
┌──────────────────────────────┐
│ ✅ Switched to English       │
│ (Green background, 3s)       │
└──────────────────────────────┘
```

### Switch to French

```
┌──────────────────────────────┐
│ ✅ Passé au français         │
│ (Green background, 3s)       │
└──────────────────────────────┘
```

**Animation:**
- Fade in from top
- Stay for 3 seconds
- Fade out

---

## ✅ Build Status

- ✅ **UniversalLanguageToggle:** Created
- ✅ **LanguageContext:** Created
- ✅ **API Endpoint:** Created (`/api/client/update-language`)
- ✅ **TypeScript:** Compiled successfully
- ✅ **Linting:** No errors
- ✅ **Build:** Success

---

## 🚀 Ready for Integration

**Core system complete and ready to integrate across all pages.**

**Next Steps:**
1. Add `<UniversalLanguageToggle />` to each page
2. Test language switching on all routes
3. Verify localStorage + Supabase sync
4. Confirm tooltip and toast behavior
5. Test cross-session persistence

---

**Generated:** October 16, 2025  
**Status:** ✅ Core System Complete  
**Build:** ✅ Success  
**Ready:** For platform-wide integration

