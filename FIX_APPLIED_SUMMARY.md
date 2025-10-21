# ✅ Fix Applied - Worker Polling Cron

**Date:** October 21, 2025  
**Status:** Ready for Deployment

---

## 🔧 What Was Fixed

### **Fix #1: Reliable Worker Trigger** ✅ APPLIED

**Problem:**
- Cron endpoint successfully enqueued jobs
- Worker never automatically started processing them
- Fire-and-forget `fetch()` was unreliable

**Solution:**
Added a worker polling cron that checks for pending jobs **every 5 minutes**:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/daily-prospect-queue",
      "schedule": "0 12 * * *"  // 8 AM EDT - enqueues job
    },
    {
      "path": "/api/worker/daily-prospect-queue",
      "schedule": "*/5 * * * *"  // NEW: Every 5 min - processes jobs
    }
  ]
}
```

**How It Works:**
1. **8:00 AM EDT** - Main cron enqueues job (instant response)
2. **8:05 AM EDT** - Worker cron checks for pending jobs
3. **8:05 AM EDT** - Worker finds pending job and starts processing
4. **8:09 AM EDT** - Worker completes (3-6 min execution)
5. **Every 5 min** - Worker cron continues polling for new jobs

**Benefits:**
- ✅ Worker automatically processes jobs within 5 minutes
- ✅ Handles multiple pending jobs sequentially
- ✅ Self-healing (catches stuck jobs)
- ✅ Simple, reliable, no complex infrastructure
- ✅ Vercel guarantees cron execution

---

### **Fix #2: Enhanced Logging** ✅ APPLIED

**Problem:**
- Worker found 0 prospects
- No visibility into why discovery failed

**Solution:**
Added detailed logging to prospect discovery pipeline:

```typescript
// prospect_pipeline.ts
console.log('[PDL] Search params: industry="X", region="Y"');
console.log('[PDL] Target count: 25');
console.log('[PDL] Raw results returned: 0');

console.log('[Google] Search params: industry="X", region="Y"');
console.log('[Google] Raw results returned: 0');
```

**Benefits:**
- ✅ See exact search parameters being used
- ✅ See raw API response counts
- ✅ Identify which data source (PDL/Google) is being used
- ✅ Easier to diagnose quota/config issues

---

## 📦 Files Modified

1. ✅ `vercel.json` - Added worker polling cron
2. ✅ `prospect-intelligence/prospect_pipeline.ts` - Added debug logging
3. ✅ `scripts/cleanup-queue-jobs.sql` - Created cleanup script

---

## 🚀 Deployment Steps

### **1. Commit and Deploy (2 minutes)**

```bash
git add .
git commit -m "Add worker polling cron and enhanced logging"
git push origin main
```

**Wait:** 2-3 minutes for Vercel deployment

---

### **2. Clean Up Old Test Jobs (1 minute)**

Go to **Supabase SQL Editor** and run:

```sql
-- Delete old jobs
DELETE FROM queue_jobs 
WHERE status IN ('completed', 'failed')
AND created_at < NOW() - INTERVAL '1 day';

-- Mark stuck jobs as failed
UPDATE queue_jobs 
SET status = 'failed', error = 'Cleanup - stuck in pending'
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '1 hour';

-- Verify cleanup
SELECT COUNT(*), status FROM queue_jobs GROUP BY status;
```

**Expected:** Clean queue with 0 or 1 pending jobs

---

### **3. Test the Full Flow (10 minutes)**

```bash
# Step A: Enqueue a job
curl -X GET "https://www.aveniraisolutions.ca/api/cron/daily-prospect-queue"
```

**Expected response (instant):**
```json
{
  "success": true,
  "jobId": "some-uuid",
  "message": "Job enqueued successfully"
}
```

**Wait 5-10 minutes** for the worker cron to pick it up...

```bash
# Step B: Check job status
curl -X GET "https://www.aveniraisolutions.ca/api/cron/daily-prospect-queue?jobId=<uuid-from-above>"
```

**Expected response (after 5-10 min):**
```json
{
  "success": true,
  "job": {
    "status": "completed",
    "result": {
      "prospectsDiscovered": X,
      "prospectsQueued": Y
    }
  }
}
```

---

### **4. Check Vercel Logs**

**Worker Cron Logs** (look for these every 5 minutes):
```
[Worker] 🔧 BACKGROUND WORKER TRIGGERED
[Worker] 🔍 Checking for pending jobs...
[Worker] ✅ Found job: cb1a22dd-4195-4680-9ac4-2f46f3b848b3
[Worker] 🚀 Starting job execution...

[DailyQueue] 🌅 DAILY PROSPECT QUEUE
[DailyQueue] 📋 PIPELINE CONFIGURATION
[DailyQueue] Industries: Software Development, Digital Marketing, ...
[DailyQueue] Use PDL: YES
[DailyQueue] Scan Forms: NO

[PDL] Search params: industry="Software Development", region="CA"
[PDL] Target count: 5
[PDL] Raw results returned: 0  ← This tells us PDL returned nothing

[Google] Search params: industry="Software Development", region="CA"
[Google] Raw results returned: 3  ← Fallback to Google worked

