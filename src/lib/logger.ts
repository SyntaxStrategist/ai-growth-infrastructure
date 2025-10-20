/**
 * Centralized Logger Utility
 * 
 * Provides consistent logging across the application with timestamps and log levels.
 * Uses native console methods internally for optimal performance.
 */

// Log level enum for type safety
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// Logger configuration interface
interface LoggerConfig {
  includeTimestamp: boolean;
  includeLogLevel: boolean;
  timestampFormat: 'iso' | 'local';
}

// Default logger configuration
const defaultConfig: LoggerConfig = {
  includeTimestamp: true,
  includeLogLevel: true,
  timestampFormat: 'iso'
};

/**
 * Format timestamp based on configuration
 */
function formatTimestamp(config: LoggerConfig): string {
  if (!config.includeTimestamp) return '';
  
  const now = new Date();
  
  if (config.timestampFormat === 'iso') {
    return now.toISOString();
  } else {
    return now.toLocaleString();
  }
}

/**
 * Create log prefix with timestamp and log level
 */
function createLogPrefix(level: LogLevel, config: LoggerConfig = defaultConfig): string {
  const parts: string[] = [];
  
  if (config.includeTimestamp) {
    parts.push(`[${formatTimestamp(config)}]`);
  }
  
  if (config.includeLogLevel) {
    parts.push(`[${level}]`);
  }
  
  return parts.length > 0 ? `${parts.join(' ')} ` : '';
}

/**
 * Log info messages
 * @param message - The message to log
 * @param data - Optional additional data to log
 * @param config - Optional logger configuration override
 */
export function logInfo(message: string, data?: any, config?: Partial<LoggerConfig>): void {
  const mergedConfig = { ...defaultConfig, ...config };
  const prefix = createLogPrefix(LogLevel.INFO, mergedConfig);
  
  if (data !== undefined) {
    console.log(`${prefix}${message}`, data);
  } else {
    console.log(`${prefix}${message}`);
  }
}

/**
 * Log warning messages
 * @param message - The message to log
 * @param data - Optional additional data to log
 * @param config - Optional logger configuration override
 */
export function logWarn(message: string, data?: any, config?: Partial<LoggerConfig>): void {
  const mergedConfig = { ...defaultConfig, ...config };
  const prefix = createLogPrefix(LogLevel.WARN, mergedConfig);
  
  if (data !== undefined) {
    console.warn(`${prefix}${message}`, data);
  } else {
    console.warn(`${prefix}${message}`);
  }
}

/**
 * Log error messages
 * @param message - The message to log
 * @param data - Optional additional data to log
 * @param config - Optional logger configuration override
 */
export function logError(message: string, data?: any, config?: Partial<LoggerConfig>): void {
  const mergedConfig = { ...defaultConfig, ...config };
  const prefix = createLogPrefix(LogLevel.ERROR, mergedConfig);
  
  if (data !== undefined) {
    console.error(`${prefix}${message}`, data);
  } else {
    console.error(`${prefix}${message}`);
  }
}

/**
 * Create a scoped logger with a specific context prefix
 * @param context - The context to prefix all log messages with
 * @returns Object with scoped logging functions
 */
export function createScopedLogger(context: string) {
  return {
    info: (message: string, data?: any, config?: Partial<LoggerConfig>) => {
      logInfo(`[${context}] ${message}`, data, config);
    },
    warn: (message: string, data?: any, config?: Partial<LoggerConfig>) => {
      logWarn(`[${context}] ${message}`, data, config);
    },
    error: (message: string, data?: any, config?: Partial<LoggerConfig>) => {
      logError(`[${context}] ${message}`, data, config);
    }
  };
}

/**
 * Utility function to log API request/response cycles
 * @param method - HTTP method
 * @param url - Request URL
 * @param statusCode - Response status code
 * @param duration - Request duration in milliseconds
 * @param additionalData - Optional additional data to log
 */
export function logApiCall(
  method: string, 
  url: string, 
  statusCode: number, 
  duration?: number, 
  additionalData?: any
): void {
  const durationStr = duration ? ` (${duration}ms)` : '';
  const message = `${method} ${url} → ${statusCode}${durationStr}`;
  
  if (statusCode >= 400) {
    logError(message, additionalData);
  } else if (statusCode >= 300) {
    logWarn(message, additionalData);
  } else {
    logInfo(message, additionalData);
  }
}

/**
 * Utility function to log database operations
 * @param operation - Database operation (SELECT, INSERT, UPDATE, DELETE)
 * @param table - Table name
 * @param success - Whether the operation was successful
 * @param duration - Operation duration in milliseconds
 * @param additionalData - Optional additional data to log
 */
export function logDbOperation(
  operation: string,
  table: string,
  success: boolean,
  duration?: number,
  additionalData?: any
): void {
  const durationStr = duration ? ` (${duration}ms)` : '';
  const status = success ? 'SUCCESS' : 'FAILED';
  const message = `DB ${operation} ${table} → ${status}${durationStr}`;
  
  if (success) {
    logInfo(message, additionalData);
  } else {
    logError(message, additionalData);
  }
}

/**
 * Utility function to log performance metrics
 * @param metric - Metric name
 * @param value - Metric value
 * @param unit - Unit of measurement (ms, MB, count, etc.)
 * @param additionalData - Optional additional data to log
 */
export function logPerformance(
  metric: string,
  value: number,
  unit: string = '',
  additionalData?: any
): void {
  const unitStr = unit ? ` ${unit}` : '';
  const message = `PERF ${metric}: ${value}${unitStr}`;
  
  // Log as info for performance metrics
  logInfo(message, additionalData);
}

// Export default logger functions for convenience
export default {
  info: logInfo,
  warn: logWarn,
  error: logError,
  createScopedLogger,
  logApiCall,
  logDbOperation,
  logPerformance
};
