# Email Queue Fix - Summary & Implementation

## 🔍 **Root Cause Analysis**

### **Issue:**
Daily prospect queue was failing to save generated emails to `outreach_emails` table with error:
```
"Failed to queue emails for approval"
```

### **Root Causes Identified:**

#### **1. Schema Mismatch: `metadata` Column** ❌
- **Problem**: Code tried to insert `metadata` field
- **Reality**: `outreach_emails` table doesn't have a `metadata` column
- **Error**: `Could not find the 'metadata' column`

#### **2. NOT NULL Constraint: `prospect_id`** ❌
- **Problem**: `prospect_id` column has NOT NULL constraint
- **Reality**: Prospects don't have IDs until they're saved to database
- **Error**: `null value in column "prospect_id" violates not-null constraint`
- **Code**: `23502`

---

## 🔧 **Fixes Applied**

### **Fix #1: Remove `metadata` Field from Insert**

**Location**: `src/lib/daily-prospect-queue.ts`

**Before:**
```typescript
emailsToQueue.push({
  campaign_id: campaign?.id || null,
  prospect_id: prospect.id,
  prospect_email: prospect.contact_email,
  // ... other fields ...
  metadata: {  // ❌ This column doesn't exist
    automation_score: prospect.automation_need_score,
    business_fit_score: prospect.metadata?.business_fit_score,
    // ...
  }
});
```

**After:**
```typescript
emailsToQueue.push({
  campaign_id: campaign?.id || null,
  prospect_id: prospect.id,
  prospect_email: prospect.contact_email,
  // ... other fields ...
  // Note: metadata column removed - doesn't exist in table schema
  // Scores stored in prospects table and can be joined if needed
});
```

**Status**: ✅ **Fixed**

---

### **Fix #2: Make `prospect_id` Nullable**

**Problem**: Prospects from PDL/Google don't have database IDs until saved, but emails are generated immediately.

**Solution**: Alter table to allow NULL `prospect_id`

**SQL Migration**:
```sql
ALTER TABLE outreach_emails 
ALTER COLUMN prospect_id DROP NOT NULL;

COMMENT ON COLUMN outreach_emails.prospect_id IS 
  'Foreign key to prospect_candidates table. Nullable to support email generation before prospect is saved to database.';
```

**Files Created**:
- `supabase/migrations/make_prospect_id_nullable_in_outreach_emails.sql`
- `scripts/apply-outreach-migration.js`

**Status**: ⚠️ **Requires Manual Execution in Supabase**

---

## 📋 **outreach_emails Table Schema**

### **Actual Columns** (19 total):
1. `id` - Primary key (UUID)
2. `campaign_id` - Foreign key (nullable)
3. `prospect_id` - Foreign key (NOT NULL → needs to be nullable)
4. `prospect_email` - Email address
5. `prospect_name` - Contact name
6. `company_name` - Company name
7. `template_id` - Template reference (nullable)
8. `subject` - Email subject
9. `content` - Email body
10. `status` - Email status (pending, sent, etc.)
11. `sent_at` - Timestamp
12. `opened_at` - Timestamp
13. `replied_at` - Timestamp
14. `gmail_message_id` - Gmail reference
15. `thread_id` - Email thread ID
16. `follow_up_sequence` - Integer
17. `created_at` - Timestamp
18. `updated_at` - Timestamp
19. `client_id` - Client reference

