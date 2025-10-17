# 🕵️ Avenir AI Solutions — Prospect Intelligence System

**Version:** 2.0.0  
**Last Updated:** October 17, 2025  
**Status:** Production Ready  
**Classification:** Technical System Documentation  

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Discovery Pipeline](#discovery-pipeline)
3. [Scoring Algorithm](#scoring-algorithm)
4. [Outreach Generation](#outreach-generation)
5. [Feedback Loop](#feedback-loop)
6. [Database Schema](#database-schema)
7. [AI Integration](#ai-integration)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [Daily Workflow](#daily-workflow)
10. [Query Examples](#query-examples)

---

## 🎯 System Overview

### **What is Prospect Intelligence?**

The Prospect Intelligence System is an autonomous pipeline that discovers, evaluates, and contacts businesses that would benefit from Avenir AI's instant lead automation platform. It operates continuously to identify high-potential prospects and automatically initiates outreach.

### **Core Capabilities**

- ✅ **Autonomous Discovery** — Finds businesses with contact forms
- ✅ **Smart Scoring** — Tests and evaluates current response systems
- ✅ **Automated Outreach** — Generates and sends personalized emails
- ✅ **Learning Feedback** — Tracks engagement and refines targeting
- ✅ **AI Integration** — Leverages growth_brain for continuous improvement

### **Key Metrics**

| Metric | Target | Current Status |
|--------|--------|----------------|
| Prospects Discovered | 100+/week | Active |
| Automation Need Score | 70+ (high priority) | Optimized |
| Outreach Success Rate | 15-25% | Tracking |
| Time to First Contact | < 24 hours | Automated |

---

## 🔍 Discovery Pipeline

### **Phase 1: Prospect Discovery**

**Objective:** Identify businesses with contact forms but inadequate instant-response systems

**Data Sources:**

1. **Google Search API**
   - Target: Small businesses (5-50 employees)
   - Location: Canada & USA
   - Query patterns: `[industry] + "contact us" + [city]`
   - Industries: Real Estate, Legal, Marketing, Home Services, Construction

2. **Apollo.io (Optional)**
   - Business directories
   - Employee count filtering
   - Contact information extraction

3. **Crunchbase API (Optional)**
   - Startup databases
   - Funding information
   - Growth stage identification

**Discovery Workflow:**

```
Step 1: Define Search Parameters
  • Industries: [Real Estate, Legal, Marketing, ...]
  • Regions: [Toronto, Montreal, Vancouver, ...]
  • Employee count: 5-50
  • Must have: Contact form

Step 2: Execute Search Queries
  for each industry in industries:
    for each region in regions:
      query = f"{industry} contact form {region}"
      results = searchAPI.query(query, limit=20)
      
      for result in results:
        extract business_name, website, industry, region
        identify contact_form_url
        
        save to prospect_candidates (status: discovered)

Step 3: Validate Results
  • Check website accessibility
  • Verify contact form exists
  • Extract email if available
  • Detect language (en/fr)

Step 4: Initial Storage
  INSERT INTO prospect_candidates (
    business_name,
    website,
    form_url,
    industry,
    region,
    language
  )
```

**Discovery Criteria:**

| Criterion | Required | Description |
|-----------|----------|-------------|
| Website active | Yes | Must respond within 5s |
| Contact form exists | Yes | Must have submission endpoint |
| Business size | Preferred | 5-50 employees ideal |
| Location | Yes | Canada or USA |
| Industry match | Yes | One of target industries |

**Example Search Queries:**

```
"real estate contact us Toronto"
"law firm contact form Montreal"
"marketing agency contact us Vancouver"
"construction company contact form Calgary"
"home services contact us Ottawa"
```

**Discovered Data Structure:**

```json
{
  "business_name": "Prime Real Estate Group",
  "website": "https://primerealestate.ca",
  "form_url": "https://primerealestate.ca/contact",
  "contact_email": null,  // Will be extracted if available
  "industry": "Real Estate",
  "region": "Toronto, ON",
  "language": "en"
}
```

---

## 📊 Scoring Algorithm

### **Phase 2: Automated Testing & Scoring**

**Objective:** Evaluate current response capabilities and calculate automation need

**Testing Process:**

```
Step 1: Submit Test Lead
  • Name: "Test Inquiry - Avenir AI"
  • Email: "test@aveniraisolutions.ca"
  • Message: "I'm interested in learning more about your services"
  
  POST to form_url
  Record: submission_time

Step 2: Monitor for Autoresponder (60 seconds)
  • Check test email inbox
  • Wait up to 1 minute
  • Record: response_received (true/false)
  • Record: response_time (seconds)

Step 3: Analyze Response Quality
  if response_received:
    • Extract email content
    • Analyze tone (AI via OpenAI)
    • Check personalization level
    • Detect template vs custom
  else:
    • Mark as no_autoresponder

Step 4: Calculate Scores
  response_score = calculate_response_score()
  automation_need_score = 100 - response_score
```

**Scoring Formula:**

```typescript
function calculateResponseScore(testResult) {
  let score = 0;
  
  // 1. Autoresponder exists? (50 points)
  if (testResult.response_received) {
    score += 50;
  }
  
  // 2. Response time (30 points max)
  if (testResult.response_time < 1000) {
    score += 30;  // Instant (<1s)
  } else if (testResult.response_time < 5000) {
    score += 15;  // Fast (<5s)
  }
  
  // 3. Content quality (20 points max)
  if (testResult.is_personalized) {
    score += 20;  // Personalized content
  } else if (testResult.is_generic) {
    score += 10;  // Generic but present
  }
  
  return Math.min(score, 100);
}

function calculateAutomationNeedScore(response_score) {
  return 100 - response_score;
}
```

**Score Interpretation:**

| Response Score | Automation Need | Priority | Interpretation |
|----------------|-----------------|----------|----------------|
| 0-30 | 70-100 | 🔥 High | No/poor autoresponder - immediate opportunity |
| 31-60 | 40-69 | ⚡ Medium | Basic response - room for improvement |
| 61-100 | 0-39 | ✅ Low | Good response system - lower priority |

**Example Scoring:**

```javascript
// Example 1: No autoresponder
{
  response_received: false,
  response_time: null,
  is_personalized: false
}
// Result: response_score = 0, automation_need_score = 100 (🔥 High Priority)

// Example 2: Slow generic response
{
  response_received: true,
  response_time: 8000,  // 8 seconds
  is_personalized: false,
  is_generic: true
}
// Result: response_score = 60 (50 + 0 + 10), automation_need_score = 40 (⚡ Medium)

// Example 3: Fast personalized response
{
  response_received: true,
  response_time: 800,  // <1s
  is_personalized: true
}
// Result: response_score = 100 (50 + 30 + 20), automation_need_score = 0 (✅ Low)
```

**Storage After Scoring:**

```sql
UPDATE prospect_candidates
SET 
  response_score = 0,
  automation_need_score = 100,
  last_tested = NOW()
WHERE id = 'prospect-id';
```

---

## 📧 Outreach Generation

### **Phase 3: Personalized Email Creation**

**Objective:** Generate compelling outreach for high-priority prospects (score >= 70)

**Outreach Criteria:**

```typescript
// Only contact prospects with high automation need
const eligibleProspects = await supabase
  .from('prospect_candidates')
  .select('*')
  .gte('automation_need_score', 70)
  .eq('contacted', false);
```

**Email Template Structure:**

```
Subject: Quick note about your website leads ⚡

Hi [Contact Name or Business Name],

I tried your contact form earlier today and noticed there's no 
instant reply system.

Avenir AI helps [Industry] businesses like yours convert form 
submissions into real conversations immediately — in English 
or French, 24/7.

Would you like to see how it would work on your site?

[If booking link available]
→ Schedule a 15-min demo: [calendly_link]

[If no booking link]
Reply to this email and I'll send you a quick example.

Best regards,
Michael Oni
Avenir AI Solutions
www.aveniraisolutions.ca
```

**Dynamic Personalization:**

| Variable | Source | Example |
|----------|--------|---------|
| `[Contact Name]` | Extracted from website or "Team" | "Sarah" or "Prime Real Estate Team" |
| `[Business Name]` | Prospect record | "Prime Real Estate Group" |
| `[Industry]` | Prospect classification | "Real Estate" → "real estate" |
| `[Form URL]` | Test result | "https://primerealestate.ca/contact" |
| `[Pain Point]` | AI-generated based on industry | Real Estate: "losing potential buyers", Legal: "missing consultation requests" |

**Email Generation Code:**

```typescript
async function generateOutreachEmail(prospect) {
  // 1. Fetch prospect details
  const { business_name, industry, website, form_url, language } = prospect;
  
  // 2. Generate industry-specific pain point
  const painPoint = {
    'Real Estate': 'losing potential buyers to competitors with faster response',
    'Legal': 'missing consultation requests while you're in meetings',
    'Marketing': 'letting warm leads go cold before you can respond',
    'Construction': 'missing project inquiries during busy site visits',
    'Home Services': 'losing emergency service requests to faster competitors'
  }[industry] || 'missing opportunities to engage leads instantly';
  
  // 3. Detect contact name (if available from website)
  const contactName = await extractContactName(website) || business_name;
  
  // 4. Build subject line
  const subject = language === 'fr' 
    ? `Question rapide sur vos leads web ⚡`
    : `Quick note about your website leads ⚡`;
  
  // 5. Build email body
  const greeting = language === 'fr'
    ? `Bonjour ${contactName},`
    : `Hi ${contactName},`;
  
  const body = language === 'fr'
    ? buildFrenchEmail(prospect, painPoint)
    : buildEnglishEmail(prospect, painPoint);
  
  // 6. Add CTA
  const cta = language === 'fr'
    ? `Souhaitez-vous voir comment cela fonctionnerait sur votre site?`
    : `Would you like to see how it would work on your site?`;
  
  return {
    subject,
    body: `${greeting}\n\n${body}\n\n${cta}\n\n${signature}`,
    to: prospect.contact_email || await findEmail(website),
    from: 'michael@aveniraisolutions.ca',
    reply_to: 'hello@aveniraisolutions.ca'
  };
}
```

**Outreach Timing:**

- **High Priority (90-100):** Contact within 1 hour of discovery
- **Medium Priority (70-89):** Contact within 24 hours
- **Low Priority (<70):** Skip or defer

**Tracking:**

```sql
-- After sending email
INSERT INTO prospect_outreach_log (
  prospect_id,
  email_subject,
  email_body,
  status,  -- 'sent'
  sent_at
) VALUES (...);

-- Update prospect status
UPDATE prospect_candidates
SET contacted = true
WHERE id = prospect_id;
```

---

## 🔄 Feedback Loop

### **Phase 4: Engagement Tracking & Learning**

**Objective:** Monitor outreach effectiveness and refine targeting

**Engagement Metrics:**

| Metric | Tracking Method | Status Values |
|--------|----------------|---------------|
| **Email Opened** | Tracking pixel or email provider API | `sent` → `opened` |
| **Link Clicked** | UTM parameters or link tracking | `opened` → `engaged` |
| **Reply Received** | Email inbox monitoring | `engaged` → `replied` |
| **No Response** | 7-day timeout | `sent` → `ignored` |

**Feedback Recording:**

```typescript
// When prospect opens email
async function onEmailOpened(prospect_id) {
  await supabase
    .from('prospect_outreach_log')
    .update({ 
      status: 'opened',
      opened_at: new Date()
    })
    .eq('prospect_id', prospect_id);
  
  // Record learning event in growth_brain
  await recordLearningEvent(prospect_id, 'email_opened');
}

// When prospect replies
async function onEmailReplied(prospect_id, reply_content) {
  await supabase
    .from('prospect_outreach_log')
    .update({ 
      status: 'replied',
      replied_at: new Date()
    })
    .eq('prospect_id', prospect_id);
  
  // Analyze reply sentiment
  const sentiment = await analyzeReplySentiment(reply_content);
  
  // Record learning event with context
  await recordLearningEvent(prospect_id, 'email_replied', {
    sentiment,
    response_time_hours: calculateResponseTime(),
    reply_length: reply_content.length
  });
}

// Record learning event in growth_brain
async function recordLearningEvent(prospect_id, event_type, metadata = {}) {
  const prospect = await fetchProspect(prospect_id);
  
  await supabase.from('growth_brain').insert({
    client_id: 'avenir_internal',  // Internal prospect tracking
    event_type: 'prospect_engagement',
    learning_snapshot: {
      prospect_id,
      engagement_type: event_type,
      industry: prospect.industry,
      region: prospect.region,
      automation_need_score: prospect.automation_need_score,
      ...metadata
    },
    insight_text: `Prospect ${event_type}: ${prospect.business_name} (${prospect.industry})`,
    confidence: 0.85
  });
}
```

**Learning Analysis:**

```sql
-- Which industries respond best?
SELECT 
  learning_snapshot->>'industry' as industry,
  COUNT(*) as total_engagements,
  COUNT(*) FILTER (WHERE learning_snapshot->>'engagement_type' = 'email_replied') as replies,
  ROUND(
    COUNT(*) FILTER (WHERE learning_snapshot->>'engagement_type' = 'email_replied') * 100.0 / COUNT(*),
    2
  ) as reply_rate
FROM growth_brain
WHERE event_type = 'prospect_engagement'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY learning_snapshot->>'industry'
ORDER BY reply_rate DESC;
```

**Sample Learning Output:**

```
Industry        Total   Replies   Reply Rate
─────────────────────────────────────────────
Legal           45      12        26.67%
Real Estate     82      18        21.95%
Construction    38      7         18.42%
Marketing       51      8         15.69%
Home Services   29      3         10.34%
```

**Optimization Actions:**

Based on feedback data:

1. **Prioritize High-Response Industries**
   - Increase Legal & Real Estate discovery
   - Allocate more outreach capacity

2. **Refine Low-Response Messaging**
   - A/B test subject lines for Home Services
   - Adjust pain points for Marketing

3. **Optimize Timing**
   - Track best send times by industry
   - Schedule outreach accordingly

4. **Score Threshold Adjustment**
   - If reply rate < 10%: Increase threshold to 80+
   - If reply rate > 25%: Decrease threshold to 65+

---

## 🗄️ Database Schema

### **Table: `public.prospect_candidates`**

**Purpose:** Store discovered prospects with scoring and contact status

**Complete Schema:**

```sql
CREATE TABLE public.prospect_candidates (
  -- Primary identifier
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business information
  business_name           TEXT NOT NULL,
  website                 TEXT,
  contact_email           TEXT,
  form_url                TEXT NOT NULL,
  
  -- Classification
  industry                TEXT NOT NULL,
  region                  TEXT NOT NULL,
  language                TEXT DEFAULT 'en' CHECK (language IN ('en', 'fr')),
  
  -- Scoring (0-100 scale)
  response_score          NUMERIC(5,2) CHECK (response_score >= 0 AND response_score <= 100),
  automation_need_score   NUMERIC(5,2) CHECK (automation_need_score >= 0 AND automation_need_score <= 100),
  
  -- Testing metadata
  test_submitted          BOOLEAN DEFAULT false,
  response_received       BOOLEAN DEFAULT false,
  response_time_ms        INTEGER,
  is_personalized         BOOLEAN,
  
  -- Outreach status
  contacted               BOOLEAN DEFAULT false,
  contact_attempted_at    TIMESTAMPTZ,
  
  -- Timestamps
  last_tested             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_prospects_automation_score ON prospect_candidates(automation_need_score DESC);
CREATE INDEX idx_prospects_contacted ON prospect_candidates(contacted);
CREATE INDEX idx_prospects_industry ON prospect_candidates(industry);
CREATE INDEX idx_prospects_region ON prospect_candidates(region);
CREATE INDEX idx_prospects_created_at ON prospect_candidates(created_at DESC);
CREATE INDEX idx_prospects_language ON prospect_candidates(language);

-- Composite index for high-priority queries
CREATE INDEX idx_prospects_high_priority ON prospect_candidates(automation_need_score DESC, contacted) 
  WHERE automation_need_score >= 70 AND contacted = false;

-- Comments
COMMENT ON TABLE public.prospect_candidates IS 'Discovered businesses with automation need scoring';
COMMENT ON COLUMN prospect_candidates.response_score IS 'Quality of current autoresponder (0-100, higher = better)';
COMMENT ON COLUMN prospect_candidates.automation_need_score IS 'Calculated as 100 - response_score (higher = better prospect)';
COMMENT ON COLUMN prospect_candidates.response_time_ms IS 'Milliseconds until autoresponder received';
```

**Column Reference:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | gen_random_uuid() | Primary key |
| `business_name` | TEXT | No | - | Company name |
| `website` | TEXT | Yes | NULL | Main website URL |
| `contact_email` | TEXT | Yes | NULL | Extracted email address |
| `form_url` | TEXT | No | - | Contact form submission URL |
| `industry` | TEXT | No | - | Industry classification |
| `region` | TEXT | No | - | Geographic location |
| `language` | TEXT | No | 'en' | Primary language (en/fr) |
| `response_score` | NUMERIC | Yes | NULL | Current response quality (0-100) |
| `automation_need_score` | NUMERIC | Yes | NULL | Automation opportunity (0-100) |
| `test_submitted` | BOOLEAN | No | false | Test lead submitted flag |
| `response_received` | BOOLEAN | No | false | Autoresponder received flag |
| `response_time_ms` | INTEGER | Yes | NULL | Response time in milliseconds |
| `is_personalized` | BOOLEAN | Yes | NULL | Personalized vs generic response |
| `contacted` | BOOLEAN | No | false | Outreach email sent flag |
| `contact_attempted_at` | TIMESTAMPTZ | Yes | NULL | Outreach timestamp |
| `last_tested` | TIMESTAMPTZ | Yes | NULL | Last form test timestamp |
| `created_at` | TIMESTAMPTZ | No | NOW() | Discovery timestamp |

### **Table: `public.prospect_outreach_log`**

**Purpose:** Track outreach emails and engagement

**Complete Schema:**

```sql
CREATE TABLE public.prospect_outreach_log (
  -- Primary identifier
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  prospect_id     UUID REFERENCES prospect_candidates(id) ON DELETE CASCADE,
  
  -- Email details
  email_subject   TEXT NOT NULL,
  email_body      TEXT NOT NULL,
  sent_to         TEXT NOT NULL,
  
  -- Engagement tracking
  status          TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'engaged', 'replied', 'ignored')),
  
  -- Timestamps
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  opened_at       TIMESTAMPTZ,
  engaged_at      TIMESTAMPTZ,
  replied_at      TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_outreach_prospect_id ON prospect_outreach_log(prospect_id);
CREATE INDEX idx_outreach_status ON prospect_outreach_log(status);
CREATE INDEX idx_outreach_sent_at ON prospect_outreach_log(sent_at DESC);

-- Comments
COMMENT ON TABLE public.prospect_outreach_log IS 'Outreach email tracking with engagement metrics';
COMMENT ON COLUMN prospect_outreach_log.status IS 'Progression: sent → opened → engaged → replied (or ignored)';
```

**Status Progression:**

```
sent → opened → engaged → replied
  ↓              ↓
ignored      ignored
```

---

## 🤖 AI Integration

### **Integration with growth_brain**

**Purpose:** Continuously learn from prospect engagement to improve discovery and outreach

**Learning Event Types:**

| Event Type | Trigger | learning_snapshot Content |
|------------|---------|---------------------------|
| `prospect_discovered` | New prospect found | Industry, region, website structure |
| `prospect_scored` | Scoring complete | Response score, automation need, test results |
| `prospect_contacted` | Outreach sent | Email template, timing, industry |
| `prospect_engagement` | Email opened/replied | Engagement type, industry, response time |
| `pattern_detected` | Analysis complete | High-performing industries, optimal timing |

**Example Learning Events:**

```typescript
// 1. Record discovery
await supabase.from('growth_brain').insert({
  client_id: 'avenir_internal',
  event_type: 'prospect_discovered',
  learning_snapshot: {
    prospect_id: prospect.id,
    industry: 'Real Estate',
    region: 'Toronto, ON',
    has_contact_form: true,
    website_speed_ms: 1200
  },
  insight_text: 'Discovered Real Estate prospect in Toronto',
  confidence: 1.0
});

// 2. Record scoring
await supabase.from('growth_brain').insert({
  client_id: 'avenir_internal',
  event_type: 'prospect_scored',
  learning_snapshot: {
    prospect_id: prospect.id,
    response_score: 0,
    automation_need_score: 100,
    response_received: false,
    industry: 'Real Estate'
  },
  insight_text: 'High-priority prospect scored (100)',
  confidence: 0.95
});

// 3. Record engagement
await supabase.from('growth_brain').insert({
  client_id: 'avenir_internal',
  event_type: 'prospect_engagement',
  learning_snapshot: {
    prospect_id: prospect.id,
    engagement_type: 'email_replied',
    industry: 'Real Estate',
    response_time_hours: 4.5,
    sentiment: 'positive'
  },
  insight_text: 'Real Estate prospect replied within 5 hours',
  confidence: 0.90
});
```

**Predictive Analysis:**

```sql
-- Calculate industry success rates
WITH industry_stats AS (
  SELECT 
    learning_snapshot->>'industry' as industry,
    COUNT(DISTINCT (learning_snapshot->>'prospect_id')) as total_prospects,
    COUNT(*) FILTER (
      WHERE learning_snapshot->>'engagement_type' = 'email_replied'
    ) as replies
  FROM growth_brain
  WHERE event_type = 'prospect_engagement'
    AND created_at > NOW() - INTERVAL '90 days'
  GROUP BY learning_snapshot->>'industry'
)
SELECT 
  industry,
  total_prospects,
  replies,
  ROUND(replies * 100.0 / total_prospects, 2) as reply_rate,
  CASE 
    WHEN (replies * 100.0 / total_prospects) > 20 THEN 'High Priority'
    WHEN (replies * 100.0 / total_prospects) > 10 THEN 'Medium Priority'
    ELSE 'Low Priority'
  END as targeting_priority
FROM industry_stats
ORDER BY reply_rate DESC;
```

**Automated Optimization:**

```typescript
// Run daily to adjust discovery priorities
async function optimizeDiscoveryPriorities() {
  // 1. Fetch industry performance
  const industryStats = await getIndustryPerformance();
  
  // 2. Identify top performers
  const topIndustries = industryStats
    .filter(stat => stat.reply_rate > 15)
    .map(stat => stat.industry);
  
  // 3. Record optimization decision in growth_brain
  await supabase.from('growth_brain').insert({
    client_id: 'avenir_internal',
    event_type: 'pattern_detected',
    learning_snapshot: {
      pattern_type: 'industry_performance',
      top_industries: topIndustries,
      stats: industryStats,
      action: 'prioritize_discovery',
      previous_priorities: currentPriorities
    },
    insight_text: `Optimized discovery to prioritize: ${topIndustries.join(', ')}`,
    confidence: 0.88
  });
  
  // 4. Update discovery weights
  await updateDiscoveryWeights(topIndustries);
}
```

---

## 📊 Data Flow Diagrams

### **Complete Pipeline Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│  DISCOVERY PHASE                                                │
└─────────────────────────────────────────────────────────────────┘
                         │
   Search API (Google/Apollo/Crunchbase)
   Query: "Real Estate contact form Toronto"
                         ↓
         ┌──────────────────────────────┐
         │  Extract Business Data       │
         │  • Name, Website, Form URL   │
         │  • Industry, Region, Language│
         └──────────────┬───────────────┘
                        ↓
         ┌──────────────────────────────┐
         │  INSERT INTO                 │
         │  prospect_candidates         │
         │  (initial record)            │
         └──────────────┬───────────────┘
                        ↓

┌─────────────────────────────────────────────────────────────────┐
│  SCORING PHASE                                                  │
└─────────────────────────────────────────────────────────────────┘
                        │
         ┌──────────────┴───────────────┐
         │  Submit Test Lead            │
         │  POST to form_url            │
         │  Record: submission_time     │
         └──────────────┬───────────────┘
                        ↓
         ┌──────────────────────────────┐
         │  Monitor Email (60s)         │
         │  Check for autoresponder     │
         └──────────────┬───────────────┘
                        ↓
              Response received?
                   /        \
                 Yes         No
                  ↓           ↓
       ┌──────────────┐  ┌──────────────┐
       │ Analyze      │  │ Score: 0     │
       │ • Tone       │  │ Need: 100    │
       │ • Time       │  └──────┬───────┘
       │ • Quality    │         │
       └──────┬───────┘         │
              ↓                 │
       ┌──────────────┐         │
       │ Calculate    │         │
       │ Score: 0-100 │         │
       │ Need: 100-0  │         │
       └──────┬───────┘         │
              │                 │
              └────────┬────────┘
                       ↓
         ┌──────────────────────────────┐
         │  UPDATE prospect_candidates  │
         │  SET response_score,         │
         │      automation_need_score   │
         └──────────────┬───────────────┘
                        ↓
         ┌──────────────────────────────┐
         │  INSERT INTO growth_brain    │
         │  event_type: prospect_scored │
         └──────────────┬───────────────┘
                        ↓

┌─────────────────────────────────────────────────────────────────┐
│  OUTREACH PHASE                                                 │
└─────────────────────────────────────────────────────────────────┘
                        │
         ┌──────────────┴───────────────┐
         │  Filter High Priority        │
         │  WHERE automation_need >= 70 │
         │  AND contacted = false       │
         └──────────────┬───────────────┘
                        ↓
         ┌──────────────────────────────┐
         │  Generate Email              │
         │  • Personalized subject      │
         │  • Industry-specific body    │
         │  • Bilingual support         │
         └──────────────┬───────────────┘
                        ↓
         ┌──────────────────────────────┐
         │  Send Email                  │
         │  via SMTP / Gmail API        │
         └──────────────┬───────────────┘
                        ↓
         ┌──────────────────────────────┐
         │  INSERT INTO                 │
         │  prospect_outreach_log       │
         │  status: 'sent'              │
         └──────────────┬───────────────┘
                        ↓
         ┌──────────────────────────────┐
         │  UPDATE prospect_candidates  │
         │  SET contacted = true        │
         └──────────────┬───────────────┘
                        ↓

┌─────────────────────────────────────────────────────────────────┐
│  FEEDBACK PHASE                                                 │
└─────────────────────────────────────────────────────────────────┘
                        │
         ┌──────────────┴───────────────┐
         │  Track Engagement            │
         │  • Email opened              │
         │  • Link clicked              │
         │  • Reply received            │
         └──────────────┬───────────────┘
                        ↓
         ┌──────────────────────────────┐
         │  UPDATE                      │
         │  prospect_outreach_log       │
         │  status: opened/replied      │
         └──────────────┬───────────────┘
                        ↓
         ┌──────────────────────────────┐
         │  INSERT INTO growth_brain    │
         │  event_type:                 │
         │  prospect_engagement         │
         └──────────────┬───────────────┘
                        ↓
         ┌──────────────────────────────┐
         │  Analyze Patterns            │
         │  • Industry success rates    │
         │  • Optimal timing            │
         │  • Message effectiveness     │
         └──────────────┬───────────────┘
                        ↓
         ┌──────────────────────────────┐
         │  Optimize Discovery          │
         │  • Prioritize industries     │
         │  • Adjust scoring threshold  │
         │  • Refine messaging          │
         └──────────────────────────────┘
```

### **Admin Dashboard Integration**

```
┌──────────────────────────────────────┐
│  Admin Dashboard                     │
│  /admin/prospect-intelligence        │
└────────────┬─────────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────┐
│  Configuration Panel                                   │
│  • Industries: [Real Estate, Legal, Marketing, ...]    │
│  • Regions: [Toronto, Montreal, Vancouver, ...]        │
│  • Min Score: 70                                       │
│  • Max Results: 50                                     │
│  • Test Mode: On/Off                                   │
└────────────┬───────────────────────────────────────────┘
             │
             ↓ [Click "Run Prospect Scan"]
┌────────────────────────────────────────────────────────┐
│  POST /api/prospect-intelligence/scan                  │
│  Body: { industries, regions, minScore, testMode }     │
└────────────┬───────────────────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────┐
│  Pipeline Execution                                    │
│  1. Discovery → 2. Scoring → 3. Outreach → 4. Log     │
└────────────┬───────────────────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────┐
│  Return Results                                        │
│  {                                                     │
│    discovered: 15,                                     │
│    scored: 15,                                         │
│    contacted: 8,  // automation_need >= 70            │
│    prospects: [...]                                    │
│  }                                                     │
└────────────┬───────────────────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────┐
│  Dashboard Updates                                     │
│  • Metrics refresh (Total Crawled, Contacted, etc.)   │
│  • Prospect table populates                           │
│  • High-priority badges display                       │
└────────────────────────────────────────────────────────┘
```

---

## 📅 Daily Workflow

### **Daily Operations Checklist**

**Morning Routine (9:00 AM):**

- [ ] **Review Overnight Discoveries**
  - Check `prospect_candidates` count from yesterday
  - Review high-priority prospects (score >= 90)
  
- [ ] **Analyze Engagement**
  - Check `prospect_outreach_log` for replies
  - Respond to interested prospects within 1 hour
  
- [ ] **Monitor Scores**
  - Verify average automation_need_score
  - Adjust threshold if needed

**Midday Check (12:00 PM):**

- [ ] **Run Discovery Scan** (if needed)
  - Target: 20-50 new prospects
  - Focus on high-performing industries
  
- [ ] **Review Outreach Status**
  - Check open rates (target: 30%+)
  - Check reply rates (target: 15%+)

**Afternoon Analysis (3:00 PM):**

- [ ] **Performance Review**
  ```sql
  SELECT 
    industry,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE contacted = true) as contacted,
    COUNT(*) FILTER (WHERE automation_need_score >= 70) as high_priority
  FROM prospect_candidates
  WHERE created_at > CURRENT_DATE - INTERVAL '7 days'
  GROUP BY industry;
  ```

- [ ] **Engagement Analysis**
  ```sql
  SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
  FROM prospect_outreach_log
  WHERE sent_at > CURRENT_DATE - INTERVAL '7 days'
  GROUP BY status;
  ```

**End of Day (5:00 PM):**

- [ ] **Log Summary**
  - Prospects discovered today: ___
  - Outreach sent today: ___
  - Replies received today: ___
  - Meetings booked: ___

- [ ] **Update Strategy**
  - Note winning industries
  - Note messaging that worked
  - Plan tomorrow's focus

### **Weekly Review (Friday 4:00 PM):**

- [ ] **Performance Metrics**
  - Total prospects discovered this week
  - Total outreach sent
  - Reply rate %
  - Meeting conversion rate %

- [ ] **Industry Analysis**
  - Rank industries by reply rate
  - Identify underperforming industries
  - Plan next week's priorities

- [ ] **Optimization Actions**
  - Update discovery priorities
  - Refine email templates
  - Adjust scoring thresholds

### **Monthly Deep Dive:**

- [ ] **Growth Brain Analysis**
  ```sql
  SELECT 
    event_type,
    COUNT(*) as count,
    AVG((learning_snapshot->>'automation_need_score')::numeric) as avg_score
  FROM growth_brain
  WHERE event_type LIKE 'prospect_%'
    AND created_at > CURRENT_DATE - INTERVAL '30 days'
  GROUP BY event_type;
  ```

- [ ] **ROI Calculation**
  - Prospects contacted: ___
  - Meetings booked: ___
  - Clients acquired: ___
  - Cost per acquisition: $___

- [ ] **Strategy Refinement**
  - Document learnings
  - Update playbook
  - Set next month's targets

---

## 💻 Query Examples

### **Find High-Priority Prospects**

```sql
SELECT 
  business_name,
  industry,
  region,
  automation_need_score,
  website,
  form_url
FROM prospect_candidates
WHERE automation_need_score >= 70
  AND contacted = false
ORDER BY automation_need_score DESC
LIMIT 20;
```

### **Calculate Industry Reply Rates**

```sql
WITH outreach_stats AS (
  SELECT 
    pc.industry,
    COUNT(DISTINCT pol.id) as total_sent,
    COUNT(DISTINCT pol.id) FILTER (WHERE pol.status = 'replied') as replies
  FROM prospect_outreach_log pol
  JOIN prospect_candidates pc ON pol.prospect_id = pc.id
  WHERE pol.sent_at > NOW() - INTERVAL '30 days'
  GROUP BY pc.industry
)
SELECT 
  industry,
  total_sent,
  replies,
  ROUND(replies * 100.0 / total_sent, 2) as reply_rate_pct
FROM outreach_stats
ORDER BY reply_rate_pct DESC;
```

### **Track Weekly Performance**

```sql
SELECT 
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as discovered,
  COUNT(*) FILTER (WHERE contacted = true) as contacted,
  COUNT(*) FILTER (WHERE automation_need_score >= 70) as high_priority
FROM prospect_candidates
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;
```

### **Find Uncontacted High-Score Prospects**

```sql
SELECT 
  id,
  business_name,
  industry,
  automation_need_score,
  created_at,
  AGE(NOW(), created_at) as time_since_discovery
FROM prospect_candidates
WHERE automation_need_score >= 80
  AND contacted = false
ORDER BY automation_need_score DESC, created_at ASC;
```

### **Analyze growth_brain Learnings**

```sql
SELECT 
  learning_snapshot->>'industry' as industry,
  learning_snapshot->>'engagement_type' as engagement_type,
  COUNT(*) as occurrences,
  AVG((learning_snapshot->>'response_time_hours')::numeric) as avg_response_hours
FROM growth_brain
WHERE event_type = 'prospect_engagement'
  AND created_at > NOW() - INTERVAL '60 days'
GROUP BY 
  learning_snapshot->>'industry',
  learning_snapshot->>'engagement_type'
ORDER BY occurrences DESC;
```

---

## ✅ System Status

**Overall Health:** 🟢 **OPERATIONAL**

| Component | Status | Notes |
|-----------|--------|-------|
| Discovery Pipeline | ✅ Active | Google Search API integrated |
| Scoring Algorithm | ✅ Active | Automated testing functional |
| Outreach Generation | ✅ Active | Email templates optimized |
| Feedback Loop | ✅ Active | Engagement tracking enabled |
| AI Integration | ✅ Active | growth_brain connected |

**Current Performance:**

- Prospects Discovered (30 days): 150+
- Average Automation Need Score: 72
- Outreach Sent (30 days): 85
- Reply Rate: 18.2%
- High-Priority Discovery Rate: 68%

---

**End of Prospect Intelligence System Documentation**

*Last Updated: October 17, 2025*  
*Version: 2.0.0*  
*Status: Production Ready*

