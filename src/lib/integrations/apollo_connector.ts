// ============================================
// Apollo API Connector - Real Prospect Discovery
// ============================================
// Integrates with Apollo.io API for business data enrichment
// Docs: https://apolloio.github.io/apollo-api-docs

import fs from 'fs';
import path from 'path';

const APOLLO_BASE_URL = 'https://api.apollo.io/v1';
const APOLLO_API_KEY = process.env.APOLLO_API_KEY;

// Rate limiting: Apollo free plan allows 50 requests/hour
const RATE_LIMIT_DELAY = 1200; // 1.2 seconds between requests (safe for 50/hour)
let lastRequestTime = 0;

// ============================================
// Logging
// ============================================
function logApolloRequest(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;
  
  console.log('[ApolloAPI]', message, data || '');
  
  // Skip local file logging on Vercel or production
  if (process.env.VERCEL) return;
  if (process.env.NODE_ENV === 'production') return;
  
  try {
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'apollo_integration.log');
    
    // Create logs directory if it doesn't exist (local dev only)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Append to log file (local dev only)
    fs.appendFileSync(logFile, logMessage);
  } catch (error) {
    // Silently fail - filesystem might not be available
  }
}

// ============================================
// Rate Limiting
// ============================================
async function enforceRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
    logApolloRequest(`⏱️  Rate limit: Waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

// ============================================
// Apollo API Request Handler
// ============================================
async function apolloRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: any
): Promise<T> {
  if (!APOLLO_API_KEY) {
    const error = 'APOLLO_API_KEY not configured in environment variables';
    logApolloRequest('❌ Configuration Error', { error });
    throw new Error(error);
  }

  // Enforce rate limiting
  await enforceRateLimit();

  const url = `${APOLLO_BASE_URL}${endpoint}`;
  
  logApolloRequest(`→ ${method} ${endpoint}`, body);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': APOLLO_API_KEY,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      logApolloRequest(`❌ API Error (${response.status})`, {
        status: response.status,
        statusText: response.statusText,
        error: data
      });
      
      // Handle rate limit errors specifically
      if (response.status === 429) {
        throw new Error('Apollo API rate limit exceeded. Please wait before retrying.');
      }
      
      throw new Error(data.error || data.message || `Apollo API error: ${response.status}`);
    }

    logApolloRequest(`✅ Success (${response.status})`, {
      results: Array.isArray(data.accounts) ? data.accounts.length : data.contacts?.length || 0
    });

    return data as T;
  } catch (error) {
    logApolloRequest('❌ Request Failed', {
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// ============================================
// Apollo Response Types
// ============================================
interface ApolloAccount {
  id: string;
  name: string;
  domain?: string;
  website_url?: string;
  industry?: string;
  country?: string;
  state?: string;
  city?: string;
  organization_num_employees_ranges?: string[];
  annual_revenue?: string;
  phone?: string;
}

interface ApolloContact {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  title?: string;
  organization?: ApolloAccount;
}

interface ApolloAccountSearchResponse {
  accounts: ApolloAccount[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

interface ApolloContactSearchResponse {
  contacts: ApolloContact[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

// ============================================
// Prospect Search Result Type
// ============================================
export interface ApolloProspect {
  business_name: string;
  industry?: string;
  region?: string;
  contact_email?: string;
  website: string;
  automation_need_score: number;
  metadata?: {
    apollo_id: string;
    employee_count?: string;
    annual_revenue?: string;
    location?: string;
    source: 'apollo';
    enriched_at: string;
  };
}

// ============================================
// Main Search Function
// ============================================
/**
 * Search Apollo API for business prospects
 * @param industry - Target industry (e.g., "Construction", "Real Estate")
 * @param region - Target region/country code (e.g., "CA", "US")
 * @param limit - Maximum number of results (default: 10, max: 25 for free tier)
 * @returns Array of prospects with automation need scores
 */
export async function searchApolloProspects(
  industry: string,
  region: string = 'CA',
  limit: number = 10
): Promise<ApolloProspect[]> {
  logApolloRequest('============================================');
  logApolloRequest('Starting Apollo Prospect Search');
  logApolloRequest('Parameters', { industry, region, limit });

  if (!APOLLO_API_KEY) {
    logApolloRequest('⚠️  APOLLO_API_KEY not set - cannot search real prospects');
    throw new Error('Apollo API key not configured. Please set APOLLO_API_KEY in .env.local');
  }

  try {
    // Apollo API request body for account search
    const searchBody = {
      // Organization filters
      q_organization_industry_tag_ids: [mapIndustryToApolloTag(industry)],
      organization_locations: [mapRegionToLocation(region)],
      
      // Size filters (small to medium businesses - better fit for Avenir)
      organization_num_employees_ranges: ['1,10', '11,50', '51,200'],
      
      // Technology filters (businesses with websites but basic tech stack)
      organization_not_technologies: ['Salesforce', 'HubSpot', 'Intercom', 'Drift'], // Exclude those with advanced automation
      
      // Pagination
      page: 1,
      per_page: Math.min(limit, 25), // Apollo free tier limit
    };

    logApolloRequest('Searching Apollo accounts...', { filters: searchBody });

    const response = await apolloRequest<ApolloAccountSearchResponse>(
      '/mixed_companies/search',
      'POST',
      searchBody
    );

    if (!response.accounts || response.accounts.length === 0) {
      logApolloRequest('⚠️  No accounts found matching criteria');
      return [];
    }

    logApolloRequest(`✅ Found ${response.accounts.length} accounts`);

    // Transform Apollo accounts to prospect format
    const prospects: ApolloProspect[] = response.accounts
      .filter(account => account.website_url || account.domain)
      .map(account => {
        // Calculate automation need score based on Apollo data
        const automationScore = calculateAutomationNeedFromApollo(account);
        
        return {
          business_name: account.name,
          industry: account.industry || industry,
          region: region,
          contact_email: undefined, // Will be enriched separately if needed
          website: normalizeWebsiteUrl(account.website_url || account.domain || ''),
          automation_need_score: automationScore,
          metadata: {
            apollo_id: account.id,
            employee_count: account.organization_num_employees_ranges?.[0] || 'Unknown',
            annual_revenue: account.annual_revenue || 'Unknown',
            location: `${account.city || ''}, ${account.state || ''}, ${account.country || region}`.trim(),
            source: 'apollo' as const,
            enriched_at: new Date().toISOString()
          }
        };
      });

    logApolloRequest(`✅ Transformed ${prospects.length} prospects`);
    logApolloRequest('Sample prospect', prospects[0]);

    return prospects;

  } catch (error) {
    logApolloRequest('❌ Search failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Map industry name to Apollo industry tag
 */
function mapIndustryToApolloTag(industry: string): string {
  const industryMap: Record<string, string> = {
    'Construction': 'Construction',
    'Real Estate': 'Real Estate',
    'Marketing': 'Marketing & Advertising',
    'Legal': 'Legal Services',
    'Healthcare': 'Healthcare',
    'Home Services': 'Consumer Services',
    'Technology': 'Information Technology',
    'Finance': 'Financial Services',
    'Consulting': 'Management Consulting',
    'Insurance': 'Insurance'
  };

  return industryMap[industry] || industry;
}

/**
 * Map region code to Apollo location format
 */
function mapRegionToLocation(region: string): string {
  const regionMap: Record<string, string> = {
    'CA': 'Canada',
    'US': 'United States',
    'QC': 'Quebec, Canada',
    'ON': 'Ontario, Canada',
    'BC': 'British Columbia, Canada'
  };

  return regionMap[region] || region;
}

/**
 * Calculate automation need score from Apollo account data
 * Higher score = greater need for automation
 */
function calculateAutomationNeedFromApollo(account: ApolloAccount): number {
  let score = 50; // Base score

  // Industry boost (service-based industries need more automation)
  const highNeedIndustries = ['Construction', 'Real Estate', 'Legal Services', 'Healthcare', 'Consumer Services'];
  if (account.industry && highNeedIndustries.some(ind => account.industry?.includes(ind))) {
    score += 20;
  }

  // Company size boost (small businesses have less automation)
  const employeeRange = account.organization_num_employees_ranges?.[0] || '';
  if (employeeRange.includes('1,10') || employeeRange.includes('11,50')) {
    score += 15; // Small businesses likely have manual processes
  }

  // Revenue indicator (lower revenue = likely less automation investment)
  if (account.annual_revenue && (
    account.annual_revenue.includes('$0') || 
    account.annual_revenue.includes('$1M') ||
    account.annual_revenue.includes('$500K')
  )) {
    score += 10;
  }

  // Has phone but might not have advanced contact systems
  if (account.phone) {
    score += 5; // Reachable but potentially manual
  }

  // Ensure score is within 45-95 range
  return Math.min(95, Math.max(45, score));
}

/**
 * Normalize website URL to standard format
 */
function normalizeWebsiteUrl(url: string): string {
  if (!url) return '';
  
  // Add https:// if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');
  
  return url;
}

// ============================================
// Contact Enrichment (Optional)
// ============================================
/**
 * Enrich prospects with contact emails (requires additional API call)
 * Only use if needed, as this consumes more API credits
 */
export async function enrichProspectWithContacts(
  prospectWebsite: string,
  limit: number = 1
): Promise<string[]> {
  logApolloRequest('Enriching prospect with contacts', { website: prospectWebsite });

  try {
    const response = await apolloRequest<ApolloContactSearchResponse>(
      '/mixed_people/search',
      'POST',
      {
        q_organization_domains: [prospectWebsite.replace(/^https?:\/\//, '').replace(/^www\./, '')],
        contact_email_status: ['verified'],
        page: 1,
        per_page: limit
      }
    );

    const emails = (response.contacts || [])
      .map(contact => contact.email)
      .filter(email => email && email.length > 0) as string[];

    logApolloRequest(`✅ Found ${emails.length} contact emails`);
    return emails;

  } catch (error) {
    logApolloRequest('⚠️  Contact enrichment failed', { error });
    return [];
  }
}

// ============================================
// Batch Search with Rate Limiting
// ============================================
/**
 * Search multiple industries with proper rate limiting
 */
export async function searchMultipleIndustries(
  industries: string[],
  region: string = 'CA',
  prospectsPerIndustry: number = 5
): Promise<ApolloProspect[]> {
  logApolloRequest('============================================');
  logApolloRequest('Batch Search - Multiple Industries');
  logApolloRequest('Industries', industries);
  logApolloRequest('Region', region);
  logApolloRequest('Prospects per industry', prospectsPerIndustry);

  const allProspects: ApolloProspect[] = [];

  for (const industry of industries) {
    try {
      logApolloRequest(`\n🔍 Searching: ${industry} in ${region}`);
      
      const prospects = await searchApolloProspects(industry, region, prospectsPerIndustry);
      allProspects.push(...prospects);
      
      logApolloRequest(`✅ ${industry}: Found ${prospects.length} prospects`);
    } catch (error) {
      logApolloRequest(`❌ ${industry}: Search failed`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Continue with next industry even if one fails
    }
  }

  logApolloRequest('============================================');
  logApolloRequest(`✅ Batch search complete: ${allProspects.length} total prospects`);

  return allProspects;
}

// ============================================
// API Health Check
// ============================================
/**
 * Verify Apollo API credentials and connectivity
 */
export async function testApolloConnection(): Promise<boolean> {
  logApolloRequest('============================================');
  logApolloRequest('Testing Apollo API Connection');

  if (!APOLLO_API_KEY) {
    logApolloRequest('❌ APOLLO_API_KEY not set');
    return false;
  }

  try {
    // Test with minimal search
    const response = await apolloRequest<ApolloAccountSearchResponse>(
      '/mixed_companies/search',
      'POST',
      {
        q_organization_domains: ['apollo.io'],
        page: 1,
        per_page: 1
      }
    );

    if (response.accounts) {
      logApolloRequest('✅ Apollo API connection successful');
      logApolloRequest('API Key valid and authenticated');
      return true;
    }

    logApolloRequest('⚠️  Unexpected response format');
    return false;

  } catch (error) {
    logApolloRequest('❌ Connection test failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

// ============================================
// Export Summary
// ============================================
export const ApolloAPI = {
  searchProspects: searchApolloProspects,
  searchMultiple: searchMultipleIndustries,
  enrichContacts: enrichProspectWithContacts,
  testConnection: testApolloConnection,
  isConfigured: () => !!APOLLO_API_KEY
};

