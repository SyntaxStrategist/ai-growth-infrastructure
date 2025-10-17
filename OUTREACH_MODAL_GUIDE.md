# Outreach Modal System Guide

## Overview

The Prospect Intelligence dashboard now includes a comprehensive modal system for viewing prospect proof and previewing/sending outreach emails. This guide explains both modals and their workflow.

---

## 🎯 Features

### 1. View Proof Modal (`ProspectProofModal`)

**Purpose:** Display detailed proof and evidence for a prospect's automation need.

**Triggered By:** Clicking the "📊 View Proof" button in the prospects table.

**What It Shows:**
- **Business Information**
  - Business name
  - Website (clickable link)
  - Industry
  - Region
  - Automation need score (0-100)
  - Response time

- **Form Detection**
  - 📝 Has contact form (count)
  - ✉️ Has mailto links
  - 🛡️ Has CAPTCHA protection
  - 🤖 Recommended outreach approach
  - Submit method (POST, GET, AJAX)
  - Scan timestamp

- **Screenshot**
  - Website screenshot (if available)
  - Placeholder if no screenshot

- **Contact Paths**
  - List of detected contact URLs
  - Clickable links to contact pages

- **Raw Metadata (Debug)**
  - Collapsible section with full JSON metadata
  - Useful for debugging and verification

**Simulation Mode:**
- If the prospect is test data, shows a yellow banner: "⚠️ Simulation Mode – No live data"

**API Endpoint:** `GET /api/prospect-intelligence/proof?id=<prospect_id>`

**Security:**
- Server-side only (uses `SUPABASE_SERVICE_ROLE_KEY`)
- No sensitive data exposed to client

---

### 2. Email Preview Modal (`EmailPreviewModal`)

**Purpose:** Preview and send personalized outreach emails with full control.

**Triggered By:** Clicking the "📧 Send Outreach" button in the prospects table.

**What It Shows:**
- **Recipient Information**
  - Email address
  - Business name
  - Industry

- **Email Content (Editable)**
  - Subject line (can be modified)
  - Full email body (can be edited)
  - Personalization variables:
    - `{business_name}` → Actual business name
    - `{industry}` → Business industry
    - `{website}` → Business website

- **Controls**
  - **Send Now** button → Sends the email via Gmail
  - **Cancel** button → Closes modal without sending

**Test Mode Protection:**
- If Test Mode is ON, shows warning banner
- "Send Now" button is disabled
- Must disable Test Mode to send real emails

**Email Template:**
```
Subject: Streamline Operations at {business_name}

Hello,

I noticed {business_name} is in the {industry} industry, and wanted to reach out about an opportunity to streamline your operations.

We specialize in AI-powered automation solutions that can help businesses like yours:
• Automate lead intake and qualification
• Reduce manual data entry by 80%
• Improve response times to customer inquiries
• Free up your team to focus on high-value tasks

I'd love to schedule a brief 15-minute call to discuss how we can help {business_name} achieve similar results.

Would you be available for a quick chat this week?

Best regards,
Avenir AI Solutions Team

Website: {website}
Industry: {industry}
```

**API Endpoint:** `POST /api/prospect-intelligence/outreach`

**Payload:**
```json
{
  "prospect_id": "uuid",
  "to": "contact@business.com",
  "subject": "Email subject",
  "body": "Email body"
}
```

---

## 📁 File Structure

### Backend

**API Routes:**
```
src/app/api/prospect-intelligence/
├── proof/
│   └── route.ts       # GET endpoint for prospect proof data
└── outreach/
    └── route.ts       # POST endpoint for sending emails (already exists)
```

**Proof API (`proof/route.ts`):**
- Fetches prospect data from `prospect_candidates` table
- Extracts `form_scan` metadata
- Returns proof data including:
  - Business info
  - Form detection results
  - Screenshot URL
  - Contact paths
  - Raw metadata for debugging
- Detects simulated/test data

### Frontend

