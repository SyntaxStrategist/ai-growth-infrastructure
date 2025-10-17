# Apollo Integration - Quick Start

## ⚡ Fast Setup (2 Minutes)

### Step 1: Get Apollo API Key
1. Go to https://apollo.io (sign up for free)
2. Navigate to Settings → Integrations → API
3. Click "Create API Key"
4. Copy the key

### Step 2: Add to Environment
```bash
# Edit .env.local
APOLLO_API_KEY=your_apollo_api_key_here
```

### Step 3: Test the Integration
1. Restart dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/en/admin/prospect-intelligence`
3. **Uncheck** "Test Mode" checkbox
4. Click "🧠 Run Prospect Scan"
5. Watch real prospects appear!

---

## ✅ What Was Implemented

### Apollo API Connector
**File:** `src/lib/integrations/apollo_connector.ts`

- ✅ Full Apollo API integration
- ✅ Rate limiting: 1.2s between requests (free tier safe)
- ✅ Error handling with fallbacks
- ✅ Comprehensive logging to `logs/apollo_integration.log`
- ✅ Industry and region mapping
- ✅ Automation score calculation from real data

### Prospect Pipeline
**File:** `prospect-intelligence/prospect_pipeline.ts`

- ✅ Dual mode support: Test (mock) or Production (Apollo)
- ✅ Automatic fallback: Apollo → Google scraper → Error
- ✅ Smart data transformation
- ✅ Database integration

### Configuration
**File:** `env.example`

- ✅ APOLLO_API_KEY documented
- ✅ Setup instructions included
- ✅ Free tier limits noted

### Logging
**Directory:** `logs/`

- ✅ Apollo integration log file
- ✅ Gitignored (logs/*.log)
- ✅ All requests tracked

---

## 🎯 How It Works

### Test Mode (Default)
```
Toggle: ✅ Test Mode
Data Source: test_data_generator.ts
Speed: Instant
Results: 10 fake businesses
Cost: $0
```

### Production Mode
```
Toggle: ❌ Test Mode (unchecked)
Data Source: Apollo API → Google fallback
Speed: ~7-12 seconds
Results: Real businesses from Apollo
Cost: $0 (free tier)
```

---

## 📊 Data Comparison

### Test Data
```json
{
  "business_name": "Elite Construction Group",
  "website": "https://www.elite-construction-group.com",
  "industry": "Construction",
  "automation_need_score": 87,
  "metadata": {
    "test_data": true
  }
}
```

### Apollo Data
```json
{
  "business_name": "ABC Construction Ltd",
  "website": "https://www.abcconstruction.ca",
  "industry": "Construction",
  "automation_need_score": 75,
  "metadata": {
    "apollo_id": "5f8a...",
    "employee_count": "11,50",
    "annual_revenue": "$1M-$5M",
    "location": "Toronto, ON, Canada",
    "source": "apollo"
  }
}
```

---

## 🔧 Troubleshooting

### No Results from Apollo

**Check 1: API Key**
```bash
# Verify key is set
grep APOLLO_API_KEY .env.local
```

**Check 2: Logs**
```bash
# View Apollo requests
tail -50 logs/apollo_integration.log
```

**Check 3: Console**
```
Look for:
"✅ Apollo: Found X prospects"
or
"⚠️  Apollo API not configured"
```

### Rate Limit Errors

If you see: `429 Too Many Requests`

**Solution:** Wait 60 minutes for quota reset

**Prevention:** Our rate limiter should prevent this (1.2s delay)

---

## 📁 Files

| File | Purpose |
|------|---------|
| `src/lib/integrations/apollo_connector.ts` | Apollo API client |
| `prospect-intelligence/prospect_pipeline.ts` | Pipeline with Apollo integration |
| `env.example` | Configuration template |
| `logs/apollo_integration.log` | Request/response log |
| `APOLLO_INTEGRATION_REPORT.md` | Full documentation |

---

## ✨ Benefits

### Real Business Data
- ✅ Verified companies from Apollo's database
- ✅ Actual employee counts and revenue
- ✅ Real website URLs
- ✅ Geographic accuracy

### Smart Scoring
- ✅ Calculated from real business attributes
- ✅ Industry-specific adjustments
- ✅ Company size consideration
- ✅ Technology stack analysis

### Production Ready
- ✅ Rate limiting built-in
- ✅ Error handling and fallbacks
- ✅ Comprehensive logging
- ✅ Free tier sustainable

---

**Status:** ✅ Ready to use!  
**Next:** Add your Apollo API key to `.env.local`

For full details, see: `APOLLO_INTEGRATION_REPORT.md`

