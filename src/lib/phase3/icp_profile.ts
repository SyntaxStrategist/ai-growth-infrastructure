// ============================================
// Phase 3: Ideal Client Profile (ICP) System
// ============================================
// Defines Avenir AI's ideal client characteristics and scoring

export interface ICPProfile {
  // Company Characteristics
  companySize: {
    min: number;
    max: number;
    weight: number; // 0-1, importance in scoring
  };
  
  industries: {
    primary: string[]; // High-value industries
    secondary: string[]; // Medium-value industries
    weights: Record<string, number>; // Industry-specific weights
  };
  
  // Technology Stack
  techStack: {
    preferred: string[]; // Technologies that indicate good fit
    avoid: string[]; // Technologies that indicate poor fit
    weights: Record<string, number>;
  };
  
  // Business Characteristics
  businessStage: {
    preferred: string[]; // 'startup', 'growth', 'scale', 'enterprise'
    weights: Record<string, number>;
  };
  
  // Pain Points (what Avenir AI solves)
  painPoints: {
    automation: {
      weight: number;
      indicators: string[]; // Keywords that suggest automation needs
    };
    growth: {
      weight: number;
      indicators: string[]; // Keywords that suggest growth challenges
    };
    efficiency: {
      weight: number;
      indicators: string[]; // Keywords that suggest efficiency issues
    };
    aiReadiness: {
      weight: number;
      indicators: string[]; // Keywords that suggest AI adoption readiness
    };
  };
  
  // Geographic and Language
  geography: {
    preferred: string[]; // 'CA', 'US', 'FR', 'QC'
    weights: Record<string, number>;
  };
  
  // Contact Method Preferences
  contactMethods: {
    form: { weight: number; preferred: boolean };
    email: { weight: number; preferred: boolean };
    phone: { weight: number; preferred: boolean };
  };
}

// Avenir AI's Ideal Client Profile
export const AVENIR_ICP: ICPProfile = {
  companySize: {
    min: 10,
    max: 200,
    weight: 0.8 // High importance - sweet spot for AI automation
  },
  
  industries: {
    primary: [
      'Software Development',
      'Digital Marketing',
      'E-commerce',
      'SaaS',
      'Technology Consulting',
      'AI/ML Companies',
      'Marketing Technology',
      'Business Intelligence',
      'Data Analytics'
    ],
    secondary: [
      'Professional Services',
      'Real Estate Technology',
      'Healthcare Technology',
      'Financial Technology',
      'Education Technology',
      'Manufacturing Technology',
      'Retail Technology'
    ],
    weights: {
      'Software Development': 1.0,
      'Digital Marketing': 0.95,
      'E-commerce': 0.9,
      'SaaS': 0.95,
      'Technology Consulting': 0.85,
      'AI/ML Companies': 1.0,
      'Marketing Technology': 0.9,
      'Business Intelligence': 0.85,
      'Data Analytics': 0.85,
      'Professional Services': 0.7,
      'Real Estate Technology': 0.75,
      'Healthcare Technology': 0.8,
      'Financial Technology': 0.8,
      'Education Technology': 0.75,
      'Manufacturing Technology': 0.7,
      'Retail Technology': 0.75
    }
  },
  
  techStack: {
    preferred: [
      'WordPress',
      'Shopify',
      'HubSpot',
      'Salesforce',
      'Mailchimp',
      'Google Analytics',
      'Facebook Ads',
      'Google Ads',
      'LinkedIn',
      'Zapier',
      'Slack',
      'Microsoft 365',
      'Google Workspace',
      'AWS',
      'Azure',
      'React',
      'Node.js',
      'Python',
      'JavaScript'
    ],
    avoid: [
      'Legacy Systems',
      'Outdated CMS',
      'No Analytics',
      'Manual Processes'
    ],
    weights: {
      'WordPress': 0.8,
      'Shopify': 0.85,
      'HubSpot': 0.9,
      'Salesforce': 0.9,
      'Mailchimp': 0.7,
      'Google Analytics': 0.8,
      'Facebook Ads': 0.75,
      'Google Ads': 0.8,
      'LinkedIn': 0.7,
      'Zapier': 0.9,
      'Slack': 0.7,
      'Microsoft 365': 0.6,
      'Google Workspace': 0.7,
      'AWS': 0.8,
      'Azure': 0.8,
      'React': 0.85,
      'Node.js': 0.85,
      'Python': 0.9,
      'JavaScript': 0.8
    }
  },
  
  businessStage: {
    preferred: ['growth', 'scale'],
    weights: {
      'startup': 0.6,
      'growth': 0.9,
      'scale': 0.95,
      'enterprise': 0.7
    }
  },
  
  painPoints: {
    automation: {
      weight: 0.9,
      indicators: [
        'manual processes',
        'repetitive tasks',
        'time consuming',
        'inefficient',
        'automation',
        'workflow',
        'productivity',
        'streamline',
        'optimize',
        'scale',
        'growth',
        'bottleneck',
        'overwhelmed',
        'backlog',
        'delays'
      ]
    },
    growth: {
      weight: 0.85,
      indicators: [
        'growing',
        'scaling',
        'expansion',
        'new markets',
        'increased demand',
        'hiring',
        'team growth',
        'revenue growth',
        'customer acquisition',
        'market share',
        'competitive advantage',
        'innovation',
        'digital transformation'
      ]
    },
    efficiency: {
      weight: 0.8,
      indicators: [
        'efficiency',
        'productivity',
        'cost reduction',
        'time saving',
        'process improvement',
        'optimization',
        'performance',
        'ROI',
        'results',
        'outcomes',
        'metrics',
        'analytics',
        'insights',
        'data-driven'
      ]
    },
    aiReadiness: {
      weight: 0.75,
      indicators: [
        'artificial intelligence',
        'machine learning',
        'AI',
        'ML',
        'automation',
        'intelligent',
        'smart',
        'predictive',
        'analytics',
        'data science',
        'technology',
        'innovation',
        'digital',
        'transformation'
      ]
    }
  },
  
  geography: {
    preferred: ['CA', 'US', 'QC', 'FR'],
    weights: {
      'CA': 1.0,
      'US': 0.9,
      'QC': 0.95,
      'FR': 0.8
    }
  },
  
  contactMethods: {
    form: { weight: 0.8, preferred: true },
    email: { weight: 0.9, preferred: true },
    phone: { weight: 0.6, preferred: false }
  }
};

