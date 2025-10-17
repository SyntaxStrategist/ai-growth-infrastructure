# 🗄️ Avenir AI Solutions — Supabase Schema Reference

**Version:** 2.0.0  
**Last Updated:** October 17, 2025  
**Database:** PostgreSQL 15 (Supabase)  

---

## 📋 Table of Contents

1. [Schema Overview](#schema-overview)
2. [Core Tables](#core-tables)
3. [Relationships & Foreign Keys](#relationships--foreign-keys)
4. [Indexes & Performance](#indexes--performance)
5. [Row Level Security (RLS)](#row-level-security-rls)
6. [Data Types Reference](#data-types-reference)
7. [Migration Scripts](#migration-scripts)

---

## 📊 Schema Overview

### **Database: `public`**

**Total Tables:** 8

| Table | Purpose | Row Count (Est.) | Primary Use |
|-------|---------|------------------|-------------|
| `clients` | Client accounts & settings | 100-1,000 | Authentication, API keys |
| `lead_memory` | Enriched leads | 10,000-100,000 | Lead storage, AI data |
| `lead_actions` | Lead history | 50,000-500,000 | Activity tracking |
| `prospect_candidates` | Discovered prospects | 1,000-10,000 | Outreach targets |
| `growth_brain` | AI learning & analytics | 1,000-10,000 | Intelligence engine |
| `prospect_outreach_log` | Outreach tracking | 5,000-50,000 | Email logs |
| `api_key_rotation_log` | Security audit | 100-1,000 | Key rotation history |
| `relationship_insights` | Deprecated/Legacy | 0 | (Use growth_brain instead) |

---

## 🗂️ Core Tables

### **1. Table: `public.clients`**

**Purpose:** Client accounts with personalization and SMTP settings

**Complete Schema:**

```sql
CREATE TABLE public.clients (
  -- Primary identifiers
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             UUID UNIQUE NOT NULL,
  
  -- Account information
  business_name         TEXT NOT NULL,
  contact_name          TEXT,
  name                  TEXT,
  email                 TEXT UNIQUE NOT NULL,
  password_hash         TEXT NOT NULL,
  api_key               TEXT UNIQUE NOT NULL,
  language              TEXT DEFAULT 'en' CHECK (language IN ('en', 'fr')),
  
  -- Flags
  is_internal           BOOLEAN DEFAULT false,
  is_test               BOOLEAN DEFAULT false,
  
  -- Personalization fields
  industry_category     TEXT,
  primary_service       TEXT,
  booking_link          TEXT,
  custom_tagline        TEXT,
  email_tone            TEXT DEFAULT 'Friendly' CHECK (email_tone IN ('Friendly', 'Professional', 'Formal', 'Energetic')),
  followup_speed        TEXT DEFAULT 'Instant' CHECK (followup_speed IN ('Instant', 'Within 1 hour', 'Same day')),
  ai_personalized_reply BOOLEAN DEFAULT true,
  
  -- SMTP configuration (optional, for sending from client's domain)
  outbound_email        TEXT,
  smtp_host             TEXT,
  smtp_port             INTEGER,
  smtp_username         TEXT,
  smtp_password         TEXT,
  
  -- Timestamps
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  last_login            TIMESTAMPTZ,
  last_connection       TIMESTAMPTZ,
  last_rotated          TIMESTAMPTZ
);

-- Indexes
CREATE UNIQUE INDEX idx_clients_email ON clients(email);
CREATE UNIQUE INDEX idx_clients_api_key ON clients(api_key);
CREATE UNIQUE INDEX idx_clients_client_id ON clients(client_id);
CREATE INDEX idx_clients_is_test ON clients(is_test);
CREATE INDEX idx_clients_is_internal ON clients(is_internal);
CREATE INDEX idx_clients_created_at ON clients(created_at DESC);

-- Comments
COMMENT ON TABLE public.clients IS 'Client accounts with personalization settings and API credentials';
COMMENT ON COLUMN clients.client_id IS 'Unique client identifier used in all foreign key relationships';
COMMENT ON COLUMN clients.api_key IS 'Authentication token for lead submission API';
COMMENT ON COLUMN clients.is_test IS 'Auto-detected from email containing "test" or "example.com"';
COMMENT ON COLUMN clients.is_internal IS 'Flag for Avenir AI internal client (UUID: 00000000-0000-0000-0000-000000000001)';
```

**Key Columns Explained:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | gen_random_uuid() | Internal database ID |
| `client_id` | UUID | No | - | Unique client identifier (used in all relationships) |
| `business_name` | TEXT | No | - | Company name displayed in emails and dashboard |
| `email` | TEXT | No | - | Login email (unique constraint) |
| `api_key` | TEXT | No | - | Authentication token for `/api/lead` (generated via crypto) |
| `password_hash` | TEXT | No | - | bcryptjs hashed password |
| `language` | TEXT | No | 'en' | Preferred language (en/fr) |
| `industry_category` | TEXT | Yes | NULL | Industry (Real Estate, Marketing, Construction, etc.) |
| `primary_service` | TEXT | Yes | NULL | Main service offered |
| `email_tone` | TEXT | No | 'Friendly' | Email tone (Friendly, Professional, Formal, Energetic) |
| `followup_speed` | TEXT | No | 'Instant' | Response time preference |
| `booking_link` | TEXT | Yes | NULL | Calendly or booking URL for email CTAs |
| `custom_tagline` | TEXT | Yes | NULL | Email signature tagline |
| `is_test` | BOOLEAN | No | false | Auto-detected test data flag |
| `is_internal` | BOOLEAN | No | false | Flag for Avenir's internal client |

**Special Records:**

```sql
-- Avenir AI Solutions (Internal Client)
INSERT INTO clients (
  client_id,
  business_name,
  email,
  is_internal
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Avenir AI Solutions',
  'internal@aveniraisolutions.ca',
  true
);
```

---

### **2. Table: `public.lead_memory`**

**Purpose:** Core lead storage with AI enrichment data

**Complete Schema:**

```sql
CREATE TABLE public.lead_memory (
  -- Primary identifiers
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 TEXT NOT NULL,
  
  -- Lead information
  name                  TEXT NOT NULL,
  message               TEXT,
  language              TEXT DEFAULT 'en',
  
  -- AI enrichment
  ai_summary            TEXT,
  intent                TEXT,
  tone                  TEXT,
  urgency               TEXT,
  confidence_score      NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- Relationships
  client_id             UUID REFERENCES clients(client_id) ON DELETE CASCADE,
  
  -- Status
  current_tag           TEXT DEFAULT 'Active',
  archived              BOOLEAN DEFAULT false,
  deleted               BOOLEAN DEFAULT false,
  is_test               BOOLEAN DEFAULT false,
  
  -- Historical tracking (JSONB arrays)
  tone_history          JSONB DEFAULT '[]'::jsonb,
  urgency_history       JSONB DEFAULT '[]'::jsonb,
  confidence_history    JSONB DEFAULT '[]'::jsonb,
  
  -- Additional AI analysis
  relationship_insight  TEXT,
  
  -- Timestamps
  timestamp             TIMESTAMPTZ DEFAULT NOW(),
  last_updated          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lead_memory_client_id ON lead_memory(client_id);
CREATE INDEX idx_lead_memory_email ON lead_memory(email);
CREATE INDEX idx_lead_memory_is_test ON lead_memory(is_test);
CREATE INDEX idx_lead_memory_current_tag ON lead_memory(current_tag);
CREATE INDEX idx_lead_memory_timestamp ON lead_memory(timestamp DESC);
CREATE INDEX idx_lead_memory_urgency ON lead_memory(urgency);
CREATE INDEX idx_lead_memory_archived ON lead_memory(archived) WHERE archived = false;
CREATE INDEX idx_lead_memory_deleted ON lead_memory(deleted) WHERE deleted = false;

-- Composite index for dashboard queries
CREATE INDEX idx_lead_memory_client_active ON lead_memory(client_id, current_tag, is_test, timestamp DESC);

-- Comments
COMMENT ON TABLE public.lead_memory IS 'Core lead storage with AI enrichment and historical tracking';
COMMENT ON COLUMN lead_memory.confidence_score IS 'AI confidence that lead is qualified (0.0 to 1.0)';
COMMENT ON COLUMN lead_memory.tone_history IS 'Array of {value, timestamp} objects tracking tone changes';
```

**Current Tag Values:**

- `Active` - New or actively being pursued
- `Follow-Up` - Requires follow-up action
- `Converted` - Successfully converted to customer
- `Archived` - Archived for later review
- `Deleted` - Soft-deleted (not permanently removed)

**History Format:**

```json
// tone_history, urgency_history, confidence_history
[
  { "value": "Professional", "timestamp": "2025-10-15T10:30:00Z" },
  { "value": "Urgent", "timestamp": "2025-10-16T14:20:00Z" },
  { "value": "Friendly", "timestamp": "2025-10-17T09:15:00Z" }
]
```

---

### **3. Table: `public.lead_actions`**

**Purpose:** Lead activity history and tagging events

**Complete Schema:**

```sql
CREATE TABLE public.lead_actions (
  -- Primary identifier
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  lead_id               UUID REFERENCES lead_memory(id) ON DELETE CASCADE,
  client_id             UUID REFERENCES clients(client_id) ON DELETE CASCADE,
  
  -- Action details
  action_type           TEXT NOT NULL,
  tag                   TEXT,
  conversion_outcome    BOOLEAN DEFAULT false,
  reversion_reason      TEXT,
  
  -- Metadata
  is_test               BOOLEAN DEFAULT false,
  timestamp             TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lead_actions_lead_id ON lead_actions(lead_id);
CREATE INDEX idx_lead_actions_client_id ON lead_actions(client_id);
CREATE INDEX idx_lead_actions_timestamp ON lead_actions(timestamp DESC);
CREATE INDEX idx_lead_actions_action_type ON lead_actions(action_type);
CREATE INDEX idx_lead_actions_conversion ON lead_actions(conversion_outcome) WHERE conversion_outcome = true;

-- Comments
COMMENT ON TABLE public.lead_actions IS 'Complete activity history for all lead interactions';
COMMENT ON COLUMN lead_actions.action_type IS 'insert, update, tag, archive, delete, revert';
COMMENT ON COLUMN lead_actions.reversion_reason IS 'Reason for reverting a converted lead back to active';
```

**Action Types:**

| Type | Description | Sets conversion_outcome |
|------|-------------|------------------------|
| `insert` | Lead created | false |
| `update` | Lead modified | false |
| `tag` | Tag applied | false (unless tag='Converted') |
| `archive` | Lead archived | false |
| `delete` | Lead deleted | false |
| `revert` | Converted → Active | false (reverses conversion) |

---

### **4. Table: `public.prospect_candidates`**

**Purpose:** Discovered prospects for outreach

**Complete Schema:**

```sql
CREATE TABLE public.prospect_candidates (
  -- Primary identifier
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business information
  business_name           TEXT NOT NULL,
  website                 TEXT,
  contact_email           TEXT,
  form_url                TEXT,
  industry                TEXT,
  region                  TEXT,
  language                TEXT DEFAULT 'en',
  
  -- Scoring
  response_score          NUMERIC(5,2) CHECK (response_score >= 0 AND response_score <= 100),
  automation_need_score   NUMERIC(5,2) CHECK (automation_need_score >= 0 AND automation_need_score <= 100),
  
  -- Status
  contacted               BOOLEAN DEFAULT false,
  
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

-- Comments
COMMENT ON TABLE public.prospect_candidates IS 'Businesses discovered through prospect intelligence pipeline';
COMMENT ON COLUMN prospect_candidates.response_score IS 'Quality of current autoresponder (0-100, higher = better)';
COMMENT ON COLUMN prospect_candidates.automation_need_score IS 'Inverse of response_score (100 = highest need for automation)';
```

**Scoring Algorithm:**

```
response_score = 
  (hasAutoresponder ? 50 : 0) +
  (responseTime < 1s ? 30 : responseTime < 5s ? 15 : 0) +
  (isPersonalized ? 20 : isGeneric ? 10 : 0)

automation_need_score = 100 - response_score

High Priority: automation_need_score >= 70
```

---

### **5. Table: `public.growth_brain`**

**Purpose:** AI learning snapshots, growth analytics, and feedback loop

**Complete Schema:**

```sql
CREATE TABLE public.growth_brain (
  -- Primary identifier
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  client_id           UUID REFERENCES clients(client_id) ON DELETE CASCADE,
  
  -- Event classification
  event_type          TEXT NOT NULL,
  
  -- AI learning data (flexible JSONB structure)
  learning_snapshot   JSONB,
  
  -- Human-readable insight
  insight_text        TEXT,
  
  -- Confidence in this insight/prediction
  confidence          NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Timestamp
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_growth_brain_client_id ON growth_brain(client_id);
CREATE INDEX idx_growth_brain_event_type ON growth_brain(event_type);
CREATE INDEX idx_growth_brain_created_at ON growth_brain(created_at DESC);
CREATE INDEX idx_growth_brain_confidence ON growth_brain(confidence DESC);

-- GIN index for JSONB queries
CREATE INDEX idx_growth_brain_snapshot ON growth_brain USING GIN (learning_snapshot);

-- Comments
COMMENT ON TABLE public.growth_brain IS 'AI learning snapshots and growth analytics with feedback loop';
COMMENT ON COLUMN growth_brain.event_type IS 'conversion, reversion, pattern_detected, engagement_score, urgency_trend, tone_distribution, conversion_prediction';
COMMENT ON COLUMN growth_brain.learning_snapshot IS 'Flexible JSONB containing patterns, metrics, predictions';
COMMENT ON COLUMN growth_brain.insight_text IS 'Human-readable insight for dashboard display';
```

**Event Types:**

| Event Type | Description | Triggered By | learning_snapshot Example |
|------------|-------------|--------------|---------------------------|
| `conversion` | Lead converted to customer | Tag change to "Converted" | `{"lead_id": "...", "conversion_value": 5000, "days_to_convert": 7}` |
| `reversion` | Converted lead reverted | Revert modal action | `{"reason": "Placed in converted by accident", "previous_tag": "Converted"}` |
| `pattern_detected` | New behavioral pattern | Intelligence engine | `{"pattern": "urgency_increasing", "confidence": 0.89, "affected_leads": 23}` |
| `engagement_score` | Overall engagement level | Daily cron job | `{"score": 87, "trend": "increasing", "top_sources": ["organic", "referral"]}` |
| `urgency_trend` | Urgency pattern over time | Intelligence engine | `{"high_urgency_pct": 0.34, "trend": "stable"}` |
| `tone_distribution` | Tone analysis | Intelligence engine | `{"professional": 0.45, "friendly": 0.35, "urgent": 0.20}` |
| `conversion_prediction` | Future conversion likelihood | Predictive model | `{"predicted_conversions": 12, "next_30_days": true, "confidence": 0.78}` |

**learning_snapshot Structure Examples:**

```json
// Conversion Event
{
  "lead_id": "a1b2c3d4-...",
  "lead_name": "Sarah Chen",
  "conversion_value": 5000,
  "days_to_convert": 7,
  "touch_points": 3,
  "initial_urgency": "High",
  "final_tag": "Converted"
}

// Pattern Detection Event
{
  "pattern_type": "urgency_increasing",
  "affected_leads": 23,
  "time_period": "last_7_days",
  "confidence": 0.89,
  "recommendation": "Increase follow-up frequency",
  "data_points": [
    {"date": "2025-10-10", "avg_urgency": "Medium"},
    {"date": "2025-10-17", "avg_urgency": "High"}
  ]
}

// Engagement Score Event
{
  "overall_score": 87,
  "trend": "increasing",
  "period": "last_30_days",
  "metrics": {
    "total_leads": 150,
    "active_leads": 120,
    "avg_confidence": 0.85,
    "high_urgency_pct": 0.34
  },
  "top_sources": ["organic_search", "referral", "paid_ads"],
  "top_industries": ["Real Estate", "Legal", "Marketing"]
}

// Conversion Prediction Event
{
  "predicted_conversions": 12,
  "prediction_window": "next_30_days",
  "confidence": 0.78,
  "high_value_leads": [
    {"lead_id": "...", "probability": 0.92, "estimated_value": 3000},
    {"lead_id": "...", "probability": 0.88, "estimated_value": 4500}
  ],
  "recommended_actions": [
    "Follow up with leads tagged 'Follow-Up'",
    "Focus on high-confidence leads (>0.85)"
  ]
}
```

**Usage in AI Feedback Loop:**

```typescript
// When a lead is converted
async function onLeadConverted(lead, client_id) {
  // 1. Calculate conversion metrics
  const daysToConvert = calculateDays(lead.timestamp, Date.now());
  const touchPoints = await countTouchPoints(lead.id);
  
  // 2. Record learning snapshot
  await supabase.from('growth_brain').insert({
    client_id,
    event_type: 'conversion',
    learning_snapshot: {
      lead_id: lead.id,
      lead_name: lead.name,
      initial_urgency: lead.urgency,
      initial_tone: lead.tone,
      days_to_convert: daysToConvert,
      touch_points: touchPoints,
      conversion_value: estimatedValue
    },
    insight_text: `Lead "${lead.name}" converted in ${daysToConvert} days with ${touchPoints} touch points`,
    confidence: 0.95
  });
  
  // 3. Intelligence engine learns from this
  // Future predictions will consider this pattern
}

// When generating predictions
async function predictConversions(client_id) {
  // 1. Fetch historical conversions
  const { data: conversions } = await supabase
    .from('growth_brain')
    .select('learning_snapshot')
    .eq('client_id', client_id)
    .eq('event_type', 'conversion')
    .order('created_at', { ascending: false })
    .limit(100);
  
  // 2. Analyze patterns
  const avgDaysToConvert = calculateAverage(
    conversions.map(c => c.learning_snapshot.days_to_convert)
  );
  
  const successfulUrgencyPattern = getMostCommon(
    conversions.map(c => c.learning_snapshot.initial_urgency)
  );
  
  // 3. Generate prediction
  const prediction = {
    predicted_conversions: estimateConversions(activeLeads, avgDaysToConvert),
    confidence: 0.78,
    based_on: conversions.length + ' historical conversions'
  };
  
  // 4. Save prediction to growth_brain
  await supabase.from('growth_brain').insert({
    client_id,
    event_type: 'conversion_prediction',
    learning_snapshot: prediction,
    insight_text: `Predicted ${prediction.predicted_conversions} conversions in next 30 days`,
    confidence: prediction.confidence
  });
}
```

---

### **6. Table: `public.lead_actions`**

**Purpose:** Complete activity history for all lead interactions

**Complete Schema:**

```sql
CREATE TABLE public.lead_actions (
  -- Primary identifier
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  lead_id               UUID REFERENCES lead_memory(id) ON DELETE CASCADE,
  client_id             UUID REFERENCES clients(client_id) ON DELETE CASCADE,
  
  -- Action details
  action_type           TEXT NOT NULL CHECK (action_type IN ('insert', 'update', 'tag', 'archive', 'delete', 'revert')),
  tag                   TEXT,
  
  -- Conversion tracking
  conversion_outcome    BOOLEAN DEFAULT false,
  reversion_reason      TEXT,
  
  -- Metadata
  is_test               BOOLEAN DEFAULT false,
  timestamp             TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lead_actions_lead_id ON lead_actions(lead_id);
CREATE INDEX idx_lead_actions_client_id ON lead_actions(client_id);
CREATE INDEX idx_lead_actions_timestamp ON lead_actions(timestamp DESC);
CREATE INDEX idx_lead_actions_action_type ON lead_actions(action_type);
CREATE INDEX idx_lead_actions_conversion ON lead_actions(conversion_outcome) WHERE conversion_outcome = true;
CREATE INDEX idx_lead_actions_tag ON lead_actions(tag);

-- Composite index for timeline queries
CREATE INDEX idx_lead_actions_client_timeline ON lead_actions(client_id, timestamp DESC);

-- Comments
COMMENT ON TABLE public.lead_actions IS 'Immutable audit log of all lead state changes and actions';
COMMENT ON COLUMN lead_actions.conversion_outcome IS 'Set to true when tag changes to "Converted"';
COMMENT ON COLUMN lead_actions.reversion_reason IS 'User-provided reason when reverting a converted lead';
```

**Action Flow Example:**

```sql
-- Lead created
INSERT INTO lead_actions (lead_id, client_id, action_type, tag)
VALUES ('lead-123', 'client-abc', 'insert', 'Active');

-- Lead tagged as Follow-Up
INSERT INTO lead_actions (lead_id, client_id, action_type, tag)
VALUES ('lead-123', 'client-abc', 'tag', 'Follow-Up');

-- Lead converted
INSERT INTO lead_actions (lead_id, client_id, action_type, tag, conversion_outcome)
VALUES ('lead-123', 'client-abc', 'tag', 'Converted', true);

-- Lead reverted (with reason)
INSERT INTO lead_actions (lead_id, client_id, action_type, tag, conversion_outcome, reversion_reason)
VALUES ('lead-123', 'client-abc', 'revert', 'Active', false, 'Placed in converted by accident');
```

---

### **7. Table: `public.prospect_candidates`**

**Purpose:** Businesses discovered through autonomous prospect intelligence pipeline

**Complete Schema:**

```sql
CREATE TABLE public.prospect_candidates (
  -- Primary identifier
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business information
  business_name           TEXT NOT NULL,
  website                 TEXT,
  contact_email           TEXT,
  form_url                TEXT,
  
  -- Classification
  industry                TEXT,
  region                  TEXT,
  language                TEXT DEFAULT 'en',
  
  -- Scoring (0-100 scale)
  response_score          NUMERIC(5,2) CHECK (response_score >= 0 AND response_score <= 100),
  automation_need_score   NUMERIC(5,2) CHECK (automation_need_score >= 0 AND automation_need_score <= 100),
  
  -- Status
  contacted               BOOLEAN DEFAULT false,
  
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

-- Composite index for high-priority queries
CREATE INDEX idx_prospects_high_priority ON prospect_candidates(automation_need_score DESC, contacted) 
  WHERE automation_need_score >= 70;

-- Comments
COMMENT ON TABLE public.prospect_candidates IS 'Businesses discovered via crawler with automation need scoring';
COMMENT ON COLUMN prospect_candidates.automation_need_score IS 'Calculated as 100 - response_score (higher = better prospect)';
```

---

### **8. Table: `public.prospect_outreach_log`**

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
  
  -- Engagement tracking
  status          TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'replied', 'ignored')),
  
  -- Timestamps
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  opened_at       TIMESTAMPTZ,
  replied_at      TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_outreach_prospect_id ON prospect_outreach_log(prospect_id);
CREATE INDEX idx_outreach_status ON prospect_outreach_log(status);
CREATE INDEX idx_outreach_sent_at ON prospect_outreach_log(sent_at DESC);

-- Comments
COMMENT ON TABLE public.prospect_outreach_log IS 'Outreach email tracking with engagement metrics';
COMMENT ON COLUMN prospect_outreach_log.status IS 'Progression: sent → opened → replied (or ignored)';
```

---

## 🔗 Relationships & Foreign Keys

### **Entity Relationship Diagram**

```
┌─────────────────────────────────────────────────────────┐
│                      clients                            │
│                   (client_id PK)                        │
└───────────┬─────────────────────────────────────────────┘
            │
            │ 1:N relationships
            │
    ┌───────┴────────┬──────────────────┐
    │                │                  │
    ▼                ▼                  ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│lead_memory  │  │growth_brain │  │(settings in │
│(client_id)  │  │(client_id)  │  │ clients row)│
└──────┬──────┘  └─────────────┘  └─────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐
│lead_actions │
│ (lead_id)   │
│(client_id)  │
└─────────────┘

┌──────────────────┐
│prospect_candidates│ (Independent)
│     (id PK)       │
└────────┬──────────┘
         │ 1:N
         ▼
┌──────────────────┐
│prospect_outreach │
│  (prospect_id)   │
└──────────────────┘
```

### **Foreign Key Constraints**

| Table | Column | References | On Delete |
|-------|--------|------------|-----------|
| `lead_memory` | `client_id` | `clients(client_id)` | CASCADE |
| `lead_actions` | `lead_id` | `lead_memory(id)` | CASCADE |
| `lead_actions` | `client_id` | `clients(client_id)` | CASCADE |
| `growth_brain` | `client_id` | `clients(client_id)` | CASCADE |
| `prospect_outreach_log` | `prospect_id` | `prospect_candidates(id)` | CASCADE |

**Cascade Behavior:**

```sql
-- When a client is deleted:
DELETE FROM clients WHERE client_id = '550e8400-...';

-- Automatically deletes:
-- • All lead_memory rows for this client
-- • All lead_actions rows for this client
-- • All growth_brain rows for this client
-- (Cascade through foreign keys)
```

---

## ⚡ Indexes & Performance

### **Index Strategy**

**Primary Indexes (Auto-created):**
- All `id` columns (PRIMARY KEY → B-tree index)
- All `UNIQUE` constraints (`email`, `api_key`, `client_id`)

**Query Optimization Indexes:**

| Table | Index | Purpose | Type |
|-------|-------|---------|------|
| `clients` | `idx_clients_is_test` | Filter test data | B-tree |
| `clients` | `idx_clients_created_at` | Sort by signup date | B-tree DESC |
| `lead_memory` | `idx_lead_memory_client_active` | Dashboard queries | Composite |
| `lead_memory` | `idx_lead_memory_timestamp` | Sort by date | B-tree DESC |
| `lead_actions` | `idx_lead_actions_client_timeline` | Activity timeline | Composite |
| `growth_brain` | `idx_growth_brain_snapshot` | JSON queries | GIN |
| `prospect_candidates` | `idx_prospects_high_priority` | Filter score >= 70 | Partial |

**Composite Index Example:**

```sql
-- Optimized for: Fetch active leads for client, exclude test data, sort by date
CREATE INDEX idx_lead_memory_client_active 
ON lead_memory(client_id, current_tag, is_test, timestamp DESC);

-- Query that uses this index:
SELECT * FROM lead_memory
WHERE client_id = '550e8400-...'
  AND current_tag = 'Active'
  AND is_test = false
ORDER BY timestamp DESC;
-- Uses: idx_lead_memory_client_active (index-only scan)
```

**Partial Index Example:**

```sql
-- Only index prospects with high automation need
CREATE INDEX idx_prospects_high_priority 
ON prospect_candidates(automation_need_score DESC, contacted) 
WHERE automation_need_score >= 70;

-- Saves space and improves query speed for common filter
```

---

## 🔒 Row Level Security (RLS)

### **RLS Overview**

**Current Status:** RLS not enforced (relies on application-level filtering)

**Recommended Policies:**

```sql
-- Enable RLS on tables
ALTER TABLE lead_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_brain ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can only access their own data
CREATE POLICY client_data_isolation ON lead_memory
  FOR SELECT
  TO authenticated
  USING (client_id = current_setting('app.current_client_id')::uuid);

CREATE POLICY client_actions_isolation ON lead_actions
  FOR SELECT
  TO authenticated
  USING (client_id = current_setting('app.current_client_id')::uuid);

CREATE POLICY client_brain_isolation ON growth_brain
  FOR SELECT
  TO authenticated
  USING (client_id = current_setting('app.current_client_id')::uuid);

-- Policy: Service role bypasses RLS (admin access)
-- (Automatically granted to SERVICE_ROLE_KEY)
```

### **Access Patterns**

**Admin Access (SERVICE_ROLE_KEY):**

```typescript
const supabase = createClient(url, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// ✅ Can access all data (RLS bypassed)
const { data } = await supabase.from('lead_memory').select('*');
// Returns: ALL leads from ALL clients
```

**Client Access (ANON_KEY):**

```typescript
const supabase = createClient(url, ANON_KEY);

// ❌ Without RLS: Must filter manually
const { data } = await supabase
  .from('lead_memory')
  .select('*')
  .eq('client_id', currentClientId);  // Manual filter required

// ✅ With RLS enabled: Automatic filtering
const { data } = await supabase.from('lead_memory').select('*');
// Returns: Only leads for current_setting('app.current_client_id')
```

---

## 📐 Data Types Reference

### **PostgreSQL Types Used**

| Type | Usage | Example | Notes |
|------|-------|---------|-------|
| `UUID` | IDs, references | `550e8400-e29b-41d4-a716-...` | Generated via `gen_random_uuid()` |
| `TEXT` | Strings | `"Acme Corp"` | No length limit |
| `BOOLEAN` | Flags | `true` / `false` | Defaults used heavily |
| `NUMERIC(n,m)` | Scores | `0.92` (3,2 = 3 total, 2 decimal) | Precise decimals |
| `TIMESTAMPTZ` | Timestamps | `2025-10-17T13:30:00Z` | Timezone-aware |
| `JSONB` | Flexible data | `{"key": "value"}` | Binary JSON, indexable |
| `INTEGER` | Counts | `3306` (SMTP port) | Whole numbers |

### **JSONB Usage**

**Advantages:**
- ✅ Flexible schema (no migrations for new fields)
- ✅ Queryable with JSON operators
- ✅ Indexable with GIN indexes
- ✅ Perfect for AI learning snapshots

**Query Examples:**

```sql
-- Find all conversion events
SELECT * FROM growth_brain
WHERE learning_snapshot->>'pattern_type' = 'urgency_increasing';

-- Find events with high confidence
SELECT * FROM growth_brain
WHERE (learning_snapshot->'metrics'->>'avg_confidence')::numeric > 0.8;

-- Extract specific metrics
SELECT 
  client_id,
  learning_snapshot->'metrics'->>'total_leads' as total_leads,
  learning_snapshot->'metrics'->>'conversion_rate' as conversion_rate
FROM growth_brain
WHERE event_type = 'engagement_score';
```

---

## 🔄 Migration Scripts

### **Initial Schema Creation**

```sql
-- Create tables in order (respecting foreign keys)

-- 1. Clients (no dependencies)
CREATE TABLE public.clients ( ... );

-- 2. Lead memory (depends on clients)
CREATE TABLE public.lead_memory ( ... );

-- 3. Lead actions (depends on lead_memory and clients)
CREATE TABLE public.lead_actions ( ... );

-- 4. Growth brain (depends on clients)
CREATE TABLE public.growth_brain ( ... );

-- 5. Prospect candidates (independent)
CREATE TABLE public.prospect_candidates ( ... );

-- 6. Prospect outreach log (depends on prospect_candidates)
CREATE TABLE public.prospect_outreach_log ( ... );
```

### **Add reversion_reason Column**

```sql
-- Migration: Add reversion tracking
ALTER TABLE public.lead_actions
ADD COLUMN IF NOT EXISTS reversion_reason TEXT DEFAULT NULL;

COMMENT ON COLUMN lead_actions.reversion_reason IS 'User-provided reason when reverting a converted lead to active';
```

### **Add is_test Columns**

```sql
-- Migration: Add test data isolation
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

ALTER TABLE public.lead_memory
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

ALTER TABLE public.lead_actions
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_is_test ON clients(is_test);
CREATE INDEX IF NOT EXISTS idx_lead_memory_is_test ON lead_memory(is_test);
```

### **Add is_internal Column**

```sql
-- Migration: Add internal client flag
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_clients_is_internal ON clients(is_internal);

-- Mark Avenir AI as internal
INSERT INTO clients (
  client_id,
  business_name,
  email,
  password_hash,
  api_key,
  is_internal,
  is_test
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Avenir AI Solutions',
  'internal@aveniraisolutions.ca',
  '$2a$10$placeholder',  -- Hashed password
  'internal-api-key-placeholder',
  true,  -- is_internal = true
  false  -- is_test = false
)
ON CONFLICT (client_id) DO UPDATE
SET is_internal = true;
```

---

## 📊 Query Examples

### **Dashboard: Fetch Active Leads for Client**

```sql
SELECT 
  lm.*,
  la.tag,
  la.timestamp as last_action_time
FROM lead_memory lm
LEFT JOIN LATERAL (
  SELECT tag, timestamp
  FROM lead_actions
  WHERE lead_id = lm.id
  ORDER BY timestamp DESC
  LIMIT 1
) la ON true
WHERE lm.client_id = '550e8400-e29b-41d4-a716-446655440000'
  AND lm.is_test = false
  AND lm.archived = false
  AND lm.deleted = false
  AND lm.current_tag = 'Active'
ORDER BY lm.timestamp DESC;
```

### **Analytics: Calculate Urgency Trend**

```sql
SELECT 
  urgency,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM lead_memory
WHERE client_id = '550e8400-e29b-41d4-a716-446655440000'
  AND is_test = false
  AND timestamp > NOW() - INTERVAL '30 days'
GROUP BY urgency
ORDER BY count DESC;
```

### **Growth Brain: Fetch Latest Insights**

```sql
SELECT 
  event_type,
  insight_text,
  learning_snapshot->'metrics' as metrics,
  confidence,
  created_at
FROM growth_brain
WHERE client_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC
LIMIT 10;
```

### **Prospect Intelligence: High-Priority Prospects**

```sql
SELECT 
  business_name,
  industry,
  region,
  automation_need_score,
  contacted,
  website
FROM prospect_candidates
WHERE automation_need_score >= 70
  AND contacted = false
ORDER BY automation_need_score DESC
LIMIT 20;
```

---

## 🔧 Maintenance

### **Cleanup Test Data**

```sql
-- Delete all test data (use with caution!)
DELETE FROM clients WHERE is_test = true;
-- Cascades to: lead_memory, lead_actions, growth_brain
```

### **Archive Old Leads**

```sql
-- Auto-archive leads older than 1 year with no activity
UPDATE lead_memory
SET archived = true, current_tag = 'Archived'
WHERE timestamp < NOW() - INTERVAL '1 year'
  AND current_tag = 'Active'
  AND NOT EXISTS (
    SELECT 1 FROM lead_actions
    WHERE lead_id = lead_memory.id
      AND timestamp > NOW() - INTERVAL '1 year'
  );
```

### **Performance Monitoring**

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## ✅ Schema Validation Checklist

- [x] All tables created
- [x] All foreign keys defined
- [x] All indexes created
- [x] All constraints applied
- [x] All comments added
- [x] CASCADE rules configured
- [x] Data types validated
- [x] JSONB structures documented
- [x] growth_brain properly configured
- [x] RLS policies recommended

---

**End of Supabase Schema Reference**

*Last Verified: October 17, 2025*  
*Database: Supabase PostgreSQL 15*  
*Status: Production Ready*

