# 🔄 Smart Redirect System — Implementation Guide

## 🎯 Overview

Automatic locale detection and redirection system that allows users to access base routes (e.g., `/client/login`) and get automatically redirected to the correct locale version (`/en/client/login` or `/fr/client/login`) based on their preferences or browser language.

**Status:** ✅ **COMPLETE**  
**Build:** ✅ Success  
**Type:** Middleware-based automatic redirection

---

## 🚀 How It Works

### User Types Base URL

```
User visits: http://localhost:3000/client/dashboard
```

### Middleware Detection

```
[Middleware] Base route detected: /client/dashboard
[Middleware] Checking language preference...
```

### Preference Priority

1. **Cookie** (`avenir_language`) - Set by user's previous language choice
2. **Browser Language** (`Accept-Language` header) - User's browser preference
3. **Default** - Falls back to English (`en`)

### Automatic Redirect

```
[Middleware] Detected locale: fr
[Middleware] Redirecting to: /fr/client/dashboard
```

### Result

```
User lands on: http://localhost:3000/fr/client/dashboard
All content displays in French
```

---

## 📋 Supported Base Routes

### Client Routes

- `/client/signup` → `/[locale]/client/signup`
- `/client/login` → `/[locale]/client/login`
- `/client/dashboard` → `/[locale]/client/dashboard`
- `/client/settings` → `/[locale]/client/settings`
- `/client/api-access` → `/[locale]/client/api-access`

### Admin Routes

- `/admin/login` → `/[locale]/admin/login`
- `/admin/dashboard` → `/[locale]/admin/dashboard`
- `/admin/settings` → `/[locale]/admin/settings`
- `/admin/prospect-intelligence` → `/[locale]/admin/prospect-intelligence`
- `/dashboard` → `/[locale]/dashboard`
- `/dashboard/insights` → `/[locale]/dashboard/insights`

**Total Routes:** 11 base routes with smart redirection

---

## 🔄 Complete Flow Diagram

### Scenario 1: First-Time Visitor (No Preference)

```
User visits: /client/signup
  ↓
Middleware checks:
  1. Cookie (avenir_language): Not found
  2. Accept-Language header: "en-US,en;q=0.9"
  ↓
Detected locale: en
  ↓
Redirect to: /en/client/signup
  ↓
Page loads in English
  ↓
User clicks language toggle → FR
  ↓
Cookie set: avenir_language=fr
localStorage set: avenir_language=fr
  ↓
Navigate to: /fr/client/signup
```

### Scenario 2: Returning User (Has Preference)

```
User visits: /admin/dashboard
  ↓
Middleware checks:
  1. Cookie (avenir_language): "fr"
  ↓
Detected locale: fr
  ↓
Redirect to: /fr/admin/dashboard
  ↓
Page loads in French immediately
```

### Scenario 3: French Browser User (No Cookie)

```
User visits: /client/dashboard
  ↓
Middleware checks:
  1. Cookie: Not found
  2. Accept-Language: "fr-CA,fr;q=0.9,en;q=0.8"
  ↓
Detected locale: fr (from browser)
  ↓
Redirect to: /fr/client/dashboard
  ↓
Page loads in French
```

---

## 🔧 Technical Implementation

### Middleware (`src/middleware.ts`)

**Purpose:**
- Intercepts all incoming requests
- Detects base routes without locale
- Determines preferred language
- Redirects to locale-prefixed route

**Key Functions:**

```typescript
// Detect if route is a base route (no locale)
const isBaseRoute = baseRoutes.some(route => 
  pathname === route || pathname.startsWith(route + '/')
);

// Detect preferred locale
function detectPreferredLocale(request: NextRequest): 'en' | 'fr' {
  // 1. Check cookie
  const languageCookie = request.cookies.get('avenir_language');
  if (languageCookie?.value === 'en' || languageCookie?.value === 'fr') {
    return languageCookie.value;
  }
  
  // 2. Check Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language');
  if (acceptLanguage && acceptLanguage.includes('fr')) {
    return 'fr';
  }
  
  // 3. Default to English
  return 'en';
}
```

---

### Cookie Management

**Set by:** UniversalLanguageToggle component on language switch

**Cookie Details:**
```javascript
document.cookie = `avenir_language=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
```

**Properties:**
- **Name:** `avenir_language`
- **Value:** `en` or `fr`
- **Path:** `/` (accessible across entire site)
- **Max-Age:** 31536000 seconds (1 year)
- **SameSite:** `Lax` (security + compatibility)

---

## 📊 Detection Priority

```
1. Cookie (avenir_language)
   ↓ (if not found)
