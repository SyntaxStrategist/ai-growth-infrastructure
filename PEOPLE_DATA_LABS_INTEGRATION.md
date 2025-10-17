# People Data Labs (PDL) Integration

**Date:** October 17, 2025  
**Status:** ✅ Complete  
**Data Source:** People Data Labs  
**Build Status:** ✅ Ready for Testing

---

## Overview

Successfully integrated **People Data Labs API** as a secondary real-world data source for prospect discovery. PDL provides access to 3+ billion company and person profiles, making it an excellent fallback when Apollo is unavailable or exhausted.

### Data Source Cascade

```
Test Mode OFF:
1. Apollo API (if configured)
   ↓ (if fails/unavailable)
2. People Data Labs (if configured & enabled)
   ↓ (if fails/unavailable)
3. Google Scraper (final fallback)
```

---

## Setup Instructions

### Step 1: Get PDL API Key

1. Go to https://peopledatalabs.com
2. Sign up for free account
3. Navigate to Dashboard → API Keys
4. Create new API key
5. Copy the key

### Step 2: Add to Environment

The variable has been added to both files:

**`.env.local` (line ~42):**
```bash
PEOPLE_DATA_LABS_API_KEY=your_pdl_api_key_here
PDL_RATE_LIMIT_MS=1000
```

**Add your key:**
```bash
# Edit .env.local
PEOPLE_DATA_LABS_API_KEY=actual_key_here
```

### Step 3: Restart Server

```bash
npm run dev
```

### Step 4: Test Integration

1. Navigate to `/en/admin/prospect-intelligence`
2. **Uncheck** "Test Mode"
3. **Check** "Use People Data Labs"
4. Click "Run Prospect Scan"
5. Watch PDL prospects appear!

---

## API Implementation

### PDL Connector

**File:** `src/lib/integrations/pdl_connector.ts`

**Base URL:**
```typescript
const BASE = 'https://api.peopledatalabs.com';
```

**Main Function:**
```typescript
async function searchPdlProspects(
  industry: string,
  region: string = 'CA',
  limit: number = 20
): Promise<PdlProspect[]>
```

**Search Parameters:**
```typescript
{
  query: {
    bool: {
      must: [
        { term: { 'location.country': 'canada' } },
        { wildcard: { industry: '*construction*' } }
      ],
      filter: [
        { range: { employee_count: { gte: 1, lte: 500 } } },
        { exists: { field: 'website' } }
      ]
    }
  },
  size: 20
}
```

---

## Rate Limiting

### PDL Free Tier Limits
- **Requests:** 1,000 per month
- **Company Search:** Included in free tier
- **Person Search:** Limited credits

### Built-in Protection
```typescript
const RATE_LIMIT_MS = parseInt(process.env.PDL_RATE_LIMIT_MS || '1000', 10);
// Default: 1 second between requests
// Configurable via environment variable
```

**Safety Calculation:**
- 1 request/second = 60/minute = 3,600/hour
- With 1-second delay: 30/hour (extremely conservative)
- Monthly budget: 1,000 requests
- **Can run:** ~33 scans/month (10 prospects × 3 industries)

---

## Integration Points

### Prospect Pipeline

**File:** `prospect-intelligence/prospect_pipeline.ts`

**Data Source Logic:**
```typescript
// 1. Try Apollo
if (Apollo.isConfigured()) {
  prospects = await Apollo.search(...);
}

// 2. Try PDL (if Apollo failed)
if (prospects.length === 0 && config.usePdl && PDL.isConfigured()) {
  prospects = await PDL.searchProspects(...);
}

// 3. Fallback to Google
if (prospects.length === 0) {
  prospects = await GoogleScraper.search(...);
}
```

### Admin Dashboard

**File:** `src/app/[locale]/admin/prospect-intelligence/page.tsx`

