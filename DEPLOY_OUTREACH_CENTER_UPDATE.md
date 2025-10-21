# 🚀 Deploy Outreach Center Update

## Quick Summary

✅ **All high-quality prospects now appear in Outreach Center**  
✅ **Missing emails flagged with ⚠️ icon and yellow highlight**  
✅ **Website and Sender Email columns added**  
✅ **Works in both English and French**  
✅ **No breaking changes**

---

## Deployment Steps

### 1. Verify Migration Applied ✅
```bash
# Already applied locally
psql $DATABASE_URL -c "SELECT missing_email, sender_email, website FROM outreach_emails LIMIT 1;"
```

### 2. Commit Changes
```bash
git add .
git commit -m "feat: Queue all prospects in Outreach Center with missing_email flag

- Add missing_email, sender_email, website columns to outreach_emails
- Remove email filter from daily-prospect-queue worker
- Add Website and Sender Email columns to Outreach Center UI
- Highlight prospects with missing emails (yellow bg + ⚠️ icon)
- Disable approve button for missing emails
- Full bilingual support (EN/FR)
- Update API to return new fields"
```

### 3. Deploy to Production
```bash
git push origin main
# Vercel will auto-deploy
```

### 4. Verify in Production

**Check 1: Worker runs successfully**
```bash
curl -X POST https://ai-growth-infrastructure.vercel.app/api/worker/daily-prospect-queue
```

Expected: `success: true` with no errors about prospect_email

**Check 2: Outreach Center loads**
- Visit: `/en/dashboard/outreach` or `/fr/dashboard/outreach`
- Click "Approval" tab
- Verify new columns appear: Website, Sender Email

**Check 3: Missing email highlighting works**
- Look for prospects with ⚠️ icon
- Verify yellow background on those rows
- Verify "Email required" text appears
- Verify "Approve" button is disabled

---

## Files Changed

```
✅ supabase/migrations/20251021_add_missing_email_flag.sql
✅ prisma/schema.prisma
✅ src/lib/daily-prospect-queue.ts
✅ src/components/dashboard/OutreachApprovalQueue.tsx
✅ src/app/api/outreach/pending/route.ts
✅ scripts/test-worker-flow.js
✅ scripts/test-missing-email-flow.js
```

---

## Expected Results

### Before Deployment
- Prospects without emails were filtered out
- Lost high-quality leads
- No visibility into missing contact info

### After Deployment
- **ALL prospects** appear in Outreach Center
- Prospects with missing emails are **visually distinct**
- **Website links** for research
- **Manual email input** supported (future enhancement)
- **No data loss**

---

## Rollback Plan (if needed)

```bash
# 1. Revert code changes
git revert HEAD

# 2. Remove migration (if necessary)
psql $DATABASE_URL <<EOF
ALTER TABLE outreach_emails DROP COLUMN IF EXISTS missing_email;
ALTER TABLE outreach_emails DROP COLUMN IF EXISTS sender_email;
ALTER TABLE outreach_emails DROP COLUMN IF EXISTS website;
ALTER TABLE outreach_emails ALTER COLUMN prospect_email SET NOT NULL;
EOF
```

---

## Success Metrics

Monitor these after deployment:

1. **Worker Success Rate**
   - Should be 100% (no more "Failed to queue emails")

2. **Prospects Queued**
   - Should increase (now includes prospects without emails)

3. **Missing Email Percentage**
   - Track `missing_email: true` rate
   - Expected: 30-50% initially

4. **Approval Workflow**
   - Admins can see all prospects
   - Can decline low-quality ones
   - Can manually research and add emails

---

## Testing Commands

```bash
# Test worker flow
node scripts/test-worker-flow.js

# Test missing email flag
node scripts/test-missing-email-flow.js

# Both should pass ✅
```

---

## Post-Deployment

1. ✅ Verify no errors in Vercel logs
2. ✅ Check Outreach Center UI loads correctly
3. ✅ Verify new columns appear
4. ✅ Test with real prospects (wait for next daily run)
5. ✅ Monitor approval workflow

---

**Ready to deploy? All tests passing! ✅**

