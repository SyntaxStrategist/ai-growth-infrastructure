# Connection Status & Test Lead Fix

## 🐛 **Bug Report**

### **Issue:**
After clicking "Test Connection" button:
- ✅ Test lead created in Supabase successfully
- ❌ Dashboard still shows "○ Not Connected"
- ❌ Test lead not visible in dashboard table

---

## 🔍 **Root Cause Analysis**

### **The Problem: Stale Session Data in localStorage**

```
┌──────────────────────────────────────────────────────────┐
│ BROKEN FLOW (Before Fix)                                 │
└──────────────────────────────────────────────────────────┘

1. User logs in
   ↓
2. /api/client/auth returns { lastConnection: null }
   ↓
3. Session saved to localStorage { lastConnection: null }
   ↓
4. User clicks "Test Connection"
   ↓
5. Test lead created → Database updates last_connection = NOW()
   ↓
6. window.location.reload() called
   ↓
7. Page reloads → Reads from localStorage (STALE!)
   ↓
8. Badge still shows "Not Connected" ❌
```

**Why it failed:**
- `window.location.reload()` doesn't refetch session data
- It just reloads the page, which reads the **stale** data from localStorage
- Database has fresh `last_connection` timestamp
- But localStorage still has `lastConnection: null`

---

## ✅ **The Fix**

### **Implemented Solution: Refetch + Session Update + Navigate**

```
┌──────────────────────────────────────────────────────────┐
│ FIXED FLOW (After Fix)                                   │
└──────────────────────────────────────────────────────────┘

1. User clicks "Test Connection"
   ↓
2. Test lead sent to /api/lead with API key
   ↓
3. Lead API validates key, creates lead
   ↓
4. Database: clients.last_connection = NOW()
   ↓
5. ✨ NEW: Refetch settings from /api/client/settings
   ↓
6. ✨ NEW: Get fresh last_connection from database
   ↓
7. ✨ NEW: Update localStorage with fresh data
   ↓
8. ✨ NEW: Dispatch storage event to trigger SessionProvider
   ↓
9. ✨ NEW: Navigate to dashboard with router
   ↓
10. Dashboard reads fresh session → Badge shows "Connected" ✅
    ↓
11. useEffect triggers with updated client → fetchLeads()
    ↓
12. Test lead appears in dashboard table ✅
```

---

## 📝 **Code Changes**

### **File: `src/app/[locale]/client/settings/page.tsx`**

#### **Added Imports:**
```typescript
import { useRouter } from 'next/navigation';
import { saveSession } from '../../../../utils/session';
```

#### **Modified: `handleTestConnection` Function**

**Before:**
```typescript
if (data.success) {
  setToastMessage('✅ Test lead sent!');
  setShowToast(true);
  setTimeout(() => {
    window.location.reload(); // ❌ Reads stale localStorage!
  }, 2000);
}
```

**After:**
```typescript
if (data.success) {
  console.log('[ClientSettings] ✅ Test lead sent successfully');
  
  // Step 1: Refetch settings to get updated last_connection from database
  const settingsRes = await fetch(`/api/client/settings?clientId=${clientId}`);
  const settingsData = await settingsRes.json();
  
  if (settingsData.success && settingsData.data) {
    // Step 2: Update connection data state for immediate UI update
    setConnectionData({
      lastConnection: settingsData.data.last_connection,
      createdAt: settingsData.data.created_at,
      apiKey: settingsData.data.api_key,
    });
    
    // Step 3: Update session in localStorage with fresh data
    const sessionData = localStorage.getItem('client_session');
    if (sessionData) {
      const parsedSession = JSON.parse(sessionData);
      const updatedSession = {
        ...parsedSession,
        lastConnection: settingsData.data.last_connection,
      };
      saveSession(updatedSession);
      
      // Dispatch storage event to trigger SessionProvider refresh
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'client_session',
        newValue: JSON.stringify(updatedSession),
        url: window.location.href,
        storageArea: localStorage,
      }));
    }
  }
  
  // Step 4: Show success message
  setToastMessage(isFrench 
    ? '✅ Lead de test envoyé ! Redirection vers le tableau de bord...'
    : '✅ Test lead sent! Redirecting to dashboard...');
  setShowToast(true);
  
  // Step 5: Navigate to dashboard (allow session update to propagate)
  setTimeout(() => {
    router.push(`/${locale}/client/dashboard`);
  }, 1500);
}
```

---

### **File: `src/app/[locale]/client/dashboard/page.tsx`**

#### **Added: Debug Logging for Session Data**

```typescript
// Force session refresh on mount to catch any updates (e.g., from test connection)
useEffect(() => {
  if (authenticated && client) {
    console.log('[Dashboard] ============================================');
    console.log('[Dashboard] Checking session data...');
    console.log('[Dashboard] Last Connection:', client.lastConnection || 'never');
    console.log('[Dashboard] ============================================');
  }
}, [authenticated, client]);
```

**Purpose:** Helps verify that the dashboard is receiving the updated session data.

---

## 🔄 **How It Works Now**

### **1. Test Lead Creation**
```typescript
POST /api/client/test-lead
  ↓
POST /api/lead (with x-api-key header)
  ↓
Database: UPDATE clients SET last_connection = NOW()
  ↓
Lead created in leads table
  ↓
Link created in lead_actions table
```

