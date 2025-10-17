# Demo Dashboard Testing Guide

## Quick Test Checklist

### ✅ Demo Page (/demo)

**Test 1: Public Access**
```bash
npm run dev
# Open: http://localhost:3000/demo
```

**Verify:**
- [ ] Page loads without login
- [ ] No authentication redirect
- [ ] Dark gradient background
- [ ] Avenir logo visible in navbar
- [ ] All widgets display correctly

**Test 2: Language Toggle**
- [ ] Click "FR" button → Content switches to French
- [ ] FR button highlighted purple
- [ ] Click "EN" button → Content switches to English
- [ ] EN button highlighted purple

**Test 3: Navigation**
- [ ] Click Avenir logo → Opens https://www.aveniraisolutions.ca
- [ ] Click "Book a Demo" → Opens contact page

**Test 4: Mock Data Display**
- [ ] Lead Overview shows: 247 leads, < 2 min, 34%
- [ ] Automation Insights shows: 892 AI responses, 124 manual, 87%
- [ ] Recent Conversations shows 4 entries
- [ ] Performance chart animates upward
- [ ] "Demo Data" badges visible on all widgets

**Test 5: Animations**
- [ ] Hero section fades in first
- [ ] Cards appear with stagger effect (0.2s delay each)
- [ ] Bar chart animates from bottom to top
- [ ] Hover effects work on bars

---

### ✅ Updated Email Template

**Test 6: Email Preview Modal**
```bash
# In Prospect Intelligence dashboard:
# Click "📧 Send Outreach" on any prospect
```

**Verify in iframe preview:**
- [ ] Subject: "Unlock 80% Time Savings at {business_name}"
- [ ] Logo size: 80px (smaller, more compact)
- [ ] New email copy displays
- [ ] Demo button visible: "🔗 View Live Demo Dashboard"
- [ ] Button color: Blue (#2D6CDF)
- [ ] Button styling: Rounded, padded (12px 24px)
- [ ] Merge fields replaced: {business_name}, {industry}, {website}

**Test 7: Demo Button Click**
- [ ] Click demo button in email preview
- [ ] Opens: /demo page
- [ ] Page loads correctly

**Test 8: Plain Text Version**
```bash
# Check console logs when email is generated
```

**Verify:**
- [ ] Plain text version includes demo URL
- [ ] URL: https://demo.aveniraisolutions.ca
- [ ] Same copy structure as HTML
- [ ] Accessible format

---

### ✅ Integration Test

**Test 9: Full Flow**

**Step 1:** Run prospect discovery
```bash
# Enable form scanning
# Run discovery (Test Mode ON)
```

**Step 2:** Email enrichment
- [ ] Mailto emails extracted
- [ ] contact_email populated
- [ ] Console log: "[FormScanner] ✅ Extracted fallback email..."

**Step 3:** Open Email Preview
- [ ] Click "📧 Send Outreach"
- [ ] Modal opens with branded HTML
- [ ] "To:" field shows contact_email
- [ ] Console log: "[EmailPreview] Loaded contact_email: ..."

**Step 4:** Review email
- [ ] Subject populated correctly
- [ ] Iframe shows branded template
- [ ] Demo button visible in preview
- [ ] Logo, benefits, CTA all display

**Step 5:** Test demo link
- [ ] Click demo button in iframe (if clickable)
- [ ] OR copy demo URL and open in new tab
- [ ] Demo page loads
- [ ] All widgets display

**Step 6:** Send email (Test Mode OFF)
- [ ] Turn Test Mode OFF
- [ ] Click "Send Now"
- [ ] Email sends successfully
- [ ] Toast: "✅ Outreach email sent to {business_name}"
- [ ] Prospect marked as contacted

**Step 7:** Verify received email
- [ ] Check Gmail inbox
- [ ] Email has Avenir branding
- [ ] Demo button visible and clickable
- [ ] Click demo button → Opens demo page
- [ ] All links work

---

## 📊 Console Logs to Check

### Demo Page
```
# No specific logs (static page)
# Check for any errors in console
```

### Email Preview Modal
```
[EmailPreview] Opening for prospect: Business Name
[EmailPreview] Loaded contact_email: contact@example.com
```

### Form Scanner (during discovery)
```
[FormScanner] ✅ Extracted 2 mailto emails: [...]
[FormScanner] ✅ Extracted fallback email from mailto link: contact@example.com
```

### Email Send
```
[EmailPreview] Sending email to: contact@example.com
[EmailPreview] ✅ Email sent successfully
[ProspectDashboard] ✅ Email sent successfully
```

---

## 🎯 Success Criteria

### Demo Page
- ✅ Accessible at /demo without auth
- ✅ Bilingual (EN/FR toggle works)
- ✅ All widgets display mock data
- ✅ Animations are smooth
- ✅ Navigation links work
- ✅ Professional branding

### Email Template
- ✅ New subject line
- ✅ Updated copy
- ✅ Demo button present and styled
- ✅ Logo size reduced (80px)
- ✅ Both HTML and text versions
- ✅ Merge fields work

### Integration
- ✅ Email enrichment extracts mailto emails
- ✅ Email Preview Modal shows contact_email
- ✅ Branded template renders in iframe
- ✅ Demo button links to /demo
- ✅ Email sends successfully
- ✅ All features work together

---

## 🐛 Known Issues & Fixes

### Issue: Demo button not clickable in iframe

**Reason:** Iframe sandbox restrictions

**Workaround:**
- Button is clickable in actual email
- Preview shows button visually
- User can copy URL manually if needed

**Fix (if needed):**
```typescript
// Update iframe sandbox attribute
sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
```

### Issue: Logo doesn't load in demo page

**Reason:** Path incorrect

**Fix:**
```bash
# Verify logo exists
ls -la public/assets/logos/logo.svg

# If missing, use fallback
# src/app/demo/page.tsx
src="/assets/logos/logo.svg"  # Try without leading slash
```

### Issue: Email doesn't include demo link

**Reason:** Template not generating correctly

**Fix:**
```typescript
// Check branded_templates.ts
const demoUrl = process.env.NEXT_PUBLIC_SITE_URL 
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/demo`
  : 'https://demo.aveniraisolutions.ca';

// Verify NEXT_PUBLIC_SITE_URL is set
echo $NEXT_PUBLIC_SITE_URL
```

---

## 📈 Monitoring

### Metrics to Track

**Demo Page:**
- Page views per day
- Average time on page
- Bounce rate
- "Book a Demo" click rate
- Language preference (EN vs FR)

**Email Campaign:**
- Email open rate
- Demo link click rate
- Demo page visits from email
- Conversion rate (demo → booking)

**Funnel Analysis:**
```
Email Sent → Opened → Demo Clicked → Demo Viewed → Booked Call
```

Track each step to optimize conversion.

---

**Testing complete! Ready for production deployment.** 🚀