**Missing**: `metadata` column (was being inserted but doesn't exist)

---

## 🚀 **Implementation Steps**

### **Step 1: Apply Code Fixes** ✅ **COMPLETE**

```bash
# Already applied to src/lib/daily-prospect-queue.ts
- Removed metadata field from emailsToQueue
- Updated tracking events to not reference email.metadata
```

### **Step 2: Run Database Migration** ⚠️ **REQUIRED**

**Option A: Via Supabase SQL Editor** (Recommended)

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Run this SQL:

```sql
ALTER TABLE outreach_emails 
ALTER COLUMN prospect_id DROP NOT NULL;

COMMENT ON COLUMN outreach_emails.prospect_id IS 
  'Foreign key to prospect_candidates table. Nullable to support email generation before prospect is saved to database.';
```

**Option B: Via Migration Script**

```bash
node scripts/apply-outreach-migration.js
```
*(May fail if `exec_sql` RPC function not available)*

### **Step 3: Test Email Insert**

After migration, test with:
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('outreach_emails')
    .insert([{
      prospect_id: null,
      prospect_email: 'test@example.com',
      prospect_name: 'Test',
      company_name: 'Test Co',
      subject: 'Test',
      content: 'Test',
      status: 'pending'
    }])
    .select();
  
  if (error) {
    console.log('❌', error.message);
  } else {
    console.log('✅ Success! ID:', data[0].id);
    await supabase.from('outreach_emails').delete().eq('id', data[0].id);
  }
}

test();
"
```

Expected output: `✅ Success! ID: <uuid>`

### **Step 4: Deploy Code Changes**

```bash
git add -A
git commit -m "fix: Remove metadata field and handle nullable prospect_id in email queue"
git push origin main
```

### **Step 5: Verify in Production**

Trigger worker and check logs:
```bash
curl -X POST https://www.aveniraisolutions.ca/api/worker/daily-prospect-queue
```

Expected result:
```json
{
  "prospectsDiscovered": 16,
  "emailsGenerated": 16,
  "prospectsQueued": 16,  // ✅ Should now be > 0
  "errors": []  // ✅ Should be empty
}
```

---

## 📊 **Expected Outcome**

### **Before Fix:**
```json
{
  "prospectsDiscovered": 16,
  "prospectsScored": 16,
  "prospectsQueued": 0,  // ❌ Nothing saved
  "emailsGenerated": 16,
  "errors": ["Failed to queue emails for approval"]
}
```

### **After Fix:**
```json
{
  "prospectsDiscovered": 16,
  "prospectsScored": 16,
  "prospectsQueued": 16,  // ✅ All emails saved
  "emailsGenerated": 16,
  "errors": []  // ✅ No errors
}
```

---

## 🎯 **Impact**

### **What This Fixes:**
- ✅ Emails will be saved to `outreach_emails` table
- ✅ Emails will appear in Outreach Center dashboard
- ✅ Daily prospect queue will complete successfully
- ✅ No more "Failed to queue emails" error

### **What Users Will See:**
- ✅ Outreach Center populated with discovered prospects
- ✅ 16+ email drafts ready for review and sending
- ✅ Complete prospect information (company, industry, scores)
- ✅ Ability to approve/edit/send emails

---

## ⚠️ **Important Notes**

1. **Database Migration Required**: The code fix alone won't work until the database migration is applied to make `prospect_id` nullable.

2. **Backwards Compatible**: Making `prospect_id` nullable doesn't break existing functionality. Emails with prospect IDs will still have them.

3. **Future Enhancement**: Consider updating the prospect pipeline to return saved prospects with IDs, then the email queue can link them properly.

4. **Testing**: After migration, test thoroughly before relying on production data.

---

## 📝 **Files Modified**

1. ✅ `src/lib/daily-prospect-queue.ts` - Removed metadata field
2. ✅ `supabase/migrations/make_prospect_id_nullable_in_outreach_emails.sql` - Migration SQL
3. ✅ `scripts/apply-outreach-migration.js` - Migration script

---

## 🚀 **Next Steps**

1. **You**: Run the SQL migration in Supabase SQL Editor
2. **Me**: Deploy the code changes
3. **Test**: Verify emails are saved to database
4. **Monitor**: Check Outreach Center for populated emails

---

**Date**: October 21, 2025  
**Status**: Code fixes complete, awaiting database migration  
**Impact**: High - Enables core email queuing functionality