[Worker] ✅ Job execution completed
[Worker] Results: { prospectsQueued: 3 }
```

---

## 📊 Expected Behavior

### **Normal Operation:**

**Timeline:**
```
08:00:00 AM EDT - Main cron enqueues job
08:00:02 AM EDT - Cron returns success (instant)
08:05:00 AM EDT - Worker cron polls for jobs
08:05:01 AM EDT - Worker finds pending job
08:05:02 AM EDT - Worker starts processing
08:09:00 AM EDT - Worker completes (3-6 min)
08:10:00 AM EDT - Worker cron polls again (no jobs)
08:15:00 AM EDT - Worker cron polls again (no jobs)
... (continues every 5 minutes)
```

**Database:**
```sql
SELECT * FROM queue_jobs WHERE created_at >= CURRENT_DATE;

-- Result:
-- id: cb1a22dd...
-- status: completed
-- created_at: 08:00:00
-- started_at: 08:05:02
-- completed_at: 08:09:00
```

---

## 🔍 Debugging Guide

### **If Worker Still Doesn't Process Jobs:**

**Check Vercel Crons:**
```
Vercel Dashboard → Settings → Cron Jobs

Should show:
1. /api/cron/daily-prospect-queue (0 12 * * *)
2. /api/worker/daily-prospect-queue (*/5 * * * *)  ← New
```

**Check Worker Logs (every 5 min):**
```
Vercel Dashboard → Deployments → Functions → 
Filter: /api/worker/daily-prospect-queue

Should see logs every 5 minutes
```

**Manual Worker Trigger:**
```bash
# If automatic polling isn't working, trigger manually
curl -X POST "https://www.aveniraisolutions.ca/api/worker/daily-prospect-queue"
```

---

### **If Still Finding 0 Prospects:**

**Check the new logs to diagnose:**

**Scenario A: PDL Quota Exhausted**
```
[PDL] Search params: industry="X", region="Y"
[PDL] Raw results returned: 0
[Google] Raw results returned: 0
```
**Action:** PDL and Google both failed - check API quotas

**Scenario B: ICP Too Restrictive**
```
[PDL] Search params: industry="Software Development", region="CA"
[PDL] Raw results returned: 0
[Google] Raw results returned: 0
```
**Action:** Try broader industries or lower minICPScore

**Scenario C: One Source Working**
```
[PDL] Raw results returned: 0
[Google] Raw results returned: 15  ← Google works!
```
**Action:** PDL issue, but Google fallback working - system functional

---

### **Test with Broader Criteria:**

If still getting 0 prospects, temporarily test with broader settings:

```typescript
// In src/lib/daily-prospect-queue.ts
const pipelineResult = await runProspectPipeline({
  industries: ['Technology', 'Business Services'],  // Broader
  regions: ['CA', 'US'],
  minAutomationScore: 50,  // Lower (was 70)
  maxProspectsPerRun: 10,  // Smaller test
  testMode: false,
  usePdl: true,
  scanForms: false
});
```

Deploy and test to see if broader criteria returns results.

---

## ✅ Success Criteria

After deployment and testing:

- [x] Worker cron added to `vercel.json`
- [x] Enhanced logging added to pipeline
- [ ] Vercel deployed successfully
- [ ] Old test jobs cleaned up
- [ ] Manual test: Job enqueued (instant)
- [ ] Wait 5-10 minutes
- [ ] Manual test: Job status = "completed"
- [ ] Worker logs show discovery details
- [ ] Prospects found (>0) OR clear reason why 0 found

---

## 🎯 Tomorrow's 8 AM Run

**What Will Happen:**

```
08:00:00 AM EDT
└─ Main cron triggers
   └─ Job enqueued (instant)
   └─ Returns success to Vercel

08:05:00 AM EDT
└─ Worker cron triggers (scheduled poll)
   └─ Finds pending job from 8:00 AM
   └─ Starts processing
   └─ Discovers prospects (or logs why 0 found)
   └─ Generates emails
   └─ Queues for approval

08:09:00 AM EDT
└─ Worker completes
   └─ Job marked as completed
   └─ 25-50 emails ready in admin dashboard

08:10:00 AM EDT
└─ Worker cron triggers again
   └─ No pending jobs found
   └─ Returns "No pending jobs to process"

08:15:00 AM EDT (and every 5 min after)
└─ Worker cron continues polling
   └─ Ensures no jobs get stuck
```

---

## 📋 Monitoring Queries

**Check job status:**
```sql
SELECT 
  id,
  status,
  result->>'prospectsQueued' as queued,
  created_at,
  started_at,
  completed_at,
  EXTRACT(EPOCH FROM (completed_at - started_at)) as execution_seconds
FROM queue_jobs 
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC;
```

**Check for stuck jobs:**
```sql
SELECT id, status, created_at, started_at
FROM queue_jobs 
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '10 minutes';

-- Should be empty (worker polls every 5 min)
```

**Check today's emails:**
```sql
SELECT COUNT(*) as emails_queued
FROM outreach_emails 
WHERE created_at >= CURRENT_DATE;
```

---

## 📚 Documentation

- **Full investigation:** `ISSUE_DIAGNOSIS_COMPLETE.md`
- **Background queue docs:** `BACKGROUND_QUEUE_IMPLEMENTATION.md`
- **Setup guide:** `SETUP_BACKGROUND_QUEUE.md`
- **Cleanup script:** `scripts/cleanup-queue-jobs.sql`

---

**Status:** ✅ **READY TO DEPLOY**

Run the 4 steps above to complete the fix! The worker will now automatically poll for pending jobs every 5 minutes. 🚀

