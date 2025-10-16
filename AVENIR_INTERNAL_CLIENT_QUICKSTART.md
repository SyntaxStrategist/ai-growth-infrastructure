# 🏢 Avenir Internal Client — Quick Start

## ⚡ One-Command Setup

```bash
cd /Users/michaeloni/ai-growth-infrastructure
./scripts/setup-avenir-internal-client.sh
```

**What it does:**
- ✅ Creates "Avenir AI Solutions" client record
- ✅ Links all marketing site leads to this client
- ✅ Enables tracking in admin dashboard

---

## 🎯 Result

### **Before:**
- ❌ Marketing site leads not linked to any client
- ❌ Can't filter by "Avenir AI Solutions" in dashboard
- ❌ No visibility into first-party lead performance

### **After:**
- ✅ All marketing site leads automatically linked to `avenir-internal-client`
- ✅ "Avenir AI Solutions" appears in Client Filter dropdown
- ✅ Full tracking and AI analytics for first-party leads

---

## 🔍 Verify Setup

### **1. Check Admin Dashboard**
```
https://www.aveniraisolutions.ca/en/dashboard
```

Look for:
- 🔽 Client Filter dropdown at top
- 📋 "Avenir AI Solutions" in the list

### **2. Submit Test Lead**
```
https://www.aveniraisolutions.ca/en
```

Fill form → Submit → Check dashboard

### **3. Console Logs**
Should show:
```
[LeadAPI] Linking lead to Avenir AI Solutions internal client
[LeadLink] client_id: avenir-internal-client
```

---

## 📊 How to Use

### **View Your Leads:**
1. Go to admin dashboard
2. Select "Avenir AI Solutions" in Client Filter
3. See all marketing site leads

### **Generate AI Insights:**
1. Click "Generate Fresh Summary"
2. AI analyzes only your leads
3. Get relationship insights and trends

### **Track Conversions:**
1. Go to "Converted Leads" tab
2. Filter by "Avenir AI Solutions"
3. See which marketing leads converted

---

## 🔧 Technical Details

**Client ID:** `avenir-internal-client`  
**Business Name:** Avenir AI Solutions  
**Email:** info@aveniraisolutions.ca  

**Lead Linkage:**
- Marketing site leads (no API key) → `client_id = 'avenir-internal-client'`
- External client leads (with API key) → `client_id = <their client_id>`

---

## 📁 Files

| File | Purpose |
|------|---------|
| `scripts/setup-avenir-internal-client.sh` | Automated setup script |
| `supabase/migrations/add_avenir_internal_client.sql` | SQL migration |
| `src/app/api/lead/route.ts` | Lead API with internal client linkage |
| `AVENIR_INTERNAL_CLIENT_SETUP.md` | Full documentation |

---

## ✅ Summary

**One command:**
```bash
./scripts/setup-avenir-internal-client.sh
```

**Result:**
- ✅ Avenir AI Solutions trackable in dashboard
- ✅ All marketing leads linked automatically
- ✅ Full AI analytics and insights

**Ready to deploy!** 🚀

