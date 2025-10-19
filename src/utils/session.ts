/**
 * Global session management utility for persistent authentication
 * Handles localStorage-based session rehydration and cleanup
 * Now uses SSR-safe localStorage helpers
 */

import { 
  getLocalStorageItem, 
  setLocalStorageItem, 
  removeLocalStorageItem,
  SESSION_KEYS 
} from '../lib/safe-localstorage';

export type ClientData = {
  id: string;
  clientId: string;
  businessName: string;
  contactName: string;
  email: string;
  language: string;
  apiKey: string;
};

export type SessionState = {
  isAuthenticated: boolean;
  client: ClientData | null;
  isLoading: boolean;
};

/**
 * Restore session from localStorage
 * Returns session state with authentication status and client data
 */
export function restoreSession(): SessionState {
  console.log('[AuthGuard] ============================================');
  console.log('[AuthGuard] Restoring session from localStorage...');
  
  try {
    const clientSession = getLocalStorageItem(SESSION_KEYS.CLIENT_SESSION);
    
    if (!clientSession) {
      console.log('[AuthGuard] Session missing - no client_session found');
      return {
        isAuthenticated: false,
        client: null,
        isLoading: false,
      };
    }
    
    const clientData: ClientData = JSON.parse(clientSession);
    
    // Validate required fields
    if (!clientData.clientId || !clientData.email) {
      console.log('[AuthGuard] Session invalid - missing required fields');
      clearSession();
      return {
        isAuthenticated: false,
        client: null,
        isLoading: false,
      };
    }
    
    console.log('[AuthGuard] Session restored successfully');
    console.log('[AuthGuard] Client ID:', clientData.clientId);
    console.log('[AuthGuard] Business:', clientData.businessName);
    console.log('[AuthGuard] Email:', clientData.email);
    console.log('[AuthGuard] Language:', clientData.language);
    console.log('[AuthGuard] ============================================');
    
    return {
      isAuthenticated: true,
      client: clientData,
      isLoading: false,
    };
    
  } catch (error) {
    console.error('[AuthGuard] Session restoration failed:', error);
    clearSession();
    return {
      isAuthenticated: false,
      client: null,
      isLoading: false,
    };
  }
}

/**
 * Save session to localStorage
 * Stores client data and related session information
 */
export function saveSession(clientData: ClientData): void {
  console.log('[AuthGuard] ============================================');
  console.log('[AuthGuard] Saving session to localStorage...');
  console.log('[AuthGuard] Client ID:', clientData.clientId);
  console.log('[AuthGuard] Business:', clientData.businessName);
  console.log('[AuthGuard] Email:', clientData.email);
  console.log('[AuthGuard] Language:', clientData.language);
  
  try {
    // Store main session data
    setLocalStorageItem(SESSION_KEYS.CLIENT_SESSION, JSON.stringify(clientData));
    
    // Store client ID separately for compatibility
    setLocalStorageItem(SESSION_KEYS.CLIENT_ID, clientData.clientId);
    
    // Store language preference
    if (clientData.language) {
      setLocalStorageItem(SESSION_KEYS.LANGUAGE, clientData.language);
      // Also set cookie for server-side access (only on client)
      if (typeof window !== 'undefined') {
        document.cookie = `avenir_language=${clientData.language}; path=/; max-age=31536000; SameSite=Lax`;
      }
    }
    
    console.log('[AuthGuard] Session saved successfully');
    console.log('[AuthGuard] ============================================');
    
  } catch (error) {
    console.error('[AuthGuard] Session save failed:', error);
  }
}

/**
 * Clear all session data from localStorage and cookies
 * Used for logout and session cleanup
 */
export function clearSession(): void {
  console.log('[AuthGuard] ============================================');
  console.log('[AuthGuard] Clearing session data...');
  
  try {
    // Remove all session-related localStorage items
    removeLocalStorageItem(SESSION_KEYS.CLIENT_SESSION);
    removeLocalStorageItem(SESSION_KEYS.CLIENT_ID);
    removeLocalStorageItem(SESSION_KEYS.LANGUAGE);
    
    // Clear language cookie (only on client)
    if (typeof window !== 'undefined') {
      document.cookie = 'avenir_language=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }
    
    console.log('[AuthGuard] Session cleared successfully');
    console.log('[AuthGuard] Removed keys:', Object.values(SESSION_KEYS));
    console.log('[AuthGuard] ============================================');
    
  } catch (error) {
    console.error('[AuthGuard] Session clear failed:', error);
  }
}

/**
 * Check if user is currently authenticated
 * Quick check without full session restoration
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const clientSession = localStorage.getItem(SESSION_KEYS.CLIENT_SESSION);
    return !!clientSession;
  } catch {
    return false;
  }
}

/**
 * Get current client ID from localStorage
 * Returns null if not authenticated
 */
export function getCurrentClientId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    return localStorage.getItem(SESSION_KEYS.CLIENT_ID);
  } catch {
    return null;
  }
}

/**
 * Get current language preference
 * Returns 'en' as default if not set
 */
export function getCurrentLanguage(): string {
  if (typeof window === 'undefined') {
    return 'en';
  }
  
  try {
    return localStorage.getItem(SESSION_KEYS.LANGUAGE) || 'en';
  } catch {
    return 'en';
  }
}
