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
  // Initialize session state with loading state
  const [session, setSession] = useState<SessionState>({
    isAuthenticated: false,
    client: null,
    isLoading: true,
  });

  // Restore session on client-side mount
  useEffect(() => {
    console.log('[AuthFix] ============================================');
    console.log('[AuthFix] Client-side session restoration started');
    console.log('[AuthFix] Restoring session from localStorage...');
    
    const sessionState = restoreSession();
    
    if (sessionState.isAuthenticated) {
      console.log('[AuthFix] Session restored successfully');
      console.log('[AuthFix] Client ID:', sessionState.client?.clientId);
      console.log('[AuthFix] Business:', sessionState.client?.businessName);
      console.log('[AuthFix] Email:', sessionState.client?.email);
    } else {
      console.log('[AuthFix] No session found');
    }
    
    console.log('[AuthFix] ============================================');
    setSession(sessionState);
  }, []);

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