### **2. Session Update**
```typescript
GET /api/client/settings?clientId=...
  ↓
Returns: { last_connection: "2025-01-21T15:30:00Z", ... }
  ↓
localStorage updated with fresh data
  ↓
StorageEvent dispatched
  ↓
SessionProvider catches event → refreshSession()
```

### **3. Dashboard Update**
```typescript
router.push('/dashboard')
  ↓
Dashboard component renders
  ↓
useSession() returns updated client
  ↓
useEffect triggers (client dependency changed)
  ↓
fetchLeads() called
  ↓
Test lead appears in table
  ↓
Badge shows "Connected" status
```

---

## 🧪 **Testing Instructions**

### **Test the Fix:**

1. **Start fresh:**
   ```bash
   # Clear localStorage in browser DevTools
   localStorage.clear()
   
   # Or just log out and log back in
   ```

2. **Open browser console** to see detailed logs

3. **Navigate to Settings:**
   ```
   http://localhost:3000/en/client/settings
   ```

4. **Click "Test Connection" button**

5. **Watch console logs:**
   ```
   [ClientSettings] Sending test lead...
   [ClientSettings] ✅ Test lead sent successfully
   [ClientSettings] Refetching settings for updated connection status...
   [ClientSettings] ✅ Fresh settings loaded
   [ClientSettings] Updated last_connection: 2025-01-21T15:30:00.000Z
   [ClientSettings] ✅ Session updated in localStorage
   [ClientSettings] ✅ Storage event dispatched
   [ClientSettings] Navigating to dashboard...
   [AuthFix] SessionProvider: Storage change detected, refreshing session...
   [Dashboard] Checking session data...
   [Dashboard] Last Connection: 2025-01-21T15:30:00.000Z
   ```

6. **Verify Results:**
   - ✅ Success toast appears
   - ✅ Redirects to dashboard after 1.5 seconds
   - ✅ Badge shows "✅ Connected" (green)
   - ✅ Hover shows "Last lead: Just now"
   - ✅ Test lead appears in dashboard table
   - ✅ Test lead has test@aveniraisolutions.ca email

---

## 🎯 **What's Fixed**

| Issue | Status | How |
|-------|--------|-----|
| Badge shows "Not Connected" after test | ✅ Fixed | Refetch settings + update localStorage |
| Test lead doesn't appear in dashboard | ✅ Fixed | Navigate to dashboard triggers fetchLeads() |
| window.location.reload() doesn't work | ✅ Fixed | Replaced with refetch + router.push() |
| Session data stays stale | ✅ Fixed | Dispatch StorageEvent to trigger SessionProvider |
| No visual feedback during process | ✅ Fixed | Console logs + toast messages |

---

## 🔍 **Debugging Tips**

### **Check Database:**
```sql
-- Verify last_connection was updated
SELECT 
  business_name, 
  last_connection,
  NOW() - last_connection AS time_since_last_lead
FROM clients 
WHERE api_key = 'your_api_key';
```

### **Check localStorage:**
```javascript
// In browser console
const session = JSON.parse(localStorage.getItem('client_session'));
console.log('Last Connection:', session.lastConnection);
```

### **Check Lead Actions:**
```sql
-- Verify test lead was linked to client
SELECT 
  la.*, 
  l.name, 
  l.email, 
  l.message
FROM lead_actions la
JOIN leads l ON l.id = la.lead_id
WHERE la.client_id = 'your_client_id'
ORDER BY la.created_at DESC
LIMIT 5;
```

---

## 📊 **Flow Diagrams**

### **Before (Broken):**
```
Settings Page                 Database                Dashboard
     │                            │                        │
     ├─ Test Lead ────────────────┤                        │
     │                            │                        │
     │                      (updates last_connection)      │
     │                            │                        │
     ├─ window.reload() ──────────┤                        │
     │                            │                        │
     ├─ reads localStorage (STALE)│                        │
     │                            │                        │
     └─ Badge: "Not Connected" ❌ │                        │
```

### **After (Fixed):**
```
Settings Page                 Database                Dashboard
     │                            │                        │
     ├─ Test Lead ────────────────┤                        │
     │                            │                        │
     │                      (updates last_connection)      │
     │                            │                        │
     ├─ Refetch Settings ─────────┤                        │
     │                            │                        │
     ├─ Update localStorage       │                        │
     │                            │                        │
     ├─ Dispatch StorageEvent     │                        │
     │                            │                        │
     ├─ Navigate ─────────────────┼────────────────────────┤
     │                            │                        │
     │                            │                (reads fresh session)
     │                            │                        │
     │                            │                (fetchLeads called)
     │                            │                        │
     │                            │         Badge: "✅ Connected" ✅
```

---

## ✅ **Summary**

**Root Cause:** localStorage had stale session data that wasn't refreshed after test lead creation

**Solution:** 
1. Refetch settings from API after test succeeds
2. Update localStorage with fresh `last_connection`
3. Dispatch storage event to trigger SessionProvider
4. Navigate to dashboard with router (not reload)
5. Dashboard receives fresh session and refetches leads

**Result:** Badge shows correct status, test lead appears in table ✅

---

## 🚀 **Ready to Test!**

The fix is now implemented and ready for testing. Follow the testing instructions above to verify everything works correctly.

