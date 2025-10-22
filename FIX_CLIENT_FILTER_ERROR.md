# 🔧 Fix: Client Filter "Invalid UUID" Error

**Issue:** Dashboard shows "Loading Error" when selecting "Avenir AI Solutions" from Client Filter

**Error:** `invalid input syntax for type uuid: "avenir-internal-client"`

**Root Cause:** The `clients` table has old string ID `'avenir-internal-client'` but `lead_actions` table expects UUID format

---

## ✅ Quick Fix (2 minutes)

### **Step 1: Open Supabase SQL Editor**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New query"

### **Step 2: Run the Migration**
1. Copy the entire contents of: `supabase/migrations/fix_avenir_client_id_to_uuid.sql`
2. Paste into SQL Editor
3. Click "Run" (or press Cmd/Ctrl + Enter)

### **Step 3: Verify Success**
You should see output like:
```
✅ MIGRATION COMPLETE
client_id: 00000000-0000-0000-0000-000000000001
business_name: Avenir AI Solutions
is_internal: true
```

### **Step 4: Test in Dashboard**
1. Refresh your dashboard: http://localhost:3000/en/dashboard
2. Select "Avenir AI Solutions" from Client Filter dropdown
3. Should now load leads successfully ✅

---

## 🔍 What This Migration Does

**Before:**
```
clients table:
  client_id: "avenir-internal-client" ❌ (string)
  
lead_actions table:
  client_id column type: uuid ✅
  
Result: Type mismatch → 500 error
```

**After:**
```
clients table:
  client_id: "00000000-0000-0000-0000-000000000001" ✅ (UUID format)
  
lead_actions table:
  client_id column type: uuid ✅
  
Result: Types match → Works! ✅
```

---

## 📝 Technical Details

### **Changes Made:**
1. ✅ Updated `clients.client_id` from `'avenir-internal-client'` to `'00000000-0000-0000-0000-000000000001'`
2. ✅ Set `is_internal = true` flag
3. ✅ Verified no orphaned `lead_actions` records

### **Why UUID Format:**
- PostgreSQL `uuid` type requires proper UUID format
- `'avenir-internal-client'` is not a valid UUID
- `'00000000-0000-0000-0000-000000000001'` is valid UUID (reserved for internal client)

---

## ⚠️ If Migration Fails

### **Error: "relation 'clients' does not exist"**
**Fix:** You're in the wrong database. Make sure you selected the correct Supabase project.

### **Error: "column 'client_id' does not exist"**
**Fix:** Run this first:
```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_id TEXT;
```

### **Error: "permission denied"**
**Fix:** You need admin access. Contact project owner.

---

## 🎯 Alternative: Manual Fix (if migration script fails)

Run this single command in SQL Editor:
```sql
UPDATE clients 
SET client_id = '00000000-0000-0000-0000-000000000001',
    is_internal = true
WHERE client_id = 'avenir-internal-client' 
   OR business_name = 'Avenir AI Solutions';
```

---

## ✅ Verification

After running the migration, verify it worked:

**1. Check clients table:**
```sql
SELECT client_id, business_name, is_internal 
FROM clients 
WHERE business_name = 'Avenir AI Solutions';
```

Expected output:
```
client_id: 00000000-0000-0000-0000-000000000001
business_name: Avenir AI Solutions
is_internal: true
```

**2. Test client filter in dashboard:**
- Select "Avenir AI Solutions" from dropdown
- Should load leads without error
- Console should show: `[LeadsAPI] [CommandCenter] Filtering by clientId=00000000-0000-0000-0000-000000000001`

---

## 🚀 Next Steps

After fixing this issue:

1. ✅ Test all client filters (not just Avenir)
2. ✅ Verify lead_actions are being created with correct UUID format
3. ✅ Check if any other clients have non-UUID client_id values

To check all clients:
```sql
SELECT client_id, business_name 
FROM clients 
WHERE client_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
```

If any are returned, they need to be updated to UUID format.

---

## 📚 Related Documentation

- `INTERNAL_CLIENT_UUID_UPDATE.md` - Original UUID migration plan
- `CLIENT_DASHBOARD_UUID_FIX_COMPLETE.md` - Previous UUID fixes

---

**Status:** ✅ Ready to run  
**Time Required:** 2 minutes  
**Risk Level:** Low (only updates 1 row)  
**Rollback:** Can manually change back to old ID if needed

---

**Run the migration now and your client filter will work!** 🎉