export interface ICPScore {
  overall: number; // 0-100
  breakdown: {
    companySize: number;
    industry: number;
    techStack: number;
    businessStage: number;
    painPoints: number;
    geography: number;
    contactMethods: number;
  };
  reasoning: string;
  confidence: number; // 0-1
  recommendations: string[];
}

/**
 * Calculate ICP score for a prospect
 */
export function calculateICPScore(prospect: any, icp: ICPProfile = AVENIR_ICP): ICPScore {
  const breakdown = {
    companySize: 0,
    industry: 0,
    techStack: 0,
    businessStage: 0,
    painPoints: 0,
    geography: 0,
    contactMethods: 0
  };
  
  const recommendations: string[] = [];
  let totalWeight = 0;
  let weightedScore = 0;
  
  // Company Size Scoring
  if (prospect.employeeCount) {
    const size = prospect.employeeCount;
    if (size >= icp.companySize.min && size <= icp.companySize.max) {
      breakdown.companySize = 100;
    } else if (size < icp.companySize.min) {
      breakdown.companySize = Math.max(0, 50 - (icp.companySize.min - size) * 2);
      recommendations.push('Company may be too small for AI automation investment');
    } else {
      breakdown.companySize = Math.max(0, 100 - (size - icp.companySize.max) * 0.5);
      recommendations.push('Large company may have complex procurement processes');
    }
  } else {
    breakdown.companySize = 50; // Neutral if unknown
    recommendations.push('Company size unknown - consider researching');
  }
  
  weightedScore += breakdown.companySize * icp.companySize.weight;
  totalWeight += icp.companySize.weight;
  
  // Industry Scoring
  if (prospect.industry) {
    const industry = prospect.industry.toLowerCase();
    if (icp.industries.primary.some(p => p.toLowerCase() === industry)) {
      breakdown.industry = 100;
    } else if (icp.industries.secondary.some(s => s.toLowerCase() === industry)) {
      breakdown.industry = 75;
    } else {
      breakdown.industry = 25;
      recommendations.push(`Industry '${prospect.industry}' may not be ideal for AI automation`);
    }
    
    // Apply industry-specific weight
    const industryWeight = icp.industries.weights[prospect.industry] || 0.5;
    breakdown.industry *= industryWeight;
  } else {
    breakdown.industry = 50;
    recommendations.push('Industry unknown - consider researching');
  }
  
  weightedScore += breakdown.industry * 0.8; // Industry weight
  totalWeight += 0.8;
  
  // Tech Stack Scoring (from website analysis)
  if (prospect.metadata?.techStack) {
    const techStack = prospect.metadata.techStack;
    let techScore = 0;
    let techCount = 0;
    
    for (const tech of techStack) {
      if (icp.techStack.preferred.includes(tech)) {
        techScore += icp.techStack.weights[tech] || 0.5;
        techCount++;
      } else if (icp.techStack.avoid.includes(tech)) {
        techScore -= 0.3;
        techCount++;
      }
    }
    
    breakdown.techStack = techCount > 0 ? Math.max(0, Math.min(100, (techScore / techCount) * 100)) : 50;
  } else {
    breakdown.techStack = 50;
    recommendations.push('Technology stack unknown - consider website analysis');
  }
  
  weightedScore += breakdown.techStack * 0.7; // Tech stack weight
  totalWeight += 0.7;
  
  // Business Stage Scoring (inferred from company size and growth indicators)
  if (prospect.employeeCount) {
    const size = prospect.employeeCount;
    let stage = 'startup';
    if (size > 50) stage = 'growth';
    if (size > 100) stage = 'scale';
    if (size > 500) stage = 'enterprise';
    
    breakdown.businessStage = icp.businessStage.weights[stage] * 100;
  } else {
    breakdown.businessStage = 50;
  }
  
  weightedScore += breakdown.businessStage * 0.6; // Business stage weight
  totalWeight += 0.6;
  
  // Pain Points Scoring (from website content analysis)
  if (prospect.metadata?.websiteContent) {
    const content = prospect.metadata.websiteContent.toLowerCase();
    let painScore = 0;
    let painWeight = 0;
    
    for (const [painType, config] of Object.entries(icp.painPoints)) {
      let typeScore = 0;
      for (const indicator of config.indicators) {
        if (content.includes(indicator.toLowerCase())) {
          typeScore += 1;
        }
      }
      typeScore = Math.min(100, (typeScore / config.indicators.length) * 100);
      painScore += typeScore * config.weight;
      painWeight += config.weight;
    }
    
    breakdown.painPoints = painWeight > 0 ? painScore / painWeight : 50;
  } else {
    breakdown.painPoints = 50;
    recommendations.push('Website content analysis needed for pain point assessment');
  }
  
  weightedScore += breakdown.painPoints * 0.8; // Pain points weight
  totalWeight += 0.8;
  
  // Geography Scoring
  if (prospect.region) {
    const region = prospect.region.toUpperCase();
    const regionWeight = icp.geography.weights[region] || 0.5;
    breakdown.geography = regionWeight * 100;
  } else {
    breakdown.geography = 50;
  }
  
  weightedScore += breakdown.geography * 0.5; // Geography weight
  totalWeight += 0.5;
  
  // Contact Methods Scoring
  let contactScore = 0;
  if (prospect.metadata?.form_scan?.has_form && icp.contactMethods.form.preferred) {
    contactScore += icp.contactMethods.form.weight * 50;
  }
  if (prospect.contact_email && icp.contactMethods.email.preferred) {
    contactScore += icp.contactMethods.email.weight * 50;
  }
  
  breakdown.contactMethods = Math.min(100, contactScore * 100);
  weightedScore += breakdown.contactMethods * 0.4; // Contact methods weight
  totalWeight += 0.4;
  
  // Calculate overall score
  const overall = totalWeight > 0 ? weightedScore / totalWeight : 50;
  
  // Generate reasoning
  const reasoning = generateICPReasoning(breakdown, overall);
  
  // Calculate confidence based on data completeness
  const confidence = calculateConfidence(prospect);
  
  return {
    overall: Math.round(overall),
    breakdown,
    reasoning,
    confidence,
    recommendations
  };
}

