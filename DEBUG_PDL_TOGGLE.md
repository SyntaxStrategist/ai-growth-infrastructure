# PDL Toggle Debug Logging Guide

## ✅ Debug Logging Added

### Server-Side (`/api/prospect-intelligence/config`)

**Location:** `src/app/api/prospect-intelligence/config/route.ts`

**Logs output:**
```
[ProspectConfig] ============================================
[ProspectConfig] 🔍 Configuration status requested
[ProspectConfig] 🔍 Checking PDL key...
[ProspectConfig] process.env.PEOPLE_DATA_LABS_API_KEY exists: true/false
[ProspectConfig] PDL key type: string/undefined
[ProspectConfig] PDL key length: <number>
[ProspectConfig] PDL key preview: e6d166c16b... / NOT SET
[ProspectConfig] ✅ hasPdl (boolean): true/false
[ProspectConfig] ✅ hasApollo (boolean): true/false
[ProspectConfig] ✅ hasGoogleSearch (boolean): true/false
[ProspectConfig] PDL-related keys found: ["PDL_RATE_LIMIT_MS"]
[ProspectConfig] All integration keys: ["APOLLO_API_KEY", "PEOPLE_DATA_LABS_API_KEY", "PDL_RATE_LIMIT_MS"]
[ProspectConfig] 📤 Returning config: { ... }
[ProspectConfig] ============================================
```

### Client-Side (Prospect Intelligence Dashboard)

**Location:** `src/app/[locale]/admin/prospect-intelligence/page.tsx`

**Logs output:**

#### 1. On Component Mount (fetchServerConfig)
```
[ProspectDashboard] ============================================
[ProspectDashboard] 🔍 Fetching server configuration...
[ProspectDashboard] Response status: 200
[ProspectDashboard] 🧠 Server config received: { ... }
[ProspectDashboard] ✅ Server config loaded successfully
[ProspectDashboard] hasPdl: true/false
[ProspectDashboard] hasApollo: true/false
[ProspectDashboard] autoSubmitEnabled: true/false
[ProspectDashboard] 📝 Setting serverConfig state to: { hasPdl: true, ... }
[ProspectDashboard] ✅ PDL API key detected - auto-enabling PDL toggle
[ProspectDashboard] 🎯 PDL toggle should now be visible
[ProspectDashboard] ============================================
```

#### 2. On Every Render
```
[ProspectDashboard] 🎨 Rendering component...
[ProspectDashboard] Rendering PDL toggle: true/false
[ProspectDashboard] Current serverConfig: { hasPdl: true, ... }
```

#### 3. During Toggle Render Decision
```
[ProspectDashboard] 🔍 Evaluating PDL toggle render condition...
[ProspectDashboard] serverConfig.hasPdl = true/false
[ProspectDashboard] ✅ Rendering PDL toggle
  OR
[ProspectDashboard] ⚠️  PDL toggle NOT rendered (serverConfig.hasPdl is false)
```

---

## 🧪 How to Test

### Test 1: Verify PDL Key is Detected

1. **Ensure PDL key is in `.env.local`:**
   ```bash
   grep PEOPLE_DATA_LABS_API_KEY .env.local
   ```
   Should show: `PEOPLE_DATA_LABS_API_KEY=<your-key>`

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Open browser console** (F12)

4. **Navigate to:** http://localhost:3000/en/admin/prospect-intelligence

5. **Check Server Logs (Terminal):**
   - Look for `[ProspectConfig]` logs
   - Verify `hasPdl (boolean): true`
   - Verify PDL key preview shows first 10 characters

6. **Check Browser Console:**
   - Look for `[ProspectDashboard]` logs
   - Verify `hasPdl: true` in received config
   - Verify `✅ Rendering PDL toggle` message
   - **Toggle should be visible** below "Test Mode" toggle

### Test 2: Verify Toggle Hides Without Key

1. **Temporarily remove PDL key:**
   ```bash
   # Comment out in .env.local
   # PEOPLE_DATA_LABS_API_KEY=<your-key>
   ```

2. **Restart dev server** (Ctrl+C then `npm run dev`)

3. **Navigate to prospect intelligence page**

4. **Check Server Logs:**
   - `PDL key preview: NOT SET`
   - `hasPdl (boolean): false`