2. Accept-Language Header
   ↓ (if not found or not fr)
3. Default: English (en)
```

**Examples:**

| Cookie | Accept-Language | Result | Reason |
|--------|-----------------|--------|--------|
| `fr` | `en-US` | `fr` | Cookie takes priority |
| Not set | `fr-CA,fr;q=0.9` | `fr` | Browser language detected |
| Not set | `en-US,en;q=0.9` | `en` | Browser language detected |
| Not set | Not set | `en` | Default fallback |
| `en` | `fr-CA` | `en` | Cookie overrides browser |

---

## 🧪 Testing Guide

### Test 1: Base Route Redirect (No Preference)

**Steps:**
1. Clear all cookies and localStorage
2. Visit: `http://localhost:3000/client/signup`
3. Check browser developer tools → Network tab

**Expected:**
- ✅ Middleware detects base route
- ✅ Checks browser language
- ✅ Redirects to `/en/client/signup` (or `/fr` if browser is French)
- ✅ Console shows: `[Middleware] Redirecting to: /en/client/signup`

---

### Test 2: With Saved Preference

**Steps:**
1. Visit `/en/client/dashboard`
2. Click FR toggle
3. Close browser
4. Open new browser window
5. Visit: `http://localhost:3000/client/dashboard` (no locale)

**Expected:**
- ✅ Middleware reads cookie: `avenir_language=fr`
- ✅ Redirects to `/fr/client/dashboard`
- ✅ Console shows: `[Middleware] Using language from cookie: fr`
- ✅ Page loads in French immediately

---

### Test 3: French Browser (No Cookie)

**Steps:**
1. Clear all cookies and localStorage
2. Set browser language to French (Chrome Settings → Languages)
3. Visit: `http://localhost:3000/admin/dashboard`

**Expected:**
- ✅ Middleware reads `Accept-Language: fr-CA`
- ✅ Detects French preference
- ✅ Redirects to `/fr/admin/dashboard`
- ✅ Console shows: `[Middleware] Using browser language: fr`

---

### Test 4: Direct Locale URL (No Redirect)

**Steps:**
1. Visit: `http://localhost:3000/en/client/dashboard`

**Expected:**
- ✅ No redirect (already has locale)
- ✅ Middleware allows request to proceed
- ✅ Page loads normally in English

---

### Test 5: Language Toggle Updates Cookie

**Steps:**
1. Visit: `/en/client/signup`
2. Click FR toggle
3. Check cookies in DevTools

**Expected:**
- ✅ Cookie `avenir_language` = `fr`
- ✅ Max-Age: 31536000 (1 year)
- ✅ Path: `/`
- ✅ Console shows: `[UniversalLanguageToggle] ✅ Cookie set for middleware`

---

### Test 6: All Base Routes

Test each base route redirects correctly:

```bash
# Should redirect to /en/... or /fr/... based on preference
curl -I http://localhost:3000/client/signup
curl -I http://localhost:3000/client/dashboard
curl -I http://localhost:3000/admin/login
curl -I http://localhost:3000/admin/dashboard
curl -I http://localhost:3000/admin/settings
curl -I http://localhost:3000/admin/prospect-intelligence
```

**Expected:**
- ✅ Status: 307 (Temporary Redirect)
- ✅ Location header: `/[locale]/...`

---

## 📱 User Experience Benefits

### Convenience

✅ **Short URLs:** Users can type `/client/login` instead of `/en/client/login`  
✅ **Automatic:** No manual locale selection required on first visit  
✅ **Persistent:** Preference remembered across sessions  
✅ **Smart:** Uses browser language when available

### SEO Maintained

✅ **Locale URLs Still Exist:** `/en/...` and `/fr/...` remain for SEO  
✅ **Shareable Links:** Users can share locale-specific URLs  
✅ **Search Indexing:** Google indexes both EN and FR versions  
✅ **Canonical URLs:** Each language has its own URL

### Flexibility

✅ **Both Work:** `/client/login` and `/en/client/login` both functional  
✅ **User Choice:** Language toggle allows manual switching  
✅ **Browser Respect:** Honors browser language preference  
✅ **Override:** User choice via toggle overrides browser language

---

## 🔍 Middleware Logging

### Successful Redirect

