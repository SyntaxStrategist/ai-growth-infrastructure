# PDL Security Update - Server-Side Key Validation

**Date:** October 17, 2025  
**Commit:** `7522b49`  
**Type:** Security Enhancement  
**Status:** ✅ Complete

---

## Overview

Enhanced the People Data Labs integration with proper server-side API key validation. The `PEOPLE_DATA_LABS_API_KEY` is now checked securely on the server, and only a boolean flag is exposed to the client.

---

## Security Issue Addressed

### Before

The client component was checking for PDL configuration directly:
```typescript
// ❌ Not secure - would need to expose key to check
usePdl: true  // Hardcoded, no server-side validation
```

### After

Server-side endpoint checks for API key and returns only a boolean:
```typescript
// ✅ Secure - server checks, client gets boolean only
GET /api/prospect-intelligence/config
→ { hasPdl: true }  // No key exposed
```

---

## Implementation

### New API Endpoint

**File:** `src/app/api/prospect-intelligence/config/route.ts`

**Purpose:** Check server-side environment variables and return configuration status

**Code:**
```typescript
export async function GET(req: NextRequest) {
  // Check server-side environment variables
  const hasPdlKey = !!process.env.PEOPLE_DATA_LABS_API_KEY;
  const hasApolloKey = !!process.env.APOLLO_API_KEY;
  
  return NextResponse.json({
    success: true,
    data: {
      hasPdl: hasPdlKey,        // Boolean only
      hasApollo: hasApolloKey,  // Boolean only
      defaultUsePdl: hasPdlKey, // Auto-enable if configured
      // ... other config
    }
  });
}
```

**Security:**
- ✅ API keys never sent to client
- ✅ Only boolean flags exposed
- ✅ Server-side validation
- ✅ No key exposure in network tab

---

### Client Update

**File:** `src/app/[locale]/admin/prospect-intelligence/page.tsx`

**Changes:**

**1. Server Config State:**
```typescript
const [serverConfig, setServerConfig] = useState<{
  hasPdl: boolean;
  hasApollo: boolean;
  autoSubmitEnabled: boolean;
}>({
  hasPdl: false,
  hasApollo: false,
  autoSubmitEnabled: false
});
```

**2. Fetch Config on Mount:**
```typescript
useEffect(() => {
  fetchServerConfig();
}, []);

const fetchServerConfig = async () => {
  const response = await fetch('/api/prospect-intelligence/config');
  const data = await response.json();
  
  setServerConfig({
    hasPdl: data.data.hasPdl,
    hasApollo: data.data.hasApollo,
    autoSubmitEnabled: data.data.autoSubmitEnabled
  });
  
  // Auto-enable PDL if key is present
  if (data.data.hasPdl) {
    setConfig(prev => ({ ...prev, usePdl: true }));
  }
};
```

**3. Conditional Rendering:**
```tsx
{/* PDL Toggle - Only show if API key is configured server-side */}
{serverConfig.hasPdl && (
  <div className="flex items-end">
    <label className="flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={config.usePdl}
        onChange={(e) => setConfig({ ...config, usePdl: e.target.checked })}
        className="mr-2"
        disabled={config.testMode}
      />
      <span className="text-sm text-white/70">
        {isFrench ? 'Utiliser People Data Labs' : 'Use People Data Labs'}
      </span>
    </label>
  </div>
)}
```

---

## How It Works

### Flow Diagram

```
1. Page loads (client component)
   ↓
2. useEffect calls fetchServerConfig()
   ↓
3. GET /api/prospect-intelligence/config
   ↓
4. Server checks: !!process.env.PEOPLE_DATA_LABS_API_KEY
   ↓
5. Server returns: { hasPdl: true/false }
   ↓
6. Client receives boolean only
   ↓
7. If hasPdl === true:
   - Show PDL toggle
   - Auto-enable PDL
   ↓
8. If hasPdl === false:
   - Hide PDL toggle
   - Use other data sources
```

---

## API Response Example

### Request

```http
GET /api/prospect-intelligence/config
```

### Response (with PDL key configured)

```json
{
  "success": true,
  "data": {
    "hasPdl": true,
    "hasApollo": true,
    "hasGoogleSearch": false,
    "pdlRateLimit": 1000,
    "autoSubmitEnabled": false,
    "defaultUsePdl": true,
    "defaultScanForms": true,
    "features": {
      "pdl": true,
      "apollo": true,
      "formScanning": true,
      "autoSubmit": false
    }
  }
}
```

