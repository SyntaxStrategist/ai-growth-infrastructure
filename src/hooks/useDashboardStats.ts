import { useState, useCallback, useEffect } from 'react';
import type { Lead } from './useLeadManagement';

export type DashboardStats = {
  total: number;
  avgConfidence: number;
  topIntent: string;
  rawTopIntent: string;
  highUrgency: number;
};

export function useDashboardStats(leads: Lead[], locale: string) {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    avgConfidence: 0,
    topIntent: '',
    rawTopIntent: '',
    highUrgency: 0,
  });
  const [isIntentTruncated, setIsIntentTruncated] = useState(false);
  const [originalIntentCache, setOriginalIntentCache] = useState<string | null>(null);

  const calculateStats = useCallback((leadsData: Lead[]): DashboardStats => {
    if (leadsData.length === 0) {
      return {
        total: 0,
        avgConfidence: 0,
        topIntent: '',
        rawTopIntent: '',
        highUrgency: 0,
      };
    }

    const total = leadsData.length;
    const avgConfidence = leadsData.reduce((sum, lead) => sum + lead.confidence_score, 0) / total;
    const highUrgency = leadsData.filter(lead => lead.urgency === 'High').length;

    // Calculate most common intent
    const intentCounts: Record<string, number> = {};
    leadsData.forEach(lead => {
      const intent = lead.intent || 'Unknown';
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;
    });

    const topIntent = Object.entries(intentCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';

    return {
      total,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      topIntent,
      rawTopIntent: topIntent,
      highUrgency,
    };
  }, []);

  const updateStats = useCallback((leadsData: Lead[]) => {
    const newStats = calculateStats(leadsData);
    setStats(newStats);
  }, [calculateStats]);

  // Check if intent text is truncated
  const checkTruncation = useCallback(() => {
    const intentElement = document.querySelector('[data-intent-text]') as HTMLDivElement;
    if (intentElement) {
      const truncated = intentElement.scrollWidth > intentElement.clientWidth;
      setIsIntentTruncated(truncated);
    }
  }, []);

  // Check truncation on mount and when stats change
  useEffect(() => {
    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [stats.topIntent, checkTruncation]);

  // Translate topIntent when stats change (with cache to prevent re-render loop)
  useEffect(() => {
    (async () => {
      const rawIntent = stats?.rawTopIntent || stats?.topIntent;

      if (
        rawIntent &&
        rawIntent !== 'Aucun' &&
        rawIntent !== 'None' &&
        rawIntent !== originalIntentCache
      ) {
        // Import translateIntent dynamically to avoid circular dependencies
        const { translateIntent } = await import('@/lib/translateIntent');
        const translated = await translateIntent(rawIntent, locale);
        setStats(prev => ({ ...prev, topIntent: translated }));
        setOriginalIntentCache(rawIntent);
      }
    })();
  }, [stats?.rawTopIntent, locale, originalIntentCache]);

  // Clear translation cache when locale changes
  useEffect(() => {
    setOriginalIntentCache(null);
  }, [locale]);

  return {
    stats,
    setStats,
    isIntentTruncated,
    setIsIntentTruncated,
    originalIntentCache,
    setOriginalIntentCache,
    updateStats,
    checkTruncation,
  };
}
