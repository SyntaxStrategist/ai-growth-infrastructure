/**
 * Database Failover Manager
 * Provides automatic failover between Supabase and secondary database
 */

import { createClient } from '@supabase/supabase-js';

// Configuration from environment variables
const PRIMARY_DB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const PRIMARY_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PRIMARY_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SECONDARY_DB_URL = process.env.SECONDARY_DB_URL;

const HEALTHCHECK_INTERVAL = parseInt(process.env.FAILOVER_HEALTHCHECK_INTERVAL || '60000', 10);
const MAX_RETRIES = parseInt(process.env.FAILOVER_MAX_RETRIES || '3', 10);
const NOTIFICATION_EMAIL = process.env.FAILOVER_NOTIFICATION_EMAIL;

// Failover state
let isPrimaryHealthy = true;
let isSecondaryHealthy = false;
let lastHealthCheck = 0;
let retryCount = 0;
let failoverActive = false;

// Health check cache
const HEALTH_CHECK_CACHE_DURATION = 30000; // 30 seconds
let lastHealthCheckTime = 0;
let cachedHealthStatus: boolean | null = null;

/**
 * Health check for Supabase primary database
 */
async function checkPrimaryHealth(): Promise<boolean> {
  try {
    if (!PRIMARY_DB_URL || !PRIMARY_SERVICE_KEY) {
      console.warn('[Failover] Primary database not configured');
      return false;
    }

    // Create a temporary client for health check
    const healthClient = createClient(PRIMARY_DB_URL, PRIMARY_SERVICE_KEY, {
      auth: { persistSession: false },
      db: { schema: 'public' }
    });

    // Simple health check - try to query a system table
    const { data, error } = await healthClient
      .from('clients')
      .select('count')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is OK
      console.warn('[Failover] Primary health check failed:', error.message);
      return false;
    }

    console.log('[Failover] ✅ Primary database healthy');
    return true;
  } catch (error) {
    console.warn('[Failover] ❌ Primary health check error:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Health check for secondary database (Neon/Postgres)
 */
async function checkSecondaryHealth(): Promise<boolean> {
  try {
    if (!SECONDARY_DB_URL) {
      console.warn('[Failover] Secondary database not configured');
      return false;
    }

    // For Postgres direct connection, we'll use a simple connection test
    // This is a placeholder - in a real implementation, you'd use a Postgres client
    // For now, we'll assume it's healthy if configured
    console.log('[Failover] ✅ Secondary database healthy (assumed)');
    return true;
  } catch (error) {
    console.warn('[Failover] ❌ Secondary health check error:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Perform comprehensive health check
 */
async function performHealthCheck(): Promise<{ primary: boolean; secondary: boolean }> {
  const now = Date.now();
  
  // Use cached result if recent enough
  if (cachedHealthStatus !== null && (now - lastHealthCheckTime) < HEALTH_CHECK_CACHE_DURATION) {
    return {
      primary: cachedHealthStatus,
      secondary: isSecondaryHealthy
    };
  }

  console.log('[Failover] 🔍 Performing health check...');
  
  const [primaryHealth, secondaryHealth] = await Promise.allSettled([
    checkPrimaryHealth(),
    checkSecondaryHealth()
  ]);

  const primaryHealthy = primaryHealth.status === 'fulfilled' && primaryHealth.value;
  const secondaryHealthy = secondaryHealth.status === 'fulfilled' && secondaryHealth.value;

  // Update cache
  cachedHealthStatus = primaryHealthy;
  lastHealthCheckTime = now;

  // Update global state
  isPrimaryHealthy = primaryHealthy;
  isSecondaryHealthy = secondaryHealthy;
  lastHealthCheck = now;

  console.log('[Failover] Health check results:', {
    primary: primaryHealthy ? '✅ Healthy' : '❌ Unhealthy',
    secondary: secondaryHealthy ? '✅ Healthy' : '❌ Unhealthy'
  });

  return { primary: primaryHealthy, secondary: secondaryHealthy };
}

/**
 * Send failover notification
 */
async function sendFailoverNotification(message: string) {
  if (!NOTIFICATION_EMAIL) {
    console.warn('[Failover] No notification email configured');
    return;
  }

  try {
    // In a real implementation, you'd send an email here
    // For now, just log the notification
    console.log(`[Failover] 📧 Notification to ${NOTIFICATION_EMAIL}: ${message}`);
  } catch (error) {
    console.error('[Failover] Failed to send notification:', error);
  }
}

/**
 * Handle failover logic
 */
async function handleFailover() {
  const { primary, secondary } = await performHealthCheck();

  if (!primary && secondary && !failoverActive) {
    // Primary is down, secondary is up - activate failover
    console.warn('[Failover] 🚨 Activating failover to secondary database');
    failoverActive = true;
    retryCount = 0;
    
    await sendFailoverNotification(
      `Database failover activated. Primary database is down, using secondary database.`
    );
  } else if (primary && failoverActive) {
    // Primary is back up - deactivate failover
    console.log('[Failover] ✅ Primary database recovered, deactivating failover');
    failoverActive = false;
    retryCount = 0;
    
    await sendFailoverNotification(
      `Database failover deactivated. Primary database is healthy again.`
    );
  } else if (!primary && !secondary) {
    // Both databases are down
    console.error('[Failover] ❌ Both primary and secondary databases are down!');
    retryCount++;
    
    if (retryCount >= MAX_RETRIES) {
      await sendFailoverNotification(
        `CRITICAL: Both primary and secondary databases are down after ${MAX_RETRIES} retries.`
      );
    }
  }
}

/**
 * Get the appropriate database configuration
 */
export function getDatabaseConfig(): {
  url: string;
  serviceKey: string;
  anonKey: string;
  isFailover: boolean;
} {
  if (failoverActive && SECONDARY_DB_URL) {
    console.log('[Failover] Using secondary database configuration');
    return {
      url: SECONDARY_DB_URL,
      serviceKey: PRIMARY_SERVICE_KEY || '', // Use same keys for now
      anonKey: PRIMARY_ANON_KEY || '',
      isFailover: true
    };
  }

  return {
    url: PRIMARY_DB_URL || '',
    serviceKey: PRIMARY_SERVICE_KEY || '',
    anonKey: PRIMARY_ANON_KEY || '',
    isFailover: false
  };
}

/**
 * Create Supabase client with failover support
 */
export function createFailoverSupabaseClient() {
  const config = getDatabaseConfig();
  
  if (!config.url || !config.serviceKey) {
    throw new Error('Database configuration not available');
  }

  const client = createClient(config.url, config.serviceKey, {
    auth: { persistSession: false },
    db: { schema: 'public' }
  });

  // Add failover indicator to client
  (client as any).__failoverActive = config.isFailover;
  
  return client;
}

/**
 * Start the failover health check service
 */
export function startFailoverService() {
  if (!PRIMARY_DB_URL || !SECONDARY_DB_URL) {
    console.warn('[Failover] Failover service not started - missing database configuration');
    return;
  }

  console.log('[Failover] 🚀 Starting failover service...');
  console.log('[Failover] Health check interval:', HEALTHCHECK_INTERVAL, 'ms');
  console.log('[Failover] Max retries:', MAX_RETRIES);
  console.log('[Failover] Notification email:', NOTIFICATION_EMAIL || 'Not configured');

  // Perform initial health check
  performHealthCheck().then(() => {
    console.log('[Failover] ✅ Initial health check completed');
  });

  // Set up periodic health checks
  setInterval(handleFailover, HEALTHCHECK_INTERVAL);
}

/**
 * Get current failover status
 */
export function getFailoverStatus() {
  return {
    isPrimaryHealthy,
    isSecondaryHealthy,
    failoverActive,
    retryCount,
    lastHealthCheck,
    healthCheckInterval: HEALTHCHECK_INTERVAL,
    maxRetries: MAX_RETRIES
  };
}

/**
 * Force a health check (for testing)
 */
export async function forceHealthCheck() {
  console.log('[Failover] 🔄 Forcing health check...');
  cachedHealthStatus = null; // Clear cache
  return await performHealthCheck();
}

// Auto-start failover service if configured
if (PRIMARY_DB_URL && SECONDARY_DB_URL) {
  startFailoverService();
}
