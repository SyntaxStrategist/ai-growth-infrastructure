/**
 * Timer Utility
 * 
 * Production-safe utility for measuring execution time of async operations.
 * Uses centralized logger for all output and never affects business logic.
 */

import { logInfo, logWarn, logError } from './logger';

// Store for manual timer tracking
const activeTimers = new Map<string, number>();

/**
 * Measure execution time of an async function
 * @param label - Descriptive label for the timer
 * @param fn - Async function to execute and time
 * @returns Promise that resolves to the result of fn
 */
export async function timeExecution<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    logInfo(`[⏱️ Timer Start] ${label}`);
    
    // Execute the function
    const result = await fn();
    
    const duration = Date.now() - startTime;
    logInfo(`[✅ Timer End] ${label} - Duration: ${duration}ms`);
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(`[❌ Timer Error] ${label} - Duration: ${duration}ms`, { error });
    
    // Re-throw the error to maintain original behavior
    throw error;
  }
}

/**
 * Start a manual timer
 * @param label - Unique label for the timer
 */
export function startTimer(label: string): void {
  try {
    if (activeTimers.has(label)) {
      logWarn(`[⏱️ Timer Warning] Timer "${label}" already exists, overwriting`);
    }
    
    activeTimers.set(label, Date.now());
    logInfo(`[⏱️ Timer Start] ${label}`);
    
  } catch (error) {
    logError(`[❌ Timer Error] Failed to start timer "${label}"`, { error });
  }
}

/**
 * End a manual timer and log the duration
 * @param label - Label of the timer to end
 * @returns Duration in milliseconds, or null if timer not found
 */
export function endTimer(label: string): number | null {
  try {
    const startTime = activeTimers.get(label);
    
    if (startTime === undefined) {
      logWarn(`[⏱️ Timer Warning] Timer "${label}" not found`);
      return null;
    }
    
    const duration = Date.now() - startTime;
    activeTimers.delete(label);
    
    logInfo(`[✅ Timer End] ${label} - Duration: ${duration}ms`);
    
    return duration;
    
  } catch (error) {
    logError(`[❌ Timer Error] Failed to end timer "${label}"`, { error });
    return null;
  }
}

/**
 * Get the current duration of an active timer without ending it
 * @param label - Label of the timer to check
 * @returns Duration in milliseconds, or null if timer not found
 */
export function getTimerDuration(label: string): number | null {
  try {
    const startTime = activeTimers.get(label);
    
    if (startTime === undefined) {
      return null;
    }
    
    return Date.now() - startTime;
    
  } catch (error) {
    logError(`[❌ Timer Error] Failed to get duration for timer "${label}"`, { error });
    return null;
  }
}

/**
 * Check if a timer is currently active
 * @param label - Label of the timer to check
 * @returns True if timer is active, false otherwise
 */
export function isTimerActive(label: string): boolean {
  return activeTimers.has(label);
}

/**
 * Get all active timer labels
 * @returns Array of active timer labels
 */
export function getActiveTimers(): string[] {
  return Array.from(activeTimers.keys());
}

/**
 * Clear all active timers (useful for cleanup)
 */
export function clearAllTimers(): void {
  try {
    const count = activeTimers.size;
    activeTimers.clear();
    
    if (count > 0) {
      logInfo(`[⏱️ Timer Cleanup] Cleared ${count} active timers`);
    }
    
  } catch (error) {
    logError(`[❌ Timer Error] Failed to clear timers`, { error });
  }
}

/**
 * Create a timer decorator for class methods
 * @param label - Label for the timer (can include method name)
 * @returns Decorator function
 */
export function timer(label?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const timerLabel = label || `${target.constructor.name}.${propertyName}`;
    
    descriptor.value = async function (...args: any[]) {
      return timeExecution(timerLabel, () => method.apply(this, args));
    };
    
    return descriptor;
  };
}

/**
 * Utility to measure sync operations
 * @param label - Descriptive label for the timer
 * @param fn - Sync function to execute and time
 * @returns Result of fn
 */
export function timeSyncExecution<T>(label: string, fn: () => T): T {
  const startTime = Date.now();
  
  try {
    logInfo(`[⏱️ Timer Start] ${label}`);
    
    // Execute the function
    const result = fn();
    
    const duration = Date.now() - startTime;
    logInfo(`[✅ Timer End] ${label} - Duration: ${duration}ms`);
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(`[❌ Timer Error] ${label} - Duration: ${duration}ms`, { error });
    
    // Re-throw the error to maintain original behavior
    throw error;
  }
}

/**
 * Create a performance measurement utility
 * @param label - Label for the performance measurement
 * @returns Object with start, end, and getDuration methods
 */
export function createPerformanceTimer(label: string) {
  let startTime: number | null = null;
  
  return {
    start: () => {
      startTime = Date.now();
      logInfo(`[⏱️ Performance Timer Start] ${label}`);
    },
    
    end: () => {
      if (startTime === null) {
        logWarn(`[⏱️ Performance Timer Warning] Timer "${label}" was not started`);
        return null;
      }
      
      const duration = Date.now() - startTime;
      logInfo(`[✅ Performance Timer End] ${label} - Duration: ${duration}ms`);
      startTime = null;
      
      return duration;
    },
    
    getDuration: () => {
      if (startTime === null) {
        return null;
      }
      
      return Date.now() - startTime;
    },
    
    isActive: () => startTime !== null
  };
}

// Export default function for convenience
export default timeExecution;
