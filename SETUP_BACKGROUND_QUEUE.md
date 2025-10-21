# Quick Setup Guide - Background Queue System

## ⚡ Quick Start (5 Minutes)

### **Step 1: Create Database Table**

Go to **Supabase SQL Editor** and run:

```sql
CREATE TABLE IF NOT EXISTS queue_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payload JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT queue_jobs_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_queue_jobs_status ON queue_jobs(status);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_job_type ON queue_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_created_at ON queue_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_status_created ON queue_jobs(status, created_at);

SELECT 'Table created successfully!' as message;
```

**Expected:** ✅ "Table created successfully!"

---

### **Step 2: Deploy to Vercel**

```bash
git add .
git commit -m "Implement background queue for daily prospect discovery"
git push origin main
```

**Wait:** 2-3 minutes for Vercel deployment

---

### **Step 3: Test**

```bash
# Trigger a test job
curl -X GET "https://www.aveniraisolutions.ca/api/cron/daily-prospect-queue"
```

**Expected response (instant):**
```json
{
  "success": true,
  "message": "Job enqueued successfully",
  "jobId": "some-uuid-here",
  "statusUrl": "/api/cron/daily-prospect-queue?jobId=some-uuid-here"
}
```

---

### **Step 4: Check Status (Wait 3-6 minutes)**

```bash
# Replace <jobId> with the ID from Step 3
curl -X GET "https://www.aveniraisolutions.ca/api/cron/daily-prospect-queue?jobId=<jobId>"
```

**Expected response:**
```json
{
  "success": true,
  "job": {
    "status": "completed",
    "result": {
      "prospectsQueued": 50,
      "emailsGenerated": 50
    }
  }
}
```

---

### **Step 5: Verify Database**

```sql
-- Check for queued emails
SELECT COUNT(*) FROM outreach_emails WHERE created_at >= NOW() - INTERVAL '10 minutes';
-- Expected: 25-50 emails
```

---

## ✅ Success Checklist

- [ ] Database table created
- [ ] Code deployed to Vercel
- [ ] Test job returned instantly (<5s)
- [ ] Job status shows "completed" after 3-6 minutes
- [ ] Emails appear in database
- [ ] No timeout errors

---

## 📊 Tomorrow's 8 AM Run

**What will happen:**
1. Vercel cron triggers at 8:00 AM EDT
2. Job enqueued in database (instant)
3. Background worker processes job (3-6 minutes)
4. 25-50 prospects queued for review
5. Check admin dashboard at 8:10 AM EDT

**Monitor:**
- Vercel logs: `/api/cron/daily-prospect-queue` (should show instant response)
- Worker logs: `/api/worker/daily-prospect-queue` (should show 3-6 min execution)
- Database: `SELECT * FROM queue_jobs WHERE created_at >= CURRENT_DATE;`

---

## 📖 Full Documentation

See `BACKGROUND_QUEUE_IMPLEMENTATION.md` for:
- Complete architecture details
- Comprehensive testing instructions
- Monitoring queries
- Troubleshooting guide
- Expected log outputs

