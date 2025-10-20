"use client";

import { motion } from 'framer-motion';
import type { PaginationState } from '@/hooks/usePagination';

interface PaginationControlsProps {
  pagination: PaginationState;
  currentPage: number;
  isFrench: boolean;
  onPageChange: (page: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export default function PaginationControls({
  pagination,
  currentPage,
  isFrench,
  onPageChange,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  const translations = {
    previous: isFrench ? 'Précédent' : 'Previous',
    next: isFrench ? 'Suivant' : 'Next',
    page: isFrench ? 'Page' : 'Page',
    of: isFrench ? 'sur' : 'of',
    showing: isFrench ? 'Affichage' : 'Showing',
    to: isFrench ? 'à' : 'to',
    results: isFrench ? 'résultats' : 'results',
  };

  if (pagination.totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * 5 + 1;
  const endItem = Math.min(currentPage * 5, pagination.totalLeads);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8"
    >
      {/* Results Info */}
      <div className="text-white/70 text-sm">
        {translations.showing} {startItem} {translations.to} {endItem} {translations.of} {pagination.totalLeads} {translations.results}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPrevious}
          disabled={!pagination.hasPrevPage}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            pagination.hasPrevPage
              ? 'bg-white/10 text-white hover:bg-white/20'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          {translations.previous}
        </motion.button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            let pageNum;
            if (pagination.totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= pagination.totalPages - 2) {
              pageNum = pagination.totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <motion.button
                key={pageNum}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(pageNum)}
                className={`w-10 h-10 rounded-lg font-medium transition-all ${
                  currentPage === pageNum
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                {pageNum}
              </motion.button>
            );
          })}
        </div>

        {/* Next Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          disabled={!pagination.hasNextPage}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            pagination.hasNextPage
              ? 'bg-white/10 text-white hover:bg-white/20'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          {translations.next}
        </motion.button>
      </div>
    </motion.div>
  );
}
