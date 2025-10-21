# ⚡ Client Lead Email Flow - Executive Summary

---

## 🎯 Direct Answers

### 1️⃣ What happens when a client gets a new lead?

**✅ Email is automatically generated and sent immediately** (in production)

**❌ Email is generated but NOT sent** (in development mode - current)

**No queuing. No approval. Fully automatic.**

---

### 2️⃣ Which sender address is used?

**Depends on client config:**

```
If client has outbound_email set:
→ From: client.outbound_email
   Example: "support@acmecorp.com"

If client has NO outbound_email:
→ From: noreply@aveniraisolutions.ca
   Sender Name: [Client Business Name]
   Example: "Acme Corp <noreply@aveniraisolutions.ca>"

For Avenir internal leads:
→ From: contact@aveniraisolutions.ca
```

**⚠️ Note:** Client SMTP config is stored but NOT used. All emails go through Avenir's Gmail API.

---

### 3️⃣ Do clients see sent emails in their dashboard?

**❌ NO**

**Clients can see:**
- ✅ Leads
- ✅ AI enrichment
- ✅ Analytics

**Clients CANNOT see:**
- ❌ Sent emails
- ❌ Email content
- ❌ Email status

---

### 4️⃣ Are there delays, batching, or daily limits?

**❌ NO**

- **Immediate:** Email sent in real-time (<3 seconds)
- **No Queue:** Direct send, no batching
- **No Limits:** Unlimited emails per client
- **No Throttling:** Each lead = one email instantly

---

### 5️⃣ Is admin approval required?

**❌ NO**

Completely automatic. Zero admin intervention.

---

## 📊 Complete Flow (Simple)

```
Lead Submitted
    ↓ (immediate)
AI Enriches Lead
    ↓ (immediate)
Email Generated
    ↓ (immediate)
Email Sent ✉️
    ↓
Client Sees Lead (not email) in Dashboard
```

**Total Time:** 1-3 seconds

---

## 🔑 Key Takeaways

1. **Automatic** - No approval, no queue, no delay
2. **Immediate** - Sent within seconds of lead capture
3. **Development Safe** - Emails NOT sent in dev mode
4. **No Visibility** - Clients can't see sent emails
5. **Gmail Only** - Uses Avenir's Gmail, not client SMTP

---

## ⚠️ Important Notes

**Development vs Production:**
- **DEV:** Email generated but NOT sent (current state)
- **PROD:** Email sent immediately via Gmail

**Email goes through:**
- Avenir's Gmail API (always)
- NOT client's SMTP (even if configured)

**Client dashboard shows:**
- Leads (yes)
- Emails sent (no)

---

**Questions?** See full analysis in `CLIENT_LEAD_EMAIL_FLOW.md`

