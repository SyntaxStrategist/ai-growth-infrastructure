/**
 * Security utilities for API protection
 */

import { NextRequest } from 'next/server';

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
  // Simple validation - in production, use proper CSRF token validation
  return token.length === 64 && /^[a-f0-9]+$/.test(token);
}

// Request Size Limits
export const MAX_BODY_SIZE = 1024 * 1024; // 1MB

export function validateRequestSize(req: NextRequest): boolean {
  const contentLength = req.headers.get('content-length');
  if (!contentLength) return true; // No size limit for requests without content-length
  
  const size = parseInt(contentLength, 10);
  return size <= MAX_BODY_SIZE;
}

// Brute Force Protection
export const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const remoteAddr = req.headers.get('x-remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || remoteAddr || 'unknown';
}

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

export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
  } else {
    attempts.count += 1;
    attempts.lastAttempt = now;
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
