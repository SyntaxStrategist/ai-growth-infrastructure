# Outreach Email Queue Fix

**Date:** October 21, 2025  
**Status:** ✅ RESOLVED

## Problem Statement

The daily prospect queue worker was logging "Failed to queue emails for approval" after a migration was successfully applied. The system was discovering prospects, generating emails, but failing to insert them into the `outreach_emails` table.

## Investigation Process

### Initial Hypothesis
The error suggested potential issues with:
1. Row Level Security (RLS) policies blocking inserts
2. Wrong Supabase key being used (anon vs service role)
3. Foreign key constraints on `campaign_id` or `prospect_id`

### Diagnostic Steps

1. **Verified Supabase Key Usage**
   - Confirmed worker uses service role key: `SUPABASE_SERVICE_ROLE_KEY`
   - Location: `src/lib/daily-prospect-queue.ts` lines 12-15

2. **Checked RLS Policies**
   - Confirmed service role has full access policy: `Service role full access to outreach_emails`
   - Migration: `supabase/migrations/20250121_fix_outreach_rls_policies.sql`
   - Service role correctly bypasses RLS

3. **Created Diagnostic Script**
   - Script: `scripts/diagnose-outreach-insert.js`
   - Results:
     - ✅ Service role insert works
     - ✅ RLS correctly blocks anon key
     - ✅ Service role bypasses RLS

4. **Created Worker Flow Test**
   - Script: `scripts/test-worker-flow.js`
   - Tested exact worker flow: campaign creation → email queueing
   - **Found root cause**: `prospect_email` is NULL

## Root Cause

**Database Constraint Violation**
```
Error Code: 23502
Message: null value in column "prospect_email" of relation "outreach_emails" violates not-null constraint
```

The issue was:
1. The prospect discovery pipeline was finding prospects **without email addresses**
2. The worker was attempting to queue outreach emails for these prospects
3. The `outreach_emails.prospect_email` column has a NOT NULL constraint
4. Database rejected inserts with NULL `prospect_email` values

Example of problematic prospect:
```json
{
  "id": "6dc8a66c-da79-468f-8b27-f3d69d7c2d6f",
  "business_name": "gdg cloud montreal",
  "contact_email": null  // ← Problem!
}
```

## Solution

### Code Changes

**File:** `src/lib/daily-prospect-queue.ts`

#### Change 1: Filter Prospects Without Emails (Lines 134-143)

```typescript
// Before:
const uncontactedProspects = pipelineResult.highPriorityProspects.filter(p => !p.contacted);
console.log(`📊 Uncontacted prospects: ${uncontactedProspects.length}`);

// After:
const prospectsWithoutContact = pipelineResult.highPriorityProspects.filter(p => !p.contacted);
const prospectsWithoutEmail = prospectsWithoutContact.filter(p => !p.contact_email);
const uncontactedProspects = prospectsWithoutContact.filter(p => p.contact_email);

console.log(`📊 Uncontacted prospects: ${prospectsWithoutContact.length}`);
if (prospectsWithoutEmail.length > 0) {
  console.log(`⚠️  Filtered out ${prospectsWithoutEmail.length} prospects without email addresses`);
}
console.log(`📊 Uncontacted prospects with emails: ${uncontactedProspects.length}`);
```

**Rationale:** Only queue prospects that have email addresses. Outreach emails cannot be sent without recipient addresses.

#### Change 2: Enhanced Error Logging (Lines 267-272)

```typescript
// Before:
if (queueError) {
  console.error('❌ Failed to queue emails:', queueError);
  result.errors.push('Failed to queue emails for approval');
}

// After:
if (queueError) {
  console.error('❌ Failed to queue emails:', queueError);
  console.error('   Error code:', queueError.code);
  console.error('   Error message:', queueError.message);
  console.error('   Error details:', queueError.details);
  result.errors.push(`Failed to queue emails: ${queueError.message}`);
}
```

**Rationale:** Provide detailed error information for faster debugging in production.

## Verification

### Test Results

**Script:** `scripts/test-worker-flow.js`

**Before Fix:**
```
❌ Failed to queue emails
Code: 23502
Message: null value in column "prospect_email" violates not-null constraint
```

**After Fix:**
```
✅ Emails queued successfully: 1
📧 Queued email: {
  prospect_email: 'events@calgaryevents.test',
  status: 'pending'
}
```

## Impact Analysis

### What Was Fixed
- ✅ Worker now successfully queues emails for prospects with email addresses
- ✅ Clear logging when prospects are filtered due to missing emails
- ✅ Better error messages for debugging future issues

### What Was NOT the Issue
- ❌ RLS policies (they were correctly configured)
- ❌ Supabase key (service role was being used correctly)
- ❌ Foreign key constraints (they allow NULL values appropriately)

### Upstream Considerations

The fix reveals a data quality issue: **Why are prospects without email addresses being scored as high-priority?**

**Recommended Follow-ups:**
1. Update prospect discovery pipeline to prioritize email discovery
2. Add email validation/enrichment step before scoring
3. Consider lowering scores for prospects without contact information
4. Add alerts when high percentage of prospects lack emails

## Testing Instructions

### Manual Test

```bash
# Run the worker flow test
node scripts/test-worker-flow.js

# Expected output:
✅ Campaign created
✅ Found prospect with email
✅ Emails queued successfully
🧹 Test data cleaned up
```

### Production Deployment

1. Deploy updated `src/lib/daily-prospect-queue.ts`
2. Monitor worker logs for:
   - `⚠️  Filtered out N prospects without email addresses`
   - `✅ Queued N emails for approval`
3. Verify no more "Failed to queue emails" errors

## Related Files

- `src/lib/daily-prospect-queue.ts` - Main worker logic (UPDATED)
- `scripts/test-worker-flow.js` - Test script for verification
- `scripts/diagnose-outreach-insert.js` - Diagnostic script (can be deleted)
- `supabase/migrations/20250121_fix_outreach_rls_policies.sql` - RLS policies (no changes needed)
- `supabase/migrations/make_prospect_id_nullable_in_outreach_emails.sql` - Previous migration

## Conclusion

The issue was **not** related to RLS or authentication, but rather a simple data validation problem. Prospects without email addresses were being queued for email outreach, causing NOT NULL constraint violations.

The fix is minimal and surgical: filter out prospects without emails before attempting to queue outreach emails.

**Status:** ✅ RESOLVED - Ready for deployment

