"use client";

import { useEffect } from 'react';
import { restoreSession } from '../utils/session';

/**
 * Early session provider that runs session rehydration before any locale-specific logic
 * This ensures session persistence across locale switches and page reloads
 */
export function EarlySessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('[AuthFix] ============================================');
    console.log('[AuthFix] EarlySessionProvider: Starting early session rehydration...');
    
    // Restore session immediately on mount, before any other components load
    const sessionState = restoreSession();
    
    if (sessionState.isAuthenticated) {
      console.log('[AuthFix] Session restored before locale load');
      console.log('[AuthFix] Client ID:', sessionState.client?.clientId);
      console.log('[AuthFix] Business:', sessionState.client?.businessName);
      console.log('[AuthFix] Language:', sessionState.client?.language);
    } else {
      console.log('[AuthFix] No session found - user not authenticated');
    }
    
    console.log('[AuthFix] EarlySessionProvider: Session rehydration complete');
    console.log('[AuthFix] ============================================');
  }, []);

  // This provider doesn't provide context - it just ensures session is restored early
  return <>{children}</>;
}
