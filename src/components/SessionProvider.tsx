"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { restoreSession, clearSession, type ClientData, type SessionState } from '../utils/session';

interface SessionContextType {
  session: SessionState;
  refreshSession: () => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<SessionState>({
    isAuthenticated: false,
    client: null,
    isLoading: true,
  });

  const refreshSession = () => {
    console.log('[AuthFix] ============================================');
    console.log('[AuthFix] SessionProvider: Refreshing session...');
    
    const sessionState = restoreSession();
    setSession(sessionState);
    
    console.log('[AuthFix] SessionProvider: Session state updated');
    console.log('[AuthFix] Authenticated:', sessionState.isAuthenticated);
    console.log('[AuthFix] Client ID:', sessionState.client?.clientId || 'none');
    console.log('[AuthFix] ============================================');
  };

  const handleClearSession = () => {
    console.log('[AuthFix] ============================================');
    console.log('[AuthFix] SessionProvider: Clearing session...');
    
    clearSession();
    setSession({
      isAuthenticated: false,
      client: null,
      isLoading: false,
    });
    
    console.log('[AuthFix] SessionProvider: Session cleared');
    console.log('[AuthFix] ============================================');
  };

  // Restore session on mount (session already restored by EarlySessionProvider)
  useEffect(() => {
    console.log('[AuthFix] ============================================');
    console.log('[AuthFix] SessionProvider: Initializing (session already restored by EarlySessionProvider)...');
    
    refreshSession();
    
    console.log('[AuthFix] SessionProvider: Initialization complete');
    console.log('[AuthFix] ============================================');
  }, []);

  // Listen for storage changes (e.g., from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'client_session' || e.key === 'clientId') {
        console.log('[AuthFix] SessionProvider: Storage change detected, refreshing session...');
        refreshSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const contextValue: SessionContextType = {
    session,
    refreshSession,
    clearSession: handleClearSession,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