function generateICPReasoning(breakdown: any, overall: number): string {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  if (breakdown.companySize >= 80) strengths.push('ideal company size');
  else if (breakdown.companySize < 50) weaknesses.push('company size may not be optimal');
  
  if (breakdown.industry >= 80) strengths.push('high-value industry');
  else if (breakdown.industry < 50) weaknesses.push('industry may not be ideal');
  
  if (breakdown.techStack >= 80) strengths.push('modern technology stack');
  else if (breakdown.techStack < 50) weaknesses.push('technology stack needs assessment');
  
  if (breakdown.painPoints >= 80) strengths.push('clear automation needs');
  else if (breakdown.painPoints < 50) weaknesses.push('pain points unclear');
  
  let reasoning = `Overall ICP Score: ${Math.round(overall)}/100. `;
  
  if (strengths.length > 0) {
    reasoning += `Strengths: ${strengths.join(', ')}. `;
  }
  
  if (weaknesses.length > 0) {
    reasoning += `Areas for improvement: ${weaknesses.join(', ')}.`;
  }
  
  return reasoning;
}

function calculateConfidence(prospect: any): number {
  let confidence = 0;
  let factors = 0;
  
  if (prospect.employeeCount) { confidence += 0.2; factors++; }
  if (prospect.industry) { confidence += 0.2; factors++; }
  if (prospect.metadata?.techStack) { confidence += 0.2; factors++; }
  if (prospect.metadata?.websiteContent) { confidence += 0.2; factors++; }
  if (prospect.region) { confidence += 0.1; factors++; }
  if (prospect.contact_email) { confidence += 0.1; factors++; }
  
  return factors > 0 ? confidence / factors : 0.3; // Minimum 30% confidence
}

