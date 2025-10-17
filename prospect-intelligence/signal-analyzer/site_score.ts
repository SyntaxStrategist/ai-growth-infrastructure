// ============================================
// Site Scorer - Calculates automation need scores
// ============================================

import { FormTestResult, SignalScore, ProspectCandidate } from '../types';

/**
 * Calculate comprehensive automation need score
 */
export function calculateAutomationScore(
  prospect: ProspectCandidate,
  formTest: FormTestResult
): SignalScore {
  console.log('[SiteScore] ============================================');
  console.log('[SiteScore] Calculating score for:', prospect.business_name);

  // Component scores (0-100)
  const responseTimeScore = calculateResponseTimeScore(formTest.response_time_minutes || 0);
  const autoresponderScore = calculateAutoresponderScore(
    formTest.has_autoresponder || false,
    formTest.autoresponder_tone || 'none'
  );

  // Overall response quality score (0-100)
  // Higher score = better current response = lower automation need
  const overallScore = Math.round((responseTimeScore * 0.6) + (autoresponderScore * 0.4));

  // Automation need score (inverse of quality)
  // Higher score = worse current response = higher automation need
  const automationNeedScore = 100 - overallScore;

  console.log('[SiteScore] Response Time Score:', responseTimeScore);
  console.log('[SiteScore] Autoresponder Score:', autoresponderScore);
  console.log('[SiteScore] Overall Quality Score:', overallScore);
  console.log('[SiteScore] Automation Need Score:', automationNeedScore);

  return {
    responseTime: formTest.response_time_minutes || 0,
    hasAutoresponder: formTest.has_autoresponder || false,
    autoresponderQuality: formTest.autoresponder_tone || 'none',
    overallScore,
    automationNeedScore
  };
}

/**
 * Score based on response time
 * Faster = higher score (better)
 */
function calculateResponseTimeScore(minutes: number): number {
  if (minutes === 0) return 0; // No response
  if (minutes <= 5) return 100; // Instant (< 5 min)
  if (minutes <= 15) return 90; // Very fast (< 15 min)
  if (minutes <= 30) return 75; // Fast (< 30 min)
  if (minutes <= 60) return 60; // Moderate (< 1 hour)
  if (minutes <= 180) return 40; // Slow (< 3 hours)
  if (minutes <= 720) return 20; // Very slow (< 12 hours)
  return 5; // Extremely slow (> 12 hours)
}

/**
 * Score based on autoresponder presence and quality
 * Better autoresponder = higher score
 */
function calculateAutoresponderScore(
  hasAutoresponder: boolean,
  tone: 'robotic' | 'human' | 'personalized' | 'none'
): number {
  if (!hasAutoresponder || tone === 'none') return 0; // No autoresponder
  
  const toneScores = {
    robotic: 30,      // Generic automated message
    human: 60,        // Friendly but generic
    personalized: 85  // Personalized with context
  };

  return toneScores[tone] || 0;
}

/**
 * Determine priority level based on automation need score
 */
export function getPriorityLevel(automationNeedScore: number): 'urgent' | 'high' | 'medium' | 'low' {
  if (automationNeedScore >= 85) return 'urgent';
  if (automationNeedScore >= 70) return 'high';
  if (automationNeedScore >= 50) return 'medium';
  return 'low';
}

/**
 * Get recommended action based on score
 */
export function getRecommendedAction(automationNeedScore: number): string {
  if (automationNeedScore >= 85) {
    return 'Contact immediately - critical automation gap';
  }
  if (automationNeedScore >= 70) {
    return 'Contact soon - significant opportunity';
  }
  if (automationNeedScore >= 50) {
    return 'Add to nurture list - moderate opportunity';
  }
  return 'Monitor - low priority';
}

/**
 * Batch calculate scores for multiple prospects
 */
export function batchCalculateScores(
  prospects: ProspectCandidate[],
  formTests: FormTestResult[]
): Map<string, SignalScore> {
  console.log('[SiteScore] ============================================');
  console.log('[SiteScore] Batch calculating scores for', prospects.length, 'prospects');

  const scores = new Map<string, SignalScore>();

  for (const prospect of prospects) {
    const formTest = formTests.find(t => t.prospect_id === prospect.id);
    if (formTest && prospect.id) {
      const score = calculateAutomationScore(prospect, formTest);
      scores.set(prospect.id, score);
    }
  }

  console.log('[SiteScore] ✅ Calculated', scores.size, 'scores');
  return scores;
}

/**
 * Sort prospects by automation need (highest first)
 */
export function sortByAutomationNeed(
  prospects: ProspectCandidate[]
): ProspectCandidate[] {
  return [...prospects].sort((a, b) => {
    const scoreA = a.automation_need_score || 0;
    const scoreB = b.automation_need_score || 0;
    return scoreB - scoreA;
  });
}

/**
 * Filter prospects by minimum automation need score
 */
export function filterByMinScore(
  prospects: ProspectCandidate[],
  minScore: number
): ProspectCandidate[] {
  return prospects.filter(p => (p.automation_need_score || 0) >= minScore);
}

