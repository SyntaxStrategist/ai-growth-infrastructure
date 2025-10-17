// ============================================
// Database Type Definitions - Synced with Supabase
// Auto-generated from Prisma schema
// Last Updated: October 17, 2025
// ============================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ============================================
// CLIENTS TABLE
// ============================================
export interface Client {
  id: string
  client_id: string
  business_name: string
  name?: string | null
  contact_name: string
  email: string
  password_hash: string
  language: string
  api_key: string
  lead_source_description?: string | null
  estimated_leads_per_week?: number | null
  created_at: string
  last_login?: string | null
  last_connection?: string | null
  is_active: boolean
  
  // Branding
  custom_tagline?: string | null
  email_tone: string
  followup_speed: string
  ai_personalized_reply: boolean
  industry_category?: string | null
  primary_service?: string | null
  booking_link?: string | null
  
  // SMTP
  outbound_email?: string | null
  smtp_host?: string | null
  smtp_port?: number | null
  smtp_username?: string | null
  smtp_password?: string | null
  
  // Flags
  is_internal: boolean
  is_test: boolean
}

export interface ClientInsert {
  id?: string
  client_id?: string
  business_name: string
  name?: string | null
  contact_name: string
  email: string
  password_hash: string
  language: string
  api_key: string
  lead_source_description?: string | null
  estimated_leads_per_week?: number | null
  created_at?: string
  last_login?: string | null
  last_connection?: string | null
  is_active?: boolean
  custom_tagline?: string | null
  email_tone?: string
  followup_speed?: string
  ai_personalized_reply?: boolean
  industry_category?: string | null
  primary_service?: string | null
  booking_link?: string | null
  outbound_email?: string | null
  smtp_host?: string | null
  smtp_port?: number | null
  smtp_username?: string | null
  smtp_password?: string | null
  is_internal?: boolean
  is_test?: boolean
}

export interface ClientUpdate {
  id?: string
  client_id?: string
  business_name?: string
  name?: string | null
  contact_name?: string
  email?: string
  password_hash?: string
  language?: string
  api_key?: string
  lead_source_description?: string | null
  estimated_leads_per_week?: number | null
  last_login?: string | null
  last_connection?: string | null
  is_active?: boolean
  custom_tagline?: string | null
  email_tone?: string
  followup_speed?: string
  ai_personalized_reply?: boolean
  industry_category?: string | null
  primary_service?: string | null
  booking_link?: string | null
  outbound_email?: string | null
  smtp_host?: string | null
  smtp_port?: number | null
  smtp_username?: string | null
  smtp_password?: string | null
  is_internal?: boolean
  is_test?: boolean
}

// ============================================
// LEAD_MEMORY TABLE
// ============================================
export interface LeadMemory {
  id: string
  name: string
  email: string
  message: string
  ai_summary?: string | null
  language: string
  timestamp: string
  intent?: string | null
  tone?: string | null
  urgency?: string | null
  confidence_score?: number | null
  tone_history: Json
  confidence_history: Json
  urgency_history: Json
  archived: boolean
  deleted: boolean
  current_tag?: string | null
  relationship_insight?: string | null
  last_updated: string
  client_id?: string | null
  is_test: boolean
}

export interface LeadMemoryInsert {
  id: string
  name: string
  email: string
  message: string
  ai_summary?: string | null
  language?: string
  timestamp?: string
  intent?: string | null
  tone?: string | null
  urgency?: string | null
  confidence_score?: number | null
  tone_history?: Json
  confidence_history?: Json
  urgency_history?: Json
  archived?: boolean
  deleted?: boolean
  current_tag?: string | null
  relationship_insight?: string | null
  last_updated?: string
  client_id?: string | null
  is_test?: boolean
}

export interface LeadMemoryUpdate {
  id?: string
  name?: string
  email?: string
  message?: string
  ai_summary?: string | null
  language?: string
  timestamp?: string
  intent?: string | null
  tone?: string | null
  urgency?: string | null
  confidence_score?: number | null
  tone_history?: Json
  confidence_history?: Json
  urgency_history?: Json
  archived?: boolean
  deleted?: boolean
  current_tag?: string | null
  relationship_insight?: string | null
  last_updated?: string
  client_id?: string | null
  is_test?: boolean
}

// ============================================
// LEAD_ACTIONS TABLE
// ============================================
export interface LeadAction {
  id: string
  lead_id: string
  client_id?: string | null
  action: string
  tag?: string | null
  performed_by: string
  timestamp: string
  created_at: string
  conversion_outcome?: boolean | null
  reversion_reason?: string | null
  is_test: boolean
}

