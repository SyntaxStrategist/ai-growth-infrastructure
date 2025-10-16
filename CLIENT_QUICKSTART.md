# 🚀 Client System — Quick Start Guide

## ✅ Setup Steps

### **1. Install Dependencies**
```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

### **2. Apply Database Migration**
```bash
# Run the SQL in Supabase dashboard or via CLI:
supabase db push

# Or manually execute:
# supabase/migrations/create_clients_table.sql
```

### **3. Start Dev Server**
```bash
npm run dev
```

---

## 🧪 Test the Flow

### **A. Client Signup**
```bash
# Visit:
open http://localhost:3000/en/client/signup

# Fill form:
- Business Name: "Test Company"
- Contact Name: "John Doe"
- Email: "test@example.com"
- Password: "password123"
- Language: English

# Submit → Check email for credentials
```

### **B. Client Login**
```bash
# Visit:
open http://localhost:3000/en/client/dashboard

# Log in with credentials from email
# Should see dashboard with stats
```

### **C. Send Test Lead via API**
```bash
# Get API key from welcome email or /client/api-access page
# Then:
curl -X POST http://localhost:3000/api/lead \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "message": "I am interested in your AI solutions for my business"
  }'
```

### **D. Verify in Dashboards**
```bash
# Client dashboard:
open http://localhost:3000/en/client/dashboard
# Should show the test lead

# Admin dashboard:
open http://localhost:3000/en/dashboard
# Should show ALL leads (including client leads)
```

---

## 📝 Console Logs to Watch

### **Signup:**
```
[ClientRegistration] New registration request: ...
[ClientRegistration] ✅ Client created: <uuid>
[ClientRegistration] ✅ Welcome email sent
```

### **Login:**
```
[ClientAuth] Login attempt: {email: "..."}
[ClientAuth] ✅ Login successful: {clientId: "...", businessName: "..."}
```

### **API Lead Submission:**
```
[LeadAPI] API key provided - validating...
[LeadAPI] ✅ Valid API key
[LeadAPI] Lead received from client_id: <uuid>
[LeadAPI] Stored lead successfully
```

### **Dashboard Intent Translation:**
```
[DashboardTranslation] locale: en | intent: "..." → "..."
[DashboardTranslation] locale: fr | intent: "..."
```

---

## 🎯 URLs

### **Client:**
- Signup: `/en/client/signup` or `/fr/client/signup`
- Dashboard: `/en/client/dashboard` or `/fr/client/dashboard`
- API Access: `/en/client/api-access` or `/fr/client/api-access`

### **Admin:**
- Dashboard: `/en/dashboard` or `/fr/dashboard`
- Insights: `/en/dashboard/insights` or `/fr/dashboard/insights`

---

## ✅ What's Ready

- ✅ Client signup (bilingual)
- ✅ Welcome emails (EN/FR)
- ✅ Client authentication
- ✅ Private client dashboard
- ✅ API access page
- ✅ API key validation
- ✅ Data isolation by client_id
- ✅ Intent translation
- ✅ Comprehensive logging

---

**Complete client system ready to test!** 🎉
