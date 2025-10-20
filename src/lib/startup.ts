/**
 * Startup Utilities
 * 
 * Handles one-time initialization tasks that should run when the server starts.
 * Uses singleton pattern to ensure tasks only run once per server instance.
 */

import { checkEnv } from './env-check';
import { logInfo, logWarn, logError } from './logger';

// Singleton flag to ensure startup tasks only run once
let startupInitialized = false;
let startupResults: {
  envCheck: ReturnType<typeof checkEnv> | null;
  timestamp: string;
} = {
  envCheck: null,
  timestamp: ''
};

/**
 * Initialize startup tasks (runs only once per server instance)
 * @returns Promise with startup results
 */
export async function initializeStartup(): Promise<typeof startupResults> {
  if (startupInitialized) {
    logInfo('🔄 Startup already initialized, returning cached results');
    return startupResults;
  }

  logInfo('🚀 Starting server initialization...');
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    // Run environment variable check
    logInfo('🔍 Running environment variable check...');
    const envCheck = checkEnv();
    
    startupResults = {
      envCheck,
      timestamp
    };

    const duration = Date.now() - startTime;
    
    if (envCheck.allPresent) {
      logInfo('✅ Server initialization completed successfully', {
        duration: `${duration}ms`,
        envVarsChecked: envCheck.totalChecked,
        envVarsPresent: envCheck.totalPresent
      });
    } else {
      logWarn('⚠️ Server initialization completed with warnings', {
        duration: `${duration}ms`,
        envVarsChecked: envCheck.totalChecked,
        envVarsPresent: envCheck.totalPresent,
        criticalMissing: envCheck.criticalMissing.length,
        optionalMissing: envCheck.optionalMissing.length
      });
    }

    startupInitialized = true;
    return startupResults;

  } catch (error) {
    logError('❌ Server initialization failed', { error, duration: `${Date.now() - startTime}ms` });
    startupInitialized = true; // Mark as initialized even on error to prevent retries
    throw error;
  }
}

/**
 * Get startup results (returns cached results if already initialized)
 * @returns Startup results or null if not initialized
 */
export function getStartupResults(): typeof startupResults | null {
  return startupInitialized ? startupResults : null;
}

/**
 * Check if startup has been initialized
 * @returns True if startup tasks have been completed
 */
export function isStartupInitialized(): boolean {
  return startupInitialized;
}

/**
 * Force re-initialization (for testing purposes only)
 * @internal
 */
export function resetStartup(): void {
  startupInitialized = false;
  startupResults = {
    envCheck: null,
    timestamp: ''
  };
  logWarn('🔄 Startup state reset (for testing purposes)');
}

// Export default function for convenience
export default initializeStartup;
