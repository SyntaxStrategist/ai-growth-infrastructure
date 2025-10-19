/**
 * Global session management utility for persistent authentication
 * Handles localStorage-based session rehydration and cleanup
 */

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

// Session storage keys
const SESSION_KEYS = {
  CLIENT_SESSION: 'client_session',
  CLIENT_ID: 'clientId',
  LANGUAGE: 'avenir_language',
} as const;

/**
 * Restore session from localStorage
 * Returns session state with authentication status and client data
 */
export function restoreSession(): SessionState {
  console.log('[AuthFix] ============================================');
  console.log('[AuthFix] Restoring session from localStorage...');
  
  try {
    const clientSession = localStorage.getItem(SESSION_KEYS.CLIENT_SESSION);
    
    if (!clientSession) {
      console.log('[AuthFix] Session missing - no client_session found');
      return {
        isAuthenticated: false,
        client: null,
        isLoading: false,
      };
    }
    
    const clientData: ClientData = JSON.parse(clientSession);
    
    // Validate required fields
    if (!clientData.clientId || !clientData.email) {
      console.log('[AuthFix] Session invalid - missing required fields');
      clearSession();
      return {
        isAuthenticated: false,
        client: null,
        isLoading: false,
      };
    }
    
    console.log('[AuthFix] Session restored successfully');
    console.log('[AuthFix] Client ID:', clientData.clientId);
    console.log('[AuthFix] Business:', clientData.businessName);
    console.log('[AuthFix] Email:', clientData.email);
    console.log('[AuthFix] Language:', clientData.language);
    console.log('[AuthFix] ============================================');
    
    return {
      isAuthenticated: true,
      client: clientData,
      isLoading: false,
    };
    
  } catch (error) {
    console.error('[AuthFix] Session restoration failed:', error);
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
  console.log('[AuthFix] ============================================');
  console.log('[AuthFix] Saving session to localStorage...');
  console.log('[AuthFix] Client ID:', clientData.clientId);
  console.log('[AuthFix] Business:', clientData.businessName);
  console.log('[AuthFix] Email:', clientData.email);
  console.log('[AuthFix] Language:', clientData.language);
  
  try {
    // Store main session data
    localStorage.setItem(SESSION_KEYS.CLIENT_SESSION, JSON.stringify(clientData));
    
    // Store client ID separately for compatibility
    localStorage.setItem(SESSION_KEYS.CLIENT_ID, clientData.clientId);
    
    // Store language preference
    if (clientData.language) {
      localStorage.setItem(SESSION_KEYS.LANGUAGE, clientData.language);
      // Also set cookie for server-side access
      document.cookie = `avenir_language=${clientData.language}; path=/; max-age=31536000; SameSite=Lax`;
    }
    
    console.log('[AuthFix] Session saved successfully');
    console.log('[AuthFix] ============================================');
    
  } catch (error) {
    console.error('[AuthFix] Session save failed:', error);
  }
}

/**
 * Clear all session data from localStorage and cookies
 * Used for logout and session cleanup
 */
export function clearSession(): void {
  console.log('[AuthFix] ============================================');
  console.log('[AuthFix] Clearing session data...');
  
  try {
    // Remove all session-related localStorage items
    localStorage.removeItem(SESSION_KEYS.CLIENT_SESSION);
    localStorage.removeItem(SESSION_KEYS.CLIENT_ID);
    localStorage.removeItem(SESSION_KEYS.LANGUAGE);
    
    // Clear language cookie
    document.cookie = 'avenir_language=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    
    console.log('[AuthFix] Session cleared successfully');
    console.log('[AuthFix] Removed keys:', Object.values(SESSION_KEYS));
    console.log('[AuthFix] ============================================');
    
  } catch (error) {
    console.error('[AuthFix] Session clear failed:', error);
  }
}

/**
 * Check if user is currently authenticated
 * Quick check without full session restoration
 */
export function isAuthenticated(): boolean {
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
  try {
    return localStorage.getItem(SESSION_KEYS.LANGUAGE) || 'en';
  } catch {
    return 'en';
  }
}