**Components:**
```
src/components/
├── ProspectProofModal.tsx     # View proof modal
└── EmailPreviewModal.tsx      # Email preview/send modal
```

**Dashboard Integration:**
```
src/app/[locale]/admin/prospect-intelligence/page.tsx
```

**State Management:**
```typescript
const [proofModalOpen, setProofModalOpen] = useState(false);
const [emailPreviewModalOpen, setEmailPreviewModalOpen] = useState(false);
const [selectedProspect, setSelectedProspect] = useState<ProspectCandidate | null>(null);
```

---

## 🔄 Workflow

### View Proof Workflow

1. User clicks "📊 View Proof" button
2. `handleOpenProofModal(prospect)` is called
3. Sets `selectedProspect` and opens `ProspectProofModal`
4. Modal fetches data from `/api/prospect-intelligence/proof?id=...`
5. Displays proof information with animations
6. User can:
   - View all business details
   - See form detection results
   - Expand metadata for debugging
   - Click "Close" to exit

### Email Preview & Send Workflow

1. User clicks "📧 Send Outreach" button
2. `handleOpenEmailPreview(prospect)` is called
3. Sets `selectedProspect` and opens `EmailPreviewModal`
4. Modal generates personalized email content
5. User can:
   - Edit subject line
   - Edit email body
   - Preview personalization
6. User clicks "Send Now"
7. If Test Mode is ON → Error message, no send
8. If Test Mode is OFF:
   - Modal calls `/api/prospect-intelligence/outreach`
   - Shows loading state
   - On success:
     - `handleEmailSendSuccess()` called
     - Toast notification: "✅ Outreach email sent to {business_name}"
     - Modal closes
     - Prospects table reloads
   - On error:
     - `handleEmailSendError(error)` called
     - Toast notification: "❌ {error message}"
     - Modal stays open for retry

---

## 🎨 UI/UX Features

### Animations

**Modal Entry/Exit:**
```typescript
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.95 }}
transition={{ duration: 0.2 }}
```

**Backdrop:**
```css
bg-black/50 backdrop-blur-sm
```

### Modal Design

- **Gradient background:** `from-gray-900 via-blue-900 to-gray-900`
- **Border:** `border border-white/10`
- **Sticky header/footer:** Always visible during scroll
- **Max height:** `max-h-[90vh]` with overflow scroll
- **Responsive:** Works on mobile and desktop

### Button States

**Send Outreach Button:**
- Normal: Purple with border
- Contacted: Green (disabled)
- Disabled: Grayed out

**View Proof Button:**
- Always enabled
- Blue with border
- Hover effect

---

## 🔐 Security

### Server-Side Only

**API Keys:**
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- `GMAIL_CREDENTIALS_JSON` (server-side only)
- Never exposed to client

**Proof API:**
- Uses service role key for full database access
- No RLS bypass needed (uses elevated permissions)

**Outreach API:**
- Validates request payload
- Checks Test Mode status
- Uses Gmail OAuth2 for sending

### Test Mode Protection

**Purpose:** Prevent accidental live emails during testing

**Implementation:**
```typescript
if (testMode) {
  onSendError('Cannot send emails in Test Mode. Please disable Test Mode first.');
  return;
}
```

**UI Indicators:**
- Warning banner in modal
- "Send Now" button disabled
- Clear messaging

---

## 📊 Database Schema

### Prospect Candidates Table