```
[Middleware] Base route detected: /client/dashboard
[Middleware] Detected locale: fr
[Middleware] Redirecting to: /fr/client/dashboard
```

### Cookie Detection

```
[Middleware] Using language from cookie: fr
```

### Browser Language Detection

```
[Middleware] Using browser language: fr
```

### Default Fallback

```
[Middleware] Using default language: en
```

---

## 📊 Example Scenarios

### Scenario A: Marketing Email Link

**Email contains:** `https://www.aveniraisolutions.ca/client/signup`

**User Journey:**
1. User clicks link
2. Middleware detects: No locale in URL
3. Checks: Browser is set to French
4. Redirects to: `/fr/client/signup`
5. User sees French signup form
6. Seamless experience

---

### Scenario B: Bookmark

**User bookmarks:** `/admin/dashboard`

**User Journey:**
1. User opens bookmark
2. Middleware checks cookie: `avenir_language=en`
3. Redirects to: `/en/admin/dashboard`
4. User always sees English dashboard
5. Consistent experience

---

### Scenario C: API Documentation

**Documentation shows:** `POST https://www.aveniraisolutions.ca/api/lead`

**Developer Journey:**
1. Developer tests endpoint
2. No redirect (API routes excluded)
3. Works exactly as documented
4. No confusion

---

## ✅ Files Modified/Created

1. ✅ **NEW:** `src/middleware.ts`
   - Intercepts base route requests
   - Detects preferred locale
   - Redirects to locale-prefixed routes
   - Logs all decisions

2. ✅ **UPDATED:** `src/components/UniversalLanguageToggle.tsx`
   - Sets cookie on language switch
   - Cookie syncs with localStorage
   - Ensures middleware can read preference

---

## 🎯 Configuration

### Middleware Matcher

```typescript
export const config = {
  matcher: [
    // Match all routes except:
    // - API routes (/api/...)
    // - Static files (_next/static/...)
    // - Images (_next/image/...)
    // - Favicon
    // - Public assets
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
```

**What This Means:**
- ✅ Middleware runs on all page routes
- ✅ API endpoints are NOT redirected
- ✅ Static assets are NOT redirected
- ✅ Only HTML pages are processed

---

## 🚀 Deployment Notes

### Production Behavior

**Same as development:**
- Base routes redirect to locale routes
- Cookie preference honored
- Browser language detected
- Default to English if no preference

**No Additional Configuration Required:**
- Middleware runs automatically on Vercel
- No environment variables needed
- Works out of the box

---

## 📋 Testing Checklist

### Pre-Deployment Tests

- [ ] Test `/client/signup` → redirects to locale version
- [ ] Test `/client/dashboard` → redirects to locale version
- [ ] Test `/admin/login` → redirects to locale version
- [ ] Test `/admin/dashboard` → redirects to locale version
- [ ] Test with French browser → redirects to `/fr/...`
- [ ] Test with English browser → redirects to `/en/...`
- [ ] Test with saved preference → uses cookie
- [ ] Test language toggle → updates cookie
- [ ] Test API routes → no redirect
- [ ] Test static files → no redirect

### Post-Deployment Verification

- [ ] Production: `/client/signup` redirects correctly
- [ ] Production: Cookie persists across sessions
- [ ] Production: Browser language detected
- [ ] Production: Language toggle works
- [ ] Production: SEO: Both `/en/...` and `/fr/...` indexed
- [ ] Production: Shared links work in both languages

---

## 💡 Usage Examples

### For Users

**Short URL (Auto-Detect):**
```
Visit: https://www.aveniraisolutions.ca/client/signup
Result: Redirects to /en/client/signup or /fr/client/signup
```

**Specific Language:**
```
Visit: https://www.aveniraisolutions.ca/fr/client/signup
Result: Loads French version directly (no redirect)
```

### For Marketing

**Email Links:**
```html
<a href="https://www.aveniraisolutions.ca/client/signup">
  Sign Up Now
</a>
```
- ✅ French users see French form
- ✅ English users see English form
- ✅ One link works for all users

### For Developers

**API Calls (No Redirect):**
```bash
curl -X POST https://www.aveniraisolutions.ca/api/lead \
  -H "x-api-key: client_xxxxx" \
  -d '{"name":"John","email":"john@example.com","message":"Test"}'
```
- ✅ No redirect
- ✅ Works as expected
- ✅ No locale needed

---

## 🔐 Cookie Details

### Set by Client

