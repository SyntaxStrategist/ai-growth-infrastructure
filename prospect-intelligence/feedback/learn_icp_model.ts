// ============================================
// ICP Learning Model - Learns which prospects respond best
// ============================================

import { IndustryPerformance, OutreachLog, ProspectCandidate } from '../types';

/**
 * Update industry performance based on outreach results
 */
export async function updateIndustryPerformance(
  industry: string,
  outreachResults: OutreachLog[]
): Promise<IndustryPerformance> {
  console.log('[ICPLearning] ============================================');
  console.log('[ICPLearning] Updating performance for industry:', industry);
  console.log('[ICPLearning] Outreach count:', outreachResults.length);

  const totalContacted = outreachResults.length;
  const totalOpened = outreachResults.filter(r => r.opened_at).length;
  const totalReplied = outreachResults.filter(r => r.replied_at).length;

  const openRate = totalContacted > 0 ? (totalOpened / totalContacted) * 100 : 0;
  const replyRate = totalContacted > 0 ? (totalReplied / totalContacted) * 100 : 0;

  // Calculate average response time for replies
  const responseTimes = outreachResults
    .filter(r => r.sent_at && r.replied_at)
    .map(r => {
      const sent = new Date(r.sent_at!).getTime();
      const replied = new Date(r.replied_at!).getTime();
      return (replied - sent) / (1000 * 60 * 60); // hours
    });

  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : null;

  // Calculate priority score (0-100)
  // Higher reply rate and faster response = higher priority
  const priorityScore = calculatePriorityScore(replyRate, avgResponseTime);

  console.log('[ICPLearning] Open Rate:', openRate.toFixed(1) + '%');
  console.log('[ICPLearning] Reply Rate:', replyRate.toFixed(1) + '%');
  console.log('[ICPLearning] Avg Response Time:', avgResponseTime ? avgResponseTime.toFixed(1) + 'h' : 'N/A');
  console.log('[ICPLearning] Priority Score:', priorityScore);

  return {
    industry,
    total_contacted: totalContacted,
    total_opened: totalOpened,
    total_replied: totalReplied,
    open_rate: Math.round(openRate * 10) / 10,
    reply_rate: Math.round(replyRate * 10) / 10,
    avg_response_time_hours: avgResponseTime,
    priority_score: priorityScore,
    last_updated: new Date()
  };
}

/**
 * Calculate priority score based on engagement metrics
 */
function calculatePriorityScore(
  replyRate: number,
  avgResponseTime: number | null
): number {
  // Base score from reply rate (0-70 points)
  let score = replyRate * 0.7;

  // Bonus points for fast response (0-30 points)
  if (avgResponseTime !== null) {
    if (avgResponseTime <= 24) score += 30;
    else if (avgResponseTime <= 48) score += 20;
    else if (avgResponseTime <= 72) score += 10;
  }

  return Math.min(Math.round(score), 100);
}

/**
 * Get top performing industries ranked by priority score
 */
export function getTopIndustries(
  performances: IndustryPerformance[],
  limit: number = 5
): IndustryPerformance[] {
  return [...performances]
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
    .slice(0, limit);
}

/**
 * Recommend next industry to target based on performance
 */
export function recommendNextIndustry(
  performances: IndustryPerformance[],
  alreadyTargeted: string[]
): string | null {
  // Filter out already targeted industries
  const available = performances.filter(
    p => !alreadyTargeted.includes(p.industry)
  );

  if (available.length === 0) return null;

  // Find highest priority score
  const recommended = available.reduce((best, current) => {
    const bestScore = best.priority_score || 0;
    const currentScore = current.priority_score || 0;
    return currentScore > bestScore ? current : best;
  });

  console.log('[ICPLearning] Recommended next industry:', recommended.industry);
  console.log('[ICPLearning] Priority score:', recommended.priority_score);

  return recommended.industry;
}

/**
 * Analyze prospect characteristics of successful conversions
 */