**Relevant Fields:**
```sql
CREATE TABLE prospect_candidates (
  id UUID PRIMARY KEY,
  business_name TEXT NOT NULL,
  website TEXT NOT NULL,
  contact_email TEXT,
  industry TEXT,
  region TEXT,
  automation_need_score INTEGER,
  contacted BOOLEAN DEFAULT FALSE,
  metadata JSONB,  -- Contains form_scan, screenshot_url, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Metadata Structure:**
```json
{
  "source": "apollo" | "pdl" | "google" | "test",
  "simulated": false,
  "form_scan": {
    "has_form": true,
    "form_count": 2,
    "has_mailto": false,
    "has_captcha": true,
    "submit_method": "POST",
    "recommended_approach": "form-response-bot",
    "scanned_at": "2025-10-17T12:00:00Z",
    "contact_paths": [
      "https://business.com/contact",
      "https://business.com/get-in-touch"
    ]
  },
  "screenshot_url": "https://storage.example.com/screenshot.png",
  "response_time": "< 2 hours",
  "apollo_id": "...",
  "pdl_id": "..."
}
```

---

## 🧪 Testing

### Test View Proof Modal

1. Start dev server: `npm run dev`
2. Navigate to `/en/admin/prospect-intelligence`
3. Run prospect discovery (Test Mode ON)
4. Click "📊 View Proof" on any prospect
5. Verify:
   - Modal opens with smooth animation
   - Business information displays correctly
   - Form detection badges show (if applicable)
   - Screenshot appears or placeholder shown
   - Metadata collapsible works
   - "Simulation Mode" banner appears for test data
   - "Close" button closes modal

### Test Email Preview Modal

1. Start dev server with Gmail configured
2. Navigate to `/en/admin/prospect-intelligence`
3. Ensure Test Mode is ON
4. Click "📧 Send Outreach" on any prospect
5. Verify:
   - Modal opens with personalized content
   - Subject and body are filled
   - Variables are replaced (`{business_name}`, etc.)
   - Warning banner shows "Test Mode is ON"
   - "Send Now" button is disabled
6. Turn Test Mode OFF
7. Click "📧 Send Outreach" again
8. Verify:
   - Warning banner is gone
   - "Send Now" button is enabled
9. Edit subject/body
10. Click "Send Now"
11. Verify:
    - Loading spinner shows
    - Modal closes on success
    - Toast notification appears
    - Prospect is marked as contacted

### Test Error Handling

**Scenario 1: Missing contact email**
- Select prospect without email
- Try to send outreach
- Expect: Error toast "No contact email found"

**Scenario 2: Network error**
- Disconnect network
- Try to send outreach
- Expect: Error toast "Failed to send email"

**Scenario 3: Test Mode protection**
- Test Mode ON
- Try to send outreach
- Expect: Error toast "Cannot send emails in Test Mode"

---

## 🔧 Customization

### Modify Email Template

**Location:** `src/components/EmailPreviewModal.tsx`

**Function:** `generateEmailContent()`

```typescript
const generateEmailContent = () => {
  const subject = `Your Custom Subject for ${prospect.business_name}`;
  
  const body = `Your custom email body here...
  
Use variables:
- ${prospect.business_name}
- ${prospect.industry}
- ${prospect.website}`;

  setEmailSubject(subject);
  setEmailBody(body);
};
```

### Add Custom Proof Fields

**Backend (`proof/route.ts`):**
```typescript
const proofData = {
  // ... existing fields ...
  proof: {
    // ... existing fields ...
    custom_field: metadata.custom_field || 'default',
  },
};
```

**Frontend (`ProspectProofModal.tsx`):**
```tsx
<div>
  <p className="text-sm text-white/50">Custom Field</p>
  <p className="text-white font-medium">{proofData.proof.custom_field}</p>
