"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { LeadMemoryRecord } from "../../../lib/supabase";

export default function Dashboard() {
  const [leads, setLeads] = useState<LeadMemoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ urgency: 'all', language: 'all', minConfidence: 0 });
  const [stats, setStats] = useState({ total: 0, avgConfidence: 0, topIntent: '' });

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 10000); // Refresh every 10s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchLeads() {
    try {
      const res = await fetch('/api/leads?limit=100');
      const json = await res.json();
      if (json.success) {
        const leadsData = json.data || [];
        setLeads(leadsData);
        calculateStats(leadsData);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(leadsData: LeadMemoryRecord[]) {
    const total = leadsData.length;
    const avgConfidence = leadsData.reduce((sum, l) => sum + (l.confidence_score || 0), 0) / total || 0;
    const intentCounts: Record<string, number> = {};
    leadsData.forEach(l => {
      if (l.intent) {
        intentCounts[l.intent] = (intentCounts[l.intent] || 0) + 1;
      }
    });
    const topIntent = Object.keys(intentCounts).sort((a, b) => intentCounts[b] - intentCounts[a])[0] || 'N/A';
    setStats({ total, avgConfidence, topIntent });
  }

  const filteredLeads = leads.filter(lead => {
    if (filter.urgency !== 'all' && lead.urgency !== filter.urgency) return false;
    if (filter.language !== 'all' && lead.language !== filter.language) return false;
    if ((lead.confidence_score || 0) < filter.minConfidence) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Intelligence Dashboard</h1>
          <p className="text-white/60">Real-time lead intelligence from Supabase</p>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <div className="text-sm text-white/60 mb-1">Total Leads</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <div className="text-sm text-white/60 mb-1">Avg Confidence</div>
            <div className="text-3xl font-bold">{(stats.avgConfidence * 100).toFixed(0)}%</div>
          </div>
          <div className="rounded-lg border border-white/10 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <div className="text-sm text-white/60 mb-1">Top Intent</div>
            <div className="text-xl font-semibold truncate">{stats.topIntent}</div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <select
            value={filter.urgency}
            onChange={(e) => setFilter({ ...filter, urgency: e.target.value })}
            className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm"
          >
            <option value="all">All Urgency</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={filter.language}
            onChange={(e) => setFilter({ ...filter, language: e.target.value })}
            className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm"
          >
            <option value="all">All Languages</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>

          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={filter.minConfidence}
            onChange={(e) => setFilter({ ...filter, minConfidence: parseFloat(e.target.value) })}
            className="flex-1 max-w-xs"
          />
          <span className="text-sm text-white/60">Min Confidence: {(filter.minConfidence * 100).toFixed(0)}%</span>
        </motion.div>

        {/* Leads Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-3"
        >
          {filteredLeads.map((lead, idx) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="rounded-lg border border-white/10 p-5 bg-white/5 hover:bg-white/10 hover:border-blue-400/30 transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-white/50 text-xs block mb-1">Name</span>
                  <p className="font-semibold">{lead.name}</p>
                </div>
                <div>
                  <span className="text-white/50 text-xs block mb-1">Email</span>
                  <p className="text-blue-400">{lead.email}</p>
                </div>
                <div>
                  <span className="text-white/50 text-xs block mb-1">Language</span>
                  <p className="uppercase text-xs font-mono">{lead.language}</p>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="text-white/50 text-xs block mb-1">Message</span>
                  <p className="text-white/80 italic">&quot;{lead.message}&quot;</p>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="text-white/50 text-xs block mb-1">AI Summary</span>
                  <p className="text-white/90">{lead.ai_summary || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-white/50 text-xs block mb-1">Intent</span>
                  <p className="text-blue-300 font-medium">{lead.intent || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-white/50 text-xs block mb-1">Tone</span>
                  <p>{lead.tone || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-white/50 text-xs block mb-1">Urgency</span>
                  <p className={
                    lead.urgency === 'High' ? 'text-red-400 font-semibold' :
                    lead.urgency === 'Medium' ? 'text-yellow-400' :
                    'text-green-400'
                  }>
                    {lead.urgency || 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="text-white/50 text-xs block mb-1">Confidence</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${(lead.confidence_score || 0) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-mono">{((lead.confidence_score || 0) * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="text-white/50 text-xs block mb-1">Timestamp</span>
                  <p className="text-xs font-mono text-white/60">{new Date(lead.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredLeads.length === 0 && (
            <div className="text-center py-12 text-white/50">
              No leads match the current filters
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