/**
 * Get ICP-optimized search criteria
 */
export function getICPOptimizedCriteria(): any {
  return {
    industries: AVENIR_ICP.industries.primary,
    companySize: {
      min: AVENIR_ICP.companySize.min,
      max: AVENIR_ICP.companySize.max
    },
    regions: AVENIR_ICP.geography.preferred,
    techStack: AVENIR_ICP.techStack.preferred,
    businessStage: AVENIR_ICP.businessStage.preferred,
    minICPScore: 70 // Minimum ICP score to consider
  };
}

/**
 * Generate personalized ICP based on client signup data
 */
export async function generatePersonalizedICP(clientId: string, signupData: {
  target_client_type?: string;
  average_deal_size?: string;
  main_business_goal?: string;
  biggest_challenge?: string;
}): Promise<void> {
  try {
    console.log('[ICP Generation] Starting personalized ICP generation for client:', clientId);
    console.log('[ICP Generation] Signup data:', signupData);

    // Get base Avenir ICP profile
    const baseICP = getAvenirICPProfile();
    
    // Create personalized ICP based on signup data
    const personalizedICP = {
      ...baseICP,
      clientCustomizations: {
        targetClientType: signupData.target_client_type || null,
        dealSizeRange: parseDealSize(signupData.average_deal_size),
        businessGoal: signupData.main_business_goal || null,
        primaryChallenge: signupData.biggest_challenge || null,
      },
      // Adjust weights based on client goals
      adjustedWeights: adjustWeightsForClient(baseICP, signupData),
      // Add client-specific insights
      clientInsights: generateClientInsights(signupData),
    };

    console.log('[ICP Generation] Generated personalized ICP:', {
      clientId,
      hasCustomizations: !!personalizedICP.clientCustomizations,
      businessGoal: personalizedICP.clientCustomizations.businessGoal,
      primaryChallenge: personalizedICP.clientCustomizations.primaryChallenge
    });

    // For now, we'll log the personalized ICP
    // In the future, this could be saved to a client_icp_profiles table
    // or used to enhance prospect scoring in real-time
    
    console.log('[ICP Generation] ✅ Personalized ICP generated successfully for client:', clientId);
    
  } catch (error) {
    console.error('[ICP Generation] ❌ Failed to generate personalized ICP:', error);
    throw error;
  }
}

/**
 * Parse deal size string into structured data
 */