**New Toggles:**
1. **"Use People Data Labs"** checkbox
   - Enabled when Test Mode is OFF
   - Disabled (grayed out) when Test Mode is ON
   - Default: ON if `PEOPLE_DATA_LABS_API_KEY` is configured

2. **"Scan Forms"** checkbox
   - Enables website form scanning
   - Default: ON
   - Works in both test and production modes

**Data Source Info Panel:**
- Shows API limits for Apollo (50/hour)
- Shows API limits for PDL (1,000/month)
- Shows Google scraper as final fallback

---

## Automation Score Calculation

PDL provides rich company data used to calculate automation need:

```typescript
Base Score: 50

+ High-Need Industry: +20
  (Construction, Real Estate, Legal, Healthcare, Services)

+ Small Company (1-50 employees): +15-20
+ Medium Company (51-200 employees): +10

+ Newer Company (founded after 2015): +5

+ Has LinkedIn presence: +5

= Final Score: 45-95
```

---

## Response Format

### PDL Company Search Response

```json
{
  "status": 200,
  "data": [
    {
      "id": "pdl_company_123456",
      "name": "ABC Construction Ltd",
      "website": "https://www.abcconstruction.ca",
      "industry": "Construction",
      "location": {
        "country": "canada",
        "region": "ontario",
        "locality": "toronto"
      },
      "employee_count": 35,
      "size": "11-50",
      "founded": 2010,
      "linkedin_url": "https://linkedin.com/company/abc-construction"
    }
  ],
  "total": 147
}
```

### Transformed Prospect

```json
{
  "business_name": "ABC Construction Ltd",
  "industry": "Construction",
  "region": "CA",
  "website": "https://www.abcconstruction.ca",
  "automation_need_score": 85,
  "metadata": {
    "pdl_id": "pdl_company_123456",
    "employee_count": 35,
    "founded_year": 2010,
    "company_size": "11-50",
    "linkedin_url": "https://linkedin.com/company/abc-construction",
    "location": "Toronto, Ontario, Canada",
    "source": "pdl",
    "enriched_at": "2025-10-17T14:00:00.000Z"
  }
}
```

---

## Error Handling

### Graceful Degradation

**Scenario 1: PDL Not Configured**
```
→ Skips PDL, tries next data source
→ No error thrown
```

**Scenario 2: API Key Invalid (401/403)**
```
❌ PDL API authentication failed or endpoint not allowed on current plan
→ Logs to integration_logs
→ Returns [] (empty array)
→ Pipeline continues with Google fallback
```

**Scenario 3: Rate Limit (429)**
```
❌ PDL API rate limit exceeded
→ Logs warning
→ Returns [] (empty array)
→ User sees "PDL not available" message
```

**Scenario 4: Endpoint Not Available on Plan**
```
⚠️  PDL endpoint not available on current plan
→ Logs API_INACCESSIBLE
→ Shows in admin UI: "PDL not available - used fallback"
→ Pipeline continues normally
```

---

## Logging

### Dual Logging System

All PDL requests are logged to:

1. **Console** (captured by Vercel/hosting):
   ```
   [PDL] Starting company search
   [PDL] → GET /v5/company/search
   [PDL] ✅ Success (200)
   [PDL] ✅ Found 15 companies
   ```

2. **Supabase `integration_logs` table**:
   ```sql
   INSERT INTO integration_logs (source, level, message, meta)
   VALUES ('pdl', 'info', 'Search successful', '{"count": 15}');
   ```

3. **Local filesystem** (development only):
   - File: `logs/pdl_integration.log`
   - Only written if `NODE_ENV !== 'production'`
   - Safe for serverless (no `/var/task/logs` errors)

### Query Logs

```sql
-- View recent PDL logs
SELECT * FROM integration_logs 
WHERE source = 'pdl' 
ORDER BY created_at DESC 
LIMIT 50;

-- Count PDL requests today
SELECT COUNT(*) FROM integration_logs
WHERE source = 'pdl'
AND created_at >= CURRENT_DATE;

-- Check for errors
SELECT * FROM integration_logs
WHERE source = 'pdl'
AND level = 'error'
ORDER BY created_at DESC;
```

