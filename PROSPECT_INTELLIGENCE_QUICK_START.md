# Prospect Intelligence - Quick Start Guide

## 🚀 How to Use the Prospect Intelligence System

### Step 1: Run a Prospect Scan

1. Navigate to: `http://localhost:3000/en/admin/prospect-intelligence`
2. Configure your scan:
   - **Industries**: Construction, Real Estate, Marketing (or customize)
   - **Regions**: CA, US, QC (or customize)
   - **Min Score**: 70 (high-priority threshold)
   - **Max Results**: 10 (number of prospects per scan)
   - **Test Mode**: ✅ ON (uses mock data generator)
3. Click **"🧠 Run Prospect Scan"**
4. Wait 5-10 seconds for completion
5. View results in the table below

### Step 2: Send Outreach Emails

1. Find a prospect with high automation score (70+)
2. Click **"📧 Send Outreach"** button in the Actions column
3. System will:
   - Generate personalized email based on business context
   - Log email to `prospect_outreach_log` table
   - Mark prospect as "Contacted"
   - Show success toast notification
4. Check browser console to see email preview

### Step 3: Simulate Feedback

1. Click **"🎲 Simulate Feedback"** button (top right)
2. System will:
   - Simulate random feedback for last 10 outreach emails
   - Randomly assign statuses: opened (45%), replied (15%), ignored (40%)
   - Update `prospect_industry_performance` metrics
   - Show toast: "✅ Feedback simulated for X emails"
3. Refresh to see updated metrics

### Step 4: View Proof Visuals

1. Click **"📊 View Proof"** for any prospect
2. System generates before/after comparison:
   - Response time: 120 min → 30 sec (99.6% improvement)
   - Engagement rate: 0% → 45%+
   - Cost savings: $2,400 - $4,000/month
3. Check console for full proof data
4. Toast shows improvement percentage

### Step 5: Monitor Performance

1. View metrics summary at top:
   - **Total Crawled**: Prospects discovered
   - **Total Tested**: Forms tested
   - **Total Scored**: Automation scores calculated
   - **Total Contacted**: Outreach emails sent

2. Click **"📊 Refresh Metrics"** to update dashboard

3. Toggle **"Show Only High-Priority"** to filter prospects

---

## 📊 Dashboard Controls

| Control | Function | Location |
|---------|----------|----------|
| **Run Prospect Scan** | Discovers & scores prospects | Configuration panel |
| **Send Outreach** | Sends personalized email | Actions column |
| **View Proof** | Generates before/after comparison | Actions column |
| **Simulate Feedback** | Tests feedback tracking | Top right |
| **Refresh Metrics** | Updates dashboard | Top right |
| **High-Priority Filter** | Shows only score >= 70 | Prospect table header |

---

## 🔧 API Endpoints

### Scan Prospects
```bash
POST /api/prospect-intelligence/scan
Content-Type: application/json

{
  "industries": ["Construction", "Real Estate"],
  "regions": ["CA"],
  "minScore": 70,
  "maxResults": 10,
  "testMode": true
}
```

### Send Outreach
```bash
POST /api/prospect-intelligence/outreach
Content-Type: application/json

{
  "prospectId": "uuid-here",
  "testMode": true
}
```

### Simulate Feedback
```bash
PUT /api/prospect-intelligence/feedback
Content-Type: application/json

{
  "count": 10
}
```

### Get Performance Metrics
```bash
GET /api/prospect-intelligence/feedback?type=metrics
```

