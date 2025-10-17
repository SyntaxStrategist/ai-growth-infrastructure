# Config Fetch Testing Guide

## ✅ What Was Fixed

### 1. Absolute URL Construction
```typescript
const base = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
const endpoint = '/api/prospect-intelligence/config';
const fullUrl = `${base}${endpoint}`;
```

**Why this matters:**
- Works in both SSR (server-side rendering) and CSR (client-side rendering)
- Respects `NEXT_PUBLIC_SITE_URL` for production deployments
- Falls back to `window.location.origin` for local development

### 2. Enhanced useEffect with Promise Handlers
```typescript
useEffect(() => {
  console.log('[ProspectDashboard] 🔄 useEffect triggered - loading server configuration');
  fetchServerConfig()
    .then((config) => {
      console.log('[ProspectDashboard] ✅ fetchServerConfig completed successfully:', config);
    })
    .catch((err) => {
      console.error('[ProspectDashboard] ❌ fetchServerConfig threw error:', err);
    });
}, []);
```

**Benefits:**
- Confirms useEffect runs on mount
- Logs both success and failure explicitly
- Provides clear debugging information

### 3. Comprehensive Logging Flow

**On Mount:**
```
[ProspectDashboard] 🔄 useEffect triggered - loading server configuration
[ProspectDashboard] ============================================
[ProspectDashboard] Fetching config from /api/prospect-intelligence/config
[ProspectDashboard] useEffect triggered - component mounted
[ProspectDashboard] 📡 Base URL: http://localhost:3000
[ProspectDashboard] 📡 Endpoint: /api/prospect-intelligence/config
[ProspectDashboard] 📡 Full URL: http://localhost:3000/api/prospect-intelligence/config
[ProspectDashboard] 🚀 Starting fetch...
```

**On Success:**
```
[ProspectDashboard] ✅ Fetch completed
[ProspectDashboard] Response status: 200
[ProspectDashboard] Response ok: true
[ProspectDashboard] Response headers: { contentType: 'application/json', contentLength: '342' }
[ProspectDashboard] 📖 Parsing JSON response...
[ProspectDashboard] 🧠 Server config received: { "success": true, "data": { ... } }
[ProspectDashboard] ✅ Server config loaded successfully
[ProspectDashboard] ├─ hasPdl: true
[ProspectDashboard] ├─ hasApollo: true
[ProspectDashboard] └─ autoSubmitEnabled: false
[ProspectDashboard] 📝 Setting serverConfig state to: { hasPdl: true, ... }
[ProspectDashboard] ✅ PDL API key detected - auto-enabling PDL toggle
[ProspectDashboard] 🎯 PDL toggle should now be visible
[ProspectDashboard] ============================================
[ProspectDashboard] ✅ fetchServerConfig completed successfully: { hasPdl: true, ... }
```

**On Error:**
```
[ProspectDashboard] ❌ EXCEPTION during fetch server config
[ProspectDashboard] ❌ Error object: TypeError: Failed to fetch
[ProspectDashboard] ❌ Error type: TypeError
[ProspectDashboard] ❌ Error message: Failed to fetch
[ProspectDashboard] ❌ Error stack: TypeError: Failed to fetch...
[ProspectDashboard] ⚠️  Using fallback config due to exception: { hasPdl: false, ... }
[ProspectDashboard] ============================================
[ProspectDashboard] ❌ fetchServerConfig threw error: TypeError: Failed to fetch
```

### 4. Safe Fallback Configuration

**All error paths return:**
```typescript
{
  hasPdl: false,
  hasApollo: false,
  autoSubmitEnabled: false
}
```

**Triggered by:**
- Non-200 HTTP status
- Non-JSON content-type
- JSON parse error
- Network timeout/failure
- Missing `success` or `data` fields

### 5. Request Headers

```typescript
const response = await fetch(fullUrl, {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
  },
});
```

Explicitly requests JSON to help with content negotiation.

---

## 🧪 Testing Instructions

### Test 1: Normal Operation (PDL Key Present)

**Setup:**
```bash
# Ensure PDL key is set
grep PEOPLE_DATA_LABS_API_KEY .env.local

# Start dev server
npm run dev
```

**Steps:**
1. Open browser console (F12)
2. Navigate to: http://localhost:3000/en/admin/prospect-intelligence
3. Watch console logs

**Expected Logs:**
```
[ProspectDashboard] 🔄 useEffect triggered
[ProspectDashboard] Fetching config from /api/prospect-intelligence/config
[ProspectDashboard] 📡 Full URL: http://localhost:3000/api/prospect-intelligence/config
[ProspectDashboard] ✅ Fetch completed
[ProspectDashboard] hasPdl: true
[ProspectDashboard] 🎯 PDL toggle should now be visible
```

**Expected UI:**
- ✅ No warning banner
- ✅ PDL toggle visible
- ✅ Toggle is checked

### Test 2: Missing PDL Key

**Setup:**
```bash
# Comment out PDL key
sed -i '' 's/^PEOPLE_DATA_LABS_API_KEY/#PEOPLE_DATA_LABS_API_KEY/' .env.local

# Restart server
npm run dev
```

**Expected Logs:**
```
[ProspectDashboard] hasPdl: false
[ProspectDashboard] ⚠️  PDL toggle will remain hidden
```

