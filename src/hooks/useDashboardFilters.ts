import { useState, useCallback, useMemo } from 'react';
import type { Lead } from './useLeadManagement';

export type FilterState = {
  urgency: string;
  language: string;
  minConfidence: number;
};

export type ActiveTab = 'active' | 'archived' | 'deleted' | 'converted';

export function useDashboardFilters(leads: Lead[]) {
  const [filter, setFilter] = useState<FilterState>({ 
    urgency: 'all', 
    language: 'all', 
    minConfidence: 0 
  });
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<ActiveTab>('active');

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Tab filtering
      if (activeTab === 'active' && (lead.archived || lead.deleted)) return false;
      if (activeTab === 'archived' && !lead.archived) return false;
      if (activeTab === 'deleted' && !lead.deleted) return false;
      if (activeTab === 'converted' && !lead.current_tag?.includes('Converted')) return false;

      // Urgency filtering
      if (filter.urgency !== 'all' && lead.urgency !== filter.urgency) return false;

      // Language filtering
      if (filter.language !== 'all' && lead.language !== filter.language) return false;

      // Confidence filtering
      if (lead.confidence_score < filter.minConfidence) return false;

      // Tag filtering
      if (tagFilter !== 'all' && lead.current_tag !== tagFilter) return false;

      return true;
    });
  }, [leads, filter, tagFilter, activeTab]);

  const updateFilter = useCallback((newFilter: Partial<FilterState>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilter({ urgency: 'all', language: 'all', minConfidence: 0 });
    setTagFilter('all');
    setActiveTab('active');
  }, []);

  return {
    filter,
    setFilter,
    tagFilter,
    setTagFilter,
    activeTab,
    setActiveTab,
    filteredLeads,
    updateFilter,
    resetFilters,
  };
}