function parseDealSize(dealSize?: string): { min?: number; max?: number; currency?: string } | null {
  if (!dealSize) return null;
  
  // Extract numbers and currency from strings like "$2,000–$5,000" or "2000-5000"
  const match = dealSize.match(/(\$?)(\d{1,3}(?:,\d{3})*)\s*[-–]\s*(\$?)(\d{1,3}(?:,\d{3})*)/);
  
  if (match) {
    const [, currency1, minStr, currency2, maxStr] = match;
    const currency = currency1 || currency2 || '$';
    const min = parseInt(minStr.replace(/,/g, ''));
    const max = parseInt(maxStr.replace(/,/g, ''));
    
    return { min, max, currency };
  }
  
  return null;
}

/**
 * Adjust ICP weights based on client business goals
 */
function adjustWeightsForClient(baseICP: ICPProfile, signupData: any): Record<string, number> {
  const weights = { ...baseICP.weights };
  
  // Adjust weights based on business goal
  if (signupData.main_business_goal) {
    switch (signupData.main_business_goal) {
      case 'Generate more qualified leads':
        weights.leadQuality = Math.min(1.0, weights.leadQuality * 1.2);
        weights.conversionProbability = Math.min(1.0, weights.conversionProbability * 1.1);
        break;
      case 'Improve follow-ups and conversions':
        weights.conversionProbability = Math.min(1.0, weights.conversionProbability * 1.3);
        weights.engagementScore = Math.min(1.0, weights.engagementScore * 1.2);
        break;
      case 'Nurture existing clients':
        weights.engagementScore = Math.min(1.0, weights.engagementScore * 1.4);
        weights.retentionScore = Math.min(1.0, weights.retentionScore * 1.3);
        break;
      case 'Save time with automation':
        weights.automationReadiness = Math.min(1.0, weights.automationReadiness * 1.3);
        weights.efficiencyScore = Math.min(1.0, weights.efficiencyScore * 1.2);
        break;
    }
  }
  
  return weights;
}

/**
 * Generate client-specific insights from signup data
 */
function generateClientInsights(signupData: any): Record<string, any> {
  const insights: Record<string, any> = {};
  
  if (signupData.target_client_type) {
    insights.targetClientProfile = {
      description: signupData.target_client_type,
      keywords: extractKeywords(signupData.target_client_type),
      industryHints: extractIndustryHints(signupData.target_client_type)
    };
  }
  
  if (signupData.biggest_challenge) {
    insights.primaryPainPoint = {
      description: signupData.biggest_challenge,
      category: categorizeChallenge(signupData.biggest_challenge),
      urgency: assessUrgency(signupData.biggest_challenge)
    };
  }
  
  return insights;
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an'];
  return text.toLowerCase()
    .split(/\W+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .slice(0, 10); // Limit to 10 keywords
}

/**
 * Extract industry hints from target client type
 */
function extractIndustryHints(text: string): string[] {
  const industries = ['e-commerce', 'real estate', 'construction', 'technology', 'healthcare', 'finance', 'education', 'retail', 'manufacturing'];
  return industries.filter(industry => 
    text.toLowerCase().includes(industry.toLowerCase())
  );
}

/**
 * Categorize business challenge
 */
function categorizeChallenge(challenge: string): string {
  const lowerChallenge = challenge.toLowerCase();
  
  if (lowerChallenge.includes('lead') || lowerChallenge.includes('prospect')) return 'lead_generation';
  if (lowerChallenge.includes('convert') || lowerChallenge.includes('sale')) return 'conversion';
  if (lowerChallenge.includes('follow') || lowerChallenge.includes('nurture')) return 'follow_up';
  if (lowerChallenge.includes('time') || lowerChallenge.includes('automation')) return 'efficiency';
  if (lowerChallenge.includes('client') || lowerChallenge.includes('customer')) return 'client_management';
  
  return 'general';
}

/**
 * Assess urgency level of challenge
 */
function assessUrgency(challenge: string): 'low' | 'medium' | 'high' {
  const lowerChallenge = challenge.toLowerCase();
  
  if (lowerChallenge.includes('urgent') || lowerChallenge.includes('critical') || lowerChallenge.includes('immediately')) {
    return 'high';
  }
  
  if (lowerChallenge.includes('important') || lowerChallenge.includes('priority') || lowerChallenge.includes('soon')) {
    return 'medium';
  }
  
  return 'low';
}
