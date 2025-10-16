# 🏷️ `is_internal` Flag — Quick Reference

## ⚡ What It Does

**Purpose:**  
Distinguishes internal clients (Avenir AI Solutions) from external clients (all other signups).

**Result:**
- ✅ Avenir appears in admin dashboard filters
- ✅ Avenir excluded from signup email validation
- ✅ External clients can't conflict with internal emails

---

## 🗄️ Database Schema

```sql
-- Column added to clients table
is_internal BOOLEAN DEFAULT FALSE

-- Example records
client_id                  | business_name           | is_internal
─────────────────────────────────────────────────────────────────
avenir-internal-client     | Avenir AI Solutions     | TRUE   ⭐
client-abc-123             | Prime Reno Solutions    | FALSE
client-def-456             | Solutions RénovPrime    | FALSE
```

---

## 🔧 Key Changes

### **1. Email Validation (Signup)**

**Before:**
```typescript
// Checked ALL clients
SELECT email FROM clients WHERE email = $1
```

**After:**
```typescript
// Only checks EXTERNAL clients (excludes internal)
SELECT email FROM clients 
WHERE email = $1 
AND is_internal = false  // ⭐ NEW
```

**Result:** Internal email addresses won't conflict with external signups.

---

### **2. Client Creation**

**External Signup:**
```typescript
INSERT INTO clients (
  ...,
  is_internal  // ⭐ NEW
) VALUES (
  ...,
  FALSE  // Mark as external
);
```

**Internal Setup (Avenir):**
```typescript
INSERT INTO clients (
  ...,
  is_internal  // ⭐ NEW
) VALUES (
  ...,
  TRUE  // Mark as internal ⭐
);
```

---

### **3. Admin Dashboard — Command Center**

```typescript
// Fetch ALL clients (internal + external)
SELECT client_id, business_name, is_internal
FROM clients
ORDER BY created_at DESC;

// Both types appear in dropdown
[All Clients ▼]
├─ Avenir AI Solutions ⭐  (internal)
├─ Prime Reno              (external)
└─ RénovPrime              (external)
```

---

## 📊 Use Cases

### **Scenario 1: Admin Views All Clients**
```
Admin → Dashboard → Client Filter
✅ Sees: Avenir AI Solutions (internal)
✅ Sees: All external clients
✅ Can filter by any client
```

### **Scenario 2: External User Signup**
```
User signs up: john@company.com
✅ Email check: WHERE is_internal = false
✅ No conflict with Avenir (is_internal = true)
✅ Signup succeeds
```

### **Scenario 3: Intelligence Engine**
```
Cron job runs analytics
✅ Processes Avenir (internal)
✅ Processes all external clients
✅ Generates per-client insights
```

---

## 🚀 Deployment

**Run Migration:**
```bash
# Apply SQL migration
# (or run setup script to create Avenir record with is_internal flag)
./scripts/setup-avenir-internal-client.sh
```

**Verify:**
```sql
SELECT client_id, business_name, is_internal
FROM clients
WHERE client_id = 'avenir-internal-client';

-- Expected:
-- client_id: avenir-internal-client
-- business_name: Avenir AI Solutions
-- is_internal: TRUE ✅
```

---

## ✅ Summary

| Client Type | `is_internal` | Appears in Admin? | Email Check? |
|-------------|---------------|-------------------|--------------|
| Avenir AI   | `TRUE`        | ✅ Yes            | ❌ Excluded  |
| External    | `FALSE`       | ✅ Yes            | ✅ Checked   |

**Result:**
- ✅ Clear separation between internal and external
- ✅ No email conflicts
- ✅ Full admin visibility

**Status:** Ready to Deploy 🚀

