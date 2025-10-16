'use client';

import { motion } from 'framer-motion';

interface Lead {
  id: string;
  name: string;
  email: string;
  message: string;
  current_tag?: string | null;
  ai_summary?: string | null;
  timestamp: string;
  last_updated?: string | null;
  confidence_score?: number | null;
  intent?: string | null;
  tone?: string | null;
  urgency?: string | null;
}

interface ConvertedLeadsProps {
  leads: Lead[];
  locale: string;
}

export default function ConvertedLeads({ leads, locale }: ConvertedLeadsProps) {
  const isFrench = locale === 'fr';
  
  const t = {
    title: isFrench ? 'Leads convertis' : 'Converted Leads',
    noLeads: isFrench ? 'Aucun lead converti pour le moment.' : 'No converted leads yet.',
    dateConverted: isFrench ? 'Date de conversion' : 'Date Converted',
    lastAnalysis: isFrench ? 'Dernière analyse IA' : 'Last AI Analysis',
    intent: isFrench ? 'Intention' : 'Intent',
    tone: isFrench ? 'Ton' : 'Tone',
    urgency: isFrench ? 'Urgence' : 'Urgency',
    confidence: isFrench ? 'Confiance' : 'Confidence',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isFrench 
      ? date.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Filter only converted leads
  const convertedLeads = leads.filter(lead => 
    lead.current_tag === 'Converted' || lead.current_tag === 'Converti'
  );

  if (convertedLeads.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            {t.title}
          </h2>
        </div>
        
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-8 text-center">
          <p className="text-white/50">{t.noLeads}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
          <span className="text-2xl">🎯</span>
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          {t.title}
        </h2>
        <div className="ml-auto px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium shadow-[0_0_15px_rgba(34,197,94,0.2)]">
          {convertedLeads.length} {isFrench ? 'converti(s)' : 'converted'}
        </div>
      </div>

      <div className="space-y-4">
        {convertedLeads.map((lead, index) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="rounded-xl border border-green-500/20 bg-gradient-to-br from-black/60 to-green-900/10 backdrop-blur-sm p-6 hover:border-green-500/40 hover:shadow-[0_0_30px_rgba(34,197,94,0.2)] transition-all duration-300"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-white">{lead.name}</h3>
                  <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-medium shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                    ✓ {lead.current_tag}
                  </span>
                </div>
                <p className="text-sm text-white/60">{lead.email}</p>
              </div>
              
              <div className="text-right">
                <p className="text-xs text-white/40 mb-1">{t.dateConverted}</p>
                <p className="text-sm text-white/80 font-medium">
                  {formatDate(lead.last_updated || lead.timestamp)}
                </p>
              </div>
            </div>

            {/* AI Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {lead.intent && (
                <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-white/50 mb-1">{t.intent}</p>
                  <p className="text-sm text-white font-medium capitalize">{lead.intent}</p>
                </div>
              )}
              {lead.tone && (
                <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-white/50 mb-1">{t.tone}</p>
                  <p className="text-sm text-white font-medium capitalize">{lead.tone}</p>
                </div>
              )}
              {lead.urgency && (
                <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-white/50 mb-1">{t.urgency}</p>
                  <p className="text-sm text-white font-medium capitalize">{lead.urgency}</p>
                </div>
              )}
              {lead.confidence_score !== null && (
                <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-white/50 mb-1">{t.confidence}</p>
                  <p className="text-sm text-white font-medium">
                    {Math.round((lead.confidence_score || 0) * 100)}%
                  </p>
                </div>
              )}
            </div>

            {/* AI Summary */}
            {lead.ai_summary && (
              <div className="rounded-lg bg-white/5 border border-white/10 p-4">
                <p className="text-xs text-white/50 mb-2">{t.lastAnalysis}</p>
                <p className="text-sm text-white/80 leading-relaxed">{lead.ai_summary}</p>
              </div>
            )}

            {/* Original Message Preview */}
            {lead.message && (
              <details className="mt-4 group">
                <summary className="text-xs text-white/50 cursor-pointer hover:text-white/70 transition-colors list-none flex items-center gap-2">
                  <span className="transform group-open:rotate-90 transition-transform">▶</span>
                  {isFrench ? 'Voir le message original' : 'View original message'}
                </summary>
                <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70">
                  {lead.message}
                </div>
              </details>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