### Generate Proof Visuals
```bash
POST /api/prospect-intelligence/proof-visuals
Content-Type: application/json

{
  "prospectId": "uuid-here"
}
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `/prospect-intelligence/crawler/test_data_generator.ts` | Generates fake business data |
| `/prospect-intelligence/prospect_pipeline.ts` | Main pipeline orchestrator |
| `/prospect-intelligence/outreach/generate_outreach_email.ts` | Email template generator |
| `/prospect-intelligence/database/supabase_connector.ts` | Database operations |
| `/src/app/api/prospect-intelligence/scan/route.ts` | Scan API endpoint |
| `/src/app/api/prospect-intelligence/outreach/route.ts` | Outreach API endpoint |
| `/src/app/api/prospect-intelligence/feedback/route.ts` | Feedback tracking API |
| `/src/app/api/prospect-intelligence/proof-visuals/route.ts` | Proof visuals API |
| `/src/app/[locale]/admin/prospect-intelligence/page.tsx` | Dashboard UI |

---

## 🗄️ Database Tables

### prospect_candidates
Stores discovered businesses with automation scores.

**Key Fields:**
- `business_name` - Company name
- `website` - Company website (unique)
- `industry` - Industry sector
- `automation_need_score` - 0-100 score
- `contacted` - Boolean flag

### prospect_outreach_log
Tracks all outreach attempts and engagement.

**Key Fields:**
- `prospect_id` - References prospect_candidates
- `subject` - Email subject line
- `status` - sent, opened, replied, bounced, ignored
- `sent_at`, `opened_at`, `replied_at` - Timestamps

### prospect_industry_performance
Aggregates metrics by industry for learning loop.

**Key Fields:**
- `industry` - Industry name (unique)
- `total_contacted`, `total_opened`, `total_replied` - Counts
- `open_rate`, `reply_rate` - Percentages
- `priority_score` - Weighted performance score

---

## 🧪 Testing Checklist

- [ ] Run prospect scan with test mode ON
- [ ] Verify 10 prospects appear in table
- [ ] Check automation scores are between 45-95
- [ ] Send outreach to a high-priority prospect
- [ ] Verify button changes to "✅ Sent"
- [ ] Check console for email preview
- [ ] Simulate feedback for 10 emails
- [ ] Verify metrics update correctly
- [ ] View proof visuals for a prospect
- [ ] Check toast shows improvement percentage
- [ ] Toggle high-priority filter
- [ ] Refresh metrics and verify counts
- [ ] Check Supabase tables for data

---

## 🚨 Troubleshooting

### "No prospects found"
- Ensure test mode is ON
- Check console for errors
- Verify `test_data_generator.ts` is working

### "Failed to save prospects"
- Check Supabase credentials in `.env.local`
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check database tables exist (run migration)

### "Outreach failed"
- Check prospect exists in database
- Verify prospect has valid email
- Check console for detailed error

### "Feedback simulation not working"
- Ensure outreach logs exist with status='sent'
- Check `prospect_outreach_log` table
- Verify API endpoint is accessible

---

## 📈 Next Steps

1. **Test the Full Pipeline**
   - Run a scan
   - Send outreach to 3-5 prospects
   - Simulate feedback
   - Review performance metrics

2. **Customize Templates**
   - Edit `/prospect-intelligence/outreach/generate_outreach_email.ts`
   - Adjust urgency thresholds
   - Add more personalization variables

3. **Add Real Email Integration**
   - Set up SendGrid/Mailgun account
   - Add API keys to `.env.local`
   - Update `/prospect-intelligence/outreach/send_outreach_email.ts`

4. **Enable Production Mode**
   - Get Google Custom Search API key
   - Set `GOOGLE_CUSTOM_SEARCH_API_KEY` in `.env.local`
   - Set `GOOGLE_SEARCH_ENGINE_ID` in `.env.local`
   - Toggle test mode OFF

5. **Monitor & Optimize**
   - Review industry performance metrics
   - Adjust scoring algorithm
   - Optimize email templates based on feedback
   - Scale to more industries/regions

---

## 🎯 Success Metrics

**Target Performance (After 100 prospects):**
- Open Rate: 40%+
- Reply Rate: 15%+
- Conversion Rate: 5%+
- Time Saved: 100+ hours/month
- Cost Savings: $2,000 - $4,000/month

---

**For full details, see:** `PROSPECT_INTELLIGENCE_AUTOMATION_REPORT.md`

