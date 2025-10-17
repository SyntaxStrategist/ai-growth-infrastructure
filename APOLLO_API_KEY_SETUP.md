# Apollo API Key Setup Instructions

## ✅ .env.local File Ready

The `.env.local` file has been created with the `APOLLO_API_KEY` variable ready for you to add your key.

---

## 🔑 How to Add Your Apollo API Key

### Step 1: Get Your Apollo API Key

1. Go to **https://apollo.io** and sign in (or create free account)
2. Navigate to **Settings → Integrations → API**
3. Click **"Create API Key"** or copy existing key
4. Copy the API key to your clipboard

### Step 2: Add Key to .env.local

**Option A: Via Text Editor**
1. Open `.env.local` in your editor
2. Find line 38: `APOLLO_API_KEY=`
3. Paste your key after the `=`
4. Save the file

**Example:**
```bash
# Before:
APOLLO_API_KEY=

# After:
APOLLO_API_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**Option B: Via Command Line**
```bash
# Replace YOUR_KEY_HERE with your actual Apollo API key
echo 'APOLLO_API_KEY=YOUR_KEY_HERE' >> .env.local
```

### Step 3: Verify Setup

**Check the file:**
```bash
grep APOLLO_API_KEY .env.local
```

**Expected output:**
```
APOLLO_API_KEY=abc123def456... (your actual key)
```

**⚠️ Should NOT output:**
```
APOLLO_API_KEY=
```

---

## 🧪 Test the Integration

### Step 1: Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 2: Test Connection

Navigate to: `http://localhost:3000/en/admin/prospect-intelligence`

1. **Uncheck** the "🧪 Test Mode" checkbox
2. Click **"🧠 Run Prospect Scan"**
3. Open browser console (F12)

**Expected Console Output:**
```
[ProspectAPI] Test Mode: false
🌐 PRODUCTION MODE: Using real data sources
📡 Attempting Apollo API connection...
[ApolloAPI] Starting Apollo Prospect Search
[ApolloAPI] → POST /mixed_companies/search
⏱️  Rate limit: Waiting 1200ms
[ApolloAPI] ✅ Success (200)
✅ Apollo: Found 8 prospects
```

### Step 3: Check Logs

```bash
# View Apollo integration log
tail -20 logs/apollo_integration.log
```

**Expected Log Output:**
```
[2025-10-17T...] ============================================
[2025-10-17T...] Starting Apollo Prospect Search
[2025-10-17T...] → POST /mixed_companies/search
[2025-10-17T...] ✅ Success (200)
[2025-10-17T...] ✅ Found 8 accounts
```

---

## ✅ Verification Checklist

- [ ] Apollo account created
- [ ] API key generated from Apollo dashboard
- [ ] Key added to `.env.local` (line 38)
- [ ] Dev server restarted
- [ ] Test mode turned OFF in dashboard
- [ ] Prospect scan completed successfully
- [ ] Real business names appear (not "Elite Construction Group" test data)
- [ ] Console shows Apollo API calls
- [ ] `logs/apollo_integration.log` file created with entries

---

## 🚨 Troubleshooting

### "APOLLO_API_KEY not configured"

**Problem:** Key not found in environment

**Solutions:**
1. Check `.env.local` exists: `ls -la .env.local`
2. Verify key is set: `grep APOLLO_API_KEY .env.local`
3. Ensure no spaces around `=`: `APOLLO_API_KEY=yourkey` (not `APOLLO_API_KEY = yourkey`)
4. Restart dev server after adding key

---

### "401 Unauthorized"

**Problem:** Invalid API key

**Solutions:**
1. Verify you copied the full key from Apollo
2. Check for extra spaces or newlines
3. Generate a new key in Apollo dashboard
4. Ensure you're using the API key, not OAuth token

---

### "429 Rate Limit Exceeded"

**Problem:** Too many requests

**Solutions:**
1. Wait 60 minutes for quota reset
2. Our rate limiter should prevent this (1.2s delay)
3. Check if multiple scans were run rapidly
4. Review `logs/apollo_integration.log` for request frequency

---

### No Results Found

**Problem:** Search returned empty

**Solutions:**
1. Try different industries (Construction, Real Estate work well)
2. Use major regions (CA, US)
3. Check Apollo dashboard has data for your filters
4. View logs to see actual API response

---

## 📋 Current File Status

### .env.local Structure

```bash
# ==================== SUPABASE ====================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_service_role_key
DATABASE_URL=${SUPABASE_URL}

# ==================== ADMIN ====================
ADMIN_PASSWORD=your_admin_password

# ==================== OPENAI ====================
OPENAI_API_KEY=your_openai_key

# ==================== APOLLO ====================
# Apollo API Key for prospect discovery (https://apollo.io)
# Free tier: 50 requests/hour
# Get your key from: https://app.apollo.io/#/settings/integrations/api
# 
# ⚠️  ACTION REQUIRED: Add your Apollo API key below
# Example: APOLLO_API_KEY=abc123def456ghi789jkl012mno345pqr678
APOLLO_API_KEY=                  ← ADD YOUR KEY HERE

# ==================== GOOGLE ====================
GOOGLE_CREDENTIALS_JSON=your_google_creds
...
```

---

## 🎯 What Happens When You Add the Key

### Development Environment
1. Server reads `APOLLO_API_KEY` from `.env.local`
2. Apollo connector validates key is present
3. When Test Mode is OFF, Apollo API is used
4. Real prospect data fetched and saved

### Production Environment
1. Set `APOLLO_API_KEY` in Vercel/hosting environment variables
2. Same connector code reads from `process.env.APOLLO_API_KEY`
3. No code changes needed
4. Works identically to development

---

## 📝 Next Steps

1. **Add Your Key** (you mentioned you'll do this manually)
   ```bash
   # Edit .env.local and add your actual Apollo key on line 38
   ```

2. **Restart Server**
   ```bash
   npm run dev
   ```

3. **Test Integration**
   - Navigate to prospect intelligence dashboard
   - Turn OFF test mode
   - Run a scan
   - Verify real prospects appear

4. **Monitor Logs**
   ```bash
   tail -f logs/apollo_integration.log
   ```

---

## ✅ Setup Complete

The Apollo API integration is ready! Once you add your API key:

✅ System will automatically detect and use Apollo  
✅ Test mode toggle works seamlessly  
✅ All requests logged for transparency  
✅ Rate limiting prevents quota issues  
✅ Error handling ensures reliability  

**Current Status:**
- ✅ `.env.local` created
- ✅ `APOLLO_API_KEY` variable ready (line 38)
- ⏳ **Waiting for you to add your actual API key**
- ✅ All integration code complete

---

**Action Required:** Add your Apollo API key to `.env.local` (line 38), then restart the dev server! 🚀

