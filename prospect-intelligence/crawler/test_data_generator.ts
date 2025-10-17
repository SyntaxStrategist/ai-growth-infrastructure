// ============================================
// Test Data Generator for Prospect Intelligence
// Generates realistic mock business data
// ============================================

import { ProspectCandidate } from '../types';

/**
 * Generate fake business data for testing
 */
export function generateTestProspects(count: number = 10, industries: string[], regions: string[]): ProspectCandidate[] {
  console.log('[TestDataGenerator] ============================================');
  console.log('[TestDataGenerator] Generating', count, 'test prospects');
  console.log('[TestDataGenerator] Industries:', industries.join(', '));
  console.log('[TestDataGenerator] Regions:', regions.join(', '));

  const prospects: ProspectCandidate[] = [];

  const businessNames = {
    'Construction': [
      'Elite Construction Group',
      'Northern Builders Inc',
      'Summit Construction Services',
      'Apex Building Solutions',
      'Heritage Contractors Ltd'
    ],
    'Real Estate': [
      'Premier Realty Group',
      'Metropolitan Properties',
      'Skyline Real Estate Partners',
      'Horizon Property Solutions',
      'Cornerstone Realty Services'
    ],
    'Marketing': [
      'Digital Growth Agency',
      'Creative Marketing Solutions',
      'Brand Boost Marketing',
      'Momentum Digital Studios',
      'Strategic Marketing Partners'
    ],
    'Legal': [
      'Thompson Law Associates',
      'Justice Partners LLP',
      'Premier Legal Solutions',
      'Crown Law Group',
      'Heritage Legal Services'
    ],
    'Healthcare': [
      'Wellness Medical Center',
      'Family Health Partners',
      'Premier Care Clinic',
      'Integrated Health Solutions',
      'Community Medical Group'
    ],
    'Home Services': [
      'Complete Home Solutions',
      'Professional Property Care',
      'Elite Service Group',
      'HomeGuard Services Inc',
      'Premier Home Maintenance'
    ],
    'Technology': [
      'TechForward Solutions',
      'Digital Innovation Labs',
      'NextGen Software Inc',
      'Cloud Systems Group',
      'Advanced Tech Partners'
    ],
    'Finance': [
      'Capital Financial Group',
      'Strategic Wealth Partners',
      'Premier Financial Services',
      'Horizon Investment Solutions',
      'Peak Financial Advisors'
    ],
    'Consulting': [
      'Strategic Business Advisors',
      'Management Excellence Group',
      'Premier Consulting Partners',
      'Forward Strategy Solutions',
      'Apex Business Consultants'
    ],
    'Insurance': [
      'SafeGuard Insurance Group',
      'Premier Coverage Solutions',
      'Protective Insurance Partners',
      'Horizon Risk Management',
      'Complete Coverage Advisors'
    ]
  };

  const websites: string[] = [];
  const emails: string[] = [];

  for (let i = 0; i < count; i++) {
    const industry = industries[i % industries.length];
    const region = regions[i % regions.length];
    
    // Get business names for the industry
    const names = businessNames[industry as keyof typeof businessNames] || [
      `${industry} Solutions Inc`,
      `Premier ${industry} Group`,
      `Elite ${industry} Services`
    ];
    
    const businessName = names[i % names.length] || `${industry} Business ${i + 1}`;
    
    // Generate realistic website URL
    const domainName = businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const website = `https://www.${domainName}.com`;
    
    // Generate contact email
    const emailDomain = domainName;
    const email = `contact@${emailDomain}.com`;
    
    // Generate realistic automation need scores based on industry patterns
    let baseScore = 50;
    
    // Industries with higher automation needs
    if (['Construction', 'Real Estate', 'Home Services'].includes(industry)) {
      baseScore = 70 + Math.floor(Math.random() * 25); // 70-95
    } else if (['Marketing', 'Legal', 'Healthcare'].includes(industry)) {
      baseScore = 60 + Math.floor(Math.random() * 30); // 60-90
    } else {
      baseScore = 50 + Math.floor(Math.random() * 40); // 50-90
    }
    
    // Add some randomness
    const automationScore = Math.min(95, Math.max(45, baseScore + Math.floor(Math.random() * 10) - 5));
    const responseScore = Math.max(0, automationScore - 10 + Math.floor(Math.random() * 20));
    
    // Determine language based on region
    const language = region === 'QC' ? (Math.random() > 0.5 ? 'fr' : 'en') : 'en';
    
    // Response time simulation (in minutes)
    const hasQuickResponse = Math.random() > 0.6;
    const responseTimeMinutes = hasQuickResponse 
      ? Math.floor(Math.random() * 60) + 1 // 1-60 minutes
      : Math.floor(Math.random() * 1440) + 60; // 1-24 hours
    
    const prospect: ProspectCandidate = {
      id: `test_prospect_${Date.now()}_${i}`,
      business_name: businessName,
      website,
      contact_email: email,
      industry,
      region,
      language,
      form_url: `${website}/contact`,
      last_tested: new Date().toISOString(),
      response_score: responseScore,
      automation_need_score: automationScore,
      contacted: false,
      metadata: {
        test_data: true,
        generated_at: new Date().toISOString(),
        response_time_minutes: responseTimeMinutes,
        has_autoresponder: hasQuickResponse,
        estimated_company_size: Math.floor(Math.random() * 100) + 5,
        website_quality: Math.random() > 0.7 ? 'high' : 'medium'
      }
    };
    
    prospects.push(prospect);
  }

  console.log('[TestDataGenerator] ✅ Generated', prospects.length, 'test prospects');
  console.log('[TestDataGenerator] Score range:', 
    Math.min(...prospects.map(p => p.automation_need_score || 0)), 
    '-', 
    Math.max(...prospects.map(p => p.automation_need_score || 0))
  );

  return prospects;
}

/**
 * Generate a single test prospect
 */
export function generateSingleTestProspect(industry: string, region: string): ProspectCandidate {
  return generateTestProspects(1, [industry], [region])[0];
}

/**
 * Simulate Apollo/LinkedIn/Crunchbase API response
 */
export function simulateThirdPartyAPI(industry: string, region: string, limit: number = 10) {
  console.log('[MockAPI] Simulating third-party business data API...');
  console.log('[MockAPI] Query:', { industry, region, limit });
  
  const prospects = generateTestProspects(limit, [industry], [region]);
  
  // Format as if it came from a real API
  return {
    success: true,
    data: {
      results: prospects.map(p => ({
        company_name: p.business_name,
        website_url: p.website,
        contact_email: p.contact_email,
        industry: p.industry,
        location: p.region,
        estimated_employees: p.metadata?.estimated_company_size || 10,
        annual_revenue_estimate: '$500K - $2M',
        founded_year: 2010 + Math.floor(Math.random() * 13),
        technologies_used: ['WordPress', 'Google Analytics', 'Mailchimp'],
        social_profiles: {
          linkedin: `https://linkedin.com/company/${p.business_name.toLowerCase().replace(/\s+/g, '-')}`,
          facebook: `https://facebook.com/${p.business_name.toLowerCase().replace(/\s+/g, '')}`
        }
      })),
      meta: {
        total: prospects.length,
        api: 'mock',
        timestamp: new Date().toISOString()
      }
    },
    message: 'Mock API response generated successfully'
  };
}

