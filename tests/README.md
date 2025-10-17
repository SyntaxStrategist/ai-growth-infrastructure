# 🧪 Avenir AI Solutions — Testing Suite

This directory contains comprehensive testing and documentation for the Avenir AI platform.

---

## 📋 Files Overview

### **Documentation**

| File | Purpose |
|------|---------|
| `AVENIR_AI_SYSTEM_BLUEPRINT.md` | Complete system architecture and technical map |
| `AVENIR_AI_SYSTEM_E2E_REPORT.md` | End-to-end test execution report |
| `README.md` | This file - testing suite overview |

### **Test Scripts**

| File | Purpose |
|------|---------|
| `run-e2e-tests.js` | Node.js automated test runner |
| `avenir-ai-e2e-test.sh` | Bash-based E2E test script |
| `test-french-translation.sh` | French translation verification |
| `clear-cache-and-test.sh` | Cache clearing utility |

### **Playwright Tests**

| Directory | Purpose |
|-----------|---------|
| `tests/` | Playwright E2E tests with visual regression |
| `screenshots/` | Screenshot captures for visual comparison |
| `E2E_REPORT.md` | Playwright test results |

---

## 🚀 Quick Start

### **Option 1: Run Full Automated Suite (Recommended)**

```bash
# Start the development server in one terminal
npm run dev

# In another terminal, run the full test suite
./run-full-e2e-suite.sh
```

This will:
- ✅ Check if server is running
- ✅ Execute all 11 automated tests
- ✅ Generate detailed report
- ✅ Update `AVENIR_AI_SYSTEM_E2E_REPORT.md`

### **Option 2: Run Individual Test Scripts**

```bash
# Node.js test runner (detailed output)
node tests/run-e2e-tests.js

# Bash test runner (simpler)
./tests/avenir-ai-e2e-test.sh

# French translation test
./tests/test-french-translation.sh

# Clear cache
./tests/clear-cache-and-test.sh
```

### **Option 3: Run Playwright Visual Tests**

```bash
# Run all Playwright tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# View last report
npm run test:e2e:report
```

---

## 📊 Test Coverage

### **API Endpoints Tested**

- ✅ `/api/client/register` - Client signup
- ✅ `/api/client/auth` - Client login
- ✅ `/api/client/leads` - Fetch client leads
- ✅ `/api/client/settings` - Update client settings
- ✅ `/api/client/update-language` - Update language preference
- ✅ `/api/lead` - Lead submission with AI enrichment
- ✅ `/api/chat` - AI assistant chat
- ✅ `/api/prospect-intelligence/scan` - Prospect discovery
- ✅ `/api/prospect-intelligence/prospects` - Fetch prospects

### **User Flows Tested**

- ✅ Client signup (EN + FR)
- ✅ Client login
- ✅ Lead submission with API key
- ✅ AI enrichment (intent, tone, urgency)
- ✅ Personalized email generation
- ✅ Settings update
- ✅ Language preference update
- ✅ Prospect intelligence scan

### **Features Tested**

- ✅ Bilingual support (EN/FR)
- ✅ API key authentication
- ✅ Test data detection (`is_test` flag)
- ✅ AI enrichment pipeline
- ✅ Email template personalization
- ✅ Client data isolation
- ✅ Prospect discovery and scoring
- ✅ Settings auto-save

---

## 🧪 Test Modes

### **Development Mode**

- Email sending: **SKIPPED** (logged only)
- Google Sheets: **SKIPPED**
- Gmail API: **SKIPPED**
- OpenAI API: **ACTIVE** (requires `OPENAI_API_KEY`)
- Supabase: **ACTIVE** (requires credentials)

### **Production Mode**

- Email sending: **ACTIVE**
- All APIs: **ACTIVE**
- Real data: **LIVE**

⚠️ **Warning:** Always use test accounts and test mode flags in production tests.

---

## 📝 Test Data

All tests use timestamped emails to ensure uniqueness:

```javascript
const timestamp = Date.now();
const testEmail = `avenir-e2e-test-en-${timestamp}@example.com`;
```

**Test Accounts Created:**
- English: `avenir-e2e-test-en-{timestamp}@example.com`
- French: `avenir-e2e-test-fr-{timestamp}@example.com`

**Auto-Cleanup:**
- Test data marked with `is_test = true`
- Can be filtered out in admin dashboard
- Can be bulk deleted via database query

---

## 🔍 Debugging

### **View Console Logs**

When running `npm run dev`, server console logs show:

```
[i18n/request] Requested locale: en
[LocaleLayout] Locale confirmed before loading messages: en
[Lead API] POST /api/lead triggered
[LeadAPI] ✅ Valid API key
[LeadAPI] Lead received from client_id: xxx
```

### **Check Database**

Access Supabase dashboard to verify:
- Clients table: New test clients created
- lead_memory: Leads with AI enrichment
- lead_actions: Activity history
- prospect_candidates: Discovered prospects

### **View Generated Emails**

In development mode, emails are logged to console:

```
[Lead API] 📧 Email preview (not sent in dev):
Subject: Thank you for contacting E2E Test Agency EN
Body: Hi John Doe, Thank you for reaching out...
```

---

## 📊 Success Criteria

**System Ready for Production When:**

- ✅ All 11 automated tests pass (100% success rate)
- ✅ No TypeScript errors
- ✅ No ESLint warnings
- ✅ Build succeeds
- ✅ French translations display correctly
- ✅ All database writes confirmed
- ✅ Email templates generate properly
- ✅ API authentication works
- ✅ Client data isolation verified
- ✅ Language toggle persists

---

## 🛠️ Troubleshooting

### **Tests Fail with "Connection Refused"**

**Solution:** Server not running. Start with `npm run dev`

### **Tests Fail with "Invalid API Key"**

**Solution:** Signup test may have failed. Check console logs for errors.

### **French Page Shows English**

**Solution:**
1. Clear cache: `rm -rf .next`
2. Rebuild: `npm run build`
3. Test in incognito mode

### **Database Errors**

**Solution:** Check `.env.local` has correct Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### **OpenAI Errors**

**Solution:** Verify `OPENAI_API_KEY` is set in `.env.local`

---

## 📚 Additional Resources

- **System Blueprint:** Complete architecture documentation
- **Links Reference:** All platform URLs (local + production)
- **Playwright Tests:** Visual regression testing
- **API Documentation:** *(in progress)*

---

## 🎯 Next Steps After Testing

1. ✅ Review `AVENIR_AI_SYSTEM_E2E_REPORT.md`
2. ✅ Address any failed tests
3. ✅ Re-run until 100% pass
4. ✅ Test in production environment (staging)
5. ✅ Deploy to production (Vercel)
6. ✅ Run production smoke tests
7. ✅ Monitor logs for errors

---

## 🔒 Security Notes

- ✅ Never commit `.env.local` to Git
- ✅ Use test mode flags for all tests
- ✅ Mark test data with `is_test = true`
- ✅ Review test accounts periodically
- ✅ Rotate API keys after testing
- ✅ Clear test data from production database

---

**Last Updated:** October 17, 2025  
**Test Suite Version:** 1.0.0  
**Platform Version:** 2.0.0  

