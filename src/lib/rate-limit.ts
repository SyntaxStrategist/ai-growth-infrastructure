/**
 * Rate Limiting Middleware
 * 
 * Provides simple in-memory rate limiting to prevent API abuse.
 * For production with multiple instances, consider Redis-based rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval: remove expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   * @default 100
   */
  max?: number;
  
  /**
   * Time window in milliseconds
   * @default 15 * 60 * 1000 (15 minutes)
   */
  windowMs?: number;
  
  /**
   * Key generator function to identify unique clients
   * @default Uses IP address + API key (if present)
   */
  keyGenerator?: (req: NextRequest) => string;
  
  /**
   * Message to return when rate limit is exceeded
   */
  message?: string;
}

/**
 * Get client identifier for rate limiting
 */
function getDefaultKey(req: NextRequest): string {
  // Try to get API key first (for authenticated requests)
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    return `api:${apiKey}`;
  }
  
  // Fall back to IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown';
  
  return `ip:${ip}`;
}

/**
 * Rate limit middleware
 * 
 * @example
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   const rateLimitResult = await rateLimit(req, {
 *     max: 100,
 *     windowMs: 15 * 60 * 1000, // 15 minutes
 *   });
 *   
 *   if (!rateLimitResult.allowed) {
 *     return rateLimitResult.response;
 *   }
 *   
 *   // Continue with normal request handling
 * }
 * ```
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = {}
): Promise<{ allowed: boolean; response?: NextResponse; remaining?: number }> {
  const {
    max = 100,
    windowMs = 15 * 60 * 1000, // 15 minutes
    keyGenerator = getDefaultKey,
    message = 'Too many requests, please try again later.',
  } = config;
  
  const key = keyGenerator(req);
  const now = Date.now();
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }
  
  // Increment request count
  entry.count++;
  
  // Check if limit exceeded
  if (entry.count > max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    
    console.log(`[RateLimit] ❌ Rate limit exceeded for ${key}: ${entry.count}/${max} requests`);
    
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: message,
          retryAfter,
          limit: max,
          windowMs,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
          },
        }
      ),
    };
  }
  
  const remaining = max - entry.count;
  
  console.log(`[RateLimit] ✅ Request allowed for ${key}: ${entry.count}/${max} requests (${remaining} remaining)`);
  
  return {
    allowed: true,
    remaining,
  };
}

/**
 * Strict rate limit for expensive operations (e.g., AI calls, bulk operations)
 */
export async function strictRateLimit(req: NextRequest): Promise<{ allowed: boolean; response?: NextResponse }> {
  return rateLimit(req, {
    max: 20, // 20 requests per 15 minutes
    windowMs: 15 * 60 * 1000,
    message: 'Rate limit exceeded for this operation. This endpoint has stricter limits to protect system resources.',
  });
}

/**
 * Get current rate limit status for a request (without incrementing)
 */
export function getRateLimitStatus(req: NextRequest, config: RateLimitConfig = {}): {
  count: number;
  limit: number;
  remaining: number;
  resetTime: number;
} {
  const { max = 100, keyGenerator = getDefaultKey } = config;
  const key = keyGenerator(req);
  const entry = rateLimitStore.get(key);
  
  if (!entry) {
    return {
      count: 0,
      limit: max,
      remaining: max,
      resetTime: Date.now() + (config.windowMs || 15 * 60 * 1000),
    };
  }
  
  return {
    count: entry.count,
    limit: max,
    remaining: Math.max(0, max - entry.count),
    resetTime: entry.resetTime,
  };
}

