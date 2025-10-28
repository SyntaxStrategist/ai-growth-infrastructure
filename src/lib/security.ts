/**
 * Security utilities for API protection
 */

import { NextRequest } from 'next/server';
import { logAuthFailure, logCSRFViolation, logRateLimitExceeded } from './security-monitoring';

// CSRF Protection
const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production';

export function generateCSRFToken(): string {
  // Use Web Crypto API for Edge Runtime compatibility
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function validateCSRFToken(token: string): boolean {
  if (!token) return false;
  // Enhanced validation with proper format checking
  return token.length === 64 && /^[a-f0-9]+$/.test(token);
}

// CSRF Middleware for API routes
export function validateCSRFProtection(req: NextRequest): { valid: boolean; error?: string } {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return { valid: true };
  }
  
  // Skip CSRF for API key authenticated requests (external API calls)
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    return { valid: true };
  }
  
  // Check for CSRF token in headers
  const csrfToken = req.headers.get('x-csrf-token');
  if (!csrfToken) {
    logCSRFViolation(req, { reason: 'missing_token', method: req.method });
    return { valid: false, error: 'CSRF token missing' };
  }
  
  if (!validateCSRFToken(csrfToken)) {
    logCSRFViolation(req, { reason: 'invalid_token', method: req.method, tokenLength: csrfToken.length });
    return { valid: false, error: 'Invalid CSRF token' };
  }
  
  return { valid: true };
}

// Request Size Limits
export const MAX_BODY_SIZE = 1024 * 1024; // 1MB

export function validateRequestSize(req: NextRequest): boolean {
  const contentLength = req.headers.get('content-length');
  if (!contentLength) return true; // No size limit for requests without content-length
  
  const size = parseInt(contentLength, 10);
  return size <= MAX_BODY_SIZE;
}

// Rate Limiting
export const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}

export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig,
  req?: NextRequest
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / config.windowMs)}`;
  
  const current = rateLimitStore.get(key);
  
  if (!current) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
  }
  
  if (current.count >= config.maxRequests) {
    // Log rate limit exceeded
    if (req) {
      logRateLimitExceeded(req, {
        identifier,
        count: current.count,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        endpoint: req.nextUrl.pathname
      });
    }
    
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: current.resetTime 
    };
  }
  
  current.count += 1;
  return { 
    allowed: true, 
    remaining: config.maxRequests - current.count, 
    resetTime: current.resetTime 
  };
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const remoteAddr = req.headers.get('x-remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || remoteAddr || 'unknown';
}

// Brute Force Protection
export const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

export function checkBruteForceProtection(ip: string): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }
  
  // Reset if window has passed
  if (now - attempts.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.delete(ip);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }
  
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - attempts.count);
  return { allowed: attempts.count < MAX_ATTEMPTS, remainingAttempts };
}

export function recordFailedAttempt(ip: string, req?: NextRequest): void {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
  } else {
    attempts.count += 1;
    attempts.lastAttempt = now;
  }
  
  // Log security event
  if (req) {
    logAuthFailure(req, { 
      ip, 
      attemptCount: attempts?.count || 1,
      endpoint: req.nextUrl.pathname 
    });
  }
}

export function recordSuccessfulAttempt(ip: string): void {
  loginAttempts.delete(ip);
}

// Security middleware helper
export function createSecurityResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
