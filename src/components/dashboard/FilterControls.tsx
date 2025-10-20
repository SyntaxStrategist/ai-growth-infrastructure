"use client";

import { motion } from 'framer-motion';
import type { FilterState, ActiveTab } from '@/hooks/useDashboardFilters';
import { FilterControlsSkeleton } from '@/components/SkeletonLoader';

interface FilterControlsProps {
  filter: FilterState;
  activeTab: ActiveTab;
  isFrench: boolean;
  onFilterChange: (newFilter: Partial<FilterState>) => void;
  onTabChange: (tab: ActiveTab) => void;
  loading?: boolean;
}

export default function FilterControls({
  filter,
  activeTab,
  isFrench,
  onFilterChange,
  onTabChange,
  loading = false,
}: FilterControlsProps) {
  const translations = {
    filters: {
      all: isFrench ? 'Tous' : 'All',
      urgency: isFrench ? 'Urgence' : 'Urgency',
      high: isFrench ? 'Élevée' : 'High',
      medium: isFrench ? 'Moyenne' : 'Medium',
      low: isFrench ? 'Faible' : 'Low',
      language: isFrench ? 'Langue' : 'Language',
      minConfidence: isFrench ? 'Confiance Min' : 'Min Confidence',
    },
    tabs: {
      active: isFrench ? 'Leads Actifs' : 'Active Leads',
      archived: isFrench ? 'Leads Archivés' : 'Archived Leads',
      deleted: isFrench ? 'Leads Supprimés' : 'Deleted Leads',
      converted: isFrench ? 'Leads Convertis' : 'Converted Leads',
    },
  };

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'active', label: translations.tabs.active },
    { key: 'archived', label: translations.tabs.archived },
    { key: 'deleted', label: translations.tabs.deleted },
    { key: 'converted', label: translations.tabs.converted },
  ];

  if (loading) {
    return <FilterControlsSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10"
    >
      <h2 className="text-xl font-semibold mb-4 text-purple-400">
        {isFrench ? 'Filtres et Navigation' : 'Filters & Navigation'}
      </h2>
      
      {/* Tab Navigation */}
      <div className="mb-4 flex gap-2 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 ${
              activeTab === tab.key
                ? tab.key === 'converted'
                  ? 'border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                  : 'border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                : 'border-transparent text-white/60 hover:text-white/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Urgency Filter */}
        <div>
          <label className="block text-sm text-white/70 mb-2">
            {translations.filters.urgency}
          </label>
          <select
            value={filter.urgency}
            onChange={(e) => onFilterChange({ urgency: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none"
          >
            <option value="all">{translations.filters.all}</option>
            <option value="High">{translations.filters.high}</option>
            <option value="Medium">{translations.filters.medium}</option>
            <option value="Low">{translations.filters.low}</option>
          </select>
        </div>

        {/* Language Filter */}
        <div>
          <label className="block text-sm text-white/70 mb-2">
            {translations.filters.language}
          </label>
          <select
            value={filter.language}
            onChange={(e) => onFilterChange({ language: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none"
          >
            <option value="all">{translations.filters.all}</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>

        {/* Min Confidence Filter */}
        <div>
          <label className="block text-sm text-white/70 mb-2">
            {translations.filters.minConfidence}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={filter.minConfidence}
            onChange={(e) => onFilterChange({ minConfidence: parseInt(e.target.value) })}
            className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-white/50 mt-1">
            <span>0%</span>
            <span className="text-white">{filter.minConfidence}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