### Response (without PDL key)

```json
{
  "success": true,
  "data": {
    "hasPdl": false,
    "hasApollo": true,
    "hasGoogleSearch": false,
    "pdlRateLimit": 1000,
    "autoSubmitEnabled": false,
    "defaultUsePdl": false,
    "defaultScanForms": true,
    "features": {
      "pdl": false,
      "apollo": true,
      "formScanning": true,
      "autoSubmit": false
    }
  }
}
```

---

## Security Benefits

### Before
❌ Could potentially expose API key if not careful  
❌ Client-side check wouldn't be secure  
❌ No validation of key presence

### After
✅ **API key checked server-side only**  
✅ **Boolean flag exposed (safe)**  
✅ **No key in network requests**  
✅ **No key in client bundle**  
✅ **Production-safe**  

---

## Testing

### Test 1: With PDL Key

```bash
# In .env.local
PEOPLE_DATA_LABS_API_KEY=your_key_here

# Start server
npm run dev

# Navigate to /en/admin/prospect-intelligence
```

**Expected:**
- PDL toggle appears ✅
- Toggle is auto-enabled ✅
- Console shows: "Server config loaded: { hasPdl: true }"

### Test 2: Without PDL Key

```bash
# In .env.local
PEOPLE_DATA_LABS_API_KEY=
# (empty or commented out)

# Restart server
npm run dev

# Navigate to /en/admin/prospect-intelligence
```

**Expected:**
- PDL toggle does NOT appear ✅
- Only "Test Mode" and "Scan Forms" visible
- Console shows: "Server config loaded: { hasPdl: false }"

### Test 3: Network Tab Inspection

**Steps:**
1. Open browser DevTools → Network tab
2. Load prospect intelligence page
3. Find request to `/api/prospect-intelligence/config`
4. Inspect response

**Expected:**
```json
{
  "hasPdl": true  // ✅ Boolean only, no API key
}
```

**Should NOT see:**
```json
{
  "pdlApiKey": "abc123..."  // ❌ Never expose actual key!
}
```

---

## Code Review Checklist

- [x] API key checked on server-side only
- [x] No `NEXT_PUBLIC_*` variable for PDL key
- [x] Boolean flag used for client rendering
- [x] No API key in network responses
- [x] No API key in client bundle
- [x] Proper error handling
- [x] Console logging for debugging
- [x] Auto-enable when key present
- [x] Build passes
- [x] No linting errors

**All checks passed!** ✅

---

## Deployment Considerations

### Environment Variables (Server-Side Only)

**Vercel:**
```bash
# In Vercel Dashboard → Settings → Environment Variables
PEOPLE_DATA_LABS_API_KEY=your_key_here
PDL_RATE_LIMIT_MS=1000
```

**Important:**
- ✅ Use "Server" scope (NOT "Client")
- ✅ Never use `NEXT_PUBLIC_PEOPLE_DATA_LABS_API_KEY`
- ✅ Key is only accessible in API routes and server components

---

## Files Modified

1. ✅ `src/app/api/prospect-intelligence/config/route.ts` (NEW)
   - Server-side environment check
   - Returns configuration status
   - Securely exposes boolean flags

2. ✅ `src/app/[locale]/admin/prospect-intelligence/page.tsx` (UPDATED)
   - Fetches server config on mount
   - Conditional rendering of PDL toggle
   - Auto-enables PDL when key present

**Total:** +122 lines, 2 files

---

## Commit Details

**Branch:** `feature/pdl-integration`  
**Commit:** `7522b49`  
**Message:** "security: Add server-side API key check for PDL toggle"

**Changes:**
```
 src/app/api/prospect-intelligence/config/route.ts  | 59 ++++++
 src/app/[locale]/admin/prospect-intelligence/page.tsx | 63 ++++--
 2 files changed, 122 insertions(+), 15 deletions(-)
```

---

## Summary

✅ **Environment variable accessed server-side only**  
✅ **Boolean prop (`hasPdl`) exposed to client**  
✅ **PDL toggle renders only when key is configured**  
✅ **No hardcoded keys**  
✅ **Secure implementation**  
✅ **Production-ready**  

The PDL toggle now properly checks for API key presence on the server without exposing the actual key to the client! 🔐

---

**Status:** ✅ Complete and Secure  
**Ready for:** Review and merge

