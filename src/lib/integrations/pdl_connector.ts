// ============================================
// People Data Labs (PDL) API Connector
// ============================================
// Company/organization search and enrichment
// Docs: https://docs.peopledatalabs.com/docs/company-search-api

const BASE = 'https://api.peopledatalabs.com';
const PDL_API_KEY = process.env.PEOPLE_DATA_LABS_API_KEY;
const RATE_LIMIT_MS = parseInt(process.env.PDL_RATE_LIMIT_MS || '1000', 10);

// Rate limiting state
let lastPdlRequestTime = 0;

// ============================================
// Types
// ============================================

interface PdlCompany {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  location?: {
    country?: string;
    region?: string;
    locality?: string;
  };
  size?: string;
  employee_count?: number;
  founded?: number;
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  type?: string;
}

interface PdlSearchResponse {
  status: number;
  data: PdlCompany[];
  total: number;
  scroll_token?: string;
}

export interface PdlProspect {
  business_name: string;
  industry?: string;
  region?: string;
  contact_email?: string;
  website: string;
  automation_need_score: number;
  metadata: {
    pdl_id: string;
    employee_count?: number;
    founded_year?: number;
    company_size?: string;
    linkedin_url?: string;
    location?: string;
    source: 'pdl';
    enriched_at: string;
    [key: string]: any;
  };
}

// ============================================
// Rate Limiting
// ============================================

/**
 * Enforce rate limiting between PDL API requests
 */
async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastPdlRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    const waitTime = RATE_LIMIT_MS - timeSinceLastRequest;
    console.info(`[PDL] ⏱️  Rate limit: Waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastPdlRequestTime = Date.now();
}

// ============================================
// PDL API Request Handler
// ============================================

/**
 * Generic PDL API request with error handling
 */
async function pdlRequest<T>(
  endpoint: string,
  params: Record<string, any> = {}
): Promise<T> {
  if (!PDL_API_KEY) {
    throw new Error('PEOPLE_DATA_LABS_API_KEY not configured');
  }

  await enforceRateLimit();

  const url = new URL(`${BASE}${endpoint}`);
  
  // Add API key and params to query string
  url.searchParams.append('api_key', PDL_API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  console.info(`[PDL] → GET ${endpoint}`, params);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[PDL] ❌ API Error (${response.status})`, data);
      
      // Handle specific error codes
      if (response.status === 429) {
        throw new Error('PDL API rate limit exceeded. Please wait before retrying.');
      }
      
      if (response.status === 401 || response.status === 403) {
        throw new Error('PDL API authentication failed or endpoint not allowed on current plan');
      }
      
      throw new Error(data.error?.message || `PDL API error: ${response.status}`);
    }

    console.info(`[PDL] ✅ Success (${response.status})`, {
      results: data.data?.length || 0,
      total: data.total || 0
    });

    return data as T;
  } catch (error) {
    console.error('[PDL] ❌ Request failed:', error);
    throw error;
  }
}

// ============================================
// Company Search
// ============================================

/**
 * Search PDL for companies/organizations matching criteria
 * 
 * @param industry - Target industry (e.g., "Construction", "Real Estate")
 * @param region - Target region/country code (e.g., "CA", "US")
 * @param limit - Maximum number of results (default: 20, max: 100)
 * @returns Array of prospects with automation scores
 * 
 * @example
 * const prospects = await searchPdlProspects('Construction', 'CA', 10);
 */