export interface LeadActionInsert {
  id?: string
  lead_id: string
  client_id?: string | null
  action: string
  tag?: string | null
  performed_by?: string
  timestamp?: string
  created_at?: string
  conversion_outcome?: boolean | null
  reversion_reason?: string | null
  is_test?: boolean
}

export interface LeadActionUpdate {
  id?: string
  lead_id?: string
  client_id?: string | null
  action?: string
  tag?: string | null
  performed_by?: string
  timestamp?: string
  created_at?: string
  conversion_outcome?: boolean | null
  reversion_reason?: string | null
  is_test?: boolean
}

// ============================================
// GROWTH_BRAIN TABLE
// ============================================
export interface GrowthBrain {
  id: string
  client_id: string
  analysis_period_start: string
  analysis_period_end: string
  total_leads: number
  top_intents?: Json | null
  urgency_distribution?: Json | null
  urgency_trend_percentage?: number | null
  tone_distribution?: Json | null
  tone_sentiment_score?: number | null
  avg_confidence?: number | null
  confidence_trajectory?: Json | null
  language_ratio?: Json | null
  engagement_score?: number | null
  predictive_insights?: Json | null
  analyzed_at: string
  created_at: string
}

export interface GrowthBrainInsert {
  id?: string
  client_id: string
  analysis_period_start: string
  analysis_period_end: string
  total_leads?: number
  top_intents?: Json | null
  urgency_distribution?: Json | null
  urgency_trend_percentage?: number | null
  tone_distribution?: Json | null
  tone_sentiment_score?: number | null
  avg_confidence?: number | null
  confidence_trajectory?: Json | null
  language_ratio?: Json | null
  engagement_score?: number | null
  predictive_insights?: Json | null
  analyzed_at?: string
  created_at?: string
}

export interface GrowthBrainUpdate {
  id?: string
  client_id?: string
  analysis_period_start?: string
  analysis_period_end?: string
  total_leads?: number
  top_intents?: Json | null
  urgency_distribution?: Json | null
  urgency_trend_percentage?: number | null
  tone_distribution?: Json | null
  tone_sentiment_score?: number | null
  avg_confidence?: number | null
  confidence_trajectory?: Json | null
  language_ratio?: Json | null
  engagement_score?: number | null
  predictive_insights?: Json | null
  analyzed_at?: string
  created_at?: string
}

// ============================================
// PROSPECT_CANDIDATES TABLE
// ============================================
export interface ProspectCandidate {
  id: string
  business_name: string
  website: string
  contact_email?: string | null
  industry?: string | null
  region?: string | null
  language: string
  form_url?: string | null
  last_tested?: string | null
  response_score: number
  automation_need_score: number
  contacted: boolean
  created_at: string
  updated_at: string
  metadata?: Json | null
}

export interface ProspectCandidateInsert {
  id?: string
  business_name: string
  website: string
  contact_email?: string | null
  industry?: string | null
  region?: string | null
  language?: string
  form_url?: string | null
  last_tested?: string | null
  response_score?: number
  automation_need_score?: number
  contacted?: boolean
  created_at?: string
  updated_at?: string
  metadata?: Json | null
}

export interface ProspectCandidateUpdate {
  id?: string
  business_name?: string
  website?: string
  contact_email?: string | null
  industry?: string | null
  region?: string | null
  language?: string
  form_url?: string | null
  last_tested?: string | null
  response_score?: number
  automation_need_score?: number
  contacted?: boolean
  created_at?: string
  updated_at?: string
  metadata?: Json | null
}

// ============================================
// PROSPECT_OUTREACH_LOG TABLE
// ============================================
export interface ProspectOutreachLog {
  id: string
  prospect_id: string
  subject: string
  email_body: string
  sent_at: string
  opened_at?: string | null
  replied_at?: string | null
  status: string
  reply_content?: string | null
  metadata?: Json | null
}

export interface ProspectOutreachLogInsert {
  id?: string
  prospect_id: string
  subject: string
  email_body: string
  sent_at?: string
  opened_at?: string | null
  replied_at?: string | null
  status?: string
  reply_content?: string | null
  metadata?: Json | null
}

