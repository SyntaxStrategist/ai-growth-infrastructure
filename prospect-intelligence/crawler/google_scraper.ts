// ============================================
// Google Search Scraper for Prospect Discovery
// ============================================

import { ProspectCandidate } from '../types';

export interface GoogleSearchConfig {
  query: string;
  region?: string;
  language?: string;
  maxResults?: number;
}

/**
 * Search for potential prospects using Google Custom Search API
 * In development mode, returns simulated results
 */
export async function searchProspects(config: GoogleSearchConfig): Promise<ProspectCandidate[]> {
  const { query, region = 'CA', language = 'en', maxResults = 10 } = config;

  console.log('[GoogleScraper] ============================================');
  console.log('[GoogleScraper] Starting prospect search');
  console.log('[GoogleScraper] Query:', query);
  console.log('[GoogleScraper] Region:', region);
  console.log('[GoogleScraper] Language:', language);
  console.log('[GoogleScraper] Max Results:', maxResults);

  // Check if we're in production with API key
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId || process.env.NODE_ENV === 'development') {
    console.log('[GoogleScraper] ⚠️  Development mode - returning simulated results');
    return getSimulatedProspects(region, language, maxResults);
  }

  try {
    // Production: Use Google Custom Search API
    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    searchUrl.searchParams.append('key', apiKey);
    searchUrl.searchParams.append('cx', searchEngineId);
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('num', Math.min(maxResults, 10).toString());
    if (region) searchUrl.searchParams.append('gl', region.toLowerCase());
    if (language) searchUrl.searchParams.append('lr', `lang_${language}`);

    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Google API error: ${data.error?.message || 'Unknown error'}`);
    }

    const prospects: ProspectCandidate[] = (data.items || []).map((item: any) => ({
      business_name: extractBusinessName(item.title),
      website: item.link,
      industry: extractIndustry(item.snippet),
      region: region,
      language: language,
      form_url: null, // Will be detected in signal analyzer
      metadata: {
        title: item.title,
        snippet: item.snippet,
        source: 'google_search'
      }
    }));

    console.log('[GoogleScraper] ✅ Found', prospects.length, 'prospects');
    return prospects;

  } catch (error) {
    console.error('[GoogleScraper] ❌ Error:', error);
    // Fallback to simulated results
    return getSimulatedProspects(region, language, maxResults);
  }
}

/**
 * Generate simulated prospects for testing
 */
function getSimulatedProspects(region: string, language: string, count: number): ProspectCandidate[] {
  const simulatedCompanies = [
    {
      business_name: 'Maple Leaf Construction Inc',
      website: 'https://mapleleafconstruction.test',
      industry: 'Construction',
      contact_email: 'info@mapleleafconstruction.test',
      form_url: 'https://mapleleafconstruction.test/contact',
    },
    {
      business_name: 'Northern Real Estate Group',
      website: 'https://northernrealestate.test',
      industry: 'Real Estate',
      contact_email: 'sales@northernrealestate.test',
      form_url: 'https://northernrealestate.test/contact-us',
    },
    {
      business_name: 'Vancouver Marketing Solutions',
      website: 'https://vancouvermarketing.test',
      industry: 'Marketing',
      contact_email: 'hello@vancouvermarketing.test',
      form_url: 'https://vancouvermarketing.test/get-in-touch',
    },
    {
      business_name: 'Toronto Tech Consulting',
      website: 'https://torontotech.test',
      industry: 'Technology',
      contact_email: 'contact@torontotech.test',
      form_url: 'https://torontotech.test/contact',
    },
    {
      business_name: 'Quebec Services Financiers',
      website: 'https://qsfservices.test',
      industry: 'Finance',
      contact_email: 'info@qsfservices.test',
      form_url: 'https://qsfservices.test/contactez-nous',
    },
    {
      business_name: 'Atlantic Home Services',
      website: 'https://atlantichome.test',
      industry: 'Home Services',
      contact_email: 'booking@atlantichome.test',
      form_url: 'https://atlantichome.test/book',
    },
    {
      business_name: 'Prairie Law Associates',
      website: 'https://prairielaw.test',
      industry: 'Legal',
      contact_email: 'inquiries@prairielaw.test',
      form_url: 'https://prairielaw.test/contact',
    },
    {
      business_name: 'Calgary Event Planning',
      website: 'https://calgaryevents.test',
      industry: 'Events',
      contact_email: 'events@calgaryevents.test',
      form_url: 'https://calgaryevents.test/contact',
    },
  ];

  const prospects: ProspectCandidate[] = simulatedCompanies
    .slice(0, Math.min(count, simulatedCompanies.length))
    .map(company => ({
      ...company,
      region,
      language,
      response_score: 0,
      automation_need_score: 0,
      contacted: false,
      metadata: {
        source: 'simulated',
        simulation_mode: true
      }
    }));

  console.log('[GoogleScraper] 🧪 Generated', prospects.length, 'simulated prospects');
  return prospects;
}

/**
 * Extract business name from search result title
 */
function extractBusinessName(title: string): string {
  // Remove common suffixes and clean up
  return title
    .replace(/\s*[-|]\s*.*/g, '') // Remove everything after dash or pipe
    .replace(/\s*(Inc|Ltd|LLC|Corp|Corporation|Company)\.?$/i, '$1') // Keep business suffix
    .trim();
}

/**
 * Attempt to extract industry from snippet text
 */
function extractIndustry(snippet: string): string | null {
  const industries = [
    'construction', 'real estate', 'marketing', 'technology', 'finance',
    'legal', 'healthcare', 'education', 'retail', 'hospitality',
    'manufacturing', 'consulting', 'insurance', 'automotive'
  ];

  const snippetLower = snippet.toLowerCase();
  for (const industry of industries) {
    if (snippetLower.includes(industry)) {
      return industry.charAt(0).toUpperCase() + industry.slice(1);
    }
  }

  return null;
}

/**
 * Search for prospects by industry and region
 */
export async function searchByIndustry(
  industry: string,
  region: string = 'CA',
  language: string = 'en'
): Promise<ProspectCandidate[]> {
  const query = `${industry} "contact us" site:.${region.toLowerCase()} -site:linkedin.com -site:facebook.com`;
  
  return searchProspects({
    query,
    region,
    language,
    maxResults: 10
  });
}

/**
 * Search for prospects with specific business size
 */
export async function searchBySize(
  employeeRange: string,
  region: string = 'CA'
): Promise<ProspectCandidate[]> {
  const query = `"${employeeRange} employees" "contact" site:.${region.toLowerCase()}`;
  
  return searchProspects({
    query,
    region,
    maxResults: 10
  });
}

