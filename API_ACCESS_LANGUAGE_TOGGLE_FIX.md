# API Access Language Toggle Fix

## Issue Summary

When users were on the API access page at `https://www.aveniraisolutions.ca/en/client/api-access` and clicked the FR language toggle, they received a DNS error (`DNS_PROBE_FINISHED_NXDOMAIN`) with the browser trying to navigate to domain `fr` instead of `/fr/client/api-access`.

## Root Cause Analysis

The API access page (`src/app/[locale]/client/api-access/page.tsx`) had a **custom language toggle implementation** that was incorrectly constructing the URL path.

### The Bug

```typescript
// Before (BUGGY CODE)
onClick={() => {
  const segments = window.location.pathname.split('/');
  if (segments[1] === 'en' || segments[1] === 'fr') {
    segments[1] = 'fr';
  } else {
    segments.unshift('fr');
  }
  router.push('/' + segments.join('/'));  // ❌ BUG HERE
}}
```

### What Went Wrong

When splitting `/en/client/api-access` by `/`, the result was:
- `['', 'en', 'client', 'api-access']` (empty string at index 0)

After changing to 'fr':
- `['', 'fr', 'client', 'api-access']`

Then `segments.join('/')` produced:
- `/fr/client/api-access`

But then doing `'/' + '/fr/client/api-access'` resulted in:
- `//fr/client/api-access` ❌ **DOUBLE SLASH!**

The browser interpreted `//fr` as a **protocol-relative URL**, attempting to navigate to the `fr` domain, causing the DNS error.

## Solution Implemented

### 1. Fixed Router Import

Changed the API access page to use the **locale-aware router** from `next-intl/routing`:

```typescript
// Before
import { useRouter } from "next/navigation";

// After ✅
import { useRouter } from "../../../../i18n/routing";
```

### 2. Fixed Path Construction

Updated the language toggle logic to properly filter empty strings and construct the path correctly:

```typescript
// After (FIXED CODE) ✅
onClick={() => {
  const segments = window.location.pathname.split('/').filter(s => s); // ✅ Filter empty strings
  if (segments[0] === 'en' || segments[0] === 'fr') {
    segments[0] = 'fr';
  } else {
    segments.unshift('fr');
  }
  router.push('/' + segments.join('/'));
}}
```

Now the logic works correctly:
- Split `/en/client/api-access` → `['en', 'client', 'api-access']` (no empty string)
- Change to 'fr' → `['fr', 'client', 'api-access']`
- Join → `'fr/client/api-access'`
- Final path → `'/fr/client/api-access'` ✅ **CORRECT!**

### 3. Fixed LanguageToggle Component

Also updated the shared `LanguageToggle` component to use the locale-aware router:

```typescript
// src/components/LanguageToggle.tsx
// Before
import { useRouter, usePathname } from 'next/navigation';

// After ✅
import { useRouter, usePathname } from '../i18n/routing';
```

## Files Modified

1. `/Users/michaeloni/ai-growth-infrastructure/src/app/[locale]/client/api-access/page.tsx`
   - Fixed router import (line 5)
   - Fixed language toggle path construction in "not authenticated" view (lines 73-79, 97-103)
   - Fixed language toggle path construction in main header (lines 148-154, 172-178)

2. `/Users/michaeloni/ai-growth-infrastructure/src/components/LanguageToggle.tsx`
   - Fixed router import (line 5)

## Verification

- ✅ No linter errors in modified files
- ✅ Path construction logic now produces correct single-slash URLs
- ✅ Locale-aware router from `next-intl/routing` handles locale switching properly
- ✅ Other client pages already use the `LanguageToggle` component (verified: dashboard, insights, prospect-intelligence, signup, login, settings)

## Testing Instructions

### Manual Testing

1. Navigate to `https://www.aveniraisolutions.ca/en/client/api-access`
2. Click the **FR** button in the language toggle
3. Expected result: Page should navigate to `/fr/client/api-access` successfully
4. Verify URL in browser address bar is correct
5. Click the **EN** button to switch back
6. Expected result: Page should navigate to `/en/client/api-access` successfully

### Edge Cases to Test

- Toggle language when not authenticated (should also work)
- Toggle from `/fr/client/api-access` to EN
- Toggle from `/en/client/api-access` to FR
- Verify no other client pages have this issue (they use LanguageToggle component)

## Impact

- **Severity**: High (blocking user experience for bilingual navigation)
- **Scope**: API access page only
- **Users Affected**: All users trying to switch languages on the API access page
- **Backward Compatibility**: No breaking changes, purely a bug fix

## Related Issues

- The bug was specific to the API access page's custom language toggle implementation
- All other client pages use the shared `LanguageToggle` component, which is now also fixed as a preventive measure

## Date

October 21, 2025