export async function searchPdlProspects(
  industry: string,
  region: string = 'CA',
  limit: number = 20
): Promise<PdlProspect[]> {
  console.info('[PDL] ============================================');
  console.info('[PDL] Starting company search');
  console.info('[PDL] Industry:', industry);
  console.info('[PDL] Region:', region);
  console.info('[PDL] Limit:', limit);

  if (!PDL_API_KEY) {
    console.warn('[PDL] ⚠️  API key not configured');
    return [];
  }

  try {
    // Build search query for PDL
    const searchParams = {
      query: JSON.stringify({
        bool: {
          must: [
            { term: { 'location.country': mapRegionToCountry(region) } },
            { wildcard: { industry: `*${industry.toLowerCase()}*` } }
          ],
          filter: [
            { range: { employee_count: { gte: 1, lte: 500 } } }, // Small-medium businesses
            { exists: { field: 'website' } } // Must have website
          ]
        }
      }),
      size: Math.min(limit, 100),
      pretty: true
    };

    const response = await pdlRequest<PdlSearchResponse>('/v5/company/search', searchParams);

    if (!response.data || response.data.length === 0) {
      console.warn('[PDL] ⚠️  No companies found');
      return [];
    }

    console.info(`[PDL] ✅ Found ${response.data.length} companies`);

    // Transform PDL companies to prospect format
    const prospects: PdlProspect[] = response.data
      .filter(company => company.website)
      .map(company => ({
        business_name: company.name,
        industry: company.industry || industry,
        region: region,
        contact_email: undefined, // PDL companies don't include direct emails
        website: normalizeWebsite(company.website!),
        automation_need_score: calculateAutomationScore(company),
        metadata: {
          pdl_id: company.id,
          employee_count: company.employee_count,
          founded_year: company.founded,
          company_size: company.size || 'Unknown',
          linkedin_url: company.linkedin_url,
          location: formatLocation(company.location),
          company_type: company.type,
          source: 'pdl' as const,
          enriched_at: new Date().toISOString()
        }
      }));

    console.info(`[PDL] ✅ Transformed ${prospects.length} prospects`);
    
    if (prospects.length > 0) {
      console.info('[PDL] Sample prospect:', {
        name: prospects[0].business_name,
        website: prospects[0].website,
        score: prospects[0].automation_need_score
      });
    }

    return prospects;

  } catch (error) {
    // Non-fatal errors - return empty array
    if (error instanceof Error) {
      if (error.message.includes('not allowed on current plan')) {
        console.warn('[PDL] ⚠️  API endpoint not available on current plan');
        return [];
      }
      if (error.message.includes('rate limit')) {
        console.warn('[PDL] ⚠️  Rate limit hit - returning empty');
        return [];
      }
    }
    
    // Fatal configuration errors - throw
    if (error instanceof Error && error.message.includes('not configured')) {
      throw error;
    }
    
    console.error('[PDL] ❌ Search failed:', error);
    return [];
  }
}

// ============================================
// Contact Enrichment (Optional)
// ============================================

/**
 * Enrich a company domain with contact information
 * 
 * @param companyDomain - Company website domain (e.g., "example.com")
 * @returns Array of contact emails (if available)
 * 
 * @example
 * const emails = await enrichPdlContact('example.com');
 */