export interface ProspectOutreachLogUpdate {
  id?: string
  prospect_id?: string
  subject?: string
  email_body?: string
  sent_at?: string
  opened_at?: string | null
  replied_at?: string | null
  status?: string
  reply_content?: string | null
  metadata?: Json | null
}

// ============================================
// PROSPECT_INDUSTRY_PERFORMANCE TABLE
// ============================================
export interface ProspectIndustryPerformance {
  id: string
  industry: string
  total_contacted: number
  total_opened: number
  total_replied: number
  open_rate: number
  reply_rate: number
  avg_response_time_hours?: number | null
  priority_score: number
  last_updated: string
}

export interface ProspectIndustryPerformanceInsert {
  id?: string
  industry: string
  total_contacted?: number
  total_opened?: number
  total_replied?: number
  open_rate?: number
  reply_rate?: number
  avg_response_time_hours?: number | null
  priority_score?: number
  last_updated?: string
}

export interface ProspectIndustryPerformanceUpdate {
  id?: string
  industry?: string
  total_contacted?: number
  total_opened?: number
  total_replied?: number
  open_rate?: number
  reply_rate?: number
  avg_response_time_hours?: number | null
  priority_score?: number
  last_updated?: string
}

// ============================================
// PROSPECT_FORM_TESTS TABLE
// ============================================
export interface ProspectFormTest {
  id: string
  prospect_id: string
  test_submitted_at: string
  response_received_at?: string | null
  response_time_minutes?: number | null
  has_autoresponder: boolean
  autoresponder_tone?: string | null
  autoresponder_content?: string | null
  score: number
  test_status: string
  metadata?: Json | null
}

export interface ProspectFormTestInsert {
  id?: string
  prospect_id: string
  test_submitted_at: string
  response_received_at?: string | null
  response_time_minutes?: number | null
  has_autoresponder?: boolean
  autoresponder_tone?: string | null
  autoresponder_content?: string | null
  score?: number
  test_status?: string
  metadata?: Json | null
}

export interface ProspectFormTestUpdate {
  id?: string
  prospect_id?: string
  test_submitted_at?: string
  response_received_at?: string | null
  response_time_minutes?: number | null
  has_autoresponder?: boolean
  autoresponder_tone?: string | null
  autoresponder_content?: string | null
  score?: number
  test_status?: string
  metadata?: Json | null
}

// ============================================
// ENUMS AND CONSTANTS
// ============================================
export const EMAIL_TONES = ['Professional', 'Friendly', 'Formal', 'Energetic'] as const
export type EmailTone = typeof EMAIL_TONES[number]

export const FOLLOWUP_SPEEDS = ['Instant', 'Within 1 hour', 'Same day'] as const
export type FollowupSpeed = typeof FOLLOWUP_SPEEDS[number]

export const OUTREACH_STATUSES = ['sent', 'opened', 'replied', 'bounced', 'ignored'] as const
export type OutreachStatus = typeof OUTREACH_STATUSES[number]

export const AUTORESPONDER_TONES = ['robotic', 'human', 'personalized', 'none'] as const
export type AutoresponderTone = typeof AUTORESPONDER_TONES[number]

export const TEST_STATUSES = ['pending', 'completed', 'failed', 'timeout'] as const
export type TestStatus = typeof TEST_STATUSES[number]

export const LEAD_ACTIONS = ['delete', 'archive', 'tag', 'revert', 'reactivate', 'permanent_delete'] as const
export type LeadActionType = typeof LEAD_ACTIONS[number]

export const LEAD_TAGS = ['Converti / Converted', 'En attente / Pending', 'Non qualifié / Unqualified'] as const
export type LeadTag = typeof LEAD_TAGS[number]

// ============================================
// DATABASE RESPONSE TYPES
// ============================================
export interface DatabaseResponse<T> {
  data: T | null
  error: Error | null
}

export interface DatabaseListResponse<T> {
  data: T[]
  error: Error | null
  count: number | null
}

// ============================================
// HELPER TYPES
// ============================================
export interface PaginationParams {
  limit?: number
  offset?: number
}

export interface ClientFilter {
  is_internal?: boolean
  is_test?: boolean
  is_active?: boolean
  language?: string
  industry_category?: string
}

export interface LeadFilter {
  client_id?: string
  archived?: boolean
  deleted?: boolean
  is_test?: boolean
  current_tag?: string
  urgency?: string
  intent?: string
}

export interface ProspectFilter {
  industry?: string
  region?: string
  contacted?: boolean
  min_automation_score?: number
  language?: string
}