5. **Check Browser Console:**
   - `hasPdl: false`
   - `⚠️  PDL toggle NOT rendered`
   - **Toggle should NOT be visible**

### Test 3: Production Logs (Vercel)

1. **Deploy to Vercel** with `PEOPLE_DATA_LABS_API_KEY` set in environment variables

2. **Visit:** https://your-app.vercel.app/en/admin/prospect-intelligence

3. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → Logs
   - Filter for `[ProspectConfig]`
   - Verify `hasPdl: true`

4. **Check Browser Console:**
   - Same client-side logs should appear
   - Toggle should be visible

---

## 🔍 Troubleshooting

### Toggle Not Showing

**Check these logs in order:**

1. **Server Terminal:**
   ```
   [ProspectConfig] hasPdl (boolean): ???
   ```
   - If `false` → PDL key not in `.env.local` or Vercel env vars
   - If `true` → Continue to next check

2. **Browser Console (Network Tab):**
   ```
   GET /api/prospect-intelligence/config
   Response: { data: { hasPdl: ??? } }
   ```
   - If `hasPdl: false` → Server doesn't see the key
   - If `hasPdl: true` → Continue to next check

3. **Browser Console (fetchServerConfig):**
   ```
   [ProspectDashboard] hasPdl: ???
   ```
   - If `false` → Config API not returning correct value
   - If `true` → Continue to next check

4. **Browser Console (Render):**
   ```
   [ProspectDashboard] serverConfig.hasPdl = ???
   ```
   - If `false` → State not updating correctly
   - If `true` → Toggle should render

5. **Browser Console (Toggle Render):**
   ```
   [ProspectDashboard] ✅ Rendering PDL toggle
     OR
   [ProspectDashboard] ⚠️  PDL toggle NOT rendered
   ```
   - This tells you definitively if the toggle is being rendered

### Common Issues

1. **"Key exists but toggle doesn't show"**
   - Check for React strict mode double-renders
   - Look for multiple `serverConfig` state updates
   - Verify no conflicting conditional logic

2. **"Logs show true but toggle missing from DOM"**
   - Check browser DevTools → Elements
   - Search for "People Data Labs" text
   - Verify CSS isn't hiding it (`display: none`, `visibility: hidden`)

3. **"Works in dev but not production"**
   - Verify env var is set in Vercel dashboard
   - Check Vercel logs for `[ProspectConfig]` entries
   - Ensure env var name matches exactly: `PEOPLE_DATA_LABS_API_KEY`

---

## 📋 Expected UI Layout

```
┌─────────────────────────────────────┐
│ Prospect Intelligence Configuration │
├─────────────────────────────────────┤
│ Industries: [Construction] [...]    │
│ Regions: [CA] [US] [...]            │
│ Min Score: [70]                     │
│ Max Results: [10]                   │
│                                     │
│ ☐ Test Mode (generate test data)   │  ← Always visible
│ ☑ Use People Data Labs (PDL)       │  ← Only if PEOPLE_DATA_LABS_API_KEY set
│ ☑ Scan contact forms                │  ← Always visible
│                                     │
│ [Start Prospect Discovery]          │
└─────────────────────────────────────┘
```

**Toggle Label:** `Use People Data Labs (PDL)`  
**Position:** Directly below "Test Mode" toggle  
**Style:** Same as other checkboxes  
**Behavior:** 
- Auto-checked if PDL key present
- Disabled when Test Mode is ON
- Hidden entirely if no PDL key

---

## ✅ Verification Checklist

- [ ] Server logs show `hasPdl: true` when key is present
- [ ] Browser console shows config received with `hasPdl: true`
- [ ] Browser console shows `✅ Rendering PDL toggle`
- [ ] Toggle appears in UI below "Test Mode"
- [ ] Toggle label reads "Use People Data Labs (PDL)"
- [ ] Toggle is auto-checked when page loads
- [ ] Toggle is disabled when Test Mode is ON
- [ ] Toggle disappears when key is removed from env

---

**Next Step:** Run through Test 1 above and share screenshots of:
1. Terminal output (server logs)
2. Browser console (client logs)
3. UI showing the toggle

This will help identify exactly where the issue is if the toggle still doesn't appear.
