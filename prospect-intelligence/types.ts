// ============================================
// Prospect Intelligence Module - Type Definitions
// ============================================

export interface ProspectCandidate {
  id?: string;
  business_name: string;
  website: string;
  contact_email?: string | null;
  industry?: string | null;
  region?: string | null;
  language?: string;
  form_url?: string | null;
  last_tested?: Date | null;
  response_score?: number;
  automation_need_score?: number;
  contacted?: boolean;
  is_test?: boolean; // True if from Test Mode, false for production prospects
  created_at?: Date;
  updated_at?: Date;
  metadata?: Record<string, any>;
}

export interface FormTestResult {
  id?: string;
  prospect_id: string;
  test_submitted_at: Date;
  response_received_at?: Date | null;
  response_time_minutes?: number | null;
  has_autoresponder?: boolean;
  autoresponder_tone?: 'robotic' | 'human' | 'personalized' | 'none';
  autoresponder_content?: string | null;
  score?: number;
  test_status?: 'pending' | 'completed' | 'failed' | 'timeout';
  metadata?: Record<string, any>;
}

export interface OutreachLog {
  id?: string;
  prospect_id: string;
  subject: string;
  email_body: string;
  sent_at?: Date;
  opened_at?: Date | null;
  replied_at?: Date | null;
  status?: 'sent' | 'opened' | 'replied' | 'bounced' | 'ignored';
  reply_content?: string | null;
  metadata?: Record<string, any>;
}

export interface IndustryPerformance {
  id?: string;
  industry: string;
  total_contacted?: number;
  total_opened?: number;
  total_replied?: number;
  open_rate?: number;
  reply_rate?: number;
  avg_response_time_hours?: number | null;
  priority_score?: number;
  last_updated?: Date;
}

export interface CrawlerConfig {
  targetRegions: string[];
  targetIndustries: string[];
  employeeSizeMin: number;
  employeeSizeMax: number;
  requiresContactForm: boolean;
  maxResultsPerSearch: number;
}

export interface SignalScore {
  responseTime: number; // minutes
  hasAutoresponder: boolean;
  autoresponderQuality: 'robotic' | 'human' | 'personalized' | 'none';
  overallScore: number; // 0-100
  automationNeedScore: number; // 0-100
}

export interface OutreachTemplate {
  subject: string;
  body: string;
  tone: 'Friendly' | 'Professional' | 'Formal';
  language: 'en' | 'fr';
}

export interface ProspectPipelineResult {
  totalCrawled: number;
  totalTested: number;
  totalScored: number;
  totalContacted: number;
  highPriorityProspects: ProspectCandidate[];
  errors: string[];
}

