/**
 * Centralized Industry Translation Utilities
 * Provides consistent industry field translation across all components
 */

import { translateIndustry } from './translateIndustryFR';

/**
 * Translates and formats industry field based on locale
 * @param industry - The industry string to translate
 * @param isFrench - Whether the current locale is French
 * @returns Properly translated and capitalized industry name
 */
export function formatIndustryField(industry: string | undefined, isFrench: boolean): string {
  if (!industry) return isFrench ? 'Non spécifié' : 'Not specified';
  
  // Use the comprehensive industry translation library
  if (isFrench) {
    return translateIndustry(industry);
  }
  
  // For English, ensure proper capitalization
  return industry.charAt(0).toUpperCase() + industry.slice(1).toLowerCase();
}

/**
 * Hook for industry translation in React components
 * @param isFrench - Whether the current locale is French
 * @returns Translation function for industry fields
 */
export function useIndustryTranslation(isFrench: boolean) {
  return (industry: string | undefined) => formatIndustryField(industry, isFrench);
}

/**
 * Common industry field display patterns
 */
export const IndustryDisplayPatterns = {
  // For table cells
  tableCell: (industry: string | undefined, isFrench: boolean) => 
    formatIndustryField(industry, isFrench),
  
  // For badges/tags
  badge: (industry: string | undefined, isFrench: boolean) => 
    formatIndustryField(industry, isFrench),
  
  // For modal displays
  modal: (industry: string | undefined, isFrench: boolean) => 
    formatIndustryField(industry, isFrench),
  
  // For fallback values
  fallback: (isFrench: boolean) => 
    isFrench ? 'Non spécifié' : 'Not specified'
} as const;