</div>
```

### Change Modal Appearance

**Colors:**
- Background gradient: `from-gray-900 via-blue-900 to-gray-900`
- Border: `border-white/10`
- Text: `text-white`, `text-white/70`, `text-white/50`

**Sizing:**
- Width: `max-w-3xl` (change to `max-w-4xl`, `max-w-5xl`, etc.)
- Height: `max-h-[90vh]` (change to `max-h-[80vh]`, etc.)

**Animation Speed:**
- Duration: `0.2` (change to `0.3`, `0.4`, etc.)

---

## 🐛 Troubleshooting

### Modal doesn't open

**Check:**
1. Is `selectedProspect` being set?
   ```typescript
   console.log('[Debug] Selected:', selectedProspect);
   ```
2. Is modal state updated?
   ```typescript
   console.log('[Debug] Modal open:', proofModalOpen, emailPreviewModalOpen);
   ```
3. Browser console for errors

### Proof data not loading

**Check:**
1. Prospect ID is valid
2. Database has the prospect
3. `/api/prospect-intelligence/proof` returns 200
4. Network tab in DevTools shows successful request
5. Server logs for errors

**Debug:**
```typescript
// In ProspectProofModal.tsx
console.log('[ProofModal] Fetching proof for:', prospectId);
console.log('[ProofModal] Response:', data);
```

### Email not sending

**Check:**
1. Test Mode is OFF
2. Prospect has `contact_email`
3. Gmail credentials configured
4. `/api/prospect-intelligence/outreach` returns 200
5. Gmail API not rate-limited

**Debug:**
```typescript
// In EmailPreviewModal.tsx
console.log('[EmailPreview] Sending to:', prospect.contact_email);
console.log('[EmailPreview] Test Mode:', testMode);
```

### Animations not smooth

**Check:**
1. `framer-motion` installed
2. `AnimatePresence` wrapping modal
3. CSS transitions not conflicting

**Fix:**
```bash
npm install framer-motion
```

---

## 📝 Console Logging

### Proof Modal

```
[ProofModal] Opening for prospect: Business Name
[ProofModal] Fetching proof from API...
[ProofModal] ✅ Proof data loaded: Business Name
[ProofModal] Closed
```

### Email Preview Modal

```
[EmailPreview] Opening for prospect: Business Name
[EmailPreview] Sending email to: contact@business.com
[EmailPreview] ✅ Email sent successfully
[EmailPreview] Closed
```

### Dashboard

```
[ProspectDashboard] Opening proof modal for: Business Name
[ProspectDashboard] Opening email preview for: Business Name
[ProspectDashboard] ✅ Email sent successfully
[ProspectDashboard] ❌ Email send error: Error message
```

---

## ✅ Production Checklist

Before deploying to production:

- [ ] Test both modals with real prospects
- [ ] Verify Test Mode protection works
- [ ] Test email sending with real Gmail account
- [ ] Check proof data loads correctly
- [ ] Verify screenshot URLs work
- [ ] Test on mobile devices
- [ ] Check for console errors
- [ ] Verify animations are smooth
- [ ] Test error scenarios
- [ ] Confirm toast notifications appear
- [ ] Test with different prospect types (test data, real data)
- [ ] Verify modal closes on outside click or escape key (if implemented)
- [ ] Check accessibility (keyboard navigation, screen readers)

---

## 🚀 Future Enhancements

### Potential Improvements

1. **Bulk Email Preview**
   - Preview multiple emails at once
   - Send to multiple prospects

2. **Email Templates**
   - Save custom templates
   - Template library
   - Variable system

3. **Proof Export**
   - Export proof as PDF
   - Share proof link
   - Email proof to client

4. **Advanced Form Detection**
   - Real-time form testing
   - Auto-fill capabilities
   - Response tracking

5. **A/B Testing**
   - Test different email versions
   - Track open rates
   - Optimize subject lines

6. **Email Scheduling**
   - Schedule emails for later
   - Optimal send times
   - Follow-up reminders

---

## 📖 Related Documentation

- [Prospect Intelligence Guide](./COMPLETE_SYSTEM_STATUS.md)
- [Email Automation](./PERSONALIZED_EMAIL_SYSTEM_COMPLETE.md)
- [Form Scanner](./FORM_SCANNER.md)
- [People Data Labs Integration](./PEOPLE_DATA_LABS_INTEGRATION.md)

---

## 🤝 Support

If you encounter issues:

1. Check console logs (browser and server)
2. Review this guide
3. Check database for prospect data
4. Verify API endpoints are working
5. Test with different prospects

**Happy outreaching! 🚀**