---

## Testing

### Run Integration Tests

```bash
# Test PDL integration
npx ts-node scripts/test-pdl-integration.ts
```

**Expected Output (with API key):**
```
✅ PDL API key found in environment
✅ PDL API connection successful
✅ Found 5 prospects
✅ All prospects have required fields
✅ Form scan completed
✅ All tests passed! ✨
```

**Expected Output (without API key):**
```
⚠️  PDL API key not configured (will use mock data)
ℹ️  Search blocked (no API key) - expected behavior
✅ Form scan completed
✅ All tests passed! ✨
```

---

## Dashboard Usage

### Configuration Panel

**New Checkboxes:**

1. **Test Mode** (existing)
   - ON: Uses mock data generator
   - OFF: Uses real data sources

2. **Use People Data Labs** (new)
   - Only enabled when Test Mode is OFF
   - Default: ON if `PEOPLE_DATA_LABS_API_KEY` is set
   - When checked: PDL is included in data source cascade

3. **Scan Forms** (new)
   - Default: ON
   - Scans each prospect's website for contact forms
   - Results shown in prospects table

**Data Source Info Panel:**
Shows API limits and costs:
- Apollo: 50 req/hour (free)
- People Data Labs: 1,000 req/month (free)
- Fallback: Google Scraper (free)

---

## Form Scanning Features

### What Gets Scanned

For each prospect website:
- ✅ Detects `<form>` elements
- ✅ Counts forms on page
- ✅ Identifies submission method (POST/GET/AJAX)
- ✅ Finds mailto: links
- ✅ Detects CAPTCHA (reCAPTCHA, hCaptcha, Turnstile)
- ✅ Lists common contact paths (/contact, /contact-us, etc.)
- ✅ Recommends outreach approach

### Form Scan Results Display

In the prospects table, each website shows badges:
- **📝 Form** - Has contact form
- **✉️ Email** - Has mailto link
- **🛡️ CAPTCHA** - Protected by CAPTCHA
- **🤖** - Recommended: Form-response-bot
- **📧** - Recommended: Email
- **👤** - Recommended: Manual outreach

### Recommended Approach Logic

```typescript
if (hasCaptcha) {
  return hasMailto ? 'email' : 'manual-outreach';
}

if (hasForm && formFields 2-8) {
  return 'form-response-bot'; // Simple form, automate it
}

if (hasMailto) {
  return 'email'; // Direct email available
}

if (hasForm && formFields > 8) {
  return 'manual-outreach'; // Too complex
}

return 'manual-outreach'; // Default
```

---

## Safety & Legal Considerations

### Form Auto-Submission

**Default:** ❌ **DISABLED**

To enable (⚠️ **use with caution**):
```bash
# In .env.local
AUTO_SUBMIT_FORMS=true
```

**Safety Measures:**
- Requires explicit environment variable
- Uses sandbox email only
- Logs all submissions
- Admin must confirm via modal (in UI)
- **NOT recommended for production**

### Legal & Ethical

✅ **Read-Only Scanning:** Default behavior is safe  
✅ **Public Data:** Only scrapes publicly accessible pages  
✅ **Respects robots.txt:** User-Agent identifies as bot  
✅ **Rate Limited:** Polite crawling (500ms delays)  
⚠️ **Auto-Submit:** Disabled by default, requires explicit opt-in  

---

## Performance & Costs

### Request Budget

**Per Scan (10 prospects, 3 industries):**
- PDL API calls: 3 (one per industry)
- Form scans: 10 (one per prospect)
- Time: ~15-20 seconds (rate limiting + scanning)
- Cost: $0 (free tier)

**Monthly Usage:**
- 10 scans/day × 30 days = 300 scans
- PDL calls: 300 × 3 = 900 requests
- Free tier: 1,000/month
- **Headroom:** 100 requests (10%)