export async function analyzeSuccessPatterns(
  prospects: ProspectCandidate[],
  outreachLogs: OutreachLog[]
): Promise<Map<string, number>> {
  console.log('[ICPLearning] ============================================');
  console.log('[ICPLearning] Analyzing success patterns');

  const patterns = new Map<string, number>();

  // Get prospects who replied
  const repliedLogs = outreachLogs.filter(log => log.replied_at);
  const repliedProspects = prospects.filter(p =>
    repliedLogs.some(log => log.prospect_id === p.id)
  );

  console.log('[ICPLearning] Total prospects:', prospects.length);
  console.log('[ICPLearning] Replied:', repliedProspects.length);

  // Analyze by industry
  const industrySuccess = new Map<string, { total: number; replied: number }>();
  
  for (const prospect of prospects) {
    const industry = prospect.industry || 'Unknown';
    const stats = industrySuccess.get(industry) || { total: 0, replied: 0 };
    stats.total++;
    
    if (repliedProspects.includes(prospect)) {
      stats.replied++;
    }
    
    industrySuccess.set(industry, stats);
  }

  // Calculate success rates
  industrySuccess.forEach((stats, industry) => {
    const successRate = (stats.replied / stats.total) * 100;
    patterns.set(`industry:${industry}`, successRate);
    console.log('[ICPLearning]', industry, '→', successRate.toFixed(1) + '% success rate');
  });

  // Analyze by region
  const regionSuccess = new Map<string, { total: number; replied: number }>();
  
  for (const prospect of prospects) {
    const region = prospect.region || 'Unknown';
    const stats = regionSuccess.get(region) || { total: 0, replied: 0 };
    stats.total++;
    
    if (repliedProspects.includes(prospect)) {
      stats.replied++;
    }
    
    regionSuccess.set(region, stats);
  }

  regionSuccess.forEach((stats, region) => {
    const successRate = (stats.replied / stats.total) * 100;
    patterns.set(`region:${region}`, successRate);
  });

  return patterns;
}

/**
 * Generate insights report for admin dashboard
 */
export function generateInsightsReport(
  performances: IndustryPerformance[],
  patterns: Map<string, number>
): string {
  console.log('[ICPLearning] ============================================');
  console.log('[ICPLearning] Generating insights report');

  const topIndustries = getTopIndustries(performances, 3);
  
  let report = '📊 Prospect Intelligence Insights\n\n';
  
  report += '🏆 Top Performing Industries:\n';
  topIndustries.forEach((p, index) => {
    report += `${index + 1}. ${p.industry} - ${p.reply_rate}% reply rate (${p.total_replied}/${p.total_contacted})\n`;
  });
  
  report += '\n💡 Key Findings:\n';
  
  const bestIndustry = topIndustries[0];
  if (bestIndustry) {
    report += `• ${bestIndustry.industry} responds ${bestIndustry.reply_rate}x better than average\n`;
  }
  
  const avgResponseTime = performances
    .filter(p => p.avg_response_time_hours)
    .reduce((sum, p) => sum + (p.avg_response_time_hours || 0), 0) / performances.length;
  
  if (avgResponseTime) {
    report += `• Average response time: ${avgResponseTime.toFixed(1)} hours\n`;
  }
  
  report += '\n📈 Recommendations:\n';
  const recommended = recommendNextIndustry(performances, []);
  if (recommended) {
    report += `• Focus next campaign on: ${recommended}\n`;
  }
  report += `• Continue testing ${bestIndustry?.industry || 'top performers'}\n`;
  
  return report;
}

/**
 * Store learning data for future reference
 */
export async function persistLearningData(
  performances: IndustryPerformance[],
  patterns: Map<string, number>
): Promise<void> {
  console.log('[ICPLearning] ============================================');
  console.log('[ICPLearning] Persisting learning data');
  console.log('[ICPLearning] Industries tracked:', performances.length);
  console.log('[ICPLearning] Patterns identified:', patterns.size);

  // TODO: Store in Supabase prospect_industry_performance table
  // For now, just log
  console.log('[ICPLearning] ✅ Learning data ready for storage');
}

