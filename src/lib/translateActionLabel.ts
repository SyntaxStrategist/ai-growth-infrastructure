/**
 * Centralized translation utilities for Activity Log action labels
 * Provides locale-aware translation of action strings and timestamps
 */

export type Locale = 'en' | 'fr';

// Action label translations
export const actionTranslations = {
  en: {
    // Action types
    "delete": "Lead Deleted",
    "archive": "Lead Archived", 
    "tag": "Tag Added",
    "reactivate": "Lead Reactivated",
    "permanent_delete": "Lead Permanently Deleted",
    
    // Underscore versions for database compatibility
    "note_added": "Note Added",
    "note_edited": "Note Edited",
    "note_deleted": "Note Deleted",
    
    // Common tag labels
    "New Lead": "New Lead",
    "Lead Updated": "Lead Updated",
    "Lead Deleted": "Lead Deleted",
    "Tag Added": "Tag Added",
    "Note Added": "Note Added",
    "Note Edited": "Note Edited",
    "Note Deleted": "Note Deleted",
    "Action Completed": "Action Completed",
    "Converted": "Converted",
    "Contacted": "Contacted",
    "High Value": "High Value",
    "Not Qualified": "Not Qualified",
    "Follow-Up": "Follow-Up",
    "Active": "Active",
    "Archived": "Archived",
    "Deleted": "Deleted",
    
    // French-to-English reverse mappings
    "Converti": "Converted",
    "Contacté": "Contacted",
    "Haute Valeur": "High Value",
    "Non Qualifié": "Not Qualified",
    "Suivi": "Follow-Up",
    "Actif": "Active",
    "Archivé": "Archived",
    "Supprimé": "Deleted",
    
    // Performed by labels
    "admin": "Admin",
    "AI Copilot": "AI Copilot",
    "system": "System",
    "user": "User",
  },
  fr: {
    // Action types
    "delete": "Lead supprimé",
    "archive": "Lead archivé",
    "tag": "Tag ajouté", 
    "reactivate": "Lead réactivé",
    "permanent_delete": "Lead supprimé définitivement",
    
    // Underscore versions for database compatibility
    "note_added": "Note ajoutée",
    "note_edited": "Note modifiée",
    "note_deleted": "Note supprimée",
    
    // Common tag labels
    "New Lead": "Nouveau lead",
    "Lead Updated": "Lead mis à jour",
    "Lead Deleted": "Lead supprimé",
    "Tag Added": "Tag ajouté",
    "Note Added": "Note ajoutée",
    "Note Edited": "Note modifiée",
    "Note Deleted": "Note supprimée",
    "Action Completed": "Action complétée",
    "Converted": "Converti",
    "Contacted": "Contacté",
    "High Value": "Haute Valeur",
    "Not Qualified": "Non Qualifié",
    "Follow-Up": "Suivi",
    "Active": "Actif",
    "Archived": "Archivé",
    "Deleted": "Supprimé",
    
    // Performed by labels
    "admin": "Admin",
    "AI Copilot": "Copilote IA",
    "system": "Système",
    "user": "Utilisateur",
  },
} as const;

/**
 * Translate an action label based on locale
 */
export function translateActionLabel(action: string, locale: Locale): string {
  const translations = actionTranslations[locale];
  
  // First try exact match
  if (translations[action as keyof typeof translations]) {
    return translations[action as keyof typeof translations];
  }
  
  // Handle underscore to space conversion (e.g., "note_added" -> "Note Added")
  const normalizedAction = action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  if (translations[normalizedAction as keyof typeof translations]) {
    return translations[normalizedAction as keyof typeof translations];
  }
  
  // Fallback to original action
  return action;
}

/**
 * Translate a tag label based on locale
 */
export function translateTagLabel(tag: string | null, locale: Locale): string {
  if (!tag) return '';
  const translations = actionTranslations[locale];
  return translations[tag as keyof typeof translations] || tag;
}

/**
 * Translate performed_by label based on locale
 */
export function translatePerformedBy(performedBy: string | null, locale: Locale): string {
  if (!performedBy) return '';
  const translations = actionTranslations[locale];
  return translations[performedBy as keyof typeof translations] || performedBy;
}

/**
 * Format timestamp based on locale
 * EN: "07:38 PM" (12-hour format)
 * FR: "19 h 38" (24-hour format)
 */
export function formatTimestamp(timestamp: string, locale: Locale): string {
  const date = new Date(timestamp);
  
  if (locale === 'fr') {
    // French format: "19 h 38"
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date).replace(':', ' h ');
  } else {
    // English format: "07:38 PM"
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }
}

/**
 * Detect locale from URL path or query parameter
 */
export function detectLocaleFromRequest(url: string, searchParams?: URLSearchParams): Locale {
  // Check URL path for locale (e.g., /fr/dashboard, /en/dashboard)
  const pathMatch = url.match(/\/([a-z]{2})\//);
  if (pathMatch && ['en', 'fr'].includes(pathMatch[1])) {
    return pathMatch[1] as Locale;
  }
  
  // Check query parameter
  if (searchParams) {
    const localeParam = searchParams.get('locale');
    if (localeParam && ['en', 'fr'].includes(localeParam)) {
      return localeParam as Locale;
    }
  }
  
  // Default to English
  return 'en';
}

/**
 * Validate and normalize locale
 */
export function normalizeLocale(locale: string | null | undefined): Locale {
  if (locale && ['en', 'fr'].includes(locale)) {
    return locale as Locale;
  }
  return 'en';
}
