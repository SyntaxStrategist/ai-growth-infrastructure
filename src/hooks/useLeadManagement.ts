import { useState, useCallback } from 'react';

export type Lead = {
  id: string;
  name: string;
  email: string;
  message: string;
  ai_summary: string;
  intent: string;
  tone: string;
  urgency: string;
  confidence_score: number;
  timestamp: string;
  last_updated: string | null;
  relationship_insight?: string;
  current_tag?: string | null;
  language?: string;
  archived?: boolean;
  deleted?: boolean;
};

export type LeadAction = {
  id: string;
  lead_id: string;
  action: string;
  tag: string | null;
  performed_by: string;
  timestamp: string;
};

export function useLeadManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [recentActions, setRecentActions] = useState<LeadAction[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const updateLead = useCallback((leadId: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, ...updates } : lead
    ));
    setAllLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, ...updates } : lead
    ));
  }, []);

  const removeLead = useCallback((leadId: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== leadId));
    setAllLeads(prev => prev.filter(lead => lead.id !== leadId));
  }, []);

  const addLead = useCallback((newLead: Lead) => {
    setLeads(prev => [newLead, ...prev]);
    setAllLeads(prev => [newLead, ...prev]);
  }, []);

  const setLeadsData = useCallback((newLeads: Lead[]) => {
    setLeads(newLeads);
    setAllLeads(newLeads);
  }, []);

  return {
    leads,
    setLeads,
    recentActions,
    setRecentActions,
    allLeads,
    setAllLeads,
    loading,
    setLoading,
    hasError,
    setHasError,
    updateLead,
    removeLead,
    addLead,
    setLeadsData,
  };
}