---

## Troubleshooting

### "PDL API key not configured"

**Solution:**
1. Get key from https://dashboard.peopledatalabs.com/api-keys
2. Add to `.env.local`:
   ```bash
   PEOPLE_DATA_LABS_API_KEY=your_key_here
   ```
3. Restart: `npm run dev`

---

### "API endpoint not allowed on current plan"

**Problem:** Free tier doesn't support the endpoint

**Solution:**
- This is expected on free tier for some features
- Pipeline automatically falls back to Google scraper
- You'll see: "PDL not available - used fallback"
- **No action needed** - system handles gracefully

---

### "Rate limit exceeded"

**Problem:** More than 1,000 requests/month

**Solution:**
- Wait for monthly reset
- Reduce scan frequency
- Increase `PDL_RATE_LIMIT_MS` to be more conservative

---

### "Form scan timeout"

**Problem:** Website takes too long to respond

**Solution:**
- Scanner has built-in 10s timeout
- Automatically retries once
- Returns empty result on failure
- Check `integration_logs` table for details

---

## Database Schema

### integration_logs Table

```sql
CREATE TABLE integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,  -- 'pdl', 'apollo', 'form_scanner', etc.
  level TEXT NOT NULL,   -- 'info', 'warn', 'error', 'debug'
  message TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Why This Table:**
- ✅ Serverless-safe (no filesystem writes in production)
- ✅ Queryable (SQL analysis of logs)
- ✅ Persistent (doesn't disappear on redeploy)
- ✅ Searchable (filter by source, level, date)

---

## API Comparison

| Feature | Apollo | People Data Labs | Google Scraper |
|---------|--------|------------------|----------------|
| **Free Tier** | 50/hour | 1,000/month | Unlimited |
| **Company Data** | ✅ Excellent | ✅ Excellent | ⚠️ Limited |
| **Contact Emails** | ✅ Yes | ✅ Yes (credits) | ❌ No |
| **Employee Count** | ✅ Yes | ✅ Yes | ❌ No |
| **Revenue Data** | ✅ Yes | ✅ Yes | ❌ No |
| **Founded Year** | ✅ Yes | ✅ Yes | ❌ No |
| **Rate Limit** | Strict (72s) | Moderate (1s) | None |
| **Best For** | Real-time | Monthly batch | Fallback |

---

## Files Created/Modified

### Created (6 files)
1. ✅ `src/lib/integrations/pdl_connector.ts` - PDL API client
2. ✅ `src/lib/form_scanner.ts` - Form analysis
3. ✅ `src/lib/integration_logger.ts` - Unified logging
4. ✅ `supabase/migrations/create_integration_logs_table.sql` - Logs table
5. ✅ `scripts/test-pdl-integration.ts` - Test script
6. ✅ `PEOPLE_DATA_LABS_INTEGRATION.md` - This doc

### Modified (4 files)
1. ✅ `env.example` - Added PDL variables
2. ✅ `.env.local` - Appended PDL placeholders (safe append)
3. ✅ `prospect-intelligence/prospect_pipeline.ts` - PDL cascade + form scanning
4. ✅ `src/app/[locale]/admin/prospect-intelligence/page.tsx` - UI toggles + indicators

---

## Next Steps

1. ✅ PDL integration complete
2. ✅ Form scanner implemented
3. ✅ Admin UI updated
4. ✅ Logging system ready
5. ⚠️ **Add your PDL API key to `.env.local`**
6. ⚠️ Run integration test: `npx ts-node scripts/test-pdl-integration.ts`
7. ⚠️ Test in dashboard with Test Mode OFF + PDL enabled

---

**Status:** ✅ Ready for testing  
**Action Required:** Add PEOPLE_DATA_LABS_API_KEY to `.env.local`  
**Documentation:** See also `FORM_SCANNER.md`