**Expected UI:**
- ⚠️  Yellow warning banner appears
- ❌ PDL toggle hidden
- ✅ Page still functional

### Test 3: Network Error Simulation

**Setup:**
```bash
# Block the API endpoint (temporarily rename route file)
mv src/app/api/prospect-intelligence/config/route.ts src/app/api/prospect-intelligence/config/route.ts.bak

# Restart server
npm run dev
```

**Expected Logs:**
```
[ProspectDashboard] Response status: 404
[ProspectDashboard] ❌ Non-JSON response from config API
[ProspectDashboard] Response body (first 500 chars): <!DOCTYPE html>...
[ProspectDashboard] ⚠️  Using fallback config: { hasPdl: false, ... }
```

**Expected UI:**
- ⚠️  Warning banner appears
- ✅ Page doesn't crash
- ✅ Fallback config applied

**Cleanup:**
```bash
mv src/app/api/prospect-intelligence/config/route.ts.bak src/app/api/prospect-intelligence/config/route.ts
```

### Test 4: Check Network Tab

**Steps:**
1. Open DevTools → Network tab
2. Refresh page
3. Find request to `/api/prospect-intelligence/config`

**Verify:**
- ✅ Method: GET
- ✅ Status: 200
- ✅ Request Headers include: `Accept: application/json`
- ✅ Response Headers include: `content-type: application/json`
- ✅ Response body is valid JSON

---

## 🔍 Debugging Checklist

If the PDL toggle still doesn't appear, check these logs in order:

### Step 1: useEffect Triggered?
**Look for:** `[ProspectDashboard] 🔄 useEffect triggered`
- ✅ Found → useEffect is running
- ❌ Not found → Component not mounting properly

### Step 2: Fetch Started?
**Look for:** `[ProspectDashboard] 🚀 Starting fetch...`
- ✅ Found → Fetch is being called
- ❌ Not found → fetchServerConfig not being called

### Step 3: Fetch Completed?
**Look for:** `[ProspectDashboard] ✅ Fetch completed`
- ✅ Found → Network request succeeded
- ❌ Not found → Network error (check error logs)

### Step 4: JSON Parsed?
**Look for:** `[ProspectDashboard] 📖 Parsing JSON response...`
- ✅ Found → Response is JSON
- ❌ Not found → Response is HTML/error page

### Step 5: Config Loaded?
**Look for:** `[ProspectDashboard] ✅ Server config loaded successfully`
- ✅ Found → Config has `success: true` and `data` field
- ❌ Not found → Malformed response

### Step 6: hasPdl Value?
**Look for:** `[ProspectDashboard] ├─ hasPdl: true/false`
- ✅ `true` → PDL key detected
- ❌ `false` → PDL key missing or not detected

### Step 7: State Updated?
**Look for:** `[ProspectDashboard] 📝 Setting serverConfig state to: { hasPdl: true }`
- ✅ Found → State should trigger re-render
- ❌ Not found → State update failed

### Step 8: Toggle Render?
**Look for:** `[ProspectDashboard] ✅ Rendering PDL toggle`
- ✅ Found → Toggle should be in DOM
- ❌ Not found → Conditional render failing

### Step 9: Check DOM
**DevTools → Elements → Search for:** "People Data Labs"
- ✅ Found → Toggle is rendered (check CSS)
- ❌ Not found → Render condition failed

---

## 📊 Expected Log Flow (Success)

```
1. [ProspectDashboard] 🔄 useEffect triggered
2. [ProspectDashboard] Fetching config from /api/prospect-intelligence/config
3. [ProspectDashboard] 📡 Full URL: http://localhost:3000/api/prospect-intelligence/config
4. [ProspectDashboard] 🚀 Starting fetch...
5. [ProspectDashboard] ✅ Fetch completed
6. [ProspectDashboard] Response status: 200
7. [ProspectDashboard] Response ok: true
8. [ProspectDashboard] 📖 Parsing JSON response...
9. [ProspectDashboard] 🧠 Server config received: {...}
10. [ProspectDashboard] ✅ Server config loaded successfully
11. [ProspectDashboard] ├─ hasPdl: true
12. [ProspectDashboard] 📝 Setting serverConfig state to: { hasPdl: true }
13. [ProspectDashboard] ✅ PDL API key detected
14. [ProspectDashboard] 🎯 PDL toggle should now be visible
15. [ProspectDashboard] ✅ fetchServerConfig completed successfully
16. [ProspectDashboard] 🎨 Rendering component...
17. [ProspectDashboard] Rendering PDL toggle: true
18. [ProspectDashboard] 🔍 Evaluating PDL toggle render condition...
19. [ProspectDashboard] serverConfig.hasPdl = true
20. [ProspectDashboard] ✅ Rendering PDL toggle
```

---

## ✅ Verification

Run this test:

```bash
npm run dev
```

Then open:
- Terminal: Look for `[ProspectConfig]` logs from server
- Browser Console: Look for `[ProspectDashboard]` logs from client
- Browser UI: Check for PDL toggle below "Test Mode"

**Success criteria:**
- ✅ All 20 log steps appear in order
- ✅ No error logs
- ✅ PDL toggle visible in UI
- ✅ Toggle is auto-checked