export async function enrichPdlContact(companyDomain: string): Promise<string[]> {
  console.info('[PDL] Enriching contacts for:', companyDomain);

  if (!PDL_API_KEY) {
    console.warn('[PDL] ⚠️  API key not configured for contact enrichment');
    return [];
  }

  try {
    // Normalize domain
    const domain = companyDomain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '');

    // Search for people at this company
    const searchParams = {
      query: JSON.stringify({
        bool: {
          must: [
            { term: { 'work_email': `*@${domain}` } },
            { exists: { field: 'work_email' } }
          ]
        }
      }),
      size: 5,
      pretty: true
    };

    const response = await pdlRequest<any>('/v5/person/search', searchParams);

    const emails = (response.data || [])
      .map((person: any) => person.work_email)
      .filter((email: any) => email && typeof email === 'string');

    console.info(`[PDL] ✅ Found ${emails.length} contact emails`);
    return emails;

  } catch (error) {
    console.warn('[PDL] ⚠️  Contact enrichment failed:', error);
    return [];
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Map region code to country name
 */
function mapRegionToCountry(region: string): string {
  const regionMap: Record<string, string> = {
    'CA': 'canada',
    'US': 'united states',
    'QC': 'canada',
    'ON': 'canada',
    'BC': 'canada',
    'UK': 'united kingdom',
    'FR': 'france',
    'DE': 'germany'
  };

  return regionMap[region.toUpperCase()] || region.toLowerCase();
}

/**
 * Format location from PDL data
 */
function formatLocation(location?: { country?: string; region?: string; locality?: string }): string {
  if (!location) return 'Unknown';
  
  const parts = [
    location.locality,
    location.region,
    location.country
  ].filter(Boolean);
  
  return parts.join(', ') || 'Unknown';
}

/**
 * Normalize website URL
 */
function normalizeWebsite(url: string): string {
  if (!url) return '';
  
  // Add https:// if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');
  
  return url;
}

/**
 * Calculate automation need score from PDL company data
 * 
 * Score range: 45-95
 * Higher score = greater automation need
 */
function calculateAutomationScore(company: PdlCompany): number {
  let score = 50; // Base score

  // Industry boost - service industries benefit more from automation
  const highNeedIndustries = [
    'construction', 'real estate', 'legal', 'healthcare',
    'professional services', 'home services', 'consulting'
  ];
  
  if (company.industry) {
    const industryLower = company.industry.toLowerCase();
    if (highNeedIndustries.some(ind => industryLower.includes(ind))) {
      score += 20;
    }
  }

  // Company size boost - smaller companies have less automation
  if (company.employee_count) {
    if (company.employee_count <= 10) {
      score += 20; // Very small, likely manual
    } else if (company.employee_count <= 50) {
      score += 15; // Small, some automation
    } else if (company.employee_count <= 200) {
      score += 10; // Medium, moderate automation
    }
  } else if (company.size) {
    // Fallback to size string
    if (company.size.includes('1-10') || company.size.includes('Small')) {
      score += 15;
    }
  }

  // Newer companies (founded recently) may have less established systems
  if (company.founded && company.founded > 2015) {
    score += 5; // Newer company, possibly less mature systems
  }

  // Has LinkedIn but still needs automation
  if (company.linkedin_url) {
    score += 5; // Active online presence but may lack automation
  }

  // Ensure score is within valid range
  return Math.min(95, Math.max(45, score));
}

// ============================================
// Batch Search
// ============================================

/**
 * Search multiple industries with rate limiting
 */
export async function searchPdlMultipleIndustries(
  industries: string[],
  region: string = 'CA',
  prospectsPerIndustry: number = 10
): Promise<PdlProspect[]> {
  console.info('[PDL] ============================================');
  console.info('[PDL] Batch search - Multiple industries');
  console.info('[PDL] Industries:', industries);
  console.info('[PDL] Region:', region);

  const allProspects: PdlProspect[] = [];

  for (const industry of industries) {
    try {
      const prospects = await searchPdlProspects(industry, region, prospectsPerIndustry);
      allProspects.push(...prospects);
      console.info(`[PDL] ${industry}: ${prospects.length} prospects`);
    } catch (error) {
      console.error(`[PDL] ${industry}: Search failed`, error);
      // Continue with next industry
    }
  }

  console.info(`[PDL] ✅ Batch complete: ${allProspects.length} total prospects`);
  return allProspects;
}

// ============================================
// API Health Check
// ============================================

/**
 * Test PDL API connection and authentication
 * 
 * @returns true if API is accessible, false otherwise
 */
export async function testPdlConnection(): Promise<boolean> {
  console.info('[PDL] ============================================');
  console.info('[PDL] Testing API connection');

  if (!PDL_API_KEY) {
    console.warn('[PDL] ❌ API key not set');
    return false;
  }

  try {
    // Minimal search to test auth
    const response = await pdlRequest<PdlSearchResponse>('/v5/company/search', {
      query: JSON.stringify({
        bool: {
          must: [
            { term: { 'website': 'peopledatalabs.com' } }
          ]
        }
      }),
      size: 1
    });

    if (response.status === 200) {
      console.info('[PDL] ✅ API connection successful');
      return true;
    }

    console.warn('[PDL] ⚠️  Unexpected response status:', response.status);
    return false;

  } catch (error) {
    console.error('[PDL] ❌ Connection test failed:', error);
    return false;
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if PDL API is configured
 */
export function isPdlConfigured(): boolean {
  return !!PDL_API_KEY;
}

/**
 * Get rate limit configuration
 */
export function getPdlRateLimit(): number {
  return RATE_LIMIT_MS;
}

// ============================================
// Export API Object
// ============================================

export const PdlAPI = {
  searchProspects: searchPdlProspects,
  searchMultiple: searchPdlMultipleIndustries,
  enrichContact: enrichPdlContact,
  testConnection: testPdlConnection,
  isConfigured: isPdlConfigured,
  getRateLimit: getPdlRateLimit,
  BASE
};

