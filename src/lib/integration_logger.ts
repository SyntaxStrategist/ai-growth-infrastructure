// ============================================
// Integration Logger
// ============================================
// Unified logging for API integrations
// Writes to console (Vercel logs) + Supabase (persistence)
// Safe for serverless - no filesystem writes in production

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null;

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// ============================================
// Main Logging Function
// ============================================

/**
 * Log integration events to console and Supabase
 * 
 * @param source - Integration source (e.g., 'apollo', 'pdl', 'form_scanner')
 * @param level - Log level ('info', 'warn', 'error', 'debug')
 * @param message - Log message
 * @param meta - Optional metadata object
 * 
 * @example
 * await logIntegration('apollo', 'info', 'Search complete', { results: 10 });
 * await logIntegration('pdl', 'error', 'API key invalid', { endpoint: '/v5/company/search' });
 */
export async function logIntegration(
  source: string,
  level: LogLevel,
  message: string,
  meta?: Record<string, any>
): Promise<void> {
  const timestamp = new Date().toISOString();
  const prefix = `[${source.toUpperCase()}]`;
  
  // 1. Console logging (captured by Vercel/hosting platform)
  const logMessage = `${prefix} ${message}`;
  
  switch (level) {
    case 'error':
      console.error(logMessage, meta || '');
      break;
    case 'warn':
      console.warn(logMessage, meta || '');
      break;
    case 'debug':
      console.debug(logMessage, meta || '');
      break;
    default:
      console.info(logMessage, meta || '');
  }

  // 2. Supabase persistence (async, non-blocking)
  if (supabase) {
    // Fire and forget - don't await to avoid blocking
    supabase
      .from('integration_logs')
      .insert([{
        source,
        level,
        message,
        meta: meta || null,
        created_at: timestamp
      }])
      .then(({ error }) => {
        if (error) {
          console.error('[Logger] Failed to write to Supabase:', error);
        }
      });
  }

  // 3. Local filesystem logging (development only)
  if (process.env.NODE_ENV !== 'production') {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      const logFile = path.join(logDir, `${source}_integration.log`);
      
      // Create logs directory if it doesn't exist (local dev only)
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}${meta ? '\n' + JSON.stringify(meta, null, 2) : ''}\n`;
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      // Silently fail in production or if filesystem is unavailable
      // This is expected in serverless environments
    }
  }
}

// ============================================
// Convenience Methods
// ============================================

/**
 * Log info message
 */
export async function logInfo(source: string, message: string, meta?: Record<string, any>): Promise<void> {
  return logIntegration(source, 'info', message, meta);
}

/**
 * Log warning message
 */
export async function logWarn(source: string, message: string, meta?: Record<string, any>): Promise<void> {
  return logIntegration(source, 'warn', message, meta);
}

/**
 * Log error message
 */
export async function logError(source: string, message: string, meta?: Record<string, any>): Promise<void> {
  return logIntegration(source, 'error', message, meta);
}

/**
 * Log debug message
 */
export async function logDebug(source: string, message: string, meta?: Record<string, any>): Promise<void> {
  return logIntegration(source, 'debug', message, meta);
}

// ============================================
// Query Logs
// ============================================

/**
 * Get recent logs for a specific source
 * 
 * @param source - Integration source to filter by
 * @param limit - Maximum number of logs to return
 * @returns Array of log entries
 */
export async function getRecentLogs(source?: string, limit: number = 100): Promise<any[]> {
  if (!supabase) {
    console.warn('[Logger] Supabase not configured');
    return [];
  }

  try {
    let query = supabase
      .from('integration_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (source) {
      query = query.eq('source', source);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Logger] Failed to fetch logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Logger] Error fetching logs:', error);
    return [];
  }
}

// ============================================
// Export Logger Object
// ============================================

export const IntegrationLogger = {
  log: logIntegration,
  info: logInfo,
  warn: logWarn,
  error: logError,
  debug: logDebug,
  getRecent: getRecentLogs
};

