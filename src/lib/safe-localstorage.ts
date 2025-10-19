/**
 * SSR-Safe LocalStorage Helpers
 * These functions safely handle localStorage access in both server and client environments
 */

/**
 * Safely gets an item from localStorage
 * Returns null if running on server or if localStorage is not available
 */
export function getLocalStorageItem(key: string): string | null {
  if (typeof window === 'undefined') {
    console.log(`[SSRGuard] 🛡️ localStorage.getItem blocked on server for key: "${key}"`);
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`[SSRGuard] ❌ localStorage.getItem failed for key "${key}":`, error);
    return null;
  }
}

/**
 * Safely sets an item in localStorage
 * Does nothing if running on server or if localStorage is not available
 */
export function setLocalStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined') {
    console.log(`[SSRGuard] 🛡️ localStorage.setItem blocked on server for key: "${key}"`);
    return;
  }

  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`[SSRGuard] ❌ localStorage.setItem failed for key "${key}":`, error);
  }
}

/**
 * Safely removes an item from localStorage
 * Does nothing if running on server or if localStorage is not available
 */
export function removeLocalStorageItem(key: string): void {
  if (typeof window === 'undefined') {
    console.log(`[SSRGuard] 🛡️ localStorage.removeItem blocked on server for key: "${key}"`);
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`[SSRGuard] ❌ localStorage.removeItem failed for key "${key}":`, error);
  }
}

/**
 * Safely clears all localStorage
 * Does nothing if running on server or if localStorage is not available
 */
export function clearLocalStorage(): void {
  if (typeof window === 'undefined') {
    console.log(`[SSRGuard] 🛡️ localStorage.clear blocked on server`);
    return;
  }

  try {
    localStorage.clear();
  } catch (error) {
    console.error(`[SSRGuard] ❌ localStorage.clear failed:`, error);
  }
}

/**
 * Checks if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.error(`[SSRGuard] ❌ localStorage not available:`, error);
    return false;
  }
}

/**
 * Safely gets multiple items from localStorage
 * Returns an object with the requested keys and their values (or null if not found)
 */
export function getMultipleLocalStorageItems(keys: string[]): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  
  if (typeof window === 'undefined') {
    console.log(`[SSRGuard] 🛡️ Multiple localStorage.getItems blocked on server for keys:`, keys);
    keys.forEach(key => result[key] = null);
    return result;
  }

  keys.forEach(key => {
    result[key] = getLocalStorageItem(key);
  });

  return result;
}

/**
 * Safely sets multiple items in localStorage
 * Only sets items that are available (client-side)
 */
export function setMultipleLocalStorageItems(items: Record<string, string>): void {
  if (typeof window === 'undefined') {
    console.log(`[SSRGuard] 🛡️ Multiple localStorage.setItems blocked on server for keys:`, Object.keys(items));
    return;
  }

  Object.entries(items).forEach(([key, value]) => {
    setLocalStorageItem(key, value);
  });
}

/**
 * Session-specific localStorage helpers for client authentication
 */
export const SESSION_KEYS = {
  CLIENT_SESSION: 'client_session',
  CLIENT_ID: 'clientId',
  LANGUAGE: 'avenir_language',
  USER_PREFERENCES: 'user_preferences'
} as const;

/**
 * Gets client session data safely
 */
export function getClientSession(): string | null {
  return getLocalStorageItem(SESSION_KEYS.CLIENT_SESSION);
}

/**
 * Sets client session data safely
 */
export function setClientSession(sessionData: string): void {
  setLocalStorageItem(SESSION_KEYS.CLIENT_SESSION, sessionData);
}

/**
 * Removes client session data safely
 */
export function removeClientSession(): void {
  removeLocalStorageItem(SESSION_KEYS.CLIENT_SESSION);
}

/**
 * Gets client ID safely
 */
export function getClientId(): string | null {
  return getLocalStorageItem(SESSION_KEYS.CLIENT_ID);
}

/**
 * Sets client ID safely
 */
export function setClientId(clientId: string): void {
  setLocalStorageItem(SESSION_KEYS.CLIENT_ID, clientId);
}

/**
 * Removes client ID safely
 */
export function removeClientId(): void {
  removeLocalStorageItem(SESSION_KEYS.CLIENT_ID);
}