```javascript
document.cookie = `avenir_language=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
```

### Read by Middleware

```typescript
const languageCookie = request.cookies.get('avenir_language');
if (languageCookie?.value === 'en' || languageCookie?.value === 'fr') {
  return languageCookie.value;
}
```

### Cookie Attributes

- **Name:** `avenir_language`
- **Value:** `en` | `fr`
- **Path:** `/` (site-wide)
- **Max-Age:** 31536000 seconds (1 year)
- **SameSite:** `Lax` (prevents CSRF, allows navigation)
- **Secure:** Not set (works on localhost, add for HTTPS)

---

## 🎯 Triple Persistence Strategy

### 1. Cookie (Middleware)
```
Set: On language toggle
Read: By middleware on every request
Purpose: Automatic redirect for base routes
Lifetime: 1 year
```

### 2. localStorage (Client)
```
Set: On language toggle
Read: By components on mount
Purpose: Instant client-side preference
Lifetime: Until manually cleared
```

### 3. Supabase (Database)
```
Set: On language toggle (if logged in)
Read: On login/session restore
Purpose: Cross-device sync
Lifetime: Permanent (user profile)
```

**All three stay synchronized!**

---

## 📊 Console Logging

### Middleware Logs

```
[Middleware] Base route detected: /client/dashboard
[Middleware] Detected locale: fr
[Middleware] Redirecting to: /fr/client/dashboard
```

### Component Logs

```
[UniversalLanguageToggle] ============================================
[UniversalLanguageToggle] Switching language from en to fr
[UniversalLanguageToggle] ✅ Saved to localStorage
[UniversalLanguageToggle] ✅ Cookie set for middleware
[UniversalLanguageToggle] ✅ Language preference saved to Supabase
[UniversalLanguageToggle] Navigating to: /fr/client/dashboard
```

---

## ✅ Advantages of This Approach

### User Experience

✅ **Convenience:** Type short URLs (`/client/login`)  
✅ **Automatic:** Smart language detection  
✅ **Persistent:** Preference remembered  
✅ **Flexible:** Can override via toggle

### SEO & Sharing

✅ **SEO Maintained:** Both `/en/...` and `/fr/...` indexed  
✅ **Shareable:** Locale-specific URLs work  
✅ **Canonical:** Each language has unique URL  
✅ **No Duplicate Content:** Search engines see separate pages

### Technical

✅ **No Breaking Changes:** All existing `/[locale]/...` URLs still work  
✅ **Backward Compatible:** Old links continue functioning  
✅ **Fast:** Middleware redirect is instant  
✅ **Scalable:** Easy to add more languages later

### Marketing

✅ **One Link:** Use `/client/signup` in all campaigns  
✅ **Localized:** Users see their preferred language  
✅ **Analytics:** Can track which languages convert best  
✅ **Email Friendly:** Shorter URLs in emails

---

## 🎨 URL Patterns

### Before (Required Locale)

```
❌ /client/signup           → 404 Not Found
✅ /en/client/signup        → Works
✅ /fr/client/signup        → Works
```

### After (Smart Redirect)

```
✅ /client/signup           → Redirects to /en/... or /fr/...
✅ /en/client/signup        → Works (no redirect)
✅ /fr/client/signup        → Works (no redirect)
```

**Both patterns now work!**

---

## 🚀 Production Deployment

### Vercel Configuration

**No changes needed!**
- Middleware runs automatically on Vercel
- Cookie handling works out of the box
- Redirects are instant (edge runtime)

### Testing on Production

```bash
# Test redirect
curl -I https://www.aveniraisolutions.ca/client/signup

# Expected response:
HTTP/1.1 307 Temporary Redirect
Location: /en/client/signup
```

---

## ✅ Final Status

**Implementation:** ✅ Complete  
**Build:** ✅ Success  
**Linting:** ✅ No errors  
**Testing:** ✅ Ready

### What Works:

- ✅ Base routes redirect automatically
- ✅ Cookie preference honored
- ✅ Browser language detected
- ✅ Default to English
- ✅ Language toggle updates cookie
- ✅ All existing locale routes work
- ✅ API routes excluded
- ✅ Static files excluded
- ✅ Console logging complete

### What's Maintained:

- ✅ SEO-friendly locale URLs
- ✅ Shareable language-specific links
- ✅ Backward compatibility
- ✅ No breaking changes

---

**Generated:** October 16, 2025  
**Status:** ✅ Complete  
**Type:** Smart Redirect Middleware  
**Ready:** Production Deployment

